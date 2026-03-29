require('dotenv').config()
const { db, nextId, now } = require('./db')

console.log('Зареждане на данни за Януари–Март 2026...\n')

// ─── Изчисти стари данни ────────────────────────────────────────────────────
db.set('financial_records', []).write()
db.set('tracking_events', []).write()
db.set('shipments', []).write()
console.log('Изчистени стари пратки\n')

// ─── Пратки ─────────────────────────────────────────────────────────────────
const shipmentsData = [
  // ─── ЯНУАРИ 2026 ────────────────────────────────────────────────────────
  {
    tracking_number: 'INF-2026-001', status: 'delivered', direction: 'import',
    origin_country: 'DE', origin_city: 'Erlangen', dest_country: 'BG', dest_city: 'София',
    sender_name: 'Siemens Healthineers AG', sender_address: 'Henkestraße 127, 91052 Erlangen, Germany',
    recipient_name: 'Инфинита ООД', recipient_address: 'бул. Черни връх 51Б, 1407 София',
    courier_id: 1, transport_type: 'air',
    weight_kg: 68.5, length_cm: 95, width_cm: 60, height_cm: 55, packages_count: 3,
    hs_code: '9018.12', description: 'Ултразвукова система Siemens ACUSON P500 с 3 сонди', declared_value: 38500, currency: 'EUR',
    freight_cost: 355, insurance_cost: 385, customs_duty: 0, total_cost: 740,
    invoice_number: 'INV-2026-001', po_number: 'PO-2025-112', notes: 'Поръчка за УМБАЛ "Александровска"',
    assigned_to: 3, created_by: 2,
    created_at: '2026-01-05 09:00:00', updated_at: '2026-01-13 14:30:00', estimated_delivery: '2026-01-14', actual_delivery: '2026-01-13'
  },
  {
    tracking_number: 'INF-2026-002', status: 'in_transit', direction: 'import',
    origin_country: 'CN', origin_city: 'Shenzhen', dest_country: 'BG', dest_city: 'София',
    sender_name: 'Mindray Medical International Co., Ltd.', sender_address: 'Mindray Building, Keji 12th Road South, Shenzhen 518057',
    recipient_name: 'Инфинита ООД', recipient_address: 'бул. Черни връх 51Б, 1407 София',
    courier_id: 1, transport_type: 'sea',
    weight_kg: 425, length_cm: 180, width_cm: 120, height_cm: 95, packages_count: 6,
    hs_code: '9027.80', description: 'Биохимични анализатори Mindray BS-240 Pro x3 + реагенти', declared_value: 54000, currency: 'EUR',
    freight_cost: 638, insurance_cost: 540, customs_duty: 0, total_cost: 1178,
    invoice_number: 'INV-2026-002', po_number: 'PO-2025-118', notes: 'За СМДЛ "Синево" - Варна и Пловдив',
    assigned_to: 4, created_by: 2,
    created_at: '2026-01-07 10:00:00', updated_at: '2026-01-07 10:00:00', estimated_delivery: '2026-02-12', actual_delivery: null
  },
  {
    tracking_number: 'INF-2026-003', status: 'delivered', direction: 'export',
    origin_country: 'BG', origin_city: 'София', dest_country: 'GR', dest_city: 'Атина',
    sender_name: 'Инфинита ООД', sender_address: 'бул. Черни връх 51Б, 1407 София',
    recipient_name: 'Iatrika Hellas S.A.', recipient_address: 'Leoforos Kifissias 280, Halandri 15232, Athens',
    courier_id: 3, transport_type: 'road',
    weight_kg: 18.4, length_cm: 55, width_cm: 40, height_cm: 30, packages_count: 2,
    hs_code: '9021.50', description: 'Кардиостимулатори Nihon Kohden Cardiolife TEC-8321 x2', declared_value: 22400, currency: 'EUR',
    freight_cost: 48, insurance_cost: 224, customs_duty: 0, total_cost: 272,
    invoice_number: 'INV-2026-003', po_number: 'PO-2025-121', notes: 'Съгласно рамков договор GR-2025-04',
    assigned_to: 3, created_by: 2,
    created_at: '2026-01-08 08:30:00', updated_at: '2026-01-12 16:00:00', estimated_delivery: '2026-01-13', actual_delivery: '2026-01-12'
  },
  {
    tracking_number: 'INF-2026-004', status: 'delivered', direction: 'import',
    origin_country: 'AT', origin_city: 'Вена', dest_country: 'BG', dest_city: 'Пловдив',
    sender_name: 'Fresenius Medical Care Austria GmbH', sender_address: 'Hafenstraße 9, 4020 Linz, Austria',
    recipient_name: 'УМБАЛ "Пълмед" ООД', recipient_address: 'ул. Братя Бъкстон 25, 4004 Пловдив',
    courier_id: 2, transport_type: 'road',
    weight_kg: 298, length_cm: 200, width_cm: 140, height_cm: 115, packages_count: 4,
    hs_code: '9018.90', description: 'Диализни апарати Fresenius 5008S x4 с консумативи', declared_value: 76000, currency: 'EUR',
    freight_cost: 982, insurance_cost: 760, customs_duty: 0, total_cost: 1742,
    invoice_number: 'INV-2026-004', po_number: 'PO-2025-098', notes: 'Финална доставка по договор УМБАЛ Пълмед 2025',
    assigned_to: 4, created_by: 2,
    created_at: '2026-01-10 07:00:00', updated_at: '2026-01-14 18:00:00', estimated_delivery: '2026-01-15', actual_delivery: '2026-01-14'
  },
  {
    tracking_number: 'INF-2026-005', status: 'customs', direction: 'import',
    origin_country: 'DE', origin_city: 'Любек', dest_country: 'BG', dest_city: 'София',
    sender_name: 'Drägerwerk AG & Co. KGaA', sender_address: 'Moislinger Allee 53–55, 23558 Lübeck, Germany',
    recipient_name: 'УМБАЛ "Свети Георги" ЕАД', recipient_address: 'бул. Пещерско шосе 66, 4002 Пловдив',
    courier_id: 2, transport_type: 'road',
    weight_kg: 312, length_cm: 210, width_cm: 130, height_cm: 160, packages_count: 3,
    hs_code: '9020.00', description: 'Анестезиологична система Dräger Perseus A500 + монитор Infinity Delta', declared_value: 89500, currency: 'EUR',
    freight_cost: 966, insurance_cost: 895, customs_duty: 0, total_cost: 1861,
    invoice_number: 'INV-2026-005', po_number: 'PO-2025-134', notes: 'Изисква разрешение от ИАЛ',
    assigned_to: 3, created_by: 2,
    created_at: '2026-01-13 06:00:00', updated_at: '2026-01-20 11:00:00', estimated_delivery: '2026-01-21', actual_delivery: null
  },
  {
    tracking_number: 'INF-2026-006', status: 'delivered', direction: 'export',
    origin_country: 'BG', origin_city: 'Варна', dest_country: 'GR', dest_city: 'Солун',
    sender_name: 'Инфинита ООД', sender_address: 'пл. Славейков 1, 9000 Варна',
    recipient_name: 'Medical Hellas S.A.', recipient_address: 'Egnatia 154, Thessaloniki 54636',
    courier_id: 4, transport_type: 'road',
    weight_kg: 24.6, length_cm: 80, width_cm: 60, height_cm: 45, packages_count: 2,
    hs_code: '9021.31', description: 'Тазобедрени протези Stryker Accolade II x5 + инструментариум', declared_value: 18750, currency: 'EUR',
    freight_cost: 57, insurance_cost: 188, customs_duty: 0, total_cost: 245,
    invoice_number: 'INV-2026-006', po_number: 'PO-2025-127', notes: null,
    assigned_to: 4, created_by: 2,
    created_at: '2026-01-15 08:00:00', updated_at: '2026-01-18 15:00:00', estimated_delivery: '2026-01-19', actual_delivery: '2026-01-18'
  },
  {
    tracking_number: 'INF-2026-007', status: 'delivered', direction: 'import',
    origin_country: 'US', origin_city: 'Милуоки', dest_country: 'BG', dest_city: 'София',
    sender_name: 'GE HealthCare Technologies Inc.', sender_address: '9900 W Innovation Drive, Wauwatosa, WI 53226',
    recipient_name: 'УМБАЛ "Царица Йоанна – ИСУЛ" ЕАД', recipient_address: 'ул. Бяло море 8, 1527 София',
    courier_id: 1, transport_type: 'air',
    weight_kg: 548, length_cm: 220, width_cm: 140, height_cm: 135, packages_count: 7,
    hs_code: '9022.12', description: 'Дигитален рентгенов апарат GE Optima XR646 с детектор DR', declared_value: 94500, currency: 'EUR',
    freight_cost: 2838, insurance_cost: 945, customs_duty: 0, total_cost: 3783,
    invoice_number: 'INV-2026-007', po_number: 'PO-2025-141', notes: 'Монтаж от сертифициран GE техник',
    assigned_to: 3, created_by: 2,
    created_at: '2026-01-18 14:00:00', updated_at: '2026-01-28 10:00:00', estimated_delivery: '2026-01-29', actual_delivery: '2026-01-28'
  },
  // ─── ФЕВРУАРИ 2026 ──────────────────────────────────────────────────────
  {
    tracking_number: 'INF-2026-008', status: 'delivered', direction: 'import',
    origin_country: 'NL', origin_city: 'Айндховен', dest_country: 'BG', dest_city: 'София',
    sender_name: 'Philips Healthcare B.V.', sender_address: 'Veenpluis 6, 5684 PC Best, Netherlands',
    recipient_name: 'МЦ "Токуда Болница" АД', recipient_address: 'бул. Никола Вапцаров 51Б, 1407 София',
    courier_id: 1, transport_type: 'air',
    weight_kg: 82, length_cm: 105, width_cm: 70, height_cm: 65, packages_count: 2,
    hs_code: '9018.12', description: 'Ехографска система Philips EPIQ Elite с кардио пакет', declared_value: 62000, currency: 'EUR',
    freight_cost: 492, insurance_cost: 620, customs_duty: 0, total_cost: 1112,
    invoice_number: 'INV-2026-008', po_number: 'PO-2026-003', notes: 'Спешна поръчка за кардиологично отделение',
    assigned_to: 3, created_by: 2,
    created_at: '2026-02-02 08:00:00', updated_at: '2026-02-07 12:00:00', estimated_delivery: '2026-02-08', actual_delivery: '2026-02-07'
  },
  {
    tracking_number: 'INF-2026-009', status: 'delivered', direction: 'import',
    origin_country: 'DE', origin_city: 'Нюрнберг', dest_country: 'BG', dest_city: 'Варна',
    sender_name: 'Schiller AG Germany GmbH', sender_address: 'Altdorfer Str. 41, 90571 Schwaig bei Nürnberg',
    recipient_name: 'МБАЛ "Света Анна – Варна" АД', recipient_address: 'ул. Охридско езеро 3, 9010 Варна',
    courier_id: 2, transport_type: 'road',
    weight_kg: 45, length_cm: 75, width_cm: 55, height_cm: 40, packages_count: 5,
    hs_code: '9018.11', description: 'ЕКГ апарати Schiller CARDIOVIT AT-10 Plus x5 + Holter системи', declared_value: 14200, currency: 'EUR',
    freight_cost: 140, insurance_cost: 142, customs_duty: 0, total_cost: 282,
    invoice_number: 'INV-2026-009', po_number: 'PO-2026-005', notes: null,
    assigned_to: 4, created_by: 2,
    created_at: '2026-02-03 07:30:00', updated_at: '2026-02-07 17:00:00', estimated_delivery: '2026-02-08', actual_delivery: '2026-02-07'
  },
  {
    tracking_number: 'INF-2026-010', status: 'delivered', direction: 'export',
    origin_country: 'BG', origin_city: 'София', dest_country: 'GR', dest_city: 'Патра',
    sender_name: 'Инфинита ООД', sender_address: 'бул. Черни връх 51Б, 1407 София',
    recipient_name: 'Panagiotis Medical Supplies', recipient_address: 'Agiou Andreou 86, Patras 26222',
    courier_id: 3, transport_type: 'road',
    weight_kg: 12.8, length_cm: 60, width_cm: 40, height_cm: 35, packages_count: 3,
    hs_code: '9018.90', description: 'Лапароскопски инструментариум Karl Storz - комплект', declared_value: 9800, currency: 'EUR',
    freight_cost: 32, insurance_cost: 98, customs_duty: 0, total_cost: 130,
    invoice_number: 'INV-2026-010', po_number: 'PO-2026-007', notes: null,
    assigned_to: 3, created_by: 2,
    created_at: '2026-02-05 09:00:00', updated_at: '2026-02-09 14:30:00', estimated_delivery: '2026-02-10', actual_delivery: '2026-02-09'
  },
  {
    tracking_number: 'INF-2026-011', status: 'confirmed', direction: 'import',
    origin_country: 'NL', origin_city: 'Айндховен', dest_country: 'BG', dest_city: 'София',
    sender_name: 'Philips Healthcare B.V.', sender_address: 'Veenpluis 6, 5684 PC Best, Netherlands',
    recipient_name: 'Инфинита ООД', recipient_address: 'бул. Черни връх 51Б, 1407 София',
    courier_id: 2, transport_type: 'road',
    weight_kg: 58, length_cm: 80, width_cm: 60, height_cm: 50, packages_count: 4,
    hs_code: '9018.19', description: 'Дефибрилатори Philips HeartStart MRx x4 + AED FRx x6', declared_value: 31500, currency: 'EUR',
    freight_cost: 310, insurance_cost: 315, customs_duty: 0, total_cost: 625,
    invoice_number: 'INV-2026-011', po_number: 'PO-2026-009', notes: 'За спешни центрове - Министерство на здравеопазването',
    assigned_to: 4, created_by: 2,
    created_at: '2026-02-10 10:00:00', updated_at: '2026-02-10 10:00:00', estimated_delivery: '2026-02-18', actual_delivery: null
  },
  {
    tracking_number: 'INF-2026-012', status: 'in_transit', direction: 'import',
    origin_country: 'JP', origin_city: 'Токио', dest_country: 'BG', dest_city: 'София',
    sender_name: 'Canon Medical Systems Corporation', sender_address: '1385 Shimoishigami, Otawara-shi, Tochigi 324-8550',
    recipient_name: 'УМБАЛ "Александровска" ЕАД', recipient_address: 'ул. Свети Георги Софийски 1, 1431 София',
    courier_id: 1, transport_type: 'air',
    weight_kg: 1240, length_cm: 280, width_cm: 180, height_cm: 165, packages_count: 12,
    hs_code: '9022.11', description: 'CT скенер Canon Aquilion Prime SP 160-срезов с работна станция', declared_value: 485000, currency: 'EUR',
    freight_cost: 7275, insurance_cost: 4850, customs_duty: 0, total_cost: 12125,
    invoice_number: 'INV-2026-012', po_number: 'PO-2025-089', notes: 'Проект ОП "Региони в растеж" - УМБАЛ Александровска',
    assigned_to: 3, created_by: 2,
    created_at: '2026-02-12 06:00:00', updated_at: '2026-02-25 08:00:00', estimated_delivery: '2026-02-26', actual_delivery: null
  },
  {
    tracking_number: 'INF-2026-013', status: 'delivered', direction: 'export',
    origin_country: 'BG', origin_city: 'София', dest_country: 'RO', dest_city: 'Букурещ',
    sender_name: 'Инфинита ООД', sender_address: 'бул. Черни връх 51Б, 1407 София',
    recipient_name: 'MedLife S.A.', recipient_address: 'Calea Grivitei 365, Sector 1, Bucharest 010719',
    courier_id: 2, transport_type: 'road',
    weight_kg: 88, length_cm: 120, width_cm: 80, height_cm: 70, packages_count: 6,
    hs_code: '9019.10', description: 'Физиотерапевтично оборудване BTL-5000 - комплект x3', declared_value: 16800, currency: 'EUR',
    freight_cost: 195, insurance_cost: 168, customs_duty: 0, total_cost: 363,
    invoice_number: 'INV-2026-013', po_number: 'PO-2026-002', notes: 'Нов клиент - пробна доставка',
    assigned_to: 4, created_by: 2,
    created_at: '2026-02-14 08:00:00', updated_at: '2026-02-18 16:30:00', estimated_delivery: '2026-02-19', actual_delivery: '2026-02-18'
  },
  {
    tracking_number: 'INF-2026-014', status: 'in_transit', direction: 'import',
    origin_country: 'DE', origin_city: 'Любек', dest_country: 'BG', dest_city: 'Стара Загора',
    sender_name: 'Drägerwerk AG & Co. KGaA', sender_address: 'Moislinger Allee 53–55, 23558 Lübeck, Germany',
    recipient_name: 'УМБАЛ "Проф. д-р Стоян Киркович" ЕАД', recipient_address: 'ул. Армейска 11, 6000 Стара Загора',
    courier_id: 2, transport_type: 'road',
    weight_kg: 195, length_cm: 160, width_cm: 120, height_cm: 145, packages_count: 2,
    hs_code: '9020.00', description: 'Анестезиологична система Dräger Atlan A350 XL + газов модул', declared_value: 52000, currency: 'EUR',
    freight_cost: 637, insurance_cost: 520, customs_duty: 0, total_cost: 1157,
    invoice_number: 'INV-2026-014', po_number: 'PO-2026-011', notes: null,
    assigned_to: 3, created_by: 2,
    created_at: '2026-02-19 07:00:00', updated_at: '2026-02-24 09:00:00', estimated_delivery: '2026-02-25', actual_delivery: null
  },
  // ─── МАРТ 2026 ──────────────────────────────────────────────────────────
  {
    tracking_number: 'INF-2026-015', status: 'in_transit', direction: 'import',
    origin_country: 'CN', origin_city: 'Шанхай', dest_country: 'BG', dest_city: 'София',
    sender_name: 'Mindray Medical International Co., Ltd.', sender_address: 'Mindray Building, Keji 12th Road South, Shenzhen 518057',
    recipient_name: 'Инфинита ООД', recipient_address: 'бул. Черни връх 51Б, 1407 София',
    courier_id: 1, transport_type: 'sea',
    weight_kg: 680, length_cm: 200, width_cm: 150, height_cm: 130, packages_count: 8,
    hs_code: '9018.13', description: 'МРТ система Mindray Teslatom 1.5T с пълен комплект бобини', declared_value: 680000, currency: 'EUR',
    freight_cost: 2040, insurance_cost: 6800, customs_duty: 0, total_cost: 8840,
    invoice_number: 'INV-2026-015', po_number: 'PO-2025-156', notes: 'За ново отделение по образна диагностика - МБАЛ Благоевград',
    assigned_to: 4, created_by: 2,
    created_at: '2026-03-01 08:00:00', updated_at: '2026-03-03 10:00:00', estimated_delivery: '2026-04-08', actual_delivery: null
  },
  {
    tracking_number: 'INF-2026-016', status: 'confirmed', direction: 'export',
    origin_country: 'BG', origin_city: 'Пловдив', dest_country: 'GR', dest_city: 'Солун',
    sender_name: 'Инфинита ООД', sender_address: 'бул. Кукленско шосе 28, 4004 Пловдив',
    recipient_name: 'Rehab Center Thessaloniki', recipient_address: 'Tsimisski 43, Thessaloniki 54623',
    courier_id: 4, transport_type: 'road',
    weight_kg: 156, length_cm: 180, width_cm: 120, height_cm: 100, packages_count: 8,
    hs_code: '9019.10', description: 'Рехабилитационни апарати Biodex System 4 Pro + маси за терапия', declared_value: 28500, currency: 'EUR',
    freight_cost: 358, insurance_cost: 285, customs_duty: 0, total_cost: 643,
    invoice_number: 'INV-2026-016', po_number: 'PO-2026-015', notes: null,
    assigned_to: 3, created_by: 2,
    created_at: '2026-03-04 09:00:00', updated_at: '2026-03-04 09:00:00', estimated_delivery: '2026-03-10', actual_delivery: null
  },
  {
    tracking_number: 'INF-2026-017', status: 'in_transit', direction: 'import',
    origin_country: 'US', origin_city: 'Чикаго', dest_country: 'BG', dest_city: 'София',
    sender_name: 'GE HealthCare Technologies Inc.', sender_address: '9900 W Innovation Drive, Wauwatosa, WI 53226',
    recipient_name: 'МЦ "Сърдечно-съдова хирургия" ЕООД', recipient_address: 'бул. Пенчо Славейков 52, 1606 София',
    courier_id: 1, transport_type: 'air',
    weight_kg: 94, length_cm: 120, width_cm: 80, height_cm: 75, packages_count: 2,
    hs_code: '9018.12', description: 'Кардиологична ехографска система GE Vivid E95 с 4D кардио сонда', declared_value: 112000, currency: 'EUR',
    freight_cost: 840, insurance_cost: 1120, customs_duty: 0, total_cost: 1960,
    invoice_number: 'INV-2026-017', po_number: 'PO-2026-013', notes: 'Приоритетна пратка - спешна нужда',
    assigned_to: 3, created_by: 2,
    created_at: '2026-03-06 12:00:00', updated_at: '2026-03-14 09:00:00', estimated_delivery: '2026-03-15', actual_delivery: null
  },
  {
    tracking_number: 'INF-2026-018', status: 'pending', direction: 'import',
    origin_country: 'DE', origin_city: 'Форхайм', dest_country: 'BG', dest_city: 'Бургас',
    sender_name: 'Siemens Healthineers AG', sender_address: 'Siemensstraße 1, 91301 Forchheim, Germany',
    recipient_name: 'МБАЛ "Дева Мария" ООД', recipient_address: 'ул. Стефан Стамболов 57, 8000 Бургас',
    courier_id: 2, transport_type: 'road',
    weight_kg: 890, length_cm: 240, width_cm: 160, height_cm: 170, packages_count: 10,
    hs_code: '9022.11', description: 'CT скенер Siemens SOMATOM go.Now с UHD иRIS платформа', declared_value: 398000, currency: 'EUR',
    freight_cost: 4378, insurance_cost: 3980, customs_duty: 0, total_cost: 8358,
    invoice_number: 'INV-2026-018', po_number: 'PO-2026-018', notes: 'Изчаква финансиране ОП "Иновации и конкурентоспособност"',
    assigned_to: 4, created_by: 2,
    created_at: '2026-03-10 10:00:00', updated_at: '2026-03-10 10:00:00', estimated_delivery: '2026-04-05', actual_delivery: null
  },
  {
    tracking_number: 'INF-2026-019', status: 'in_transit', direction: 'export',
    origin_country: 'BG', origin_city: 'София', dest_country: 'GR', dest_city: 'Атина',
    sender_name: 'Инфинита ООД', sender_address: 'бул. Черни връх 51Б, 1407 София',
    recipient_name: 'Evangelismos General Hospital', recipient_address: 'Ipsilantou 45-47, Athens 10676',
    courier_id: 5, transport_type: 'express',
    weight_kg: 8.2, length_cm: 45, width_cm: 35, height_cm: 25, packages_count: 1,
    hs_code: '9021.50', description: 'Имплантируем дефибрилатор Medtronic Evoque x2 - спешна доставка', declared_value: 34000, currency: 'EUR',
    freight_cost: 98, insurance_cost: 340, customs_duty: 0, total_cost: 438,
    invoice_number: 'INV-2026-019', po_number: 'PO-2026-020', notes: 'СПЕШНА - пациент чака операция',
    assigned_to: 3, created_by: 2,
    created_at: '2026-03-17 14:00:00', updated_at: '2026-03-18 06:00:00', estimated_delivery: '2026-03-19', actual_delivery: null
  },
  {
    tracking_number: 'INF-2026-020', status: 'pending', direction: 'import',
    origin_country: 'AT', origin_city: 'Грац', dest_country: 'BG', dest_city: 'София',
    sender_name: 'Fresenius Kabi Austria GmbH', sender_address: 'Hafnerstraße 36, 8055 Graz, Austria',
    recipient_name: 'Инфинита ООД', recipient_address: 'бул. Черни връх 51Б, 1407 София',
    courier_id: 2, transport_type: 'road',
    weight_kg: 112, length_cm: 130, width_cm: 90, height_cm: 80, packages_count: 8,
    hs_code: '9018.90', description: 'Инфузионни помпи Fresenius Kabi Agilia VP x10 + стойки', declared_value: 24500, currency: 'EUR',
    freight_cost: 302, insurance_cost: 245, customs_duty: 0, total_cost: 547,
    invoice_number: 'INV-2026-020', po_number: 'PO-2026-022', notes: 'Рамкова поръчка болници 2026 - 1ва доставка',
    assigned_to: 4, created_by: 2,
    created_at: '2026-03-20 09:00:00', updated_at: '2026-03-20 09:00:00', estimated_delivery: '2026-03-28', actual_delivery: null
  },
]

