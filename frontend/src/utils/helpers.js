import { format, parseISO } from 'date-fns'
import { bg } from 'date-fns/locale'

export const STATUS_LABELS = {
  pending:    'Чакащ',
  confirmed:  'Потвърден',
  in_transit: 'В транзит',
  customs:    'Митница',
  delivered:  'Доставен',
  cancelled:  'Анулиран',
  returned:   'Върнат',
}

export const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  in_transit: 'bg-purple-100 text-purple-800',
  customs:    'bg-orange-100 text-orange-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
  returned:   'bg-gray-100 text-gray-700',
}

export const TRANSPORT_LABELS = {
  air:     'Въздушен',
  sea:     'Морски',
  road:    'Наземен',
  express: 'Експрес',
}

export const TRANSPORT_ICONS = {
  air: '✈️', sea: '🚢', road: '🚛', express: '⚡',
}

export const DIRECTION_LABELS = { import: 'Внос', export: 'Износ' }
export const DIRECTION_COLORS = { import: 'bg-cyan-100 text-cyan-800', export: 'bg-violet-100 text-violet-800' }

export const FINANCIAL_STATUS = {
  pending: { label: 'Чакащо', color: 'bg-yellow-100 text-yellow-800' },
  paid:    { label: 'Платено', color: 'bg-green-100 text-green-800' },
  overdue: { label: 'Просрочено', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Анулирано', color: 'bg-gray-100 text-gray-700' },
}

export const COUNTRY_NAMES = {
  BG: 'България', GR: 'Гърция', DE: 'Германия', AT: 'Австрия',
  CN: 'Китай', US: 'САЩ', JP: 'Япония', FR: 'Франция',
  IT: 'Италия', NL: 'Нидерландия', GB: 'Великобритания',
  CH: 'Швейцария', CZ: 'Чехия', PL: 'Полша', HU: 'Унгария',
}

export const fmtDate = (d) => {
  if (!d) return '—'
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'dd.MM.yyyy', { locale: bg }) }
  catch { return d }
}

export const fmtDateTime = (d) => {
  if (!d) return '—'
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'dd.MM.yyyy HH:mm', { locale: bg }) }
  catch { return d }
}

export const fmtMoney = (v, currency = 'EUR') => {
  if (v == null) return '—'
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency, minimumFractionDigits: 2 }).format(v)
}

export const fmtWeight = (kg) => kg != null ? `${kg} кг` : '—'

export const MONTHS_BG = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек']
