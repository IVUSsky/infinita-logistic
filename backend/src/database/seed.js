require('dotenv').config()
const bcrypt = require('bcryptjs')
const db = require('./db')

console.log('🌱 Зареждане на начални данни...')

// ─── Потребители ──────────────────────────────────────────────────────────────
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, email, password, role, first_name, last_name, department, phone)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

const users = [
  ['admin', 'admin@infinita.bg', bcrypt.hashSync('Admin123!', 10), 'admin', 'Администратор', 'Системен', 'IT', '+359 2 123 4567'],
  ['manager', 'manager@infinita.bg', bcrypt.hashSync('Manager123!', 10), 'manager', 'Иван', 'Петров', 'Логистика', '+359 888 123 456'],
  ['ivanova', 'm.ivanova@infinita.bg', bcrypt.hashSync('Pass123!', 10), 'employee', 'Мария', 'Иванова', 'Митница', '+359 888 234 567'],
  ['georgiev', 'p.georgiev@infinita.bg', bcrypt.hashSync('Pass123!', 10), 'employee', 'Петър', 'Георгиев', 'Склад', '+359 888 345 678'],
  ['dimitrova', 's.dimitrova@infinita.bg', bcrypt.hashSync('Pass123!', 10), 'employee', 'Стела', 'Димитрова', 'Финанси', '+359 888 456 789'],
]
users.forEach(u => insertUser.run(...u))
console.log(`  ✓ ${users.length} потребители`)

// ─── Куриери ──────────────────────────────────────────────────────────────────
const insertCourier = db.prepare(`
  INSERT OR IGNORE INTO couriers (name, contact_name, email, phone, website, notes)
  VALUES (?, ?, ?, ?, ?, ?)
`)

const couriers = [
  ['Kuehne+Nagel', 'Борис Николов', 'bg.operations@kuehne-nagel.com', '+359 2 960 2200', 'https://www.kuehne-nagel.com', 'Основен партньор за въздушен и морски транспорт'],
  ['Карго-Партнер', 'Анна Стоянова', 'sofia@cargo-partner.com', '+359 2 400 4000', 'https://www.cargo-partner.com', 'Специализиран в европейски наземен транспорт'],
  ['Юнимастърс', 'Димитър Велков', 'logistics@unimasters.bg', '+359 2 461 6161', 'https://www.unimasters.bg', 'Местен партньор, добри условия за Гърция'],
  ['НИК Транс', 'Николай Костов', 'office@niktrans.bg', '+359 52 600 100', 'https://www.niktrans.bg', 'Регионален превоз BG-GR'],
  ['Plus Ultra', 'Христос Папас', 'info@plusultra.gr', '+30 210 123 4567', 'https://www.plusultra.gr', 'Гръцки партньор за доставки в Гърция'],
]
couriers.forEach(c => insertCourier.run(...c))
console.log(`  ✓ ${couriers.length} куриери`)

