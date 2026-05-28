"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useAttraction, useAttractionsByCity } from "@/hooks/useAttractions";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AttractionCard } from "@/components/attraction/AttractionCard";
import { ATTRACTION_CATEGORY_LABELS } from "@/types/attraction";

export default function AttractionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: attraction, isLoading } = useAttraction(id);
  const cityId = attraction?.city_id;
  const { data: relatedAttractions = [] } = useAttractionsByCity(cityId ?? "");

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-3/4 rounded bg-slate-200" />
            <div className="h-64 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-200" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!attraction) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">景点不存在</h1>
          <Link
            href="/attractions"
            className="mt-4 text-blue-600 hover:underline"
          >
            返回景点列表
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const cityName = (
    attraction as unknown as { city?: { name: string; province: string } }
  ).city;

  function getPriceDisplay() {
    if (attraction!.ticket_price === null) return "-";
    if (attraction!.ticket_price === 0) return "免费";
    return "￥" + attraction!.ticket_price;
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/attractions"
          className="mb-4 inline-block text-sm text-blue-600 hover:underline"
        >
          &larr; 返回景点列表
        </Link>

        <div className="mb-6 flex h-64 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100">
          <span className="text-8xl">
            {attraction.category === "nature" && "\u{1F3DE}"}
            {attraction.category === "culture" && "\u{1F3DB}"}
            {attraction.category === "food" && "\u{1F372}"}
            {attraction.category === "shopping" && "\u{1F6CD}"}
            {attraction.category === "theme-park" && "\u{1F3A2}"}
            {attraction.category === "museum" && "\u{1F3DB}"}
            {attraction.category === "other" && "\u{1F30D}"}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {attraction.name}
              </h1>
              {cityName && (
                <p className="mt-1 text-sm text-slate-500">
                  {cityName.province} {" · "} {cityName.name}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-600">
                {"\u2605"} {attraction.rating_avg.toFixed(1)}
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {ATTRACTION_CATEGORY_LABELS[attraction.category]}
              </span>
            </div>
          </div>

          {attraction.description && (
            <p className="text-slate-700">{attraction.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">门票价格</p>
              <p className="font-medium text-slate-900">{getPriceDisplay()}</p>
            </div>
            {attraction.opening_hours && (
              <div>
                <p className="text-xs text-slate-500">开放时间</p>
                <p className="font-medium text-slate-900">
                  {attraction.opening_hours}
                </p>
              </div>
            )}
            {attraction.suggested_duration && (
              <div>
                <p className="text-xs text-slate-500">建议时长</p>
                <p className="font-medium text-slate-900">
                  {attraction.suggested_duration}
                </p>
              </div>
            )}
          </div>
        </div>

        {relatedAttractions.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-xl font-bold text-slate-900">同城推荐</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {relatedAttractions
                .filter((a) => a.id !== attraction.id)
                .slice(0, 3)
                .map((a) => (
                  <AttractionCard key={a.id} attraction={a} />
                ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
