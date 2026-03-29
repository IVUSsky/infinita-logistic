require('dotenv').config()
const bcrypt = require('bcryptjs')
const { db, nextId, now } = require('./db')

console.log('Зареждане на начални данни...')

// ─── Изчисти всички колекции ──────────────────────────────────────────────────
db.set('users', []).write()
db.set('couriers', []).write()
db.set('courier_rates', []).write()
db.set('hs_codes', []).write()
db.set('shipments', []).write()
db.set('tracking_events', []).write()
db.set('financial_records', []).write()

// ─── Потребители ──────────────────────────────────────────────────────────────
const usersData = [
  { username: 'admin',      email: 'admin@infinita.bg',       password: bcrypt.hashSync('Admin123!', 10),   role: 'admin',    first_name: 'Администратор', last_name: 'Системен',  department: 'IT',       phone: '+359 2 123 4567' },
  { username: 'manager',    email: 'manager@infinita.bg',     password: bcrypt.hashSync('Manager123!', 10), role: 'manager',  first_name: 'Иван',          last_name: 'Петров',    department: 'Логистика',phone: '+359 888 123 456' },
  { username: 'ivanova',    email: 'm.ivanova@infinita.bg',   password: bcrypt.hashSync('Pass123!', 10),    role: 'employee', first_name: 'Мария',         last_name: 'Иванова',   department: 'Митница',  phone: '+359 888 234 567' },
  { username: 'georgiev',   email: 'p.georgiev@infinita.bg',  password: bcrypt.hashSync('Pass123!', 10),    role: 'employee', first_name: 'Петър',         last_name: 'Георгиев',  department: 'Склад',    phone: '+359 888 345 678' },
  { username: 'dimitrova',  email: 's.dimitrova@infinita.bg', password: bcrypt.hashSync('Pass123!', 10),    role: 'employee', first_name: 'Стела',         last_name: 'Димитрова', department: 'Финанси',  phone: '+359 888 456 789' },
]
usersData.forEach(u => {
  db.get('users').push({ id: nextId('users'), active: 1, created_at: now(), last_login: null, ...u }).write()
})
console.log(`  ${usersData.length} потребители`)

// ─── Куриери ──────────────────────────────────────────────────────────────────
const couriersData = [
  { name: 'Kuehne+Nagel',   contact_name: 'Борис Николов',  email: 'bg.operations@kuehne-nagel.com', phone: '+359 2 960 2200', website: 'https://www.kuehne-nagel.com', notes: 'Основен партньор за въздушен и морски транспорт' },
  { name: 'Карго-Партнер',  contact_name: 'Анна Стоянова',  email: 'sofia@cargo-partner.com',        phone: '+359 2 400 4000', website: 'https://www.cargo-partner.com', notes: 'Специализиран в европейски наземен транспорт' },
  { name: 'Юнимастърс',     contact_name: 'Димитър Велков', email: 'logistics@unimasters.bg',        phone: '+359 2 461 6161', website: 'https://www.unimasters.bg',     notes: 'Местен партньор, добри условия за Гърция' },
  { name: 'НИК Транс',      contact_name: 'Николай Костов', email: 'office@niktrans.bg',             phone: '+359 52 600 100', website: 'https://www.niktrans.bg',       notes: 'Регионален превоз BG-GR' },
  { name: 'Plus Ultra',     contact_name: 'Христос Папас',  email: 'info@plusultra.gr',              phone: '+30 210 123 4567',website: 'https://www.plusultra.gr',      notes: 'Гръцки партньор за доставки в Гърция' },
]
couriersData.forEach(c => {
  db.get('couriers').push({ id: nextId('couriers'), active: 1, created_at: now(), ...c }).write()
})
console.log(`  ${couriersData.length} куриери`)

