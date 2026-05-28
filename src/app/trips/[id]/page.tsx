"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatPanel } from "@/components/trip/ChatPanel";
import { getTripById, getTripDays } from "@/lib/supabase/queries/trips";
import type { Trip, TripDay } from "@/types/trip";

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<TripDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "chat">("timeline");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (id) {
      Promise.all([getTripById(id), getTripDays(id)]).then(
        ([tripData, daysData]) => {
          setTrip(tripData);
          setDays(daysData);
          setLoading(false);
        }
      );
    }
  }, [id, user, authLoading, router]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-3/4 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-200" />
            <div className="h-32 rounded bg-slate-200" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!trip) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">行程不存在</h1>
          <Link
            href="/dashboard"
            className="mt-4 text-blue-600 hover:underline"
          >
            返回工作台
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-block text-sm text-blue-600 hover:underline"
        >
          &larr; 返回工作台
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">{trip.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>{trip.destination}</span>
            <span>·</span>
            <span>
              {trip.start_date} ~ {trip.end_date}
            </span>
            <span>·</span>
            <span>{trip.adults + trip.children}人</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
              {trip.budget_level === "economy"
                ? "经济"
                : trip.budget_level === "luxury"
                  ? "豪华"
                  : "舒适"}
            </span>
          </div>
        </div>

        <div className="mb-4 flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "timeline"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            时间轴
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "chat"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            AI 助手
          </button>
        </div>

        {activeTab === "chat" ? (
          <ChatPanel tripId={id} />
        ) : (
          <div className="space-y-6">
            {trip.status === "generating" && (
              <div className="rounded-md bg-yellow-50 p-4 text-center text-sm text-yellow-700">
                行程正在生成中，请稍候...
              </div>
            )}

            {days.map((day) => (
              <div key={day.id} className="rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 rounded-t-lg bg-slate-50 px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {day.day_number}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">
                      第{day.day_number}天
                    </p>
                    <p className="text-xs text-slate-500">{day.date}</p>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  {day.attractions && day.attractions.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-slate-700">
                        景点
                      </h4>
                      <div className="grid gap-2">
                        {day.attractions.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-start gap-3 rounded-md bg-blue-50 p-3"
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                              {a.order_index}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm text-slate-700">
                                {a.notes}
                              </p>
                              <p className="text-xs text-slate-500">
                                {a.duration}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {day.meals && day.meals.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-slate-700">
                        餐饮
                      </h4>
                      <div className="grid gap-2">
                        {day.meals.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between rounded-md bg-orange-50 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                {m.restaurant_name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {MEAL_TYPE_LABELS[m.meal_type] || m.meal_type}
                                {m.cuisine ? ` · ${m.cuisine}` : ""}
                              </p>
                            </div>
                            {m.price !== null && (
                              <span className="text-sm text-orange-600">
                                人均{m.price}元
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {day.transport && day.transport.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-slate-700">
                        交通
                      </h4>
                      <div className="grid gap-2">
                        {day.transport.map((t) => (
                          <div
                            key={t.id}
                            className="rounded-md bg-slate-50 p-3 text-sm text-slate-600"
                          >
                            {t.detail ||
                              `${t.from_location || ""} → ${t.to_location || ""} (${t.transport_type})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {day.hotels && day.hotels.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-slate-700">
                        住宿
                      </h4>
                      <div className="grid gap-2">
                        {day.hotels.map((h) => (
                          <div
                            key={h.id}
                            className="flex items-center justify-between rounded-md bg-purple-50 p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                {h.hotel_name}
                              </p>
                              {h.notes && (
                                <p className="text-xs text-slate-500">
                                  {h.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {h.star_rating && (
                                <p className="text-xs text-yellow-600">
                                  {"\u2605".repeat(h.star_rating)}
                                </p>
                              )}
                              {h.price_range && (
                                <p className="text-xs text-purple-600">
                                  {h.price_range}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
