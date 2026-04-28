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
  const secretPreview = SECRET
    ? `${SECRET.slice(0, 6)}...${SECRET.slice(-4)}`
    : "(VAZIO — vai gerar 401)"

  console.log("🚀 Sync local iniciado. Apenas Effecti. Intervalo: 60 minutos. Ctrl+C para parar.\n")
  console.log(`   BASE_URL : ${BASE_URL}`)
  console.log(`   CRON_SECRET: ${secretPreview}`)
  console.log()

  if (!SECRET) {
    console.error("❌ CRON_SECRET não encontrado no .env.local — todas as chamadas retornarão 401.")
    process.exit(1)
  }

  await sincronizar("effecti")

  setInterval(async () => {
    await sincronizar("effecti")
  }, INTERVAL_MS)
}

loop()
