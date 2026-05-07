"use client"

import { useState, useCallback, useRef } from "react"

type Licitacao = Record<string, unknown>

type Pagination = {
  total_registros: number
  total_paginas: number
  pagina_atual: number
  itens_nesta_pagina: number
}

const MAX_DAYS_PER_CHUNK = 5

function toLocalISO(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatBRL(v: number) {
  return v > 0 ? "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"
}

function formatDate(str: string | null | undefined) {
  if (!str) return { date: "—", time: "" }
  const parts = str.split(" ")
  return { date: parts[0] || "—", time: parts[1] || "" }
}

async function fetchPage(begin: string, end: string, page: number) {
  const resp = await fetch("/api/admin/effecti", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ begin, end, page }),
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`API error (${resp.status}): ${text.substring(0, 200)}`)
  }
  const data = await resp.json()
  if (data.error) throw new Error(data.error)
  return data as { licitacoes: Licitacao[]; pagination: Pagination }
}

export default function EffectiTab() {
  const now = new Date()
  const begin96h = new Date(now.getTime() - 96 * 3600000)

  const [dateBegin, setDateBegin] = useState(toLocalISO(begin96h))
  const [dateEnd, setDateEnd] = useState(toLocalISO(now))
  const [activeHours, setActiveHours] = useState(96)
  const [allData, setAllData] = useState<Licitacao[]>([])
  const [filteredData, setFilteredData] = useState<Licitacao[]>([])
  const [search, setSearch] = useState("")
  const [activeUFs, setActiveUFs] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState("dataFinalProposta")
  const [sortAsc, setSortAsc] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState("")
  const [progress, setProgress] = useState({ pct: 0, pages: "", items: "" })
  const [selectedLic, setSelectedLic] = useState<Licitacao | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  function setRange(hours: number) {
    const n = new Date()
    setDateBegin(toLocalISO(new Date(n.getTime() - hours * 3600000)))
    setDateEnd(toLocalISO(n))
    setActiveHours(hours)
  }

  const applyFilters = useCallback(
    (data: Licitacao[], q: string, ufs: Set<string>, field: string, asc: boolean) => {
      let filtered = data.filter((lic) => {
        if (ufs.size > 0 && !ufs.has(lic.uf as string)) return false
        if (q) {
          const haystack = [
            lic.orgao,
            lic.uf,
            lic.portal,
            lic.modalidade,
            lic.objetoSemTags || lic.objeto,
            lic.processo,
            ...((lic.palavraEncontrada as string[]) || []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          return haystack.includes(q.toLowerCase())
        }
        return true
      })

      filtered = [...filtered].sort((a, b) => {
        const va = a[field]
        const vb = b[field]
        if (typeof va === "number" && typeof vb === "number") return asc ? va - vb : vb - va
        if (field.toLowerCase().includes("data")) {
          const parseDate = (s: unknown) => {
            if (!s) return 0
            const [d, t] = String(s).split(" ")
            const [dd, mm, yy] = d.split("/")
            return new Date(`${yy}-${mm}-${dd}T${t || "00:00:00"}`).getTime() || 0
          }
          return asc ? parseDate(va) - parseDate(vb) : parseDate(vb) - parseDate(va)
        }
        const sa = String(va || "").toLowerCase()
        const sb = String(vb || "").toLowerCase()
        return asc ? sa.localeCompare(sb) : sb.localeCompare(sa)
      })

      setFilteredData(filtered)
    },
    []
  )

  async function fetchData() {
    const beginDate = new Date(dateBegin)
    const endDate = new Date(dateEnd)
    const begin = beginDate.toISOString()
    const end = endDate.toISOString()
    const periodDays = (endDate.getTime() - beginDate.getTime()) / (1000 * 60 * 60 * 24)

    setLoading(true)
    setProgress({ pct: 0, pages: "", items: "" })

    try {
      let allCollected: Licitacao[] = []

      if (periodDays > MAX_DAYS_PER_CHUNK) {
        const chunks: { begin: string; end: string }[] = []
        let currentEnd = new Date(endDate)
        while (currentEnd > beginDate) {
          const chunkBegin = new Date(
            Math.max(currentEnd.getTime() - MAX_DAYS_PER_CHUNK * 24 * 3600000, beginDate.getTime())
          )
          chunks.unshift({ begin: chunkBegin.toISOString(), end: currentEnd.toISOString() })
          currentEnd = chunkBegin
        }
        setLoadingText(`Período de ${Math.ceil(periodDays)} dias dividido em ${chunks.length} buscas...`)

        for (let ci = 0; ci < chunks.length; ci++) {
          const chunk = chunks[ci]
          setLoadingText(`Buscando chunk ${ci + 1}/${chunks.length}...`)
          const chunkData = await fetchChunk(chunk.begin, chunk.end, ci + 1, chunks.length)
          allCollected.push(...chunkData)
        }
      } else {
        setLoadingText("Buscando...")
        allCollected = await fetchChunk(begin, end, 1, 1)
      }

      const uniqueMap = new Map<number, Licitacao>()
      allCollected.forEach((lic) => uniqueMap.set(lic.idLicitacao as number, lic))
      const unique = Array.from(uniqueMap.values())
      setAllData(unique)
      setActiveUFs(new Set())
      applyFilters(unique, search, new Set(), sortField, sortAsc)
      setLoadingText(`${unique.length} licitações carregadas!`)
      setTimeout(() => setLoading(false), 600)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido"
      setLoadingText(`Erro: ${msg}`)
      setTimeout(() => setLoading(false), 1500)
    }
  }

  async function fetchChunk(begin: string, end: string, chunkNum: number, totalChunks: number) {
    const collected: Licitacao[] = []
    const firstResult = await fetchPage(begin, end, 0)
    const totalPages = firstResult.pagination?.total_paginas || 1
    collected.push(...(firstResult.licitacoes || []))

    const baseProgress = ((chunkNum - 1) / totalChunks) * 100
    const chunkWeight = 100 / totalChunks

    for (let page = 1; page < totalPages; page++) {
      const result = await fetchPage(begin, end, page)
      collected.push(...(result.licitacoes || []))
      const pct = baseProgress + chunkWeight * ((page + 1) / totalPages)
      setProgress({
        pct,
        pages: `Chunk ${chunkNum}/${totalChunks} - Página ${page + 1}/${totalPages}`,
        items: `${collected.length} licitações`,
      })
    }
    return collected
  }

  function handleSort(field: string) {
    const newAsc = sortField === field ? !sortAsc : true
    setSortField(field)
    setSortAsc(newAsc)
    applyFilters(allData, search, activeUFs, field, newAsc)
  }

  function handleSearch(q: string) {
    setSearch(q)
    applyFilters(allData, q, activeUFs, sortField, sortAsc)
  }

  function toggleUF(uf: string) {
    const newUFs = new Set(activeUFs)
    if (newUFs.has(uf)) newUFs.delete(uf)
    else newUFs.add(uf)
    setActiveUFs(newUFs)
    applyFilters(allData, search, newUFs, sortField, sortAsc)
  }

  function exportCSV() {
    if (filteredData.length === 0) return
    const headers = ["ID", "Órgão", "UF", "Portal", "Modalidade", "Processo", "Objeto", "Valor Estimado", "Prazo Proposta", "SRP", "Keywords", "URL"]
    const rows = filteredData.map((l) => [
      l.idLicitacao,
      `"${String(l.orgao || "").replace(/"/g, '""')}"`,
      l.uf,
      `"${String(l.portal || "").replace(/"/g, '""')}"`,
      l.modalidade,
      l.processo,
      `"${String(l.objetoSemTags || "").replace(/"/g, '""').substring(0, 300)}"`,
      l.valorTotalEstimado || 0,
      l.dataFinalProposta,
      l.srpDescricao,
      `"${((l.palavraEncontrada as string[]) || []).join(", ")}"`,
      l.url,
    ])
    const csv = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `effecti-licitacoes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const ufs = [...new Set(allData.map((l) => l.uf as string).filter(Boolean))].sort()
  const totalValor = allData.reduce((sum, l) => sum + ((l.valorTotalEstimado as number) || 0), 0)
  const totalSRP = allData.filter((l) => l.srp === 1).length
  const totalUFs = new Set(allData.map((l) => l.uf).filter(Boolean)).size
  const totalPortais = new Set(allData.map((l) => l.portal).filter(Boolean)).size

  const QUICK_RANGES = [
    { hours: 24, label: "24h" },
    { hours: 48, label: "48h" },
    { hours: 96, label: "4 dias" },
    { hours: 168, label: "7 dias" },
    { hours: 336, label: "14 dias" },
    { hours: 720, label: "30 dias" },
  ]

  const COLS: { field: string; label: string }[] = [
    { field: "idLicitacao", label: "ID" },
    { field: "orgao", label: "Órgão" },
    { field: "uf", label: "UF" },
    { field: "objetoSemTags", label: "Objeto" },
    { field: "valorTotalEstimado", label: "Valor Estimado" },
    { field: "dataFinalProposta", label: "Prazo Proposta" },
    { field: "portal", label: "Portal" },
    { field: "modalidade", label: "Modalidade" },
    { field: "srpDescricao", label: "SRP" },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Effecti — Painel de Licitações</h2>
          <p className="text-sm text-slate-400">Perfil ABZ Aguabrazil · Perfil 9212</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Data Início</label>
          <input
            type="datetime-local"
            value={dateBegin}
            onChange={(e) => setDateBegin(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 min-w-[200px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Data Fim</label>
          <input
            type="datetime-local"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 min-w-[200px]"
          />
        </div>
        <div className="flex gap-1.5 items-end">
          {QUICK_RANGES.map(({ hours, label }) => (
            <button
              key={hours}
              onClick={() => setRange(hours)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                activeHours === hours
                  ? "bg-blue-500/20 border-blue-500 text-blue-400"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
        >
          <span>🔎</span> Buscar
        </button>
        <button
          onClick={exportCSV}
          disabled={filteredData.length === 0}
          className="px-4 py-2 bg-slate-800 border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 disabled:opacity-40 text-slate-400 text-sm rounded-lg transition-all flex items-center gap-2"
        >
          <span>📥</span> Exportar CSV
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">{loadingText}</p>
          {progress.pct > 0 && (
            <div className="w-80">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-slate-500">
                <span>{progress.pages}</span>
                <span>{progress.items}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {allData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Licitações", value: allData.length, color: "text-blue-400" },
            { label: "Valor Estimado Total", value: formatBRL(totalValor), color: "text-emerald-400" },
            { label: "UFs Distintas", value: totalUFs, color: "text-purple-400" },
            { label: "Com SRP", value: totalSRP, color: "text-amber-400" },
            { label: "Portais Distintos", value: totalPortais, color: "text-blue-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</div>
              <div className={`text-2xl font-extrabold tracking-tight ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      {allData.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Filtrar por órgão, objeto, UF, keywords..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {ufs.map((uf) => (
              <button
                key={uf}
                onClick={() => toggleUF(uf)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeUFs.has(uf)
                    ? "bg-blue-500/20 border-blue-500 text-blue-400"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-blue-500/50"
                }`}
              >
                {uf}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {filteredData.length} de {allData.length} licitações
          </span>
        </div>
      )}

      {/* Table */}
      {!loading && allData.length === 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-20 text-center">
          <div className="text-5xl opacity-30 mb-4">📋</div>
          <h3 className="text-lg font-semibold text-slate-400 mb-2">Selecione um período e clique em Buscar</h3>
          <p className="text-sm text-slate-500">As licitações do perfil ABZ Aguabrazil serão listadas aqui</p>
        </div>
      )}

      {filteredData.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-800 border-b-2 border-slate-700">
                  {COLS.map(({ field, label }) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className={`px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap transition-colors ${
                        sortField === field ? "text-blue-400" : "text-slate-500 hover:text-blue-400"
                      }`}
                    >
                      {label} {sortField === field ? (sortAsc ? "▲" : "▼") : ""}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Keywords</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Itens</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((lic) => {
                  const d = formatDate(lic.dataFinalProposta as string)
                  const val = (lic.valorTotalEstimado as number) || 0
                  const srpClass =
                    lic.srpDescricao === "Sim"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : lic.srpDescricao === "Não"
                      ? "bg-red-500/10 text-red-400 border-red-500/15"
                      : "bg-slate-700/30 text-slate-500 border-slate-600/20"
                  const kws = ((lic.palavraEncontrada as string[]) || []).slice(0, 3)
                  const itens = ((lic.itensEdital as unknown[]) || []).length
                  const obj = String(lic.objetoSemTags || lic.objeto || "").substring(0, 160)

                  return (
                    <tr
                      key={lic.idLicitacao as number}
                      onClick={() => setSelectedLic(lic)}
                      className="border-b border-slate-800/60 hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-3 font-mono text-xs text-slate-500">{lic.idLicitacao as number}</td>
                      <td className="px-3 py-3 max-w-[220px]">
                        <div className="font-semibold text-slate-200 text-xs truncate">{String(lic.orgao || "").substring(0, 60)}</div>
                        <div className="text-[11px] text-slate-500 truncate">{lic.unidadeGestora as string}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {(lic.uf as string) || "?"}
                        </span>
                      </td>
                      <td className="px-3 py-3 max-w-[300px]">
                        <div className="text-xs text-slate-400 line-clamp-2">{obj}</div>
                      </td>
                      <td className={`px-3 py-3 text-xs font-bold whitespace-nowrap ${val > 0 ? "text-emerald-400" : "text-slate-600 italic font-normal"}`}>
                        {val > 0 ? formatBRL(val) : "Não informado"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-200">{d.date}</div>
                        <div className="text-[11px] text-slate-500">{d.time}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/15">
                          {String(lic.portal || "").substring(0, 30)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{(lic.modalidade as string) || "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${srpClass}`}>
                          {(lic.srpDescricao as string) || "?"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {kws.map((k) => (
                            <span key={k} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/15">
                              {k}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-slate-400">{itens || "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedLic && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedLic(null) }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{selectedLic.orgao as string}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  ID {selectedLic.idLicitacao as number} · {selectedLic.modalidade as string} · {selectedLic.portal as string}
                </p>
              </div>
              <button
                onClick={() => setSelectedLic(null)}
                className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg px-2 py-1 text-xl transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: "UF", value: selectedLic.uf },
                { label: "Processo", value: selectedLic.processo },
                { label: "CNPJ", value: selectedLic.cnpj },
                { label: "UASG", value: selectedLic.uasg },
                { label: "Ranking CAPAG", value: selectedLic.rankingCapag },
                { label: "SRP", value: selectedLic.srpDescricao },
                {
                  label: "Valor Total Estimado",
                  value: formatBRL((selectedLic.valorTotalEstimado as number) || 0),
                  highlight: "text-emerald-400 font-bold",
                },
                {
                  label: "Publicação",
                  value: `${formatDate(selectedLic.dataPublicacao as string).date} ${formatDate(selectedLic.dataPublicacao as string).time}`,
                },
                {
                  label: "Prazo Proposta",
                  value: `${formatDate(selectedLic.dataFinalProposta as string).date} ${formatDate(selectedLic.dataFinalProposta as string).time}`,
                  highlight: "text-amber-400 font-semibold",
                },
                { label: "Perfil", value: selectedLic.perfilNome },
              ].map(({ label, value, highlight }) => (
                <div key={label}>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</div>
                  <div className={`text-sm ${highlight || "text-slate-300"}`}>{String(value || "—")}</div>
                </div>
              ))}
              <div className="col-span-2">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Palavras-chave</div>
                <div className="text-sm text-slate-300">{((selectedLic.palavraEncontrada as string[]) || []).join(", ") || "—"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Objeto</div>
                <div className="text-xs text-slate-300 leading-relaxed">{String(selectedLic.objetoSemTags || selectedLic.objeto || "—")}</div>
              </div>
              {(selectedLic.url as string | undefined) && (
                <div className="col-span-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">URL do Portal</div>
                  <a href={selectedLic.url as string} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline break-all">
                    {selectedLic.url as string}
                  </a>
                </div>
              )}
            </div>

            {((selectedLic.itensEdital as unknown[]) || []).length > 0 && (
              <div className="border-t border-slate-700 pt-5 mb-5">
                <h4 className="text-sm font-semibold text-slate-200 mb-3">
                  Itens do Edital ({((selectedLic.itensEdital as unknown[]) || []).length})
                </h4>
                <div className="space-y-2">
                  {((selectedLic.itensEdital as Record<string, unknown>[]) || []).map((item, i) => (
                    <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-300">
                          Item {item.item as number} {item.lote ? `· Lote ${item.lote}` : ""}
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.quantidade as number} {item.unidade as string} · Unit: {formatBRL((item.valorUnitarioEstimado as number) || 0)} · Total:{" "}
                          <strong className="text-emerald-400">{formatBRL((item.valorTotalEstimado as number) || 0)}</strong>
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 leading-relaxed">
                        {String(item.produtoLicitadoSemTags || item.produtoLicitado || "—")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {((selectedLic.anexos as unknown[]) || []).length > 0 && (
              <div className="border-t border-slate-700 pt-5">
                <h4 className="text-sm font-semibold text-slate-200 mb-3">
                  Anexos ({((selectedLic.anexos as unknown[]) || []).length})
                </h4>
                <ul className="space-y-1.5">
                  {((selectedLic.anexos as Record<string, unknown>[]) || []).map((a, i) => (
                    <li key={i}>
                      <a href={a.url as string} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                        📄 {a.nome as string}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
