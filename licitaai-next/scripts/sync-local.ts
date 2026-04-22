import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://licitaai-next.vercel.app"
const SECRET = process.env.CRON_SECRET ?? ""
const INTERVAL_MS = 60 * 60 * 1000 // 60 minutos

async function sincronizar(portal: "effecti" | "pncp") {
  const url = portal === "effecti"
    ? `${BASE_URL}/api/cron/licitacoes`
    : `${BASE_URL}/api/cron/licitacoes-pncp`

  const now = new Date().toLocaleString("pt-BR")
  console.log(`[${now}] Sincronizando ${portal.toUpperCase()}...`)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}` },
    })
    const json = await res.json().catch(() => ({}))
    console.log(`[${now}] ${portal.toUpperCase()} → ${res.status}`, json)
  } catch (err) {
    console.error(`[${now}] ERRO ${portal}:`, err)
  }
}

async function loop() {
  console.log("🚀 Sync local iniciado. Intervalo: 60 minutos. Ctrl+C para parar.\n")
  await sincronizar("effecti")
  await sincronizar("pncp")

  setInterval(async () => {
    await sincronizar("effecti")
    await sincronizar("pncp")
  }, INTERVAL_MS)
}

loop()
