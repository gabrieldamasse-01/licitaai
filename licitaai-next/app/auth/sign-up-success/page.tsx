import Link from "next/link"
import { Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/40">
          <span className="text-xl font-black text-white">L</span>
        </div>
        <span className="text-lg font-bold text-white tracking-tight">LicitaAI</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800/80 backdrop-blur-sm p-8 shadow-2xl text-center">
        {/* Ícone de email */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-900/50 border border-blue-700/50">
          <Mail className="h-8 w-8 text-blue-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Verifique seu e-mail!
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Enviamos um link de confirmação para o seu e-mail. Clique no link para ativar sua conta.
        </p>

        {/* Botões */}
        <div className="flex flex-col gap-3">
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95"
          >
            <Mail className="h-4 w-4" />
            Abrir Gmail
          </a>

          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center w-full rounded-xl border border-slate-600 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-all active:scale-95"
          >
            Já confirmei → Fazer login
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Não recebeu? Verifique a pasta de spam.
        </p>
      </div>
    </div>
  )
}
