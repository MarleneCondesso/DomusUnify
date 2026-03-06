# DomusUnify Frontend (React + TypeScript + Vite)

Este frontend foi criado para consumir o backend `.NET 8` do DomusUnify:

- **REST** via `fetch` + **TanStack React Query** (cache, loading/error states, mutations, invalidações).
- **Tempo real (realtime)** via **SignalR** (`/hubs/family`) para manter o UI sincronizado sem “refresh manual”.
- **Tipos TypeScript gerados** a partir do `OpenAPI` (`docs/api/openapi.json`) para evitares duplicar DTOs/contratos.
- **UI** via **Tailwind CSS** (classes utilitárias).

## Requisitos

- Node.js + npm
- Backend DomusUnify a correr localmente

## Como arrancar (dev)

1) Gerar/atualizar a especificação OpenAPI (no root do repo):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/gerar-documentacao.ps1
```

2) Instalar dependências do frontend:

```powershell
cd frontend
npm install
```

3) Gerar os tipos TypeScript a partir do OpenAPI:

```powershell
npm run gen:api
```

4) Arrancar o Vite:

```powershell
npm run dev
```

