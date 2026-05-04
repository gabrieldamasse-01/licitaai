import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const DOCS_OBRIGATORIOS: { nome: string; keywords: string[] }[] = [
  { nome: "CND Federal", keywords: ["cnd federal", "certidao negativa federal", "debitos federais", "receita federal"] },
  { nome: "CND Estadual", keywords: ["cnd estadual", "certidao negativa estadual", "debito estadual"] },
  { nome: "CND Municipal", keywords: ["cnd municipal", "certidao negativa municipal", "debito municipal", "iss"] },
  { nome: "Certificado FGTS", keywords: ["fgts", "regularidade fgts", "crf fgts"] },
  { nome: "CNDT", keywords: ["cndt", "debitos trabalhistas", "trabalhista"] },
  { nome: "Contrato Social", keywords: ["contrato social", "estatuto", "ato constitutivo", "registro"] },
  { nome: "Procuração", keywords: ["procuracao", "procurador"] },
]

function normStr(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function contarDocsValidos(docs: { tipo: string; status: string; data_validade: string | null }[], hoje: Date): number {
  return DOCS_OBRIGATORIOS.reduce((count, { keywords }) => {
    const match = docs.find((d) =>
      keywords.some((kw) => normStr(d.tipo).includes(normStr(kw)))
    )
    if (!match) return count
    const v = match.data_validade ? new Date(match.data_validade + "T00:00:00") : null
    return match.status !== "vencido" && (!v || v >= hoje) ? count + 1 : count
  }, 0)
}

function formatDate(s: string | null): string {
  if (!s) return "—"
  return new Date(s + "T00:00:00").toLocaleDateString("pt-BR")
}

function formatCurrency(v: number | null): string {
  if (!v) return "—"
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const hojeStr = hoje.toISOString().split("T")[0]
  const em30 = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
  const em30Str = em30.toISOString().split("T")[0]
  const sixMonthsAgo = new Date(hoje)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)

  const [companiesRes, docsRes, matchesRes, top10Res, encerrando30Res] = await Promise.all([
    supabase.from("companies").select("id, razao_social").eq("user_id", user.id).eq("ativo", true).order("razao_social"),
    supabase.from("documents").select("id, company_id, tipo, status, data_validade"),
    supabase.from("matches").select("id, created_at, company_id").gte("created_at", sixMonthsAgo.toISOString()),
    supabase.from("matches").select("id, created_at, company_id, licitacoes(objeto, orgao, uf, valor_estimado, data_encerramento, status)").order("created_at", { ascending: false }).limit(10),
    supabase.from("licitacoes").select("id, objeto, orgao, uf, valor_estimado, data_encerramento, status").gte("data_encerramento", hojeStr).lte("data_encerramento", em30Str).order("data_encerramento", { ascending: true }).limit(20),
  ])

  const companies = companiesRes.data ?? []
  const companyIds = companies.map((c) => c.id)
  const docs = (docsRes.data ?? []).filter((d) => companyIds.includes(d.company_id))
  const matches = (matchesRes.data ?? []).filter((m) => companyIds.includes(m.company_id))
  const top10 = (top10Res.data ?? []).filter((m) => companyIds.includes(m.company_id))
  const encerrando30 = encerrando30Res.data ?? []

  // Métricas
  const docsValidos = docs.filter((d) => {
    const v = d.data_validade ? new Date(d.data_validade + "T00:00:00") : null
    return d.status !== "vencido" && (!v || v >= hoje)
  }).length

  const empresasCompletas = companies.filter((c) => {
    const compDocs = docs.filter((d) => d.company_id === c.id)
    return contarDocsValidos(compDocs, hoje) === DOCS_OBRIGATORIOS.length
  }).length
  const taxaHabilitacao = companies.length > 0 ? Math.round((empresasCompletas / companies.length) * 100) : 0

  // Oportunidades por mês (últimos 6)
  const matchesPorMes: Record<string, number> = {}
  for (const m of matches) {
    const d = new Date(m.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    matchesPorMes[key] = (matchesPorMes[key] ?? 0) + 1
  }
  const mesesData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje)
    d.setMonth(d.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const mes = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    return { mes, quantidade: matchesPorMes[key] ?? 0 }
  })

  const dataGeracaoStr = hoje.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Mensal LicitaAI</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #1a1a2e; font-size: 13px; line-height: 1.5; }
  .page { max-width: 900px; margin: 0 auto; padding: 40px 48px; }
  /* Header */
  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 24px; border-bottom: 2px solid #1A5276; margin-bottom: 28px; }
  .logo { font-size: 22px; font-weight: 800; color: #1A5276; letter-spacing: -0.5px; }
  .logo span { color: #2E86C1; }
  .header-right { text-align: right; }
  .header-title { font-size: 16px; font-weight: 700; color: #1a1a2e; }
  .header-sub { font-size: 11px; color: #666; margin-top: 2px; }
  /* Seção */
  .section { margin-bottom: 28px; }
  .section-title { font-size: 14px; font-weight: 700; color: #1A5276; border-left: 4px solid #2E86C1; padding-left: 10px; margin-bottom: 12px; }
  /* Empresas */
  .empresas-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .empresa-badge { background: #EBF5FB; border: 1px solid #AED6F1; color: #1A5276; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  /* Cards de resumo */
  .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .card { background: #F4F6F7; border: 1px solid #D5D8DC; border-radius: 8px; padding: 14px; text-align: center; }
  .card-value { font-size: 26px; font-weight: 800; color: #1A5276; }
  .card-label { font-size: 10px; color: #777; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  /* Tabelas */
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #1A5276; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; }
  td { padding: 7px 10px; border-bottom: 1px solid #eee; color: #333; }
  tr:nth-child(even) td { background: #F8F9FA; }
  /* Gráfico tabela */
  .bar-wrap { display: flex; align-items: center; gap: 8px; }
  .bar { height: 14px; background: #2E86C1; border-radius: 3px; min-width: 2px; }
  .bar-label { font-size: 12px; font-weight: 600; color: #1A5276; }
  /* Rodapé */
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; }
  .footer-left { font-size: 11px; color: #888; }
  .footer-right { font-size: 11px; color: #888; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 20px 28px; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="logo">Licita<span>AI</span></div>
    <div class="header-right">
      <div class="header-title">Relatorio Mensal de Oportunidades</div>
      <div class="header-sub">Gerado em ${dataGeracaoStr}</div>
    </div>
  </div>

  <!-- Empresas -->
  <div class="section">
    <div class="section-title">Empresas Monitoradas</div>
    <div class="empresas-list">
      ${companies.length > 0
        ? companies.map((c) => `<span class="empresa-badge">${c.razao_social}</span>`).join("")
        : `<span style="color:#999;font-size:12px;">Nenhuma empresa cadastrada</span>`}
    </div>
  </div>

  <!-- Cards de resumo -->
  <div class="section">
    <div class="section-title">Resumo Executivo</div>
    <div class="cards">
      <div class="card">
        <div class="card-value">${matches.length}</div>
        <div class="card-label">Oportunidades Salvas</div>
      </div>
      <div class="card">
        <div class="card-value">${docsValidos}</div>
        <div class="card-label">Documentos Validos</div>
      </div>
      <div class="card">
        <div class="card-value">${taxaHabilitacao}%</div>
        <div class="card-label">Taxa de Habilitacao</div>
      </div>
      <div class="card">
        <div class="card-value">${companies.length}</div>
        <div class="card-label">Empresas Ativas</div>
      </div>
    </div>
  </div>

  <!-- Gráfico por mês -->
  <div class="section">
    <div class="section-title">Oportunidades por Mes (Ultimos 6 Meses)</div>
    <table>
      <thead><tr><th>Mes</th><th>Quantidade</th><th style="width:220px">Grafico</th></tr></thead>
      <tbody>
        ${mesesData.map((m) => {
          const maxQ = Math.max(...mesesData.map((x) => x.quantidade), 1)
          const barW = Math.round((m.quantidade / maxQ) * 180)
          return `<tr>
            <td>${m.mes}</td>
            <td style="font-weight:700;color:#1A5276">${m.quantidade}</td>
            <td><div class="bar-wrap"><div class="bar" style="width:${barW}px"></div></div></td>
          </tr>`
        }).join("")}
      </tbody>
    </table>
  </div>

  <!-- Top 10 oportunidades -->
  <div class="section">
    <div class="section-title">Top 10 Oportunidades Salvas</div>
    ${top10.length === 0
      ? `<p style="color:#999;font-size:12px;">Nenhuma oportunidade salva ainda.</p>`
      : `<table>
          <thead>
            <tr>
              <th>#</th>
              <th>Objeto</th>
              <th>Orgao</th>
              <th>UF</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${top10.map((m, i) => {
              const lic = Array.isArray(m.licitacoes) ? m.licitacoes[0] : m.licitacoes
              const objeto = lic?.objeto ?? "—"
              const orgao = lic?.orgao ?? "—"
              const uf = lic?.uf ?? "—"
              const valor = formatCurrency(lic?.valor_estimado ?? null)
              const status = lic?.status ?? "—"
              return `<tr>
                <td style="color:#999">${i + 1}</td>
                <td style="max-width:200px">${objeto.length > 80 ? objeto.slice(0, 80) + "…" : objeto}</td>
                <td>${orgao.length > 40 ? orgao.slice(0, 40) + "…" : orgao}</td>
                <td>${uf}</td>
                <td style="font-weight:600;color:#1A5276">${valor}</td>
                <td>${status}</td>
              </tr>`
            }).join("")}
          </tbody>
        </table>`}
  </div>

  <!-- Licitações encerrando em 30 dias -->
  <div class="section">
    <div class="section-title">Licitacoes Encerrando nos Proximos 30 Dias</div>
    ${encerrando30.length === 0
      ? `<p style="color:#999;font-size:12px;">Nenhuma licitacao com encerramento previsto nos proximos 30 dias.</p>`
      : `<table>
          <thead>
            <tr><th>Objeto</th><th>Orgao</th><th>UF</th><th>Valor</th><th>Encerramento</th></tr>
          </thead>
          <tbody>
            ${encerrando30.map((l) => `<tr>
              <td>${(l.objeto ?? "—").length > 80 ? (l.objeto ?? "").slice(0, 80) + "…" : (l.objeto ?? "—")}</td>
              <td>${(l.orgao ?? "—").length > 40 ? (l.orgao ?? "").slice(0, 40) + "…" : (l.orgao ?? "—")}</td>
              <td>${l.uf ?? "—"}</td>
              <td style="font-weight:600;color:#1A5276">${formatCurrency(l.valor_estimado)}</td>
              <td style="font-weight:700;color:#C0392B">${formatDate(l.data_encerramento)}</td>
            </tr>`).join("")}
          </tbody>
        </table>`}
  </div>

  <!-- Rodapé -->
  <div class="footer">
    <div class="footer-left">Gerado pelo LicitaAI em ${dataGeracaoStr}</div>
    <div class="footer-right">&copy; ${hoje.getFullYear()} LicitaAI — Todos os direitos reservados</div>
  </div>
</div>
<script>window.print()</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}
