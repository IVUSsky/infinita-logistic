const { db, nextId, now } = require('../database/db')
const XLSX = require('xlsx')
const pdfParse = require('pdf-parse')

// ─── Parse helpers ────────────────────────────────────────────────────────────

function parseNum(v) {
  if (v == null || v === '') return null
  const n = parseFloat(String(v).replace(',', '.').trim())
  return isNaN(n) ? null : n
}

/**
 * Greeloy PDF format.
 * PDF columns are jammed together with no separators:
 * e.g. "GU-P 302S82552242.03" → model="GU-P 302S", qty=8, gw=255, nw=224, cbm=2.03
 * Fixed structure: MODEL + QTY(1d) + GW(3d) + NW(3d) + CBM(1d.2d)
 * Identified by decimal position from line end.
 */
function parseGreeloyLine(line) {
  const dotIdx = line.lastIndexOf('.')
  if (dotIdx < 0 || line.length - dotIdx !== 3) return null  // must end with .XX
  const cbm   = parseFloat(line[dotIdx-1] + '.' + line.slice(dotIdx+1))
  const nw    = parseInt(line.slice(dotIdx-4, dotIdx-1))
  const gw    = parseInt(line.slice(dotIdx-7, dotIdx-4))
  const qty   = parseInt(line[dotIdx-8])  // single-digit quantity
  const model = line.slice(0, dotIdx-8).trim()
  if (!model || !/^[A-Z]{2}/.test(model) || isNaN(qty) || isNaN(gw) || isNaN(nw) || isNaN(cbm)) return null
  return { description: model, quantity: qty, gw_kg: gw, nw_kg: nw, cbm }
}

function parseGreeloyPdf(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const items = []
  for (const line of lines) {
    if (/^total/i.test(line) || /^GREELOY/i.test(line)) continue
    const parsed = parseGreeloyLine(line)
    if (parsed) items.push({ ...parsed, unit: 'pcs', cartons: null, dimensions: null })
  }
  return items
}

/**
 * Alltion PDF format.
 * Uses the "Total *:" footer lines for totals (reliable).
 * Tries to extract item description from body.
 * Returns one or more items.
 */
function parseAltionPdf(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Extract from structured "Total XXX:" footer lines
  let totalGw = null, totalNw = null, totalCbm = null, totalQty = null, totalCtns = null

  for (const line of lines) {
    let m
    if ((m = line.match(/Total\s+G\.W\.\s*[:\s]+([\d.]+)/i)))   totalGw   = parseNum(m[1])
    if ((m = line.match(/Total\s+N\.W\.\s*[:\s]+([\d.]+)/i)))   totalNw   = parseNum(m[1])
    if ((m = line.match(/Total\s+MEAS\s*[:\s]+([\d.]+)/i)))     totalCbm  = parseNum(m[1])
    if ((m = line.match(/Total\s+Cartons?\s*[:\s]+(\d+)/i)))    totalCtns = parseInt(m[1])
    if ((m = line.match(/Total\s+Quantity\s*[:\s]+(\d+)/i)))    totalQty  = parseInt(m[1])
    // Also parse compact TOTAL line: "TOTAL4 2 100.0 70.0 0.6"
    if (!totalGw && (m = line.match(/^TOTAL\s*(\d+)\s+(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i))) {
      totalCtns = parseInt(m[1]); totalQty = parseInt(m[2])
      totalGw   = parseNum(m[3]); totalNw  = parseNum(m[4]); totalCbm = parseNum(m[5])
    }
  }

  // Extract item descriptions — model number pattern
  const items = []
  let pendingDesc = null
  const modelRe = /^(\d+)$/  // item line number alone
  const descRe  = /^([A-Z]{2,}[A-Z\d -]+(?:Colposcope|Monitor|Scanner|Probe|Transducer|Recorder|System|Unit|Bracket|Adapter|Cable|Cuff|Tube)?)/i

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Line is just an item number → next line(s) are description
    if (/^\d+$/.test(line) && parseInt(line) < 100) {
      pendingDesc = ''
    } else if (pendingDesc !== null && !line.startsWith('No.') && !line.startsWith('TOTAL') && !/^[\d.]+$/.test(line)) {
      if (pendingDesc === '') pendingDesc = line
      else if (line.match(/^[A-Z]/)) pendingDesc += ' ' + line
      else {
        // Reached non-description content
        items.push({
          description: pendingDesc.trim(),
          quantity: totalQty,
          unit: 'sets',
          cartons: totalCtns,
          gw_kg: totalGw,
          nw_kg: totalNw,
          cbm: totalCbm,
          dimensions: null
        })
        pendingDesc = null
      }
    }
  }

  if (pendingDesc && pendingDesc.trim()) {
    items.push({
      description: pendingDesc.trim(),
      quantity: totalQty,
      unit: 'sets',
      cartons: totalCtns,
      gw_kg: totalGw,
      nw_kg: totalNw,
      cbm: totalCbm,
      dimensions: null
    })
  }

  // Fallback: one aggregate item
  if (items.length === 0) {
    items.push({
      description: 'Продукт от пакинг лист',
      quantity: totalQty,
      unit: 'sets',
      cartons: totalCtns,
      gw_kg: totalGw,
      nw_kg: totalNw,
      cbm: totalCbm,
      dimensions: null
    })
  }

  return items
}

