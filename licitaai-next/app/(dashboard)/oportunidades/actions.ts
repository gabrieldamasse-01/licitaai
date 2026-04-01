"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { fetchEffectiLicitacoes, type NormalizedLicitacao } from "@/lib/effecti"

// ─── Types ────────────────────────────────────────────────────────────────────

export type Empresa = {
  id: string
  razao_social: string
  cnpj: string
  porte: string
  cnae: string[]
}

export type Oportunidade = NormalizedLicitacao & {
  score: number
  scoreLabel: string
  motivo: string
}

// ─── CNAE division (2 digits) → keywords para match no objeto da licitação ───

const CNAE_MAP: Record<string, string[]> = {
  "01": ["agropecuária", "agricultura", "pecuária", "bovino", "lavoura", "grão"],
  "02": ["florestal", "madeira", "reflorestamento"],
  "03": ["aquicultura", "pesca"],
  "10": ["alimento", "bebida", "alimentício"],
  "13": ["têxtil", "tecido", "uniforme", "fio"],
  "14": ["vestuário", "roupa", "uniforme", "confecção"],
  "16": ["madeira", "móvel", "carpintaria"],
  "17": ["papel", "celulose", "papelão"],
  "18": ["gráfica", "impressão", "impresso"],
  "20": ["químico", "detergente", "produto de limpeza"],
  "21": ["farmacêutico", "medicamento", "remédio"],
  "22": ["borracha", "plástico"],
  "23": ["vidro", "cerâmica", "concreto", "cimento"],
  "24": ["metálurgico", "siderúrgico", "aço"],
  "25": ["metal", "estrutura metálica", "ferragem"],
  "26": ["eletrônico", "computador", "equipamento eletrônico"],
  "27": ["elétrico", "motor", "gerador", "transformador"],
  "28": ["máquina", "equipamento", "maquinário"],
  "29": ["veículo", "automóvel", "caminhão"],
  "33": ["manutenção", "reparação", "instalação"],
  "41": ["construção", "obra", "edificação", "edifício"],
  "42": ["infraestrutura", "estrada", "rodovia", "saneamento", "pavimentação"],
  "43": ["reforma", "instalação elétrica", "hidráulica", "pintura", "revestimento"],
  "45": ["veículo", "combustível", "autopeça"],
  "46": ["atacado", "distribuição"],
  "47": ["varejista", "supermercado", "farmácia", "material"],
  "49": ["transporte terrestre", "frete", "carga"],
  "52": ["armazenagem", "logística", "depósito"],
  "55": ["hotel", "hospedagem", "pousada", "alojamento"],
  "56": ["alimentação", "refeição", "restaurante", "fornecimento de refeições"],
  "61": ["telecomunicação", "telefonia", "internet"],
  "62": ["tecnologia", "software", "sistema", "informática", "desenvolvimento"],
  "63": ["dados", "hospedagem", "plataforma digital"],
  "68": ["imóvel", "locação", "imobiliário"],
  "71": ["engenharia", "arquitetura", "projeto", "topografia"],
  "72": ["pesquisa", "desenvolvimento"],
  "73": ["publicidade", "marketing", "comunicação", "propaganda"],
  "74": ["design", "fotografia", "tradução"],
  "75": ["veterinário", "animal"],
  "77": ["locação", "aluguel", "equipamento"],
  "78": ["mão de obra", "trabalhador", "serviço temporário"],
  "79": ["viagem", "turismo", "agência de viagem"],
  "80": ["segurança", "vigilância", "monitoramento"],
  "81": ["limpeza", "higienização", "zeladoria", "conservação"],
  "82": ["escritório", "apoio administrativo", "call center", "reprografia"],
  "85": ["educação", "ensino", "treinamento", "capacitação", "curso"],
  "86": ["saúde", "médico", "hospital", "clínica", "odontológico"],
  "87": ["assistência residencial"],
  "88": ["assistência social"],
  "90": ["cultural", "arte", "espetáculo", "entretenimento"],
  "93": ["esporte", "recreação", "academia"],
  "95": ["manutenção", "reparo", "conserto"],
  "96": ["lavanderia", "higiene pessoal"],
}

