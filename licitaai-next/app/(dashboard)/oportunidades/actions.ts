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

// ─── Scoring engine ───────────────────────────────────────────────────────────

function calcularScore(
  empresa: Empresa,
  lic: NormalizedLicitacao
): { score: number; motivo: string } {
  const texto = normalizar(`${lic.objetoSemTags} ${lic.objeto}`)

  // 1. CNAE → keywords no objeto (90–100)
  const cnaeMatches: string[] = []
  for (const cnae of empresa.cnae ?? []) {
    const division = cnae.replace(/\D/g, "").substring(0, 2)
    for (const kw of CNAE_MAP[division] ?? []) {
      if (texto.includes(normalizar(kw))) cnaeMatches.push(kw)
    }
  }
  if (cnaeMatches.length > 0) {
    return {
      score: Math.min(100, 90 + cnaeMatches.length * 2),
      motivo: `CNAE compatível: ${cnaeMatches.slice(0, 2).join(", ")}`,
    }
  }

  // 2. Keywords da razão social no objeto (70–89)
  const stopwords = new Set([
    "ltda", "eireli", "me", "epp", "sa", "sas", "de", "da", "do", "dos",
    "das", "em", "para", "com", "por", "comercio", "servicos", "servico",
    "empresa", "industria", "comercial", "nacional",
  ])
  const razaoTokens = normalizar(empresa.razao_social)
    .split(/[\s\-\/\.&,]+/)
    .filter((w) => w.length > 4 && !stopwords.has(w))

  const kwMatches = razaoTokens.filter((w) => texto.includes(w))
  if (kwMatches.length > 0) {
    return {
      score: Math.min(89, 70 + kwMatches.length * 5),
      motivo: `Termos da empresa encontrados: "${kwMatches.slice(0, 2).join('", "')}"`,
    }
  }

  // 3. Modalidade × porte (50–69)
  const mod = normalizar(lic.modalidade ?? "")
  const modSimples = ["dispensa", "inexigibilidade", "pregao eletronico", "credenciamento"]
  const modGrandes = ["concorrencia", "rdc", "dialogo competitivo", "leilao"]
  const isSimples = modSimples.some((m) => mod.includes(normalizar(m)))
  const isGrande = modGrandes.some((m) => mod.includes(normalizar(m)))

  if (["MEI", "ME", "EPP"].includes(empresa.porte) && isSimples) {
    return {
      score: 60,
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
    return { score: 55, motivo: `Modalidade identificada: ${lic.modalidade}` }
  }

  return { score: 30, motivo: "Sem correspondência específica com o perfil" }
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Excelente"
  if (score >= 80) return "Ótimo"
  if (score >= 70) return "Bom"
  if (score >= 60) return "Regular"
  return "Baixo"
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

  const result = await fetchEffectiLicitacoes({ begin, end, pagina: 0 })
  if (result.error) return { oportunidades: [], analisadas: 0, error: result.error }

  const analisadas = result.licitacoes.length

  const oportunidades: Oportunidade[] = result.licitacoes
    .map((lic) => {
      const { score, motivo } = calcularScore(empresa, lic)
      return { ...lic, score, scoreLabel: scoreLabel(score), motivo }
    })
    .filter((o) => o.score >= 50)
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
      user_id: user.id,
    },
    { onConflict: "company_id,licitacao_id" }
  )

  if (error) return { error: "Erro ao salvar: " + error.message }
  revalidatePath("/oportunidades")
  return { success: true }
}
