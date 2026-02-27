import { useEffect, useMemo, useState } from 'react'
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type ILogger,
  type HubConnection,
} from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../api/queryKeys'

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

type UseFamilyHubOptions = {
  token: string
  familyId: string
  enabled?: boolean
}

function buildHubUrl(): string {
  // Se `VITE_SIGNALR_ORIGIN` não estiver definido, usamos URL relativa.
  // Em DEV isto funciona bem com o proxy do Vite (ver `vite.config.ts`).
  const origin = import.meta.env.VITE_SIGNALR_ORIGIN as string | undefined
  return origin ? `${origin}/hubs/family` : '/hubs/family'
}

function createSignalRLogger(options: { minLevel: LogLevel; isDisposed: () => boolean }): ILogger {
  const { minLevel, isDisposed } = options

  return {
    log(logLevel, message) {
      if (logLevel < minLevel) return

      // Em DEV (React StrictMode / navegação rápida), é comum o `stop()` ocorrer enquanto o `start()`
      // ainda está a negociar. Isso gera o erro "stopped during negotiation", que não é útil quando já
      // estamos a fazer dispose do hook.
      if (isDisposed() && message.includes('stopped during negotiation')) return

      const formatted = `[${new Date().toISOString()}] ${LogLevel[logLevel]}: ${message}`
      switch (logLevel) {
        case LogLevel.Critical:
        case LogLevel.Error:
          console.error(formatted)
          break
        case LogLevel.Warning:
          console.warn(formatted)
          break
        case LogLevel.Information:
          console.info(formatted)
          break
        default:
          // `console.debug` nem sempre aparece, por isso usamos `log` para Trace/Debug
          console.log(formatted)
          break
      }
    },
  }
}

/**
 * Liga ao SignalR hub da família e reage a eventos em tempo real.
 *
 * Como isto se relaciona com o React Query?
 * - Quando o backend emite um evento (ex.: `lists:changed`), nós invalidamos a query correspondente.
 * - Isto faz com que o React Query refaça o GET e o UI atualize automaticamente.
 *
 * Hub no backend:
 * - `app.MapHub<FamilyHub>(\"/hubs/family\")` (ver `src/DomusUnify.Api/Program.cs`)
 * - Métodos: `JoinFamily(familyId)` / `LeaveFamily(familyId)` (ver `src/DomusUnify.Api/Hubs/FamilyHub.cs`)
 */
export function useFamilyHub({ token, familyId, enabled = true }: UseFamilyHubOptions) {
  const queryClient = useQueryClient()
  const hubUrl = useMemo(() => buildHubUrl(), [])

  const [status, setStatus] = useState<RealtimeStatus>('disconnected')

  useEffect(() => {
    if (!enabled) return
    if (!token || !familyId) return

    let disposed = false
    let connection: HubConnection | null = null

    async function start() {
      if (!disposed) setStatus('connecting')

      // `accessTokenFactory`:
      // - No browser, o SignalR usa isto para colocar o token no `Authorization` (negotiate)
      //   e/ou em `?access_token=...` (WebSockets/SSE).
      // - O backend já está preparado para ler `access_token` no hub (`OnMessageReceived`).
      const minLogLevel = import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning
      const logger = createSignalRLogger({ minLevel: minLogLevel, isDisposed: () => disposed })

      connection = new HubConnectionBuilder()
        .withUrl(hubUrl, { accessTokenFactory: () => token })
        .withAutomaticReconnect()
        .configureLogging(logger)
        .build()

      // Estados de ligação
      connection.onreconnecting(() => {
        if (!disposed) setStatus('reconnecting')
      })
      connection.onreconnected(() => {
        if (!disposed) setStatus('connected')
      })
      connection.onclose(() => {
        if (!disposed) setStatus('disconnected')
      })

      // Eventos emitidos pelo backend (ver `_rt.NotifyFamilyAsync(..., eventName, payload)`):
      connection.on('lists:changed', () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.lists })
      })

      connection.on('listitems:added', (payload: { listId?: string }) => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.lists })
        if (payload?.listId) void queryClient.invalidateQueries({ queryKey: queryKeys.listItems(payload.listId) })
      })

      connection.on('listitems:updated', (payload: { listId?: string }) => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.lists })
        if (payload?.listId) void queryClient.invalidateQueries({ queryKey: queryKeys.listItems(payload.listId) })
      })

      connection.on('listitems:deleted', () => {
        // Não sabemos qual é a lista (payload tem só itemId), então invalidamos de forma conservadora.
        void queryClient.invalidateQueries({ queryKey: queryKeys.lists })
        void queryClient.invalidateQueries({ queryKey: ['listItems'] })
      })

      try {
        await connection.start()
        if (disposed) return

        setStatus('connected')

        // Associa esta ligação ao grupo da família (o backend emite para `family:{familyId}`).
        await connection.invoke('JoinFamily', familyId)
      } catch (err) {
        if (disposed) return
        console.error('Falha ao ligar ao SignalR:', err)
        setStatus('error')
      }
    }

    void start()

    return () => {
      disposed = true

      // Cleanup: sair do grupo (se estiver ligado) e parar a ligação.
      void (async () => {
        try {
          if (connection?.state === HubConnectionState.Connected) {
            await connection.invoke('LeaveFamily', familyId)
          }
        } catch {
          // best-effort
        }

        try {
          await connection?.stop()
        } catch {
          // best-effort
        }
      })()
    }
  }, [enabled, familyId, hubUrl, queryClient, token])

  return { status }
}
