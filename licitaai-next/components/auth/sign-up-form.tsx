"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Scale, Loader2, TrendingUp, Shield, Zap, Eye, EyeOff } from "lucide-react"

const signUpSchema = z
  .object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
    repeatPassword: z.string(),
  })
  .refine((d) => d.password === d.repeatPassword, {
    message: "As senhas não coincidem",
    path: ["repeatPassword"],
  })

type SignUpData = z.infer<typeof signUpSchema>

const highlights = [
  { icon: TrendingUp, text: "15.000+ licitações monitoradas por mês" },
  { icon: Zap,        text: "Score de relevância com IA em segundos" },
  { icon: Shield,     text: "2.400+ empresas confiam na plataforma" },
]

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeat, setShowRepeat] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
  })

  const onSubmit = async (data: SignUpData) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    })
    if (error) {
      setError("root", { message: error.message })
      return
    }
    router.push("/auth/sign-up-success")
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
              Comece a vencer licitações{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                com Inteligência Artificial
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Crie sua conta grátis agora mesmo e tenha acesso a análises personalizadas
              para o perfil da sua empresa.
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
      <div className="flex flex-col justify-center px-6 py-10 md:px-12 lg:px-16 bg-white text-slate-900 overflow-y-auto">
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
            <h2 className="text-2xl font-bold text-slate-900">Criar conta</h2>
            <p className="text-sm text-slate-500">Cadastre-se na plataforma LicitaIA</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                E-mail corporativo
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@empresa.com.br"
                className="h-12 text-base rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
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
                  placeholder="Mínimo de 8 caracteres"
                  className="h-12 text-base rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                  {...register("password")}
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
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="repeat-password" className="text-sm font-medium text-slate-700">
                Confirmar senha
              </Label>
              <div className="relative">
                <Input
                  id="repeat-password"
                  type={showRepeat ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  className="h-12 text-base rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 pr-12"
                  {...register("repeatPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowRepeat((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showRepeat ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showRepeat ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.repeatPassword && (
                <p className="text-xs text-red-500">{errors.repeatPassword.message}</p>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando conta...</>
              ) : (
                "Criar conta grátis"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Já tem uma conta?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4"
            >
              Fazer login
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