function normalizar(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

const STOPWORDS = new Set([
  "ltda", "eireli", "me", "epp", "sa", "sas", "de", "da", "do", "dos",
  "das", "em", "para", "com", "por", "comercio", "servicos", "servico",
  "empresa", "industria", "comercial", "nacional",
])

// ─── Extração de keywords do perfil da empresa ────────────────────────────────

function extrairKeywords(empresa: Empresa): string[] {
  const keywords = new Set<string>()

  // 1. Keywords dos CNAEs via CNAE_MAP
  for (const cnae of empresa.cnae ?? []) {
    const division = cnae.replace(/\D/g, "").substring(0, 2)
    for (const kw of CNAE_MAP[division] ?? []) {
      keywords.add(kw)
    }
  }

  // 2. Tokens significativos da razão social
  for (const token of normalizar(empresa.razao_social)
    .split(/[\s\-\/\.&,]+/)
    .filter((w) => w.length > 4 && !STOPWORDS.has(w))) {
    keywords.add(token)
  }

  return Array.from(keywords)
}

// ─── Scoring engine ───────────────────────────────────────────────────────────

function calcularScore(
  empresa: Empresa,
  lic: NormalizedLicitacao
): { score: number; motivo: string } {
  const texto = normalizar(`${lic.objetoSemTags} ${lic.objeto}`)

  // 1. keyword exata do CNAE aparece no texto (95)
  for (const cnae of empresa.cnae ?? []) {
    const division = cnae.replace(/\D/g, "").substring(0, 2)
    const kws = CNAE_MAP[division] ?? []
    const exatas = kws.filter((kw) => texto.includes(normalizar(kw)))
    if (exatas.length > 0) {
      return {
        score: Math.min(100, 95 + exatas.length - 1),
        motivo: `CNAE exato: "${exatas.slice(0, 2).join('", "')}"`,
      }
    }
  }

  // 2. keyword parcial do CNAE (85) — qualquer token da keyword aparece
  for (const cnae of empresa.cnae ?? []) {
    const division = cnae.replace(/\D/g, "").substring(0, 2)
    const kws = CNAE_MAP[division] ?? []
    const parciais = kws.flatMap((kw) =>
      kw.split(" ").filter((part) => part.length > 3 && texto.includes(normalizar(part)))
    )
    if (parciais.length > 0) {
      return {
        score: Math.min(94, 85 + parciais.length - 1),
        motivo: `CNAE parcial: "${[...new Set(parciais)].slice(0, 2).join('", "')}"`,
      }
    }
  }

  // 3. CNAE numérico aparece no texto (75)
  for (const cnae of empresa.cnae ?? []) {
    const numerico = cnae.replace(/\D/g, "").substring(0, 4)
    if (numerico.length >= 4 && texto.includes(numerico)) {
      return {
        score: 75,
        motivo: `Código CNAE ${numerico} encontrado no objeto`,
      }
    }
  }

  // 4. Tokens da razão social no objeto (70)
  const razaoTokens = normalizar(empresa.razao_social)
    .split(/[\s\-\/\.&,]+/)
    .filter((w) => w.length > 4 && !STOPWORDS.has(w))
  const kwMatches = razaoTokens.filter((w) => texto.includes(w))
  if (kwMatches.length > 0) {
    return {
      score: Math.min(74, 70 + kwMatches.length - 1),
      motivo: `Termos da empresa: "${kwMatches.slice(0, 2).join('", "')}"`,
    }
  }

  // 5. Modalidade compatível com porte (65)
  const mod = normalizar(lic.modalidade ?? "")
  const modSimples = ["dispensa", "inexigibilidade", "pregao eletronico", "credenciamento"]
  const modGrandes = ["concorrencia", "rdc", "dialogo competitivo", "leilao"]
  const isSimples = modSimples.some((m) => mod.includes(normalizar(m)))
  const isGrande = modGrandes.some((m) => mod.includes(normalizar(m)))

  if (["MEI", "ME", "EPP"].includes(empresa.porte) && isSimples) {
    return {
      score: 65,
      motivo: `Modalidade ${lic.modalidade} favorável para empresas de pequeno porte`,
    }
  }
  if (["MEDIO", "GRANDE"].includes(empresa.porte) && (isGrande || isSimples)) {
    return {
      score: 65,
      motivo: `Modalidade ${lic.modalidade} compatível com porte ${empresa.porte}`,
    }
  }
  if (isSimples || isGrande) {
    return { score: 60, motivo: `Modalidade identificada: ${lic.modalidade}` }
  }

  return { score: 30, motivo: "Sem correspondência específica com o perfil" }
}

function scoreLabel(score: number): string {
  if (score >= 95) return "Excelente"
  if (score >= 85) return "Ótimo"
  if (score >= 75) return "Bom"
  if (score >= 65) return "Regular"
  return "Baixo"
}

// ─── Checklist de habilitação ─────────────────────────────────────────────────

export type ChecklistItem = {
  nome: string
  status: "ok" | "vencendo" | "vencido" | "faltando"
  validade: string | null
  nome_arquivo: string | null
}

const DOCS_OBRIGATORIOS: { nome: string; keywords: string[] }[] = [
  {
    nome: "CND Federal",
    keywords: ["cnd federal", "certidao negativa federal", "debitos federais", "receita federal"],
  },
  {
    nome: "CND Estadual",
    keywords: ["cnd estadual", "certidao negativa estadual", "debito estadual"],
  },
  {
    nome: "CND Municipal",
    keywords: ["cnd municipal", "certidao negativa municipal", "debito municipal", "iss"],
  },
  {
    nome: "Certificado de Regularidade FGTS",
    keywords: ["fgts", "regularidade fgts", "crf fgts"],
  },
  {
    nome: "CNDT",
    keywords: ["cndt", "debitos trabalhistas", "trabalhista"],
  },
  {
    nome: "Contrato Social / Estatuto",
    keywords: ["contrato social", "estatuto", "ato constitutivo", "registro"],
  },
  {
    nome: "Procuração",
    keywords: ["procuracao", "procurador"],
  },
]

function normStr(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export async function buscarChecklistDocumentos(empresaId: string): Promise<{
  itens: ChecklistItem[]
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { itens: [], error: "Não autenticado" }

  const { data: empresa } = await supabase
    .from("companies")
    .select("id")
    .eq("id", empresaId)
    .eq("user_id", user.id)
    .single()
  if (!empresa) return { itens: [], error: "Empresa não encontrada" }

  const { data: docs } = await supabase
    .from("documents")
    .select("tipo, status, data_validade, nome_arquivo")
    .eq("company_id", empresaId)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const em30 = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

  const itens: ChecklistItem[] = DOCS_OBRIGATORIOS.map(({ nome, keywords }) => {
    const match = (docs ?? []).find((d) => {
      const tipoNorm = normStr(d.tipo)
      return keywords.some((kw) => tipoNorm.includes(normStr(kw)))
    })

    if (!match) return { nome, status: "faltando", validade: null, nome_arquivo: null }

    const validade = match.data_validade
      ? new Date(match.data_validade + "T00:00:00")
      : null

    if (match.status === "vencido" || (validade && validade < hoje)) {
      return { nome, status: "vencido", validade: match.data_validade, nome_arquivo: match.nome_arquivo }
    }
    if (validade && validade <= em30) {
      return { nome, status: "vencendo", validade: match.data_validade, nome_arquivo: match.nome_arquivo }
    }
    return { nome, status: "ok", validade: match.data_validade, nome_arquivo: match.nome_arquivo }
  })

  return { itens }
}

// ─── Server actions ───────────────────────────────────────────────────────────

export async function buscarOportunidades(empresaId: string): Promise<{
  oportunidades: Oportunidade[]
  analisadas: number
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { oportunidades: [], analisadas: 0, error: "Não autenticado" }

  const { data: empresa } = await supabase
    .from("companies")
    .select("id, razao_social, cnpj, porte, cnae")
    .eq("id", empresaId)
    .eq("user_id", user.id)
    .single()

  if (!empresa) return { oportunidades: [], analisadas: 0, error: "Empresa não encontrada" }

  // Janela de 5 dias (máximo permitido pela Effecti)
  const hoje = new Date()
  const end = `${hoje.toISOString().split("T")[0]}T23:59:59`
  const inicio = new Date(hoje.getTime() - 4 * 24 * 60 * 60 * 1000)
  const begin = `${inicio.toISOString().split("T")[0]}T00:00:00`

  const palavrasChave = extrairKeywords(empresa)

  const result = await fetchEffectiLicitacoes({ begin, end, pagina: 0, palavrasChave })
  if (result.error) return { oportunidades: [], analisadas: 0, error: result.error }

  const analisadas = result.licitacoes.length

  const oportunidades: Oportunidade[] = result.licitacoes
    .map((lic) => {
      const { score, motivo } = calcularScore(empresa, lic)
      return { ...lic, score, scoreLabel: scoreLabel(score), motivo }
    })
    .filter((o) => o.score >= 60)
    .sort((a, b) => b.score - a.score)

  return { oportunidades, analisadas }
}

export async function salvarOportunidade(
  empresaId: string,
  licitacao: NormalizedLicitacao,
  score: number
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("matches").upsert(
    {
      company_id: empresaId,
      licitacao_id: String(licitacao.idLicitacao),
      relevancia_score: score,
      status: "nova",
    },
    { onConflict: "company_id,licitacao_id" }
  )

  if (error) return { error: "Erro ao salvar: " + error.message }
  revalidatePath("/oportunidades")
  return { success: true }
}
