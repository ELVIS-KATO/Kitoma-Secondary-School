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
    <div className="space-y-8 pb-8 report-container">
      <style>{`
        @media print {
          /* Reset layout for print */
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Hide sidebar and topbar (already handled by no-print but for safety) */
          .no-print, nav, aside, header, .sidebar, .topbar {
            display: none !important;
          }

          /* Reset main content container */
          .ml-64 {
            margin-left: 0 !important;
          }
          
          .h-screen {
            height: auto !important;
          }
          
          main {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
          }

          /* Target only the report content */
          .report-content {
            position: relative !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 1.5cm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            display: block !important;
          }

          /* Ensure all text is black for printing */
          .report-content * {
            color: black !important;
          }

          /* Charts must stay colored but visible */
          .recharts-responsive-container {
            width: 100% !important;
            height: 300px !important;
            display: block !important;
          }
          
          .recharts-surface {
            display: block !important;
          }

          /* Page breaks */
          .report-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 2rem !important;
          }

          table {
            page-break-inside: auto !important;
            width: 100% !important;
          }
          
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }

          /* Hide UI action buttons */
          button, .action-bar {
            display: none !important;
          }
        }
      `}</style>
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
          <p className="text-muted-foreground text-sm">Generate and export detailed financial statements</p>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card className="shadow-sm border-border no-print bg-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Report Period</label>
              <select 
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Term</label>
              <select 
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
              >
                <option value="">Select a term...</option>
                {terms.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction Type</label>
              <select 
                className="w-full h-11 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="all">All Transactions</option>
                <option value="inflow">Inflows Only</option>
                <option value="outflow">Outflows Only</option>
              </select>
            </div>
            <Button 
              className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
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
          <div className="flex items-center justify-end space-x-3 no-print">
            <Button variant="outline" className="border-border text-foreground bg-background" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button variant="outline" className="border-border text-foreground bg-background" onClick={exportPDF}>
              <Download className="w-4 h-4 mr-2" /> PDF Export
            </Button>
            <Button variant="outline" className="border-border text-foreground bg-background">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV Export
            </Button>
          </div>

          {/* Report Content (Printable) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-8 report-content text-slate-900">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 report-section">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Opening Balance</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(Number(report.opening_balance))}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Inflows</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(Number(report.summary.total_inflows))}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Total Outflows</p>
                <p className="text-xl font-bold text-red-700">{formatCurrency(Number(report.summary.total_outflows))}</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Closing Balance</p>
                <p className="text-xl font-bold text-indigo-700">{formatCurrency(Number(report.closing_balance))}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 report-section">
              {/* Category Breakdown Chart */}
              <div className="p-6 border border-slate-100 rounded-xl min-h-[300px]">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Category Breakdown</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={report.category_breakdown} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="category_name" 
                        type="category" 
                        width={120} 
                        tick={{ fontSize: 10, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value: number | string | readonly (string | number)[] | undefined) => {
                          const num = Array.isArray(value) ? Number(value[0]) : Number(value);
                          return formatCurrency(Number.isNaN(num) ? 0 : num);
                        }}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid hsl(var(--border))', 
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          backgroundColor: 'hsl(var(--card))',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
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
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(Number(cat.total_amount))}</p>
                        <p className="text-[10px] text-slate-400">{formatPercentage(cat.percentage)} of total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transaction List */}
            <div className="report-section">
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
                          {t.type === 'inflow' ? '+' : '-'}{formatCurrency(Number(t.amount))}
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
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border border-dashed no-print">
          <div className="p-4 bg-muted rounded-full mb-4">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No report generated</h3>
          <p className="text-muted-foreground">Configure the period and filters above to generate a financial report</p>
        </div>
      )}
    </div>
  );
}
