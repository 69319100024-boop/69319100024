import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PaymentMethod, Transaction, TransactionInput, TransactionType } from '../types/finance';
import {
  EXPENSE_CATEGORIES,
  getTodayDateString,
  INCOME_CATEGORIES,
  PAYMENT_METHOD_LABELS,
} from '../utils/finance';

interface TransactionModalProps {
  open: boolean;
  initialTransaction: Transaction | null;
  defaultMonthKey: string;
  onClose: () => void;
  onSubmit: (input: TransactionInput, editId?: string) => Promise<void>;
}

export function TransactionModal({
  open,
  initialTransaction,
  defaultMonthKey,
  onClose,
  onSubmit,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initialTransaction) {
      setType(initialTransaction.type);
      setTitle(initialTransaction.title);
      setAmountStr(String(initialTransaction.amount));
      setCategory(initialTransaction.category);
      setDate(initialTransaction.date);
      setPaymentMethod(initialTransaction.paymentMethod);
      setNote(initialTransaction.note || '');
    } else {
      const today = getTodayDateString();
      const defaultDate = today.startsWith(defaultMonthKey) ? today : `${defaultMonthKey}-01`;
      setType('expense');
      setTitle('');
      setAmountStr('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setDate(defaultDate);
      setPaymentMethod('promptpay');
      setNote('');
    }
  }, [open, initialTransaction, defaultMonthKey]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeSwitch = (nextType: TransactionType) => {
    setType(nextType);
    const nextCats = nextType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!(nextCats as readonly string[]).includes(category)) {
      setCategory(nextCats[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amountStr);
    if (!title.trim()) {
      setError('กรุณาระบุชื่อรายการ');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1_000_000_000) {
      setError('กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0 และไม่เกิน 1,000,000,000 บาท)');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('กรุณาเลือกวันที่ให้ถูกต้อง');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        {
          type,
          title: title.trim().slice(0, 120),
          amount: Number(parsedAmount.toFixed(2)),
          category,
          date,
          paymentMethod,
          note: note.trim().slice(0, 500),
        },
        initialTransaction?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกรายการได้');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 id="tx-modal-title" className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            {initialTransaction ? 'แก้ไขรายการรายรับ-รายจ่าย' : 'เพิ่มรายการใหม่'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* Segmented Type Selector */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => handleTypeSwitch('expense')}
              className={`py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                type === 'expense'
                  ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              รายจ่าย (Expense)
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('income')}
              className={`py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                type === 'income'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              รายรับ (Income)
            </button>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                จำนวนเงิน (บาท)
              </label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                max="1000000000"
                required
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-3.5 py-2.5 font-mono text-base font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                วันที่ทำรายการ
              </label>
              <input
                id="tx-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 font-mono text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="tx-title"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                ชื่อรายการ
              </label>
              <span className="text-[11px] font-mono text-slate-400">{title.length}/120</span>
            </div>
            <input
              id="tx-title"
              type="text"
              maxLength={120}
              required
              placeholder={type === 'income' ? 'เช่น เงินเดือน, ค่าจ้างออกแบบเว็บไซต์' : 'เช่น ค่าอาหารกลางวัน, ค่าอินเทอร์เน็ตรายเดือน'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              หมวดหมู่
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 text-xs font-medium text-left rounded-lg border transition-colors truncate cursor-pointer ${
                    category === cat
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label
              htmlFor="tx-payment"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              ช่องทางการชำระเงิน / รับเงิน
            </label>
            <select
              id="tx-payment"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="tx-note"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                หมายเหตุเพิ่มเติม (ไม่บังคับ)
              </label>
              <span className="text-[11px] font-mono text-slate-400">{note.length}/500</span>
            </div>
            <textarea
              id="tx-note"
              rows={2}
              maxLength={500}
              placeholder="รายละเอียดเพิ่มเติม..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 resize-none"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {submitting
                ? 'กำลังบันทึก...'
                : initialTransaction
                ? 'บันทึกการแก้ไข'
                : 'บันทึกรายการ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
