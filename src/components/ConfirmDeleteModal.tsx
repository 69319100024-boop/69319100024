import { useState } from 'react';
import { Transaction } from '../types/finance';
import { formatTHB, formatThaiDate } from '../utils/finance';

interface ConfirmDeleteModalProps {
  transaction: Transaction | null;
  onCancel: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function ConfirmDeleteModal({
  transaction,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  if (!transaction) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm(transaction.id);
      onCancel();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <h2 id="delete-modal-title" className="font-display text-base font-semibold text-slate-900 dark:text-white">
            ยืนยันการลบรายการ
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            คุณต้องการลบรายการนี้ใช่หรือไม่ การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {transaction.title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {formatThaiDate(transaction.date)} · {transaction.category}
            </p>
          </div>
          <span
            className={`font-mono text-sm font-semibold shrink-0 tabular-nums ${
              transaction.type === 'income'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {transaction.type === 'income' ? '+' : '-'}฿{formatTHB(transaction.amount)}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
          >
            {deleting ? 'กำลังลบ...' : 'ลบรายการ'}
          </button>
        </div>
      </div>
    </div>
  );
}
