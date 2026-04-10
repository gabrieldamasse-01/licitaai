import { fetchLicitacoes } from "./actions"
import { LicitacoesClient } from "./licitacoes-client"

export default async function LicitacoesPage() {
  const dadosIniciais = await fetchLicitacoes({ pagina: 0 })

  return <LicitacoesClient dadosIniciais={dadosIniciais} />
}
