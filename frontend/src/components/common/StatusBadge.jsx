import { STATUS_LABELS, STATUS_COLORS, DIRECTION_LABELS, DIRECTION_COLORS } from '../../utils/helpers'

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function DirectionBadge({ direction }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DIRECTION_COLORS[direction] || 'bg-gray-100 text-gray-700'}`}>
      {DIRECTION_LABELS[direction] || direction}
    </span>
  )
}
