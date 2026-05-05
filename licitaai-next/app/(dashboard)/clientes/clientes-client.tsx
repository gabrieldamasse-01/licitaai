"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Search, Pencil, PowerOff, Power, Building2, Target } from "lucide-react"
import Link from "next/link"
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
import {
  criarEmpresa,
  editarEmpresa,
  desativarEmpresa,
  ativarEmpresa,
  type EmpresaFormData,
} from "./actions"

type Company = {
  id: string
  razao_social: string
  cnpj: string
  porte: string
  cnae: string[]
  email_contato: string | null
  contato: string | null
  ativo: boolean
}

const PORTE_LABELS: Record<string, string> = {
  MEI: "MEI",
  ME: "ME",
  EPP: "EPP",
  MEDIO: "Médio",
  GRANDE: "Grande",
}

function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

function displayCNPJ(cnpj: string) {
  const d = cnpj.replace(/\D/g, "")
  if (d.length !== 14) return cnpj
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

const CNAE_REGEX = /^\d{4}-\d\/\d{2}$/

function validarCNAE(value: string): boolean {
  if (!value.trim()) return true
  return CNAE_REGEX.test(value.trim())
}

const emptyForm: EmpresaFormData = {
  razao_social: "",
  cnpj: "",
  porte: "ME",
  cnae: "",
  email_contato: "",
  contato: "",
}

export function ClientesClient({ companies, isAdmin = false }: { companies: Company[]; isAdmin?: boolean }) {
  const router = useRouter()
  const [busca, setBusca] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editando, setEditando] = useState<Company | null>(null)
  const [form, setForm] = useState<EmpresaFormData>(emptyForm)
  const [cnaeError, setCnaeError] = useState("")
  const [isPending, startTransition] = useTransition()

  const filtradas = useMemo(() => {
    const q = busca.toLowerCase()
    if (!q) return companies
    return companies.filter(
      (c) =>
        c.razao_social.toLowerCase().includes(q) ||
        c.cnpj.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
    )
  }, [companies, busca])

  function abrirNova() {
    setEditando(null)
    setForm(emptyForm)
    setCnaeError("")
    setSheetOpen(true)
  }

  function abrirEditar(company: Company) {
    setEditando(company)
    setCnaeError("")
    setForm({
      razao_social: company.razao_social,
      cnpj: displayCNPJ(company.cnpj),
      porte: company.porte as EmpresaFormData["porte"],
      cnae: company.cnae?.[0] ?? "",
      email_contato: company.email_contato ?? "",
      contato: company.contato ?? "",
    })
    setSheetOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.cnae && !validarCNAE(form.cnae)) {
      setCnaeError("Formato inválido. Use XXXX-X/XX (ex: 6201-5/01)")
      return
    }
    setCnaeError("")
    startTransition(async () => {
      const result = editando
        ? await editarEmpresa(editando.id, form)
        : await criarEmpresa(form)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(editando ? "Empresa atualizada!" : "Empresa cadastrada!")
        setSheetOpen(false)
      }
    })
  }

  function handleToggleAtivo(company: Company) {
    startTransition(async () => {
      const result = company.ativo
        ? await desativarEmpresa(company.id)
        : await ativarEmpresa(company.id)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(company.ativo ? "Empresa desativada" : "Empresa ativada")
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
            placeholder="Buscar por nome ou CNPJ..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-300"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" className="border-blue-600 text-white hover:bg-blue-600/10">
            <Link href="/onboarding/validar-perfil">
              <Target className="h-4 w-4 mr-2" />
              Validar Perfil
            </Link>
          </Button>
          {isAdmin && (
            <Button onClick={abrirNova} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          )}
        </div>
      </div>

      {/* Tabela desktop / Cards mobile */}
      {filtradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-800/30 py-20 text-center">
          <Building2 className="h-10 w-10 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">
            {busca ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}
          </p>
          {!busca && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={abrirNova}
            >
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar primeira empresa
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Tabela — desktop */}
          <div className="hidden md:block rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow overflow-hidden">
            <Table className="data-table">
              <TableHeader>
                <TableRow className="bg-slate-800 border-slate-700">
                  <TableHead className="text-slate-400">Razão Social</TableHead>
                  <TableHead className="text-slate-400">CNPJ</TableHead>
                  <TableHead className="text-slate-400">Porte</TableHead>
                  <TableHead className="text-slate-400">Setor (CNAE)</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-right text-slate-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((company) => (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer border-slate-700 hover:bg-slate-700/50"
                    onClick={() => router.push(`/clientes/${company.id}`)}
                  >
                    <TableCell className="font-medium text-white">{company.razao_social}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-400">{displayCNPJ(company.cnpj)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">{PORTE_LABELS[company.porte] ?? company.porte}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {company.cnae?.[0] ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          company.ativo
                            ? "bg-emerald-900/50 text-emerald-400 border-emerald-800/50"
                            : "bg-slate-700 text-slate-400 border-slate-600"
                        }
                        variant="outline"
                      >
                        {company.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirEditar(company)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleAtivo(company)}
                            title={company.ativo ? "Desativar" : "Ativar"}
                            className={company.ativo ? "text-red-500 hover:text-red-600" : "text-emerald-600 hover:text-emerald-700"}
                            disabled={isPending}
                          >
                            {company.ativo ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Cards — mobile */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtradas.map((company) => (
              <div
                key={company.id}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow p-4 space-y-3 cursor-pointer"
                onClick={() => router.push(`/clientes/${company.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{company.razao_social}</p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      {displayCNPJ(company.cnpj)}
                    </p>
                  </div>
                  <Badge
                    className={
                      company.ativo
                        ? "bg-emerald-900/50 text-emerald-400 border-emerald-800/50 shrink-0"
                        : "bg-slate-700 text-slate-400 border-slate-600 shrink-0"
                    }
                    variant="outline"
                  >
                    {company.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <Badge variant="outline" className="border-slate-600 text-slate-300">{PORTE_LABELS[company.porte] ?? company.porte}</Badge>
                  {company.cnae?.[0] && (
                    <span className="truncate">{company.cnae[0]}</span>
                  )}
                </div>
                <div
                  className="flex gap-2 pt-1 border-t border-slate-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={() => abrirEditar(company)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Editar
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex-1 ${company.ativo ? "text-red-400 border-red-800/50 hover:bg-red-900/30" : "text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/30"}`}
                      onClick={() => handleToggleAtivo(company)}
                      disabled={isPending}
                    >
                      {company.ativo ? (
                        <><PowerOff className="h-3.5 w-3.5 mr-1.5" />Desativar</>
                      ) : (
                        <><Power className="h-3.5 w-3.5 mr-1.5" />Ativar</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Sheet — formulário */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto backdrop-blur-[12px] border-r" style={{ background: "rgba(15,23,42,0.92)", borderColor: "rgba(96,165,250,0.12)" }}>
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white">
              {editando ? "Editar Empresa" : "Nova Empresa"}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="razao_social" className="text-slate-300">
                Razão Social <span className="text-red-400">*</span>
              </Label>
              <Input
                id="razao_social"
                value={form.razao_social}
                onChange={(e) => setForm((f) => ({ ...f, razao_social: e.target.value }))}
                placeholder="Empresa LTDA"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cnpj" className="text-slate-300">
                CNPJ <span className="text-red-400">*</span>
              </Label>
              <Input
                id="cnpj"
                value={form.cnpj}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cnpj: formatCNPJ(e.target.value) }))
                }
                placeholder="00.000.000/0000-00"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="porte" className="text-slate-300">Porte</Label>
              <Select
                value={form.porte}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, porte: v as EmpresaFormData["porte"] }))
                }
              >
                <SelectTrigger id="porte" className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Selecione o porte" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="MEI" className="text-white focus:bg-slate-700">MEI</SelectItem>
                  <SelectItem value="ME" className="text-white focus:bg-slate-700">ME — Microempresa</SelectItem>
                  <SelectItem value="EPP" className="text-white focus:bg-slate-700">EPP — Pequeno Porte</SelectItem>
                  <SelectItem value="MEDIO" className="text-white focus:bg-slate-700">Médio Porte</SelectItem>
                  <SelectItem value="GRANDE" className="text-white focus:bg-slate-700">Grande Porte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cnae" className="text-slate-300">CNAE Principal</Label>
              <Input
                id="cnae"
                value={form.cnae ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  setForm((f) => ({ ...f, cnae: val }))
                  if (cnaeError && validarCNAE(val)) setCnaeError("")
                }}
                onBlur={(e) => {
                  if (e.target.value && !validarCNAE(e.target.value)) {
                    setCnaeError("Formato inválido. Use XXXX-X/XX (ex: 6201-5/01)")
                  }
                }}
                placeholder="Ex: 6201-5/01"
                className={`bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 ${cnaeError ? "border-red-500" : ""}`}
              />
              {cnaeError && <p className="text-xs text-red-400">{cnaeError}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email_contato" className="text-slate-300">Email de Contato</Label>
              <Input
                id="email_contato"
                type="email"
                value={form.email_contato ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, email_contato: e.target.value }))}
                placeholder="contato@empresa.com.br"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contato" className="text-slate-300">Telefone / Contato</Label>
              <Input
                id="contato"
                value={form.contato ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, contato: e.target.value }))}
                placeholder="(11) 99999-9999"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
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
                {isPending ? "Salvando..." : editando ? "Salvar Alterações" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