shipmentsData.forEach(s => {
  db.get('shipments').push({ id: nextId('shipments'), ...s }).write()
})
console.log(`${shipmentsData.length} пратки вмъкнати`)

// ─── Вземи ID-тата по tracking number ────────────────────────────────────────
const sid = {}
db.get('shipments').filter(s => s.tracking_number && s.tracking_number.startsWith('INF-2026-')).value()
  .forEach(r => { sid[r.tracking_number] = r.id })

// ─── Tracking Events ─────────────────────────────────────────────────────────
const eventsData = [
  // INF-2026-001 (delivered)
  { shipment_id: sid['INF-2026-001'], status: 'confirmed',  location: 'Erlangen, DE',              description: 'Пратката е приета от Siemens Healthineers и предадена на Kuehne+Nagel',         timestamp: '2026-01-05 11:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-001'], status: 'in_transit', location: 'Frankfurt Flughafen',        description: 'Заредена на полет LH8406 за Sofia',                                              timestamp: '2026-01-06 03:30:00', created_by: 2 },
  { shipment_id: sid['INF-2026-001'], status: 'in_transit', location: 'Sofia Airport, BG',          description: 'Пристигнала на летище София, предадена на митница',                              timestamp: '2026-01-06 09:15:00', created_by: 2 },
  { shipment_id: sid['INF-2026-001'], status: 'customs',    location: 'Митница Аерогара София',     description: 'Митнически преглед завършен, освободена',                                       timestamp: '2026-01-07 14:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-001'], status: 'in_transit', location: 'Sofia, BG',                  description: 'Пратката е в склад Kuehne+Nagel за последна миля',                               timestamp: '2026-01-08 09:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-001'], status: 'delivered',  location: 'София, бул. Черни връх 51Б', description: 'Доставена и приета от Инфинита ООД - получил Петър Георгиев',                   timestamp: '2026-01-13 14:30:00', created_by: 3 },

  // INF-2026-002 (in_transit - sea)
  { shipment_id: sid['INF-2026-002'], status: 'confirmed',  location: 'Shenzhen, CN',               description: 'Пратката е приета и опакована в Mindray',                                        timestamp: '2026-01-07 10:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-002'], status: 'in_transit', location: 'Yantian Port, CN',           description: 'Натоварена на контейнеровоз MSC Loreto, коносамент MSCUYX987654',                timestamp: '2026-01-10 16:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-002'], status: 'in_transit', location: 'Port Klang, MY',             description: 'Транзит Малайзия - прехвърлен на фидерен кораб',                                timestamp: '2026-01-18 08:00:00', created_by: 4 },
  { shipment_id: sid['INF-2026-002'], status: 'in_transit', location: 'Suez Canal',                 description: 'Преминаване на Суецкия канал без инциденти',                                     timestamp: '2026-01-28 12:00:00', created_by: 4 },
  { shipment_id: sid['INF-2026-002'], status: 'in_transit', location: 'Piraeus Port, GR',           description: 'Транзит пристанище Пирея, очаква фидер до Варна',                               timestamp: '2026-02-04 09:00:00', created_by: 4 },

  // INF-2026-003 (delivered export BG→GR)
  { shipment_id: sid['INF-2026-003'], status: 'confirmed',  location: 'София, BG',                  description: 'Пратката е подготвена и предадена на Юнимастърс',                               timestamp: '2026-01-08 08:30:00', created_by: 3 },
  { shipment_id: sid['INF-2026-003'], status: 'in_transit', location: 'Kulata, BG/GR',              description: 'Преминат граничен пункт Кулата/Промахон без проблеми',                          timestamp: '2026-01-09 11:20:00', created_by: 3 },
  { shipment_id: sid['INF-2026-003'], status: 'in_transit', location: 'Thessaloniki, GR',           description: 'Разпределителен склад Юнимастърс Солун',                                         timestamp: '2026-01-10 18:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-003'], status: 'delivered',  location: 'Halandri, Athens',           description: 'Доставена в Iatrika Hellas, подписана от д-р Петридис',                          timestamp: '2026-01-12 16:00:00', created_by: 3 },

  // INF-2026-004 (delivered AT→BG)
  { shipment_id: sid['INF-2026-004'], status: 'confirmed',  location: 'Linz, AT',                   description: 'Предадена на Карго-Партнер от Fresenius Medical Care',                           timestamp: '2026-01-10 07:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-004'], status: 'in_transit', location: 'Vienna, AT',                 description: 'Групирана с друга пратка в склад Wien-Süd',                                      timestamp: '2026-01-10 16:00:00', created_by: 4 },
  { shipment_id: sid['INF-2026-004'], status: 'in_transit', location: 'Budapest, HU',               description: 'Транзит Будапеща',                                                               timestamp: '2026-01-11 14:00:00', created_by: 4 },
  { shipment_id: sid['INF-2026-004'], status: 'in_transit', location: 'Калотина, BG',               description: 'Влязла в България при ГКПП Калотина',                                            timestamp: '2026-01-13 09:30:00', created_by: 4 },
  { shipment_id: sid['INF-2026-004'], status: 'delivered',  location: 'Пловдив, УМБАЛ Пълмед',      description: 'Доставена и приета, придружена от техник на Fresenius за въвеждане в работа',     timestamp: '2026-01-14 18:00:00', created_by: 4 },

  // INF-2026-005 (customs - задържана)
  { shipment_id: sid['INF-2026-005'], status: 'confirmed',  location: 'Lübeck, DE',                 description: 'Предадена на Карго-Партнер от Dräger',                                           timestamp: '2026-01-13 06:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-005'], status: 'in_transit', location: 'Munich, DE',                 description: 'Консолидиращ склад за Bulgaria',                                                  timestamp: '2026-01-14 20:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-005'], status: 'in_transit', location: 'Виден, BG',                  description: 'Влязла в България при ГКПП Видин/Калафат',                                       timestamp: '2026-01-18 08:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-005'], status: 'customs',    location: 'МП Виден, Митница Враца',    description: 'Задържана за митнически контрол - изисква лиценз от ИАЛ за анестезия апарат',     timestamp: '2026-01-18 11:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-005'], status: 'customs',    location: 'МП Виден',                   description: 'Документите изпратени до ИАЛ - очаква се одобрение',                             timestamp: '2026-01-20 11:00:00', created_by: 3 },

  // INF-2026-006 (delivered export BG→GR)
  { shipment_id: sid['INF-2026-006'], status: 'confirmed',  location: 'Варна, BG',                  description: 'Пратката е подготвена в склад Варна и предадена на НИК Транс',                  timestamp: '2026-01-15 08:00:00', created_by: 4 },
  { shipment_id: sid['INF-2026-006'], status: 'in_transit', location: 'Sofia, BG',                  description: 'Преминала транзит София',                                                         timestamp: '2026-01-16 14:00:00', created_by: 4 },
  { shipment_id: sid['INF-2026-006'], status: 'in_transit', location: 'Promachonas, GR',            description: 'Преминат граничен пункт Промахон',                                               timestamp: '2026-01-17 10:30:00', created_by: 4 },
  { shipment_id: sid['INF-2026-006'], status: 'delivered',  location: 'Thessaloniki, GR',           description: 'Доставена в Medical Hellas - Солун',                                              timestamp: '2026-01-18 15:00:00', created_by: 4 },

  // INF-2026-007 (delivered US→BG air)
  { shipment_id: sid['INF-2026-007'], status: 'confirmed',  location: 'Wauwatosa, WI, US',          description: 'Пратката е приета от GE HealthCare и предадена на Kuehne+Nagel',                 timestamp: '2026-01-18 14:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-007'], status: 'in_transit', location: "Chicago O'Hare, US",         description: 'Заредена на полет UA982 Chicago→Frankfurt',                                       timestamp: '2026-01-19 21:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-007'], status: 'in_transit', location: 'Frankfurt Flughafen',        description: 'Пристигнала FRA, прехвърлена на LH8406 за Sofia',                                 timestamp: '2026-01-20 15:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-007'], status: 'in_transit', location: 'Sofia Airport, BG',          description: 'Пристигнала летище София',                                                        timestamp: '2026-01-21 09:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-007'], status: 'customs',    location: 'Митница Аерогара София',     description: 'Митнически преглед и проверка на сертификати CE/FDA',                            timestamp: '2026-01-22 11:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-007'], status: 'in_transit', location: 'Sofia, BG',                  description: 'Освободена от митница, в транзит към ИСУЛ',                                       timestamp: '2026-01-27 14:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-007'], status: 'delivered',  location: 'София, УМБАЛ ИСУЛ',          description: 'Доставена и приета. GE техник ще пристигне за монтаж на 30.01',                  timestamp: '2026-01-28 10:00:00', created_by: 3 },

  // INF-2026-008 (delivered NL→BG air)
  { shipment_id: sid['INF-2026-008'], status: 'confirmed',  location: 'Best, NL',                   description: 'Приета от Philips Healthcare, документи ОК',                                      timestamp: '2026-02-02 08:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-008'], status: 'in_transit', location: 'Amsterdam Schiphol',         description: 'Заредена на KL1843 Amsterdam→Sofia',                                              timestamp: '2026-02-03 06:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-008'], status: 'in_transit', location: 'Sofia Airport',              description: 'Пристигнала, бързо митническо оформяне (AEO статус)',                             timestamp: '2026-02-03 12:30:00', created_by: 3 },
  { shipment_id: sid['INF-2026-008'], status: 'delivered',  location: 'София, Токуда Болница',      description: 'Доставена. Philips сервизен инженер извършва инсталация',                         timestamp: '2026-02-07 12:00:00', created_by: 3 },

  // INF-2026-009 (delivered DE→BG road)
  { shipment_id: sid['INF-2026-009'], status: 'confirmed',  location: 'Schwaig, DE',                description: 'Предадена на Карго-Партнер',                                                      timestamp: '2026-02-03 07:30:00', created_by: 2 },
  { shipment_id: sid['INF-2026-009'], status: 'in_transit', location: 'Vienna, AT',                 description: 'Транзит Виена',                                                                   timestamp: '2026-02-04 18:00:00', created_by: 4 },
  { shipment_id: sid['INF-2026-009'], status: 'in_transit', location: 'Русе, BG',                   description: 'Влязла в България при ГКПП Русе/Гюргево',                                        timestamp: '2026-02-06 10:00:00', created_by: 4 },
  { shipment_id: sid['INF-2026-009'], status: 'delivered',  location: 'Варна, МБАЛ Св. Анна',       description: 'Доставена и приета от медицинска сестра Стоянова',                                timestamp: '2026-02-07 17:00:00', created_by: 4 },

  // INF-2026-010 (delivered export BG→GR)
  { shipment_id: sid['INF-2026-010'], status: 'confirmed',  location: 'София, BG',                  description: 'Пратката е подготвена и предадена на Юнимастърс',                               timestamp: '2026-02-05 09:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-010'], status: 'in_transit', location: 'Kулата/Промахон',            description: 'Преминат граничен пункт',                                                         timestamp: '2026-02-07 08:45:00', created_by: 3 },
  { shipment_id: sid['INF-2026-010'], status: 'delivered',  location: 'Patras, GR',                 description: 'Доставена в Panagiotis Medical',                                                  timestamp: '2026-02-09 14:30:00', created_by: 3 },

  // INF-2026-011 (confirmed - очаква тръгване)
  { shipment_id: sid['INF-2026-011'], status: 'confirmed',  location: 'Best, NL',                   description: 'Поръчката потвърдена от Philips, събиране на стоката от склад',                   timestamp: '2026-02-10 10:00:00', created_by: 2 },

  // INF-2026-012 (in_transit JP→BG air)
  { shipment_id: sid['INF-2026-012'], status: 'confirmed',  location: 'Tochigi, JP',                description: 'Финална проверка и опаковане на Canon CT системата',                              timestamp: '2026-02-12 06:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-012'], status: 'in_transit', location: 'Narita Airport, JP',         description: 'Заредена на CA836 Tokyo→Frankfurt',                                               timestamp: '2026-02-14 22:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-012'], status: 'in_transit', location: 'Frankfurt Flughafen',        description: 'Пристигнала FRA, прехвърлена и продължава към Sofia',                             timestamp: '2026-02-15 12:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-012'], status: 'in_transit', location: 'Sofia Airport',              description: 'Пристигнала летище София, в процес на митническо оформяне',                       timestamp: '2026-02-25 08:00:00', created_by: 3 },

  // INF-2026-013 (delivered export BG→RO)
  { shipment_id: sid['INF-2026-013'], status: 'confirmed',  location: 'София, BG',                  description: 'Пратката е подготвена за Румъния',                                               timestamp: '2026-02-14 08:00:00', created_by: 4 },
  { shipment_id: sid['INF-2026-013'], status: 'in_transit', location: 'Русе/Гюргево',               description: 'Преминат ГКПП Русе, влязла в Румъния',                                           timestamp: '2026-02-16 11:00:00', created_by: 4 },
  { shipment_id: sid['INF-2026-013'], status: 'delivered',  location: 'Bucharest, MedLife',         description: 'Доставена, клиентът много доволен - ще следват нови поръчки',                     timestamp: '2026-02-18 16:30:00', created_by: 4 },

  // INF-2026-014 (in_transit DE→BG road)
  { shipment_id: sid['INF-2026-014'], status: 'confirmed',  location: 'Lübeck, DE',                 description: 'Предадена на Карго-Партнер от Dräger за Стара Загора',                           timestamp: '2026-02-19 07:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-014'], status: 'in_transit', location: 'Vienna, AT',                 description: 'Транзит Виена, товарен на съвместна камионна линия BG',                           timestamp: '2026-02-21 14:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-014'], status: 'in_transit', location: 'Калотина, BG',               description: 'Влязла в България',                                                               timestamp: '2026-02-24 09:00:00', created_by: 3 },

  // INF-2026-015 (in_transit CN sea)
  { shipment_id: sid['INF-2026-015'], status: 'confirmed',  location: 'Shenzhen, CN',               description: 'МРТ системата е произведена и готова за експедиция',                              timestamp: '2026-03-01 08:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-015'], status: 'in_transit', location: 'Shanghai Port',              description: 'Натоварена на MSC Beatrice, коносамент MSCU2026-03-015',                          timestamp: '2026-03-03 10:00:00', created_by: 2 },

  // INF-2026-016 (confirmed - само потвърдена)
  { shipment_id: sid['INF-2026-016'], status: 'confirmed',  location: 'Пловдив, BG',                description: 'Поръчката потвърдена, стоката готова за изпращане',                               timestamp: '2026-03-04 09:00:00', created_by: 3 },

  // INF-2026-017 (in_transit US→BG air)
  { shipment_id: sid['INF-2026-017'], status: 'confirmed',  location: 'Wauwatosa, WI, US',          description: 'Прието от GE HealthCare, спешна обработка',                                       timestamp: '2026-03-06 12:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-017'], status: 'in_transit', location: "Chicago O'Hare",             description: 'Заредена на полет AA100 Chicago→London Heathrow',                                 timestamp: '2026-03-07 18:00:00', created_by: 2 },
  { shipment_id: sid['INF-2026-017'], status: 'in_transit', location: 'London Heathrow',            description: 'Прехвърлена на BA855 Heathrow→Sofia',                                             timestamp: '2026-03-08 10:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-017'], status: 'in_transit', location: 'Sofia Airport',              description: 'Пристигнала Sofia Airport - митнически контрол в процес',                         timestamp: '2026-03-14 09:00:00', created_by: 3 },

  // INF-2026-018 (pending)
  { shipment_id: sid['INF-2026-018'], status: 'pending',    location: 'Forchheim, DE',              description: 'Поръчката регистрирана, изчаква потвърждение на финансиране',                     timestamp: '2026-03-10 10:00:00', created_by: 2 },

  // INF-2026-019 (in_transit express BG→GR)
  { shipment_id: sid['INF-2026-019'], status: 'confirmed',  location: 'София, BG',                  description: 'СПЕШНА ПРАТКА - Медtronic устройства в склад, подготвени за изпращане',           timestamp: '2026-03-17 14:00:00', created_by: 3 },
  { shipment_id: sid['INF-2026-019'], status: 'in_transit', location: 'Kulata/Promachonas',         description: 'Преминат граничен пункт Кулата 17.03 22:15',                                      timestamp: '2026-03-17 22:15:00', created_by: 3 },
  { shipment_id: sid['INF-2026-019'], status: 'in_transit', location: 'Athens, GR',                 description: 'В разпределителен склад Plus Ultra - Атина, очаква финална доставка',             timestamp: '2026-03-18 06:00:00', created_by: 3 },

  // INF-2026-020 (pending)
  { shipment_id: sid['INF-2026-020'], status: 'pending',    location: 'Graz, AT',                   description: 'Поръчката е пусната, Fresenius Kabi потвърждава наличност',                       timestamp: '2026-03-20 09:00:00', created_by: 4 },
]

