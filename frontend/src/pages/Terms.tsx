import { useEffect, useState } from 'react';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  MoreVertical, 
  Edit, 
  Trash,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import client from '@/api/client';
import { Term } from '@/types';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function Terms() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTerms = async () => {
    setIsLoading(true);
    try {
      const response = await client.get<Term[]>('/terms/');
      setTerms(response.data);
    } catch (error) {
      toast.error('Failed to fetch terms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleActivate = async (id: string) => {
    try {
      await client.patch(`/terms/${id}/activate`);
      toast.success('Term activated successfully');
      fetchTerms();
    } catch (error) {
      toast.error('Failed to activate term');
    }
  };

  const termsByYear = terms.reduce((acc, term) => {
    if (!acc[term.year]) acc[term.year] = [];
    acc[term.year].push(term);
    return acc;
  }, {} as Record<number, Term[]>);

  const years = Object.keys(termsByYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">School Terms</h1>
          <p className="text-slate-500 text-sm">Manage academic terms and their financial periods</p>
        </div>
        <Button className="h-10 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Create New Term
        </Button>
      </div>

      <div className="space-y-12">
        {years.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
            <Calendar className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No terms found</h3>
            <p className="text-slate-500">Create your first term to start recording transactions</p>
          </div>
        ) : years.map(year => (
          <div key={year} className="space-y-4">
            <div className="flex items-center space-x-3 text-slate-400">
              <div className="h-px flex-1 bg-slate-200"></div>
              <h2 className="text-lg font-bold text-slate-600 uppercase tracking-widest">{year} Academic Year</h2>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {termsByYear[year].map(term => (
                <TermCard key={term.id} term={term} onActivate={handleActivate} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TermCard({ term, onActivate }: { term: Term, onActivate: (id: string) => void }) {
  return (
    <Card className={`shadow-sm border-2 transition-all ${term.is_active ? 'border-indigo-600 bg-indigo-50/10' : 'border-slate-200 hover:border-slate-300'}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-bold text-slate-900 text-lg">{term.name}</h3>
              {term.is_active && (
                <span className="flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1.5" />
              {formatDate(term.start_date)} — {formatDate(term.end_date)}
            </p>
          </div>
          
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 text-emerald-500" /> Inflows
            </p>
            <p className="text-sm font-bold text-slate-700">{formatCurrency(term.total_inflows)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
              <TrendingDown className="w-3 h-3 mr-1 text-red-500" /> Outflows
            </p>
            <p className="text-sm font-bold text-slate-700">{formatCurrency(term.total_outflows)}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs">
            <p className="text-slate-400 font-bold uppercase tracking-widest">Net Term Balance</p>
            <p className={`font-bold mt-0.5 ${term.net_balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(term.net_balance)}
            </p>
          </div>
          {!term.is_active && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-bold text-xs"
              onClick={() => onActivate(term.id)}
            >
              Activate Term
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
