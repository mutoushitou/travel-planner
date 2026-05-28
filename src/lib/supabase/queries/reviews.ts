import { createClient } from "@/lib/supabase/client";
import type { Review } from "@/types/review";

export async function getReviewsByAttraction(
  attractionId: string,
  page = 1,
  limit = 10
): Promise<{ data: Review[]; total: number }> {
  const supabase = createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .eq("attraction_id", attractionId)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) return { data: [], total: 0 };
  return { data: data as unknown as Review[], total: count ?? 0 };
}

export async function getReviewsByUser(userId: string): Promise<Review[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data as unknown as Review[];
}
