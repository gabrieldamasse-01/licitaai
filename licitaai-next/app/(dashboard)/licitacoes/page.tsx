import { fetchLicitacoes } from "./actions"
import { LicitacoesClient } from "./licitacoes-client"

export default async function LicitacoesPage() {
  const hoje = new Date()
  const dataFim = hoje.toISOString().split("T")[0]
  const dataInicio = new Date(hoje.getTime() - 4 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  const dadosIniciais = await fetchLicitacoes({ dataInicio, dataFim, pagina: 0 })

  return (
    <LicitacoesClient
      dadosIniciais={dadosIniciais}
      dataInicioDefault={dataInicio}
      dataFimDefault={dataFim}
    />
  )
}
