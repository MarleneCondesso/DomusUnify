import type { CategoryResponse } from '../api/domusApi'
import type { Language } from '../i18n/messages'

type LocalizedText = { en: string; pt: string; zh: string }
type FinanceCategoryType = 'Expense' | 'Income'
type ItemCategoryType = 'Shopping' | 'Tasks'

function normalizeIconKey(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim().toLowerCase()
  return trimmed ? trimmed : null
}

function normalizeForMatch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isDefaultName(name: string, localized: LocalizedText): boolean {
  const normalized = normalizeForMatch(name)
  if (!normalized) return false
  return (
    normalized === normalizeForMatch(localized.pt) ||
    normalized === normalizeForMatch(localized.en) ||
    normalized === normalizeForMatch(localized.zh)
  )
}

const FINANCE_DEFAULTS: Record<`${FinanceCategoryType}:${string}`, LocalizedText> = {
  'Expense:dots-horizontal': { en: 'Other', pt: 'Diversos', zh: '其他' },
  'Expense:shopping-cart': { en: 'Groceries', pt: 'Mercearias', zh: '杂货' },
  'Expense:car': { en: 'Car', pt: 'Carro', zh: '汽车' },
  'Expense:wifi': { en: 'TV + Internet', pt: 'TV+NET', zh: '电视和网络' },
  'Expense:repeat': { en: 'Subscriptions', pt: 'Assinaturas', zh: '订阅' },
  'Expense:utensils': { en: 'Restaurants & Cafés', pt: 'Restaurantes e cafés', zh: '餐厅和咖啡馆' },
  'Expense:ticket': { en: 'Entertainment', pt: 'Entretenimento', zh: '娱乐' },
  'Expense:home': { en: 'Housing', pt: 'Habitação', zh: '住房' },
  'Expense:receipt': { en: 'Loan', pt: 'Empréstimo', zh: '贷款' },
  'Expense:shield': { en: 'Insurance', pt: 'Seguros', zh: '保险' },
  'Expense:gift': { en: 'Gifts', pt: 'Presentes', zh: '礼物' },
  'Expense:sparkles': { en: 'Personal Care & Beauty', pt: 'Cuidados Pessoais e Beleza', zh: '个人护理和美容' },
  'Expense:shirt': { en: 'Clothing', pt: 'Roupa', zh: '服装' },
  'Expense:zap': { en: 'Electricity', pt: 'Eletricidade', zh: '电费' },
  'Expense:paw-print': { en: 'Pets', pt: 'Animais de estimação', zh: '宠物' },
  'Expense:piggy-bank': { en: 'Savings', pt: 'Poupança', zh: '储蓄' },
  'Expense:bus': { en: 'Transport', pt: 'Transporte', zh: '交通' },
  'Expense:graduation-cap': { en: 'Education', pt: 'Educação', zh: '教育' },
  'Expense:stethoscope': { en: 'Medical', pt: 'Médico', zh: '医疗' },
  'Expense:file-text': { en: 'Taxes', pt: 'Impostos', zh: '税费' },
  'Expense:plane': { en: 'Travel', pt: 'Viagem', zh: '旅行' },
  'Expense:sun': { en: 'Vacation', pt: 'Férias', zh: '度假' },
  'Expense:banknote': { en: 'Cash withdrawal', pt: 'Retirada de dinheiro', zh: '提现' },
  'Expense:user': { en: 'Housekeeper', pt: 'Empregada', zh: '家政' },
  'Expense:droplets': { en: 'Water', pt: 'Água', zh: '水费' },
  'Expense:laptop': { en: 'Tech', pt: 'Tech', zh: '科技' },

  'Income:briefcase': { en: 'Salary', pt: 'Salário', zh: '工资' },
  'Income:dots-horizontal': { en: 'Other', pt: 'Diversos', zh: '其他' },
  'Income:home': { en: 'Rent', pt: 'Renda', zh: '租金' },
  'Income:piggy-bank': { en: 'Savings', pt: 'Poupança', zh: '储蓄' },
  'Income:trending-up': { en: 'Investments', pt: 'Investimentos', zh: '投资' },
  'Income:gift': { en: 'Gifts & donations', pt: 'Presentes e doações', zh: '礼物和捐赠' },
  'Income:rotate-ccw': { en: 'Reimbursement', pt: 'Reembolso', zh: '报销' },
}

