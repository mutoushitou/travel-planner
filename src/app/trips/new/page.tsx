import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TripForm } from "@/components/trip/TripForm";

export const metadata: Metadata = {
  title: "新建行程 - 智能旅游规划",
};

export default function NewTripPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">新建行程</h1>
        <TripForm />
      </main>
      <Footer />
    </>
  );
}
