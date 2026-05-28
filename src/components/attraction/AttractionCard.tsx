import Link from "next/link";
import type { Attraction } from "@/types/attraction";
import { ATTRACTION_CATEGORY_LABELS } from "@/types/attraction";

interface AttractionCardProps {
  attraction: Attraction;
}

export function AttractionCard({ attraction }: AttractionCardProps) {
  const cityName =
    (attraction as unknown as { city?: { name: string } }).city?.name ?? "";

  return (
    <Link
      href={`/attractions/${attraction.id}`}
      className="group block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <span className="text-4xl">
          {attraction.category === "nature" && "\u{1F3DE}"}
          {attraction.category === "culture" && "\u{1F3DB}"}
          {attraction.category === "food" && "\u{1F372}"}
          {attraction.category === "shopping" && "\u{1F6CD}"}
          {attraction.category === "theme-park" && "\u{1F3A2}"}
          {attraction.category === "museum" && "\u{1F3DB}"}
          {attraction.category === "other" && "\u{1F30D}"}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {ATTRACTION_CATEGORY_LABELS[attraction.category]}
          </span>
          <span className="text-sm font-medium text-yellow-600">
            {"\u2605"} {attraction.rating_avg.toFixed(1)}
          </span>
        </div>
        <h3 className="mt-2 text-base font-semibold text-slate-900 group-hover:text-blue-600">
          {attraction.name}
        </h3>
        {cityName && (
          <p className="mt-0.5 text-xs text-slate-500">{cityName}</p>
        )}
        {attraction.description && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {attraction.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {attraction.suggested_duration &&
              `${attraction.suggested_duration}`}
          </span>
          {attraction.ticket_price !== null && attraction.ticket_price > 0 ? (
            <span className="text-sm font-medium text-red-500">
              &yen;{attraction.ticket_price}
            </span>
          ) : (
            <span className="text-sm font-medium text-green-600">免费</span>
          )}
        </div>
      </div>
    </Link>
  );
}
