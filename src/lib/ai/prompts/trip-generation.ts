export function buildTripGenerationSystemPrompt(): string {
  return `你是一个专业的旅游规划师。根据用户提供的出行需求，生成一份详细的每日行程方案。

请严格按照以下 JSON 格式输出，不要包含任何额外的文字说明：

{
  "title": "行程标题",
  "overview": "行程概览（2-3句话）",
  "days": [
    {
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "theme": "当日主题",
      "attractions": [
        {
          "name": "景点名称",
          "order_index": 1,
          "duration": "2小时",
          "notes": "推荐理由和实用贴士"
        }
      ],
      "meals": [
        {
          "meal_type": "breakfast|lunch|dinner",
          "restaurant_name": "餐厅名称",
          "cuisine": "菜系类型",
          "price": 人均价格数字,
          "notes": "推荐菜品和特色"
        }
      ],
      "transport": [
        {
          "transport_type": "flight|train|car|bus|subway|taxi|walk",
          "from_location": "出发地",
          "to_location": "目的地",
          "detail": "具体交通说明"
        }
      ],
      "hotels": [
        {
          "hotel_name": "酒店名称",
          "star_rating": 星级数字,
          "price_range": "价格区间",
          "notes": "推荐理由"
        }
      ]
    }
  ],
  "budget_summary": {
    "transport": 交通预算,
    "accommodation": 住宿预算,
    "meals": 餐饮预算,
    "tickets": 门票预算,
    "total": 总预算
  }
}

注意事项：
- 每天安排 2-4 个景点，合理安排路线避免奔波
- 餐饮推荐结合当地特色
- 交通方式考虑城市间和市内衔接
- 酒店推荐结合预算等级
- 所有价格以人民币（元）为单位`;
}

export function buildTripGenerationUserPrompt(input: {
  destination: string;
  departure_city: string;
  start_date: string;
  end_date: string;
  adults: number;
  children: number;
  budget_level: string;
  preferences: string[];
  accommodation: string;
  special_requirements: string;
  attractions: Array<{ name: string; category: string; description: string }>;
}): string {
  const days =
    Math.ceil(
      (new Date(input.end_date).getTime() -
        new Date(input.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  return `请为以下出行需求生成旅游行程：

出发城市：${input.departure_city}
目的地：${input.destination}
出行日期：${input.start_date} 至 ${input.end_date}（共${days}天）
人数：${input.adults}位成人${input.children > 0 ? `，${input.children}位儿童` : ""}
预算等级：${input.budget_level === "economy" ? "经济实惠" : input.budget_level === "luxury" ? "豪华体验" : "舒适标准"}
兴趣偏好：${input.preferences.length > 0 ? input.preferences.join("、") : "无特殊偏好"}
住宿偏好：${input.accommodation || "无特殊要求"}
特殊需求：${input.special_requirements || "无"}

以下是目的地可参考的景点列表：
${input.attractions.map((a, i) => `${i + 1}. ${a.name}（${a.category}）- ${a.description || ""}`).join("\n")}

请生成一份完整详细的${days}天行程方案。`;
}
