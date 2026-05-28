import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AttractionList } from "@/components/attraction/AttractionList";

export const metadata: Metadata = {
  title: "景点推荐 - 智能旅游规划",
  description: "探索全国热门旅游景点，发现你的下一站旅行目的地",
};

export default function AttractionsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">景点推荐</h1>
        <AttractionList />
      </main>
      <Footer />
    </>
  );
}