// ─── Тарифи ───────────────────────────────────────────────────────────────────
const insertRate = db.prepare(`
  INSERT OR IGNORE INTO courier_rates (courier_id, transport_type, origin_country, dest_country, weight_from, weight_to, price_per_kg, min_price, currency, transit_days)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const rates = [
  // Kuehne+Nagel - въздух DE→BG
  [1, 'air',  'DE', 'BG', 0,   50,   5.20, 45,  'EUR', 2],
  [1, 'air',  'DE', 'BG', 50,  200,  4.80, 260, 'EUR', 2],
  [1, 'air',  'DE', 'BG', 200, 9999, 4.20, 840, 'EUR', 3],
  // Kuehne+Nagel - море CN→BG
  [1, 'sea',  'CN', 'BG', 0,   500,  1.80, 150, 'EUR', 25],
  [1, 'sea',  'CN', 'BG', 500, 9999, 1.50, 750, 'EUR', 25],
  // Карго-Партнер - наземен DE→BG
  [2, 'road', 'DE', 'BG', 0,   100,  3.10, 55,  'EUR', 4],
  [2, 'road', 'DE', 'BG', 100, 500,  2.80, 310, 'EUR', 4],
  [2, 'road', 'AT', 'BG', 0,   100,  3.30, 60,  'EUR', 4],
  // Юнимастърс - BG→GR
  [3, 'road', 'BG', 'GR', 0,   50,   2.50, 30,  'EUR', 2],
  [3, 'road', 'BG', 'GR', 50,  500,  2.20, 125, 'EUR', 2],
  [3, 'road', 'GR', 'BG', 0,   50,   2.50, 30,  'EUR', 2],
  // НИК Транс - BG→GR
  [4, 'road', 'BG', 'GR', 0,   100,  2.30, 40,  'EUR', 3],
  [4, 'road', 'BG', 'GR', 100, 9999, 1.90, 230, 'EUR', 3],
  // Plus Ultra - GR local express
  [5, 'express', 'GR', 'GR', 0, 30,  6.50, 20, 'EUR', 1],
  [5, 'road', 'GR', 'BG', 0,   200,  2.80, 80, 'EUR', 2],
]
rates.forEach(r => insertRate.run(...r))
console.log(`  ✓ ${rates.length} тарифи`)

// ─── HS Кодове за медицинска апаратура ────────────────────────────────────────
const insertHs = db.prepare(`
  INSERT OR IGNORE INTO hs_codes (code, description_bg, description_en, category, duty_rate, vat_rate, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const hsCodes = [
  ['9018.11', 'Електрокардиографи', 'Electrocardiographs', 'Диагностика', 0, 20, 'Освободено от мито за ЕС'],
  ['9018.12', 'Апарати за ехография (ултразвук)', 'Ultrasonic scanning apparatus', 'Диагностика', 0, 20, ''],
  ['9018.13', 'Апарати за ядрено-магнитен резонанс', 'Magnetic resonance imaging apparatus', 'Диагностика', 0, 20, ''],
  ['9018.14', 'Сцинтиграфски апарати', 'Scintigraphic apparatus', 'Диагностика', 0, 20, ''],
  ['9018.19', 'Електродиагностична апаратура, друга', 'Other electrodiagnostic apparatus', 'Диагностика', 0, 20, ''],
  ['9018.20', 'Апарати за ултравиолетово и инфрачервено лъчение', 'UV/IR ray apparatus', 'Терапия', 0, 20, ''],
  ['9018.31', 'Спринцовки за медицински цели', 'Syringes for medical use', 'Консумативи', 0, 20, ''],
  ['9018.32', 'Тубулярни метални игли и игли за шев', 'Tubular metal needles and needles for sutures', 'Консумативи', 2.7, 20, ''],
  ['9018.39', 'Катетри, канюли и подобни инструменти', 'Catheters, cannulae and similar', 'Консумативи', 0, 20, ''],
  ['9018.41', 'Стоматологически свредла', 'Dental drill engines', 'Стоматология', 0, 20, ''],
  ['9018.49', 'Стоматологически инструменти, НДК', 'Other dental instruments', 'Стоматология', 0, 20, ''],
  ['9018.50', 'Офталмологични инструменти и апарати', 'Ophthalmic instruments and appliances', 'Офталмология', 0, 20, ''],
  ['9018.90', 'Медицински инструменти и апарати, НДК', 'Other medical instruments', 'Общо', 0, 20, ''],
  ['9019.10', 'Апарати за механотерапия и масажни апарати', 'Mechano-therapy appliances and massage apparatus', 'Физиотерапия', 0, 20, ''],
  ['9019.20', 'Апарати за озонотерапия, кислородотерапия', 'Ozone/oxygen therapy apparatus', 'Терапия', 0, 20, ''],
  ['9020.00', 'Дихателни апарати', 'Breathing appliances', 'Интензивно лечение', 0, 20, 'Включва вентилатори'],
  ['9021.10', 'Ортопедични или хирургически ставни протези', 'Orthopaedic appliances', 'Протезиране', 0, 20, ''],
  ['9021.21', 'Изкуствени зъби', 'Artificial teeth', 'Стоматология', 0, 20, ''],
  ['9021.29', 'Зъбни протези, НДК', 'Other dental fittings', 'Стоматология', 0, 20, ''],
  ['9021.31', 'Изкуствени стави', 'Artificial joints', 'Ортопедия', 0, 20, ''],
  ['9021.39', 'Ортопедични протези, НДК', 'Other orthopaedic prostheses', 'Ортопедия', 0, 20, ''],
  ['9021.40', 'Апарати за слуха (слухови апарати)', 'Hearing aids', 'Слух', 0, 20, ''],
  ['9021.50', 'Стимулатори за сърце', 'Cardiac-stimulation apparatus', 'Кардиология', 0, 20, ''],
  ['9021.90', 'Медицински, хирургически или ветеринарни апарати НДК', 'Other medical/surgical/veterinary apparatus', 'Общо', 0, 20, ''],
  ['9022.11', 'Томографски апарати (CT скенери)', 'Computerized tomography apparatus', 'Образна диагностика', 0, 20, ''],
  ['9022.12', 'Апарати за рентгенова диагностика', 'Diagnostic X-ray apparatus', 'Образна диагностика', 0, 20, 'Изисква разрешение'],
  ['9022.13', 'Рентгенови апарати за стоматология', 'Dental X-ray apparatus', 'Стоматология', 0, 20, ''],
  ['9022.14', 'Рентгенови апарати за скрининг на багаж', 'X-ray apparatus for baggage inspection', 'Сигурност', 2.2, 20, ''],
  ['9022.19', 'Рентгенови апарати, НДК', 'Other X-ray apparatus', 'Образна диагностика', 0, 20, ''],
  ['9027.80', 'Лабораторни анализатори', 'Laboratory analysers', 'Лаборатория', 0, 20, ''],
]
hsCodes.forEach(h => insertHs.run(...h))
console.log(`  ✓ ${hsCodes.length} HS кода`)

// ─── Примерни пратки ──────────────────────────────────────────────────────────
const insertShipment = db.prepare(`
  INSERT OR IGNORE INTO shipments (
    tracking_number, status, direction, origin_country, origin_city,
    dest_country, dest_city, sender_name, recipient_name, courier_id,
    transport_type, weight_kg, packages_count, hs_code, description,
    declared_value, currency, freight_cost, customs_duty, total_cost,
    invoice_number, estimated_delivery, created_by, assigned_to
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const shipments = [
  ['INF-2024-001', 'delivered', 'import', 'DE', 'Hamburg', 'BG', 'София', 'Siemens Healthineers GmbH', 'Инфинита ООД', 1, 'air', 45.5, 2, '9018.12', 'Ултразвуков апарат ACUSON S2000', 28500, 'EUR', 235, 0, 235, 'INV-2024-001', '2024-01-15', 2, 3],
  ['INF-2024-002', 'in_transit', 'import', 'CN', 'Shanghai', 'BG', 'София', 'Mindray Medical International', 'Инфинита ООД', 1, 'sea', 312, 5, '9018.19', 'Пациент монитор BS-15', 42000, 'EUR', 468, 0, 468, 'INV-2024-002', '2024-03-20', 2, 4],
  ['INF-2024-003', 'customs', 'import', 'DE', 'Frankfurt', 'BG', 'Пловдив', 'Dräger Medical GmbH', 'УМБАЛ Пловдив', 2, 'road', 185, 3, '9020.00', 'Вентилатор Evita Infinity V500', 35000, 'EUR', 574, 0, 574, 'INV-2024-003', '2024-03-18', 2, 3],
  ['INF-2024-004', 'delivered', 'export', 'BG', 'София', 'GR', 'Атина', 'Инфинита ООД', 'Iatrika Hellas SA', 3, 'road', 22.3, 1, '9021.50', 'Кардиостимулатор Medtronic Micra', 15800, 'EUR', 55, 0, 55, 'INV-2024-004', '2024-02-10', 2, 3],
  ['INF-2024-005', 'confirmed', 'import', 'AT', 'Vienna', 'BG', 'Варна', 'Fresenius Medical Care', 'МБАЛ Варна', 2, 'road', 156, 4, '9018.90', 'Диализни апарати 5008S x4', 64000, 'EUR', 515, 0, 515, 'INV-2024-005', '2024-04-02', 2, 4],
  ['INF-2024-006', 'pending', 'import', 'JP', 'Tokyo', 'BG', 'София', 'Canon Medical Systems', 'Инфинита ООД', 1, 'air', 890, 8, '9022.11', 'CT скенер Aquilion ONE', 285000, 'EUR', 4628, 0, 4628, 'INV-2024-006', '2024-04-15', 2, 3],
  ['INF-2024-007', 'delivered', 'export', 'BG', 'Варна', 'GR', 'Солун', 'Инфинита ООД', 'Medical Hellas', 4, 'road', 34, 2, '9019.10', 'Рехабилитационно оборудване', 8200, 'EUR', 78, 0, 78, 'INV-2024-007', '2024-02-28', 2, 4],
  ['INF-2024-008', 'in_transit', 'import', 'US', 'Boston', 'BG', 'София', 'GE Healthcare', 'Инфинита ООД', 1, 'air', 524, 6, '9022.12', 'Рентгенов апарат Optima XR646', 92000, 'EUR', 2724, 0, 2724, 'INV-2024-008', '2024-03-25', 2, 3],
]
shipments.forEach(s => insertShipment.run(...s))
console.log(`  ✓ ${shipments.length} пратки`)

// ─── Tracking Events ──────────────────────────────────────────────────────────
const insertEvent = db.prepare(`
  INSERT INTO tracking_events (shipment_id, status, location, description, timestamp)
  VALUES (?, ?, ?, ?, ?)
`)

const events = [
  [2, 'confirmed',  'Shanghai, CN',   'Пратката е приета от куриера', '2024-02-20 09:00:00'],
  [2, 'in_transit', 'Shanghai Port',  'Натоварена на кораб MSC Fantasia', '2024-02-22 14:30:00'],
  [2, 'in_transit', 'Singapore',      'Транзит през пристанище Сингапур', '2024-03-01 08:00:00'],
  [2, 'in_transit', 'Suez Canal',     'Преминаване на Суецкия канал', '2024-03-08 12:00:00'],
  [3, 'confirmed',  'Frankfurt, DE',  'Пратката е приета', '2024-03-14 10:00:00'],
  [3, 'in_transit', 'Munich, DE',     'На път към България', '2024-03-15 16:00:00'],
  [3, 'customs',    'София, BG',      'Задържана за митнически контрол', '2024-03-16 11:30:00'],
  [6, 'pending',    'Tokyo, JP',      'Поръчката е потвърдена', '2024-03-20 08:00:00'],
  [8, 'confirmed',  'Boston, US',     'Приета от GE Healthcare', '2024-03-18 15:00:00'],
  [8, 'in_transit', 'JFK Airport',    'Заминала с рейс AA 100', '2024-03-19 22:00:00'],
  [8, 'in_transit', 'Frankfurt, DE',  'Транзит FRA', '2024-03-20 14:00:00'],
]
events.forEach(e => insertEvent.run(...e))
console.log(`  ✓ ${events.length} tracking events`)

// ─── Финансови записи ─────────────────────────────────────────────────────────
const insertFinancial = db.prepare(`
  INSERT INTO financial_records (type, shipment_id, amount, currency, amount_bgn, description, category, courier_id, invoice_number, due_date, status, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const financials = [
  ['invoice', 1, 235,  'EUR', 459.6,  'Транспорт INF-2024-001',  'Транспорт', 1, 'KN-2024-0115', '2024-02-15', 'paid', 5],
  ['invoice', 2, 468,  'EUR', 915.4,  'Транспорт INF-2024-002',  'Транспорт', 1, 'KN-2024-0220', '2024-03-20', 'pending', 5],
  ['invoice', 3, 574,  'EUR', 1122.7, 'Транспорт INF-2024-003',  'Транспорт', 2, 'CP-2024-0314', '2024-04-14', 'pending', 5],
  ['invoice', 4, 55,   'EUR', 107.6,  'Транспорт INF-2024-004',  'Транспорт', 3, 'UM-2024-0210', '2024-03-10', 'paid', 5],
  ['invoice', 5, 515,  'EUR', 1007.4, 'Транспорт INF-2024-005',  'Транспорт', 2, 'CP-2024-0402', '2024-05-02', 'pending', 5],
  ['invoice', 6, 4628, 'EUR', 9048.7, 'Транспорт INF-2024-006',  'Транспорт', 1, 'KN-2024-0415', '2024-05-15', 'pending', 5],
  ['invoice', 7, 78,   'EUR', 152.6,  'Транспорт INF-2024-007',  'Транспорт', 4, 'NT-2024-0228', '2024-03-28', 'paid', 5],
  ['invoice', 8, 2724, 'EUR', 5325.0, 'Транспорт INF-2024-008',  'Транспорт', 1, 'KN-2024-0325', '2024-04-25', 'pending', 5],
  ['expense', null, 1200, 'BGN', 1200, 'Застраховка склад - Q1 2024', 'Застраховка', null, null, '2024-01-31', 'paid', 5],
  ['expense', null, 850,  'BGN', 850,  'Наем офис склад март',        'Наем',       null, null, '2024-03-31', 'paid', 5],
]
financials.forEach(f => insertFinancial.run(...f))
console.log(`  ✓ ${financials.length} финансови записа`)

console.log('\n✅ База данни готова!')
console.log('\nПотребители за вход:')
console.log('  admin / Admin123!   (Администратор)')
console.log('  manager / Manager123!  (Мениджър)')
console.log('  ivanova / Pass123!  (Служител)')
