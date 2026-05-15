/**
 * Definição central dos planos do LicitaAI.
 * Nomes canônicos: gratuito | pro | enterprise
 */

export const PLANOS = {
  gratuito: {
    licitacoes_por_pagina: 10,
    oportunidades: false,
    documentos: false,
    alertas_email: false,
    propostas: false,
    relatorios: false,
    analise_ia: false,
  },
  pro: {
    licitacoes_por_pagina: 999999,
    oportunidades: true,
    documentos: true,
    alertas_email: true,
    propostas: true,
    relatorios: true,
    analise_ia: true,
  },
  enterprise: {
    licitacoes_por_pagina: 999999,
    oportunidades: true,
    documentos: true,
    alertas_email: true,
    propostas: true,
    relatorios: true,
    analise_ia: true,
  },
} as const

export type Plano = keyof typeof PLANOS
export type PlanoLimites = (typeof PLANOS)[Plano]

export function getPlanoLimites(plano: string): PlanoLimites {
  if (plano in PLANOS) return PLANOS[plano as Plano]
  return PLANOS.gratuito
}

export function isPlanoPago(plano: string): boolean {
  return plano === "pro" || plano === "enterprise"
}

// Backwards compat — mapeia nomes antigos
export function normalizarPlano(plano: string | null | undefined): Plano {
  if (!plano) return "gratuito"
  const map: Record<string, Plano> = {
    basico: "gratuito",
    profissional: "pro",
    pro: "pro",
    enterprise: "enterprise",
    gratuito: "gratuito",
  }
  return map[plano.toLowerCase()] ?? "gratuito"
}

// Legacy exports para não quebrar imports existentes
export const PLAN_LIMITS = PLANOS
export type Plan = Plano
export function getPlanLimits(plan: string): PlanoLimites {
  return getPlanoLimites(plan)
}
export function isWithinLimit(current: number, max: number | null): boolean {
  if (max === null) return true
  return current < max
}
