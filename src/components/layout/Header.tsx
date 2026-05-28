"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-blue-600"
        >
          ✈️ TravelPlan
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm text-slate-600 hover:text-blue-600">
            首页
          </Link>
          <Link
            href="/attractions"
            className="text-sm text-slate-600 hover:text-blue-600"
          >
            景点
          </Link>
          {!loading && (
            <>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                      {user.email?.[0].toUpperCase()}
                    </span>
                    <span className="hidden lg:inline">{user.email}</span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        工作台
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        设置
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        我的订单
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          signOut();
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
                      >
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="text-sm text-slate-600 hover:text-blue-600"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                  >
                    注册
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>

        <button
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              className="text-sm text-slate-600"
              onClick={() => setMenuOpen(false)}
            >
              首页
            </Link>
            <Link
              href="/attractions"
              className="text-sm text-slate-600"
              onClick={() => setMenuOpen(false)}
            >
              景点
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-slate-600"
                  onClick={() => setMenuOpen(false)}
                >
                  工作台
                </Link>
                <Link
                  href="/settings"
                  className="text-sm text-slate-600"
                  onClick={() => setMenuOpen(false)}
                >
                  设置
                </Link>
                <Link
                  href="/orders"
                  className="text-sm text-slate-600"
                  onClick={() => setMenuOpen(false)}
                >
                  我的订单
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="text-left text-sm text-red-600"
                >
                  退出登录
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-slate-600"
                  onClick={() => setMenuOpen(false)}
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="text-sm text-slate-600"
                  onClick={() => setMenuOpen(false)}
                >
                  注册
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
