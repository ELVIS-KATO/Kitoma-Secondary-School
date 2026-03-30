import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Download, FileSpreadsheet, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') {
      openAddModal();
    }
  }, [searchParams]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      payer_name: '',
      amount: '',
      category_id: '',
      payment_method: 'cash',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      term_id: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setFormData({
      payer_name: t.payer_name || '',
      amount: t.amount.toString(),
      category_id: t.category_id || '',
      payment_method: t.payment_method || 'cash',
      description: t.description || '',
      transaction_date: t.transaction_date || new Date().toISOString().split('T')[0],
      term_id: t.term_id || '',
    });
    setIsModalOpen(true);
  };

  const handlePrintReceipt = async (id: string) => {
    try {
      const response = await client.get(`/receipts/transaction/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Voucher_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to generate payment voucher PDF');
    }
  };

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    payer_name: '',
    amount: '',
    category_id: '',
    payment_method: 'cash',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    term_id: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      payer_name: '',
      amount: '',
      category_id: '',
      payment_method: 'cash',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      term_id: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        type: 'outflow',
        term_id: formData.term_id || undefined,
        category_id: formData.category_id || undefined,
      };
      
      if (editingId) {
        await client.put(`/transactions/${editingId}`, payload);
        toast.success('Outflow updated successfully');
      } else {
        const response = await client.post('/transactions/', payload);
        toast.success('Outflow recorded successfully');
        // Auto-print voucher for new outflows
        handlePrintReceipt(response.data.id);
      }
      
      closeModal();
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to record outflow');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cash Outflows</h1>
          <p className="text-muted-foreground text-sm">Monitor and record all school expenses and payments</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="h-10 border-border">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
            Export CSV
          </Button>
          <Button className="h-10 bg-danger hover:bg-danger/90 text-white" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Outflow
          </Button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-border">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-foreground">
                  {editingId ? 'Edit Outflow' : 'Record New Outflow'}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={closeModal}>
                  <Plus className="w-5 h-5 rotate-45" />
                </Button>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-foreground">Recipient Name (Paid To)</label>
                    <Input 
                      name="payer_name" 
                      placeholder="e.g. Supplier Name / Staff Name" 
                      required 
                      value={formData.payer_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Amount (UGX)</label>
                    <Input 
                      name="amount" 
                      type="number" 
                      placeholder="0.00" 
                      required 
                      value={formData.amount}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Category</label>
                    <select 
                      name="category_id"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      value={formData.category_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Payment Method</label>
                    <select 
                      name="payment_method"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      value={formData.payment_method}
                      onChange={handleInputChange}
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">School Term</label>
                    <select 
                      name="term_id"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      value={formData.term_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Term</option>
                      {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Date</label>
                  <Input 
                    name="transaction_date" 
                    type="date" 
                    required 
                    value={formData.transaction_date}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <textarea 
                    name="description"
                    className="w-full h-20 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Provide details about this payment..."
                    required
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
              <div className="p-6 pt-0 border-t border-border/50 flex justify-end space-x-3 mt-4">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" className="bg-danger hover:bg-danger/90 text-white" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Outflow' : 'Save & Print Voucher')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-danger/10 border-danger/20 shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-danger text-xs font-bold uppercase tracking-wider">Total Filtered Outflows</p>
              <h3 className="text-2xl font-bold text-danger mt-1">
                {formatCurrency(transactions.reduce((acc, curr) => acc + Number(curr.amount), 0))}
              </h3>
            </div>
            <div className="p-2 bg-background rounded-lg text-danger shadow-sm">
              <Download className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Expense Count</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{total}</h3>
            </div>
            <div className="p-2 bg-muted rounded-lg text-muted-foreground">
              <Filter className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Average Outflow</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {total > 0 ? formatCurrency(transactions.reduce((acc, curr) => acc + Number(curr.amount), 0) / (transactions.length || 1)) : 'UGX 0'}
              </h3>
            </div>
            <div className="p-2 bg-muted rounded-lg text-muted-foreground">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search paid to or ref..." 
                className="pl-10 h-10 border-border focus:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select 
              className="h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
            >
              <option value="">All Terms</option>
              {terms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <Button variant="outline" className="h-10 border-border text-foreground" onClick={() => {
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
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrintReceipt={handlePrintReceipt}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
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
                  className={`w-8 h-8 p-0 ${page === i + 1 ? 'bg-primary text-primary-foreground' : ''}`}
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
