import { useMemo, useState } from 'react';
import { Download, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { PaymentMethod, Transaction, TransactionType } from '../types/finance';
import {
  EXPENSE_CATEGORIES,
  exportTransactionsToCSV,
  formatTHB,
  formatThaiDate,
  formatThaiMonthFull,
  INCOME_CATEGORIES,
  PAYMENT_METHOD_LABELS,
} from '../utils/finance';

interface LedgerViewProps {
  transactions: Transaction[];
  selectedMonthKey: string;
  onAddNew: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export function LedgerView({
  transactions,
  selectedMonthKey,
  onAddNew,
  onEdit,
  onDelete,
}: LedgerViewProps) {
  const [scope, setScope] = useState<'month' | 'all'>('month');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentMethod>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allCategories = useMemo(
    () => Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])),
    []
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (scope === 'month' && tx.monthKey !== selectedMonthKey) return false;
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
      if (paymentFilter !== 'all' && tx.paymentMethod !== paymentFilter) return false;
      if (q) {
        const hay = `${tx.title} ${tx.category} ${tx.note || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, scope, selectedMonthKey, typeFilter, categoryFilter, paymentFilter, searchQuery]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filtered) {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  const handleExport = () => {
    const label = scope === 'month' ? selectedMonthKey : 'all-months';
    exportTransactionsToCSV(filtered, `dbtech-ledger-${label}.csv`);
  };

  return (
    <div className="space-y-5">
      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Scope & Type Segmented Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setScope('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  scope === 'month'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {formatThaiMonthFull(selectedMonthKey)}
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  scope === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ทุกเดือนทั้งหมด
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  typeFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('income')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  typeFilter === 'income'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                รายรับ
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('expense')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  typeFilter === 'expense'
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                รายจ่าย
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก CSV</span>
          </button>
        </div>

        {/* Search & Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาชื่อรายการ หมวดหมู่ หรือหมายเหตุ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="กรองตามหมวดหมู่"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as 'all' | PaymentMethod)}
              aria-label="กรองตามช่องทางชำระเงิน"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            >
              <option value="all">ทุกช่องทางชำระเงิน</option>
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filtered Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-1 text-xs text-slate-600 dark:text-slate-400">
        <span>
          แสดง <strong className="font-mono text-slate-900 dark:text-white">{filtered.length}</strong> รายการ
        </span>
        <div className="flex flex-wrap items-center gap-4 font-mono tabular-nums">
          <span className="text-emerald-600 dark:text-emerald-400">
            รายรับ +฿{formatTHB(totals.income)}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-red-600 dark:text-red-400">
            รายจ่าย -฿{formatTHB(totals.expense)}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            สุทธิ {totals.net < 0 ? '-' : ''}฿{formatTHB(Math.abs(totals.net))}
          </span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ลองปรับตัวกรองด้านบน หรือเพิ่มรายการใหม่เข้าสู่ระบบ
            </p>
            <button
              type="button"
              onClick={onAddNew}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มรายการใหม่</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-6">วันที่</th>
                  <th className="py-3 px-4">รายการและหมายเหตุ</th>
                  <th className="py-3 px-4">ประเภท</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  <th className="py-3 px-4">ช่องทาง</th>
                  <th className="py-3 px-4 text-right">จำนวนเงิน</th>
                  <th className="py-3 px-6 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-6 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatThaiDate(tx.date)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{tx.title}</p>
                      {tx.note && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm">
                          {tx.note}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium whitespace-nowrap">
                      <span
                        className={
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }
                      >
                        {tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {tx.category}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {PAYMENT_METHOD_LABELS[tx.paymentMethod]}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-semibold whitespace-nowrap tabular-nums ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}฿{formatTHB(tx.amount)}
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(tx)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400 rounded-md cursor-pointer"
                          aria-label={`แก้ไข ${tx.title}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(tx)}
                          className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-md cursor-pointer"
                          aria-label={`ลบ ${tx.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
