"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Shield,
  Users,
  Building2,
  Target,
  FileText,
  MessageSquare,
  Search,
  Mail,
  UserPlus,
  Eye,
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  adicionarAdmin,
  toggleAdmin,
  resolverFeedback,
  enviarEmailAdmin,
} from "./actions"

const MASTER_EMAIL = "gabriel.damasse@mgnext.com"

// ─── Toggle customizado LicitaAI ─────────────────────────────────────────────

function AdminToggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className="px-3 py-1 text-sm font-medium rounded-md transition-all duration-200
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
                 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                 disabled:cursor-not-allowed disabled:opacity-40 backdrop-blur-sm"
      style={
        checked
          ? {
              background: "rgba(37, 99, 235, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              color: "#60a5fa",
            }
          : {
              background: "rgba(100, 116, 139, 0.15)",
              border: "1px solid rgba(100, 116, 139, 0.3)",
              color: "#94a3b8",
            }
      }
    >
      {checked ? "Ativo" : "Inativo"}
    </button>
  )
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

type AdminClientProps = {
  initialTab: string
  metrics: {
    totalUsers: number
    totalCompanies: number
    totalMatches: number
    totalDocuments: number
    totalFeedbacks: number
    totalAdmins: number
  }
  clientes: Array<{
    id: string
    email: string
    created_at: string
    razao_social?: string
    plano?: string
  }>
  feedbacks: Array<{
    id: string
    user_email?: string
    tipo: string
    titulo: string
    descricao: string
    resolvido: boolean
    created_at: string
  }>
  licitacoes: Array<{
    id: string
    razao_social: string
    objeto: string
    orgao: string
    relevancia_score: number
    created_at: string
  }>
  time: Array<{
    id: string
    user_id: string
    email: string
    nome: string
    cargo: string | null
    ativo: boolean
    created_at: string
  }>
}

// ─── Componente de Métrica ────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white tabular-nums">{value.toLocaleString("pt-BR")}</p>
    </div>
  )
}

// ─── Sheet Email ──────────────────────────────────────────────────────────────

