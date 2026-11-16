import { PaymentMethod, Transaction, TransactionType } from '../types/finance';

export const EXPENSE_CATEGORIES = [
  'อาหารและเครื่องดื่ม',
  'เดินทางและน้ำมัน',
  'ที่อยู่อาศัยและบิล',
  'ช้อปปิ้งและของใช้',
  'สุขภาพและการแพทย์',
  'บันเทิงและไลฟ์สไตล์',
  'การศึกษาและพัฒนาตนเอง',
  'อื่นๆ',
] as const;

export const INCOME_CATEGORIES = [
  'เงินเดือนประจำ',
  'ฟรีแลนซ์และโปรเจกต์',
  'ธุรกิจและค้าขาย',
  'ลงทุนและปันผล',
  'รายรับอื่นๆ',
] as const;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  promptpay: 'พร้อมเพย์ (PromptPay)',
  bank_transfer: 'โอนผ่านธนาคาร',
  cash: 'เงินสด',
  credit_card: 'บัตรเครดิต / เดบิต',
  other: 'ช่องทางอื่นๆ',
};

export const CATEGORY_COLORS: Record<string, string> = {
  'อาหารและเครื่องดื่ม': '#1D4ED8',
  'เดินทางและน้ำมัน': '#0284C7',
  'ที่อยู่อาศัยและบิล': '#0F766E',
  'ช้อปปิ้งและของใช้': '#D97706',
  'สุขภาพและการแพทย์': '#DC2626',
  'บันเทิงและไลฟ์สไตล์': '#4F46E5',
  'การศึกษาและพัฒนาตนเอง': '#059669',
  'อื่นๆ': '#64748B',
  'เงินเดือนประจำ': '#059669',
  'ฟรีแลนซ์และโปรเจกต์': '#0284C7',
  'ธุรกิจและค้าขาย': '#1D4ED8',
  'ลงทุนและปันผล': '#0F766E',
  'รายรับอื่นๆ': '#475569',
};

const THAI_MONTHS_FULL = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatThaiMonthFull(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const yearBE = Number(yearStr) + 543;
  const monthIdx = Number(monthStr) - 1;
  return `${THAI_MONTHS_FULL[monthIdx] || monthStr} ${yearBE}`;
}

export function formatThaiMonthShort(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const yearBE = String(Number(yearStr) + 543).slice(-2);
  const monthIdx = Number(monthStr) - 1;
  return `${THAI_MONTHS_SHORT[monthIdx] || monthStr} ${yearBE}`;
}

export function formatThaiDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const yearBE = Number(y) + 543;
  const monthIdx = Number(m) - 1;
  return `${Number(d)} ${THAI_MONTHS_SHORT[monthIdx] || m} ${yearBE}`;
}

export function formatTHB(amount: number, showDecimals = true): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

export function formatCompactTHB(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}฿${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}฿${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}฿${abs.toFixed(0)}`;
}

export function getDaysInMonth(monthKey: string): number {
  const [yearStr, monthStr] = monthKey.split('-');
  return new Date(Number(yearStr), Number(monthStr), 0).getDate();
}

export function computeMonthlySummary(transactions: Transaction[], monthKey: string) {
  let income = 0;
  let expense = 0;
  let count = 0;

  for (const tx of transactions) {
    if (tx.monthKey !== monthKey) continue;
    count += 1;
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;
  }

  const net = income - expense;
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  return { income, expense, net, count, savingsRate };
}

export function computeCategoryBreakdown(
  transactions: Transaction[],
  monthKey: string,
  type: TransactionType
) {
  const map = new Map<string, number>();
  let total = 0;

  for (const tx of transactions) {
    if (tx.monthKey !== monthKey || tx.type !== type) continue;
    total += tx.amount;
    map.set(tx.category, (map.get(tx.category) || 0) + tx.amount);
  }

  const items = Array.from(map.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: CATEGORY_COLORS[category] || '#64748B',
    }))
    .sort((a, b) => b.amount - a.amount);

  return { items, total };
}

export function exportTransactionsToCSV(transactions: Transaction[], filename: string) {
  const headers = ['วันที่', 'เดือน', 'ประเภท', 'ชื่อรายการ', 'หมวดหมู่', 'จำนวนเงิน (บาท)', 'ช่องทางชำระ', 'หมายเหตุ'];
  const escapeCSV = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = transactions.map((tx) => [
    tx.date,
    tx.monthKey,
    tx.type === 'income' ? 'รายรับ' : 'รายจ่าย',
    tx.title,
    tx.category,
    tx.amount.toFixed(2),
    PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod,
    tx.note || '',
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCSV).join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
