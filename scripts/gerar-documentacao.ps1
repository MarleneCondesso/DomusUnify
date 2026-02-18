$ErrorActionPreference = "Stop"

try { chcp 65001 | Out-Null } catch { }
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()

$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    Write-Host "Restaurar ferramentas dotnet (local tool manifest)..." -ForegroundColor Cyan
    dotnet tool restore

    Write-Host "Compilar solução (Release)..." -ForegroundColor Cyan
    dotnet build DomusUnify.sln -c Release

    $configuration = "Release"
    $targetFramework = "net8.0"

    $docsRoot = Join-Path $root "docs"
    $docsApi = Join-Path $docsRoot "api"
    $docsXml = Join-Path $docsRoot "xml"

    New-Item -ItemType Directory -Force -Path $docsApi | Out-Null
    New-Item -ItemType Directory -Force -Path $docsXml | Out-Null

    $projects = @(
        @{ Name = "DomusUnify.Api"; Path = "src/DomusUnify.Api" },
        @{ Name = "DomusUnify.Application"; Path = "src/DomusUnify.Application" },
        @{ Name = "DomusUnify.Domain"; Path = "src/DomusUnify.Domain" },
        @{ Name = "DomusUnify.Infrastructure"; Path = "src/DomusUnify.Infrastructure" }
    )

    Write-Host "Copiar ficheiros XML de documentação..." -ForegroundColor Cyan
    foreach ($p in $projects) {
        $xmlPath = Join-Path $root ("{0}\\bin\\{1}\\{2}\\{3}.xml" -f $p.Path, $configuration, $targetFramework, $p.Name)
        if (Test-Path $xmlPath) {
            Copy-Item -Force $xmlPath (Join-Path $docsXml ("{0}.xml" -f $p.Name))
        }
        else {
            Write-Warning ("Não foi encontrado: {0}" -f $xmlPath)
        }
    }

    $apiDll = Join-Path $root ("src\\DomusUnify.Api\\bin\\{0}\\{1}\\DomusUnify.Api.dll" -f $configuration, $targetFramework)
    if (-not (Test-Path $apiDll)) {
        throw ("Assembly da API não encontrada: {0}" -f $apiDll)
    }

    Write-Host "Gerar OpenAPI (Swagger)..." -ForegroundColor Cyan
    $env:ASPNETCORE_ENVIRONMENT = "Production"
    $openApiJsonPath = Join-Path $docsApi "openapi.json"
    dotnet swagger tofile --output $openApiJsonPath $apiDll v1

    Write-Host "Gerar documentação HTML (ReDoc)..." -ForegroundColor Cyan
    $openApiHtmlPath = Join-Path $docsApi "openapi.html"
    $specJson = Get-Content -Raw -Encoding UTF8 $openApiJsonPath
    $specJsonSafe = $specJson.Replace("</script", "<\\/script")

    @"
<!doctype html>
<html lang="pt-PT">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DomusUnify API — Documentação</title>
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="redoc"></div>
    <script id="openapi-spec" type="application/json">
$specJsonSafe
    </script>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    <script>
      const spec = JSON.parse(document.getElementById('openapi-spec').textContent);
      Redoc.init(spec, {}, document.getElementById('redoc'));
    </script>
  </body>
</html>
"@ | Set-Content -Encoding UTF8 $openApiHtmlPath

    Write-Host "" 
    Write-Host "Documentação gerada com sucesso:" -ForegroundColor Green
    Write-Host ("- {0}" -f $openApiJsonPath)
    Write-Host ("- {0}" -f $openApiHtmlPath)
    Write-Host ("- {0}\\*.xml" -f $docsXml)
}
finally {
    Pop-Location
}
