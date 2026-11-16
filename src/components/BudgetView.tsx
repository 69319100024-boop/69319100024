import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { MonthlyBudget, Transaction } from '../types/finance';
import {
  computeMonthlySummary,
  formatTHB,
  formatThaiMonthFull,
  getCurrentMonthKey,
  getDaysInMonth,
  shiftMonthKey,
} from '../utils/finance';

interface BudgetViewProps {
  selectedMonthKey: string;
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  defaultMonthlyBudget: number;
  onSaveMonthlyBudget: (monthKey: string, limitAmount: number) => Promise<void>;
  onSaveDefaultBudget: (limitAmount: number) => Promise<void>;
}

export function BudgetView({
  selectedMonthKey,
  transactions,
  budgets,
  defaultMonthlyBudget,
  onSaveMonthlyBudget,
  onSaveDefaultBudget,
}: BudgetViewProps) {
  const existingMonthBudget = useMemo(
    () => budgets.find((b) => b.monthKey === selectedMonthKey),
    [budgets, selectedMonthKey]
  );

  const effectiveLimit = existingMonthBudget?.limitAmount ?? defaultMonthlyBudget ?? 0;

  const [monthInput, setMonthInput] = useState(String(effectiveLimit || ''));
  const [defaultInput, setDefaultInput] = useState(String(defaultMonthlyBudget || ''));
  const [savingMonth, setSavingMonth] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setMonthInput(effectiveLimit > 0 ? String(effectiveLimit) : '');
  }, [effectiveLimit, selectedMonthKey]);

  useEffect(() => {
    setDefaultInput(defaultMonthlyBudget > 0 ? String(defaultMonthlyBudget) : '');
  }, [defaultMonthlyBudget]);

  const summary = useMemo(
    () => computeMonthlySummary(transactions, selectedMonthKey),
    [transactions, selectedMonthKey]
  );

  const usedPct = effectiveLimit > 0 ? (summary.expense / effectiveLimit) * 100 : 0;
  const remaining = effectiveLimit - summary.expense;

  // Daily safe allowance if viewing current month
  const currentMk = getCurrentMonthKey();
  const daysInMonth = getDaysInMonth(selectedMonthKey);
  const todayDay = new Date().getDate();
  const remainingDays =
    selectedMonthKey === currentMk ? Math.max(daysInMonth - todayDay + 1, 1) : daysInMonth;
  const dailyAllowance = remaining > 0 ? remaining / remainingDays : 0;

  // 6-month adherence history
  const historyRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < 6; i += 1) {
      const mk = shiftMonthKey(selectedMonthKey, -i);
      const s = computeMonthlySummary(transactions, mk);
      const b = budgets.find((item) => item.monthKey === mk);
      const limit = b?.limitAmount ?? defaultMonthlyBudget ?? 0;
      const pct = limit > 0 ? (s.expense / limit) * 100 : null;
      rows.push({
        monthKey: mk,
        label: formatThaiMonthFull(mk),
        limit,
        expense: s.expense,
        diff: limit > 0 ? limit - s.expense : null,
        pct,
      });
    }
    return rows;
  }, [selectedMonthKey, transactions, budgets, defaultMonthlyBudget]);

  const handleSaveMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(monthInput || 0);
    if (!Number.isFinite(val) || val < 0 || val > 1_000_000_000) return;
    setSavingMonth(true);
    setFeedback(null);
    try {
      await onSaveMonthlyBudget(selectedMonthKey, val);
      setFeedback(`บันทึกงบประมาณประจำเดือน ${formatThaiMonthFull(selectedMonthKey)} เรียบร้อยแล้ว`);
    } finally {
      setSavingMonth(false);
    }
  };

  const handleSaveDefault = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(defaultInput || 0);
    if (!Number.isFinite(val) || val < 0 || val > 1_000_000_000) return;
    setSavingDefault(true);
    setFeedback(null);
    try {
      await onSaveDefaultBudget(val);
      setFeedback('บันทึกงบประมาณมาตรฐานรายเดือนเรียบร้อยแล้ว');
    } finally {
      setSavingDefault(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Current Month Budget Burn Status */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              สถานะการใช้งบประมาณ · {formatThaiMonthFull(selectedMonthKey)}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ติดตามรายจ่ายเทียบกับเพดานงบประมาณที่ตั้งไว้
            </p>
          </div>
          {effectiveLimit > 0 && (
            <div className="flex items-center gap-2 text-xs font-medium">
              {usedPct > 100 ? (
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  เกินงบประมาณที่ตั้งไว้
                </span>
              ) : usedPct >= 80 ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  ใกล้ถึงเพดานงบประมาณ ({usedPct.toFixed(0)}%)
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  อยู่ในเกณฑ์ปกติ ({usedPct.toFixed(0)}%)
                </span>
              )}
            </div>
          )}
        </div>

        {effectiveLimit > 0 ? (
          <div className="space-y-5">
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  usedPct > 100 ? 'bg-red-600' : usedPct >= 80 ? 'bg-amber-500' : 'bg-blue-700'
                }`}
                style={{ width: `${Math.min(usedPct, 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">เพดานงบประมาณ</p>
                <p className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  ฿{formatTHB(effectiveLimit)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">ใช้จ่ายไปแล้ว</p>
                <p className="font-mono text-xl font-bold text-red-600 dark:text-red-400 mt-1 tabular-nums">
                  ฿{formatTHB(summary.expense)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {remaining >= 0 ? 'งบคงเหลือ' : 'เกินงบประมาณ'}
                </p>
                <p
                  className={`font-mono text-xl font-bold mt-1 tabular-nums ${
                    remaining >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  ฿{formatTHB(Math.abs(remaining))}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  งบเฉลี่ยต่อวันที่ใช้ได้ ({remainingDays} วัน)
                </p>
                <p className="font-mono text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  ฿{formatTHB(dailyAllowance)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400 py-2">
            คุณยังไม่ได้กำหนดวงเงินงบประมาณสำหรับเดือนนี้ กรุณากรอกวงเงินด้านล่างเพื่อเริ่มติดตามผล
          </p>
        )}
      </section>

      {/* Budget Configuration Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleSaveMonth}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
        >
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              ตั้งงบประมาณเฉพาะเดือน {formatThaiMonthFull(selectedMonthKey)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ใช้ควบคุมค่าใช้จ่ายเฉพาะเดือนนี้ (แทนที่งบมาตรฐาน)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="1000000000"
              step="100"
              placeholder="เช่น 25000"
              value={monthInput}
              onChange={(e) => setMonthInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 font-mono text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={savingMonth}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {savingMonth ? 'กำลังบันทึก...' : 'บันทึกงบเดือนนี้'}
            </button>
          </div>
        </form>

        <form
          onSubmit={handleSaveDefault}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
        >
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              งบประมาณมาตรฐานรายเดือน (Default)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ใช้เป็นวงเงินตั้งต้นอัตโนมัติสำหรับทุกเดือนที่ไม่ได้กำหนดงบเฉพาะ
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="1000000000"
              step="100"
              placeholder="เช่น 20000"
              value={defaultInput}
              onChange={(e) => setDefaultInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 font-mono text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={savingDefault}
              className="px-5 py-2.5 text-sm font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {savingDefault ? 'กำลังบันทึก...' : 'ตั้งเป็นค่าเริ่มต้น'}
            </button>
          </div>
        </form>
      </div>

      {/* 6-Month Budget Adherence History Table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
            ประวัติการควบคุมงบประมาณย้อนหลัง 6 เดือน
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-6">เดือน</th>
                <th className="py-3 px-4 text-right">งบที่ตั้งไว้</th>
                <th className="py-3 px-4 text-right">รายจ่ายจริง</th>
                <th className="py-3 px-4 text-right">ส่วนต่าง</th>
                <th className="py-3 px-6 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {historyRows.map((row) => (
                <tr key={row.monthKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-6 font-medium text-slate-900 dark:text-slate-100">
                    {row.label}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {row.limit > 0 ? `฿${formatTHB(row.limit)}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-white font-semibold">
                    ฿{formatTHB(row.expense)}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${
                      row.diff === null
                        ? 'text-slate-400'
                        : row.diff >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {row.diff === null
                      ? '—'
                      : `${row.diff >= 0 ? '+' : '-'}฿${formatTHB(Math.abs(row.diff))}`}
                  </td>
                  <td className="py-3 px-6 text-right text-xs font-medium">
                    {row.pct === null ? (
                      <span className="text-slate-400">ไม่ได้ตั้งงบ</span>
                    ) : row.pct > 100 ? (
                      <span className="text-red-600 dark:text-red-400">
                        เกินงบ ({row.pct.toFixed(0)}%)
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ตามแผน ({row.pct.toFixed(0)}%)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
