import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PaymentMethod, Transaction } from '../types/finance';
import {
  computeCategoryBreakdown,
  computeMonthlySummary,
  formatCompactTHB,
  formatTHB,
  formatThaiMonthFull,
  formatThaiMonthShort,
  getDaysInMonth,
  PAYMENT_METHOD_LABELS,
  shiftMonthKey,
} from '../utils/finance';

interface AnalyticsViewProps {
  transactions: Transaction[];
  selectedMonthKey: string;
}

export function AnalyticsView({ transactions, selectedMonthKey }: AnalyticsViewProps) {
  // 1. 12-Month Composed Trend
  const yearlyTrend = useMemo(() => {
    const arr = [];
    for (let i = 11; i >= 0; i -= 1) {
      const mk = shiftMonthKey(selectedMonthKey, -i);
      const s = computeMonthlySummary(transactions, mk);
      arr.push({
        monthKey: mk,
        label: formatThaiMonthShort(mk),
        income: s.income,
        expense: s.expense,
        net: s.net,
      });
    }
    return arr;
  }, [transactions, selectedMonthKey]);

  // 2. Daily Cashflow for Selected Month
  const dailyData = useMemo(() => {
    const daysCount = getDaysInMonth(selectedMonthKey);
    const map = new Map<number, { income: number; expense: number }>();
    for (let d = 1; d <= daysCount; d += 1) {
      map.set(d, { income: 0, expense: 0 });
    }
    for (const tx of transactions) {
      if (tx.monthKey !== selectedMonthKey) continue;
      const dayNum = Number(tx.date.slice(8, 10));
      const curr = map.get(dayNum);
      if (curr) {
        if (tx.type === 'income') curr.income += tx.amount;
        else curr.expense += tx.amount;
      }
    }
    return Array.from(map.entries()).map(([day, val]) => ({
      day: String(day),
      income: val.income,
      expense: val.expense,
    }));
  }, [transactions, selectedMonthKey]);

  // 3. Category Breakdowns (Income & Expense)
  const expenseCategories = useMemo(
    () => computeCategoryBreakdown(transactions, selectedMonthKey, 'expense'),
    [transactions, selectedMonthKey]
  );

  const incomeCategories = useMemo(
    () => computeCategoryBreakdown(transactions, selectedMonthKey, 'income'),
    [transactions, selectedMonthKey]
  );

  // 4. Payment Channel Distribution (Selected Month Expense)
  const paymentChannels = useMemo(() => {
    const map = new Map<PaymentMethod, number>();
    let total = 0;
    for (const tx of transactions) {
      if (tx.monthKey !== selectedMonthKey || tx.type !== 'expense') continue;
      total += tx.amount;
      map.set(tx.paymentMethod, (map.get(tx.paymentMethod) || 0) + tx.amount);
    }
    return Array.from(map.entries())
      .map(([method, amount]) => ({
        method,
        label: PAYMENT_METHOD_LABELS[method] || method,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, selectedMonthKey]);

  // 5. Key Analytical Ratios
  const monthSummary = useMemo(
    () => computeMonthlySummary(transactions, selectedMonthKey),
    [transactions, selectedMonthKey]
  );
  const daysInSelected = getDaysInMonth(selectedMonthKey);
  const avgDailyExpense = monthSummary.expense / daysInSelected;
  const highestExpenseDay = useMemo(() => {
    let peak = { day: '-', amount: 0 };
    for (const d of dailyData) {
      if (d.expense > peak.amount) {
        peak = { day: d.day, amount: d.expense };
      }
    }
    return peak;
  }, [dailyData]);

  return (
    <div className="space-y-6">
      {/* Analytical Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">รายจ่ายเฉลี่ยต่อวันในเดือน</p>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            ฿{formatTHB(avgDailyExpense)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            คำนวณเฉลี่ย {daysInSelected} วันใน {formatThaiMonthFull(selectedMonthKey)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">วันที่มียอดใช้จ่ายสูงสุด</p>
          <p className="font-mono text-2xl font-bold text-red-600 dark:text-red-400 mt-2 tabular-nums">
            {highestExpenseDay.amount > 0 ? `฿${formatTHB(highestExpenseDay.amount)}` : '—'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {highestExpenseDay.amount > 0
              ? `วันที่ ${highestExpenseDay.day} ${formatThaiMonthFull(selectedMonthKey)}`
              : 'ยังไม่มีข้อมูลรายจ่ายในเดือนนี้'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">อัตราการออมสุทธิ</p>
          <p
            className={`font-mono text-2xl font-bold mt-2 tabular-nums ${
              monthSummary.savingsRate >= 20
                ? 'text-emerald-600 dark:text-emerald-400'
                : monthSummary.savingsRate > 0
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {monthSummary.income > 0 ? `${monthSummary.savingsRate.toFixed(1)}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {monthSummary.income > 0
              ? `คงเหลือ ฿${formatTHB(monthSummary.net, false)} จากรายรับ`
              : 'ยังไม่มีข้อมูลรายรับในเดือนนี้'}
          </p>
        </div>
      </div>

      {/* 12-Month Composed Cashflow Trend */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            แนวโน้มกระแสเงินสดและยอดคงเหลือสุทธิ (12 เดือน)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            เปรียบเทียบรายรับ รายจ่าย และเส้นแนวโน้มเงินออมสุทธิในรอบปีที่ผ่านมา
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={yearlyTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
                width={68}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm text-xs space-y-1.5">
                      <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
                      {payload.map((entry) => {
                        const key = String(entry.dataKey);
                        const title =
                          key === 'income' ? 'รายรับ' : key === 'expense' ? 'รายจ่าย' : 'คงเหลือสุทธิ';
                        return (
                          <div key={key} className="flex items-center justify-between gap-5">
                            <span className="text-slate-600 dark:text-slate-400">{title}</span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                              ฿{formatTHB(Number(entry.value || 0))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              <Bar dataKey="income" name="รายรับ" fill="#059669" radius={[3, 3, 0, 0]} maxBarSize={22} />
              <Bar dataKey="expense" name="รายจ่าย" fill="#DC2626" radius={[3, 3, 0, 0]} maxBarSize={22} />
              <Line
                type="monotone"
                dataKey="net"
                name="คงเหลือสุทธิ"
                stroke="#1D4ED8"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#1D4ED8' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
            รายรับ
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-red-600 inline-block" />
            รายจ่าย
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-blue-700 inline-block" />
            ยอดคงเหลือสุทธิ
          </span>
        </div>
      </section>

      {/* Daily Activity Bar Chart */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            รายรับ-รายจ่ายรายวัน ({formatThaiMonthFull(selectedMonthKey)})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            แสดงการกระจายตัวของรายรับและรายจ่ายตั้งแต่วันที่ 1 ถึง {daysInSelected}
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatCompactTHB(Number(v))}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm text-xs space-y-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        วันที่ {label} {formatThaiMonthFull(selectedMonthKey)}
                      </p>
                      {payload.map((entry) => (
                        <div key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
                          <span className="text-slate-600 dark:text-slate-400">
                            {entry.dataKey === 'income' ? 'รายรับ' : 'รายจ่าย'}
                          </span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                            ฿{formatTHB(Number(entry.value || 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Bar dataKey="income" fill="#059669" radius={[2, 2, 0, 0]} maxBarSize={14} />
              <Bar dataKey="expense" fill="#DC2626" radius={[2, 2, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Breakdown Grid: Expense Categories, Income Sources, Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Categories */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-4">
            จัดอันดับหมวดหมู่รายจ่าย
          </h3>
          {expenseCategories.items.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-6">ไม่มีข้อมูลรายจ่ายในเดือนนี้</p>
          ) : (
            <div className="space-y-3.5">
              {expenseCategories.items.map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate pr-2">
                      {item.category}
                    </span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-white shrink-0">
                      ฿{formatTHB(item.amount, false)}{' '}
                      <span className="text-slate-400">({item.percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Income Sources */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-4">
            แหล่งที่มาของรายรับ
          </h3>
          {incomeCategories.items.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-6">ไม่มีข้อมูลรายรับในเดือนนี้</p>
          ) : (
            <div className="space-y-3.5">
              {incomeCategories.items.map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate pr-2">
                      {item.category}
                    </span>
                    <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                      +฿{formatTHB(item.amount, false)}{' '}
                      <span className="text-slate-400">({item.percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Payment Methods */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-4">
            ช่องทางการใช้จ่าย
          </h3>
          {paymentChannels.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-6">ไม่มีข้อมูลการใช้จ่ายในเดือนนี้</p>
          ) : (
            <div className="space-y-3.5">
              {paymentChannels.map((ch) => (
                <div key={ch.method}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate pr-2">
                      {ch.label}
                    </span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-white shrink-0">
                      ฿{formatTHB(ch.amount, false)}{' '}
                      <span className="text-slate-400">({ch.percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-700"
                      style={{ width: `${ch.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
