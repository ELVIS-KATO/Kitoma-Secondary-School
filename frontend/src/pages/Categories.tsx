import { useEffect, useState } from 'react';
import { 
  Tag, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  MoreVertical, 
  Edit, 
  Trash,
  Info,
  X
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'inflow' as 'inflow' | 'outflow',
    description: '',
  });

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

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      type: 'inflow',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      type: cat.type,
      description: cat.description || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await client.put(`/categories/${editingId}`, formData);
        toast.success('Category updated successfully');
      } else {
        await client.post('/categories/', formData);
        toast.success('Category created successfully');
      }
      closeModal();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? It will only work if there are no transactions attached.')) {
      try {
        await client.delete(`/categories/${id}`);
        toast.success('Category deleted');
        fetchCategories();
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to delete category. Ensure it has no transactions.');
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
        <Button className="h-10 bg-indigo-600 hover:bg-indigo-700" onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  {editingId ? 'Edit Category' : 'Add New Category'}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={closeModal}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Category Name</label>
                  <input 
                    name="name" 
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Tuition Fees, Stationery" 
                    required 
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Category Type</label>
                  <select 
                    name="type"
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="inflow">Inflow (Income)</option>
                    <option value="outflow">Outflow (Expense)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <textarea 
                    name="description"
                    className="w-full h-24 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Brief description of what this category covers..."
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Category' : 'Create Category')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

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
                <CategoryCard key={cat.id} category={cat} onDelete={handleDelete} onEdit={handleEdit} />
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
                <CategoryCard key={cat.id} category={cat} onDelete={handleDelete} onEdit={handleEdit} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ category, onDelete, onEdit }: { category: Category, onDelete: (id: string) => void, onEdit: (cat: Category) => void }) {
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
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => onEdit(category)}>
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
