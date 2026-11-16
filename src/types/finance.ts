import { Timestamp } from 'firebase/firestore';

export type TransactionType = 'income' | 'expense';

export type PaymentMethod =
  | 'promptpay'
  | 'bank_transfer'
  | 'cash'
  | 'credit_card'
  | 'other';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  defaultMonthlyBudget: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  title: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  paymentMethod: PaymentMethod;
  note?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TransactionInput {
  type: TransactionType;
  title: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface MonthlyBudget {
  id: string;
  userId: string;
  monthKey: string; // YYYY-MM
  limitAmount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ActiveTab = 'overview' | 'ledger' | 'analytics' | 'budget';
