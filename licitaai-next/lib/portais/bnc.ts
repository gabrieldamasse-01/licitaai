// lib/portais/bnc.ts
// Integração BNC — Bolsa Nacional de Compras (bnccompras.com) — scraping HTML público
// Endpoint: GET /Process/ProcessSearchPublic?param1=0
// Retorna até 100 licitações mais recentes sem autenticação
// Mesma plataforma que BLL — estrutura HTML idêntica

const BNC_URL = "https://bnccompras.com/Process/ProcessSearchPublic?param1=0"
const BNC_BASE = "https://bnccompras.com"

export type BncLicitacao = {
  source_id: string
  portal: string
  orgao: string | null
  objeto: string | null
  valor_estimado: null
  modalidade: string | null
  uf: string | null
  municipio: string | null
  data_publicacao: string | null
  data_abertura: null
  data_encerramento: string | null
  source_url: string
  numero_processo: string | null
  status: string
  updated_at: string
}

export type FetchBncResult = {
  licitacoes: BncLicitacao[]
  total: number
  erros: string[]
}

// Converte "DD/MM/YYYY HH:mm" → ISO string ou null
function parseBncDate(val: string): string | null {
  if (!val || !val.trim()) return null
  const m = val.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/)
  if (!m) return null
  const [, dd, mm, yyyy, hh, min] = m
  const d = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function decodeHtml(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim()
}

function tdText(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
}

function tdHref(html: string): string | null {
  const m = html.match(/href="([^"]+)"/)
  return m ? m[1] : null
}

function parseCidadeUf(cidadeUf: string): { municipio: string; uf: string | null } {
  const parts = cidadeUf.split("-")
  if (parts.length < 2) return { municipio: cidadeUf, uf: null }
  const uf = parts[parts.length - 1].trim().toUpperCase()
  const municipio = parts.slice(0, parts.length - 1).join("-").trim()
  return { municipio, uf: /^[A-Z]{2}$/.test(uf) ? uf : null }
}

function parseHtml(html: string, agora: Date): { licitacoes: BncLicitacao[]; erros: string[] } {
  const licitacoes: BncLicitacao[] = []
  const erros: string[] = []

  const tbodyMatch = html.match(/id="tableProcessDataBody"[^>]*>([\s\S]*?)<\/tbody>/i)
  if (!tbodyMatch) {
    erros.push("BNC: tbody#tableProcessDataBody não encontrado")
    return { licitacoes, erros }
  }

  const tbody = tbodyMatch[1]
  const trMatches = [...tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]

  for (const trMatch of trMatches) {
    const trHtml = trMatch[1]
    const tds = [...trHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1])
    if (tds.length < 8) continue

    const linkHref = tdHref(tds[0])
    if (!linkHref) continue

    const orgao = tdText(tds[1]) || null
    const numero = tdText(tds[2]) || null
    const modalidade = tdText(tds[3]) || null
    const cidadeUfRaw = tdText(tds[4])
    const dataPublicacaoRaw = tdText(tds[6])
    const dataDisputaRaw = tdText(tds[7])

    const { municipio, uf } = parseCidadeUf(cidadeUfRaw)

    const sourceUrl = `${BNC_BASE}${linkHref}`
    const paramMatch = linkHref.match(/param1=(.+)$/)
    const sourceId = paramMatch ? `bnc-${decodeURIComponent(paramMatch[1]).slice(0, 60)}` : `bnc-${numero}`

    licitacoes.push({
      source_id:         sourceId,
      portal:            "BNC",
      orgao,
      objeto:            numero ? `Processo ${numero}` : null,
      valor_estimado:    null,
      modalidade,
      uf,
      municipio:         municipio || null,
      data_publicacao:   parseBncDate(dataPublicacaoRaw),
      data_abertura:     null,
      data_encerramento: parseBncDate(dataDisputaRaw),
      source_url:        sourceUrl,
      numero_processo:   numero,
      status:            "ativa",
      updated_at:        agora.toISOString(),
    })
  }

  return { licitacoes, erros }
}

export async function fetchBnc(): Promise<FetchBncResult> {
  const agora = new Date()

  let html: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    const res = await fetch(BNC_URL, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return { licitacoes: [], total: 0, erros: [`BNC: HTTP ${res.status}`] }
    }

    html = await res.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { licitacoes: [], total: 0, erros: [`BNC: fetch falhou — ${msg}`] }
  }

  const { licitacoes, erros } = parseHtml(html, agora)

  return {
    licitacoes,
    total: licitacoes.length,
    erros,
  }
}
