import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

// Tipagem do payload enviado pelo Storage Webhook do Supabase
interface StorageWebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    bucket_id: string;
    name: string; // caminho do arquivo, ex: "pasta/meu-doc.pdf"
    id: string;
    owner: string;
    created_at: string;
    updated_at: string;
    last_accessed_at: string;
    metadata: Record<string, unknown>;
  };
  schema: string;
  old_record: null | Record<string, unknown>;
}

interface AIAnalysisResult {
  nome_documento: string;
  data_vencimento: string | null; // formato YYYY-MM-DD ou null se não encontrado
}

Deno.serve(async (req: Request) => {
  // Verificar método
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verificar secret do webhook para segurança
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  if (webhookSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let payload: StorageWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  console.log("Payload do Webhook:", JSON.stringify(payload));

  // Só processar eventos de INSERT (novo upload)
  if (payload.type !== "INSERT") {
    return new Response(JSON.stringify({ message: "Evento ignorado (não é INSERT)" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { bucket_id, name: filePath } = payload.record;

  // Aceitar apenas PDFs no bucket "documentos"
  if (bucket_id !== "documentos" || !filePath.toLowerCase().endsWith(".pdf")) {
    return new Response(
      JSON.stringify({ message: "Arquivo ignorado (não é PDF no bucket documentos)" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log(`Processando arquivo: ${filePath} do bucket: ${bucket_id}`);

  // Inicializar cliente Supabase com service_role (acesso total)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // 1. Fazer download do PDF do Storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(bucket_id)
    .download(filePath);

  if (downloadError || !fileData) {
    console.error("Erro ao baixar arquivo:", downloadError);
    return new Response(
      JSON.stringify({ error: "Falha ao baixar o arquivo do Storage" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Converter PDF para base64 para enviar à API da IA
  const pdfArrayBuffer = await fileData.arrayBuffer();
  const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfArrayBuffer)));

  // 3. Analisar o PDF com a API da Anthropic/Claude
  let analysisResult: AIAnalysisResult;
  try {
    analysisResult = await analyzeDocumentWithAI(pdfBase64);
  } catch (aiError) {
    console.error("Erro na análise de IA:", aiError);
    return new Response(
      JSON.stringify({ error: "Falha na análise do documento pela IA" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Determinar status baseado na data de vencimento
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let status: "valido" | "expirado" | "pendente" = "pendente";
  if (analysisResult.data_vencimento) {
    const dataVencimento = new Date(analysisResult.data_vencimento + "T00:00:00");
    status = dataVencimento >= hoje ? "valido" : "expirado";
    console.log(`Data de vencimento extraída: ${analysisResult.data_vencimento} → status: ${status}`);
  } else {
    console.warn("IA não encontrou data de vencimento. Status permanece 'pendente'.");
  }

  // 5. Construir a URL pública do arquivo para localizar o registro
  const { data: publicUrlData } = supabase.storage
    .from(bucket_id)
    .getPublicUrl(filePath);

  const fileUrl = publicUrlData.publicUrl;
  const fileName = filePath.split("/").pop() ?? filePath;

  // 6. Montar payload de update — data_vencimento só incluída se não for null
  const updatePayload: Record<string, unknown> = {
    nome_documento: analysisResult.nome_documento,
    status: status,
    processado_em: new Date().toISOString(),
  };
  const dataValida = analysisResult.data_vencimento &&
    /^\d{4}-\d{2}-\d{2}$/.test(analysisResult.data_vencimento);
  if (dataValida) {
    updatePayload.data_vencimento = analysisResult.data_vencimento;
  } else if (analysisResult.data_vencimento) {
    console.warn(`data_vencimento ignorada (formato inválido): "${analysisResult.data_vencimento}"`);
  }

  // 7. Localizar o registro na tabela "documentos"
  //    Estratégia permissiva: URL exata → URL contém fileName → nome_arquivo contém fileName
  console.log("JSON da IA:", JSON.stringify(analysisResult));
  console.log(`Buscando registro — fileUrl: ${fileUrl} | fileName: ${fileName}`);

  const { data: docEncontrado, error: findError } = await supabase
    .from("documentos")
    .select("id")
    .or(`url.eq.${fileUrl},url.ilike.%${encodeURIComponent(fileName)}%,url.ilike.%${fileName}%,nome_arquivo.ilike.%${fileName}%`)
    .limit(1)
    .maybeSingle();

  if (findError) {
    console.error("Erro ao buscar documento:", findError);
  }

  if (!docEncontrado) {
    console.warn(
      `Documento não encontrado no banco. Nenhuma linha atualizada.\n` +
      `  fileUrl buscada: ${fileUrl}\n` +
      `  fileName buscado: ${fileName}`
    );
    return new Response(
      JSON.stringify({
        success: true,
        aviso: "Documento processado pela IA, mas registro não encontrado no banco para atualizar.",
        arquivo: filePath,
        nome_documento: analysisResult.nome_documento,
        data_vencimento: analysisResult.data_vencimento,
        status,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // 8. Atualizar pelo ID encontrado
  const { data: updateData, error: updateError } = await supabase
    .from("documentos")
    .update(updatePayload)
    .eq("id", docEncontrado.id)
    .select();

  if (updateError) {
    console.error("Erro ao atualizar banco:", updateError);
    return new Response(
      JSON.stringify({ error: "Falha ao atualizar registro no banco de dados" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log(`Documento processado com sucesso. Status: ${status}`);

  return new Response(
    JSON.stringify({
      success: true,
      arquivo: filePath,
      nome_documento: analysisResult.nome_documento,
      data_vencimento: analysisResult.data_vencimento,
      status,
      registros_atualizados: updateData?.length ?? 0,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

/**
 * Envia o PDF (base64) para a API da Anthropic e retorna
 * nome_documento e data_vencimento em JSON estrito.
 */
async function analyzeDocumentWithAI(pdfBase64: string): Promise<AIAnalysisResult> {
  const apiKey = Deno.env.get("AI_API_KEY");
  if (!apiKey) {
    throw new Error("AI_API_KEY não configurada");
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: `Você é um especialista em análise de documentos oficiais brasileiros. Analise o PDF e retorne APENAS um JSON válido (sem markdown, sem texto fora do JSON).

ESTRUTURA OBRIGATÓRIA:
{
  "nome_documento": "<título oficial ou descrição concisa>",
  "data_vencimento": "<YYYY-MM-DD ou null>"
}

INSTRUÇÕES PARA nome_documento:
- Use o título oficial do documento (ex: "Certidão Negativa de Débitos Federais", "Alvará de Funcionamento")
- Se não houver título explícito, crie uma descrição concisa baseada no conteúdo

INSTRUÇÕES CRÍTICAS PARA data_vencimento:
1. Procure ATIVAMENTE por qualquer um destes termos no documento:
   - "Data de Vencimento", "Vencimento", "Válido até", "Validade"
   - "Data de Validade", "Expira em", "Expiration Date"
   - "Válido por X meses/dias/anos" (calcule a partir da data de emissão)
   - "Prazo de validade", "Vigência até"

2. CONVERSÃO OBRIGATÓRIA para formato ISO YYYY-MM-DD:
   - O formato DEVE ser exatamente: 4 dígitos do ano, hífen, 2 dígitos do mês, hífen, 2 dígitos do dia
   - EXEMPLO CORRETO: "2027-06-30"  EXEMPLO ERRADO: "30/06/2027" ou "30-06-2027"
   - "30 de Junho de 2027"  → "2027-06-30"
   - "30/06/2027"           → "2027-06-30"
   - "Jun 30, 2027"         → "2027-06-30"
   - "2027-06-30"           → "2027-06-30" (já correto)
   - Meses por extenso: Janeiro=01, Fevereiro=02, Março=03, Abril=04, Maio=05,
     Junho=06, Julho=07, Agosto=08, Setembro=09, Outubro=10, Novembro=11, Dezembro=12

3. Se o documento disser "válido por N meses" → some N meses à data de emissão
4. Se após busca exaustiva NÃO encontrar nenhuma data de validade → retorne exatamente null (sem aspas)
5. NUNCA retorne a data em outro formato que não seja YYYY-MM-DD. Se não conseguir converter, retorne null.

Retorne SOMENTE o JSON. Nenhum texto antes ou depois.`,
          },
        ],
      },
    ],
  });

  const rawText = message.content[0].type === "text" ? message.content[0].text : "";

  console.log("Resposta bruta da IA:", rawText);

  // Extrair JSON da resposta (caso venha com markdown ```json)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Resposta da IA não contém JSON válido: ${rawText}`);
  }

  const result = JSON.parse(jsonMatch[0]) as AIAnalysisResult;

  // nome_documento é obrigatório
  if (!result.nome_documento) {
    throw new Error(`JSON da IA sem nome_documento: ${JSON.stringify(result)}`);
  }

  // Normalizar data: converter qualquer formato para YYYY-MM-DD via parser TypeScript
  if (result.data_vencimento !== null && result.data_vencimento !== undefined) {
    const raw = String(result.data_vencimento).trim();
    const parsed = parseToISO(raw);
    if (parsed) {
      console.log(`data_vencimento: "${raw}" → "${parsed}"`);
    } else {
      console.warn(`data_vencimento não reconhecida: "${raw}" — descartando`);
    }
    result.data_vencimento = parsed;
  } else {
    result.data_vencimento = null;
  }

  return result;
}

/**
 * Converte qualquer representação de data para o formato ISO YYYY-MM-DD.
 * Retorna null se o valor não puder ser interpretado como data válida.
 *
 * Formatos suportados:
 *   "2027-06-30"          ISO (pass-through)
 *   "30/06/2027"          DD/MM/YYYY
 *   "06/30/2027"          MM/DD/YYYY (detectado quando mês > 12 impossível)
 *   "30-06-2027"          DD-MM-YYYY
 *   "30 de Junho de 2027" Português por extenso
 *   "30 de junho de 2027" Português por extenso (case-insensitive)
 *   "Jun 30, 2027"        Inglês abreviado
 *   "June 30, 2027"       Inglês por extenso
 */
function parseToISO(value: string): string | null {
  if (!value || value.toLowerCase() === "null") return null;

  const MESES_PT: Record<string, string> = {
    janeiro: "01", fevereiro: "02", março: "03", marco: "03",
    abril: "04", maio: "05", junho: "06", julho: "07",
    agosto: "08", setembro: "09", outubro: "10", novembro: "11", dezembro: "12",
  };

  const MESES_EN: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04",
    may: "05", jun: "06", jul: "07", aug: "08",
    sep: "09", oct: "10", nov: "11", dec: "12",
    january: "01", february: "02", march: "03", april: "04",
    june: "06", july: "07", august: "08", september: "09",
    october: "10", november: "11", december: "12",
  };

  const v = value.trim();

  // 1. Já está em YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return isCalendarValid(v) ? v : null;
  }

  // 2. Português por extenso: "30 de Junho de 2027" ou "30 de junho de 2027"
  const ptMatch = v.match(/^(\d{1,2})\s+de\s+([a-záéíóúãõç]+)\s+de\s+(\d{4})$/i);
  if (ptMatch) {
    const day = ptMatch[1].padStart(2, "0");
    const month = MESES_PT[ptMatch[2].toLowerCase()];
    const year = ptMatch[3];
    if (month) return isCalendarValid(`${year}-${month}-${day}`) ? `${year}-${month}-${day}` : null;
  }

  // 3. DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
  const dmyMatch = v.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const [, a, b, year] = dmyMatch;
    // Se o primeiro número > 12, só pode ser dia
    const [day, month] = Number(a) > 12 ? [a, b] : [a, b];
    const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    return isCalendarValid(iso) ? iso : null;
  }

  // 4. Inglês abreviado/por extenso: "Jun 30, 2027" ou "June 30, 2027"
  const enMatch = v.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (enMatch) {
    const month = MESES_EN[enMatch[1].toLowerCase()];
    const day = enMatch[2].padStart(2, "0");
    const year = enMatch[3];
    if (month) return isCalendarValid(`${year}-${month}-${day}`) ? `${year}-${month}-${day}` : null;
  }

  // 5. YYYY/MM/DD ou YYYY.MM.DD
  const ymdMatch = v.match(/^(\d{4})[\/\.](\d{2})[\/\.](\d{2})$/);
  if (ymdMatch) {
    const iso = `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
    return isCalendarValid(iso) ? iso : null;
  }

  return null;
}

/** Verifica se uma string YYYY-MM-DD representa uma data real no calendário. */
function isCalendarValid(iso: string): boolean {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return false;
  // Checa se o JS não rolou para o mês seguinte (ex: "2027-02-30")
  return iso === d.toISOString().slice(0, 10);
}
