"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, Scale } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

interface LandingNavbarProps {
  isLoggedIn: boolean
}

export function LandingNavbar({ isLoggedIn }: LandingNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled 
          ? "bg-[#0A1628]/80 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20 transition-all duration-300">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group relative z-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">LicitaIA</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Como funciona", href: "#como-funciona" },
              { label: "Preços", href: "#planos" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="h-10 px-5 inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all"
              >
                Ir para o Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="h-10 px-5 inline-flex items-center justify-center rounded-full text-sm font-medium text-white hover:bg-white/10 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="h-10 px-5 inline-flex items-center justify-center rounded-full bg-white hover:bg-slate-100 text-sm font-medium text-[#0A1628] transition-colors"
                >
                  Começar grátis
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden relative z-50 p-2 -mr-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 bg-[#0A1628]/95 backdrop-blur-xl border-b border-white/10 md:hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {[
                { label: "Como funciona", href: "#como-funciona" },
                { label: "Preços", href: "#planos" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  {item.label}
                </a>
              ))}
              
              <div className="pt-4 mt-2 mb-2 border-t border-white/10"></div>
              
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="w-full h-12 flex items-center justify-center rounded-xl bg-blue-600 text-white font-medium shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                  Ir para o Dashboard
                </Link>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/auth/sign-up"
                    onClick={() => setMobileOpen(false)}
                    className="w-full h-12 flex items-center justify-center rounded-xl bg-white text-[#0A1628] font-medium"
                  >
                    Começar grátis
                  </Link>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full h-12 flex items-center justify-center rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
                  >
                    Entrar
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
