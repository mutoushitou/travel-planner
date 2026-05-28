import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/types/order";

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data as unknown as Order[];
}

export async function cancelOrder(orderId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId);
  return !error;
}
