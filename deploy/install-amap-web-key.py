"""Install a new Amap Web Service key from stdin on the production ECS."""

import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
from urllib.parse import urlencode
from urllib.request import urlopen

PROJECT = Path('/opt/chuquwanya')
ENV_FILE = PROJECT / 'deploy/production.env'
BACKUP = Path('/opt/chuquwanya-backups/production.env.pre-amap-key')
COMPOSE = PROJECT / 'compose.ecs.yml'


def restart_api():
    subprocess.run(
        ['docker', 'compose', '--env-file', str(ENV_FILE), '-f', str(COMPOSE), 'up', '-d', '--force-recreate', 'api'],
        cwd=PROJECT, check=True,
    )
    for _ in range(30):
        try:
            with urlopen('http://127.0.0.1:3001/api/v1/health', timeout=2) as response:
                if json.load(response).get('ok'):
                    return
        except Exception:
            time.sleep(2)
    raise RuntimeError('API 健康检查超时')


def main():
    key = sys.stdin.readline().strip()
    if not key or len(key) > 128 or any(character.isspace() for character in key):
        raise SystemExit('Key 格式不正确，未修改服务器配置。')
    query = urlencode({'key': key, 'location': '116.4,39.9', 'output': 'JSON'})
    try:
        with urlopen(f'https://restapi.amap.com/v3/geocode/regeo?{query}', timeout=10) as response:
            result = json.load(response)
    except Exception as error:
        raise SystemExit(f'高德连接失败，未修改服务器配置：{type(error).__name__}')
    if result.get('status') != '1':
        raise SystemExit(f'新 Key 验证失败，未修改服务器配置：{result.get("info", "未知错误")}')

    if not ENV_FILE.is_file():
        raise SystemExit('找不到 ECS 正式配置文件，未修改服务器配置。')
    lines = ENV_FILE.read_text().splitlines()
    if not any(line.startswith('AMAP_WEB_SERVICE_KEY=') for line in lines):
        raise SystemExit('正式配置中缺少 AMAP_WEB_SERVICE_KEY，未修改服务器配置。')
    shutil.copy2(ENV_FILE, BACKUP)
    os.chmod(BACKUP, 0o600)
    updated = '\n'.join(
        f'AMAP_WEB_SERVICE_KEY={key}' if line.startswith('AMAP_WEB_SERVICE_KEY=') else line
        for line in lines
    ) + '\n'
    with tempfile.NamedTemporaryFile('w', dir=ENV_FILE.parent, delete=False) as temporary:
        temporary.write(updated)
        temporary_path = Path(temporary.name)
    os.chmod(temporary_path, 0o600)
    os.replace(temporary_path, ENV_FILE)
    try:
        restart_api()
    except (subprocess.CalledProcessError, RuntimeError):
        shutil.copy2(BACKUP, ENV_FILE)
        os.chmod(ENV_FILE, 0o600)
        restart_api()
        raise SystemExit('API 重启失败，已恢复旧配置。')
    print('新高德 Web 服务 Key 已验证并安装，API 已重启。')


if __name__ == '__main__':
    main()
