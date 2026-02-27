# DomusUnify Frontend (React + TypeScript + Vite)

Este frontend foi montado para consumir o backend `.NET 8` do DomusUnify:

- **REST** via `fetch` + **TanStack React Query** (cache, loading/error states, mutations, invalidações).
- **Tempo real (realtime)** via **SignalR** (`/hubs/family`) para manter o UI sincronizado sem “refresh manual”.
- **Tipos TypeScript gerados** a partir do `OpenAPI` (`docs/api/openapi.json`) para evitares duplicar DTOs/contratos.
- **UI** via **Tailwind CSS** (classes utilitárias).

## Requisitos

- Node.js + npm
- Backend DomusUnify a correr localmente

## Como arrancar (dev)

1) Gera/atualiza a especificação OpenAPI (no root do repo):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/gerar-documentacao.ps1
```

2) Instala dependências do frontend:

```powershell
cd frontend
npm install
```

3) Gera os tipos TypeScript a partir do OpenAPI:

```powershell
npm run gen:api
```

4) Arranca o Vite:

```powershell
npm run dev
```

### Nota sobre CORS (importante)

Em desenvolvimento, usamos **proxy do Vite** (`frontend/vite.config.ts`) para encaminhar:

- `/api/*` → backend
- `/hubs/*` → backend (com `ws: true` para WebSockets)

Assim não precisas de mexer já em CORS no backend.

Se precisares, copia `frontend/.env.example` para `frontend/.env.local` e ajusta:

- `VITE_BACKEND_URL=https://localhost:7214`

## Estrutura (resumo)

- `src/api/*`: chamadas REST (tipadas) e “cola” com o OpenAPI
- `src/realtime/*`: ligação SignalR e invalidações do React Query
- `src/features/*`: ecrãs/fluxos (auth, família, listas)
