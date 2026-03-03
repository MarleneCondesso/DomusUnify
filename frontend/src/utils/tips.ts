export type Tip = {
  id: string
  title: string
  body: string
  icon: string
}

export const TIPS: Tip[] = [
  {
    id: 'quick-add',
    title: 'Dica rápida',
    body: 'Use “Quick Add” para adicionar um item a qualquer lista em segundos.',
    icon: 'ri-add-line',
  },
  {
    id: 'activity',
    title: 'Fique por dentro',
    body: 'Veja tudo o que mudou em “Activity” para não perder atualizações da família.',
    icon: 'ri-time-line',
  },
  {
    id: 'notifications',
    title: 'Notificações',
    body: 'Marque todas como vistas para manter sua caixa limpa.',
    icon: 'ri-notification-3-line',
  },
  {
    id: 'lists',
    title: 'Listas compartilhadas',
    body: 'Crie listas por categoria (compras, tarefas, etc.) para organizar melhor.',
    icon: 'ri-file-list-3-line',
  },
  {
    id: 'budget',
    title: 'Orçamento do mês',
    body: 'Crie um orçamento recorrente para acompanhar gastos e saldo mensal.',
    icon: 'ri-piggy-bank-line',
  },
]

export function pickTipOfDay(date: Date, tips: Tip[] = TIPS): Tip | null {
  if (tips.length === 0) return null
  const key = date.toISOString().slice(0, 10)
  const idx = Math.abs(hashString(key)) % tips.length
  return tips[idx] ?? null
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return hash
}

