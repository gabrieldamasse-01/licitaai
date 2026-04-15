export function traduzirErro(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes("email rate limit") || m.includes("rate limit exceeded")) {
    return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."
  }
  if (m.includes("user already registered")) {
    return "Este e-mail já está cadastrado. Tente fazer login."
  }
  if (m.includes("invalid email")) {
    return "E-mail inválido."
  }
  if (m.includes("password should be")) {
    return "A senha deve ter pelo menos 6 caracteres."
  }
  if (m.includes("auth session missing")) {
    return "Sessão expirada. Faça login novamente."
  }
  if (m.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos."
  }
  if (m.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de fazer login."
  }
  if (m.includes("token has expired")) {
    return "Link expirado. Solicite um novo."
  }
  if (m.includes("same password")) {
    return "A nova senha não pode ser igual à senha atual."
  }
  if (m.includes("weak password")) {
    return "Senha muito fraca. Use pelo menos 8 caracteres com letras e números."
  }
  if (m.includes("user not found")) {
    return "E-mail não encontrado. Verifique e tente novamente."
  }
  return "Ocorreu um erro. Tente novamente."
}
