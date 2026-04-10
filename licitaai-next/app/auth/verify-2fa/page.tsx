"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Scale, Loader2, ShieldCheck, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function Verify2FAPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState<number | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      if (countdownTimer.current) clearInterval(countdownTimer.current)
    }
  }, [])

  function startCountdown() {
    cancelledRef.current = false
    setCountdown(3)
    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || cancelledRef.current) {
          clearInterval(countdownTimer.current!)
          return null
        }
        if (prev <= 1) {
          clearInterval(countdownTimer.current!)
          router.push("/dashboard")
          router.refresh()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  function cancelRedirect() {
    cancelledRef.current = true
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    setCountdown(null)
    setLoading(false)
    setCode("")
  }

  async function submitCode(codeValue: string) {
    if (codeValue.length !== 6) return
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codeValue }),
    })
    const json = await res.json() as { ok?: boolean; error?: string; detail?: string }

    if (json.ok) {
      startCountdown()
    } else {
      setError(json.error ?? "Código inválido")
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    await submitCode(code)
  }

  async function handleResend() {
    setResending(true)
    setError("")
    const res = await fetch("/api/auth/send-otp", { method: "POST" })
    const json = await res.json() as { ok?: boolean; error?: string; detail?: string }
    if (!json.ok) setError(`${json.error ?? "Erro ao reenviar"}${json.detail ? `: ${json.detail}` : ""}`)
    setResending(false)
  }

  async function handleBack() {
    await fetch("/api/auth/cancel-2fa", { method: "POST" })
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/30">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">LicitaIA</span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-8 space-y-6 backdrop-blur-sm">
          {countdown !== null ? (
            <div className="flex flex-col items-center gap-4 text-center py-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Verificação concluída!</h1>
              <p className="text-sm text-slate-400">
                Redirecionando para o painel em{" "}
                <span className="font-semibold text-white">{countdown}s</span>…
              </p>
              <button
                type="button"
                onClick={cancelRedirect}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15">
                  <ShieldCheck className="h-6 w-6 text-blue-400" />
                </div>
                <h1 className="text-xl font-bold text-white">Verificação em duas etapas</h1>
                <p className="text-sm text-slate-400">
                  Enviamos um código de 6 dígitos para o seu e-mail. Ele expira em 10 minutos.
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6)
                    setCode(val)
                    if (val.length === 6) {
                      if (debounceTimer.current) clearTimeout(debounceTimer.current)
                      debounceTimer.current = setTimeout(() => submitCode(val), 300)
                    }
                  }}
                  placeholder="000000"
                  className="h-14 text-center text-2xl font-bold tracking-widest bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  autoFocus
                />

                {error && (
                  <p className="text-sm text-center text-red-400">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  disabled={loading || code.length !== 6}
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Verificando…</> : "Verificar código"}
                </Button>
              </form>

              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  {resending ? "Reenviando…" : "Não recebeu? Reenviar código"}
                </button>
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  ← Voltar para o login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
