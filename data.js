// ===== נתונים: קטלוג צמחים, ערים ומשתמשי הדגמה =====
// אפשר לערוך את הקובץ הזה כדי להוסיף צמחים, ערים או משתמשים לדוגמה.

const CITIES = [
  { n: 'כפר סבא', lat: 32.175, lng: 34.907 },
  { n: 'רעננה', lat: 32.184, lng: 34.871 },
  { n: 'הוד השרון', lat: 32.150, lng: 34.888 },
  { n: 'הרצליה', lat: 32.166, lng: 34.843 },
  { n: 'תל אביב', lat: 32.085, lng: 34.781 },
  { n: 'רמת גן', lat: 32.068, lng: 34.824 },
  { n: 'פתח תקווה', lat: 32.087, lng: 34.887 },
  { n: 'נתניה', lat: 32.321, lng: 34.853 },
  { n: 'ראשון לציון', lat: 31.964, lng: 34.804 },
  { n: 'ירושלים', lat: 31.768, lng: 35.213 },
  { n: 'חיפה', lat: 32.794, lng: 34.989 },
  { n: 'באר שבע', lat: 31.252, lng: 34.791 }
];

// art = סוג האיור שמוצג כשאין תמונה אמיתית
const CATALOG = [
  { id: 'monstera', he: 'מונסטרה', sci: 'Monstera deliciosa', cat: 'house', art: 'monstera' },
  { id: 'monstera_albo', he: 'מונסטרה אלבו', sci: 'Monstera deliciosa Albo', cat: 'house', art: 'monstera' },
  { id: 'pothos', he: 'פוטוס', sci: 'Epipremnum aureum', cat: 'house', art: 'trailing' },
  { id: 'philodendron', he: 'פילודנדרון', sci: 'Philodendron hederaceum', cat: 'house', art: 'trailing' },
  { id: 'birkin', he: 'פילודנדרון בירקין', sci: 'Philodendron Birkin', cat: 'house', art: 'leafy' },
  { id: 'string_pearls', he: 'שרשרת פנינים', sci: 'Curio rowleyanus', cat: 'succulent', art: 'pearls' },
  { id: 'aloe', he: 'אלוורה', sci: 'Aloe vera', cat: 'succulent', art: 'succulent' },
  { id: 'snake', he: 'סנסיווריה', sci: 'Dracaena trifasciata', cat: 'house', art: 'snake' },
  { id: 'zz', he: 'זמיה (ZZ)', sci: 'Zamioculcas zamiifolia', cat: 'house', art: 'leafy' },
  { id: 'calathea', he: 'קלתאה אורביפוליה', sci: 'Calathea orbifolia', cat: 'house', art: 'leafy' },
  { id: 'ficus', he: 'פיקוס כינורי', sci: 'Ficus lyrata', cat: 'tree', art: 'tree' },
  { id: 'bird', he: 'ציפור גן עדן', sci: 'Strelitzia reginae', cat: 'house', art: 'snake' },
  { id: 'hoya', he: 'הויה', sci: 'Hoya carnosa', cat: 'house', art: 'trailing' },
  { id: 'echeveria', he: 'אצ׳ווריה', sci: 'Echeveria elegans', cat: 'succulent', art: 'succulent' },
  { id: 'opuntia', he: 'צבר', sci: 'Opuntia ficus-indica', cat: 'cactus', art: 'cactus' },
  { id: 'mammillaria', he: 'ממילריה', sci: 'Mammillaria', cat: 'cactus', art: 'cactus' },
  { id: 'basil', he: 'בזיליקום', sci: 'Ocimum basilicum', cat: 'herb', art: 'herb' },
  { id: 'mint', he: 'נענע', sci: 'Mentha spicata', cat: 'herb', art: 'herb' },
  { id: 'rosemary', he: 'רוזמרין', sci: 'Salvia rosmarinus', cat: 'herb', art: 'herb' },
  { id: 'lavender', he: 'לבנדר', sci: 'Lavandula angustifolia', cat: 'outdoor', art: 'herb' },
  { id: 'bougainvillea', he: 'בוגנוויליה', sci: 'Bougainvillea glabra', cat: 'outdoor', art: 'tree' },
  { id: 'olive', he: 'עץ זית', sci: 'Olea europaea', cat: 'tree', art: 'tree' },
  { id: 'lemon', he: 'עץ לימון', sci: 'Citrus limon', cat: 'tree', art: 'tree' },
  { id: 'tomato', he: 'זרעי עגבניה', sci: 'Solanum lycopersicum', cat: 'outdoor', art: 'seeds' },
  { id: 'pilea', he: 'פילאה', sci: 'Pilea peperomioides', cat: 'house', art: 'leafy' },
  { id: 'alocasia', he: 'אלוקסיה', sci: 'Alocasia amazonica', cat: 'house', art: 'monstera' },
  { id: 'spider', he: 'כלורופיטום', sci: 'Chlorophytum comosum', cat: 'house', art: 'snake' },
  { id: 'anthurium', he: 'אנתוריום', sci: 'Anthurium andraeanum', cat: 'house', art: 'leafy' },
  { id: 'begonia', he: 'בגוניה מקולטה', sci: 'Begonia maculata', cat: 'house', art: 'leafy' },
  { id: 'tradescantia', he: 'טרדסקנטיה', sci: 'Tradescantia zebrina', cat: 'house', art: 'trailing' }
];

