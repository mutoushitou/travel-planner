export type OrderType = "flight" | "hotel" | "ticket";

export type OrderStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Order {
  id: string;
  user_id: string;
  trip_id: string;
  order_type: OrderType;
  status: OrderStatus;
  total_price: number | null;
  paid_at: string | null;
  detail: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FlightDetail {
  flight_number: string;
  airline: string;
  departure_city: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
}

export interface HotelDetail {
  hotel_name: string;
  star_rating: number;
  check_in: string;
  check_out: string;
  room_type: string;
}

export interface TicketDetail {
  attraction_name: string;
  attraction_id: string;
  quantity: number;
  visit_date: string;
  ticket_type: string;
}
