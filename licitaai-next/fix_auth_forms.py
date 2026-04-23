#!/usr/bin/env python3
"""Restore and fix auth form files."""

forgot = '''"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Scale, Loader2, CheckCircle2 } from "lucide-react"

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
      return "Sess\u00e3o expirada. Tente novamente ou solicite um novo link."
    }
    if (m.includes("email rate limit exceeded") || m.includes("rate limit")) {
      return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."
    }
    if (m.includes("user not found") || m.includes("invalid email")) {
      return "E-mail n\u00e3o encontrado. Verifique e tente novamente."
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
                Enviamos instru\u00e7\u00f5es de recupera\u00e7\u00e3o de senha para <strong>{email}</strong>
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
                Digite seu e-mail corporativo para receber um link de redefini\u00e7\u00e3o.
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
                  "Enviar link de recupera\u00e7\u00e3o"
                )}
              </Button>
            </form>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center"
              >
                \u2190 Voltar para o login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
'''

update = '''"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Scale, Loader2 } from "lucide-react"

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  function traduzirErro(msg: string): string {
    const m = msg.toLowerCase()
    if (m.includes("auth session missing")) {
      return "Sess\u00e3o expirada. Solicite um novo link de redefini\u00e7\u00e3o de senha."
    }
    if (m.includes("email rate limit exceeded") || m.includes("rate limit")) {
      return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."
    }
    if (m.includes("same password")) {
      return "A nova senha n\u00e3o pode ser igual \u00e0 senha atual."
    }
    if (m.includes("weak password") || m.includes("password should be")) {
      return "Senha muito fraca. Use pelo menos 8 caracteres com letras e n\u00fameros."
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
                placeholder="M\u00ednimo 8 caracteres"
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
'''

with open("components/auth/forgot-password-form.tsx", "w", encoding="utf-8") as f:
    f.write(forgot)
print("forgot-password-form.tsx written:", len(forgot), "chars")

with open("components/auth/update-password-form.tsx", "w", encoding="utf-8") as f:
    f.write(update)
print("update-password-form.tsx written:", len(update), "chars")
