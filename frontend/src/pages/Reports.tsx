import { useEffect, useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Calendar,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import client from '@/api/client';
import { ReportResponse, Term } from '@/types';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate, formatPercentage } from '@/utils/formatters';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Reports() {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Config
  const [period, setPeriod] = useState('monthly');
  const [termId, setTermId] = useState('');
  const [type, setType] = useState('all');

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await client.get<Term[]>('/terms/');
        setTerms(response.data);
        const active = response.data.find(t => t.is_active);
        if (active) setTermId(active.id);
      } catch (error) {
        console.error('Failed to fetch terms');
      }
    };
    fetchTerms();
  }, []);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const response = await client.get<ReportResponse>('/reports/generate', {
        params: { period, term_id: termId || undefined, type }
      });
      setReport(response.data);
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!report) return;
    try {
      const response = await client.get('/reports/export/pdf', {
        params: { period, term_id: termId || undefined, type },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Financial_Report_${period}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
          <p className="text-slate-500 text-sm">Generate and export detailed financial statements</p>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Period</label>
              <select 
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
                <option value="termly">Termly Report</option>
                <option value="yearly">Yearly Report</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Term</label>
              <select 
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
                disabled={period !== 'termly'}
              >
                <option value="">Select a term...</option>
                {terms.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction Type</label>
              <select 
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="all">All Transactions</option>
                <option value="inflow">Inflows Only</option>
                <option value="outflow">Outflows Only</option>
              </select>
            </div>
            <Button 
              className="h-11 bg-indigo-600 hover:bg-indigo-700"
              onClick={generateReport}
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Action Bar */}
          <div className="flex items-center justify-end space-x-3">
            <Button variant="outline" className="border-slate-200" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button variant="outline" className="border-slate-200" onClick={exportPDF}>
              <Download className="w-4 h-4 mr-2" /> PDF Export
            </Button>
            <Button variant="outline" className="border-slate-200">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV Export
            </Button>
          </div>

          {/* Report Content (Printable) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-8">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-3xl">
                  KSS
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 uppercase">Kitoma Secondary School</h2>
                  <p className="text-slate-500">P.O. Box 123, Kitoma | Tel: +256 700 000000</p>
                  <h3 className="text-lg font-bold text-indigo-600 mt-1">{report.report_title}</h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Report Period</p>
                <p className="text-lg font-bold text-slate-900">{report.period}</p>
                <p className="text-xs text-slate-400 mt-2">Generated At: {formatDate(report.generated_at)}</p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Opening Balance</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(report.opening_balance)}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Inflows</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(report.summary.total_inflows)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Total Outflows</p>
                <p className="text-xl font-bold text-red-700">{formatCurrency(report.summary.total_outflows)}</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Closing Balance</p>
                <p className="text-xl font-bold text-indigo-700">{formatCurrency(report.closing_balance)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Category Breakdown Chart */}
              <div className="p-6 border border-slate-100 rounded-xl">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Category Breakdown</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.category_breakdown} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="category_name" type="category" width={100} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      <Bar dataKey="total_amount" radius={[0, 4, 4, 0]} barSize={20}>
                        {report.category_breakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category List */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Breakdown Details</h4>
                <div className="divide-y divide-slate-100">
                  {report.category_breakdown.map((cat, idx) => (
                    <div key={cat.category_id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-sm font-medium text-slate-700">{cat.category_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(cat.total_amount)}</p>
                        <p className="text-[10px] text-slate-400">{formatPercentage(cat.percentage)} of total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transaction List */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Transaction List</h4>
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 font-bold text-slate-600">Date</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Reference</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Description</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Category</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(t.transaction_date)}</td>
                        <td className="px-4 py-3 font-mono">{t.reference_number}</td>
                        <td className="px-4 py-3 truncate max-w-[200px]">{t.description}</td>
                        <td className="px-4 py-3">{t.category_name}</td>
                        <td className={`px-4 py-3 text-right font-bold ${t.type === 'inflow' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.type === 'inflow' ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer / Signatures */}
            <div className="mt-16 flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-400 mb-1">Generated by:</p>
                <p className="text-sm font-bold text-slate-900">System Administrator</p>
              </div>
              <div className="text-center">
                <div className="w-48 border-b border-slate-300 mb-2"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!report && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="p-4 bg-slate-50 rounded-full mb-4">
            <FileText className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No report generated</h3>
          <p className="text-slate-500">Configure the period and filters above to generate a financial report</p>
        </div>
      )}
    </div>
  );
}
