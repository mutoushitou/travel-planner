import { createClient } from "@/lib/supabase/client";
import type { City, Attraction } from "@/types/attraction";

export async function getCities(): Promise<City[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .order("name");
  if (error) return [];
  return data;
}

export interface AttractionsQuery {
  cityId?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getAttractions(query: AttractionsQuery = {}): Promise<{
  data: Attraction[];
  total: number;
}> {
  const supabase = createClient();
  const { cityId, category, search, page = 1, limit = 12 } = query;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let builder = supabase
    .from("attractions")
    .select("*, city:cities(name, province)", { count: "exact" });

  if (cityId) {
    builder = builder.eq("city_id", cityId);
  }
  if (category) {
    builder = builder.eq("category", category);
  }
  if (search) {
    builder = builder.or(
      `name.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { data, error, count } = await builder
    .order("rating_avg", { ascending: false })
    .range(from, to);

  if (error) return { data: [], total: 0 };
  return { data: data as unknown as Attraction[], total: count ?? 0 };
}

export async function getAttractionById(
  id: string
): Promise<Attraction | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attractions")
    .select("*, city:cities(name, province)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as Attraction;
}

export async function getAttractionsByCity(
  cityId: string,
  limit = 20
): Promise<Attraction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attractions")
    .select("*, city:cities(name, province)")
    .eq("city_id", cityId)
    .order("rating_avg", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data as unknown as Attraction[];
}
