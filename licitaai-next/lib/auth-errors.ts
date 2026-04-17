const ERROR_MAP: Array<[string, string]> = [
  ["email rate limit",              "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."],
  ["rate limit exceeded",           "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."],
  ["over_email_send_rate_limit",    "Muitas tentativas. Aguarde alguns minutos."],
  ["user already registered",       "Este e-mail já está cadastrado. Tente fazer login."],
  ["email_exists",                  "Este e-mail já está cadastrado. Tente fazer login."],
  ["invalid email",                 "E-mail inválido."],
  ["email_address_invalid",         "E-mail inválido."],
  ["password should be",            "A senha deve ter pelo menos 6 caracteres."],
  ["auth session missing",          "Sessão expirada. Faça login novamente."],
  ["invalid login credentials",     "E-mail ou senha incorretos."],
  ["email not confirmed",           "Confirme seu e-mail antes de fazer login."],
  ["token has expired",             "Link expirado. Solicite um novo."],
  ["same password",                 "A nova senha não pode ser igual à senha atual."],
  ["weak password",                 "Senha muito fraca. Use pelo menos 8 caracteres com letras e números."],
  ["user not found",                "E-mail não encontrado. Verifique e tente novamente."],
  ["signup_disabled",               "Cadastros temporariamente desabilitados."],
  ["anonymous_provider_disabled",   "Cadastro não permitido. Contate o suporte."],
  ["smtp",                          "Erro no envio de e-mail. Tente novamente em instantes."],
  ["unexpected_failure",            "Erro inesperado. Tente novamente."],
  ["failed to",                     "Erro no servidor. Tente novamente."],
]

export function traduzirErro(error: unknown): string {
  const msg = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase()
  for (const [key, translation] of ERROR_MAP) {
    if (msg.includes(key)) return translation
  }
  return "Ocorreu um erro. Tente novamente."
}
