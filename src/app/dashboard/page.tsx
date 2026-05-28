"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getTripsByUser, deleteTrip } from "@/lib/supabase/queries/trips";
import type { Trip } from "@/types/trip";

const STATUS_LABELS: Record<string, string> = {
  draft: "草稿",
  generating: "生成中",
  generated: "已生成",
  booked: "已预订",
  completed: "已完成",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  generating: "bg-yellow-100 text-yellow-700",
  generated: "bg-green-100 text-green-700",
  booked: "bg-blue-100 text-blue-700",
  completed: "bg-purple-100 text-purple-700",
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      getTripsByUser(user.id).then((data) => {
        setTrips(data);
        setLoading(false);
      });
    }
  }, [user, authLoading, router]);

  const handleDelete = async (tripId: string) => {
    if (!confirm("确定删除此行程？")) return;
    setDeletingId(tripId);
    const success = await deleteTrip(tripId);
    if (success) {
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    }
    setDeletingId(null);
  };

  const filteredTrips = trips.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-slate-500">加载中...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">我的行程</h1>
          <Link
            href="/trips/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + 新建行程
          </Link>
        </div>

        <div className="mt-4 flex gap-3">
          <input
            type="text"
            placeholder="搜索行程..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-500">还没有行程</p>
            <Link
              href="/trips/new"
              className="mt-2 inline-block text-blue-600 hover:underline"
            >
              创建第一个行程
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <Link
                    href={`/trips/${trip.id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600"
                  >
                    {trip.title}
                  </Link>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[trip.status]}`}
                  >
                    {STATUS_LABELS[trip.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {trip.destination}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {trip.start_date} ~ {trip.end_date} ·{" "}
                  {trip.adults + trip.children}人
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/trips/${trip.id}`}
                    className="flex-1 rounded-md bg-blue-50 px-3 py-1.5 text-center text-xs font-medium text-blue-600 hover:bg-blue-100"
                  >
                    查看详情
                  </Link>
                  <button
                    onClick={() => handleDelete(trip.id)}
                    disabled={deletingId === trip.id}
                    className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
