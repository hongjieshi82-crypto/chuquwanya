export function buildRecommendReasonPrompt(input: {
  userPreferences: string[];
  tripType?: string;
  budget?: number;
  days?: number;
  attractionName: string;
  attractionTags: string[];
  rating: number;
  matchReasons: string[];
}): string {
  return `你是一名专业旅游顾问，请根据以下信息为用户生成简洁、自然的推荐理由，不超过 50 字：

用户偏好：${input.userPreferences.join("、")}
出行类型：${input.tripType ?? "不限"}
预算范围：${input.budget ?? "不限"}元
出行天数：${input.days ?? "不限"}天
景点名称：${input.attractionName}
景点标签：${input.attractionTags.join("、")}
景点评分：${input.rating}
推荐依据：${input.matchReasons.join("；")}

请生成推荐理由：`;
}

export function buildTripGenerationPrompt(input: {
  destination: string;
  days: number;
  travelers: number;
  budget: number;
  preferences: string[];
  tripType?: string;
  attractionList: Array<{ name: string; tags: string[]; price: string }>;
}): string {
  const attractions = input.attractionList
    .map((a) => `- ${a.name}（标签：${a.tags.join("、")}，门票：${a.price}）`)
    .join("\n");

  return `你是一名专业旅游规划师。请根据以下条件为用户生成详细、合理的旅行行程计划，包括每天的景点安排、交通建议、餐饮建议和注意事项。

目的地：${input.destination}
出行天数：${input.days}
出行人数：${input.travelers}
预算范围：${input.budget}元
出行偏好：${input.preferences.join("、")}
出行类型：${input.tripType ?? "不限"}
推荐景点参考列表：
${attractions}

要求：
1. 行程按天分组，每天 3 ~ 5 个景点
2. 考虑景点之间的地理距离，合理安排顺序
3. 每个景点标注建议游玩时长和门票参考价格
4. 包含餐饮建议，优先推荐当地特色美食
5. 最后给出总费用估算和出行小贴士
6. 仅输出 JSON，不要 markdown 代码块

输出 JSON 格式：
{
  "tripTitle": "",
  "summary": "",
  "days": [
    {
      "day": 1,
      "theme": "",
      "items": [
        {
          "type": "attraction|meal|transport",
          "name": "",
          "duration": "",
          "price": "",
          "tips": ""
        }
      ]
    }
  ],
  "totalBudgetEstimate": "",
  "travelTips": []
}`;
}
