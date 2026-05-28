export interface Review {
  id: string;
  user_id: string;
  attraction_id: string;
  trip_id: string | null;
  rating: number;
  content: string | null;
  created_at: string;
}

export interface CreateReviewInput {
  attraction_id: string;
  trip_id?: string;
  rating: number;
  content?: string;
}
