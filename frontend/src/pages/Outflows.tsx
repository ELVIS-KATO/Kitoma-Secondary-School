import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Download, FileSpreadsheet, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import TransactionTable from '@/components/transactions/TransactionTable';
import client from '@/api/client';
import { Transaction, PaginatedResponse, Category, Term } from '@/types';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatters';

export default function Outflows() {
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [termId, setTermId] = useState('');

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await client.get<PaginatedResponse<Transaction>>('/transactions/', {
        params: {
          type: 'outflow',
          page,
          size: 20,
          search: search || undefined,
          category_id: categoryId || undefined,
          term_id: termId || undefined,
        }
      });
      setTransactions(response.data.items);
      setTotal(response.data.total);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [catRes, termRes] = await Promise.all([
        client.get<Category[]>('/categories/'),
        client.get<Term[]>('/terms/')
      ]);
      setCategories(catRes.data.filter(c => c.type === 'outflow'));
      setTerms(termRes.data);
    } catch (error) {
      console.error('Failed to fetch metadata');
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, search, categoryId, termId]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await client.delete(`/transactions/${id}`);
        toast.success('Transaction deleted');
        fetchTransactions();
      } catch (error) {
        toast.error('Failed to delete transaction');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cash Outflows</h1>
          <p className="text-slate-500 text-sm">Monitor and record all school expenses and payments</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="h-10 border-slate-200">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
            Export CSV
          </Button>
          <Button className="h-10 bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Outflow
          </Button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-red-50 border-red-100 shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-red-600 text-xs font-bold uppercase tracking-wider">Total Filtered Outflows</p>
              <h3 className="text-2xl font-bold text-red-700 mt-1">
                {formatCurrency(transactions.reduce((acc, curr) => acc + curr.amount, 0))}
              </h3>
            </div>
            <div className="p-2 bg-white rounded-lg text-red-600 shadow-sm">
              <Download className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Expense Count</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{total}</h3>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <Filter className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200 shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Average Outflow</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {total > 0 ? formatCurrency(transactions.reduce((acc, curr) => acc + curr.amount, 0) / (transactions.length || 1)) : 'UGX 0'}
              </h3>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search paid to or ref..." 
                className="pl-10 h-10 border-slate-200 focus:ring-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select 
              className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
            >
              <option value="">All Terms</option>
              {terms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <Button variant="outline" className="h-10 border-slate-200 text-slate-600" onClick={() => {
              setSearch('');
              setCategoryId('');
              setTermId('');
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <TransactionTable 
        transactions={transactions}
        isLoading={isLoading}
        onEdit={(t) => console.log('Edit', t)}
        onDelete={handleDelete}
        onPrintReceipt={() => {}}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-slate-500">
            Showing {transactions.length} of {total} transactions
          </p>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {[...Array(totalPages)].map((_, i) => (
                <Button 
                  key={i}
                  variant={page === i + 1 ? 'default' : 'outline'}
                  size="sm"
                  className={`w-8 h-8 p-0 ${page === i + 1 ? 'bg-indigo-600' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
