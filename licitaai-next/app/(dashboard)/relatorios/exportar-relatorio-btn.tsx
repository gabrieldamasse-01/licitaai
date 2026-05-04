"use client"

import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ExportarRelatorioBtn() {
  function handleExportar() {
    window.open("/api/relatorio-pdf", "_blank")
  }

  return (
    <Button
      onClick={handleExportar}
      variant="outline"
      className="shrink-0 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 gap-2"
    >
      <FileDown className="h-4 w-4" />
      Exportar PDF
    </Button>
  )
}
