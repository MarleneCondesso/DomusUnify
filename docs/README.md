# Documentação

Este diretório contém artefactos de documentação gerados a partir dos comentários XML (Swagger/OpenAPI e ficheiros `.xml`).

## Gerar/atualizar

- PowerShell (Windows):
  - `powershell -ExecutionPolicy Bypass -File scripts/gerar-documentacao.ps1`
- PowerShell (cross-platform):
  - `pwsh -File scripts/gerar-documentacao.ps1`

## Saídas

- OpenAPI:
  - `docs/api/openapi.json`
- Documentação (HTML):
  - `docs/api/openapi.html`
  - `docs/api/index.html`
- XML docs (por assembly):
  - `docs/xml/DomusUnify.Api.xml`
  - `docs/xml/DomusUnify.Application.xml`
  - `docs/xml/DomusUnify.Domain.xml`
  - `docs/xml/DomusUnify.Infrastructure.xml`
