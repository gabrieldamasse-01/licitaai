---
name: claude-api-otimizacao
description: Guia completo para reduzir consumo de tokens e custos na API do Claude. Use esta skill sempre que o usuário perguntar sobre: otimizar tokens, reduzir custo da API do Claude, prompt caching, batch API, seleção de modelo (Haiku/Sonnet/Opus), max_tokens, compressão de prompts, monitorar uso de tokens, ou qualquer dúvida sobre economia na API da Anthropic. Inclui exemplos de código prontos para implementar.
---

# Claude API — Otimização de Tokens e Custos

## Preços atuais (abril/2026)

| Modelo | API ID | Input / Output por 1M tokens |
|---|---|---|
| Haiku 4.5 | `claude-haiku-4-5` | $1 / $5 |
| Sonnet 4.6 | `claude-sonnet-4-6` | $3 / $15 |
| Opus 4.6 | `claude-opus-4-6` | $5 / $25 |
| Opus 4.7 | `claude-opus-4-7` | $5 / $25 |

> Sonnet 4.6 marca 79.6% no SWE-bench com custo 40% menor que Opus 4.7 — melhor custo-benefício para produção.

---

## 1. Seleção de modelo por tarefa

```python
def get_model_for_task(task_type: str) -> str:
    routing = {
        "classificacao":   "claude-haiku-4-5",
        "resumo":          "claude-haiku-4-5",
        "analise":         "claude-sonnet-4-6",
        "geracao_codigo":  "claude-sonnet-4-6",
        "raciocinio":      "claude-opus-4-7",
        "agente_autonomo": "claude-opus-4-7",
    }
    return routing.get(task_type, "claude-sonnet-4-6")
```

## 2. Prompt Caching — até 90% de economia

Mínimo: 2.048 tokens para Sonnet, 4.096 para Opus e Haiku 4.5.

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[{"type": "text", "text": "System prompt longo...", "cache_control": {"type": "ephemeral"}}],
    messages=[{"role": "user", "content": "Pergunta..."}]
)
```

## 3. Batch API — 50% de desconto

```python
batch = client.messages.batches.create(requests=[...])
```

## 4. max_tokens por tarefa

```python
MAX_TOKENS = {"classificacao": 50, "resumo_curto": 512, "analise_media": 1024, "geracao_longa": 2048}
```

## 5. Compressão de prompts

Evitar verbosidade. Usar formato direto: "Analista. Responda em JSON {resumo, risco}."

## 6. Monitorar custo

```python
PRECOS = {"claude-haiku-4-5": (1.0, 5.0), "claude-sonnet-4-6": (3.0, 15.0)}
def calcular_custo(response):
    i, o = PRECOS[response.model]
    return response.usage.input_tokens/1e6*i + response.usage.output_tokens/1e6*o
```
