import { z } from "zod"

/**
 * Validação de variáveis de ambiente no startup.
 * Se uma variável obrigatória estiver ausente, o processo falha com uma
 * mensagem clara — antes de qualquer request chegar ao servidor.
 *
 * Variáveis NEXT_PUBLIC_* são visíveis no bundle do cliente.
 * Variáveis sem prefixo só existem no servidor (Edge Functions, Server Actions).
 */

const envSchema = z.object({
  // Supabase (públicas — expostas ao cliente)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY é obrigatória"),

  // Supabase (privada — apenas servidor)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Integrações externas (privadas — apenas servidor)
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  FIRECRAWL_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  CRON_SECRET: z.string().min(1).optional(),
})

// Falha em runtime com mensagem amigável se alguma variável obrigatória faltar
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const missing = parsed.error.issues
    .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
    .join("\n")

  throw new Error(
    `\n\n❌ Variáveis de ambiente inválidas ou ausentes:\n${missing}\n\nVerifique seu arquivo .env.local\n`
  )
}

export const env = parsed.data
