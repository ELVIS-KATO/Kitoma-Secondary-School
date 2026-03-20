export type UserRole = 'admin' | 'accountant' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'inflow' | 'outflow';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id: string;
  term_id: string | null;
  payer_name: string | null;
  reference_number: string;
  payment_method: PaymentMethod;
  transaction_date: string;
  recorded_by: string;
  receipt_issued: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category_name?: string;
  term_name?: string;
  recorded_by_name?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  description: string | null;
  created_at: string;
  transaction_count: number;
  total_amount: number;
}

export interface Term {
  id: string;
  name: string;
  year: number;
  term_number: 1 | 2 | 3;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  total_inflows: number;
  total_outflows: number;
  net_balance: number;
}

export interface Receipt {
  id: string;
  receipt_number: string;
  transaction_id: string;
  issued_to: string;
  issued_by: string;
  issued_at: string;
  printed_at: string | null;
  issued_by_name?: string;
  transaction_amount?: number;
  transaction_date?: string;
  payment_method?: string;
}

export interface DashboardSummary {
  total_inflows_today: number;
  total_outflows_today: number;
  total_inflows_month: number;
  total_outflows_month: number;
  total_inflows_term: number;
  total_outflows_term: number;
  total_inflows_year: number;
  total_outflows_year: number;
  net_balance: number;
  recent_transactions: Transaction[];
  monthly_cashflow: { month: string; inflows: number; outflows: number }[];
  top_inflow_categories: CategoryBreakdown[];
  top_outflow_categories: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  total_amount: number;
  percentage: number;
}

export interface ReportResponse {
  summary: {
    total_inflows: number;
    total_outflows: number;
    net_position: number;
    transaction_count: number;
  };
  transactions: Transaction[];
  category_breakdown: CategoryBreakdown[];
  opening_balance: number;
  closing_balance: number;
  generated_at: string;
  report_title: string;
  period: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
