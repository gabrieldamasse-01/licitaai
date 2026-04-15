"use client"

import { useState, useTransition, useMemo, useRef, useCallback } from "react"
import { toast } from "sonner"
import {
  Plus, Search, FileText, CalendarClock,
  Upload, X, Image as ImageIcon, ExternalLink, Loader2, ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { criarDocumento, getSignedUrl, type DocumentoFormData } from "./actions"
import { ChecklistHabilitacao } from "@/app/(dashboard)/oportunidades/checklist"

type Document = {
  id: string
  tipo: string
  nome_arquivo: string
  arquivo_url?: string | null
  data_emissao: string | null
  data_validade: string | null
  status: string
  company_id: string
  companies: { razao_social: string } | { razao_social: string }[] | null
}

type Company = {
  id: string
  razao_social: string
}

type DocumentType = {
  id: string
  nome: string
  categoria: string
}

type StatusInfo = {
  label: string
  className: string
}

const TIPOS_PERMITIDOS = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

function getStatusInfo(doc: Document): StatusInfo {
  if (!doc.arquivo_url) {
    return { label: "Pendente", className: "bg-amber-950/50 text-amber-400 border-amber-800/50" }
  }
  if (doc.status === "vencido") {
    return { label: "Expirado", className: "bg-red-950/50 text-red-400 border-red-800/50" }
  }
  if (doc.status === "pendente") {
    return { label: "Pendente", className: "bg-slate-700 text-slate-400 border-slate-600" }
  }
  if (doc.status === "ativo" && doc.data_validade) {
    const validade = new Date(doc.data_validade + "T00:00:00")
    const em30 = new Date()
    em30.setDate(em30.getDate() + 30)
    if (validade <= em30) {
      return { label: "Vencendo", className: "bg-amber-950/50 text-amber-400 border-amber-800/50" }
    }
  }
  return { label: "Válido", className: "bg-emerald-950/50 text-emerald-400 border-emerald-800/50" }
}

function getRazaoSocial(companies: Document["companies"]): string {
  if (!companies) return "—"
  if (Array.isArray(companies)) return companies[0]?.razao_social ?? "—"
  return companies.razao_social
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function isPdf(path: string): boolean {
  return path.toLowerCase().includes(".pdf")
}

function IaBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/40 bg-blue-950/30 px-2 py-0.5 text-[10px] font-medium text-blue-300">
      <FileText className="h-2.5 w-2.5" />
      Extraído do PDF
    </span>
  )
}

const emptyForm: DocumentoFormData = {
  company_id: "",
  document_type_id: "",
  tipo: "",
  nome_arquivo: "",
  data_emissao: "",
  data_validade: "",
}

