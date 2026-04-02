/**
 * Serializer de licitação: mapeia o row bruto do Supabase / Effecti API
 * para um DTO tipado e estável.
 *
 * Separar essa camada significa que mudanças no schema do banco ou na API
 * externa não quebram os componentes — só este arquivo precisa ser atualizado.
 */

export type LicitacaoDTO = {
  id: number
  orgao: string
  titulo: string
  modalidade: string
  uf: string
  portal: string
  processo: string
  valor: number
  dataPublicacao: string | null
  dataAbertura: string | null
  dataEncerramento: string | null
  url: string
  cnpj: string
  palavrasEncontradas: string[]
  anexos: { nome: string; url: string }[]
  score?: number
  scoreLabel?: string
  motivo?: string
}

/** Converte um row da tabela `licitacoes` do Supabase para LicitacaoDTO */
export function serializeLicitacaoSupabase(
  row: Record<string, unknown>
): LicitacaoDTO {
  return {
    id: Number(row.source_id ?? 0),
    orgao: String(row.orgao ?? ""),
    titulo: String(row.objeto ?? ""),
    modalidade: String(row.modalidade ?? ""),
    uf: String(row.uf ?? "").substring(0, 2),
    portal: "Supabase",
    processo: String(row.source_id ?? ""),
    valor: Number(row.valor_estimado ?? 0),
    dataPublicacao: row.created_at ? String(row.created_at) : null,
    dataAbertura: row.data_abertura ? String(row.data_abertura) : null,
    dataEncerramento: row.data_encerramento ? String(row.data_encerramento) : null,
    url: String(row.source_url ?? ""),
    cnpj: "",
    palavrasEncontradas: [],
    anexos: [],
  }
}

/** Converte o objeto da Effecti API (já normalizado em actions.ts) para LicitacaoDTO */
export function serializeLicitacaoEffecti(
  row: Record<string, unknown>
): LicitacaoDTO {
  return {
    id: Number(row.idLicitacao ?? 0),
    orgao: String(row.orgao ?? row.unidadeGestora ?? ""),
    titulo: String(row.objetoSemTags ?? row.objeto ?? ""),
    modalidade: String(row.modalidade ?? ""),
    uf: String(row.uf ?? ""),
    portal: String(row.portal ?? "PNCP"),
    processo: String(row.processo ?? ""),
    valor: Number(row.valorTotalEstimado ?? 0),
    dataPublicacao: row.dataPublicacao ? String(row.dataPublicacao) : null,
    dataAbertura: row.dataInicialProposta ? String(row.dataInicialProposta) : null,
    dataEncerramento: row.dataFinalProposta ? String(row.dataFinalProposta) : null,
    url: String(row.url ?? ""),
    cnpj: String(row.cnpj ?? ""),
    palavrasEncontradas: Array.isArray(row.palavraEncontrada)
      ? (row.palavraEncontrada as string[])
      : [],
    anexos: Array.isArray(row.anexos)
      ? (row.anexos as { nome: string; url: string }[])
      : [],
    score: typeof row.score === "number" ? row.score : undefined,
    scoreLabel: typeof row.scoreLabel === "string" ? row.scoreLabel : undefined,
    motivo: typeof row.motivo === "string" ? row.motivo : undefined,
  }
}
