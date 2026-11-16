import {
  BarChart3,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Moon,
  Sun,
  Target,
  X,
} from 'lucide-react';
import { ActiveTab } from '../types/finance';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  userEmail: string;
  displayName: string;
  photoURL?: string;
  onLogout: () => Promise<void>;
  darkMode: boolean;
  onToggleDark: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: ActiveTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'ภาพรวมรายเดือน', icon: LayoutDashboard },
  { id: 'ledger', label: 'บันทึกรายการ', icon: ListOrdered },
  { id: 'analytics', label: 'กราฟวิเคราะห์เชิงลึก', icon: BarChart3 },
  { id: 'budget', label: 'งบประมาณรายเดือน', icon: Target },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  userEmail,
  displayName,
  photoURL,
  onLogout,
  darkMode,
  onToggleDark,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const initials = (displayName || userEmail || 'U').slice(0, 2).toUpperCase();

  const content = (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64">
      <div>
        {/* Brand Zone */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
            DBTech
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md cursor-pointer"
            aria-label="ปิดเมนู"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1" aria-label="เมนูหลัก">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls & Account */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <button
          type="button"
          onClick={onToggleDark}
          className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-lg transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{darkMode ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}</span>
          </span>
        </button>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="ออกจากระบบ"
            aria-label="ออกจากระบบ"
            className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">{content}</aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
