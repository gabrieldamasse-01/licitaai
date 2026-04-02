import { describe, it, expect } from "vitest"
import {
  calcularScore,
  scoreLabel,
  normalizar,
  extrairKeywords,
  CNAE_MAP,
} from "./scoring"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const empresaTI = {
  razao_social: "TechSoft Desenvolvimento de Sistemas Ltda",
  porte: "ME",
  cnae: ["62.01-5-00"],
}

const empresaLimpeza = {
  razao_social: "CleanPro Serviços de Limpeza Eireli",
  porte: "ME",
  cnae: ["81.21-4-00"],
}

const empresaObra = {
  razao_social: "Construtora Norte S/A",
  porte: "GRANDE",
  cnae: ["41.20-4-00"],
}

const licitacaoSoftware = {
  objeto: "Contratação de empresa para desenvolvimento de sistema",
  objetoSemTags: "desenvolvimento de sistema de informação",
  modalidade: "Pregão Eletrônico",
}

const licitacaoLimpeza = {
  objeto: "Serviços de limpeza e higienização das dependências",
  objetoSemTags: "serviços de limpeza e higienização das dependências do prédio",
  modalidade: "Pregão Eletrônico",
}

const licitacaoObra = {
  objeto: "Construção de escola municipal",
  objetoSemTags: "construção de edificação escolar",
  modalidade: "Concorrência",
}

const licitacaoGenerica = {
  objeto: "Aquisição de materiais de escritório",
  objetoSemTags: "aquisição de materiais de escritório em geral",
  modalidade: "Pregão Eletrônico",
}

// ─── normalizar ───────────────────────────────────────────────────────────────

describe("normalizar", () => {
  it("converte para minúsculas e remove acentos", () => {
    expect(normalizar("Licitação Pública")).toBe("licitacao publica")
    expect(normalizar("Construção")).toBe("construcao")
    expect(normalizar("INFORMÁTICA")).toBe("informatica")
  })

  it("mantém strings já normalizadas inalteradas", () => {
    expect(normalizar("software")).toBe("software")
  })
})

// ─── scoreLabel ───────────────────────────────────────────────────────────────

describe("scoreLabel", () => {
  it("retorna 'Excelente' para score >= 95", () => {
    expect(scoreLabel(95)).toBe("Excelente")
    expect(scoreLabel(100)).toBe("Excelente")
  })

  it("retorna 'Ótimo' para score 85–94", () => {
    expect(scoreLabel(85)).toBe("Ótimo")
    expect(scoreLabel(92)).toBe("Ótimo")
  })

  it("retorna 'Bom' para score 75–84", () => {
    expect(scoreLabel(75)).toBe("Bom")
  })

  it("retorna 'Regular' para score 65–74", () => {
    expect(scoreLabel(65)).toBe("Regular")
  })

  it("retorna 'Baixo' para score < 65", () => {
    expect(scoreLabel(30)).toBe("Baixo")
    expect(scoreLabel(0)).toBe("Baixo")
  })
})

// ─── extrairKeywords ──────────────────────────────────────────────────────────

describe("extrairKeywords", () => {
  it("extrai keywords do CNAE de TI (62)", () => {
    const kws = extrairKeywords(empresaTI)
    expect(kws).toContain("software")
    expect(kws).toContain("sistema")
    expect(kws).toContain("tecnologia")
  })

  it("extrai keywords do CNAE de limpeza (81)", () => {
    const kws = extrairKeywords(empresaLimpeza)
    expect(kws).toContain("limpeza")
    expect(kws).toContain("higienização")
  })

  it("inclui tokens significativos da razão social", () => {
    const kws = extrairKeywords({ razao_social: "Construtora Horizonte", porte: "ME", cnae: [] })
    expect(kws).toContain("construtora")
    expect(kws).toContain("horizonte")
  })

  it("exclui stopwords da razão social", () => {
    const kws = extrairKeywords({ razao_social: "Empresa Comercial Nacional Ltda", porte: "ME", cnae: [] })
    expect(kws).not.toContain("ltda")
    expect(kws).not.toContain("comercial")
  })
})

// ─── calcularScore ────────────────────────────────────────────────────────────

describe("calcularScore — CNAE exato", () => {
  it("empresa de TI × licitação de software → score >= 95", () => {
    const { score } = calcularScore(empresaTI, licitacaoSoftware)
    expect(score).toBeGreaterThanOrEqual(95)
  })

  it("empresa de limpeza × licitação de limpeza → score >= 95", () => {
    const { score } = calcularScore(empresaLimpeza, licitacaoLimpeza)
    expect(score).toBeGreaterThanOrEqual(95)
  })

  it("empresa de obra × licitação de construção → score >= 95", () => {
    const { score } = calcularScore(empresaObra, licitacaoObra)
    expect(score).toBeGreaterThanOrEqual(95)
  })
})

describe("calcularScore — sem correspondência forte", () => {
  it("empresa de TI × licitação genérica de escritório → score entre 30 e 74", () => {
    const { score } = calcularScore(empresaTI, licitacaoGenerica)
    expect(score).toBeLessThan(75)
    expect(score).toBeGreaterThanOrEqual(30)
  })

  it("empresa de limpeza × licitação de obra → score < 75", () => {
    const { score } = calcularScore(empresaLimpeza, licitacaoObra)
    expect(score).toBeLessThan(75)
  })
})

describe("calcularScore — modalidade por porte", () => {
  it("empresa ME × Pregão Eletrônico (sem CNAE match) → score >= 60", () => {
    const empresaSemCnae = { razao_social: "Genérica Ltda", porte: "ME", cnae: [] }
    const { score } = calcularScore(empresaSemCnae, licitacaoGenerica)
    expect(score).toBeGreaterThanOrEqual(60)
  })
})

describe("calcularScore — estrutura da resposta", () => {
  it("sempre retorna score, scoreLabel e motivo", () => {
    const result = calcularScore(empresaTI, licitacaoSoftware)
    expect(result).toHaveProperty("score")
    expect(result).toHaveProperty("scoreLabel")
    expect(result).toHaveProperty("motivo")
    expect(typeof result.score).toBe("number")
    expect(typeof result.scoreLabel).toBe("string")
    expect(typeof result.motivo).toBe("string")
  })

  it("score nunca excede 100", () => {
    const { score } = calcularScore(empresaTI, licitacaoSoftware)
    expect(score).toBeLessThanOrEqual(100)
  })

  it("score nunca é negativo", () => {
    const { score } = calcularScore(
      { razao_social: "X", porte: "ME", cnae: [] },
      { objeto: "", objetoSemTags: "", modalidade: "" }
    )
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

// ─── CNAE_MAP integridade ─────────────────────────────────────────────────────

describe("CNAE_MAP", () => {
  it("divisão 62 (TI) tem keywords relevantes", () => {
    expect(CNAE_MAP["62"]).toContain("software")
    expect(CNAE_MAP["62"]).toContain("sistema")
  })

  it("todas as entradas são arrays não-vazios", () => {
    for (const [key, val] of Object.entries(CNAE_MAP)) {
      expect(Array.isArray(val), `CNAE ${key} deve ser array`).toBe(true)
      expect(val.length, `CNAE ${key} não deve ser vazio`).toBeGreaterThan(0)
    }
  })
})