// מקומות מפגש ציבוריים מומלצים (מוצגים לפי העיר של המשתמש)
const SAFE_SPOTS = ['הקניון המרכזי', 'בית קפה ברחוב הראשי', 'הפארק העירוני', 'המרכז הקהילתי', 'הספרייה העירונית', 'משתלה מקומית'];

// משתמשי הדגמה – כדי שיהיה עם מי להחליף לפני שיש משתמשים אמיתיים
const DEMO_USERS = [
  { id: 'maya', name: 'מאיה', city: 'כפר סבא', lat: 32.182, lng: 34.915, rating: 4.9, swaps: 27, open: true, color: '#FF2E7E',
    wish: ['monstera', 'pothos', 'hoya'],
    plants: [
      { id: 'p_maya_1', catId: 'birkin', offer: 'cutting', condition: 'young', qty: 2, delivery: 'pickup' },
      { id: 'p_maya_2', catId: 'alocasia', offer: 'full', condition: 'mature', qty: 1, delivery: 'pickup' }
    ] },
  { id: 'daniel', name: 'דניאל', city: 'רעננה', lat: 32.190, lng: 34.875, rating: 4.7, swaps: 9, open: false, color: '#0FB5B2',
    wish: ['hoya', 'calathea'],
    plants: [
      { id: 'p_daniel_1', catId: 'string_pearls', offer: 'seedling', condition: 'young', qty: 1, delivery: 'both' },
      { id: 'p_daniel_2', catId: 'pilea', offer: 'full', condition: 'mature', qty: 1, delivery: 'pickup' }
    ] },
  { id: 'ron', name: 'רון', city: 'הוד השרון', lat: 32.155, lng: 34.892, rating: 5.0, swaps: 14, open: true, color: '#FFB21C',
    wish: ['aloe', 'philodendron'],
    plants: [
      { id: 'p_ron_1', catId: 'monstera_albo', offer: 'cutting', condition: 'young', qty: 1, delivery: 'pickup' },
      { id: 'p_ron_2', catId: 'snake', offer: 'full', condition: 'large', qty: 1, delivery: 'pickup' }
    ] },
  { id: 'noa', name: 'נועה', city: 'כפר סבא', lat: 32.168, lng: 34.900, rating: 4.8, swaps: 5, open: true, color: '#B44CFF',
    wish: ['pothos', 'basil'],
    plants: [
      { id: 'p_noa_1', catId: 'calathea', offer: 'full', condition: 'mature', qty: 1, delivery: 'pickup' },
      { id: 'p_noa_2', catId: 'anthurium', offer: 'full', condition: 'mature', qty: 1, delivery: 'both' }
    ] },
  { id: 'omer', name: 'עומר', city: 'הרצליה', lat: 32.162, lng: 34.840, rating: 4.6, swaps: 21, open: true, color: '#FF6A3D',
    wish: ['ficus', 'bird'],
    plants: [
      { id: 'p_omer_1', catId: 'echeveria', offer: 'seedling', condition: 'young', qty: 3, delivery: 'shipping' },
      { id: 'p_omer_2', catId: 'opuntia', offer: 'cutting', condition: 'mature', qty: 2, delivery: 'pickup' }
    ] },
  { id: 'shira', name: 'שירה', city: 'תל אביב', lat: 32.080, lng: 34.780, rating: 4.9, swaps: 33, open: false, color: '#19A55B',
    wish: ['begonia', 'monstera'],
    plants: [
      { id: 'p_shira_1', catId: 'philodendron', offer: 'cutting', condition: 'young', qty: 3, delivery: 'both' },
      { id: 'p_shira_2', catId: 'hoya', offer: 'cutting', condition: 'young', qty: 2, delivery: 'shipping' },
      { id: 'p_shira_3', catId: 'tradescantia', offer: 'cutting', condition: 'young', qty: 4, delivery: 'both' }
    ] },
  { id: 'yossi', name: 'יוסי', city: 'נתניה', lat: 32.320, lng: 34.855, rating: 4.5, swaps: 3, open: true, color: '#FFB21C',
    wish: ['lemon', 'olive'],
    plants: [
      { id: 'p_yossi_1', catId: 'tomato', offer: 'seeds', condition: 'young', qty: 20, delivery: 'shipping' },
      { id: 'p_yossi_2', catId: 'rosemary', offer: 'seedling', condition: 'young', qty: 2, delivery: 'pickup' },
      { id: 'p_yossi_3', catId: 'lavender', offer: 'full', condition: 'mature', qty: 1, delivery: 'pickup' }
    ] },
  { id: 'lior', name: 'ליאור', city: 'פתח תקווה', lat: 32.090, lng: 34.885, rating: 4.8, swaps: 12, open: true, color: '#0FB5B2',
    wish: ['aloe', 'zz'],
    plants: [
      { id: 'p_lior_1', catId: 'bird', offer: 'full', condition: 'large', qty: 1, delivery: 'pickup' },
      { id: 'p_lior_2', catId: 'spider', offer: 'cutting', condition: 'young', qty: 3, delivery: 'both' }
    ] },
  { id: 'tal', name: 'טל', city: 'רעננה', lat: 32.178, lng: 34.862, rating: 4.9, swaps: 18, open: true, color: '#FF2E7E',
    wish: ['string_pearls', 'mammillaria'],
    plants: [
      { id: 'p_tal_1', catId: 'begonia', offer: 'cutting', condition: 'young', qty: 1, delivery: 'pickup' },
      { id: 'p_tal_2', catId: 'zz', offer: 'full', condition: 'mature', qty: 1, delivery: 'pickup' }
    ] },
  { id: 'avigail', name: 'אביגיל', city: 'כפר סבא', lat: 32.172, lng: 34.925, rating: 4.7, swaps: 7, open: true, color: '#B44CFF',
    wish: ['monstera', 'lavender'],
    plants: [
      { id: 'p_avigail_1', catId: 'string_pearls', offer: 'cutting', condition: 'young', qty: 2, delivery: 'pickup' },
      { id: 'p_avigail_2', catId: 'mint', offer: 'cutting', condition: 'young', qty: 5, delivery: 'pickup' }
    ] }
];

// תשובות אוטומטיות בצ'אט ההדגמה
const BOT_REPLIES = [
  'נשמע מעולה!',
  'מתאים לי. מתי נוח לך?',
  'אפשר להיפגש בפארק העירוני, מה דעתך?',
  'אני יכול/ה מחר אחר הצהריים.',
  'יש לי גם ייחור קטן נוסף אם תרצה/י 🌿',
  'סגור, נתראה שם!',
  'תודה! אשלח תמונה של הצמח בקרוב.'
];