eventsData.forEach(e => {
  db.get('tracking_events').push({ id: nextId('tracking_events'), ...e }).write()
})
console.log(`${eventsData.length} tracking events вмъкнати`)

// ─── Финансови записи ────────────────────────────────────────────────────────
const rate = 1.9558 // EUR→BGN

const financialsData = [
  // Транспортни фактури
  { type: 'invoice', shipment_id: sid['INF-2026-001'], amount: 740,   currency: 'EUR', amount_bgn: +(740*rate).toFixed(2),   description: 'Транспорт + застраховка INF-2026-001 (Siemens ACUSON P500)',       category: 'Транспорт',   courier_id: 1, invoice_number: 'KN-2026-0113',  due_date: '2026-02-13', paid_date: '2026-02-10', status: 'paid',    created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-002'], amount: 1178,  currency: 'EUR', amount_bgn: +(1178*rate).toFixed(2),  description: 'Морски транспорт INF-2026-002 (Mindray BS-240 Pro)',               category: 'Транспорт',   courier_id: 1, invoice_number: 'KN-2026-0107',  due_date: '2026-03-07', paid_date: null,         status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-003'], amount: 272,   currency: 'EUR', amount_bgn: +(272*rate).toFixed(2),   description: 'Наземен транспорт BG→GR INF-2026-003 (Кардиостимулатори)',        category: 'Транспорт',   courier_id: 3, invoice_number: 'UM-2026-0108',  due_date: '2026-02-08', paid_date: '2026-02-05', status: 'paid',    created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-004'], amount: 1742,  currency: 'EUR', amount_bgn: +(1742*rate).toFixed(2),  description: 'Транспорт AT→BG INF-2026-004 (Fresenius 5008S x4)',               category: 'Транспорт',   courier_id: 2, invoice_number: 'CP-2026-0110',  due_date: '2026-02-10', paid_date: '2026-02-08', status: 'paid',    created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-005'], amount: 1861,  currency: 'EUR', amount_bgn: +(1861*rate).toFixed(2),  description: 'Транспорт DE→BG INF-2026-005 (Dräger Perseus A500)',              category: 'Транспорт',   courier_id: 2, invoice_number: 'CP-2026-0113',  due_date: '2026-02-13', paid_date: null,         status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-006'], amount: 245,   currency: 'EUR', amount_bgn: +(245*rate).toFixed(2),   description: 'Наземен транспорт BG→GR INF-2026-006 (Стryker протези)',          category: 'Транспорт',   courier_id: 4, invoice_number: 'NT-2026-0115',  due_date: '2026-02-15', paid_date: '2026-02-12', status: 'paid',    created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-007'], amount: 3783,  currency: 'EUR', amount_bgn: +(3783*rate).toFixed(2),  description: 'Въздушен транспорт US→BG INF-2026-007 (GE Optima XR646)',         category: 'Транспорт',   courier_id: 1, invoice_number: 'KN-2026-0118',  due_date: '2026-02-18', paid_date: '2026-02-15', status: 'paid',    created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-008'], amount: 1112,  currency: 'EUR', amount_bgn: +(1112*rate).toFixed(2),  description: 'Въздушен транспорт NL→BG INF-2026-008 (Philips EPIQ Elite)',      category: 'Транспорт',   courier_id: 1, invoice_number: 'KN-2026-0202',  due_date: '2026-03-02', paid_date: '2026-02-28', status: 'paid',    created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-009'], amount: 282,   currency: 'EUR', amount_bgn: +(282*rate).toFixed(2),   description: 'Наземен транспорт DE→BG INF-2026-009 (Schiller ЕКГ x5)',         category: 'Транспорт',   courier_id: 2, invoice_number: 'CP-2026-0203',  due_date: '2026-03-03', paid_date: '2026-03-01', status: 'paid',    created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-010'], amount: 130,   currency: 'EUR', amount_bgn: +(130*rate).toFixed(2),   description: 'Наземен транспорт BG→GR INF-2026-010 (Karl Storz лапароскопия)', category: 'Транспорт',   courier_id: 3, invoice_number: 'UM-2026-0205',  due_date: '2026-03-05', paid_date: '2026-03-03', status: 'paid',    created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-011'], amount: 625,   currency: 'EUR', amount_bgn: +(625*rate).toFixed(2),   description: 'Транспорт NL→BG INF-2026-011 (Philips HeartStart x10)',           category: 'Транспорт',   courier_id: 2, invoice_number: 'CP-2026-0210',  due_date: '2026-03-10', paid_date: null,         status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-012'], amount: 12125, currency: 'EUR', amount_bgn: +(12125*rate).toFixed(2), description: 'Въздушен транспорт + застраховка INF-2026-012 (Canon CT)',        category: 'Транспорт',   courier_id: 1, invoice_number: 'KN-2026-0212',  due_date: '2026-03-12', paid_date: null,         status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-013'], amount: 363,   currency: 'EUR', amount_bgn: +(363*rate).toFixed(2),   description: 'Наземен транспорт BG→RO INF-2026-013 (BTL физиотерапия)',         category: 'Транспорт',   courier_id: 2, invoice_number: 'CP-2026-0214',  due_date: '2026-03-14', paid_date: '2026-03-10', status: 'paid',    created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-014'], amount: 1157,  currency: 'EUR', amount_bgn: +(1157*rate).toFixed(2),  description: 'Транспорт DE→BG INF-2026-014 (Dräger Atlan A350)',                category: 'Транспорт',   courier_id: 2, invoice_number: 'CP-2026-0219',  due_date: '2026-03-19', paid_date: null,         status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-015'], amount: 8840,  currency: 'EUR', amount_bgn: +(8840*rate).toFixed(2),  description: 'Морски транспорт + застраховка INF-2026-015 (Mindray МРТ)',       category: 'Транспорт',   courier_id: 1, invoice_number: 'KN-2026-0301',  due_date: '2026-04-01', paid_date: null,         status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-016'], amount: 643,   currency: 'EUR', amount_bgn: +(643*rate).toFixed(2),   description: 'Наземен транспорт BG→GR INF-2026-016 (Biodex рехабилитация)',     category: 'Транспорт',   courier_id: 4, invoice_number: 'NT-2026-0304',  due_date: '2026-04-04', paid_date: null,         status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-017'], amount: 1960,  currency: 'EUR', amount_bgn: +(1960*rate).toFixed(2),  description: 'Въздушен транспорт US→BG INF-2026-017 (GE Vivid E95)',            category: 'Транспорт',   courier_id: 1, invoice_number: 'KN-2026-0306',  due_date: '2026-04-06', paid_date: null,         status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-018'], amount: 8358,  currency: 'EUR', amount_bgn: +(8358*rate).toFixed(2),  description: 'Транспорт DE→BG INF-2026-018 (Siemens SOMATOM go.Now)',           category: 'Транспорт',   courier_id: 2, invoice_number: 'CP-2026-0310',  due_date: '2026-04-10', paid_date: null,         status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-019'], amount: 438,   currency: 'EUR', amount_bgn: +(438*rate).toFixed(2),   description: 'Експресна доставка BG→GR INF-2026-019 (Medtronic Evoque)',        category: 'Транспорт',   courier_id: 5, invoice_number: 'PU-2026-0317',  due_date: '2026-04-17', paid_date: null,         status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: sid['INF-2026-020'], amount: 547,   currency: 'EUR', amount_bgn: +(547*rate).toFixed(2),   description: 'Транспорт AT→BG INF-2026-020 (Fresenius Kabi помпи x10)',         category: 'Транспорт',   courier_id: 2, invoice_number: 'CP-2026-0320',  due_date: '2026-04-20', paid_date: null,         status: 'pending', created_by: 5 },

  // Режийни разходи Q1 2026
  { type: 'expense', shipment_id: null, amount: 2400,  currency: 'BGN', amount_bgn: 2400,  description: 'Наем офис + склад Sofia Tech Park - Януари 2026',     category: 'Наем',        courier_id: null, invoice_number: null, due_date: '2026-01-31', paid_date: '2026-01-31', status: 'paid',    created_by: 5 },
  { type: 'expense', shipment_id: null, amount: 2400,  currency: 'BGN', amount_bgn: 2400,  description: 'Наем офис + склад Sofia Tech Park - Февруари 2026',    category: 'Наем',        courier_id: null, invoice_number: null, due_date: '2026-02-28', paid_date: '2026-02-28', status: 'paid',    created_by: 5 },
  { type: 'expense', shipment_id: null, amount: 2400,  currency: 'BGN', amount_bgn: 2400,  description: 'Наем офис + склад Sofia Tech Park - Март 2026',        category: 'Наем',        courier_id: null, invoice_number: null, due_date: '2026-03-31', paid_date: null,         status: 'pending', created_by: 5 },
  { type: 'expense', shipment_id: null, amount: 1850,  currency: 'BGN', amount_bgn: 1850,  description: 'Застраховка складово съдържание Q1 2026',              category: 'Застраховка', courier_id: null, invoice_number: null, due_date: '2026-01-15', paid_date: '2026-01-14', status: 'paid',    created_by: 5 },
  { type: 'expense', shipment_id: null, amount: 980,   currency: 'BGN', amount_bgn: 980,   description: 'Куриерски разходи и местни доставки - Януари 2026',    category: 'Разходи',     courier_id: null, invoice_number: null, due_date: '2026-01-31', paid_date: '2026-01-31', status: 'paid',    created_by: 5 },
  { type: 'expense', shipment_id: null, amount: 1240,  currency: 'BGN', amount_bgn: 1240,  description: 'Куриерски разходи и местни доставки - Февруари 2026',  category: 'Разходи',     courier_id: null, invoice_number: null, due_date: '2026-02-28', paid_date: '2026-02-28', status: 'paid',    created_by: 5 },
  { type: 'expense', shipment_id: null, amount: 760,   currency: 'BGN', amount_bgn: 760,   description: 'Куриерски разходи и местни доставки - Март 2026',      category: 'Разходи',     courier_id: null, invoice_number: null, due_date: '2026-03-31', paid_date: null,         status: 'pending', created_by: 5 },

  // Приходни фактури (продажби/услуги)
  { type: 'invoice', shipment_id: sid['INF-2026-001'], amount: 1850,  currency: 'EUR', amount_bgn: +(1850*rate).toFixed(2),  description: 'Логистична услуга + обмитяване INF-2026-001',  category: 'Приход', courier_id: null, invoice_number: 'INFI-2026-001', due_date: '2026-01-20', paid_date: '2026-01-18', status: 'paid', created_by: 2 },
  { type: 'invoice', shipment_id: sid['INF-2026-003'], amount: 420,   currency: 'EUR', amount_bgn: +(420*rate).toFixed(2),   description: 'Логистична услуга INF-2026-003',               category: 'Приход', courier_id: null, invoice_number: 'INFI-2026-003', due_date: '2026-01-20', paid_date: '2026-01-17', status: 'paid', created_by: 2 },
  { type: 'invoice', shipment_id: sid['INF-2026-004'], amount: 2200,  currency: 'EUR', amount_bgn: +(2200*rate).toFixed(2),  description: 'Логистична услуга + обмитяване INF-2026-004',  category: 'Приход', courier_id: null, invoice_number: 'INFI-2026-004', due_date: '2026-01-28', paid_date: '2026-01-25', status: 'paid', created_by: 2 },
  { type: 'invoice', shipment_id: sid['INF-2026-006'], amount: 380,   currency: 'EUR', amount_bgn: +(380*rate).toFixed(2),   description: 'Логистична услуга INF-2026-006',               category: 'Приход', courier_id: null, invoice_number: 'INFI-2026-006', due_date: '2026-01-28', paid_date: '2026-01-26', status: 'paid', created_by: 2 },
  { type: 'invoice', shipment_id: sid['INF-2026-007'], amount: 4500,  currency: 'EUR', amount_bgn: +(4500*rate).toFixed(2),  description: 'Логистична услуга + обмитяване INF-2026-007',  category: 'Приход', courier_id: null, invoice_number: 'INFI-2026-007', due_date: '2026-02-10', paid_date: '2026-02-08', status: 'paid', created_by: 2 },
  { type: 'invoice', shipment_id: sid['INF-2026-008'], amount: 2800,  currency: 'EUR', amount_bgn: +(2800*rate).toFixed(2),  description: 'Логистична услуга + обмитяване INF-2026-008',  category: 'Приход', courier_id: null, invoice_number: 'INFI-2026-008', due_date: '2026-02-20', paid_date: '2026-02-18', status: 'paid', created_by: 2 },
  { type: 'invoice', shipment_id: sid['INF-2026-009'], amount: 680,   currency: 'EUR', amount_bgn: +(680*rate).toFixed(2),   description: 'Логистична услуга INF-2026-009',               category: 'Приход', courier_id: null, invoice_number: 'INFI-2026-009', due_date: '2026-02-20', paid_date: '2026-02-19', status: 'paid', created_by: 2 },
  { type: 'invoice', shipment_id: sid['INF-2026-010'], amount: 320,   currency: 'EUR', amount_bgn: +(320*rate).toFixed(2),   description: 'Логистична услуга INF-2026-010',               category: 'Приход', courier_id: null, invoice_number: 'INFI-2026-010', due_date: '2026-02-20', paid_date: '2026-02-18', status: 'paid', created_by: 2 },
  { type: 'invoice', shipment_id: sid['INF-2026-013'], amount: 580,   currency: 'EUR', amount_bgn: +(580*rate).toFixed(2),   description: 'Логистична услуга BG→RO INF-2026-013',         category: 'Приход', courier_id: null, invoice_number: 'INFI-2026-013', due_date: '2026-03-01', paid_date: '2026-02-28', status: 'paid', created_by: 2 },
]

financialsData.forEach(f => {
  db.get('financial_records').push({ id: nextId('financial_records'), created_at: now(), ...f }).write()
})
console.log(`${financialsData.length} финансови записа вмъкнати`)

// ─── Обобщение ───────────────────────────────────────────────────────────────
const counts = {}
db.get('shipments').filter(s => s.tracking_number && s.tracking_number.startsWith('INF-2026-')).value()
  .forEach(s => { counts[s.status] = (counts[s.status] || 0) + 1 })

console.log('\nПратки по статус:')
Object.entries(counts).forEach(([status, n]) => console.log(`   ${status.padEnd(12)} -> ${n}`))
console.log('\nГотово! Базата данни е заредена с данни за Q1 2026.')
