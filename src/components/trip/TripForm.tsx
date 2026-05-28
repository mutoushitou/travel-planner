"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { tripFormSchema, type TripFormInput } from "@/lib/validations/schemas";
import { useCities } from "@/hooks/useAttractions";

const PREFERENCE_OPTIONS = [
  { value: "nature", label: "自然风光" },
  { value: "culture", label: "历史文化" },
  { value: "food", label: "美食之旅" },
  { value: "shopping", label: "购物" },
  { value: "adventure", label: "户外探险" },
  { value: "family", label: "亲子" },
];

const ACCOMMODATION_OPTIONS = [
  { value: "budget", label: "经济型酒店" },
  { value: "comfort", label: "舒适型酒店" },
  { value: "luxury", label: "豪华酒店" },
  { value: "homestay", label: "民宿" },
];

const TRANSPORT_OPTIONS = [
  { value: "flight", label: "飞机" },
  { value: "train", label: "高铁/火车" },
  { value: "car", label: "自驾" },
  { value: "bus", label: "大巴" },
];

export function TripForm() {
  const router = useRouter();
  const { supabase } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: cities = [] } = useCities();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TripFormInput>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      adults: 1,
      children: 0,
      budget_level: "comfort",
      preferences: [],
      transport: [],
      city_ids: [],
    },
  });

  const preferences = watch("preferences") ?? [];
  const transport = watch("transport") ?? [];
  const cityIds = watch("city_ids") ?? [];

  const toggleArrayField = (
    field: "preferences" | "transport",
    value: string
  ) => {
    const current = watch(field) ?? [];
    if (current.includes(value)) {
      setValue(
        field,
        current.filter((v) => v !== value)
      );
    } else {
      setValue(field, [...current, value]);
    }
  };

  const toggleCity = (cityId: string) => {
    const current = cityIds;
    if (current.includes(cityId)) {
      const newIds = current.filter((id) => id !== cityId);
      setValue("city_ids", newIds);
      const remainingCities = cities
        .filter((c) => newIds.includes(c.id))
        .map((c) => c.name);
      setValue("destination", remainingCities.join("、"));
    } else {
      const newIds = [...current, cityId];
      setValue("city_ids", newIds);
      const selectedCities = cities
        .filter((c) => newIds.includes(c.id))
        .map((c) => c.name);
      setValue("destination", selectedCities.join("、"));
    }
  };

  const onSubmit = async (data: TripFormInput) => {
    setSubmitting(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError("请先登录");
        setSubmitting(false);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/trips-generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await res.json();
      if (result.trip_id) {
        router.push(`/trips/${result.trip_id}`);
      } else {
        setError(result.error || "创建失败");
      }
    } catch {
      setError("网络错误，请重试");
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-slate-700"
        >
          行程标题
        </label>
        <input
          id="title"
          type="text"
          {...register("title")}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="如：北京5日文化之旅"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          目的地城市
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {cities.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => toggleCity(city.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                cityIds.includes(city.id)
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>
        {errors.city_ids && (
          <p className="mt-1 text-xs text-red-500">{errors.city_ids.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="departure_city"
            className="block text-sm font-medium text-slate-700"
          >
            出发城市
          </label>
          <input
            id="departure_city"
            type="text"
            {...register("departure_city")}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="如：上海"
          />
          {errors.departure_city && (
            <p className="mt-1 text-xs text-red-500">
              {errors.departure_city.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            预算等级
          </label>
          <div className="mt-2 flex gap-3">
            {(
              [
                { value: "economy", label: "经济" },
                { value: "comfort", label: "舒适" },
                { value: "luxury", label: "豪华" },
              ] as const
            ).map(({ value, label }) => (
              <label key={value} className="flex items-center gap-1 text-sm">
                <input
                  type="radio"
                  value={value}
                  {...register("budget_level")}
                  className="text-blue-600"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="start_date"
            className="block text-sm font-medium text-slate-700"
          >
            开始日期
          </label>
          <input
            id="start_date"
            type="date"
            {...register("start_date")}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {errors.start_date && (
            <p className="mt-1 text-xs text-red-500">
              {errors.start_date.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="end_date"
            className="block text-sm font-medium text-slate-700"
          >
            结束日期
          </label>
          <input
            id="end_date"
            type="date"
            {...register("end_date")}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {errors.end_date && (
            <p className="mt-1 text-xs text-red-500">
              {errors.end_date.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="adults"
              className="block text-sm font-medium text-slate-700"
            >
              成人
            </label>
            <input
              id="adults"
              type="number"
              min={1}
              {...register("adults", { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="children"
              className="block text-sm font-medium text-slate-700"
            >
              儿童
            </label>
            <input
              id="children"
              type="number"
              min={0}
              {...register("children", { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          兴趣偏好
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PREFERENCE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleArrayField("preferences", value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                preferences.includes(value)
                  ? "bg-green-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          住宿偏好
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {ACCOMMODATION_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                value={value}
                {...register("accommodation")}
                className="text-blue-600"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          交通偏好
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {TRANSPORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleArrayField("transport", value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                transport.includes(value)
                  ? "bg-orange-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="special_requirements"
          className="block text-sm font-medium text-slate-700"
        >
          特殊需求
        </label>
        <textarea
          id="special_requirements"
          {...register("special_requirements")}
          rows={3}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          placeholder="如有老人儿童同行、饮食禁忌等..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "正在生成行程..." : "生成行程"}
      </button>
    </form>
  );
}
