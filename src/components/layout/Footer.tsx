export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} TravelPlan - 智能旅游规划平台</p>
        <p className="mt-1">AI 驱动的个性化行程生成 · 一站式旅游规划</p>
      </div>
    </footer>
  );
}
