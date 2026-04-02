"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"

interface LandingNavbarProps {
  isLoggedIn: boolean
}

export function LandingNavbar({ isLoggedIn }: LandingNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1A5276] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-[#1A5276]">
              Licita<span className="text-[#2E86C1]">IA</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#planos"
              className="text-gray-600 hover:text-[#1A5276] font-medium text-sm transition-colors"
            >
              Planos
            </a>
            <a
              href="#beneficios"
              className="text-gray-600 hover:text-[#1A5276] font-medium text-sm transition-colors"
            >
              Benefícios
            </a>
            <a
              href="#como-funciona"
              className="text-gray-600 hover:text-[#1A5276] font-medium text-sm transition-colors"
            >
              Como funciona
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="bg-[#1A5276] text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-[#154360] transition-colors text-sm"
              >
                Ir para o Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="bg-[#1A5276] text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-[#154360] transition-colors text-sm"
                >
                  Começar grátis
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1 border-t border-gray-100 mt-2">
            <a
              href="#planos"
              onClick={() => setMobileOpen(false)}
              className="flex items-center px-4 py-3 text-gray-700 text-sm font-medium hover:bg-gray-50 rounded-xl transition-colors"
            >
              Planos
            </a>
            <a
              href="#beneficios"
              onClick={() => setMobileOpen(false)}
              className="flex items-center px-4 py-3 text-gray-700 text-sm font-medium hover:bg-gray-50 rounded-xl transition-colors"
            >
              Benefícios
            </a>
            <a
              href="#como-funciona"
              onClick={() => setMobileOpen(false)}
              className="flex items-center px-4 py-3 text-gray-700 text-sm font-medium hover:bg-gray-50 rounded-xl transition-colors"
            >
              Como funciona
            </a>
            <div className="pt-3 border-t border-gray-100 space-y-2 px-1">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center bg-[#1A5276] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#154360] transition-colors"
                >
                  Ir para o Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="block text-center border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    onClick={() => setMobileOpen(false)}
                    className="block text-center bg-[#1A5276] text-white font-semibold py-3 rounded-xl text-sm hover:bg-[#154360] transition-colors"
                  >
                    Começar grátis
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
