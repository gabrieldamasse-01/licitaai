"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Scale, Loader2, TrendingUp, Shield, Zap, Eye, EyeOff } from "lucide-react"
import { traduzirErro } from "@/lib/auth-errors"
import { useState } from "react"

const highlights = [
  { icon: TrendingUp, text: "15.000+ licitações monitoradas por mês" },
  { icon: Zap,        text: "Score de relevância com IA em segundos" },
  { icon: Shield,     text: "2.400+ empresas confiam na plataforma" },
]

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  async function handlePostLogin() {
    const r = await fetch("/api/auth/check-2fa")
    if (!r.ok) throw new Error(`check-2fa falhou: ${r.status}`)
    const { twoFactorEnabled } = await r.json() as { twoFactorEnabled: boolean }
    if (twoFactorEnabled) {
      const otpRes = await fetch("/api/auth/send-otp", { method: "POST" })
      if (!otpRes.ok) throw new Error(`send-otp falhou: ${otpRes.status}`)
      const otpJson = await otpRes.json() as { ok?: boolean; error?: string; detail?: string }
      if (!otpJson.ok) {
        setErrorMsg(`Erro ao enviar código 2FA: ${otpJson.detail ?? otpJson.error}`)
        return
      }
      router.push("/auth/verify-2fa")
    } else {
      router.push("/dashboard")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setErrorMsg("")
    setEmailError("")
    setPasswordError("")

    let valid = true
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("E-mail inválido")
      valid = false
    }
    if (!password || password.length < 6) {
      setPasswordError("Senha deve ter pelo menos 6 caracteres")
      valid = false
    }
    if (!valid) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErrorMsg(traduzirErro(error))
        return
      }
      await handlePostLogin()
    } catch {
      setErrorMsg("Erro inesperado. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("min-h-screen md:grid md:grid-cols-2", className)} {...props}>
      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden md:flex flex-col justify-between bg-[#0A1628] text-white p-10 relative overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group inline-flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/30">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">LicitaIA</span>
          </Link>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight">
              Vença mais licitações{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                com Inteligência Artificial
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Monitoramento automático, análise de editais e score personalizado
              para sua empresa vencer mais contratos públicos.
            </p>
          </div>

          <div className="space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 shrink-0">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <p className="text-sm text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} LicitaIA. Todos os direitos reservados.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-col justify-center px-6 py-10 md:px-12 lg:px-16 bg-white text-slate-900">
        {/* Mobile-only logo */}
        <div className="flex justify-center mb-8 md:hidden">
          <Link href="/" className="flex items-center gap-3 inline-flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/20">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">LicitaIA</span>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-7">
          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Entrar na sua conta</h2>
            <p className="text-sm text-slate-500">Acesse o painel de licitações</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@empresa.com.br"
                autoComplete="email"
                className="h-12 text-base rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError && (
                <p className="text-xs text-red-500">{emailError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-12 text-base rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
              {passwordError && (
                <p className="text-xs text-red-500">{passwordError}</p>
              )}
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-sm text-red-600">{errorMsg}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-md shadow-blue-500/20 transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Entrando...</>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Não tem uma conta?{" "}
            <Link
              href="/auth/sign-up"
              className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4"
            >
              Cadastre-se grátis
            </Link>
          </p>

          <Link
            href="/"
            className="block text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  )
}