/**
 * Main PDF parser.
 */
async function parsePdf(buffer) {
  const data = await pdfParse(buffer)
  const text = data.text || ''

  // Detect Greeloy by product code pattern
  const isGreeloy = /GU-P|GA-P|GA-\d|GREELOY/i.test(text)
  if (isGreeloy) return { items: parseGreeloyPdf(text) }

  return { items: parseAltionPdf(text) }
}

/**
 * Excel parser — handles EDAN and Draft PL formats.
 * EDAN:     Nos.(0), Description(3), Quantities(6), N.W.(9), G.W.(11), Measurement(12)
 * Draft PL: Item(0), Description(1), Q'ty(4), Measurements LxWxD(6), Net Weight(7), Gross Weight(8)
 *           Total CBM appears in a "General:" summary row as "0.469CBM"
 */
function parseExcel(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  const flatText = rows.flat().map(c => String(c)).join(' ')
  const isDraftPL = /No\.\s*of\s*PCS/i.test(flatText) || /Measurements.*\(L\)\*\(W\)/i.test(flatText)

  let headerRow = -1
  const colMap = {}

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(c => String(c).toLowerCase().trim())
    if (row.some(c => c.includes('description') || c.includes("q'ty") || c === 'qty')) {
      headerRow = i
      row.forEach((c, idx) => {
        if (c.includes('description'))                     colMap.desc = idx
        if (c.includes("q'ty") || c === 'qty' || c.includes('quantities')) colMap.qty = idx
        if (c.includes('n.w') || c === 'net weight (kg)')  colMap.nw   = idx
        if (c.includes('g.w') || c === 'gross weight (kg)') colMap.gw  = idx
        if (c.includes('nos') || c === 'item')             colMap.nos  = idx
        // EDAN: Measurement(M³) is CBM; Draft PL: Measurements(L*W*D) is dimensions
        if (c.includes('measurement') && c.includes('m³'))         colMap.cbm  = idx
        if (c.includes('measurement') && (c.includes('(l)') || c.includes('l)*'))) colMap.dims = idx
      })
      break
    }
  }

  if (headerRow === -1) return []

  // Draft PL: find total CBM from the "General:" summary row
  let draftTotalCbm = null
  if (isDraftPL) {
    for (const row of rows) {
      for (const cell of row) {
        const m = String(cell).match(/([\d.]+)\s*cbm/i)
        if (m) { draftTotalCbm = parseNum(m[1]); break }
      }
      if (draftTotalCbm) break
    }
  }

  const items = []

  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i]
    const rawDesc = colMap.desc != null ? String(row[colMap.desc] || '') : ''
    const desc = rawDesc.replace(/[\r\n]+/g, ' ').trim()

    if (!desc) continue
    if (/^(total|general|remark|terms|port|ship|bill|from|to|tel|fax|attn|company|marks)/i.test(desc)) continue
    if (/^\d+$/.test(desc) && parseInt(desc) < 200) continue  // lone item numbers

    const qty = colMap.qty  != null ? parseNum(row[colMap.qty])  : null
    const nw  = colMap.nw   != null ? parseNum(row[colMap.nw])   : null
    const gw  = colMap.gw   != null ? parseNum(row[colMap.gw])   : null
    const nos = colMap.nos  != null ? parseNum(row[colMap.nos])  : null

    let cbm  = null
    let dims = null

    if (isDraftPL) {
      // Dimensions column contains "50*35.5*22.5" style strings
      if (colMap.dims != null) {
        const dimRaw = String(row[colMap.dims] || '')
        if (/\d+\*\d+/.test(dimRaw)) dims = dimRaw
      }
      // CBM is shared (total), distributed at the end
    } else {
      // EDAN: CBM column contains numeric values
      if (colMap.cbm != null) {
        const cbmRaw = String(row[colMap.cbm] || '').trim()
        if (/^[\d.]+$/.test(cbmRaw)) cbm = parseNum(cbmRaw)
      }
    }

    items.push({
      description: desc,
      quantity: qty,
      unit: 'pcs',
      cartons: nos,
      nw_kg: nw,
      gw_kg: gw,
      cbm,
      dimensions: dims
    })
  }

  // For Draft PL with single item or total CBM: attach to first item
  if (isDraftPL && draftTotalCbm && items.length === 1) {
    items[0].cbm = draftTotalCbm
  }

  return items
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

