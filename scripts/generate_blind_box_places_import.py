from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import quote

import pandas as pd


SOURCE = Path("/Users/wind/Downloads/出行盲盒地点库 (1).xlsx")
OUTPUT = Path("/Users/wind/Documents/lazy2move/database/migrations/017_import_blind_box_places_from_xlsx.sql")

CITY_META = {
    "北京": ("beijing", "北京"),
    "上海": ("shanghai", "上海"),
    "广州": ("guangzhou", "广东"),
    "深圳": ("shenzhen", "广东"),
}

ACCENT_COLORS = {
    "放松": "#28B8A0",
    "探索": "#7357FF",
    "热闹": "#F6B73C",
}


def sql_string(value: object) -> str:
    if value is None or pd.isna(value):
        return "NULL"
    text = str(value)
    return "'" + text.replace("\\", "\\\\").replace("'", "\\'") + "'"


def parse_party_size(label: str) -> tuple[int, int]:
    parts = [part.strip() for part in label.split(",") if part.strip()]
    sizes: list[int] = []
    for part in parts:
        if part.startswith("1"):
            sizes.append(1)
        elif "双" in part:
            sizes.append(2)
        elif "多" in part:
            sizes.append(6)

    if not sizes:
        return 1, 6

    min_size = 1 if 1 in sizes else (2 if 2 in sizes else 3)
    max_size = 6 if 6 in sizes else max(sizes)
    return min_size, max_size


def parse_budget_yuan(label: str) -> int:
    if label == "0-50":
        return 50
    if label == "50-100":
        return 100
    if label == "100以上":
        return 200
    return 100


def parse_moods(label: str) -> list[str]:
    return [part.strip() for part in label.split(",") if part.strip()]


def infer_category(title: str, moods: list[str]) -> str:
    culture_keywords = [
        "博物馆",
        "美术馆",
        "艺术",
        "剧院",
        "天文馆",
        "科学技术馆",
        "孔庙",
        "国子监",
        "鲁迅",
        "教堂",
        "陈家祠",
        "故宫",
        "博物院",
        "寺",
        "园林",
    ]
    food_walk_keywords = ["胡同", "街", "巷", "坊", "太古里", "商城", "万象", "三里屯", "欢乐港湾"]
    surprise_keywords = ["欢乐谷", "长城", "鼓楼", "钟楼", "天安门"]

    if any(keyword in title for keyword in culture_keywords):
        return "文艺"
    if any(keyword in title for keyword in surprise_keywords) or "热闹" in moods:
        return "惊喜"
    if any(keyword in title for keyword in food_walk_keywords):
        return "美食"
    return "探索"


def infer_environment(title: str) -> str:
    indoor_keywords = ["博物馆", "博物院", "美术馆", "剧院", "天文馆", "科学技术馆", "大剧院", "UCCA"]
    outdoor_keywords = ["公园", "森林", "植物", "湿地", "长城", "山", "湖", "河", "街", "巷", "胡同", "广场"]

    if any(keyword in title for keyword in indoor_keywords):
        return "indoor"
    if any(keyword in title for keyword in outdoor_keywords):
        return "outdoor"
    return "either"


def json_text(value: object) -> str:
    return json.dumps(value, ensure_ascii=False)


def build_rows() -> list[dict[str, object]]:
    frame = pd.read_excel(SOURCE, sheet_name="地点池")
    rows: list[dict[str, object]] = []

    for _, item in frame.iterrows():
        city = str(item["城市"]).strip()
        title = str(item["地点名称"]).strip()
        party_label = str(item["适合人数"]).strip()
        budget_label = str(item["人均预算"]).strip()
        moods = parse_moods(str(item["心情标签"]).strip())
        mood = moods[0] if moods else "探索"
        latitude = float(item["纬度"])
        longitude = float(item["经度"])
        image_name = None if pd.isna(item["地点图片"]) else str(item["地点图片"]).strip()

        city_code, province = CITY_META[city]
        min_party_size, max_party_size = parse_party_size(party_label)
        mood_text = "、".join(moods)

        display_name = title if title.startswith(city) else f"{city}{title}"
        summary = f"{display_name}：适合{party_label}，预算{budget_label}，心情标签：{mood_text}。"
        description = (
            f"来自《{SOURCE.name}》的地点：{city} · {title}。\n"
            f"适合人数：{party_label}；人均预算：{budget_label}。\n"
            f"心情标签：{', '.join(moods)}。\n"
            f"坐标：{latitude:.6f}, {longitude:.6f}。"
        )
        if image_name:
            description += f"\n地点图片文件名：{image_name}。"

        steps = [
            f"打开地图搜索“{city} {title}”",
            "按当天开放时间、排队情况或天气调整停留节奏",
            f"围绕心情标签选择玩法：{mood_text}",
        ]
        tips = [
            f"适合人数：{party_label}",
            f"心情标签：{', '.join(moods)}",
            f"原始图片文件名：{image_name if image_name else '未配置'}",
            f"坐标：{latitude:.6f}, {longitude:.6f}",
        ]

        rows.append(
            {
                "city_name": city,
                "city_code": city_code,
                "province": province,
                "title": title,
                "party_label": party_label,
                "budget_label": budget_label,
                "mood": mood,
                "mood_tags_json": json_text(moods),
                "category": infer_category(title, moods),
                "environment": infer_environment(title),
                "min_party_size": min_party_size,
                "max_party_size": max_party_size,
                "budget_yuan": parse_budget_yuan(budget_label),
                "latitude": latitude,
                "longitude": longitude,
                "summary": summary,
                "description": description,
                "district": city,
                "address": f"{city} · {title}",
                "navigation_url": "https://uri.amap.com/search?keyword=" + quote(f"{city} {title}"),
                "steps_json": json_text(steps),
                "tips_json": json_text(tips),
                "accent_color": ACCENT_COLORS.get(mood, "#7357FF"),
            }
        )

    return rows


