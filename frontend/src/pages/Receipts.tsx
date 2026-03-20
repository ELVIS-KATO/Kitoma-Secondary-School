import { useEffect, useState } from 'react';
import { 
  Receipt as ReceiptIcon, 
  Search, 
  Filter, 
  Printer, 
  Download,
  Eye,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import client from '@/api/client';
import { Receipt, PaginatedResponse } from '@/types';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDateTime, formatDate } from '@/utils/formatters';

export default function Receipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const response = await client.get<PaginatedResponse<Receipt>>('/receipts/', {
        params: {
          page,
          size: 20,
          search: search || undefined,
        }
      });
      setReceipts(response.data.items);
      setTotal(response.data.total);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to fetch receipts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [page, search]);

  const handlePrintReceipt = async (id: string) => {
    try {
      const response = await client.get(`/receipts/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to generate receipt PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Official Receipts</h1>
        <p className="text-slate-500 text-sm">View and re-issue receipts for all school inflows</p>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search receipt number or payer name..." 
                className="pl-10 h-10 border-slate-200 focus:ring-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-10 border-slate-200 text-slate-600" onClick={() => setSearch('')}>
              Clear Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Receipt No.</th>
              <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Date Issued</th>
              <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Issued To</th>
              <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs text-right">Amount</th>
              <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4 h-16 bg-slate-50/50" />
                </tr>
              ))
            ) : receipts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <ReceiptIcon className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-slate-500 font-medium">No receipts found</p>
                  </div>
                </td>
              </tr>
            ) : (
              receipts.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-indigo-600 font-bold">
                    {r.receipt_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    <p className="font-medium">{formatDate(r.issued_at)}</p>
                    <p className="text-[10px] text-slate-400">{formatDateTime(r.issued_at).split(',')[1]}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                    {r.issued_to}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                    {formatCurrency(r.transaction_amount || 0)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                        onClick={() => handlePrintReceipt(r.id)}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-slate-500">
            Showing {receipts.length} of {total} receipts
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
