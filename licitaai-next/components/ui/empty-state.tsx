"use client"

import React from "react"
import Link from "next/link"

export interface EmptyStateProps {
  icon: "search" | "document" | "opportunity" | "proposal"
  title: string
  description: string
  action?: { label: string; onClick?: () => void; href?: string }
}

function Icon({ type }: { type: EmptyStateProps["icon"] }) {
  const common = "h-14 w-14 opacity-95"
  switch (type) {
    case "search":
      return (
        <svg className={common} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0" stopColor="#60A5FA" />
              <stop offset="1" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <circle cx="27" cy="27" r="14" stroke="url(#g1)" strokeWidth="3" fill="rgba(255,255,255,0.02)" />
          <path d="M41 41L54 54" stroke="rgba(124,58,237,0.8)" strokeWidth="3" strokeLinecap="round" />
          <path d="M20 20L34 34" stroke="rgba(96,165,250,0.45)" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      )
    case "document":
      return (
        <svg className={common} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="14" y="10" width="36" height="44" rx="4" fill="rgba(255,255,255,0.02)" stroke="url(#g2)" strokeWidth="2" />
          <defs>
            <linearGradient id="g2" x1="0" x2="1">
              <stop offset="0" stopColor="#60A5FA" />
              <stop offset="1" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <path d="M22 22h20" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 28h20" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case "opportunity":
      return (
        <svg className={common} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g3" x1="0" x2="1">
              <stop offset="0" stopColor="#60A5FA" />
              <stop offset="1" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="16" stroke="url(#g3)" strokeWidth="3" fill="rgba(255,255,255,0.02)" />
          <circle cx="32" cy="32" r="6" fill="url(#g3)" />
          <path d="M32 10v6" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case "proposal":
      return (
        <svg className={common} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g4" x1="0" x2="1">
              <stop offset="0" stopColor="#60A5FA" />
              <stop offset="1" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <rect x="14" y="12" width="36" height="40" rx="4" fill="rgba(255,255,255,0.02)" stroke="url(#g4)" strokeWidth="2" />
          <path d="M20 22h24" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 36l6 6 12-12" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default:
      return null
  }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="rounded-xl bg-gradient-to-br from-blue-800/20 to-violet-800/12 p-4">
        <Icon type={icon} />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xl">{description}</p>
      {action && (
        action.href ? (
          <Link href={action.href} className="mt-2 btn-primary-gradient px-4 py-2 rounded-md inline-block">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="mt-2 btn-primary-gradient px-4 py-2 rounded-md">
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