exports.list = (req, res) => {
  const { shipment_id, page = 1, limit = 20 } = req.query
  let records = db.get('packing_lists').value()

  if (shipment_id) records = records.filter(r => r.shipment_id == shipment_id)
  records = records.slice().sort((a, b) => (b.uploaded_at || '').localeCompare(a.uploaded_at || ''))

  const total = records.length
  const pageNum = parseInt(page), limitNum = parseInt(limit)
  const paged = records.slice((pageNum - 1) * limitNum, pageNum * limitNum)

  const shipments = db.get('shipments').value()
  const rows = paged.map(r => {
    const s = shipments.find(s => s.id === r.shipment_id)
    return { ...r, tracking_number: s ? s.tracking_number : null }
  })

  res.json({ data: rows, total, page: pageNum, limit: limitNum })
}

exports.get = (req, res) => {
  const id = parseInt(req.params.id)
  const record = db.get('packing_lists').find({ id }).value()
  if (!record) return res.status(404).json({ error: 'Не е намерен' })
  const shipments = db.get('shipments').value()
  const s = shipments.find(s => s.id === record.shipment_id)
  res.json({ ...record, tracking_number: s ? s.tracking_number : null })
}

exports.upload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файлът не е качен' })
  const { shipment_id } = req.body

  const filename = req.file.originalname
  const ext = filename.split('.').pop().toLowerCase()

  let items = []
  try {
    if (ext === 'pdf') {
      const result = await parsePdf(req.file.buffer)
      items = result.items
    } else if (['xlsx', 'xls'].includes(ext)) {
      items = parseExcel(req.file.buffer)
    } else {
      return res.status(400).json({ error: 'Поддържани формати: PDF, XLSX, XLS' })
    }
  } catch (err) {
    return res.status(422).json({ error: 'Грешка при парсване: ' + err.message })
  }

  // Compute totals
  const total_qty     = items.reduce((s, i) => s + (i.quantity || 0), 0) || null
  const total_nw_kg   = items.some(i => i.nw_kg) ? parseFloat(items.reduce((s, i) => s + (i.nw_kg || 0), 0).toFixed(2)) : null
  const total_gw_kg   = items.some(i => i.gw_kg) ? parseFloat(items.reduce((s, i) => s + (i.gw_kg || 0), 0).toFixed(2)) : null
  const total_cbm     = items.some(i => i.cbm)   ? parseFloat(items.reduce((s, i) => s + (i.cbm   || 0), 0).toFixed(3)) : null
  const total_cartons = items.some(i => i.cartons) ? items.reduce((s, i) => s + (i.cartons || 0), 0) : null

  const id = nextId('packing_lists')
  const record = {
    id,
    shipment_id: shipment_id ? parseInt(shipment_id) : null,
    source_file: filename,
    uploaded_at: now(),
    uploaded_by: req.user.id,
    items,
    total_qty,
    total_nw_kg,
    total_gw_kg,
    total_cbm,
    total_cartons
  }

  db.get('packing_lists').push(record).write()
  res.status(201).json(record)
}

exports.updateItem = (req, res) => {
  const id = parseInt(req.params.id)
  const record = db.get('packing_lists').find({ id }).value()
  if (!record) return res.status(404).json({ error: 'Не е намерен' })

  const { items, shipment_id } = req.body

  const updated = {
    ...record,
    shipment_id: shipment_id !== undefined ? (shipment_id ? parseInt(shipment_id) : null) : record.shipment_id,
    items: items !== undefined ? items : record.items
  }

  if (items) {
    updated.total_qty     = items.reduce((s, i) => s + (i.quantity || 0), 0) || null
    updated.total_nw_kg   = items.some(i => i.nw_kg) ? parseFloat(items.reduce((s, i) => s + (i.nw_kg || 0), 0).toFixed(2)) : null
    updated.total_gw_kg   = items.some(i => i.gw_kg) ? parseFloat(items.reduce((s, i) => s + (i.gw_kg || 0), 0).toFixed(2)) : null
    updated.total_cbm     = items.some(i => i.cbm)   ? parseFloat(items.reduce((s, i) => s + (i.cbm   || 0), 0).toFixed(3)) : null
    updated.total_cartons = items.some(i => i.cartons) ? items.reduce((s, i) => s + (i.cartons || 0), 0) : null
  }

  db.get('packing_lists').find({ id }).assign(updated).write()
  res.json(updated)
}

exports.remove = (req, res) => {
  const id = parseInt(req.params.id)
  db.get('packing_lists').remove({ id }).write()
  res.json({ message: 'Изтрито' })
}
