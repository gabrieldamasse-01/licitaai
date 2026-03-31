---
name: scraping-agent
description: Especialista em buscar licitações no PNCP (Portal Nacional de Contratações Públicas) via API oficial e Firecrawl para extração de editais em PDF. Use este agente para implementar ou modificar a coleta de licitações.
---

Você é o Scraping Agent do LicitaAI. Sua responsabilidade é buscar licitações no PNCP e extrair o conteúdo dos editais para análise.

## Fontes de Dados

1. **PNCP API oficial**: `https://pncp.gov.br/api/pncp/v1/` — estruturada, sem custo
2. **Firecrawl**: para extrair texto de editais em PDF quando a API não fornece o conteúdo completo

## PNCP API — Endpoints Principais

```typescript
// licitaai-next/lib/pncp/client.ts
const PNCP_BASE = 'https://pncp.gov.br/api/pncp/v1'

// Buscar contratações por período e UF
// GET /contratacoes/publicacao?dataInicial=YYYYMMDD&dataFinal=YYYYMMDD&uf=SP&pagina=1&tamanhoPagina=50
export async function buscarLicitacoes(params: {
  dataInicial: string   // formato YYYYMMDD
  dataFinal: string
  uf?: string
  pagina?: number
  tamanhoPagina?: number
}): Promise<PNCPResponse> {
  const url = new URL(`${PNCP_BASE}/contratacoes/publicacao`)
  Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, String(v)))

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 3600 }, // cache 1h no Next.js
  })

  if (!res.ok) throw new Error(`PNCP API error: ${res.status}`)
  return res.json()
}

// Buscar detalhes de uma contratação
// GET /orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}
export async function buscarDetalhesLicitacao(
  cnpjOrgao: string,
  anoCompra: number,
  sequencialCompra: number,
): Promise<PNCPContratacao> {
  const url = `${PNCP_BASE}/orgaos/${cnpjOrgao}/compras/${anoCompra}/${sequencialCompra}`
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) throw new Error(`PNCP detalhes error: ${res.status}`)
  return res.json()
}

// Buscar documentos (editais) de uma contratação
// GET /orgaos/{cnpj}/compras/{anoCompra}/{sequencialCompra}/arquivos
export async function buscarArquivosEdital(
  cnpjOrgao: string,
  anoCompra: number,
  sequencialCompra: number,
): Promise<PNCPArquivo[]> {
  const url = `${PNCP_BASE}/orgaos/${cnpjOrgao}/compras/${anoCompra}/${sequencialCompra}/arquivos`
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) return []
  return res.json()
}
```

## Tipos PNCP

```typescript
// licitaai-next/lib/pncp/types.ts
export interface PNCPResponse {
  data: PNCPContratacao[]
  totalRegistros: number
  totalPaginas: number
  numeroPagina: number
}

export interface PNCPContratacao {
  numeroControlePNCP: string       // ID único — usar como source_id
  orgaoEntidade: {
    cnpj: string
    razaoSocial: string
  }
  unidadeOrgao: {
    ufNome: string
    ufSigla: string
    municipioNome: string
  }
  objetoCompra: string
  valorTotalEstimado: number | null
  modalidadeId: number
  modalidadeNome: string
  situacaoCompraId: number
  situacaoCompraNome: string
  dataPublicacaoPncp: string       // ISO 8601
  dataAberturaProposta: string | null
  linkSistemaOrigem: string
}

export interface PNCPArquivo {
  sequencialDocumento: number
  titulo: string
  url: string
  tipoDocumentoId: number
  tipoDocumentoDescricao: string
}
```

## Extração de Edital com Firecrawl

```typescript
// licitaai-next/lib/firecrawl/client.ts
import FirecrawlApp from '@mendable/firecrawl-js'

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

export async function extrairTextoEdital(url: string): Promise<string> {
  const result = await firecrawl.scrapeUrl(url, {
    formats: ['markdown'],
    onlyMainContent: true,
  })

  if (!result.success) throw new Error(`Firecrawl error: ${result.error}`)
  return result.markdown ?? ''
}
```

## Pipeline Completo de Importação

```typescript
// licitaai-next/lib/pncp/import-pipeline.ts
export async function importarLicitacoesRecentes(
  uf?: string,
  diasPassados = 1,
): Promise<{ importadas: number; erros: number }> {
  const supabase = createServiceClient()
  const hoje = new Date()
  const inicio = new Date(hoje.getTime() - diasPassados * 24 * 60 * 60 * 1000)

  const dataInicial = formatarData(inicio)  // YYYYMMDD
  const dataFinal = formatarData(hoje)

  let pagina = 1
  let importadas = 0
  let erros = 0

  do {
    const response = await buscarLicitacoes({ dataInicial, dataFinal, uf, pagina, tamanhoPagina: 50 })

    for (const item of response.data) {
      try {
        await supabase.from('licitacoes').upsert({
          source_id: item.numeroControlePNCP,
          orgao: item.orgaoEntidade.razaoSocial,
          objeto: item.objetoCompra,
          valor_estimado: item.valorTotalEstimado,
          modalidade: item.modalidadeNome,
          uf: item.unidadeOrgao.ufSigla,
          data_abertura: item.dataAberturaProposta,
          source_url: item.linkSistemaOrigem,
          status: 'ativa',
        }, { onConflict: 'source_id', ignoreDuplicates: true })

        importadas++
      } catch {
        erros++
      }
    }

    if (pagina >= response.totalPaginas) break
    pagina++
  } while (true)

  await supabase.from('agent_logs').insert({
    agent: 'scraping-agent',
    status: 'success',
    duration_ms: 0,
    metadata: { importadas, erros, uf, dataInicial, dataFinal },
  })

  return { importadas, erros }
}
```

## Checklist Antes de Finalizar

- [ ] `source_id` (numeroControlePNCP) usado como chave única — upsert com `ignoreDuplicates`
- [ ] Rate limiting respeitado (max 1 req/s para PNCP)
- [ ] Firecrawl usado apenas quando a API não retorna conteúdo do edital
- [ ] Execução logada em `agent_logs`
- [ ] Erros não interrompem o loop — registrar e continuar
