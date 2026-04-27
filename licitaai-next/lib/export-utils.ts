"use client"

export function exportarPDF(texto: string, titulo: string) {
  const janela = window.open("", "_blank")
  if (!janela) return

  janela.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${titulo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      padding: 2.5cm 3cm;
    }
    h1 {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 1.5em;
      text-align: center;
      border-bottom: 1px solid #333;
      padding-bottom: 0.5em;
    }
    p { margin-bottom: 0.8em; text-align: justify; }
    @media print {
      body { padding: 0; }
      @page { margin: 2.5cm 3cm; }
    }
  </style>
</head>
<body>
  <h1>${titulo}</h1>
  ${texto
    .split("\n")
    .map((l) => `<p>${l || "&nbsp;"}</p>`)
    .join("")}
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`)
  janela.document.close()
}

export async function exportarDOCX(texto: string, nomeArquivo: string) {
  const { Document, Paragraph, TextRun, Packer, AlignmentType } = await import("docx")

  const paragrafos = texto.split("\n").map(
    (linha) =>
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({
            text: linha,
            font: "Times New Roman",
            size: 24,
          }),
        ],
        spacing: { after: 160 },
      })
  )

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragrafos,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${nomeArquivo}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
