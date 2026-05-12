"use client"

import { useState, useTransition, useCallback } from "react"
import EffectiTab from "./effecti-tab"
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
  Database,
  Trash2,
  RefreshCw,
  Download,
  CheckCircle2,
  SkipForward,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Activity,
  ClipboardList,
  ServerCrash,
  Pencil,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  salvarPortalConfig,
  adicionarColaborador,
  removerColaborador,
  sincronizarPortal,
  atualizarCargo,
  type SyncResult,
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

type UsageMetrics = {
  totalPropostas: number
  totalLicitacoes: number
  totalLicitacoesAtivas: number
  ultimaSync: string | null
  errosSyncCount: number
  usuariosMaisAtivos: Array<{
    user_id: string
    email: string
    propostas: number
    licitacoes_salvas: number
    ativo_30d: boolean
  }>
}

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
  portalConfig: {
    effecti: boolean
    pncp: boolean
    comprasnet: boolean
  }
  usageMetrics: UsageMetrics
  whatsappMensagensHoje: number
  zapiConectado: boolean
  companies: Array<{ id: string; razao_social: string }>
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
    <div className="rounded-xl p-5 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
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
  portalConfig,
  usageMetrics,
  whatsappMensagensHoje,
  zapiConectado,
  companies,
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

  // Colaboradores
  const [colaboradores, setColaboradores] = useState(time.map((m) => ({ id: m.id, email: m.email, created_at: m.created_at })))
  const [novoColabEmail, setNovoColabEmail] = useState("")
  const [colabSheetOpen, setColabSheetOpen] = useState(false)
  const [, startColabTransition] = useTransition()

  function handleAdicionarColab() {
    if (!novoColabEmail.trim()) {
      toast.error("Informe o email do colaborador.")
      return
    }
    startColabTransition(async () => {
      const result = await adicionarColaborador(novoColabEmail.trim())
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Colaborador adicionado com sucesso!")
        setColaboradores((prev) => [
          { id: crypto.randomUUID(), email: novoColabEmail.trim(), created_at: new Date().toISOString() },
          ...prev,
        ])
        setNovoColabEmail("")
        setColabSheetOpen(false)
        router.refresh()
      }
    })
  }

  function handleRemoverColab(email: string) {
    if (email === MASTER_EMAIL) return
    startColabTransition(async () => {
      const result = await removerColaborador(email)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Colaborador removido.")
        setColaboradores((prev) => prev.filter((c) => c.email !== email))
      }
    })
  }

  // ── Sincronização manual ────────────────────────────────────────────────────
  type SyncManualResultado = {
    inseridas: number
    ignoradas: number
    encerradas: number
    buscadas: number
    erros: string[]
    licitacoes_preview: Array<{
      objeto: string
      orgao: string
      uf: string | null
      valor: number | null
      status: string
      source_id: string
    }>
    janelas: Array<{
      inicio: string
      fim: string
      buscadas: number
      inseridas: number
      ignoradas: number
    }>
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const [syncPortal, setSyncPortal] = useState<"todos" | "effecti" | "pncp">("effecti")
  const [syncBegin, setSyncBegin] = useState(hoje)
  const [syncEnd, setSyncEnd] = useState(hoje)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncResultado, setSyncResultado] = useState<SyncManualResultado | null>(null)

  function setSyncAtalho(dias: number) {
    const fim = new Date()
    const ini = new Date(fim.getTime() - dias * 24 * 60 * 60 * 1000)
    setSyncBegin(ini.toISOString().slice(0, 10))
    setSyncEnd(fim.toISOString().slice(0, 10))
  }

  async function handleSyncManual() {
    if (!syncBegin || !syncEnd) {
      toast.error("Preencha as datas de início e fim.")
      return
    }
    setSyncLoading(true)
    setSyncResultado(null)
    try {
      if (syncPortal === "todos") {
        // Rodar Effecti + PNCP sequencialmente e consolidar resultados
        const portaisSeq: Array<"effecti" | "pncp"> = ["effecti", "pncp"]
        let consolidado: SyncManualResultado = { buscadas: 0, inseridas: 0, ignoradas: 0, encerradas: 0, erros: [], licitacoes_preview: [], janelas: [] }
        for (const p of portaisSeq) {
          const res = await fetch("/api/cron/sync-manual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ portal: p, begin: syncBegin, end: syncEnd }),
          })
          const json = await res.json()
          if (!res.ok) {
            toast.error(`Erro no ${p}: ${json.error ?? res.status}`)
            continue
          }
          consolidado = {
            buscadas:           (consolidado.buscadas ?? 0)   + (json.buscadas ?? 0),
            inseridas:          (consolidado.inseridas ?? 0)  + (json.inseridas ?? 0),
            ignoradas:          (consolidado.ignoradas ?? 0)  + (json.ignoradas ?? 0),
            encerradas:         (consolidado.encerradas ?? 0) + (json.encerradas ?? 0),
            erros:              [...(consolidado.erros ?? []), ...(json.erros ?? [])],
            licitacoes_preview: [...(consolidado.licitacoes_preview ?? []), ...(json.licitacoes_preview ?? [])],
            janelas:            [...(consolidado.janelas ?? []), ...(json.janelas ?? [])],
          }
        }
        setSyncResultado(consolidado)
        toast.success(`Sync concluída (ambos portais): ${consolidado.inseridas} inseridas`)
      } else {
        const res = await fetch("/api/cron/sync-manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ portal: syncPortal, begin: syncBegin, end: syncEnd }),
        })
        const json = await res.json()
        if (!res.ok) {
          toast.error(json.error ?? `Erro ${res.status}`)
          return
        }
        setSyncResultado(json)
        toast.success(`Sync concluída: ${json.inseridas} inseridas`)
      }
    } catch (err) {
      toast.error(`Erro: ${String(err)}`)
    } finally {
      setSyncLoading(false)
    }
  }

  // Portais de dados
  const [portais, setPortais] = useState({ effecti: portalConfig.effecti, pncp: portalConfig.pncp, comprasnet: portalConfig.comprasnet })
  const [, startPortalTransition] = useTransition()
  const [sincronizando, setSincronizando] = useState<{ effecti: boolean; pncp: boolean; comprasnet: boolean }>({ effecti: false, pncp: false, comprasnet: false })

  async function handleSincronizar(portal: "effecti" | "pncp" | "comprasnet") {
    setSincronizando((prev) => ({ ...prev, [portal]: true }))
    try {
      const result: SyncResult = await sincronizarPortal(portal)
      if (result.error) {
        toast.error(`Erro na sincronização: ${result.error}`)
      } else {
        const nomes: Record<string, string> = { effecti: "Effecti", pncp: "PNCP", comprasnet: "ComprasNet" }
        const erroLabel = result.erros && result.erros.length > 0 ? ` | ⚠️ ${result.erros.length} erro(s)` : ""
        toast.success(
          `✅ ${nomes[portal]}: ${result.inseridas ?? 0} inseridas, ${result.ignoradas ?? 0} ignoradas, ${result.encerradas ?? 0} encerradas${erroLabel}`,
          { duration: 8000 }
        )
      }
    } finally {
      setSincronizando((prev) => ({ ...prev, [portal]: false }))
    }
  }

  function handleTogglePortal(portal: "effecti" | "pncp" | "comprasnet") {
    const novoValor = !portais[portal]
    setPortais((prev) => ({ ...prev, [portal]: novoValor }))
    startPortalTransition(async () => {
      const result = await salvarPortalConfig(portal, novoValor)
      if (result.error) {
        toast.error(result.error)
        setPortais((prev) => ({ ...prev, [portal]: !novoValor }))
      } else {
        const nomes: Record<string, string> = { effecti: "Effecti", pncp: "PNCP", comprasnet: "ComprasNet" }
        toast.success(`Portal ${nomes[portal]} ${novoValor ? "ativado" : "desativado"}.`)
      }
    })
  }

  // Edição inline de cargo
  const [editandoCargo, setEditandoCargo] = useState<string | null>(null)
  const [cargoDraft, setCargoDraft] = useState("")
  const [, startCargoTransition] = useTransition()

  function iniciarEditarCargo(adminId: string, cargoAtual: string | null) {
    setEditandoCargo(adminId)
    setCargoDraft(cargoAtual ?? "")
  }

  function cancelarEditarCargo() {
    setEditandoCargo(null)
    setCargoDraft("")
  }

  function salvarCargo(adminId: string) {
    startCargoTransition(async () => {
      const result = await atualizarCargo(adminId, cargoDraft)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Cargo atualizado.")
        setEditandoCargo(null)
        router.refresh()
      }
    })
  }

  // Modal de licitações por janela
  type LicitacaoJanela = {
    id: string
    objeto: string | null
    orgao: string | null
    uf: string | null
    valor_estimado: number | null
    modalidade: string | null
    portal: string | null
    status: string | null
    data_publicacao: string | null
  }
  const [janelaModal, setJanelaModal] = useState<{ inicio: string; fim: string } | null>(null)
  const [janelaLics, setJanelaLics] = useState<LicitacaoJanela[]>([])
  const [janelaLoading, setJanelaLoading] = useState(false)
  const [janelaPage, setJanelaPage] = useState(0)
  const JANELA_PAGE_SIZE = 50

  async function abrirJanelaModal(inicio: string, fim: string) {
    setJanelaModal({ inicio, fim })
    setJanelaPage(0)
    setJanelaLics([])
    setJanelaLoading(true)
    try {
      const res = await fetch(`/api/admin/licitacoes-janela?inicio=${inicio}&fim=${fim}`)
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao carregar licitações")
        return
      }
      setJanelaLics(json.licitacoes ?? [])
    } catch {
      toast.error("Erro ao carregar licitações da janela")
    } finally {
      setJanelaLoading(false)
    }
  }

  function fecharJanelaModal() {
    setJanelaModal(null)
    setJanelaLics([])
    setJanelaPage(0)
  }

  // Exportar CSV de licitações (legado)
  const [exportandoCsv, setExportandoCsv] = useState(false)

  function handleExportarCsv() {
    setExportandoCsv(true)
    const link = document.createElement("a")
    link.href = "/api/exportar-licitacoes"
    link.click()
    setTimeout(() => setExportandoCsv(false), 3000)
  }

  // ── Aba Licitações — busca estilo Effecti ────────────────────────────────
  type LicitacaoBusca = {
    id: string
    match_id: string | null
    orgao: string
    uf: string
    objeto: string
    valor_estimado: number | null
    data_abertura: string | null
    portal: string
    modalidade: string
    status: string
    source_url: string | null
    relevancia_score: number
    keywords_matched: string[]
  }

  const [licBuscaCompany, setLicBuscaCompany] = useState<string>("todos")
  const [licBuscaInicio, setLicBuscaInicio] = useState<string>("")
  const [licBuscaFim, setLicBuscaFim] = useState<string>("")
  const [licResultados, setLicResultados] = useState<LicitacaoBusca[]>([])
  const [licLoading, setLicLoading] = useState(false)
  const [licBuscado, setLicBuscado] = useState(false)
  const [licPage, setLicPage] = useState(0)
  const LIC_PAGE_SIZE = 50

  function setLicAtalho(dias: number) {
    const fim = new Date()
    const inicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
    setLicBuscaInicio(inicio.toISOString().slice(0, 10))
    setLicBuscaFim(fim.toISOString().slice(0, 10))
  }

  async function handleLicBuscar() {
    if (!licBuscaInicio || !licBuscaFim) {
      toast.error("Selecione Data Início e Data Fim")
      return
    }
    setLicLoading(true)
    setLicBuscado(false)
    setLicPage(0)
    try {
      const params = new URLSearchParams({
        inicio: licBuscaInicio + "T00:00:00",
        fim: licBuscaFim + "T23:59:59",
      })
      if (licBuscaCompany !== "todos") params.set("company_id", licBuscaCompany)
      const res = await fetch(`/api/admin/licitacoes-busca?${params}`)
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao buscar licitações")
        return
      }
      setLicResultados(json.licitacoes ?? [])
      setLicBuscado(true)
    } catch {
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setLicLoading(false)
    }
  }

  function handleLicExportarCsv() {
    if (licResultados.length === 0) return
    const headers = ["ID", "Órgão", "UF", "Objeto", "Valor Estimado", "Data Abertura", "Portal", "Modalidade", "Status", "Score"]
    const rows = licResultados.map((l) => [
      l.id,
      `"${l.orgao.replace(/"/g, '""')}"`,
      l.uf,
      `"${l.objeto.replace(/"/g, '""')}"`,
      l.valor_estimado != null ? l.valor_estimado.toFixed(2) : "",
      l.data_abertura ? new Date(l.data_abertura).toLocaleDateString("pt-BR") : "",
      l.portal,
      l.modalidade,
      l.status,
      l.relevancia_score,
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `licitacoes_${licBuscaInicio}_${licBuscaFim}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Métricas da busca
  const licMetricas = {
    total: licResultados.length,
    valorTotal: licResultados.reduce((acc, l) => acc + (l.valor_estimado ?? 0), 0),
    ufsDistintas: new Set(licResultados.map((l) => l.uf).filter((u) => u && u !== "—")).size,
    portaisDistintos: new Set(licResultados.map((l) => l.portal).filter((p) => p && p !== "—")).size,
  }

  const licPageCount = Math.max(1, Math.ceil(licResultados.length / LIC_PAGE_SIZE))
  const licPaginados = licResultados.slice(licPage * LIC_PAGE_SIZE, (licPage + 1) * LIC_PAGE_SIZE)

  function formatValor(v: number | null): string {
    if (v == null) return "—"
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`
    return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  }

  // Impersonar cliente
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)
  const handleImpersonate = useCallback(async (userId: string) => {
    setImpersonatingId(userId)
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error ?? "Erro ao impersonar cliente")
        return
      }
      window.location.href = "/dashboard"
    } catch {
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setImpersonatingId(null)
    }
  }, [])

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

  // Dados paginados do modal
  const janelaTotal = janelaLics.length
  const janelaPageCount = Math.ceil(janelaTotal / JANELA_PAGE_SIZE)
  const janelaSlice = janelaLics.slice(janelaPage * JANELA_PAGE_SIZE, (janelaPage + 1) * JANELA_PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* ── Modal licitações por janela ──────────────────────────────── */}
      {janelaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={fecharJanelaModal}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border border-slate-700 overflow-hidden"
            style={{ background: "rgba(15,23,42,0.98)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Licitações da janela
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {janelaModal.inicio} → {janelaModal.fim}
                  {!janelaLoading && <span className="ml-2 text-slate-500">({janelaTotal.toLocaleString("pt-BR")} licitações)</span>}
                </p>
              </div>
              <button
                onClick={fecharJanelaModal}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-auto">
              {janelaLoading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />
                  <span className="ml-2 text-slate-500 text-sm">Carregando...</span>
                </div>
              ) : janelaLics.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
                  Nenhuma licitação encontrada neste período.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700/50 hover:bg-transparent">
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Objeto</TableHead>
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Órgão</TableHead>
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">UF</TableHead>
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Valor</TableHead>
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Portal</TableHead>
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {janelaSlice.map((lic) => (
                      <TableRow key={lic.id} className="border-slate-700/30 hover:bg-white/[0.02]">
                        <TableCell className="text-slate-200 text-xs max-w-[240px]">
                          <span title={lic.objeto ?? ""}>
                            {(lic.objeto ?? "—").length > 80 ? (lic.objeto ?? "").slice(0, 80) + "…" : (lic.objeto ?? "—")}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs hidden md:table-cell max-w-[160px] truncate">
                          {lic.orgao ?? "—"}
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs font-bold">
                          {lic.uf ?? "—"}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs hidden sm:table-cell tabular-nums">
                          {lic.valor_estimado
                            ? lic.valor_estimado.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs">
                          {lic.portal ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={lic.status === "ativa"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]"
                              : "bg-slate-500/20 text-slate-400 border-slate-500/30 text-[10px]"}
                          >
                            {lic.status ?? "—"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Paginação */}
            {janelaPageCount > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700">
                <span className="text-xs text-slate-500">
                  Página {janelaPage + 1} de {janelaPageCount} ({janelaTotal.toLocaleString("pt-BR")} licitações)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setJanelaPage((p) => Math.max(0, p - 1))}
                    disabled={janelaPage === 0}
                    className="h-7 px-2 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setJanelaPage((p) => Math.min(janelaPageCount - 1, p + 1))}
                    disabled={janelaPage >= janelaPageCount - 1}
                    className="h-7 px-2 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
          <Shield className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Admin</h1>
            <Badge className="text-red-300 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-[8px]" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)" }}>
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
            { value: "colaboradores", label: "Colaboradores" },
            { value: "portais", label: "Portais de Dados" },
            { value: "sincronizacao", label: "Sincronização" },
            { value: "metricas", label: "Métricas" },
            { value: "effecti", label: "Effecti" },
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
              color="bg-blue-500/20 text-blue-400"
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
              color="bg-blue-500/20 text-blue-400"
            />
            <MetricCard
              icon={Shield}
              label="Admins ativos"
              value={metrics.totalAdmins}
              color="bg-red-500/20 text-red-400"
            />
          </div>

          {/* Card WhatsApp Z-API */}
          <div className="mt-4 rounded-xl p-5 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">WhatsApp (Z-API)</p>
                  <p className="text-xs text-slate-400">{whatsappMensagensHoje} mensagens enviadas hoje</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${zapiConectado ? "bg-emerald-400" : "bg-red-400"}`} />
                <span className={`text-xs font-medium ${zapiConectado ? "text-emerald-400" : "text-red-400"}`}>
                  {zapiConectado ? "Conectado" : "Desconectado"}
                </span>
              </div>
            </div>
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
                    <TableCell colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <svg className="h-10 w-10 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        <p className="text-sm font-medium text-slate-400">Nenhum cliente cadastrado</p>
                        <p className="text-xs text-slate-500">Os clientes aparecerão aqui após o cadastro.</p>
                      </div>
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
                            className="h-7 px-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                            onClick={() => handleImpersonate(cliente.id)}
                            disabled={impersonatingId === cliente.id}
                            title="Ver como este cliente"
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

        {/* ── Licitações — layout estilo Effecti ──────────────────────────── */}
        <TabsContent value="licitacoes" className="mt-6 space-y-5">

          {/* Filtros */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white">Buscar Licitações</h2>

            {/* Linha 1: seletor de cliente + datas */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1 min-w-[220px] flex-1">
                <label className="text-xs text-slate-400">Cliente</label>
                <Select value={licBuscaCompany} onValueChange={setLicBuscaCompany}>
                  <SelectTrigger className="bg-slate-900/60 border-slate-600 text-white h-9 text-sm">
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="todos">Todos os clientes</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Data Início</label>
                <Input
                  type="date"
                  value={licBuscaInicio}
                  onChange={(e) => setLicBuscaInicio(e.target.value)}
                  className="bg-slate-900/60 border-slate-600 text-white h-9 text-sm w-[160px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Data Fim</label>
                <Input
                  type="date"
                  value={licBuscaFim}
                  onChange={(e) => setLicBuscaFim(e.target.value)}
                  className="bg-slate-900/60 border-slate-600 text-white h-9 text-sm w-[160px]"
                />
              </div>
              <Button
                onClick={handleLicBuscar}
                disabled={licLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-5 gap-1.5"
              >
                <Search className="h-3.5 w-3.5" />
                {licLoading ? "Buscando..." : "Buscar"}
              </Button>
              <Button
                onClick={handleLicExportarCsv}
                disabled={licResultados.length === 0}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700/50 h-9 gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar CSV
              </Button>
            </div>

            {/* Atalhos de período */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Atalhos:</span>
              {[
                { label: "24h", dias: 1 },
                { label: "48h", dias: 2 },
                { label: "4 dias", dias: 4 },
                { label: "7 dias", dias: 7 },
                { label: "14 dias", dias: 14 },
                { label: "30 dias", dias: 30 },
              ].map(({ label, dias }) => (
                <button
                  key={dias}
                  onClick={() => setLicAtalho(dias)}
                  className="px-2.5 py-1 text-xs rounded-md border border-slate-600 text-slate-400
                             hover:border-blue-500/60 hover:text-blue-300 hover:bg-blue-500/10
                             transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards de métricas — exibir só após busca */}
          {licBuscado && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Licitações", value: licMetricas.total.toLocaleString("pt-BR") },
                { label: "Valor Estimado Total", value: formatValor(licMetricas.valorTotal) },
                { label: "UFs Distintas", value: licMetricas.ufsDistintas.toString() },
                { label: "Portais Distintos", value: licMetricas.portaisDistintos.toString() },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl p-4 backdrop-blur-[4px]"
                  style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <p className="text-xs text-slate-400 mb-1">{m.label}</p>
                  <p className="text-2xl font-bold text-white tabular-nums">{m.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabela de resultados */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
            {/* Estado: loading skeleton */}
            {licLoading && (
              <div className="p-6 space-y-3">
                <p className="text-xs text-slate-400 text-center mb-4">Buscando licitações...</p>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-8 rounded-md bg-slate-700/40 animate-pulse" />
                ))}
              </div>
            )}

            {/* Estado: vazio inicial */}
            {!licLoading && !licBuscado && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Search className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Selecione um cliente e período para buscar</p>
              </div>
            )}

            {/* Estado: busca sem resultados */}
            {!licLoading && licBuscado && licResultados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Nenhuma licitação encontrada para o período selecionado</p>
              </div>
            )}

            {/* Tabela */}
            {!licLoading && licResultados.length > 0 && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700/50 hover:bg-transparent">
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider w-8">#</TableHead>
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Órgão</TableHead>
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider w-12">UF</TableHead>
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Objeto</TableHead>
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider text-right">Valor Est.</TableHead>
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Data Abertura</TableHead>
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Portal</TableHead>
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden xl:table-cell">Modalidade</TableHead>
                      <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden xl:table-cell">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licPaginados.map((lic, idx) => (
                      <TableRow
                        key={lic.id}
                        className="border-slate-700/30 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                        onClick={() => lic.source_url && window.open(lic.source_url, "_blank")}
                      >
                        <TableCell className="text-slate-600 text-xs tabular-nums">
                          {licPage * LIC_PAGE_SIZE + idx + 1}
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs max-w-[160px] truncate" title={lic.orgao}>
                          {lic.orgao}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs font-mono">
                          {lic.uf}
                        </TableCell>
                        <TableCell className="text-slate-200 text-xs max-w-[280px]">
                          <span title={lic.objeto} className="group-hover:text-white transition-colors">
                            {truncate(lic.objeto, 80)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs text-slate-300 whitespace-nowrap">
                          {formatValor(lic.valor_estimado)}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs tabular-nums hidden lg:table-cell">
                          {lic.data_abertura ? new Date(lic.data_abertura).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className="text-[10px] border-slate-600 text-slate-400 capitalize"
                          >
                            {lic.portal}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs hidden xl:table-cell max-w-[120px] truncate">
                          {lic.modalidade}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              lic.status === "ativa"
                                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                : lic.status === "encerrada"
                                ? "border-slate-600 text-slate-500"
                                : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                            }`}
                          >
                            {lic.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {licPageCount > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/50">
                    <span className="text-xs text-slate-500">
                      Página {licPage + 1} / {licPageCount} — {licResultados.length.toLocaleString("pt-BR")} licitações
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={licPage === 0}
                        onClick={() => setLicPage((p) => p - 1)}
                        className="h-7 px-2 text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={licPage >= licPageCount - 1}
                        onClick={() => setLicPage((p) => p + 1)}
                        className="h-7 px-2 text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
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
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider w-8" />
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
                          {!isMaster && editandoCargo === membro.id ? (
                            <div className="flex items-center gap-1.5">
                              <Input
                                value={cargoDraft}
                                onChange={(e) => setCargoDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") salvarCargo(membro.id)
                                  if (e.key === "Escape") cancelarEditarCargo()
                                }}
                                placeholder="Ex: Suporte"
                                autoFocus
                                className="h-7 text-xs bg-slate-700 border-slate-600 text-white w-28"
                              />
                              <button onClick={() => salvarCargo(membro.id)} className="text-emerald-400 hover:text-emerald-300">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={cancelarEditarCargo} className="text-slate-500 hover:text-slate-300">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            membro.cargo ?? <span className="text-slate-600 italic">—</span>
                          )}
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
                        <TableCell>
                          {!isMaster && editandoCargo !== membro.id && (
                            <button
                              onClick={() => iniciarEditarCargo(membro.id, membro.cargo)}
                              title="Editar cargo"
                              className="text-slate-500 hover:text-blue-400 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
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
        {/* ── Colaboradores ────────────────────────────────────────────────── */}
        <TabsContent value="colaboradores" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Colaboradores</h2>
                <Badge
                  variant="outline"
                  className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs tabular-nums"
                >
                  {colaboradores.length}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Usuários com acesso ao painel admin
              </p>
            </div>
            <Sheet open={colabSheetOpen} onOpenChange={setColabSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  Adicionar colaborador
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-slate-900 border-slate-700 text-white w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="text-white">Adicionar colaborador</SheetTitle>
                  <p className="text-sm text-slate-400">
                    O usuário precisa ter uma conta ativa na plataforma.
                  </p>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">
                      Email <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={novoColabEmail}
                      onChange={(e) => setNovoColabEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
                      onKeyDown={(e) => e.key === "Enter" && handleAdicionarColab()}
                    />
                  </div>
                  <Button
                    onClick={handleAdicionarColab}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Adicionar
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Email</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Adicionado em</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                      Nenhum colaborador cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  colaboradores.map((colab) => {
                    const isMaster = colab.email === MASTER_EMAIL
                    return (
                      <TableRow
                        key={colab.id}
                        className="border-slate-700/30 hover:bg-white/[0.02] transition-colors"
                      >
                        <TableCell className="text-slate-300 font-mono text-xs">
                          <div className="flex items-center gap-2">
                            {colab.email}
                            {isMaster && (
                              <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[9px] font-semibold uppercase tracking-wider h-4 px-1">
                                Master
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 tabular-nums text-sm">
                          {formatDate(colab.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isMaster && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => handleRemoverColab(colab.email)}
                              title="Remover colaborador"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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

        {/* ── Portais de Dados ─────────────────────────────────────────────── */}
        <TabsContent value="portais" className="mt-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Portais de Dados</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Controle quais portais estão ativos para importação de licitações.
            </p>
          </div>

          <div className="space-y-3">
            {/* Effecti */}
            <div
              className="flex items-center justify-between rounded-xl px-5 py-4 backdrop-blur-[4px]"
              style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                  <Database className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Effecti → Supabase</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Importação via API Effecti (PNCP). Padrão do sistema.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {portais.effecti && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSincronizar("effecti")}
                    disabled={sincronizando.effecti}
                    className="h-8 px-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${sincronizando.effecti ? "animate-spin" : ""}`} />
                    {sincronizando.effecti ? "Sincronizando..." : "Sincronizar agora"}
                  </Button>
                )}
                <AdminToggle
                  checked={portais.effecti}
                  onChange={() => handleTogglePortal("effecti")}
                />
              </div>
            </div>

            {/* PNCP */}
            <div
              className="flex items-center justify-between rounded-xl px-5 py-4 backdrop-blur-[4px]"
              style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/20">
                  <Database className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">PNCP → Supabase</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Desativado por configuração — apenas Effecti ativo.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {portais.pncp && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSincronizar("pncp")}
                    disabled={sincronizando.pncp}
                    className="h-8 px-3 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-blue-500/20 gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${sincronizando.pncp ? "animate-spin" : ""}`} />
                    {sincronizando.pncp ? "Sincronizando..." : "Sincronizar agora"}
                  </Button>
                )}
                <AdminToggle
                  checked={portais.pncp}
                  onChange={() => handleTogglePortal("pncp")}
                />
              </div>
            </div>

            {/* ComprasNet */}
            <div
              className="flex items-center justify-between rounded-xl px-5 py-4 backdrop-blur-[4px]"
              style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/20">
                  <Database className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">ComprasNet → Supabase</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    API pública do Compras.gov.br (SIASG) — licitações federais via PNCP.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {portais.comprasnet && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSincronizar("comprasnet")}
                    disabled={sincronizando.comprasnet}
                    className="h-8 px-3 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-blue-500/20 gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${sincronizando.comprasnet ? "animate-spin" : ""}`} />
                    {sincronizando.comprasnet ? "Sincronizando..." : "Sincronizar agora"}
                  </Button>
                )}
                <AdminToggle
                  checked={portais.comprasnet}
                  onChange={() => handleTogglePortal("comprasnet")}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        {/* ── Sincronização Manual ──────────────────────────────────────── */}
        <TabsContent value="sincronizacao" className="mt-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white">Sincronização Manual</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Busca e importa licitações de um intervalo de datas específico.
            </p>
          </div>

          {/* Painel de controle */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 space-y-4">
            {/* Portal + datas */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Portal</p>
                <Select value={syncPortal} onValueChange={(v) => setSyncPortal(v as "todos" | "effecti" | "pncp")}>
                  <SelectTrigger className="w-48 bg-slate-900 border-slate-600 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="todos">Todos os portais</SelectItem>
                    <SelectItem value="effecti">Effecti</SelectItem>
                    <SelectItem value="pncp">PNCP</SelectItem>
                    <SelectItem value="bnc" disabled className="opacity-50 flex items-center justify-between">
                      <span>BNC — Bolsa Nacional de Compras</span>
                      <span className="ml-2 text-[10px] font-medium bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">Em breve</span>
                    </SelectItem>
                    <SelectItem value="bll" disabled className="opacity-50">
                      <span>BLL</span>
                      <span className="ml-2 text-[10px] font-medium bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">Em breve</span>
                    </SelectItem>
                    <SelectItem value="licitacoes-e" disabled className="opacity-50">
                      <span>Licitações-e</span>
                      <span className="ml-2 text-[10px] font-medium bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">Em breve</span>
                    </SelectItem>
                    <SelectItem value="licitar-digital" disabled className="opacity-50">
                      <span>Licitar Digital</span>
                      <span className="ml-2 text-[10px] font-medium bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">Em breve</span>
                    </SelectItem>
                    <SelectItem value="compras-publicas" disabled className="opacity-50">
                      <span>Compras Públicas</span>
                      <span className="ml-2 text-[10px] font-medium bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">Em breve</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Data Início</p>
                <input
                  type="date"
                  value={syncBegin}
                  onChange={(e) => setSyncBegin(e.target.value)}
                  className="h-9 px-3 rounded-md text-sm bg-slate-900 border border-slate-600 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Data Fim</p>
                <input
                  type="date"
                  value={syncEnd}
                  onChange={(e) => setSyncEnd(e.target.value)}
                  className="h-9 px-3 rounded-md text-sm bg-slate-900 border border-slate-600 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Atalhos de período */}
            <div className="flex flex-wrap gap-2">
              <p className="text-xs text-slate-500 self-center mr-1">Atalhos:</p>
              {[
                { label: "Hoje", dias: 0 },
                { label: "24h", dias: 1 },
                { label: "48h", dias: 2 },
                { label: "7 dias", dias: 7 },
                { label: "30 dias", dias: 30 },
              ].map(({ label, dias }) => (
                <button
                  key={label}
                  onClick={() => setSyncAtalho(dias)}
                  title={dias > 5 ? "Este intervalo será dividido em janelas de 5 dias automaticamente" : undefined}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    dias > 5
                      ? "bg-amber-900/40 text-amber-300 hover:bg-amber-800/50 border-amber-700/50"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white border-slate-600"
                  }`}
                >
                  {label}
                  {dias > 5 && " ⚠"}
                </button>
              ))}
            </div>
            {(syncPortal === "effecti" || syncPortal === "todos") && (() => {
              const begin = syncBegin ? new Date(syncBegin) : null
              const end = syncEnd ? new Date(syncEnd) : null
              const diffDias = begin && end ? Math.ceil((end.getTime() - begin.getTime()) / (24 * 60 * 60 * 1000)) + 1 : 0
              return diffDias > 5 ? (
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  Este intervalo será dividido em janelas de 5 dias automaticamente ({Math.ceil(diffDias / 5)} janelas)
                </p>
              ) : null
            })()}

            {/* Botão buscar */}
            <Button
              onClick={handleSyncManual}
              disabled={syncLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {syncLoading ? (
                <><RefreshCw className="h-4 w-4 animate-spin" />Importando...</>
              ) : (
                <><Download className="h-4 w-4" />Buscar e Importar</>
              )}
            </Button>
          </div>

          {/* Cards de resultado */}
          {syncResultado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl p-4 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-400">Encontradas</span>
                  </div>
                  <p className="text-2xl font-bold text-white tabular-nums">{syncResultado.buscadas.toLocaleString("pt-BR")}</p>
                </div>
                <div className="rounded-xl p-4 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-slate-400">Inseridas</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400 tabular-nums">{syncResultado.inseridas.toLocaleString("pt-BR")}</p>
                </div>
                <div className="rounded-xl p-4 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <SkipForward className="h-4 w-4 text-amber-400" />
                    <span className="text-xs text-slate-400">Ignoradas</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-400 tabular-nums">{syncResultado.ignoradas.toLocaleString("pt-BR")}</p>
                </div>
                <div className="rounded-xl p-4 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-400">Encerradas</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-300 tabular-nums">{syncResultado.encerradas.toLocaleString("pt-BR")}</p>
                </div>
              </div>

              {/* Resumo por janela */}
              {syncResultado.janelas && syncResultado.janelas.length > 0 && (
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-700/50">
                    <h3 className="text-sm font-semibold text-white">Resumo por janela</h3>
                  </div>
                  <div className="divide-y divide-slate-700/30">
                    {syncResultado.janelas.map((j, i) => {
                      const fmtDate = (d: string) => {
                        const [y, m, day] = d.split("-")
                        return `${day}/${m}`
                      }
                      return (
                        <div key={i} className="px-5 py-3 flex items-center justify-between gap-4 text-sm">
                          <span className="text-slate-400 tabular-nums">
                            Janela {i + 1}{" "}
                            <span className="text-slate-500">({fmtDate(j.inicio)} → {fmtDate(j.fim)})</span>
                          </span>
                          <div className="flex items-center gap-4 text-xs tabular-nums">
                            <span className="text-slate-400">{j.buscadas.toLocaleString("pt-BR")} buscadas</span>
                            <span className="text-emerald-400 font-semibold">{j.inseridas.toLocaleString("pt-BR")} inseridas</span>
                            <span className="text-amber-400">{j.ignoradas.toLocaleString("pt-BR")} ignoradas</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => abrirJanelaModal(j.inicio, j.fim)}
                              className="h-7 px-2.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-blue-500/20 gap-1 text-xs"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ver licitações
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Erros */}
              {syncResultado.erros.length > 0 && (
                <div className="rounded-xl border border-red-800/40 bg-red-950/30 p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <p className="text-sm font-medium text-red-300">{syncResultado.erros.length} erro(s) durante a importação</p>
                  </div>
                  {syncResultado.erros.map((e, i) => (
                    <p key={i} className="text-xs text-red-400 font-mono pl-6">{e}</p>
                  ))}
                </div>
              )}

              {/* Tabela de preview */}
              {syncResultado.licitacoes_preview.length > 0 && (
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Licitações importadas nessa sessão</h3>
                    <span className="text-xs text-slate-500">{syncResultado.licitacoes_preview.length} licitações</span>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Objeto</TableHead>
                          <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Órgão</TableHead>
                          <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">UF</TableHead>
                          <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Valor</TableHead>
                          <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {syncResultado.licitacoes_preview.map((lic) => (
                          <TableRow key={lic.source_id} className="border-slate-700/30 hover:bg-white/[0.02]">
                            <TableCell className="text-slate-200 text-xs max-w-[220px]">
                              <span title={lic.objeto}>
                                {lic.objeto.length > 70 ? lic.objeto.slice(0, 70) + "…" : lic.objeto}
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-400 text-xs hidden md:table-cell max-w-[160px] truncate">
                              {lic.orgao}
                            </TableCell>
                            <TableCell className="text-slate-300 text-xs font-bold">
                              {lic.uf ?? "—"}
                            </TableCell>
                            <TableCell className="text-slate-400 text-xs hidden sm:table-cell tabular-nums">
                              {lic.valor
                                ? lic.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={lic.status === "ativa"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]"
                                  : "bg-slate-500/20 text-slate-400 border-slate-500/30 text-[10px]"}
                              >
                                {lic.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Métricas de uso ──────────────────────────────────────────────── */}
        <TabsContent value="metricas" className="mt-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-white">Métricas de Uso</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dados de utilização da plataforma pelos usuários.
            </p>
          </div>

          {/* Linha 1 — Cards de totais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl p-5 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-sm text-slate-400">Total usuários</span>
              </div>
              <p className="text-3xl font-bold text-white tabular-nums">{metrics.totalUsers.toLocaleString("pt-BR")}</p>
            </div>

            <div className="rounded-xl p-5 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <span className="text-sm text-slate-400">Total propostas</span>
              </div>
              <p className="text-3xl font-bold text-white tabular-nums">{usageMetrics.totalPropostas.toLocaleString("pt-BR")}</p>
            </div>

            <div className="rounded-xl p-5 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="text-sm text-slate-400">Licitações no banco</span>
              </div>
              <p className="text-3xl font-bold text-white tabular-nums">{usageMetrics.totalLicitacoes.toLocaleString("pt-BR")}</p>
            </div>

            <div className="rounded-xl p-5 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <span className="text-sm text-slate-400">Licitações ativas</span>
              </div>
              <p className="text-3xl font-bold text-white tabular-nums">{usageMetrics.totalLicitacoesAtivas.toLocaleString("pt-BR")}</p>
            </div>
          </div>

          {/* Linha 2 — Tabela usuários mais ativos */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Usuários mais ativos</h3>
              <span className="text-xs text-slate-500">Top 10 por engajamento</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider">Email</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider text-center">Propostas</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider text-center">Lic. salvas</TableHead>
                  <TableHead className="text-slate-500 font-medium text-xs uppercase tracking-wider text-center">Ativo 30d</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageMetrics.usuariosMaisAtivos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                      Nenhum dado de uso disponível ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  usageMetrics.usuariosMaisAtivos.map((u) => (
                    <TableRow key={u.user_id} className="border-slate-700/30 hover:bg-white/[0.02] transition-colors">
                      <TableCell className="text-slate-300 font-mono text-xs">{u.email}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-white font-semibold tabular-nums">{u.propostas}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-white font-semibold tabular-nums">{u.licitacoes_salvas}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {u.ativo_30d ? (
                          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                            Sim
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-600/40 text-slate-400 border-slate-600/40 text-xs">
                            Não
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Linha 3 — Saúde da plataforma */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Saúde da plataforma</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl p-5 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/20 text-slate-400">
                    <Database className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-slate-400">Licitações no banco</span>
                </div>
                <p className="text-3xl font-bold text-white tabular-nums">{usageMetrics.totalLicitacoes.toLocaleString("pt-BR")}</p>
              </div>

              <div className="rounded-xl p-5 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-slate-400">Licitações ativas</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400 tabular-nums">{usageMetrics.totalLicitacoesAtivas.toLocaleString("pt-BR")}</p>
              </div>

              <div className="rounded-xl p-5 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-slate-400">Última sync</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {usageMetrics.ultimaSync
                    ? new Date(usageMetrics.ultimaSync).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </p>
              </div>

              <div className="rounded-xl p-5 backdrop-blur-[4px]" style={{ background: "rgba(30,41,59,0.6)", border: `1px solid ${usageMetrics.errosSyncCount > 0 ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)"}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${usageMetrics.errosSyncCount > 0 ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400"}`}>
                    <ServerCrash className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-slate-400">Erros de sync (7d)</span>
                </div>
                <p className={`text-3xl font-bold tabular-nums ${usageMetrics.errosSyncCount > 0 ? "text-red-400" : "text-white"}`}>
                  {usageMetrics.errosSyncCount.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>

          </div>
        </TabsContent>

        <TabsContent value="effecti" className="mt-6">
          <EffectiTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
