"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/auth/AuthProvider";
import { profileSchema, type ProfileInput } from "@/lib/validations/schemas";
import { getProfile, updateProfile } from "@/lib/supabase/queries/profiles";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      getProfile(user.id).then((profile) => {
        if (profile) {
          reset({
            nickname: profile.nickname ?? "",
            default_city: profile.default_city ?? "",
            preferences:
              typeof profile.preferences === "object" && profile.preferences
                ? (profile.preferences as ProfileInput["preferences"])
                : { travel_style: "", budget_level: "", interests: [] },
          });
        }
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileInput) => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    const result = await updateProfile(user.id, {
      nickname: data.nickname,
      default_city: data.default_city,
      preferences: data.preferences as Record<string, unknown>,
    });
    setSaving(false);
    if (result) {
      setMessage({ type: "success", text: "保存成功" });
    } else {
      setMessage({ type: "error", text: "保存失败，请重试" });
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">加载中...</p>
      </div>
    );
  }

  const msgClass =
    message?.type === "success"
      ? "mb-4 rounded-md p-3 text-sm bg-green-50 text-green-700"
      : "mb-4 rounded-md p-3 text-sm bg-red-50 text-red-700";

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-slate-900">个人设置</h1>
        {message && <div className={msgClass}>{message.text}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              邮箱
            </label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="mt-1 block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-slate-700"
            >
              昵称
            </label>
            <input
              id="nickname"
              type="text"
              {...register("nickname")}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="输入昵称"
            />
            {errors.nickname && (
              <p className="mt-1 text-xs text-red-500">
                {errors.nickname.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="default_city"
              className="block text-sm font-medium text-slate-700"
            >
              默认出发城市
            </label>
            <input
              id="default_city"
              type="text"
              {...register("default_city")}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="如：上海"
            />
          </div>
          <div>
            <label
              htmlFor="travel_style"
              className="block text-sm font-medium text-slate-700"
            >
              出行风格
            </label>
            <select
              id="travel_style"
              {...register("preferences.travel_style")}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">不限</option>
              <option value="relaxed">休闲放松</option>
              <option value="adventure">探险刺激</option>
              <option value="cultural">文化深度</option>
              <option value="foodie">美食之旅</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="budget_level"
              className="block text-sm font-medium text-slate-700"
            >
              预算偏好
            </label>
            <select
              id="budget_level"
              {...register("preferences.budget_level")}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">不限</option>
              <option value="economy">经济实惠</option>
              <option value="comfort">舒适标准</option>
              <option value="luxury">豪华体验</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存设置"}
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
