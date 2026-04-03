"use client"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white font-bold text-2xl">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-lg">⚖️</div>
            LicitaAI
          </div>
        </div>
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Verifique seu e-mail!</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Enviamos um link de confirmação para o seu e-mail. Clique no link para ativar sua conta e começar a usar o LicitaAI.
          </p>
          <div className="space-y-3">
            <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              ✉️ Abrir Gmail
            </a>
            <Link href="/auth/login"
              className="w-full flex items-center justify-center gap-2 border border-slate-600 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-6 rounded-lg transition-colors">
              Já confirmei → Fazer login
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-6">Não recebeu? Verifique a pasta de spam.</p>
        </div>
      </div>
    </div>
  )
}
