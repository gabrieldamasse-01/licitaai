"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { editarEmpresa, type EmpresaFormData } from "../actions"

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

export function ClienteEditarSheet({ company }: { company: Company }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<EmpresaFormData>({
    razao_social: company.razao_social,
    cnpj: displayCNPJ(company.cnpj),
    porte: company.porte as EmpresaFormData["porte"],
    cnae: company.cnae?.[0] ?? "",
    email_contato: company.email_contato ?? "",
    contato: company.contato ?? "",
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await editarEmpresa(company.id, form)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Empresa atualizada!")
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4 mr-1.5" />
        Editar
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Editar Empresa</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="razao_social">
                Razão Social <span className="text-red-500">*</span>
              </Label>
              <Input
                id="razao_social"
                value={form.razao_social}
                onChange={(e) => setForm((f) => ({ ...f, razao_social: e.target.value }))}
                placeholder="Empresa LTDA"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cnpj">
                CNPJ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cnpj"
                value={form.cnpj}
                onChange={(e) => setForm((f) => ({ ...f, cnpj: formatCNPJ(e.target.value) }))}
                placeholder="00.000.000/0000-00"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="porte">Porte</Label>
              <Select
                value={form.porte}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, porte: v as EmpresaFormData["porte"] }))
                }
              >
                <SelectTrigger id="porte">
                  <SelectValue placeholder="Selecione o porte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEI">MEI</SelectItem>
                  <SelectItem value="ME">ME — Microempresa</SelectItem>
                  <SelectItem value="EPP">EPP — Pequeno Porte</SelectItem>
                  <SelectItem value="MEDIO">Médio Porte</SelectItem>
                  <SelectItem value="GRANDE">Grande Porte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cnae">CNAE Principal</Label>
              <Input
                id="cnae"
                value={form.cnae ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, cnae: e.target.value }))}
                placeholder="Ex: 6201-5/01 — Desenvolvimento de programas"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email_contato">Email de Contato</Label>
              <Input
                id="email_contato"
                type="email"
                value={form.email_contato ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, email_contato: e.target.value }))}
                placeholder="contato@empresa.com.br"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contato">Telefone / Contato</Label>
              <Input
                id="contato"
                value={form.contato ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, contato: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isPending}
              >
                {isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
