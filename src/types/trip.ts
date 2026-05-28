export type BudgetLevel = "economy" | "comfort" | "luxury";

export type TripStatus =
  | "draft"
  | "generating"
  | "generated"
  | "booked"
  | "completed";

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  city_ids: string[];
  start_date: string;
  end_date: string;
  adults: number;
  children: number;
  budget_level: BudgetLevel;
  preferences: string[];
  accommodation: string | null;
  transport: string[];
  special_requirements: string | null;
  status: TripStatus;
  budget_summary: Record<string, unknown> | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  attractions?: DayAttraction[];
  meals?: DayMeal[];
  transport?: DayTransport[];
  hotels?: DayHotel[];
}

export interface DayAttraction {
  id: string;
  day_id: string;
  attraction_id: string;
  order_index: number;
  duration: string | null;
  notes: string | null;
}

export interface DayMeal {
  id: string;
  day_id: string;
  meal_type: "breakfast" | "lunch" | "dinner";
  restaurant_name: string;
  cuisine: string | null;
  price: number | null;
  notes: string | null;
}

export interface DayTransport {
  id: string;
  day_id: string;
  transport_type: string;
  from_location: string | null;
  to_location: string | null;
  detail: string | null;
}

export interface DayHotel {
  id: string;
  day_id: string;
  hotel_name: string;
  star_rating: number | null;
  price_range: string | null;
  notes: string | null;
}

export interface TripVersion {
  id: string;
  trip_id: string;
  version_number: number;
  full_content: Record<string, unknown>;
  created_at: string;
}

export interface TripFormData {
  destination: string;
  city_ids: string[];
  departure_city: string;
  start_date: string;
  end_date: string;
  adults: number;
  children: number;
  budget_level: BudgetLevel;
  preferences: string[];
  accommodation: string;
  transport: string[];
  special_requirements: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
