import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-6xl font-bold text-slate-300">404</h1>
      <p className="text-lg text-slate-600">页面不存在</p>
      <Link href="/" className="text-blue-600 hover:underline">
        返回首页
      </Link>
    </main>
  );
}
