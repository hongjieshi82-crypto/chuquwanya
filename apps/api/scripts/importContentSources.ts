import { readFile } from 'node:fs/promises';

import mysql from 'mysql2/promise';

import { config } from '../src/config.js';
import { normalizeContentSource } from '../src/content-source-import.js';

const fileIndex = process.argv.indexOf('--file');
const file = fileIndex >= 0 ? process.argv[fileIndex + 1] : null;
if (!file) throw new Error('请使用 --file 指定 JSON 文件');

const parsed = JSON.parse(await readFile(file, 'utf8')) as unknown;
if (!Array.isArray(parsed)) throw new Error('来源文件必须是 JSON 数组');
const sources = parsed.map(normalizeContentSource).filter((item) => item !== null);
const connection = await mysql.createConnection(config.database);

try {
  let imported = 0;
  for (const source of sources) {
    await connection.execute(
      `INSERT INTO content_sources
        (platform, source_url, source_title, author_name, usage_role, rights_note, extracted_signals)
       VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE
         source_title = VALUES(source_title), author_name = VALUES(author_name),
         usage_role = VALUES(usage_role), rights_note = VALUES(rights_note),
         extracted_signals = VALUES(extracted_signals), captured_at = CURRENT_TIMESTAMP`,
      [source.platform, source.url ?? null, source.title ?? null, source.author ?? null, source.usageRole ?? 'inspiration', source.rightsNote ?? null, JSON.stringify(source.signals ?? [])],
    );
    imported += 1;
  }
  console.log(`内容来源导入完成：${imported}/${parsed.length} 条`);
} finally {
  await connection.end();
}
