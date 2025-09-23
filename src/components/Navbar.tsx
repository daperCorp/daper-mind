'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth(); // 로그인 여부

  return (
    <nav className="fixed top-0 z-50 w-full bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center">
            <img src="/assets/daper-logo.png" alt="Daper" className="mr-3 h-10" />
            <span className="text-2xl font-bold text-gray-900">Daper</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link href="/archive" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">
                보관함
                </Link>
                <Link href="/favorites" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">
                  즐겨찾기
                </Link>
                <Link href="/settings" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">
                  설정
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">
                  로그인
                </Link>
                <Link href="/register" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Hamburger (항상 존재, md:hidden) */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {user ? (
              <>
                <Link href="/archive" className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
                보관함
                </Link>
                <Link href="/favorites" className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
                  즐겨찾기
                </Link>
                <Link href="/settings" className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
                  설정
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
                  로그인
                </Link>
                <Link href="/register" className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
