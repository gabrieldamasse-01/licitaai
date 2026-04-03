"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Scale, Loader2, TrendingUp, Shield, Zap } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
})

type LoginData = z.infer<typeof loginSchema>

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
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  })

  // Refs para detecção de autofill do browser
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)
  const autofillCount = useRef(0)
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false)

  const { ref: emailRegRef, ...emailRegRest } = register("email")
  const { ref: passwordRegRef, ...passwordRegRest } = register("password")

  const onSubmit = async (data: LoginData) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setError("root", { message: "E-mail ou senha incorretos. Tente novamente." })
      return
    }
    router.push("/dashboard")
  }

  // Submissão direta lendo os valores do DOM (necessário pois autofill não
  // dispara onChange do React, então react-hook-form não tem os valores)
  const submitFromAutofill = async () => {
    const email = emailRef.current?.value
    const password = passwordRef.current?.value
    if (!email || !password) return
    setIsAutoSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setIsAutoSubmitting(false)
    if (error) {
      setError("root", { message: "E-mail ou senha incorretos. Tente novamente." })
      return
    }
    router.push("/dashboard")
  }

  // Detecta autofill via evento animationstart disparado pelo CSS abaixo
  // Só faz auto-submit se AMBOS os campos forem preenchidos pelo gerenciador
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const handleAutofill = (e: AnimationEvent) => {
      if (e.animationName !== "onAutoFillStart") return
      autofillCount.current += 1
      if (autofillCount.current >= 2) {
        timer = setTimeout(submitFromAutofill, 500)
      }
    }

    const emailEl = emailRef.current
    const passwordEl = passwordRef.current
    emailEl?.addEventListener("animationstart", handleAutofill as EventListener)
    passwordEl?.addEventListener("animationstart", handleAutofill as EventListener)

    return () => {
      emailEl?.removeEventListener("animationstart", handleAutofill as EventListener)
      passwordEl?.removeEventListener("animationstart", handleAutofill as EventListener)
      if (timer) clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLoading = isSubmitting || isAutoSubmitting

  return (
    <div className={cn("min-h-screen md:grid md:grid-cols-2", className)} {...props}>
      {/* CSS para detecção de autofill via animationstart */}
      <style>{`
        @keyframes onAutoFillStart { from {} to {} }
        input:-webkit-autofill { animation-name: onAutoFillStart; animation-duration: 1ms; }
      `}</style>
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                ref={(el) => { emailRegRef(el); emailRef.current = el }}
                {...emailRegRest}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-12 text-base rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                ref={(el) => { passwordRegRef(el); passwordRef.current = el }}
                {...passwordRegRest}
              />
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {errors.root && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-sm text-red-600">{errors.root.message}</p>
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
