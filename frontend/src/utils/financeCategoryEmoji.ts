import { iconKeyToEmoji } from './emojiIconKey'

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const NAME_TO_EMOJI: Record<string, string> = {
  // Expenses
  'alimentacao': '🛒',
  'supermercado': '🛒',
  'mercearias': '🛒',
  'mercarias': '🛒',
  'restaurantes e cafes': '🍽️',
  'restaurantes': '🍽️',
  'cafe': '☕',
  'cafes': '☕',
  'habitacao': '🏠',
  'casa': '🏠',
  'transporte': '🚇',
  'carro': '🚗',
  'tv net': '📶',
  'assinaturas': '📆',
  'eletricidade': '⚡',
  'agua': '💧',
  'impostos': '🧾',
  'seguro': '🛡️',
  'seguros': '🛡️',
  'emprestimo': '💸',
  'medicacao': '💊',
  'medico': '🩺',
  'dentista': '🦷',
  'educacao': '📚',
  'animais de estimacao': '🐶',
  'ferias': '🏝️',
  'viagem': '✈️',
  'entretenimento': '🍿',
  'presentes': '🎁',
  'presentes e doacoes': '🎁',
  'cuidados pessoais e beleza': '💄',
  'roupa': '👕',
  'retirada de dinheiro': '🏧',
  'empregada': '🧹',
  'tech': '🖥️',
  'diversos': '🧩',

  // Income
  'salario': '💼',
  'renda': '💰',
  'investimentos': '📈',
  'reembolso': '↩️',
  'vendas': '🏷️',
}

export function financeCategoryEmoji(opts: {
  iconKey?: string | null
  name?: string | null
  type?: string | null
}): string {
  const byIcon = iconKeyToEmoji(opts.iconKey ?? null)
  if (byIcon) return byIcon

  const name = (opts.name ?? '').trim()
  if (name) {
    const key = normalizeKey(name)
    const direct = NAME_TO_EMOJI[key]
    if (direct) return direct

    if (key.includes('restaurante') || key.includes('caf')) return '🍽️'
    if (key.includes('transporte')) return '🚇'
    if (key.includes('habitacao') || key.includes('aluguel') || key.includes('casa')) return '🏠'
    if (key.includes('electricidade') || key.includes('energia')) return '⚡'
    if (key.includes('agua')) return '💧'
    if (key.includes('medicacao') || key.includes('farmac') || key.includes('remedio')) return '💊'
    if (key.includes('medico') || key.includes('saude') || key.includes('dent')) return '🩺'
    if (key.includes('impost')) return '🧾'
    if (key.includes('segur')) return '🛡️'
    if (key.includes('emprest')) return '💸'
    if (key.includes('invest')) return '📈'
    if (key.includes('salari')) return '💼'
  }

  return opts.type === 'Income' ? '💰' : '🏷️'
}
