"use client"

import { useState, useTransition, useMemo } from "react"
import { toast } from "sonner"
import { Plus, Search, FileText, CalendarClock } from "lucide-react"
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
import { criarDocumento, type DocumentoFormData } from "./actions"

type Document = {
  id: string
  tipo: string
  nome_arquivo: string
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

function getStatusInfo(doc: Document): StatusInfo {
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

const emptyForm: DocumentoFormData = {
  company_id: "",
  document_type_id: "",
  tipo: "",
  nome_arquivo: "",
  data_emissao: "",
  data_validade: "",
}

export function DocumentosClient({
  documents,
  companies,
  documentTypes,
}: {
  documents: Document[]
  companies: Company[]
  documentTypes: DocumentType[]
}) {
  const [busca, setBusca] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState<DocumentoFormData>(emptyForm)
  const [isPending, startTransition] = useTransition()

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase()
    if (!q) return documents
    return documents.filter(
      (d) =>
        d.tipo.toLowerCase().includes(q) ||
        getRazaoSocial(d.companies).toLowerCase().includes(q)
    )
  }, [documents, busca])

  function abrirNovo() {
    setForm(emptyForm)
    setSheetOpen(true)
  }

  function handleDocumentTypeChange(id: string) {
    const dt = documentTypes.find((t) => t.id === id)
    setForm((f) => ({ ...f, document_type_id: id, tipo: dt?.nome ?? "" }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await criarDocumento(form)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Documento cadastrado!")
        setSheetOpen(false)
      }
    })
  }

  return (
    <div className="space-y-4">
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
                  return (
                    <TableRow key={doc.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="font-medium text-white">{doc.tipo}</TableCell>
                      <TableCell className="text-slate-400">
                        {getRazaoSocial(doc.companies)}
                      </TableCell>
                      <TableCell className="text-slate-500 max-w-[200px] truncate">
                        {doc.nome_arquivo}
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
                        <Badge
                          variant="outline"
                          className={status.className}
                        >
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
                  <p className="text-sm text-slate-400 truncate">{doc.nome_arquivo}</p>
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
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto backdrop-blur-[12px] border-r" style={{ background: "rgba(15,23,42,0.92)", borderColor: "rgba(96,165,250,0.12)" }}>
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

            <div className="space-y-1.5">
              <Label htmlFor="nome_arquivo" className="text-slate-300">
                Nome do Arquivo <span className="text-red-400">*</span>
              </Label>
              <Input
                id="nome_arquivo"
                value={form.nome_arquivo}
                onChange={(e) => setForm((f) => ({ ...f, nome_arquivo: e.target.value }))}
                placeholder="Ex: cnd_federal_empresa_2026.pdf"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="data_emissao" className="text-slate-300">Data de Emissão</Label>
              <Input
                id="data_emissao"
                type="date"
                value={form.data_emissao ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, data_emissao: e.target.value }))}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="data_validade" className="text-slate-300">Data de Validade</Label>
              <Input
                id="data_validade"
                type="date"
                value={form.data_validade ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, data_validade: e.target.value }))}
                className="bg-slate-800 border-slate-600 text-white"
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
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isPending}
              >
                {isPending ? "Salvando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