function EmailSheet({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false)
  const [assunto, setAssunto] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSend() {
    if (!assunto.trim() || !mensagem.trim()) {
      toast.error("Preencha assunto e mensagem.")
      return
    }
    startTransition(async () => {
      const result = await enviarEmailAdmin(userEmail, assunto, mensagem)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Email enviado com sucesso!")
        setAssunto("")
        setMensagem("")
        setOpen(false)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-700/50"
        >
          <Mail className="h-3.5 w-3.5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-slate-900 border-slate-700 text-white w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-white">Enviar email</SheetTitle>
          <p className="text-sm text-slate-400">Para: {userEmail}</p>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300">Assunto</Label>
            <Input
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Ex: Atualização da sua conta LicitaAI"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Mensagem</Label>
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite a mensagem..."
              rows={8}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50 resize-none"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? "Enviando..." : "Enviar email"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Sheet Adicionar Admin ────────────────────────────────────────────────────

function AdicionarAdminSheet({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [nome, setNome] = useState("")
  const [cargo, setCargo] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!email.trim() || !nome.trim()) {
      toast.error("Email e nome são obrigatórios.")
      return
    }
    startTransition(async () => {
      const result = await adicionarAdmin({ email, nome, cargo })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Administrador adicionado com sucesso!")
        setEmail("")
        setNome("")
        setCargo("")
        setOpen(false)
        onSuccess()
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
        >
          <UserPlus className="h-4 w-4" />
          Adicionar membro
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-slate-900 border-slate-700 text-white w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-white">Adicionar administrador</SheetTitle>
          <p className="text-sm text-slate-400">
            O usuário precisa ter uma conta na plataforma.
          </p>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300">
              Email <span className="text-red-400">*</span>
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">
              Nome <span className="text-red-400">*</span>
            </Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Cargo (opcional)</Label>
            <Input
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex: Suporte, Comercial, Técnico"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPending ? "Adicionando..." : "Adicionar administrador"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function AdminClient({
  initialTab,
  metrics,
  clientes,
  feedbacks,
  licitacoes,
  time,
}: AdminClientProps) {
  const router = useRouter()

  // Clientes — busca client-side
  const [clienteSearch, setClienteSearch] = useState("")
  const clientesFiltrados = clientes.filter((c) => {
    const q = clienteSearch.toLowerCase()
    return (
      c.email.toLowerCase().includes(q) ||
      (c.razao_social ?? "").toLowerCase().includes(q)
    )
  })

  // Feedbacks — filtro por tipo
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos")
  const feedbacksFiltrados =
    tipoFiltro === "todos"
      ? feedbacks
      : feedbacks.filter((f) => f.tipo === tipoFiltro)

  // Toggle feedback resolvido
  const [, startFeedbackTransition] = useTransition()
  function handleResolverFeedback(id: string, atual: boolean) {
    startFeedbackTransition(async () => {
      const result = await resolverFeedback(id, !atual)
      if (result.error) toast.error(result.error)
      else toast.success(!atual ? "Marcado como resolvido." : "Reaberto.")
    })
  }

  // Toggle admin ativo
  const [, startToggleTransition] = useTransition()
  function handleToggleAdmin(adminId: string, ativo: boolean) {
    startToggleTransition(async () => {
      const result = await toggleAdmin(adminId, ativo)
      if (result.error) toast.error(result.error)
      else toast.success(ativo ? "Administrador desativado." : "Administrador ativado.")
    })
  }

  function handleTabChange(value: string) {
    router.push(`/admin?tab=${value}`, { scroll: false })
  }

  // Helpers de formatação
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR")
  }

  function truncate(str: string, len: number) {
    if (str.length <= len) return str
    return str.slice(0, len) + "…"
  }

  function scoreColor(score: number) {
    if (score >= 80) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    if (score >= 60) return "bg-amber-500/20 text-amber-300 border-amber-500/30"
    return "bg-red-500/20 text-red-300 border-red-500/30"
  }

  function tipoBadge(tipo: string) {
    switch (tipo) {
      case "bug":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      case "sugestao":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30"
      case "elogio":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30"
    }
  }

  function tipoLabel(tipo: string) {
    switch (tipo) {
      case "bug":
        return "Bug"
      case "sugestao":
        return "Sugestão"
      case "elogio":
        return "Elogio"
      default:
        return tipo
    }
  }

  function planoBadge(plano?: string) {
    if (plano === "pro" || plano === "enterprise") {
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    }
    return "bg-slate-600/40 text-slate-400 border-slate-600/40"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
          <Shield className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Admin</h1>
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px] font-semibold uppercase tracking-wider">
              Restrito
            </Badge>
          </div>
          <p className="text-sm text-slate-400">Painel de controle da plataforma</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={initialTab} onValueChange={handleTabChange}>
        <TabsList
          className="inline-flex items-center gap-1 bg-transparent p-0 h-auto border-b border-slate-700/50 w-full rounded-none"
        >
          {[
            { value: "visao_geral", label: "Visão Geral" },
            { value: "clientes", label: "Clientes" },
            { value: "feedbacks", label: "Feedbacks" },
            { value: "licitacoes", label: "Licitações" },
            { value: "time", label: "Time" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={[
                // dimensões fixas — sempre iguais para ativo e inativo
                "h-9 px-4 w-auto shrink-0 flex items-center justify-center",
                "text-sm rounded-lg transition-all duration-200 whitespace-nowrap",
                // borda SEMPRE presente (evita box-model shift ao ativar)
                "border",
                // inativo
                "text-slate-400 border-transparent bg-transparent",
                "hover:text-slate-300 hover:bg-slate-800/40 hover:border-slate-700/30",
                // ativo — liquid glass
                "data-[state=active]:text-[#60a5fa] data-[state=active]:font-semibold",
                "data-[state=active]:border-[rgba(96,165,250,0.5)]",
                "data-[state=active]:backdrop-blur-[12px]",
                "data-[state=active]:shadow-[inset_0_0_16px_rgba(37,99,235,0.25)]",
                "data-[state=active]:[background:rgba(37,99,235,0.2)]",
              ].join(" ")}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Visão Geral ─────────────────────────────────────────────────── */}
        <TabsContent value="visao_geral" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricCard
              icon={Users}
              label="Usuários"
              value={metrics.totalUsers}
              color="bg-blue-500/20 text-blue-400"
            />
            <MetricCard
              icon={Building2}
              label="Empresas"
              value={metrics.totalCompanies}
              color="bg-emerald-500/20 text-emerald-400"
            />
            <MetricCard
              icon={Target}
              label="Oportunidades"
              value={metrics.totalMatches}
              color="bg-violet-500/20 text-violet-400"
            />
            <MetricCard
              icon={FileText}
              label="Documentos"
              value={metrics.totalDocuments}
              color="bg-amber-500/20 text-amber-400"
            />
            <MetricCard
              icon={MessageSquare}
              label="Feedbacks"
              value={metrics.totalFeedbacks}
              color="bg-violet-500/20 text-violet-400"
            />
            <MetricCard
              icon={Shield}
              label="Admins ativos"
              value={metrics.totalAdmins}
              color="bg-red-500/20 text-red-400"
            />
          </div>
        </TabsContent>

        {/* ── Clientes ─────────────────────────────────────────────────────── */}
        <TabsContent value="clientes" className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={clienteSearch}
                onChange={(e) => setClienteSearch(e.target.value)}
                placeholder="Buscar por email ou empresa..."
                className="pl-9 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
              />
            </div>
            <span className="text-sm text-slate-500">
              {clientesFiltrados.length} de {clientes.length}
            </span>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Email</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Empresa</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Plano</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Cadastro</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <TableRow
                      key={cliente.id}
                      className="border-slate-700/30 hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell className="text-slate-300 font-mono text-xs">
                        {cliente.email}
                      </TableCell>
                      <TableCell>
                        {cliente.razao_social ? (
                          <span className="text-white font-medium">{cliente.razao_social}</span>
                        ) : (
                          <span className="text-slate-600 italic text-sm">Sem empresa</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${planoBadge(cliente.plano)}`}
                        >
                          {cliente.plano ?? "gratuito"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 tabular-nums text-sm">
                        {formatDate(cliente.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-slate-400 hover:text-white hover:bg-slate-700/50"
                            onClick={() => window.open("/dashboard", "_blank")}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <EmailSheet userEmail={cliente.email} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Feedbacks ────────────────────────────────────────────────────── */}
        <TabsContent value="feedbacks" className="mt-6 space-y-4">
          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            {["todos", "bug", "sugestao", "elogio"].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setTipoFiltro(tipo)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  tipoFiltro === tipo
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50"
                }`}
              >
                {tipo === "todos"
                  ? "Todos"
                  : tipo === "bug"
                  ? "Bug"
                  : tipo === "sugestao"
                  ? "Sugestão"
                  : "Elogio"}
              </button>
            ))}
            <span className="text-sm text-slate-500 ml-2">
              {feedbacksFiltrados.length} resultado{feedbacksFiltrados.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Usuário</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Tipo</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Título</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Descrição</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider text-center">Resolvido</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacksFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      Nenhum feedback encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  feedbacksFiltrados.map((fb) => (
                    <TableRow
                      key={fb.id}
                      className={`border-slate-700/30 hover:bg-white/[0.02] transition-colors ${
                        fb.resolvido ? "opacity-50" : ""
                      }`}
                    >
                      <TableCell className="text-slate-400 text-xs font-mono max-w-[140px] truncate">
                        {fb.user_email ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${tipoBadge(fb.tipo)}`}
                        >
                          {tipoLabel(fb.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white font-medium text-sm max-w-[180px] truncate">
                        {fb.titulo}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm hidden md:table-cell max-w-[220px]">
                        <span className="line-clamp-2">{fb.descricao}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <AdminToggle
                          checked={fb.resolvido}
                          onChange={() => handleResolverFeedback(fb.id, fb.resolvido)}
                        />
                      </TableCell>
                      <TableCell className="text-slate-500 tabular-nums text-sm">
                        {formatDate(fb.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Licitações ───────────────────────────────────────────────────── */}
        <TabsContent value="licitacoes" className="mt-6">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Oportunidades salvas recentes</h2>
              <span className="text-xs text-slate-500">{licitacoes.length} registros</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Empresa</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Órgão</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Objeto</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider text-center">Score</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licitacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      Nenhuma licitação salva ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  licitacoes.map((lic) => (
                    <TableRow
                      key={lic.id}
                      className="border-slate-700/30 hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell className="text-white font-medium text-sm max-w-[140px] truncate">
                        {lic.razao_social}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm hidden md:table-cell max-w-[160px] truncate">
                        {lic.orgao}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm max-w-[240px]">
                        {truncate(lic.objeto, 60)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs tabular-nums ${scoreColor(lic.relevancia_score)}`}
                        >
                          {lic.relevancia_score}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 tabular-nums text-sm">
                        {formatDate(lic.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Time ─────────────────────────────────────────────────────────── */}
        <TabsContent value="time" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Administradores</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {time.filter((m) => m.ativo).length} membro{time.filter((m) => m.ativo).length !== 1 ? "s" : ""} ativo{time.filter((m) => m.ativo).length !== 1 ? "s" : ""}
              </p>
            </div>
            <AdicionarAdminSheet onSuccess={() => {}} />
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Nome</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Cargo</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Desde</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {time.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      Nenhum administrador cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  time.map((membro) => {
                    const isMaster = membro.email === MASTER_EMAIL
                    return (
                      <TableRow
                        key={membro.id}
                        className="border-slate-700/30 hover:bg-white/[0.02] transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-300 flex-shrink-0">
                              {membro.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm leading-tight">
                                {membro.nome}
                              </p>
                              {isMaster && (
                                <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[9px] font-semibold uppercase tracking-wider h-4 px-1 mt-0.5">
                                  Master
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-slate-400 text-sm">
                          {membro.cargo ?? <span className="text-slate-600 italic">—</span>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-slate-400 text-xs font-mono">
                          {membro.email}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-slate-500 tabular-nums text-sm">
                          {formatDate(membro.created_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          {isMaster ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs"
                            >
                              Ativo
                            </Badge>
                          ) : (
                            <AdminToggle
                              checked={membro.ativo}
                              onChange={() => handleToggleAdmin(membro.id, membro.ativo)}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
