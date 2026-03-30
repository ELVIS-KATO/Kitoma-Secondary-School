import { 
  Receipt as ReceiptIcon, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Printer, 
  Download 
} from 'lucide-react';
import { Transaction } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/DropdownMenu';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onPrintReceipt: (id: string) => void;
  isLoading?: boolean;
}

export default function TransactionTable({ 
  transactions, 
  onEdit, 
  onDelete, 
  onPrintReceipt,
  isLoading 
}: TransactionTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border border-dashed">
        <div className="p-4 bg-muted rounded-full mb-4">
          <ReceiptIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground">No transactions found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or record a new transaction</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-card rounded-xl border border-border shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Date</th>
            <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Ref & Description</th>
            <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Category</th>
            <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Payer/Paid To</th>
            <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs text-right">Amount</th>
            <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-muted/30 transition-colors group">
              <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-medium">
                {formatDate(t.transaction_date)}
              </td>
              <td className="px-6 py-4">
                <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest mb-0.5">{t.reference_number}</p>
                <p className="text-foreground font-medium truncate max-w-[200px]">{t.description}</p>
                <span className="text-[10px] text-muted-foreground/60 flex items-center mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${t.type === 'inflow' ? 'bg-success' : 'bg-danger'}`} />
                  {t.payment_method.replace('_', ' ').toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                  {t.category_name}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                {t.payer_name || 'N/A'}
              </td>
              <td className={`px-6 py-4 text-right font-bold text-base ${t.type === 'inflow' ? 'text-success' : 'text-danger'}`}>
                {t.type === 'inflow' ? '+' : '-'}{formatCurrency(t.amount)}
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center space-x-1">
                  {t.receipt_issued && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 ${t.type === 'inflow' ? 'text-primary hover:bg-primary/10' : 'text-danger hover:bg-danger/10'}`}
                      onClick={() => onPrintReceipt(t.id)}
                      title={t.type === 'inflow' ? 'Print Receipt' : 'Print Voucher'}
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-popover border-border">
                      <DropdownMenuItem onClick={() => onEdit(t)} className="text-foreground focus:bg-accent focus:text-accent-foreground">
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPrintReceipt(t.id)} className="text-foreground focus:bg-accent focus:text-accent-foreground">
                        <Download className="w-4 h-4 mr-2" /> PDF Receipt
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-danger focus:text-danger focus:bg-danger/10"
                        onClick={() => onDelete(t.id)}
                      >
                        <Trash className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
