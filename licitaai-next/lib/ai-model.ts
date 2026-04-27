const MODELS: Record<string, string> = {
  classificacao:         "claude-haiku-4-5",
  resumo:                "claude-haiku-4-5",
  analise:               "claude-sonnet-4-6",
  analise_licitacao:     "claude-sonnet-4-6",
  entrevista_onboarding: "claude-sonnet-4-6",
  geracao_codigo:        "claude-sonnet-4-6",
  gerar_proposta:        "claude-sonnet-4-6",
  raciocinio:            "claude-opus-4-7",
  agente_autonomo:       "claude-opus-4-7",
}

const MAX_TOKENS: Record<string, number> = {
  classificacao:         50,
  resumo_curto:          512,
  analise_media:         1024,
  analise_licitacao:     1024,
  entrevista_onboarding: 1024,
  geracao_longa:         2048,
  gerar_proposta:        4096,
}

export function getModel(task: keyof typeof MODELS): string {
  return MODELS[task] ?? "claude-sonnet-4-6"
}

export function getMaxTokens(task: keyof typeof MAX_TOKENS): number {
  return MAX_TOKENS[task] ?? 1024
}
