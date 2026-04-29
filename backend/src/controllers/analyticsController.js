const { db } = require('../database/db')

// Приблизителни фиксирани курсове към EUR
const TO_EUR = { EUR: 1, USD: 0.92, BGN: 0.5113, GBP: 1.17, CNY: 0.127, GBP: 1.17 }

function toEUR(amount, currency) {
  const val = parseFloat(amount)
  if (!amount || isNaN(val)) return 0
  return val * (TO_EUR[currency] || 1)
}

function daysBetween(d1, d2) {
  if (!d1 || !d2) return null
  const a = new Date(d1), b = new Date(d2)
  if (isNaN(a) || isNaN(b)) return null
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

exports.get = (req, res) => {
  const shipments = db.get('shipments').value()

  // ─── Доставки и транзитни времена ────────────────────────────────────────────
  const delivered = shipments.filter(s => s.status === 'delivered' && s.departure_date)

  const transitByType = {}
  const onTimeCount = { yes: 0, no: 0 }
  let totalDays = 0, totalDaysCount = 0

  delivered.forEach(s => {
    const end = s.actual_delivery || s.estimated_delivery
    const days = daysBetween(s.departure_date, end)
    if (days !== null && days >= 0) {
      totalDays += days
      totalDaysCount++
      if (!transitByType[s.transport_type]) transitByType[s.transport_type] = { sum: 0, count: 0 }
      transitByType[s.transport_type].sum   += days
      transitByType[s.transport_type].count += 1
    }
    if (s.actual_delivery && s.estimated_delivery) {
      if (new Date(s.actual_delivery) <= new Date(s.estimated_delivery)) onTimeCount.yes++
      else onTimeCount.no++
    }
  })

  const avgDaysByTransport = {}
  Object.entries(transitByType).forEach(([t, v]) => {
    avgDaysByTransport[t] = +(v.sum / v.count).toFixed(1)
  })

  const onTimeTotal = onTimeCount.yes + onTimeCount.no
  const onTimeRate  = onTimeTotal > 0 ? +((onTimeCount.yes / onTimeTotal) * 100).toFixed(1) : null

  // ─── Пратки по вид транспорт ──────────────────────────────────────────────────
  const byTransport = {}
  shipments.forEach(s => {
    const t = s.transport_type || 'unknown'
    byTransport[t] = (byTransport[t] || 0) + 1
  })

  // ─── Пратки по месец ─────────────────────────────────────────────────────────
  const byMonth = {}
  shipments.forEach(s => {
    if (!s.created_at) return
    const m = s.created_at.slice(0, 7)
    byMonth[m] = (byMonth[m] || 0) + 1
  })
  const byMonthArr = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))

  // ─── По произход / дестинация ─────────────────────────────────────────────────
  const byOrigin = {}, byDest = {}
  shipments.forEach(s => {
    if (s.origin_country) byOrigin[s.origin_country] = (byOrigin[s.origin_country] || 0) + 1
    if (s.dest_country)   byDest[s.dest_country]     = (byDest[s.dest_country] || 0) + 1
  })
  const topOrigins = Object.entries(byOrigin).sort(([,a],[,b]) => b-a).slice(0,8).map(([country,count]) => ({ country, count }))
  const topDests   = Object.entries(byDest).sort(([,a],[,b]) => b-a).slice(0,8).map(([country,count]) => ({ country, count }))

  // ─── По доставчик ─────────────────────────────────────────────────────────────
  const bySupplier = {}
  shipments.forEach(s => {
    if (!s.supplier) return
    if (!bySupplier[s.supplier]) bySupplier[s.supplier] = { count: 0, freight_eur: 0, invoice_eur: 0 }
    bySupplier[s.supplier].count++
    bySupplier[s.supplier].freight_eur += toEUR(s.freight_cost, s.freight_cost_currency)
    bySupplier[s.supplier].invoice_eur += toEUR(s.declared_value, s.declared_value_currency)
  })
  const topSuppliers = Object.entries(bySupplier)
    .sort(([,a],[,b]) => b.count - a.count)
    .slice(0, 10)
    .map(([supplier, v]) => ({ supplier, ...v, freight_eur: +v.freight_eur.toFixed(2), invoice_eur: +v.invoice_eur.toFixed(2) }))

  // ─── По спедитор ─────────────────────────────────────────────────────────────
  const byForwarder = {}
  shipments.forEach(s => {
    if (!s.freight_forwarder) return
    if (!byForwarder[s.freight_forwarder]) byForwarder[s.freight_forwarder] = { count: 0, freight_eur: 0 }
    byForwarder[s.freight_forwarder].count++
    byForwarder[s.freight_forwarder].freight_eur += toEUR(s.freight_cost, s.freight_cost_currency)
  })
  const topForwarders = Object.entries(byForwarder)
    .sort(([,a],[,b]) => b.freight_eur - a.freight_eur)
    .slice(0, 8)
    .map(([forwarder, v]) => ({ forwarder, count: v.count, freight_eur: +v.freight_eur.toFixed(2) }))

  // ─── Финансова статистика ─────────────────────────────────────────────────────
  let totalInvoiceEUR = 0, totalFreightEUR = 0, totalInsuranceEUR = 0
  let totalCustomsEUR = 0, totalExpectedVatEUR = 0, totalActualVatEUR = 0, totalActualCustomsEUR = 0
  let freightPctSum = 0, freightPctCount = 0
  let freightKgSum = 0, freightKgCount = 0
  const freightByTransport = {}

  shipments.forEach(s => {
    const inv = toEUR(s.declared_value, s.declared_value_currency)
    const fr  = toEUR(s.freight_cost, s.freight_cost_currency)
    const ins = toEUR(s.insurance_cost, s.insurance_cost_currency)

    totalInvoiceEUR   += inv
    totalFreightEUR   += fr
    totalInsuranceEUR += ins
    totalExpectedVatEUR  += toEUR(s.expected_vat, s.expected_vat_currency)
    totalActualVatEUR    += toEUR(s.actual_vat, s.actual_vat_currency)
    totalActualCustomsEUR += toEUR(s.actual_customs_duty, s.actual_customs_duty_currency)

    // Мито от артикули
    if (Array.isArray(s.items)) {
      s.items.forEach(it => {
        totalCustomsEUR += toEUR(it.customs_duty, it.customs_duty_currency)
      })
    }

    if (inv > 0 && fr > 0) {
      freightPctSum += (fr / inv) * 100
      freightPctCount++
    }
    if (fr > 0 && parseFloat(s.weight_kg) > 0) {
      freightKgSum  += fr / parseFloat(s.weight_kg)
      freightKgCount++
    }

    const t = s.transport_type || 'unknown'
    if (!freightByTransport[t]) freightByTransport[t] = 0
    freightByTransport[t] += fr
  })

  const freightByTransportArr = Object.entries(freightByTransport)
    .map(([type, eur]) => ({ type, eur: +eur.toFixed(2) }))
    .sort((a, b) => b.eur - a.eur)

  // ─── Incoterms разпределение ──────────────────────────────────────────────────
  const byIncoterms = {}
  shipments.forEach(s => {
    if (!s.incoterms) return
    byIncoterms[s.incoterms] = (byIncoterms[s.incoterms] || 0) + 1
  })
  const incotermsArr = Object.entries(byIncoterms).sort(([,a],[,b]) => b-a).map(([term, count]) => ({ term, count }))

  res.json({
    delivery: {
      avg_days_total: totalDaysCount > 0 ? +(totalDays / totalDaysCount).toFixed(1) : null,
      avg_days_by_transport: avgDaysByTransport,
      on_time_rate: onTimeRate,
      on_time_count: onTimeCount.yes,
      late_count: onTimeCount.no,
      delivered_count: delivered.length
    },
    shipments: {
      total: shipments.length,
      by_transport: byTransport,
      by_month: byMonthArr,
      top_origins: topOrigins,
      top_dests: topDests,
      top_suppliers: topSuppliers,
      top_forwarders: topForwarders,
      by_incoterms: incotermsArr
    },
    financial: {
      total_invoice_eur:    +totalInvoiceEUR.toFixed(2),
      total_freight_eur:    +totalFreightEUR.toFixed(2),
      total_insurance_eur:  +totalInsuranceEUR.toFixed(2),
      total_customs_eur:    +totalCustomsEUR.toFixed(2),
      total_expected_vat_eur: +totalExpectedVatEUR.toFixed(2),
      total_actual_vat_eur:   +totalActualVatEUR.toFixed(2),
      total_actual_customs_eur: +totalActualCustomsEUR.toFixed(2),
      avg_freight_pct:      freightPctCount > 0 ? +(freightPctSum / freightPctCount).toFixed(2) : null,
      avg_freight_per_kg:   freightKgCount  > 0 ? +(freightKgSum  / freightKgCount).toFixed(3) : null,
      freight_by_transport: freightByTransportArr
    }
  })
}