const ITEM_DEFAULTS: Record<`${ItemCategoryType}:${string}`, LocalizedText> = {
  'Shopping:emoji_1f363': { en: 'Sushi', pt: 'Sushi', zh: '寿司' },
  'Shopping:emoji_1f34e': { en: 'Fruits & Vegetables', pt: 'Frutas & Legumes', zh: '水果和蔬菜' },
  'Shopping:emoji_1f357': { en: 'Meat & Fish', pt: 'Carne & Peixe', zh: '肉类和鱼类' },
  'Shopping:emoji_1f35e': { en: 'Bread & Bakery', pt: 'Pão & Confeitaria', zh: '面包和烘焙' },
  'Shopping:emoji_1f95b': { en: 'Dairy', pt: 'Laticínios', zh: '乳制品' },
  'Shopping:emoji_2744_fe0f': { en: 'Frozen & Convenience', pt: 'Congelados & Conveniente', zh: '冷冻和便利食品' },
  'Shopping:emoji_1f33e': { en: 'Cereals & Grains', pt: 'Cereais & Grãos', zh: '谷物和粮食' },
  'Shopping:emoji_1f9c3': { en: 'Drinks', pt: 'Bebidas', zh: '饮料' },
  'Shopping:emoji_1f9c2': { en: 'Ingredients & Condiments', pt: 'Ingredientes & Condimentos', zh: '食材和调味品' },
  'Shopping:emoji_1f36b': { en: 'Snacks & Sweets', pt: 'Lanches & Doces', zh: '零食和甜品' },
  'Shopping:emoji_1f9f4': { en: 'Crafts & Garden', pt: 'Artesanato & Jardim', zh: '手工和园艺' },
  'Shopping:emoji_1f9fc': { en: 'Cleaning & Hygiene', pt: 'Limpeza & Higiene', zh: '清洁和卫生' },
  'Shopping:emoji_1f436': { en: 'Pets', pt: 'Animais', zh: '宠物' },
  'Shopping:emoji_1f37d_fe0f': { en: 'Kitchen', pt: 'Cozinha', zh: '厨房' },

  'Tasks:emoji_1f468_200d_1f373': { en: 'Kitchen', pt: 'Cozinha', zh: '厨房' },
  'Tasks:emoji_1f6cf_fe0f': { en: 'Bedroom', pt: 'Quarto', zh: '卧室' },
  'Tasks:emoji_1f6cb_fe0f': { en: 'Living room', pt: 'Sala', zh: '客厅' },
  'Tasks:emoji_1f469_200d_1f4bb': { en: 'Office', pt: 'Escritório', zh: '办公室' },
  'Tasks:emoji_1f9fa': { en: 'Laundry', pt: 'Roupa', zh: '洗衣' },
  'Tasks:emoji_1f6ae': { en: 'Trash', pt: 'Lixo', zh: '垃圾' },
  'Tasks:emoji_1f6c1': { en: 'Bathroom', pt: 'Casa de banho', zh: '卫生间' },
  'Tasks:emoji_1f6aa': { en: 'Hallway', pt: 'Corredor', zh: '走廊' },
}

export function getFinanceCategoryDisplayName(opts: {
  type: FinanceCategoryType
  iconKey?: string | null
  name?: string | null
  language: Language
}): string {
  const raw = (opts.name ?? '').trim()
  const iconKey = normalizeIconKey(opts.iconKey)
  if (!iconKey) return raw

  const entry = FINANCE_DEFAULTS[`${opts.type}:${iconKey}`]
  if (!entry) return raw
  if (raw && !isDefaultName(raw, entry)) return raw

  return entry[opts.language] ?? entry.en
}

export function getItemCategoryDisplayName(category: Pick<CategoryResponse, 'name' | 'type' | 'iconKey'>, language: Language): string {
  const raw = (category.name ?? '').trim()
  const type = category.type === 'Shopping' || category.type === 'Tasks' ? (category.type as ItemCategoryType) : null
  const iconKey = normalizeIconKey(category.iconKey)
  if (!type || !iconKey) return raw

  const entry = ITEM_DEFAULTS[`${type}:${iconKey}`]
  if (!entry) return raw
  if (raw && !isDefaultName(raw, entry)) return raw

  return entry[language] ?? entry.en
}

