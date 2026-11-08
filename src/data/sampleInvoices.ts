import { Invoice } from '../types';

export const SAMPLE_INVOICES: Invoice[] = [
  {
    id: "INV-1001",
    date: "2025-05-10 11:30 ص",
    customer: "صيدلية النور التخصصية",
    mode: "تجزئة",
    unitsCount: 6,
    totalCost: 37.98,
    discount: 0,
    grandTotal: 98.10,
    netProfit: 60.12,
    items: [
      { name: "كريم مرطب بفيتامين B3 وزبدة الشيا (250 جم)", qty: 3, price: 16.35, cost: 6.54 },
      { name: "واقي شمسي فيزيائي بأكسيد الزنك والألوفيرا SPF 50 (50 مل)", qty: 3, price: 16.35, cost: 6.12 }
    ]
  },
  {
    id: "INV-1002",
    date: "2025-05-11 04:15 م",
    customer: "بوتيك الجمال الطبيعي",
    mode: "تجزئة",
    unitsCount: 4,
    totalCost: 24.44,
    discount: 2.00,
    grandTotal: 67.24,
    netProfit: 42.80,
    items: [
      { name: "سيروم النياسيناميد والهيالورونيك للوجه (30 مل)", qty: 2, price: 17.01, cost: 5.67 },
      { name: "سيروم فيتامين C وألفا أربوتين للتفتيح (30 مل)", qty: 2, price: 17.61, cost: 6.55 }
    ]
  }
];