def build_values(rows: list[dict[str, object]]) -> str:
    value_rows: list[str] = []
    for row in rows:
        value_rows.append(
            "  ("
            + ", ".join(
                [
                    sql_string(row["city_name"]),
                    sql_string(row["city_code"]),
                    sql_string(row["province"]),
                    sql_string(row["title"]),
                    sql_string(row["party_label"]),
                    sql_string(row["budget_label"]),
                    sql_string(row["mood"]),
                    sql_string(row["mood_tags_json"]),
                    sql_string(row["category"]),
                    sql_string(row["environment"]),
                    str(row["min_party_size"]),
                    str(row["max_party_size"]),
                    str(row["budget_yuan"]),
                    f"{row['latitude']:.7f}",
                    f"{row['longitude']:.7f}",
                    sql_string(row["summary"]),
                    sql_string(row["description"]),
                    sql_string(row["district"]),
                    sql_string(row["address"]),
                    sql_string(row["navigation_url"]),
                    sql_string(row["steps_json"]),
                    sql_string(row["tips_json"]),
                    sql_string(row["accent_color"]),
                ]
            )
            + ")"
        )
    return ",\n".join(value_rows)


def sql_json(value: object) -> str:
    return f"CAST({sql_string(value)} AS JSON)"


def build_row_import_sql(row: dict[str, object]) -> str:
    city_name = sql_string(row["city_name"])
    title = sql_string(row["title"])
    mood_tags = sql_json(row["mood_tags_json"])
    steps = sql_json(row["steps_json"])
    tips = sql_json(row["tips_json"])

    update_sql = f"""UPDATE activities a
INNER JOIN cities c ON c.id = a.city_id
SET
  a.mood = {sql_string(row["mood"])},
  a.mood_tags = {mood_tags},
  a.min_party_size = {row["min_party_size"]},
  a.max_party_size = {row["max_party_size"]},
  a.budget_yuan = {row["budget_yuan"]},
  a.latitude = {row["latitude"]:.7f},
  a.longitude = {row["longitude"]:.7f},
  a.updated_at = CURRENT_TIMESTAMP
WHERE c.name = {city_name}
  AND a.title = {title};"""

    insert_sql = f"""INSERT INTO activities (
  city_id, title, summary, description, category, mood, mood_tags, environment,
  min_party_size, max_party_size, duration_minutes, budget_yuan, city_distance_km,
  district, address, latitude, longitude, navigation_url, cover_image, steps, tips,
  accent_color, is_active
)
SELECT
  c.id,
  {title},
  {sql_string(row["summary"])},
  {sql_string(row["description"])},
  {sql_string(row["category"])},
  {sql_string(row["mood"])},
  {mood_tags},
  {sql_string(row["environment"])},
  {row["min_party_size"]},
  {row["max_party_size"]},
  180,
  {row["budget_yuan"]},
  0,
  {sql_string(row["district"])},
  {sql_string(row["address"])},
  {row["latitude"]:.7f},
  {row["longitude"]:.7f},
  {sql_string(row["navigation_url"])},
  NULL,
  {steps},
  {tips},
  {sql_string(row["accent_color"])},
  TRUE
FROM cities c
WHERE c.name = {city_name}
  AND NOT EXISTS (
    SELECT 1
    FROM activities a
    WHERE a.city_id = c.id
      AND a.title = {title}
  );"""

    return f"{update_sql}\n\n{insert_sql}"


def build_imported_rows_table(rows: list[dict[str, object]]) -> str:
    return "\nUNION ALL\n".join(
        f"SELECT {sql_string(row['city_name'])} AS city_name, {sql_string(row['title'])} AS title"
        for row in rows
    )


def build_sql(rows: list[dict[str, object]]) -> str:
    row_imports = "\n\n".join(build_row_import_sql(row) for row in rows)
    imported_rows_table = build_imported_rows_table(rows)

    return f"""START TRANSACTION;

INSERT INTO cities (name, code, province, is_active)
VALUES
  ('北京', 'beijing', '北京', TRUE),
  ('上海', 'shanghai', '上海', TRUE),
  ('广州', 'guangzhou', '广东', TRUE),
  ('深圳', 'shenzhen', '广东', TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  province = VALUES(province),
  is_active = VALUES(is_active);

{row_imports}

COMMIT;

SELECT COUNT(*) AS imported_rows_after
FROM (
{imported_rows_table}
) t
INNER JOIN cities c ON c.name = t.city_name
INNER JOIN activities a ON a.city_id = c.id AND a.title = t.title;

SELECT t.city_name AS city, COUNT(*) AS imported_city_rows
FROM (
{imported_rows_table}
) t
INNER JOIN cities c ON c.name = t.city_name
INNER JOIN activities a ON a.city_id = c.id AND a.title = t.title
GROUP BY t.city_name
ORDER BY t.city_name;
"""


def main() -> None:
    rows = build_rows()
    OUTPUT.write_text(build_sql(rows), encoding="utf-8")
    print(f"Wrote {len(rows)} rows to {OUTPUT}")


if __name__ == "__main__":
    main()
