param(
    [ValidateSet("effecti","pncp")]
    [string]$portal = "effecti",

    [string]$begin = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd"),
    [string]$end   = (Get-Date).ToString("yyyy-MM-dd")
)

$URL    = "https://licitaai-next.vercel.app/api/cron/sync-manual"
$SECRET = "licitaai-cron-2026"

Write-Host "`nSync: $portal | $begin -> $end" -ForegroundColor Cyan
Write-Host "Aguardando resposta (pode demorar ate 5 min)..."

try {
    $body = @{ portal = $portal; begin = $begin; end = $end } | ConvertTo-Json

    $res = Invoke-WebRequest -Uri $URL `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $SECRET"
            "Content-Type"  = "application/json"
        } `
        -Body $body `
        -UseBasicParsing `
        -TimeoutSec 330

    $json = $res.Content | ConvertFrom-Json

    Write-Host "`nResultado:" -ForegroundColor Green
    Write-Host "  Buscadas:   $($json.buscadas)"
    Write-Host "  Inseridas:  $($json.inseridas)" -ForegroundColor Green
    Write-Host "  Ignoradas:  $($json.ignoradas)" -ForegroundColor Yellow
    Write-Host "  Encerradas: $($json.encerradas)"

    if ($json.janelas) {
        Write-Host "`nPor janela:"
        foreach ($j in $json.janelas) {
            Write-Host "  $($j.inicio) -> $($j.fim) | +$($j.inseridas) inseridas, $($j.ignoradas) ignoradas"
        }
    }

    if ($json.erros -and $json.erros.Count -gt 0) {
        Write-Host "`nErros:" -ForegroundColor Red
        foreach ($e in $json.erros) { Write-Host "  $e" -ForegroundColor Red }
    }

} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
}
