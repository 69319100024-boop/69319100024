import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { MonthlyBudget, Transaction, TransactionInput, UserProfile } from '../types/finance';

export function useFinanceData() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // 1. Auth Listener & Profile Bootstrap
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      setAuthError(null);

      if (!firebaseUser) {
        setProfile(null);
        setProfileReady(false);
        setTransactions([]);
        setBudgets([]);
        return;
      }

      if (!firebaseUser.email || !firebaseUser.emailVerified) {
        setAuthError('กรุณาเข้าสู่ระบบด้วยบัญชี Google (Gmail) ที่ยืนยันอีเมลแล้ว');
        setProfileReady(false);
        return;
      }

      setDataLoading(true);
      const userRef = doc(db, 'users', firebaseUser.uid);

      try {
        const snap = await getDoc(userRef);
        const safeDisplayName = (
          firebaseUser.displayName ||
          firebaseUser.email.split('@')[0] ||
          'DBTech User'
        )
          .trim()
          .slice(0, 100);
        const safeEmail = firebaseUser.email.trim().slice(0, 254);
        const safePhoto = firebaseUser.photoURL ? firebaseUser.photoURL.slice(0, 500) : undefined;

        if (!snap.exists()) {
          const payload: Record<string, unknown> = {
            uid: firebaseUser.uid,
            email: safeEmail,
            displayName: safeDisplayName,
            defaultMonthlyBudget: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (safePhoto) {
            payload.photoURL = safePhoto;
          }
          await setDoc(userRef, payload);
        } else {
          const existingData = snap.data();
          const updates: Record<string, unknown> = {};
          if (existingData.displayName !== safeDisplayName) {
            updates.displayName = safeDisplayName;
          }
          if (existingData.email !== safeEmail) {
            updates.email = safeEmail;
          }
          if (safePhoto && existingData.photoURL !== safePhoto) {
            updates.photoURL = safePhoto;
          }
          if (Object.keys(updates).length > 0) {
            updates.updatedAt = serverTimestamp();
            await updateDoc(userRef, updates);
          }
        }
        setProfileReady(true);
      } catch (err) {
        setDataError('ไม่สามารถเชื่อมต่อข้อมูลบัญชีผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง');
        setDataLoading(false);
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
      }
    });

    return () => unsub();
  }, []);

  // 2. Real-time Firestore Subscriptions
  useEffect(() => {
    if (!user || !profileReady) return;

    setDataLoading(true);
    setDataError(null);

    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(
      profileRef,
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
      },
      (err) => {
        setDataError('โหลดข้อมูลโปรไฟล์ไม่สำเร็จ');
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      }
    );

    const txQuery = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubTx = onSnapshot(
      txQuery,
      (snapshot) => {
        const list: Transaction[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Transaction, 'id'>),
        }));
        // Sort newest date first, then newest createdAt
        list.sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          const aSec = a.createdAt?.seconds ?? 0;
          const bSec = b.createdAt?.seconds ?? 0;
          return bSec - aSec;
        });
        setTransactions(list);
        setDataLoading(false);
      },
      (err) => {
        setDataError('โหลดรายการรายรับ-รายจ่ายไม่สำเร็จ');
        setDataLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'transactions');
      }
    );

    const budgetQuery = query(collection(db, 'budgets'), where('userId', '==', user.uid));
    const unsubBudgets = onSnapshot(
      budgetQuery,
      (snapshot) => {
        const list: MonthlyBudget[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<MonthlyBudget, 'id'>),
        }));
        setBudgets(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'budgets');
      }
    );

    return () => {
      unsubProfile();
      unsubTx();
      unsubBudgets();
    };
  }, [user, profileReady]);

  // 3. Auth Actions
  const loginWithGoogle = useCallback(async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('คุณได้ปิดหน้าต่างเข้าสู่ระบบก่อนเสร็จสิ้น');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้');
      } else {
        setAuthError('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google กรุณาลองใหม่');
      }
    } finally {
      setSigningIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  // 4. CRUD Actions
  const addTransaction = useCallback(
    async (input: TransactionInput) => {
      if (!user) throw new Error('User not authenticated');
      const cleanTitle = input.title.trim().slice(0, 120);
      const cleanCategory = input.category.trim().slice(0, 60);
      const cleanAmount = Math.min(Math.max(Number(input.amount.toFixed(2)), 0.01), 1_000_000_000);
      const cleanDate = input.date.trim().slice(0, 10);
      const monthKey = cleanDate.slice(0, 7);
      const cleanNote = (input.note || '').trim().slice(0, 500);

      if (!cleanTitle || !cleanCategory || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        throw new Error('ข้อมูลรายการไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      }

      const txRef = doc(collection(db, 'transactions'));
      const payload = {
        userId: user.uid,
        type: input.type,
        title: cleanTitle,
        amount: cleanAmount,
        category: cleanCategory,
        date: cleanDate,
        monthKey,
        paymentMethod: input.paymentMethod,
        note: cleanNote,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(txRef, payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `transactions/${txRef.id}`);
      }
    },
    [user]
  );

  const updateTransaction = useCallback(
    async (id: string, input: TransactionInput) => {
      if (!user) throw new Error('User not authenticated');
      const cleanTitle = input.title.trim().slice(0, 120);
      const cleanCategory = input.category.trim().slice(0, 60);
      const cleanAmount = Math.min(Math.max(Number(input.amount.toFixed(2)), 0.01), 1_000_000_000);
      const cleanDate = input.date.trim().slice(0, 10);
      const monthKey = cleanDate.slice(0, 7);
      const cleanNote = (input.note || '').trim().slice(0, 500);

      if (!cleanTitle || !cleanCategory || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        throw new Error('ข้อมูลรายการไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      }

      const txRef = doc(db, 'transactions', id);
      try {
        await updateDoc(txRef, {
          type: input.type,
          title: cleanTitle,
          amount: cleanAmount,
          category: cleanCategory,
          date: cleanDate,
          monthKey,
          paymentMethod: input.paymentMethod,
          note: cleanNote,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `transactions/${id}`);
      }
    },
    [user]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      const txRef = doc(db, 'transactions', id);
      try {
        await deleteDoc(txRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `transactions/${id}`);
      }
    },
    [user]
  );

  const saveMonthlyBudget = useCallback(
    async (monthKey: string, limitAmount: number) => {
      if (!user) throw new Error('User not authenticated');
      const cleanLimit = Math.min(Math.max(Number(limitAmount.toFixed(2)), 0), 1_000_000_000);
      const budgetId = `${user.uid}_${monthKey}`;
      const budgetRef = doc(db, 'budgets', budgetId);

      try {
        const existingSnap = await getDoc(budgetRef);
        if (existingSnap.exists()) {
          await updateDoc(budgetRef, {
            limitAmount: cleanLimit,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(budgetRef, {
            userId: user.uid,
            monthKey,
            limitAmount: cleanLimit,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `budgets/${budgetId}`);
      }
    },
    [user]
  );

  const saveDefaultMonthlyBudget = useCallback(
    async (limitAmount: number) => {
      if (!user) throw new Error('User not authenticated');
      const cleanLimit = Math.min(Math.max(Number(limitAmount.toFixed(2)), 0), 1_000_000_000);
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          defaultMonthlyBudget: cleanLimit,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    },
    [user]
  );

  return {
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
  };
}
