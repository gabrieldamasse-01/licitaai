/**
 * Motor de scoring empresa × licitação.
 * Função pura — sem efeitos colaterais, sem I/O, sem dependências externas.
 * Pode ser importada em Server Actions, Edge Functions e testes unitários.
 *
 * Pontuação máxima: 100 pts
 * Dimensões:
 *   1. CNAE exato no objeto         → 95–100 pts
 *   2. CNAE parcial no objeto        → 85–94 pts
 *   3. Código CNAE numérico          → 75 pts
 *   4. Tokens da razão social        → 70–74 pts
 *   5. Compatibilidade de modalidade → 60–65 pts
 *   6. Sem correspondência           → 30 pts
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type EmpresaInput = {
  razao_social: string
  porte: string
  cnae: string[]
  /** Proporção de documentos gerais válidos (0–1). Undefined = não calculado. */
  docs_gerais_pct?: number
  /** true se empresa possui todos os docs de nicho aplicáveis válidos */
  docs_nicho_ok?: boolean
}

export type LicitacaoInput = {
  objeto?: string
  objetoSemTags?: string
  modalidade?: string
}

export type ScoreResult = {
  score: number
  scoreLabel: string
  motivo: string
}

// ─── Mapa CNAE divisão → keywords ─────────────────────────────────────────────

export const CNAE_MAP: Record<string, string[]> = {
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

const STOPWORDS = new Set([
  "ltda", "eireli", "me", "epp", "sa", "sas", "de", "da", "do", "dos",
  "das", "em", "para", "com", "por", "comercio", "servicos", "servico",
  "empresa", "industria", "comercial", "nacional",
])

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function normalizar(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export function extrairKeywords(empresa: EmpresaInput): string[] {
  const keywords = new Set<string>()
  for (const cnae of empresa.cnae ?? []) {
    const division = cnae.replace(/\D/g, "").substring(0, 2)
    for (const kw of CNAE_MAP[division] ?? []) {
      keywords.add(kw)
    }
  }
  for (const token of normalizar(empresa.razao_social)
    .split(/[\s\-\/\.&,]+/)
    .filter((w) => w.length > 4 && !STOPWORDS.has(w))) {
    keywords.add(token)
  }
  return Array.from(keywords)
}

// ─── Score label ──────────────────────────────────────────────────────────────

export function scoreLabel(score: number): string {
  if (score >= 95) return "Excelente"
  if (score >= 85) return "Ótimo"
  if (score >= 75) return "Bom"
  if (score >= 65) return "Regular"
  return "Baixo"
}

// ─── Motor principal ──────────────────────────────────────────────────────────

export function calcularScore(
  empresa: EmpresaInput,
  lic: LicitacaoInput
): ScoreResult {
  const base = calcularScoreBase(empresa, lic)
  const bonus = calcularBonusDocs(empresa)
  const score = Math.min(100, base.score + bonus)
  return { score, scoreLabel: scoreLabel(score), motivo: base.motivo }
}

function calcularBonusDocs(empresa: EmpresaInput): number {
  let bonus = 0
  if (empresa.docs_gerais_pct !== undefined && empresa.docs_gerais_pct > 0.8) bonus += 5
  if (empresa.docs_nicho_ok) bonus += 5
  return bonus
}

function calcularScoreBase(
  empresa: EmpresaInput,
  lic: LicitacaoInput
): Omit<ScoreResult, "scoreLabel"> {
  const texto = normalizar(`${lic.objetoSemTags ?? ""} ${lic.objeto ?? ""}`)

  // 1. Keyword exata do CNAE no texto (95–100)
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

  // 2. Keyword parcial do CNAE (85–94)
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

  // 3. Código CNAE numérico no texto (75)
  for (const cnae of empresa.cnae ?? []) {
    const numerico = cnae.replace(/\D/g, "").substring(0, 4)
    if (numerico.length >= 4 && texto.includes(numerico)) {
      return { score: 75, motivo: `Código CNAE ${numerico} encontrado no objeto` }
    }
  }

  // 4. Tokens da razão social no objeto (70–74)
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

  // 5. Modalidade compatível com porte (60–65)
  const mod = normalizar(lic.modalidade ?? "")
  const modSimples = ["dispensa", "inexigibilidade", "pregao eletronico", "credenciamento"]
  const modGrandes = ["concorrencia", "rdc", "dialogo competitivo", "leilao"]
  const isSimples = modSimples.some((m) => mod.includes(normalizar(m)))
  const isGrande = modGrandes.some((m) => mod.includes(normalizar(m)))

  if (["MEI", "ME", "EPP"].includes(empresa.porte) && isSimples) {
    return { score: 65, motivo: `Modalidade ${lic.modalidade} favorável para empresas de pequeno porte` }
  }
  if (["MEDIO", "GRANDE"].includes(empresa.porte) && (isGrande || isSimples)) {
    return { score: 65, motivo: `Modalidade ${lic.modalidade} compatível com porte ${empresa.porte}` }
  }
  if (isSimples || isGrande) {
    return { score: 60, motivo: `Modalidade identificada: ${lic.modalidade}` }
  }

  return { score: 30, motivo: "Sem correspondência específica com o perfil" }
}
