// ===== נתונים קבועים: קטלוג צמחים וערים =====
// אפשר לערוך את הקובץ הזה כדי להוסיף צמחים או ערים.

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

// צמחים פופולריים להצעה מהירה ברשימת המשאלות בהרשמה
const POPULAR = ['monstera', 'monstera_albo', 'pothos', 'philodendron', 'string_pearls', 'hoya', 'calathea', 'alocasia', 'aloe', 'snake', 'ficus', 'basil'];
