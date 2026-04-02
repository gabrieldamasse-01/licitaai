/**
 * Cliente Resend centralizado — para uso exclusivo em API Routes e
 * Edge Functions server-side. NUNCA importe em Client Components.
 */
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.EMAIL_FROM ?? 'alertas@licitaai.com.br'