// ─── Тарифи ───────────────────────────────────────────────────────────────────
const ratesData = [
  // Kuehne+Nagel - въздух DE→BG
  { courier_id: 1, transport_type: 'air',     origin_country: 'DE', dest_country: 'BG', weight_from: 0,   weight_to: 50,   price_per_kg: 5.20, min_price: 45,  currency: 'EUR', transit_days: 2 },
  { courier_id: 1, transport_type: 'air',     origin_country: 'DE', dest_country: 'BG', weight_from: 50,  weight_to: 200,  price_per_kg: 4.80, min_price: 260, currency: 'EUR', transit_days: 2 },
  { courier_id: 1, transport_type: 'air',     origin_country: 'DE', dest_country: 'BG', weight_from: 200, weight_to: 9999, price_per_kg: 4.20, min_price: 840, currency: 'EUR', transit_days: 3 },
  // Kuehne+Nagel - море CN→BG
  { courier_id: 1, transport_type: 'sea',     origin_country: 'CN', dest_country: 'BG', weight_from: 0,   weight_to: 500,  price_per_kg: 1.80, min_price: 150, currency: 'EUR', transit_days: 25 },
  { courier_id: 1, transport_type: 'sea',     origin_country: 'CN', dest_country: 'BG', weight_from: 500, weight_to: 9999, price_per_kg: 1.50, min_price: 750, currency: 'EUR', transit_days: 25 },
  // Карго-Партнер - наземен DE→BG
  { courier_id: 2, transport_type: 'road',    origin_country: 'DE', dest_country: 'BG', weight_from: 0,   weight_to: 100,  price_per_kg: 3.10, min_price: 55,  currency: 'EUR', transit_days: 4 },
  { courier_id: 2, transport_type: 'road',    origin_country: 'DE', dest_country: 'BG', weight_from: 100, weight_to: 500,  price_per_kg: 2.80, min_price: 310, currency: 'EUR', transit_days: 4 },
  { courier_id: 2, transport_type: 'road',    origin_country: 'AT', dest_country: 'BG', weight_from: 0,   weight_to: 100,  price_per_kg: 3.30, min_price: 60,  currency: 'EUR', transit_days: 4 },
  // Юнимастърс - BG→GR
  { courier_id: 3, transport_type: 'road',    origin_country: 'BG', dest_country: 'GR', weight_from: 0,   weight_to: 50,   price_per_kg: 2.50, min_price: 30,  currency: 'EUR', transit_days: 2 },
  { courier_id: 3, transport_type: 'road',    origin_country: 'BG', dest_country: 'GR', weight_from: 50,  weight_to: 500,  price_per_kg: 2.20, min_price: 125, currency: 'EUR', transit_days: 2 },
  { courier_id: 3, transport_type: 'road',    origin_country: 'GR', dest_country: 'BG', weight_from: 0,   weight_to: 50,   price_per_kg: 2.50, min_price: 30,  currency: 'EUR', transit_days: 2 },
  // НИК Транс - BG→GR
  { courier_id: 4, transport_type: 'road',    origin_country: 'BG', dest_country: 'GR', weight_from: 0,   weight_to: 100,  price_per_kg: 2.30, min_price: 40,  currency: 'EUR', transit_days: 3 },
  { courier_id: 4, transport_type: 'road',    origin_country: 'BG', dest_country: 'GR', weight_from: 100, weight_to: 9999, price_per_kg: 1.90, min_price: 230, currency: 'EUR', transit_days: 3 },
  // Plus Ultra - GR local express
  { courier_id: 5, transport_type: 'express', origin_country: 'GR', dest_country: 'GR', weight_from: 0,   weight_to: 30,   price_per_kg: 6.50, min_price: 20,  currency: 'EUR', transit_days: 1 },
  { courier_id: 5, transport_type: 'road',    origin_country: 'GR', dest_country: 'BG', weight_from: 0,   weight_to: 200,  price_per_kg: 2.80, min_price: 80,  currency: 'EUR', transit_days: 2 },
]
ratesData.forEach(r => {
  db.get('courier_rates').push({ id: nextId('courier_rates'), updated_at: now(), ...r }).write()
})
console.log(`  ${ratesData.length} тарифи`)

