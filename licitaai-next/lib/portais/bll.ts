// lib/portais/bll.ts
// Integração BLL Compras (bllcompras.com) — scraping HTML público
// Endpoint: GET /Process/ProcessSearchPublic?param1=0
// Retorna até 100 licitações mais recentes sem autenticação
// Campos disponíveis: orgao, numero, modalidade, cidade-UF, situacao, data_publicacao, data_disputa
// Objeto e valor NÃO estão disponíveis na listagem pública

const BLL_URL = "https://bllcompras.com/Process/ProcessSearchPublic?param1=0"
const BLL_BASE = "https://bllcompras.com"

export type BllLicitacao = {
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

export type FetchBllResult = {
  licitacoes: BllLicitacao[]
  total: number
  erros: string[]
}

// Converte "DD/MM/YYYY HH:mm" → ISO string ou null
function parseBllDate(val: string): string | null {
  if (!val || !val.trim()) return null
  // "12/05/2026 17:34"
  const m = val.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/)
  if (!m) return null
  const [, dd, mm, yyyy, hh, min] = m
  const d = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

// Decodifica entidades HTML básicas
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

// Extrai texto limpo de um fragmento HTML de célula <td>
function tdText(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
}

// Extrai href de um <td> com link
function tdHref(html: string): string | null {
  const m = html.match(/href="([^"]+)"/)
  return m ? m[1] : null
}

// Extrai UF do formato "CIDADE-UF" ou "CIDADE-UF-COMPLEMENTO"
function parseCidadeUf(cidadeUf: string): { municipio: string; uf: string | null } {
  const parts = cidadeUf.split("-")
  if (parts.length < 2) return { municipio: cidadeUf, uf: null }
  const uf = parts[parts.length - 1].trim().toUpperCase()
  const municipio = parts.slice(0, parts.length - 1).join("-").trim()
  // Validar que UF é 2 letras
  return { municipio, uf: /^[A-Z]{2}$/.test(uf) ? uf : null }
}

function parseHtml(html: string, agora: Date): { licitacoes: BllLicitacao[]; erros: string[] } {
  const licitacoes: BllLicitacao[] = []
  const erros: string[] = []

  // Extrair tbody de dados
  const tbodyMatch = html.match(/id="tableProcessDataBody"[^>]*>([\s\S]*?)<\/tbody>/i)
  if (!tbodyMatch) {
    erros.push("BLL: tbody#tableProcessDataBody não encontrado")
    return { licitacoes, erros }
  }

  const tbody = tbodyMatch[1]

  // Extrair todas as <tr>
  const trMatches = [...tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]

  for (const trMatch of trMatches) {
    const trHtml = trMatch[1]

    // Extrair <td> individuais
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

    const sourceUrl = `${BLL_BASE}${linkHref}`
    // source_id baseado na URL do processo (param1 é único por processo)
    const paramMatch = linkHref.match(/param1=(.+)$/)
    const sourceId = paramMatch ? `bll-${decodeURIComponent(paramMatch[1]).slice(0, 60)}` : `bll-${numero}`

    licitacoes.push({
      source_id:         sourceId,
      portal:            "BLL",
      orgao,
      objeto:            numero ? `Processo ${numero}` : null,
      valor_estimado:    null,
      modalidade,
      uf,
      municipio:         municipio || null,
      data_publicacao:   parseBllDate(dataPublicacaoRaw),
      data_abertura:     null,
      data_encerramento: parseBllDate(dataDisputaRaw),
      source_url:        sourceUrl,
      numero_processo:   numero,
      status:            "ativa",
      updated_at:        agora.toISOString(),
    })
  }

  return { licitacoes, erros }
}

export async function fetchBll(): Promise<FetchBllResult> {
  const agora = new Date()

  let html: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)
    const res = await fetch(BLL_URL, {
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
      return { licitacoes: [], total: 0, erros: [`BLL: HTTP ${res.status}`] }
    }

    html = await res.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { licitacoes: [], total: 0, erros: [`BLL: fetch falhou — ${msg}`] }
  }

  const { licitacoes, erros } = parseHtml(html, agora)

  return {
    licitacoes,
    total: licitacoes.length,
    erros,
  }
}
