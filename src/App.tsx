import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Menu, Plus } from 'lucide-react';
import { AnalyticsView } from './components/AnalyticsView';
import { AuthLanding } from './components/AuthLanding';
import { BudgetView } from './components/BudgetView';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { LedgerView } from './components/LedgerView';
import { OverviewView } from './components/OverviewView';
import { Sidebar } from './components/Sidebar';
import { TransactionModal } from './components/TransactionModal';
import { useFinanceData } from './hooks/useFinanceData';
import { ActiveTab, Transaction, TransactionInput } from './types/finance';
import { formatThaiMonthFull, getCurrentMonthKey, shiftMonthKey } from './utils/finance';

const TAB_LABELS: Record<ActiveTab, string> = {
  overview: 'ภาพรวมรายเดือน',
  ledger: 'บันทึกรายการ',
  analytics: 'กราฟวิเคราะห์เชิงลึก',
  budget: 'งบประมาณรายเดือน',
};

export default function App() {
  const {
    user,
    authLoading,
    authError,
    signingIn,
    profile,
    transactions,
    budgets,
    dataLoading,
    dataError,
    loginWithGoogle,
    logout,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    saveMonthlyBudget,
    saveDefaultMonthlyBudget,
  } = useFinanceData();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => getCurrentMonthKey());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dbtech-theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('dbtech-theme', darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [darkMode]);

  const currentMonthBudgetLimit = useMemo(() => {
    const specific = budgets.find((b) => b.monthKey === selectedMonthKey);
    if (specific) return specific.limitAmount;
    return profile?.defaultMonthlyBudget ?? 0;
  }, [budgets, selectedMonthKey, profile]);

  const handleOpenAdd = () => {
    setEditingTx(null);
    setTxModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setTxModalOpen(true);
  };

  const handleSaveTransaction = async (input: TransactionInput, editId?: string) => {
    if (editId) {
      await updateTransaction(editId, input);
    } else {
      await addTransaction(input);
      // Automatically switch to the month of the newly added transaction if different
      const newMk = input.date.slice(0, 7);
      if (newMk !== selectedMonthKey) {
        setSelectedMonthKey(newMk);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="font-display text-lg font-bold text-slate-900 dark:text-white">DBTech</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthLanding
        onLogin={loginWithGoogle}
        signingIn={signingIn}
        authError={authError}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((v) => !v)}
      />
    );
  }

  const displayName = profile?.displayName || user.displayName || user.email?.split('@')[0] || 'DBTech User';
  const userEmail = profile?.email || user.email || '';
  const photoURL = profile?.photoURL || user.photoURL || undefined;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userEmail={userEmail}
        displayName={displayName}
        photoURL={photoURL}
        onLogout={logout}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((v) => !v)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Workspace Header (Strict Breadcrumb + Month Selector + Primary CTA) */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              aria-label="เปิดเมนู"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400 dark:text-slate-500 whitespace-nowrap">
                DBTech
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
              <h1 className="font-display font-semibold text-slate-900 dark:text-white truncate">
                {TAB_LABELS[activeTab]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Month Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setSelectedMonthKey((m) => shiftMonthKey(m, -1))}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md cursor-pointer"
                aria-label="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonthKey(getCurrentMonthKey())}
                title="กลับไปเดือนปัจจุบัน"
                className="px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white whitespace-nowrap cursor-pointer"
              >
                {formatThaiMonthFull(selectedMonthKey)}
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonthKey((m) => shiftMonthKey(m, 1))}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md cursor-pointer"
                aria-label="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Primary Action */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">เพิ่มรายการใหม่</span>
              <span className="sm:hidden">เพิ่มรายการ</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {dataError && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300"
            >
              {dataError}
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewView
              transactions={transactions}
              selectedMonthKey={selectedMonthKey}
              monthlyBudgetLimit={currentMonthBudgetLimit}
              loading={dataLoading}
              onAddNew={handleOpenAdd}
              onEdit={handleOpenEdit}
              onDelete={(tx) => setDeletingTx(tx)}
              onViewAllLedger={() => setActiveTab('ledger')}
              onGoToBudget={() => setActiveTab('budget')}
            />
          )}

          {activeTab === 'ledger' && (
            <LedgerView
              transactions={transactions}
              selectedMonthKey={selectedMonthKey}
              onAddNew={handleOpenAdd}
              onEdit={handleOpenEdit}
              onDelete={(tx) => setDeletingTx(tx)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView transactions={transactions} selectedMonthKey={selectedMonthKey} />
          )}

          {activeTab === 'budget' && (
            <BudgetView
              selectedMonthKey={selectedMonthKey}
              transactions={transactions}
              budgets={budgets}
              defaultMonthlyBudget={profile?.defaultMonthlyBudget ?? 0}
              onSaveMonthlyBudget={saveMonthlyBudget}
              onSaveDefaultBudget={saveDefaultMonthlyBudget}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <TransactionModal
        open={txModalOpen}
        initialTransaction={editingTx}
        defaultMonthKey={selectedMonthKey}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
        onSubmit={handleSaveTransaction}
      />

      <ConfirmDeleteModal
        transaction={deletingTx}
        onCancel={() => setDeletingTx(null)}
        onConfirm={deleteTransaction}
      />
    </div>
  );
}
