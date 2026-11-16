import { BarChart3, CalendarRange, Lock, ShieldCheck } from 'lucide-react';

interface AuthLandingProps {
  onLogin: () => Promise<void>;
  signingIn: boolean;
  authError: string | null;
  darkMode: boolean;
  onToggleDark: () => void;
}

export function AuthLanding({
  onLogin,
  signingIn,
  authError,
  darkMode,
  onToggleDark,
}: AuthLandingProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Bar Contract: Brand — Quiet Spacer — Action */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              DBTech
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={onToggleDark}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {darkMode ? 'โหมดสว่าง' : 'โหมดมืด'}
            </button>
          </div>
        </div>
      </header>

      {/* Main 1440px Balanced Split Workspace */}
      <main className="flex-1 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Left Column: Core Narrative & Google Sign-In CTA */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-medium tracking-wide text-blue-700 dark:text-blue-400 mb-3">
              DBTech Personal & Business Finance · Cloud Ledger
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.18] [text-wrap:balance] mb-5">
              จัดการรายรับรายจ่าย สรุปผลรายเดือน และวิเคราะห์กระแสเงินสดอย่างเป็นระบบ
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mb-8">
              บันทึกทุกรายการทางการเงินแบบเรียลไทม์ พร้อมกราฟวิเคราะห์สัดส่วนค่าใช้จ่าย
              เปรียบเทียบยอดรายเดือน และตั้งงบประมาณควบคุมการใช้จ่ายอย่างแม่นยำ
              ซิงก์ข้อมูลอย่างปลอดภัยด้วยบัญชี Google (Gmail)
            </p>

            {/* Auth Action Area */}
            <div className="max-w-md">
              <button
                type="button"
                onClick={onLogin}
                disabled={signingIn}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <svg className="w-5 h-5 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>{signingIn ? 'กำลังเชื่อมต่อบัญชี Google...' : 'เข้าสู่ระบบด้วย Gmail / Google'}</span>
              </button>

              {authError && (
                <div
                  role="alert"
                  className="mt-4 p-3.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300"
                >
                  {authError}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="flex items-start gap-2.5">
                  <CalendarRange className="w-4 h-4 text-blue-700 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">สรุปผลรายเดือน</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">เปรียบเทียบรายรับ-รายจ่าย</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <BarChart3 className="w-4 h-4 text-blue-700 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">กราฟวิเคราะห์ข้อมูล</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">สัดส่วนหมวดหมู่และแนวโน้ม</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">ข้อมูลส่วนตัวปลอดภัย</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">แยกสิทธิ์ตามบัญชี Gmail</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Ledger Preview Structure */}
          <div className="lg:col-span-6 flex items-stretch">
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">ตัวอย่างรายงานสรุปรายเดือน</p>
                    <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white mt-0.5">
                      พฤศจิกายน 2569
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Firebase Cloud Sync</span>
                  </div>
                </div>

                {/* Preview KPI Row */}
                <div className="grid grid-cols-3 gap-4 py-5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">รายรับรวม</p>
                    <p className="font-mono text-lg sm:text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                      +฿68,500
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">รายจ่ายรวม</p>
                    <p className="font-mono text-lg sm:text-xl font-semibold text-red-600 dark:text-red-400 mt-1 tabular-nums">
                      -฿29,420
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">คงเหลือสุทธิ</p>
                    <p className="font-mono text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mt-1 tabular-nums">
                      ฿39,080
                    </p>
                  </div>
                </div>

                {/* Preview Bar Chart Illustration (Clean SVG) */}
                <div className="py-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <span>แนวโน้มรายรับ-รายจ่าย 6 เดือน</span>
                    <span>หน่วย: บาท (THB)</span>
                  </div>
                  <div className="grid grid-cols-6 gap-3 items-end h-32 pt-2">
                    {[
                      { label: 'มิ.ย.', inc: 72, exp: 42 },
                      { label: 'ก.ค.', inc: 68, exp: 48 },
                      { label: 'ส.ค.', inc: 84, exp: 44 },
                      { label: 'ก.ย.', inc: 76, exp: 39 },
                      { label: 'ต.ค.', inc: 90, exp: 52 },
                      { label: 'พ.ย.', inc: 88, exp: 38 },
                    ].map((bar) => (
                      <div key={bar.label} className="flex flex-col items-center gap-2 h-full justify-end">
                        <div className="w-full flex items-end justify-center gap-1 h-24">
                          <div
                            className="w-3 bg-emerald-600 dark:bg-emerald-500 rounded-t-sm"
                            style={{ height: `${bar.inc}%` }}
                          />
                          <div
                            className="w-3 bg-slate-300 dark:bg-slate-600 rounded-t-sm"
                            style={{ height: `${bar.exp}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {bar.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Ledger Rows */}
                <div className="pt-5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
                    ตัวอย่างรายการบันทึก
                  </p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="py-2.5 flex items-center justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">เงินเดือนและค่าตอบแทน</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">เงินเดือนประจำ · โอนผ่านธนาคาร</p>
                      </div>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +฿55,000.00
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">ค่าเช่าที่พักและสาธารณูปโภค</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">ที่อยู่อาศัยและบิล · พร้อมเพย์</p>
                      </div>
                      <span className="font-mono font-semibold text-red-600 dark:text-red-400 tabular-nums">
                        -฿11,500.00
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">งานออกแบบระบบ DBTech</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">ฟรีแลนซ์และโปรเจกต์ · โอนผ่านธนาคาร</p>
                      </div>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +฿13,500.00
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
