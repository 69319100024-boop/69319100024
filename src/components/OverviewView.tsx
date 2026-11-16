import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Transaction } from '../types/finance';
import {
  computeCategoryBreakdown,
  computeMonthlySummary,
  formatCompactTHB,
  formatTHB,
  formatThaiDate,
  formatThaiMonthFull,
  formatThaiMonthShort,
  PAYMENT_METHOD_LABELS,
  shiftMonthKey,
} from '../utils/finance';

interface OverviewViewProps {
  transactions: Transaction[];
  selectedMonthKey: string;
  monthlyBudgetLimit: number;
  loading: boolean;
  onAddNew: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onViewAllLedger: () => void;
  onGoToBudget: () => void;
}

export function OverviewView({
  transactions,
  selectedMonthKey,
  monthlyBudgetLimit,
  loading,
  onAddNew,
  onEdit,
  onDelete,
  onViewAllLedger,
  onGoToBudget,
}: OverviewViewProps) {
  const [trendRange, setTrendRange] = useState<6 | 12>(6);

  const currentSummary = useMemo(
    () => computeMonthlySummary(transactions, selectedMonthKey),
    [transactions, selectedMonthKey]
  );

  const prevMonthKey = useMemo(() => shiftMonthKey(selectedMonthKey, -1), [selectedMonthKey]);
  const prevSummary = useMemo(
    () => computeMonthlySummary(transactions, prevMonthKey),
    [transactions, prevMonthKey]
  );

  const expenseBreakdown = useMemo(
    () => computeCategoryBreakdown(transactions, selectedMonthKey, 'expense'),
    [transactions, selectedMonthKey]
  );

  const trendData = useMemo(() => {
    const data = [];
    for (let i = trendRange - 1; i >= 0; i -= 1) {
      const mk = shiftMonthKey(selectedMonthKey, -i);
      const s = computeMonthlySummary(transactions, mk);
      data.push({
        monthKey: mk,
        label: formatThaiMonthShort(mk),
        income: s.income,
        expense: s.expense,
        net: s.net,
      });
    }
    return data;
  }, [transactions, selectedMonthKey, trendRange]);

  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.monthKey === selectedMonthKey).slice(0, 8),
    [transactions, selectedMonthKey]
  );

  const incomeDiffPct =
    prevSummary.income > 0
      ? ((currentSummary.income - prevSummary.income) / prevSummary.income) * 100
      : null;

  const expenseDiffPct =
    prevSummary.expense > 0
      ? ((currentSummary.expense - prevSummary.expense) / prevSummary.expense) * 100
      : null;

  const budgetRemaining = monthlyBudgetLimit > 0 ? monthlyBudgetLimit - currentSummary.expense : null;
  const budgetUsedPct =
    monthlyBudgetLimit > 0 ? (currentSummary.expense / monthlyBudgetLimit) * 100 : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5"
            >
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
              <div className="h-7 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
          <div className="lg:col-span-5 h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Strip (4 Columns) */}
      <section aria-label="ตัวเลขสรุปประจำเดือน" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Income */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>รายรับเดือนนี้</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            +฿{formatTHB(currentSummary.income)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {incomeDiffPct !== null
              ? `${incomeDiffPct >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(incomeDiffPct).toFixed(1)}% เทียบเดือนก่อน`
              : 'ไม่มีข้อมูลเดือนก่อนหน้า'}
          </p>
        </div>

        {/* Expense */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>รายจ่ายเดือนนี้</span>
            <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <p className="font-mono text-2xl font-bold text-red-600 dark:text-red-400 mt-2 tabular-nums">
            -฿{formatTHB(currentSummary.expense)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {expenseDiffPct !== null
              ? `${expenseDiffPct >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(expenseDiffPct).toFixed(1)}% เทียบเดือนก่อน`
              : 'ไม่มีข้อมูลเดือนก่อนหน้า'}
          </p>
        </div>

        {/* Net Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>ยอดคงเหลือสุทธิ</span>
            <Wallet className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          </div>
          <p
            className={`font-mono text-2xl font-bold mt-2 tabular-nums ${
              currentSummary.net >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {currentSummary.net < 0 ? '-' : ''}฿{formatTHB(Math.abs(currentSummary.net))}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {currentSummary.income > 0
              ? `อัตราการออม ${currentSummary.savingsRate.toFixed(1)}% · ${currentSummary.count} รายการ`
              : `${currentSummary.count} รายการในเดือนนี้`}
          </p>
        </div>

        {/* Budget Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>งบประมาณคงเหลือ</span>
              <button
                type="button"
                onClick={onGoToBudget}
                className="text-blue-700 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              >
                ตั้งงบ
              </button>
            </div>
            {monthlyBudgetLimit > 0 && budgetRemaining !== null && budgetUsedPct !== null ? (
              <>
                <p
                  className={`font-mono text-2xl font-bold mt-2 tabular-nums ${
                    budgetRemaining < 0
                      ? 'text-red-600 dark:text-red-400'
                      : budgetUsedPct >= 80
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {budgetRemaining < 0 ? '-' : ''}฿{formatTHB(Math.abs(budgetRemaining))}
                </p>
                <div className="mt-2.5">
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        budgetUsedPct > 100
                          ? 'bg-red-600'
                          : budgetUsedPct >= 80
                          ? 'bg-amber-500'
                          : 'bg-blue-700'
                      }`}
                      style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
                    ใช้ไป {budgetUsedPct.toFixed(0)}% จากงบ ฿{formatTHB(monthlyBudgetLimit, false)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="font-mono text-xl font-semibold text-slate-400 dark:text-slate-500 mt-2">
                  ยังไม่กำหนดงบ
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  กำหนดเพดานรายจ่ายเพื่อติดตามการใช้เงิน
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Income vs Expense Bar Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                เปรียบเทียบรายรับและรายจ่ายรายเดือน
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ย้อนหลัง {trendRange} เดือนสิ้นสุดที่ {formatThaiMonthFull(selectedMonthKey)}
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setTrendRange(6)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  trendRange === 6
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                6 เดือน
              </button>
              <button
                type="button"
                onClick={() => setTrendRange(12)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  trendRange === 12
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                12 เดือน
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatCompactTHB(Number(v))}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm text-xs space-y-1.5">
                        <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
                        {payload.map((entry) => (
                          <div key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
                            <span className="text-slate-600 dark:text-slate-400">
                              {entry.dataKey === 'income' ? 'รายรับ' : 'รายจ่าย'}
                            </span>
                            <span
                              className={`font-mono font-semibold tabular-nums ${
                                entry.dataKey === 'income'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              ฿{formatTHB(Number(entry.value || 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="income" name="รายรับ" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expense" name="รายจ่าย" fill="#DC2626" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
              รายรับ (Income)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-red-600 inline-block" />
              รายจ่าย (Expense)
            </span>
          </div>
        </div>

        {/* Category Expense Donut Breakdown */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              สัดส่วนรายจ่ายตามหมวดหมู่
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ประจำเดือน {formatThaiMonthFull(selectedMonthKey)}
            </p>
          </div>

          {expenseBreakdown.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                ยังไม่มีรายจ่ายในเดือนนี้
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                เมื่อคุณบันทึกรายจ่าย ระบบจะสรุปสัดส่วนแต่ละหมวดหมู่ให้เห็นทันที
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between gap-4">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown.items}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={56}
                      outerRadius={84}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {expenseBreakdown.items.map((item) => (
                        <Cell key={item.category} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as {
                          category: string;
                          amount: number;
                          percentage: number;
                        };
                        return (
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-sm text-xs">
                            <p className="font-medium text-slate-900 dark:text-white">{d.category}</p>
                            <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 tabular-nums">
                              ฿{formatTHB(d.amount)} ({d.percentage.toFixed(1)}%)
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenseBreakdown.items.slice(0, 5).map((item) => (
                  <div key={item.category} className="py-2 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-700 dark:text-slate-300 truncate">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                      <span className="text-slate-400">{item.percentage.toFixed(1)}%</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ฿{formatTHB(item.amount, false)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recent Transactions Table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              รายการล่าสุดประจำเดือน {formatThaiMonthFull(selectedMonthKey)}
            </h2>
          </div>
          {monthTransactions.length > 0 && (
            <button
              type="button"
              onClick={onViewAllLedger}
              className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              ดูรายการทั้งหมด
            </button>
          )}
        </div>

        {monthTransactions.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              ยังไม่มีรายการรายรับ-รายจ่ายในเดือน {formatThaiMonthFull(selectedMonthKey)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              เริ่มต้นบันทึกรายการแรกของคุณเพื่อดูสรุปยอดและกราฟวิเคราะห์ข้อมูลแบบเรียลไทม์
            </p>
            <button
              type="button"
              onClick={onAddNew}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกรายการแรก</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-6">วันที่</th>
                  <th className="py-3 px-4">รายการ</th>
                  <th className="py-3 px-4">หมวดหมู่และช่องทาง</th>
                  <th className="py-3 px-4 text-right">จำนวนเงิน</th>
                  <th className="py-3 px-6 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {monthTransactions.map((tx) => (
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {tx.note}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      <span>{tx.category}</span>
                      <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                      <span>{PAYMENT_METHOD_LABELS[tx.paymentMethod]}</span>
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
      </section>
    </div>
  );
}
