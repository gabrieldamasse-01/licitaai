/**
 * Definição central dos limites por plano de assinatura.
 * Altere aqui para ajustar limites sem tocar na lógica de negócio.
 *
 * null = ilimitado
 */

export const PLAN_LIMITS = {
  basico: {
    maxEmpresas: 1,
    maxUfs: 3,
    maxLicitacoesSalvas: 20,
    aiAnalysis: false,
    emailAlerts: false,
    scoringPorCnae: false,
  },
  profissional: {
    maxEmpresas: 5,
    maxUfs: 10,
    maxLicitacoesSalvas: 200,
    aiAnalysis: true,
    emailAlerts: true,
    scoringPorCnae: true,
  },
  enterprise: {
    maxEmpresas: null,
    maxUfs: null,
    maxLicitacoesSalvas: null,
    aiAnalysis: true,
    emailAlerts: true,
    scoringPorCnae: true,
  },
} as const

export type Plan = keyof typeof PLAN_LIMITS
export type PlanLimits = (typeof PLAN_LIMITS)[Plan]

/** Retorna os limites do plano de um usuário */
export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan]
}

/** Verifica se o usuário pode realizar uma ação baseada no plano */
export function isWithinLimit(
  current: number,
  max: number | null
): boolean {
  if (max === null) return true
  return current < max
}
