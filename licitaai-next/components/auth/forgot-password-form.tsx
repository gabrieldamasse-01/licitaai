"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Scale, Loader2, CheckCircle2 } from "lucide-react"

function LinkExpiradoDetector({ onDetected }: { onDetected: () => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get("erro") === "link-expirado") {
      onDetected()
    }
  }, [searchParams, onDetected])
  return null
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  function traduzirErro(msg: string): string {
    const m = msg.toLowerCase()
    if (m.includes("auth session missing")) {
      return "Sessão expirada. Tente novamente ou solicite um novo link."
    }
    if (m.includes("email rate limit exceeded") || m.includes("rate limit")) {
      return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."
    }
    if (m.includes("user not found") || m.includes("invalid email")) {
      return "E-mail não encontrado. Verifique e tente novamente."
    }
    return "Ocorreu um erro ao enviar o e-mail. Tente novamente."
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Ocorreu um erro"
      setError(traduzirErro(msg))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-slate-50", className)} {...props}>
      <Suspense fallback={null}>
        <LinkExpiradoDetector onDetected={() => setError("Link expirado. Solicite um novo link de redefinição de senha.")} />
      </Suspense>
      <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 inline-flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/20">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">LicitaIA</span>
          </Link>
        </div>

        {success ? (
          <div className="text-center space-y-4 animate-slide-up-fade">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Verifique seu e-mail</h2>
              <p className="text-slate-500 text-sm">
                Enviamos instruções de recuperação de senha para <strong>{email}</strong>
              </p>
            </div>
            <div className="pt-4">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Voltar para o login
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Redefinir senha</h2>
              <p className="text-slate-500 text-sm">
                Digite seu e-mail corporativo para receber um link de redefinição.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  E-mail corporativo
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@empresa.com.br"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-md shadow-blue-500/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enviando...</>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>
            </form>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center"
              >
                ← Voltar para o login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