export function DocumentosClient({
  documents: initialDocuments,
  companies,
  documentTypes,
}: {
  documents: Document[]
  companies: Company[]
  documentTypes: DocumentType[]
}) {
  const [docs, setDocs] = useState<Document[]>(initialDocuments)
  const [busca, setBusca] = useState("")
  const [checklistEmpresaId, setChecklistEmpresaId] = useState("")
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState<DocumentoFormData>(emptyForm)
  const [isPending, startTransition] = useTransition()
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [arquivoErro, setArquivoErro] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [iaAnalisando, setIaAnalisando] = useState(false)
  const [iaStatus, setIaStatus] = useState<"idle" | "encontrado" | "nao_encontrado">("idle")
  const [iaPreenchido, setIaPreenchido] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingInline, setUploadingInline] = useState<string | null>(null)
  const inlineInputRef = useRef<HTMLInputElement>(null)
  const inlineDocIdRef = useRef<string | null>(null)

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase()
    if (!q) return docs
    return docs.filter(
      (d) =>
        d.tipo.toLowerCase().includes(q) ||
        getRazaoSocial(d.companies).toLowerCase().includes(q)
    )
  }, [docs, busca])

  function abrirNovo() {
    setForm(emptyForm)
    setArquivo(null)
    setArquivoErro(false)
    setUploadProgress(0)
    setIaPreenchido(new Set())
    setIaAnalisando(false)
    setIaStatus("idle")
    setSheetOpen(true)
  }

  function handleDocumentTypeChange(id: string) {
    const dt = documentTypes.find((t) => t.id === id)
    setForm((f) => ({ ...f, document_type_id: id, tipo: dt?.nome ?? "" }))
  }

  function validarArquivo(file: File): string | null {
    if (file.size > MAX_BYTES) return "Arquivo muito grande (máx. 10 MB)"
    if (!TIPOS_PERMITIDOS.includes(file.type)) return "Tipo não permitido. Use PDF, JPG ou PNG"
    return null
  }

  function extrairDatasDoTexto(texto: string): { emissao: string; validade: string } {
    const padroes = [
      /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/g,
      /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2})/g,
    ]

    const datas: string[] = []
    for (const padrao of padroes) {
      const matches = [...texto.matchAll(padrao)]
      for (const m of matches) {
        const dia = m[1], mes = m[2]
        let ano = m[3]
        if (ano.length === 2) ano = parseInt(ano) > 50 ? "19" + ano : "20" + ano
        const d = parseInt(dia), mo = parseInt(mes), a = parseInt(ano)
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12 && a >= 2000 && a <= 2040) {
          datas.push(`${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`)
        }
      }
    }

    const unicas = [...new Set(datas)].sort()
    console.log("[PDF] Datas encontradas:", unicas)
    return {
      emissao: unicas[0] ?? "",
      validade: unicas[unicas.length - 1] ?? "",
    }
  }

  async function analisarPDF(file: File) {
    if (file.type !== "application/pdf") return
    setIaAnalisando(true)
    setIaStatus("idle")
    setIaPreenchido(new Set())
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfjsLib = await import("pdfjs-dist" as any)
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs"

      const arrayBuffer = await file.arrayBuffer()
      console.log("[PDF] Carregando documento, tamanho:", arrayBuffer.byteLength, "bytes")

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      console.log("[PDF] Número de páginas:", pdf.numPages)

      let texto = ""
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        texto += content.items.map((item: any) => item.str ?? "").join(" ") + " "
      }

      console.log("[PDF] Texto extraído (primeiros 500 chars):", texto.slice(0, 500))

      const { emissao, validade } = extrairDatasDoTexto(texto)

      if (!emissao) {
        console.log("[PDF] Nenhuma data válida encontrada no texto")
        setIaStatus("nao_encontrado")
        return
      }

      const preenchidos = new Set<string>()
      setForm((f) => {
        const updates: Partial<DocumentoFormData> = {}
        updates.data_emissao = emissao
        preenchidos.add("data_emissao")
        if (validade && validade !== emissao) {
          updates.data_validade = validade
          preenchidos.add("data_validade")
        }
        return { ...f, ...updates }
      })
      setIaPreenchido(preenchidos)
      setIaStatus("encontrado")
    } catch (err) {
      console.error("[PDF] Erro ao analisar:", err)
      setIaStatus("nao_encontrado")
    } finally {
      setIaAnalisando(false)
    }
  }

  const handleFileSelect = useCallback((file: File) => {
    const err = validarArquivo(file)
    if (err) { toast.error(err); return }
    setArquivo(file)
    setArquivoErro(false)
    setForm((f) => ({ ...f, nome_arquivo: f.nome_arquivo || file.name }))
    analisarPDF(file)
  }, [])

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  function abrirUploadInline(docId: string) {
    inlineDocIdRef.current = docId
    inlineInputRef.current?.click()
  }

  async function handleInlineFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !inlineDocIdRef.current) return
    const err = validarArquivo(file)
    if (err) { toast.error(err); return }
    const docId = inlineDocIdRef.current
    setUploadingInline(docId)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error("Não autenticado"); return }

      // buscar company_id do documento
      const doc = docs.find((d) => d.id === docId)
      if (!doc) return
      const ext = file.name.split(".").pop() ?? "bin"
      const path = `${user.id}/${doc.company_id}/${Date.now()}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(path, file, { contentType: file.type })

      if (uploadError) { toast.error("Erro no upload: " + uploadError.message); return }

      // Recalcular status baseado na data_validade existente do documento
      function calcularStatusInline(data_validade: string | null): string {
        if (!data_validade) return "pendente"
        const validade = new Date(data_validade + "T00:00:00")
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        if (validade < hoje) return "vencido"
        return "ativo"
      }
      const novoStatus = calcularStatusInline(doc.data_validade)

      const { error: updateError } = await supabase
        .from("documents")
        .update({ arquivo_url: uploadData.path, nome_arquivo: file.name, status: novoStatus })
        .eq("id", docId)

      if (updateError) { toast.error("Erro ao salvar referência do arquivo"); return }

      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, arquivo_url: uploadData.path, nome_arquivo: file.name, status: novoStatus }
            : d
        )
      )
      toast.success("Arquivo anexado com sucesso!")
    } finally {
      setUploadingInline(null)
    }
  }

  async function handleAbrirArquivo(path: string) {
    const result = await getSignedUrl(path)
    if (result.error) { toast.error(result.error); return }
    window.open(result.url, "_blank")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!arquivo) {
      setArquivoErro(true)
      return
    }

    let arquivo_url: string | undefined

    if (arquivo) {
      setIsUploading(true)
      setUploadProgress(10)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Não autenticado")
        setIsUploading(false)
        return
      }

      const ext = arquivo.name.split(".").pop() ?? "bin"
      const path = `${user.id}/${form.company_id}/${Date.now()}.${ext}`

      const interval = setInterval(() => {
        setUploadProgress((p) => (p < 85 ? p + 8 : p))
      }, 200)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(path, arquivo, { contentType: arquivo.type })

      clearInterval(interval)

      if (uploadError) {
        toast.error("Erro no upload: " + uploadError.message)
        setIsUploading(false)
        setUploadProgress(0)
        return
      }

      setUploadProgress(100)
      arquivo_url = uploadData.path
      setIsUploading(false)
    }

    startTransition(async () => {
      const result = await criarDocumento({ ...form, arquivo_url })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Documento cadastrado!")
        setSheetOpen(false)
        setArquivo(null)
        setUploadProgress(0)
      }
    })
  }

  const isLoading = isUploading || isPending || iaAnalisando

  return (
    <div className="space-y-4">
      {/* Input oculto para upload inline */}
      <input
        ref={inlineInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleInlineFileSelected}
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por tipo ou empresa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
          />
        </div>
        <Button onClick={abrirNovo} className="bg-blue-600 hover:bg-blue-700 shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Novo Documento
        </Button>
      </div>

      {/* Habilitação */}
      {companies.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50">
          <button
            className="flex w-full items-center justify-between px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            onClick={() => setChecklistOpen((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-slate-400" />
              Checklist de Habilitação
            </div>
            <span className="text-xs text-slate-500">{checklistOpen ? "Fechar" : "Ver"}</span>
          </button>
          {checklistOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-slate-700">
              <div className="pt-4">
                <Select value={checklistEmpresaId} onValueChange={setChecklistEmpresaId}>
                  <SelectTrigger className="w-full sm:w-72 bg-slate-800 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione a empresa..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-white focus:bg-slate-700">
                        {c.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ChecklistHabilitacao empresaId={checklistEmpresaId} />
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/30 py-20 text-center">
          <FileText className="h-10 w-10 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">
            {busca ? "Nenhum documento encontrado" : "Nenhum documento cadastrado"}
          </p>
          {!busca && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={abrirNovo}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar primeiro documento
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Tabela — desktop */}
          <div className="hidden md:block rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800 border-slate-700">
                  <TableHead className="text-slate-400">Tipo</TableHead>
                  <TableHead className="text-slate-400">Empresa</TableHead>
                  <TableHead className="text-slate-400">Nome do Arquivo</TableHead>
                  <TableHead className="text-slate-400">Emissão</TableHead>
                  <TableHead className="text-slate-400">Validade</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((doc) => {
                  const status = getStatusInfo(doc)
                  const temArquivo = !!doc.arquivo_url
                  const ehPdf = temArquivo && isPdf(doc.arquivo_url!)
                  return (
                    <TableRow key={doc.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="font-medium text-white">{doc.tipo}</TableCell>
                      <TableCell className="text-slate-400">
                        {getRazaoSocial(doc.companies)}
                      </TableCell>
                      <TableCell className="max-w-[240px]">
                        {temArquivo ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleAbrirArquivo(doc.arquivo_url!)}
                              className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors text-left min-w-0"
                              title={doc.nome_arquivo}
                            >
                              {ehPdf
                                ? <FileText className="h-3.5 w-3.5 shrink-0" />
                                : <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                              }
                              <span className="truncate text-sm">{doc.nome_arquivo}</span>
                              <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                            </button>
                            <button
                              onClick={() => abrirUploadInline(doc.id)}
                              disabled={uploadingInline === doc.id}
                              title="Substituir arquivo"
                              className="ml-1 shrink-0 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
                            >
                              {uploadingInline === doc.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Upload className="h-3.5 w-3.5" />
                              }
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 truncate text-sm">{doc.nome_arquivo}</span>
                            <button
                              onClick={() => abrirUploadInline(doc.id)}
                              disabled={uploadingInline === doc.id}
                              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-amber-950/50 text-amber-400 border border-amber-800/50 hover:bg-amber-900/60 transition-colors shrink-0 disabled:opacity-50"
                            >
                              {uploadingInline === doc.id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Upload className="h-3 w-3" />
                              }
                              Anexar
                            </button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {formatDate(doc.data_emissao)}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        <span className="flex items-center gap-1.5">
                          {doc.data_validade && (
                            <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                          )}
                          {formatDate(doc.data_validade)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Cards — mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtrados.map((doc) => {
              const status = getStatusInfo(doc)
              const temArquivo = !!doc.arquivo_url
              const ehPdf = temArquivo && isPdf(doc.arquivo_url!)
              return (
                <div
                  key={doc.id}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">{doc.tipo}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {getRazaoSocial(doc.companies)}
                      </p>
                    </div>
                    <Badge variant="outline" className={`${status.className} shrink-0`}>
                      {status.label}
                    </Badge>
                  </div>
                  {temArquivo ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAbrirArquivo(doc.arquivo_url!)}
                        className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm transition-colors min-w-0"
                        title={doc.nome_arquivo}
                      >
                        {ehPdf
                          ? <FileText className="h-3.5 w-3.5 shrink-0" />
                          : <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                        }
                        <span className="truncate">{doc.nome_arquivo}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                      </button>
                      <button
                        onClick={() => abrirUploadInline(doc.id)}
                        disabled={uploadingInline === doc.id}
                        title="Substituir arquivo"
                        className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
                      >
                        {uploadingInline === doc.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Upload className="h-3.5 w-3.5" />
                        }
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-400 truncate">{doc.nome_arquivo}</p>
                      <button
                        onClick={() => abrirUploadInline(doc.id)}
                        disabled={uploadingInline === doc.id}
                        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-amber-950/50 text-amber-400 border border-amber-800/50 hover:bg-amber-900/60 transition-colors shrink-0 disabled:opacity-50"
                      >
                        {uploadingInline === doc.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Upload className="h-3 w-3" />
                        }
                        Anexar
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-700">
                    {doc.data_emissao && (
                      <span>Emissão: {formatDate(doc.data_emissao)}</span>
                    )}
                    {doc.data_validade && (
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        Validade: {formatDate(doc.data_validade)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Sheet — formulário */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto backdrop-blur-[12px] border-r"
          style={{ background: "rgba(15,23,42,0.92)", borderColor: "rgba(96,165,250,0.12)" }}
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">Novo Documento</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="company_id" className="text-slate-300">
                Empresa <span className="text-red-400">*</span>
              </Label>
              <Select
                value={form.company_id}
                onValueChange={(v) => setForm((f) => ({ ...f, company_id: v }))}
                required
              >
                <SelectTrigger id="company_id" className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-white focus:bg-slate-700">
                      {c.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="document_type_id" className="text-slate-300">
                Tipo de Documento <span className="text-red-400">*</span>
              </Label>
              <Select
                value={form.document_type_id}
                onValueChange={handleDocumentTypeChange}
                required
              >
                <SelectTrigger id="document_type_id" className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {documentTypes.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id} className="text-white focus:bg-slate-700">
                      {dt.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload de arquivo */}
            <div className="space-y-1.5">
              <Label className="text-slate-300">
                Arquivo (PDF, JPG, PNG — máx. 10 MB) <span className="text-red-400">*</span>
              </Label>

              {arquivoErro && (
                <p className="text-xs text-red-400">Upload de arquivo obrigatório</p>
              )}

              {arquivo ? (
                /* Preview do arquivo selecionado */
                <div className="flex items-center gap-3 rounded-lg border border-blue-500/40 bg-blue-950/20 p-3">
                  {isPdf(arquivo.name)
                    ? <FileText className="h-8 w-8 text-blue-400 shrink-0" />
                    : <ImageIcon className="h-8 w-8 text-blue-400 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{arquivo.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(arquivo.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setArquivo(null); setUploadProgress(0) }}
                    className="text-slate-400 hover:text-white transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                /* Zona de drag & drop */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed
                    cursor-pointer transition-colors py-8 px-4 text-center
                    ${isDragOver
                      ? "border-blue-500 bg-blue-950/30"
                      : arquivoErro
                        ? "border-red-500/60 bg-red-950/10 hover:border-red-400"
                        : "border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800"
                    }
                  `}
                >
                  <Upload className="h-6 w-6 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-300">
                      Arraste um arquivo ou <span className="text-blue-400 underline">clique para selecionar</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">PDF, JPG, PNG ou WebP</p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                  e.target.value = ""
                }}
              />

              {/* Barra de progresso */}
              {isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Enviando arquivo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadProgress === 100 && !isUploading && (
                <p className="text-xs text-emerald-400">Upload concluído</p>
              )}

              {/* Status de análise IA */}
              {iaAnalisando && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-950/20 px-3 py-2">
                  <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin shrink-0" />
                  <span className="text-xs text-blue-300">Lendo PDF...</span>
                </div>
              )}
              {!iaAnalisando && iaStatus === "encontrado" && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2">
                  <span className="text-xs text-emerald-300">Datas encontradas!</span>
                </div>
              )}
              {!iaAnalisando && iaStatus === "nao_encontrado" && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2">
                  <span className="text-xs text-amber-300">Nenhuma data encontrada — preencha manualmente</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="nome_arquivo" className="text-slate-300">
                  Nome do Arquivo <span className="text-red-400">*</span>
                </Label>
                {iaPreenchido.has("nome_arquivo") && <IaBadge />}
              </div>
              <Input
                id="nome_arquivo"
                value={form.nome_arquivo}
                onChange={(e) => {
                  setIaPreenchido((s) => { const n = new Set(s); n.delete("nome_arquivo"); return n })
                  setForm((f) => ({ ...f, nome_arquivo: e.target.value }))
                }}
                placeholder="Ex: cnd_federal_empresa_2026.pdf"
                className={`bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 ${iaPreenchido.has("nome_arquivo") ? "border-violet-500/60" : ""}`}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="data_emissao" className="text-slate-300">Data de Emissão</Label>
                {iaPreenchido.has("data_emissao") && <IaBadge />}
              </div>
              <Input
                id="data_emissao"
                type="date"
                value={form.data_emissao ?? ""}
                onChange={(e) => {
                  setIaPreenchido((s) => { const n = new Set(s); n.delete("data_emissao"); return n })
                  setForm((f) => ({ ...f, data_emissao: e.target.value }))
                }}
                className={`bg-slate-800 border-slate-600 text-white ${iaPreenchido.has("data_emissao") ? "border-violet-500/60" : ""}`}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="data_validade" className="text-slate-300">Data de Validade</Label>
                {iaPreenchido.has("data_validade") && <IaBadge />}
              </div>
              <Input
                id="data_validade"
                type="date"
                value={form.data_validade ?? ""}
                onChange={(e) => {
                  setIaPreenchido((s) => { const n = new Set(s); n.delete("data_validade"); return n })
                  setForm((f) => ({ ...f, data_validade: e.target.value }))
                }}
                className={`bg-slate-800 border-slate-600 text-white ${iaPreenchido.has("data_validade") ? "border-violet-500/60" : ""}`}
              />
              <p className="text-xs text-slate-500">
                Status calculado automaticamente com base na validade.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => setSheetOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isUploading ? "Enviando..." : isPending ? "Salvando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
