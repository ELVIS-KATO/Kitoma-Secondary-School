import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Receipt as ReceiptIcon,
  Plus,
  FileText
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import client from '@/api/client';
import { DashboardSummary, Transaction } from '@/types';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/formatters';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await client.get<DashboardSummary>('/dashboard/summary');
        setSummary(response.data);
      } catch (error) {
        toast.error('Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-muted rounded-xl" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-8 pb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Inflows (Month)" 
          value={summary.total_inflows_month} 
          icon={TrendingUp} 
          trend={12.5} 
          color="success"
        />
        <KPICard 
          title="Total Outflows (Month)" 
          value={summary.total_outflows_month} 
          icon={TrendingDown} 
          trend={-5.2} 
          color="danger"
        />
        <KPICard 
          title="Net Balance" 
          value={summary.net_balance} 
          icon={Wallet} 
          color="primary"
        />
        <KPICard 
          title="Today's Activity" 
          value={summary.total_inflows_today - summary.total_outflows_today} 
          icon={Activity} 
          subtitle={`${summary.recent_transactions.length} recent transactions`}
          color="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-border overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Cash Flow Trends</CardTitle>
              <p className="text-sm text-muted-foreground">Last 12 months performance</p>
            </div>
          </CardHeader>
          <CardContent className="pt-4 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.monthly_cashflow} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInflows" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOutflows" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(val) => `UGX ${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '8px', 
                    border: '1px solid hsl(var(--border))', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    color: 'hsl(var(--foreground))'
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(val) => val == null ? ['', ''] : [formatCurrency(val as number), '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="inflows" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorInflows)" 
                  name="Inflows"
                />
                <Area 
                  type="monotone" 
                  dataKey="outflows" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorOutflows)" 
                  name="Outflows"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Expenses by Category</CardTitle>
            <p className="text-sm text-muted-foreground">Top 5 expense categories</p>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={summary.top_outflow_categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="total_amount"
                  nameKey="category_name"
                >
                  {summary.top_outflow_categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '8px', 
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(val) => val == null ? '' : formatCurrency(val as number)} 
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-muted-foreground font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-border overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
            <CardTitle className="text-lg font-bold text-foreground">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/inflows">View All</Link>
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-muted border-b border-border/50">
                  <th className="px-6 py-3 font-semibold text-muted-foreground">Date</th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground">Description</th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground">Type</th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Amount</th>
                  <th className="px-6 py-3 font-semibold text-muted-foreground text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {summary.recent_transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {formatDate(t.transaction_date)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground truncate max-w-[200px]">{t.description}</p>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.category_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(t.type)}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'inflow' ? 'text-success' : 'text-danger'}`}>
                      {t.type === 'inflow' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {t.receipt_issued && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                          <ReceiptIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start space-x-3 h-12 bg-success hover:bg-success/90 text-white" asChild>
                <Link to="/inflows?action=add">
                  <Plus className="w-5 h-5" />
                  <span>Record New Inflow</span>
                </Link>
              </Button>
              <Button className="w-full justify-start space-x-3 h-12 bg-danger hover:bg-danger/90 text-white" asChild>
                <Link to="/outflows?action=add">
                  <Plus className="w-5 h-5" />
                  <span>Record New Outflow</span>
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start space-x-3 h-12 border-border text-foreground" asChild>
                <Link to="/reports">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span>Generate Term Report</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/20 bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Current Term Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b border-primary-foreground/20 pb-2">
                <span className="text-primary-foreground/80 text-sm">Fees Collected</span>
                <span className="font-bold">{formatCurrency(summary.total_inflows_term)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-primary-foreground/20 pb-2">
                <span className="text-primary-foreground/80 text-sm">Total Expenses</span>
                <span className="font-bold">{formatCurrency(summary.total_outflows_term)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-primary-foreground font-bold">Net Term Balance</span>
                <span className="text-xl font-bold">{formatCurrency(summary.total_inflows_term - summary.total_outflows_term)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, trend, subtitle, color }: any) {
  const colorMap = {
    primary: 'border-primary',
    success: 'border-emerald-500',
    danger: 'border-red-500',
    warning: 'border-amber-500',
  };

  return (
    <Card className={`shadow-sm border-border border-t-4 ${colorMap[color as keyof typeof colorMap]}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-foreground">{formatCurrency(value)}</h3>
          </div>
          <div className={`p-2 rounded-lg bg-muted text-muted-foreground`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        
        <div className="mt-4 flex items-center">
          {trend && (
            <span className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-success' : 'text-danger'}`}>
              {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(trend)}%
              <span className="text-muted-foreground font-normal ml-1">vs last month</span>
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
