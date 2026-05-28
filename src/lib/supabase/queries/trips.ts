import { createClient } from "@/lib/supabase/client";
import type { Trip, TripDay, TripVersion } from "@/types/trip";

export async function getTripsByUser(userId: string): Promise<Trip[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as unknown as Trip[];
}

export async function getTripById(tripId: string): Promise<Trip | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .eq("is_deleted", false)
    .single();
  if (error) return null;
  return data as unknown as Trip;
}

export async function getTripDays(tripId: string): Promise<TripDay[]> {
  const supabase = createClient();
  const { data: days, error } = await supabase
    .from("trip_days")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_number");

  if (error || !days) return [];

  const result: TripDay[] = [];

  for (const day of days) {
    const [attractionsRes, mealsRes, transportRes, hotelsRes] =
      await Promise.all([
        supabase
          .from("day_attractions")
          .select("*")
          .eq("day_id", day.id)
          .order("order_index"),
        supabase.from("day_meals").select("*").eq("day_id", day.id),
        supabase.from("day_transport").select("*").eq("day_id", day.id),
        supabase.from("day_hotels").select("*").eq("day_id", day.id),
      ]);

    result.push({
      ...day,
      attractions: (attractionsRes.data ?? []) as TripDay["attractions"],
      meals: (mealsRes.data ?? []) as TripDay["meals"],
      transport: (transportRes.data ?? []) as TripDay["transport"],
      hotels: (hotelsRes.data ?? []) as TripDay["hotels"],
    } as TripDay);
  }

  return result;
}

export async function deleteTrip(tripId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("trips")
    .update({ is_deleted: true })
    .eq("id", tripId);
  return !error;
}

export async function getTripVersions(tripId: string): Promise<TripVersion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trip_versions")
    .select("*")
    .eq("trip_id", tripId)
    .order("version_number", { ascending: false });
  if (error) return [];
  return data as unknown as TripVersion[];
}

export async function restoreTripVersion(
  tripId: string,
  versionNumber: number
): Promise<boolean> {
  const supabase = createClient();
  const { data: version } = await supabase
    .from("trip_versions")
    .select("*")
    .eq("trip_id", tripId)
    .eq("version_number", versionNumber)
    .single();

  if (!version) return false;

  // Create a new version pointing to the restored content
  const { data: maxVersion } = await supabase
    .from("trip_versions")
    .select("version_number")
    .eq("trip_id", tripId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  const newVersion = (maxVersion?.version_number ?? 0) + 1;
  const { error } = await supabase.from("trip_versions").insert({
    trip_id: tripId,
    version_number: newVersion,
    full_content: version.full_content,
  });
  return !error;
}
