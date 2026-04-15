"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Scale, Loader2 } from "lucide-react"

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const hash = window.location.hash

    if (hash.includes("access_token")) {
      // Link de email com token no hash fragment — trocar por sessão
      const params = new URLSearchParams(hash.substring(1))
      const access_token = params.get("access_token") ?? ""
      const refresh_token = params.get("refresh_token") ?? ""

      supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        if (error) {
          router.replace("/auth/forgot-password?erro=link-expirado")
        } else {
          // Limpar hash da URL sem recarregar a página
          window.history.replaceState(null, "", window.location.pathname)
          setSessionReady(true)
        }
      })
    } else {
      // Sem hash — verificar se já existe sessão ativa
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessionReady(true)
        } else {
          router.replace("/auth/forgot-password?erro=link-expirado")
        }
      })
    }
  }, [router])

  function traduzirErro(msg: string): string {
    const m = msg.toLowerCase()
    if (m.includes("auth session missing")) {
      return "Sessão expirada. Solicite um novo link de redefinição de senha."
    }
    if (m.includes("email rate limit exceeded") || m.includes("rate limit")) {
      return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."
    }
    if (m.includes("same password")) {
      return "A nova senha não pode ser igual à senha atual."
    }
    if (m.includes("weak password") || m.includes("password should be")) {
      return "Senha muito fraca. Use pelo menos 8 caracteres com letras e números."
    }
    return "Ocorreu um erro ao salvar a senha. Tente novamente."
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      router.push("/dashboard")
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Ocorreu um erro"
      setError(traduzirErro(msg))
    } finally {
      setIsLoading(false)
    }
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-3" />
        <p className="text-sm text-slate-500">Verificando link...</p>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-slate-50", className)} {...props}>
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

        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Nova senha</h2>
            <p className="text-slate-500 text-sm">
              Digite e confirme sua nova senha abaixo.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Nova senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</>
              ) : (
                "Salvar nova senha"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
