const ZAPI_BASE = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}`

export async function enviarWhatsApp(telefone: string, mensagem: string): Promise<boolean> {
  try {
    const res = await fetch(`${ZAPI_BASE}/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": process.env.ZAPI_CLIENT_TOKEN ?? "",
      },
      body: JSON.stringify({
        phone: telefone.replace(/\D/g, ""),
        message: mensagem,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function formatarMensagemAlerta(
  licitacoes: Array<{
    objeto: string
    orgao: string
    valor_estimado: number | null
    data_encerramento: string | null
  }>
): string {
  const header = "🏛️ *LicitaAI — Novas Oportunidades*\n\n"
  const items = licitacoes
    .slice(0, 5)
    .map((l, i) => {
      const valor = l.valor_estimado
        ? `R$ ${l.valor_estimado.toLocaleString("pt-BR")}`
        : "Valor não informado"
      const prazo = l.data_encerramento
        ? new Date(l.data_encerramento).toLocaleDateString("pt-BR")
        : "—"
      return `${i + 1}. *${l.orgao}*\n${l.objeto?.slice(0, 100)}...\n💰 ${valor} | 📅 ${prazo}`
    })
    .join("\n\n")

  const footer = "\n\n👉 Acesse licitaai-next.vercel.app para ver todas"
  return header + items + footer
}
