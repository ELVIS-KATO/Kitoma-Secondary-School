import { useEffect, useState } from 'react';
import { 
  Tag, 
  Plus, 
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
import { Category } from '@/types';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatters';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await client.get<Category[]>('/categories/');
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await client.delete(`/categories/${id}`);
        toast.success('Category deleted');
        fetchCategories();
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to delete category');
      }
    }
  };

  const inflowCats = categories.filter(c => c.type === 'inflow');
  const outflowCats = categories.filter(c => c.type === 'outflow');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaction Categories</h1>
          <p className="text-slate-500 text-sm">Organize and track your finances by category</p>
        </div>
        <Button className="h-10 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inflow Categories */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
            <h2 className="text-lg font-bold">Inflow Categories</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)
            ) : inflowCats.length === 0 ? (
              <EmptyState />
            ) : (
              inflowCats.map(cat => (
                <CategoryCard key={cat.id} category={cat} onDelete={handleDelete} />
              ))
            )}
          </div>
        </div>

        {/* Outflow Categories */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2 text-red-600">
            <TrendingDown className="w-5 h-5" />
            <h2 className="text-lg font-bold">Outflow Categories</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)
            ) : outflowCats.length === 0 ? (
              <EmptyState />
            ) : (
              outflowCats.map(cat => (
                <CategoryCard key={cat.id} category={cat} onDelete={handleDelete} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ category, onDelete }: { category: Category, onDelete: (id: string) => void }) {
  return (
    <Card className="shadow-sm border-slate-200 hover:border-indigo-200 transition-colors group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-bold text-slate-900">{category.name}</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${category.type === 'inflow' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {category.type}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">{category.description || 'No description provided'}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transactions</p>
                <p className="text-sm font-bold text-slate-700">{category.transaction_count}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                <p className="text-sm font-bold text-slate-700">{formatCurrency(category.total_amount)}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => onDelete(category.id)}>
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
      <Tag className="w-8 h-8 text-slate-300 mb-2" />
      <p className="text-sm text-slate-500">No categories found</p>
    </div>
  );
}
