import { Bell, Moon, Sun, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

export default function Topbar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/inflows') return 'Cash Inflows';
    if (path === '/outflows') return 'Cash Outflows';
    if (path === '/reports') return 'Financial Reports';
    if (path === '/receipts') return 'Official Receipts';
    if (path === '/categories') return 'Transaction Categories';
    if (path === '/terms') return 'School Terms';
    if (path === '/settings') return 'System Settings';
    return 'Kitoma Secondary School';
  };

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-card border-b border-border flex items-center justify-between px-8 z-40 no-print">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-bold text-foreground">{getPageTitle()}</h2>
        <div className="h-6 w-px bg-border mx-2" />
        <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          Term 1 2025 · Active
        </span>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          <p className="text-xs text-muted-foreground">Welcome back, {user?.name.split(' ')[0]}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-full transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
          </button>
          <button className="p-1.5 bg-secondary text-secondary-foreground rounded-full hover:ring-2 hover:ring-primary transition-all">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
