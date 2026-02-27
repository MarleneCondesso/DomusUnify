import type { QueryClient } from "@tanstack/react-query";
import type { ApiError } from "../api/http";


type ErrorDisplayProps = {
    apiError: ApiError | null;
    queryKey: readonly unknown[]; // A key para invalidar a query relacionada (ex.: familyMembers, lists, etc.)
    queryClient: QueryClient;
    title: string;
}

/**
 * Componente para exibir erros de forma consistente.
 * - Se for um ApiError, mostra o corpo da resposta (que pode conter mensagens úteis do backend).
 * - Caso contrário, mostra a string do erro.
 * 
 * Uso recomendado:
 * - Para erros de chamadas API, use ApiError (lançado por apiRequest).
 * - Para outros erros JS, pode usar ErrorDisplay diretamente com o objeto de erro.
 * - Exemplo:
 *   try {
 *     await apiRequest(...)
 *  } catch (error) {
 *    return <ErrorDisplay error={error} />
 *  }
 * - Para erros de React Query, pode usar a propriedade `error` da query:
 *  const { error } = useQuery(...)
 *  if (error) {
 *   return <ErrorDisplay error={error} />
 * }
 * - O objetivo é evitar ter que lidar manualmente com a formatação de erros em cada componente, centralizando isso aqui.
 * - O componente é simples, mas pode ser estendido no futuro para lidar com casos específicos (ex.: erros de validação).
 * - O design é básico, mas consistente com o resto da app.
 *  - Nota: este componente é para erros "esperados" (ex.: falha de API). Para erros inesperados (ex.: bugs JS), o ideal é ter um mecanismo de logging e monitoramento (ex.: Sentry) para capturar esses erros e agir sobre eles.
 **/
export function ErrorDisplay({ apiError, queryKey, queryClient, title }: ErrorDisplayProps) {

    return (
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
            <h2 className="text-xl font-semibold">{title}</h2>
            <pre className="mt-3 whitespace-pre-wrap wrap-break-words rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
                {apiError ? JSON.stringify(apiError.body, null, 2) : String(apiError)}
            </pre>
            <button
                className="mt-4 w-full rounded-xl bg-forest px-4 py-2 font-semibold text-white hover:bg-forest/90"
                onClick={() => queryClient.invalidateQueries({ queryKey: queryKey })}
                type="button"
            >
                Tentar novamente
            </button>
        </div>
    )
}

