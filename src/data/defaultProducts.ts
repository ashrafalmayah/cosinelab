import { ProductSpec } from '../types';

export const DEFAULT_PRODUCTS_SPECS: ProductSpec[] = [
  {
    id: "prod-1",
    name: "كريم مرطب بفيتامين B3 وزبدة الشيا",
    category: "كريمات",
    packSize: 250,
    unit: "جم",
    batchUnits: 100,
    containerCost: 3.00,
    labelCost: 1.25,
    targetTotalCost: 6.54,
    multiplier: 2.5,
    ingredients: [
      { matId: 2, pct: 4.0 },   // جلسرين 4%
      { matId: 9, pct: 6.0 },   // زبدة شيا 6%
      { matId: 11, pct: 4.0 },  // زيت لوز حلو 4%
      { matId: 17, pct: 4.5 },  // شمع استحلاب 4.5%
      { matId: 18, pct: 2.0 },  // كحول سيتيلي 2%
      { matId: 5, pct: 2.5 },   // نياسيناميد 2.5%
      { matId: 4, pct: 1.0 },   // بانثينول 1%
      { matId: 25, pct: 0.5 },  // فيتامين E 0.5%
      { matId: 35, pct: 0.8 },  // فينوكسي إيثانول 0.8%
      { matId: 39, pct: 0.4 }   // عطر 0.4%
    ]
  },
  {
    id: "prod-2",
    name: "سيروم النياسيناميد والهيالورونيك للوجه",
    category: "سيروم",
    packSize: 30,
    unit: "مل",
    batchUnits: 100,
    containerCost: 2.80,
    labelCost: 1.10,
    targetTotalCost: 5.67,
    multiplier: 3.0,
    ingredients: [
      { matId: 5, pct: 6.0 },   // نياسيناميد 6%
      { matId: 6, pct: 1.0 },   // هيالورونيك 1%
      { matId: 2, pct: 3.5 },   // جلسرين 3.5%
      { matId: 4, pct: 1.5 },   // بانثينول 1.5%
      { matId: 7, pct: 1.2 },   // جل صبار 1.2%
      { matId: 22, pct: 0.4 },  // صمغ زانثان 0.4%
      { matId: 36, pct: 0.8 },  // أوبتي فين 0.8%
      { matId: 38, pct: 0.1 }   // إيديتا 0.1%
    ]
  },
  {
    id: "prod-3",
    name: "شامبو طبيعي خالي من السلفات بالروزماري",
    category: "عناية بالشعر",
    packSize: 400,
    unit: "مل",
    batchUnits: 100,
    containerCost: 2.50,
    labelCost: 1.00,
    targetTotalCost: 6.85,
    multiplier: 2.4,
    ingredients: [
      { matId: 32, pct: 12.0 }, // بيتايين 12%
      { matId: 33, pct: 8.0 },  // ديسيل جلوكوسيد 8%
      { matId: 34, pct: 3.0 },  // ساركوسينات 3%
      { matId: 2, pct: 2.0 },   // جلسرين 2%
      { matId: 50, pct: 1.2 },  // بولي كواتيرنيوم 1.2%
      { matId: 4, pct: 0.5 },   // بانثينول 0.5%
      { matId: 42, pct: 0.5 },  // زيت روزماري 0.5%
      { matId: 22, pct: 0.4 },  // زانثان 0.4%
      { matId: 35, pct: 0.7 },  // فينوكسي 0.7%
      { matId: 37, pct: 0.2 }   // حمض ستريك 0.2%
    ]
  },
  {
    id: "prod-4",
    name: "لوشن الجسم المرطب بزبدة الشيا وفيتامين E",
    category: "عناية بالجسم",
    packSize: 300,
    unit: "مل",
    batchUnits: 100,
    containerCost: 2.60,
    labelCost: 1.00,
    targetTotalCost: 6.30,
    multiplier: 2.5,
    ingredients: [
      { matId: 9, pct: 5.0 },   // زبدة شيا 5%
      { matId: 14, pct: 5.0 },  // زيت جوز هند 5%
      { matId: 2, pct: 4.0 },   // جلسرين 4%
      { matId: 17, pct: 3.5 },  // شمع استحلاب 3.5%
      { matId: 18, pct: 1.5 },  // كحول سيتيلي 1.5%
      { matId: 25, pct: 0.6 },  // فيتامين E 0.6%
      { matId: 35, pct: 0.8 },  // فينوكسي 0.8%
      { matId: 39, pct: 0.6 }   // عطر 0.6%
    ]
  },
  {
    id: "prod-5",
    name: "غسول الوجه الرغوي اللطيف بالألوفيرا والبانثينول",
    category: "غسول وتونر",
    packSize: 150,
    unit: "مل",
    batchUnits: 100,
    containerCost: 2.40,
    labelCost: 0.90,
    targetTotalCost: 5.08,
    multiplier: 2.6,
    ingredients: [
      { matId: 32, pct: 9.0 },  // بيتايين 9%
      { matId: 33, pct: 5.0 },  // ديسيل جلوكوسيد 5%
      { matId: 7, pct: 4.0 },   // جل صبار 4%
      { matId: 2, pct: 2.0 },   // جلسرين 2%
      { matId: 4, pct: 1.0 },   // بانثينول 1%
      { matId: 35, pct: 0.7 },  // فينوكسي 0.7%
      { matId: 37, pct: 0.3 }   // حمض ستريك 0.3%
    ]
  },
  {
    id: "prod-6",
    name: "واقي شمسي فيزيائي بأكسيد الزنك والألوفيرا SPF 50",
    category: "واقي شمسي",
    packSize: 50,
    unit: "مل",
    batchUnits: 100,
    containerCost: 2.90,
    labelCost: 1.20,
    targetTotalCost: 6.40,
    multiplier: 2.8,
    ingredients: [
      { matId: 43, pct: 12.0 }, // أكسيد الزنك 12%
      { matId: 44, pct: 4.0 },  // ثاني أكسيد التيتانيوم 4%
      { matId: 7, pct: 5.0 },   // جل صبار 5%
      { matId: 15, pct: 4.0 },  // زيت بذور العنب 4%
      { matId: 17, pct: 3.5 },  // شمع استحلاب 3.5%
      { matId: 2, pct: 1.5 },   // جلسرين 1.5%
      { matId: 25, pct: 0.3 },  // فيتامين E 0.3%
      { matId: 35, pct: 0.7 }   // فينوكسي 0.7%
    ]
  },
  {
    id: "prod-7",
    name: "سيروم فيتامين C وألفا أربوتين للتفتيح",
    category: "سيروم",
    packSize: 30,
    unit: "مل",
    batchUnits: 100,
    containerCost: 3.00,
    labelCost: 1.20,
    targetTotalCost: 6.20,
    multiplier: 3.0,
    ingredients: [
      { matId: 26, pct: 4.0 },  // فيتامين C مستقر 4%
      { matId: 27, pct: 1.5 },  // ألفا أربوتين 1.5%
      { matId: 2, pct: 3.5 },   // جلسرين 3.5%
      { matId: 6, pct: 0.8 },   // هيالورونيك 0.8%
      { matId: 30, pct: 1.0 },  // عرقسوس 1.0%
      { matId: 22, pct: 0.4 },  // زانثان 0.4%
      { matId: 36, pct: 0.8 }   // أوبتي فين 0.8%
    ]
  },
  {
    id: "prod-8",
    name: "بلسم وحمام كريم للشعر بزيت الأرجان وBTMS-50",
    category: "عناية بالشعر",
    packSize: 300,
    unit: "جم",
    batchUnits: 100,
    containerCost: 2.50,
    labelCost: 1.00,
    targetTotalCost: 6.85,
    multiplier: 2.5,
    ingredients: [
      { matId: 20, pct: 5.0 },  // BTMS-50 5%
      { matId: 18, pct: 3.0 },  // كحول سيتيلي 3%
      { matId: 13, pct: 3.0 },  // زيت أرجان 3%
      { matId: 14, pct: 3.0 },  // زيت جوز هند 3%
      { matId: 2, pct: 2.5 },   // جلسرين 2.5%
      { matId: 4, pct: 0.8 },   // بانثينول 0.8%
      { matId: 35, pct: 0.7 },  // فينوكسي 0.7%
      { matId: 39, pct: 0.5 }   // عطر 0.5%
    ]
  },
  {
    id: "prod-9",
    name: "تونر مقشر لطيف بحمض الجليكوليك والبانثينول",
    category: "غسول وتونر",
    packSize: 200,
    unit: "مل",
    batchUnits: 100,
    containerCost: 2.10,
    labelCost: 0.85,
    targetTotalCost: 4.85,
    multiplier: 2.7,
    ingredients: [
      { matId: 46, pct: 4.0 },  // حمض جليكوليك 4%
      { matId: 7, pct: 3.0 },   // جل صبار 3%
      { matId: 2, pct: 2.5 },   // جلسرين 2.5%
      { matId: 4, pct: 1.0 },   // بانثينول 1%
      { matId: 8, pct: 0.3 },   // ألانتوين 0.3%
      { matId: 35, pct: 0.7 }   // فينوكسي 0.7%
    ]
  },
  {
    id: "prod-10",
    name: "زبدة الجسم المخفوقة بالكاكاو واللوز الحلو",
    category: "عناية بالجسم",
    packSize: 200,
    unit: "جم",
    batchUnits: 100,
    containerCost: 2.60,
    labelCost: 1.00,
    targetTotalCost: 7.70,
    multiplier: 2.5,
    ingredients: [
      { matId: 10, pct: 12.0 }, // زبدة كاكاو 12%
      { matId: 9, pct: 8.0 },   // زبدة شيا 8%
      { matId: 11, pct: 7.0 },  // زيت لوز حلو 7%
      { matId: 17, pct: 5.0 },  // شمع استحلاب 5%
      { matId: 18, pct: 2.5 },  // كحول سيتيلي 2.5%
      { matId: 2, pct: 2.0 },   // جلسرين 2%
      { matId: 25, pct: 0.5 },  // فيتامين E 0.5%
      { matId: 35, pct: 0.6 },  // فينوكسي 0.6%
      { matId: 39, pct: 0.4 }   // عطر 0.4%
    ]
  },
  {
    id: "prod-11",
    name: "جل الصبار المهدئ لما بعد الشمس بفيتامين B5",
    category: "عناية بالجسم",
    packSize: 250,
    unit: "مل",
    batchUnits: 100,
    containerCost: 2.00,
    labelCost: 0.80,
    targetTotalCost: 5.00,
    multiplier: 2.6,
    ingredients: [
      { matId: 7, pct: 10.0 },  // جل صبار 10%
      { matId: 2, pct: 3.0 },   // جلسرين 3%
      { matId: 4, pct: 1.0 },   // بانثينول 1%
      { matId: 23, pct: 0.6 },  // كربومير 0.6%
      { matId: 24, pct: 0.5 },  // TEA 0.5%
      { matId: 8, pct: 0.2 },   // ألانتوين 0.2%
      { matId: 35, pct: 0.7 }   // فينوكسي 0.7%
    ]
  },
  {
    id: "prod-12",
    name: "مقشر القهوة والكافيين لتنشيط البشرة والجسم",
    category: "عناية بالجسم",
    packSize: 250,
    unit: "جم",
    batchUnits: 100,
    containerCost: 2.20,
    labelCost: 0.90,
    targetTotalCost: 6.45,
    multiplier: 2.5,
    ingredients: [
      { matId: 9, pct: 8.0 },   // زبدة شيا 8%
      { matId: 14, pct: 8.0 },  // زيت جوز هند 8%
      { matId: 17, pct: 6.0 },  // شمع استحلاب 6%
      { matId: 2, pct: 5.0 },   // جلسرين 5%
      { matId: 19, pct: 3.0 },  // حمض الشمع 3%
      { matId: 48, pct: 2.0 },  // كافيين 2%
      { matId: 25, pct: 0.8 },  // فيتامين E 0.8%
      { matId: 35, pct: 0.8 },  // فينوكسي 0.8%
      { matId: 39, pct: 0.4 }   // عطر 0.4%
    ]
  }
];