// ─── HS Кодове ────────────────────────────────────────────────────────────────
const hsCodesData = [
  { code: '9018.11', description_bg: 'Електрокардиографи',                             description_en: 'Electrocardiographs',                              category: 'Диагностика',       duty_rate: 0,   vat_rate: 20, notes: 'Освободено от мито за ЕС' },
  { code: '9018.12', description_bg: 'Апарати за ехография (ултразвук)',                description_en: 'Ultrasonic scanning apparatus',                    category: 'Диагностика',       duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9018.13', description_bg: 'Апарати за ядрено-магнитен резонанс',             description_en: 'Magnetic resonance imaging apparatus',             category: 'Диагностика',       duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9018.14', description_bg: 'Сцинтиграфски апарати',                          description_en: 'Scintigraphic apparatus',                          category: 'Диагностика',       duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9018.19', description_bg: 'Електродиагностична апаратура, друга',            description_en: 'Other electrodiagnostic apparatus',                category: 'Диагностика',       duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9018.20', description_bg: 'Апарати за ултравиолетово и инфрачервено лъчение',description_en: 'UV/IR ray apparatus',                             category: 'Терапия',           duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9018.31', description_bg: 'Спринцовки за медицински цели',                   description_en: 'Syringes for medical use',                         category: 'Консумативи',       duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9018.32', description_bg: 'Тубулярни метални игли и игли за шев',            description_en: 'Tubular metal needles and needles for sutures',    category: 'Консумативи',       duty_rate: 2.7, vat_rate: 20, notes: '' },
  { code: '9018.39', description_bg: 'Катетри, канюли и подобни инструменти',           description_en: 'Catheters, cannulae and similar',                  category: 'Консумативи',       duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9018.41', description_bg: 'Стоматологически свредла',                        description_en: 'Dental drill engines',                             category: 'Стоматология',      duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9018.49', description_bg: 'Стоматологически инструменти, НДК',               description_en: 'Other dental instruments',                         category: 'Стоматология',      duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9018.50', description_bg: 'Офталмологични инструменти и апарати',            description_en: 'Ophthalmic instruments and appliances',             category: 'Офталмология',      duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9018.90', description_bg: 'Медицински инструменти и апарати, НДК',           description_en: 'Other medical instruments',                        category: 'Общо',              duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9019.10', description_bg: 'Апарати за механотерапия и масажни апарати',      description_en: 'Mechano-therapy appliances and massage apparatus',  category: 'Физиотерапия',      duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9019.20', description_bg: 'Апарати за озонотерапия, кислородотерапия',       description_en: 'Ozone/oxygen therapy apparatus',                   category: 'Терапия',           duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9020.00', description_bg: 'Дихателни апарати',                               description_en: 'Breathing appliances',                             category: 'Интензивно лечение',duty_rate: 0,   vat_rate: 20, notes: 'Включва вентилатори' },
  { code: '9021.10', description_bg: 'Ортопедични или хирургически ставни протези',     description_en: 'Orthopaedic appliances',                           category: 'Протезиране',       duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9021.21', description_bg: 'Изкуствени зъби',                                 description_en: 'Artificial teeth',                                 category: 'Стоматология',      duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9021.29', description_bg: 'Зъбни протези, НДК',                              description_en: 'Other dental fittings',                            category: 'Стоматология',      duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9021.31', description_bg: 'Изкуствени стави',                                description_en: 'Artificial joints',                                category: 'Ортопедия',         duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9021.39', description_bg: 'Ортопедични протези, НДК',                        description_en: 'Other orthopaedic prostheses',                     category: 'Ортопедия',         duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9021.40', description_bg: 'Апарати за слуха (слухови апарати)',               description_en: 'Hearing aids',                                     category: 'Слух',              duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9021.50', description_bg: 'Стимулатори за сърце',                             description_en: 'Cardiac-stimulation apparatus',                    category: 'Кардиология',       duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9021.90', description_bg: 'Медицински, хирургически или ветеринарни апарати НДК', description_en: 'Other medical/surgical/veterinary apparatus',  category: 'Общо',              duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9022.11', description_bg: 'Томографски апарати (CT скенери)',                 description_en: 'Computerized tomography apparatus',                category: 'Образна диагностика',duty_rate: 0,  vat_rate: 20, notes: '' },
  { code: '9022.12', description_bg: 'Апарати за рентгенова диагностика',               description_en: 'Diagnostic X-ray apparatus',                       category: 'Образна диагностика',duty_rate: 0,  vat_rate: 20, notes: 'Изисква разрешение' },
  { code: '9022.13', description_bg: 'Рентгенови апарати за стоматология',              description_en: 'Dental X-ray apparatus',                           category: 'Стоматология',      duty_rate: 0,   vat_rate: 20, notes: '' },
  { code: '9022.14', description_bg: 'Рентгенови апарати за скрининг на багаж',         description_en: 'X-ray apparatus for baggage inspection',            category: 'Сигурност',         duty_rate: 2.2, vat_rate: 20, notes: '' },
  { code: '9022.19', description_bg: 'Рентгенови апарати, НДК',                         description_en: 'Other X-ray apparatus',                            category: 'Образна диагностика',duty_rate: 0,  vat_rate: 20, notes: '' },
  { code: '9027.80', description_bg: 'Лабораторни анализатори',                         description_en: 'Laboratory analysers',                             category: 'Лаборатория',       duty_rate: 0,   vat_rate: 20, notes: '' },
]
hsCodesData.forEach(h => {
  db.get('hs_codes').push({ id: nextId('hs_codes'), created_at: now(), ...h }).write()
})
console.log(`  ${hsCodesData.length} HS кода`)

// ─── Примерни пратки ──────────────────────────────────────────────────────────
const shipmentsData = [
  { tracking_number: 'INF-2024-001', status: 'delivered',  direction: 'import', origin_country: 'DE', origin_city: 'Hamburg',   dest_country: 'BG', dest_city: 'София',   sender_name: 'Siemens Healthineers GmbH',    recipient_name: 'Инфинита ООД', courier_id: 1, transport_type: 'air',  weight_kg: 45.5, packages_count: 2, hs_code: '9018.12', description: 'Ултразвуков апарат ACUSON S2000',    declared_value: 28500, currency: 'EUR', freight_cost: 235,  customs_duty: 0, total_cost: 235,  invoice_number: 'INV-2024-001', estimated_delivery: '2024-01-15', created_by: 2, assigned_to: 3 },
  { tracking_number: 'INF-2024-002', status: 'in_transit', direction: 'import', origin_country: 'CN', origin_city: 'Shanghai',  dest_country: 'BG', dest_city: 'София',   sender_name: 'Mindray Medical International', recipient_name: 'Инфинита ООД', courier_id: 1, transport_type: 'sea', weight_kg: 312,  packages_count: 5, hs_code: '9018.19', description: 'Пациент монитор BS-15',             declared_value: 42000, currency: 'EUR', freight_cost: 468,  customs_duty: 0, total_cost: 468,  invoice_number: 'INV-2024-002', estimated_delivery: '2024-03-20', created_by: 2, assigned_to: 4 },
  { tracking_number: 'INF-2024-003', status: 'customs',    direction: 'import', origin_country: 'DE', origin_city: 'Frankfurt', dest_country: 'BG', dest_city: 'Пловдив', sender_name: 'Dräger Medical GmbH',          recipient_name: 'УМБАЛ Пловдив', courier_id: 2, transport_type: 'road',weight_kg: 185,  packages_count: 3, hs_code: '9020.00', description: 'Вентилатор Evita Infinity V500',     declared_value: 35000, currency: 'EUR', freight_cost: 574,  customs_duty: 0, total_cost: 574,  invoice_number: 'INV-2024-003', estimated_delivery: '2024-03-18', created_by: 2, assigned_to: 3 },
  { tracking_number: 'INF-2024-004', status: 'delivered',  direction: 'export', origin_country: 'BG', origin_city: 'София',    dest_country: 'GR', dest_city: 'Атина',   sender_name: 'Инфинита ООД',                 recipient_name: 'Iatrika Hellas SA', courier_id: 3, transport_type: 'road',weight_kg: 22.3, packages_count: 1, hs_code: '9021.50', description: 'Кардиостимулатор Medtronic Micra',   declared_value: 15800, currency: 'EUR', freight_cost: 55,   customs_duty: 0, total_cost: 55,   invoice_number: 'INV-2024-004', estimated_delivery: '2024-02-10', created_by: 2, assigned_to: 3 },
  { tracking_number: 'INF-2024-005', status: 'confirmed',  direction: 'import', origin_country: 'AT', origin_city: 'Vienna',   dest_country: 'BG', dest_city: 'Варна',   sender_name: 'Fresenius Medical Care',       recipient_name: 'МБАЛ Варна', courier_id: 2, transport_type: 'road',weight_kg: 156,  packages_count: 4, hs_code: '9018.90', description: 'Диализни апарати 5008S x4',          declared_value: 64000, currency: 'EUR', freight_cost: 515,  customs_duty: 0, total_cost: 515,  invoice_number: 'INV-2024-005', estimated_delivery: '2024-04-02', created_by: 2, assigned_to: 4 },
  { tracking_number: 'INF-2024-006', status: 'pending',    direction: 'import', origin_country: 'JP', origin_city: 'Tokyo',    dest_country: 'BG', dest_city: 'София',   sender_name: 'Canon Medical Systems',        recipient_name: 'Инфинита ООД', courier_id: 1, transport_type: 'air', weight_kg: 890,  packages_count: 8, hs_code: '9022.11', description: 'CT скенер Aquilion ONE',              declared_value: 285000,currency: 'EUR', freight_cost: 4628, customs_duty: 0, total_cost: 4628, invoice_number: 'INV-2024-006', estimated_delivery: '2024-04-15', created_by: 2, assigned_to: 3 },
  { tracking_number: 'INF-2024-007', status: 'delivered',  direction: 'export', origin_country: 'BG', origin_city: 'Варна',    dest_country: 'GR', dest_city: 'Солун',   sender_name: 'Инфинита ООД',                 recipient_name: 'Medical Hellas', courier_id: 4, transport_type: 'road',weight_kg: 34,   packages_count: 2, hs_code: '9019.10', description: 'Рехабилитационно оборудване',         declared_value: 8200,  currency: 'EUR', freight_cost: 78,   customs_duty: 0, total_cost: 78,   invoice_number: 'INV-2024-007', estimated_delivery: '2024-02-28', created_by: 2, assigned_to: 4 },
  { tracking_number: 'INF-2024-008', status: 'in_transit', direction: 'import', origin_country: 'US', origin_city: 'Boston',   dest_country: 'BG', dest_city: 'София',   sender_name: 'GE Healthcare',                recipient_name: 'Инфинита ООД', courier_id: 1, transport_type: 'air', weight_kg: 524,  packages_count: 6, hs_code: '9022.12', description: 'Рентгенов апарат Optima XR646',       declared_value: 92000, currency: 'EUR', freight_cost: 2724, customs_duty: 0, total_cost: 2724, invoice_number: 'INV-2024-008', estimated_delivery: '2024-03-25', created_by: 2, assigned_to: 3 },
]
shipmentsData.forEach(s => {
  const createdAt = now()
  db.get('shipments').push({ id: nextId('shipments'), created_at: createdAt, updated_at: createdAt, actual_delivery: null, ...s }).write()
})
console.log(`  ${shipmentsData.length} пратки`)

// ─── Tracking Events ──────────────────────────────────────────────────────────
const eventsData = [
  { shipment_id: 2, status: 'confirmed',  location: 'Shanghai, CN',   description: 'Пратката е приета от куриера',             timestamp: '2024-02-20 09:00:00' },
  { shipment_id: 2, status: 'in_transit', location: 'Shanghai Port',  description: 'Натоварена на кораб MSC Fantasia',         timestamp: '2024-02-22 14:30:00' },
  { shipment_id: 2, status: 'in_transit', location: 'Singapore',      description: 'Транзит през пристанище Сингапур',         timestamp: '2024-03-01 08:00:00' },
  { shipment_id: 2, status: 'in_transit', location: 'Suez Canal',     description: 'Преминаване на Суецкия канал',             timestamp: '2024-03-08 12:00:00' },
  { shipment_id: 3, status: 'confirmed',  location: 'Frankfurt, DE',  description: 'Пратката е приета',                       timestamp: '2024-03-14 10:00:00' },
  { shipment_id: 3, status: 'in_transit', location: 'Munich, DE',     description: 'На път към България',                     timestamp: '2024-03-15 16:00:00' },
  { shipment_id: 3, status: 'customs',    location: 'София, BG',      description: 'Задържана за митнически контрол',         timestamp: '2024-03-16 11:30:00' },
  { shipment_id: 6, status: 'pending',    location: 'Tokyo, JP',      description: 'Поръчката е потвърдена',                  timestamp: '2024-03-20 08:00:00' },
  { shipment_id: 8, status: 'confirmed',  location: 'Boston, US',     description: 'Приета от GE Healthcare',                 timestamp: '2024-03-18 15:00:00' },
  { shipment_id: 8, status: 'in_transit', location: 'JFK Airport',    description: 'Заминала с рейс AA 100',                  timestamp: '2024-03-19 22:00:00' },
  { shipment_id: 8, status: 'in_transit', location: 'Frankfurt, DE',  description: 'Транзит FRA',                             timestamp: '2024-03-20 14:00:00' },
]
eventsData.forEach(e => {
  db.get('tracking_events').push({ id: nextId('tracking_events'), created_by: null, ...e }).write()
})
console.log(`  ${eventsData.length} tracking events`)

// ─── Финансови записи ─────────────────────────────────────────────────────────
const financialsData = [
  { type: 'invoice', shipment_id: 1, amount: 235,  currency: 'EUR', amount_bgn: 459.6,  description: 'Транспорт INF-2024-001',  category: 'Транспорт', courier_id: 1, invoice_number: 'KN-2024-0115', due_date: '2024-02-15', paid_date: null, status: 'paid',    created_by: 5 },
  { type: 'invoice', shipment_id: 2, amount: 468,  currency: 'EUR', amount_bgn: 915.4,  description: 'Транспорт INF-2024-002',  category: 'Транспорт', courier_id: 1, invoice_number: 'KN-2024-0220', due_date: '2024-03-20', paid_date: null, status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: 3, amount: 574,  currency: 'EUR', amount_bgn: 1122.7, description: 'Транспорт INF-2024-003',  category: 'Транспорт', courier_id: 2, invoice_number: 'CP-2024-0314', due_date: '2024-04-14', paid_date: null, status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: 4, amount: 55,   currency: 'EUR', amount_bgn: 107.6,  description: 'Транспорт INF-2024-004',  category: 'Транспорт', courier_id: 3, invoice_number: 'UM-2024-0210', due_date: '2024-03-10', paid_date: null, status: 'paid',    created_by: 5 },
  { type: 'invoice', shipment_id: 5, amount: 515,  currency: 'EUR', amount_bgn: 1007.4, description: 'Транспорт INF-2024-005',  category: 'Транспорт', courier_id: 2, invoice_number: 'CP-2024-0402', due_date: '2024-05-02', paid_date: null, status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: 6, amount: 4628, 'currency': 'EUR', amount_bgn: 9048.7, description: 'Транспорт INF-2024-006', category: 'Транспорт', courier_id: 1, invoice_number: 'KN-2024-0415', due_date: '2024-05-15', paid_date: null, status: 'pending', created_by: 5 },
  { type: 'invoice', shipment_id: 7, amount: 78,   currency: 'EUR', amount_bgn: 152.6,  description: 'Транспорт INF-2024-007',  category: 'Транспорт', courier_id: 4, invoice_number: 'NT-2024-0228', due_date: '2024-03-28', paid_date: null, status: 'paid',    created_by: 5 },
  { type: 'invoice', shipment_id: 8, amount: 2724, currency: 'EUR', amount_bgn: 5325.0, description: 'Транспорт INF-2024-008',  category: 'Транспорт', courier_id: 1, invoice_number: 'KN-2024-0325', due_date: '2024-04-25', paid_date: null, status: 'pending', created_by: 5 },
  { type: 'expense', shipment_id: null, amount: 1200, currency: 'BGN', amount_bgn: 1200, description: 'Застраховка склад - Q1 2024', category: 'Застраховка', courier_id: null, invoice_number: null, due_date: '2024-01-31', paid_date: null, status: 'paid', created_by: 5 },
  { type: 'expense', shipment_id: null, amount: 850,  currency: 'BGN', amount_bgn: 850,  description: 'Наем офис склад март',       category: 'Наем',       courier_id: null, invoice_number: null, due_date: '2024-03-31', paid_date: null, status: 'paid', created_by: 5 },
]
financialsData.forEach(f => {
  db.get('financial_records').push({ id: nextId('financial_records'), created_at: now(), ...f }).write()
})
console.log(`  ${financialsData.length} финансови записа`)

console.log('\nБаза данни готова!')
console.log('\nПотребители за вход:')
console.log('  admin / Admin123!   (Администратор)')
console.log('  manager / Manager123!  (Мениджър)')
console.log('  ivanova / Pass123!  (Служител)')
