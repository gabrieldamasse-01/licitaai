"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Building2,
  FileText,
  Target,
  X,
  LayoutDashboard,
  Users,
  FolderOpen,
  Gavel,
  Clock,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// ─── Histórico de buscas ─────────────────────────────────────────────────────

const HISTORY_MAX = 5

function getHistoryKey(userId: string) {
  return `search-history-${userId}`
}

function loadHistory(userId: string): string[] {
  try {
    const raw = localStorage.getItem(getHistoryKey(userId))
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveToHistory(userId: string, term: string) {
  const trimmed = term.trim()
  if (!trimmed) return
  const prev = loadHistory(userId).filter((h) => h !== trimmed)
  const next = [trimmed, ...prev].slice(0, HISTORY_MAX)
  localStorage.setItem(getHistoryKey(userId), JSON.stringify(next))
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SearchResult = {
  id: string
  titulo: string
  subtitulo: string
  href: string
}

type ResultGroup = {
  label: string
  icon: React.ReactNode
  items: SearchResult[]
}

// ─── Atalhos rápidos (estado vazio) ──────────────────────────────────────────

const ATALHOS = [
  { label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, href: "/dashboard" },
  { label: "Clientes", icon: <Users className="h-4 w-4" />, href: "/clientes" },
  { label: "Documentos", icon: <FolderOpen className="h-4 w-4" />, href: "/documentos" },
  { label: "Licitações", icon: <Gavel className="h-4 w-4" />, href: "/licitacoes" },
]

// ─── Componente ───────────────────────────────────────────────────────────────

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [groups, setGroups] = useState<ResultGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [userId, setUserId] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // Carrega userId uma vez ao montar
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  // Lista plana para navegação por teclado
  const flatItems = groups.flatMap((g) => g.items)

  // Ctrl+K / Cmd+K em qualquer página
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // Focus, reset e carrega histórico ao abrir
  useEffect(() => {
    if (open) {
      setQuery("")
      setGroups([])
      setActiveIndex(-1)
      if (userId) setRecentSearches(loadHistory(userId))
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open, userId])

  // Busca nas tabelas via Supabase client
  const buscar = useCallback(async (q: string) => {
    if (!q.trim()) {
      setGroups([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const termo = `%${q}%`

      const [empresasRes, docsRes, matchesRes] = await Promise.all([
        // Clientes — RLS garante user_id do auth
        supabase
          .from("companies")
          .select("id, razao_social, cnpj")
          .or(`razao_social.ilike.${termo},cnpj.ilike.${termo}`)
          .limit(3),

        // Documentos — RLS via company_id → companies.user_id
        supabase
          .from("documents")
          .select("id, tipo, nome_arquivo, status")
          .or(`tipo.ilike.${termo},nome_arquivo.ilike.${termo}`)
          .limit(3),

        // Oportunidades salvas — matches + licitacoes
        supabase
          .from("matches")
          .select("id, licitacoes!inner(id, objeto, orgao)")
          .or(`objeto.ilike.${termo},orgao.ilike.${termo}`, { foreignTable: "licitacoes" })
          .limit(3),
      ])

      const resultado: ResultGroup[] = []

      if (empresasRes.data?.length) {
        resultado.push({
          label: "Clientes",
          icon: <Building2 className="h-3.5 w-3.5" />,
          items: empresasRes.data.map((c) => ({
            id: c.id,
            titulo: c.razao_social,
            subtitulo: c.cnpj
              ? c.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
              : "CNPJ não informado",
            href: "/clientes",
          })),
        })
      }

      if (docsRes.data?.length) {
        resultado.push({
          label: "Documentos",
          icon: <FileText className="h-3.5 w-3.5" />,
          items: docsRes.data.map((d) => ({
            id: d.id,
            titulo: d.tipo,
            subtitulo: d.nome_arquivo,
            href: "/documentos",
          })),
        })
      }

      if (matchesRes.data?.length) {
        resultado.push({
          label: "Oportunidades salvas",
          icon: <Target className="h-3.5 w-3.5" />,
          items: matchesRes.data.map((m) => {
            const lic = (m.licitacoes as unknown) as { id: string; objeto?: string; orgao?: string }
            return {
              id: m.id,
              titulo: lic.objeto?.slice(0, 80) ?? "Sem objeto",
              subtitulo: lic.orgao ?? "",
              href: "/oportunidades",
            }
          }),
        })
      }

      setGroups(resultado)
    } catch {
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce de 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setGroups([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => buscar(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, buscar])

  // Navegação por teclado no input
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && activeIndex >= 0) {
      const item = flatItems[activeIndex]
      if (item) navigate(item.href, query)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  function navigate(href: string, fromQuery?: string) {
    if (userId && fromQuery?.trim()) {
      saveToHistory(userId, fromQuery)
    }
    router.push(href)
    setOpen(false)
  }

  // ─── Botão da lupa (sempre visível no header) ──────────────────────────────
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.07] hover:text-white transition-colors"
        aria-label="Busca global (Ctrl+K)"
        title="Busca global (Ctrl+K)"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Modal */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Paleta de comandos */}
          <div className="fixed left-1/2 top-[18%] z-50 w-full max-w-lg -translate-x-1/2 px-4">
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                background: "rgba(15,23,42,0.95)",
                borderColor: "rgba(96,165,250,0.2)",
                boxShadow:
                  "0 24px 64px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(96,165,250,0.05)",
                backdropFilter: "blur(24px)",
              }}
            >
              {/* Campo de busca */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                <Search className="h-4 w-4 text-slate-500 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setActiveIndex(-1)
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Buscar clientes, documentos, oportunidades..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                />
                {query ? (
                  <button
                    onClick={() => setQuery("")}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <kbd className="hidden sm:flex items-center rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
                    ESC
                  </kbd>
                )}
              </div>

              {/* Corpo */}
              <div className="max-h-[380px] overflow-y-auto py-2">
                {/* Loading */}
                {loading && (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />
                  </div>
                )}

                {/* Buscas recentes (sem query) */}
                {!loading && !query && recentSearches.length > 0 && (
                  <div className="px-2 mb-1">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Buscas recentes
                    </p>
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          setQuery(term)
                          setActiveIndex(-1)
                        }}
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/[0.05] hover:text-white transition-colors"
                      >
                        <Clock className="h-4 w-4 text-slate-600 shrink-0" />
                        <span className="truncate">{term}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Atalhos rápidos (sem query) */}
                {!loading && !query && (
                  <div className="px-2">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      Atalhos rápidos
                    </p>
                    {ATALHOS.map((a) => (
                      <button
                        key={a.href}
                        onClick={() => navigate(a.href)}
                        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/[0.05] hover:text-white transition-colors"
                      >
                        <span className="text-slate-600">{a.icon}</span>
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Sem resultados */}
                {!loading && query && groups.length === 0 && (
                  <div className="py-10 text-center px-4">
                    <p className="text-sm text-slate-500">
                      Nenhum resultado para{" "}
                      <span className="text-slate-300">"{query}"</span>
                    </p>
                  </div>
                )}

                {/* Resultados agrupados */}
                {!loading &&
                  groups.map((group) => (
                    <div key={group.label} className="px-2 mb-1">
                      {/* Cabeçalho do grupo */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5">
                        <span className="text-slate-600">{group.icon}</span>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                          {group.label}
                        </p>
                      </div>

                      {/* Itens */}
                      {group.items.map((item) => {
                        const globalIdx = flatItems.findIndex((r) => r.id === item.id)
                        const ativo = activeIndex === globalIdx
                        return (
                          <button
                            key={item.id}
                            onClick={() => navigate(item.href, query)}
                            className={cn(
                              "w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left",
                              ativo
                                ? "bg-white/[0.08] text-white"
                                : "text-slate-300 hover:bg-white/[0.05] hover:text-white",
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium leading-snug">
                                {item.titulo}
                              </p>
                              {item.subtitulo && (
                                <p className="truncate text-xs text-slate-500 mt-0.5">
                                  {item.subtitulo}
                                </p>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ))}
              </div>

              {/* Footer com dica de teclado */}
              <div className="border-t border-white/[0.05] px-4 py-2 flex items-center gap-4 text-[10px] text-slate-600">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-slate-700 bg-slate-800/60 px-1 py-0.5 font-mono">↑↓</kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-slate-700 bg-slate-800/60 px-1 py-0.5 font-mono">↵</kbd>
                  abrir
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-slate-700 bg-slate-800/60 px-1 py-0.5 font-mono">ESC</kbd>
                  fechar
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
