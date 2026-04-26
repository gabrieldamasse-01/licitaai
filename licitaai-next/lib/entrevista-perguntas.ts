export const UFS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

export type TipoPergunta = "select" | "text" | "multiselect" | "multiselect-ufs"

export interface PerguntaOnboarding {
  id: number
  bloco: string
  pergunta: string
  tipo: TipoPergunta
  opcoes?: string[]
  placeholder?: string
}

export const PERGUNTAS_ONBOARDING: PerguntaOnboarding[] = [
  {
    id: 1,
    bloco: "capacidade",
    pergunta: "Qual é o porte da sua empresa?",
    tipo: "select",
    opcoes: ["MEI", "ME", "EPP", "Médio Porte", "Grande Porte"],
  },
  {
    id: 2,
    bloco: "capacidade",
    pergunta: "Há quanto tempo sua empresa participa de licitações?",
    tipo: "select",
    opcoes: ["Nunca participou", "Menos de 1 ano", "1 a 3 anos", "Mais de 3 anos"],
  },
  {
    id: 3,
    bloco: "nicho",
    pergunta: "Qual é a principal atividade da sua empresa?",
    tipo: "text",
    placeholder: "Ex: construção civil, TI, limpeza, alimentação...",
  },
  {
    id: 4,
    bloco: "nicho",
    pergunta: "Sua empresa possui alguma certificação ou registro especial?",
    tipo: "multiselect",
    opcoes: ["CREA/CAU", "CRM/CRO", "ANVISA", "ISO 9001", "Nenhuma", "Outra"],
  },
  {
    id: 5,
    bloco: "geografico",
    pergunta: "Em quais estados sua empresa pode prestar serviços?",
    tipo: "multiselect-ufs",
  },
  {
    id: 6,
    bloco: "geografico",
    pergunta: "Sua empresa tem estrutura para atender contratos fora do estado sede?",
    tipo: "select",
    opcoes: ["Sim, qualquer estado", "Sim, estados próximos", "Apenas estado sede"],
  },
  {
    id: 7,
    bloco: "financeiro",
    pergunta: "Qual o valor mínimo de contrato que sua empresa tem interesse?",
    tipo: "select",
    opcoes: [
      "Sem mínimo",
      "Acima de R$ 10 mil",
      "Acima de R$ 50 mil",
      "Acima de R$ 100 mil",
      "Acima de R$ 500 mil",
    ],
  },
  {
    id: 8,
    bloco: "financeiro",
    pergunta: "Quais modalidades de licitação sua empresa prefere?",
    tipo: "multiselect",
    opcoes: ["Pregão Eletrônico", "Dispensa", "Concorrência", "Credenciamento", "Todas"],
  },
]
