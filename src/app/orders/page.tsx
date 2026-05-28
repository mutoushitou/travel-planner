"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getOrdersByUser, cancelOrder } from "@/lib/supabase/queries/orders";
import type { Order } from "@/types/order";

const STATUS_LABELS: Record<string, string> = {
  pending: "待处理",
  confirmed: "已确认",
  cancelled: "已取消",
  completed: "已完成",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  cancelled: "bg-slate-100 text-slate-500",
  completed: "bg-green-100 text-green-700",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  flight: "机票",
  hotel: "酒店",
  ticket: "门票",
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async (userId: string) => {
    const data = await getOrdersByUser(userId);
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) loadOrders(user.id);
  }, [user, authLoading, router]);

  const handleCancel = async (orderId: string) => {
    const success = await cancelOrder(orderId);
    if (success && user) loadOrders(user.id);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-slate-500">加载中...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">我的订单</h1>
        {orders.length === 0 ? (
          <div className="py-16 text-center text-slate-500">暂无订单</div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {ORDER_TYPE_LABELS[order.order_type] === "机票"
                        ? "\u2708"
                        : ORDER_TYPE_LABELS[order.order_type] === "酒店"
                          ? "\u{1F3E8}"
                          : "\u{1F3AB}"}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">
                        {ORDER_TYPE_LABELS[order.order_type]}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                    {order.total_price !== null && (
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        &yen;{order.total_price}
                      </p>
                    )}
                  </div>
                </div>
                {order.status === "pending" && (
                  <button
                    onClick={() => handleCancel(order.id)}
                    className="mt-3 text-xs text-red-500 hover:underline"
                  >
                    取消订单
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
