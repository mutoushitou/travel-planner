export interface City {
  id: string;
  name: string;
  province: string;
  slug: string;
  created_at: string;
}

export interface Attraction {
  id: string;
  name: string;
  city_id: string;
  category: AttractionCategory;
  description: string | null;
  ticket_price: number | null;
  opening_hours: string | null;
  suggested_duration: string | null;
  image_url: string | null;
  rating_avg: number;
  created_at: string;
  city?: City;
}

export type AttractionCategory =
  | "nature"
  | "culture"
  | "food"
  | "shopping"
  | "theme-park"
  | "museum"
  | "other";

export const ATTRACTION_CATEGORY_LABELS: Record<AttractionCategory, string> = {
  nature: "自然风光",
  culture: "历史文化",
  food: "美食街区",
  shopping: "购物",
  "theme-park": "主题乐园",
  museum: "博物馆",
  other: "其他",
};
