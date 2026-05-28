import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "智能旅游规划 - AI 驱动的个性化行程生成",
  description:
    "AI 驱动的智能旅游规划平台，一键生成个性化行程，支持多轮对话优化，机票酒店门票一站式预订",
};

const features = [
  {
    icon: "\u{1F916}",
    title: "智能生成",
    description: "填写需求表单，AI 自动生成完整的每日行程方案",
  },
  {
    icon: "\u{1F4AC}",
    title: "灵活调整",
    description: "多轮对话微调，不满意随时修改，版本随时回退",
  },
  {
    icon: "\u{1F3A8}",
    title: "一体预订",
    description: "机票、酒店、门票一键跳转预订，旅行无忧",
  },
  {
    icon: "\u{1F4DA}",
    title: "历史沉淀",
    description: "所有行程保存归档，随时回顾、复制、分享",
  },
];

const hotCities = [
  { name: "北京", slug: "beijing", emoji: "\u{1F3DB}" },
  { name: "上海", slug: "shanghai", emoji: "\u{1F3D9}" },
  { name: "成都", slug: "chengdu", emoji: "\u{1F43C}" },
  { name: "西安", slug: "xian", emoji: "\u{1F3F0}" },
  { name: "杭州", slug: "hangzhou", emoji: "\u{1F33F}" },
  { name: "三亚", slug: "sanya", emoji: "\u{1F334}" },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="mx-auto max-w-5xl px-4 py-20 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              智能旅游规划
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
              只需填写出行需求，AI 为您一键生成完整的每日行程方案。
              支持多轮对话优化，让每次旅行都完美。
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/trips/new"
                className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 shadow-lg transition-colors hover:bg-blue-50"
              >
                开始规划
              </Link>
              <Link
                href="/attractions"
                className="rounded-lg border-2 border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                探索景点
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            核心功能
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-slate-200 p-6 text-center transition-shadow hover:shadow-md"
              >
                <span className="text-4xl">{f.icon}</span>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-bold text-slate-900">
              热门目的地
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {hotCities.map((city) => (
                <Link
                  key={city.slug}
                  href="/attractions"
                  className="rounded-xl border border-slate-200 bg-white p-4 text-center transition-shadow hover:shadow-md"
                >
                  <span className="text-3xl">{city.emoji}</span>
                  <p className="mt-2 font-medium text-slate-900">{city.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900">开始你的旅程</h2>
          <p className="mt-2 text-slate-500">注册账号，即刻体验 AI 旅游规划</p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            免费注册
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
