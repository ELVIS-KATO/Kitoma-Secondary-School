import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Receipt as ReceiptIcon, 
  Tag, 
  Calendar, 
  Settings, 
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { cn } from '@/utils/cn';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Cash Inflows', icon: TrendingUp, href: '/inflows' },
  { name: 'Cash Outflows', icon: TrendingDown, href: '/outflows' },
  { name: 'Reports', icon: FileText, href: '/reports' },
  { name: 'Receipts', icon: ReceiptIcon, href: '/receipts' },
  { name: 'Categories', icon: Tag, href: '/categories' },
  { name: 'Terms', icon: Calendar, href: '/terms' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { schoolInfo } = useSettingsStore();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card text-card-foreground border-r border-border flex flex-col z-50 no-print">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full ring-2 ring-primary p-0.5">
          <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-primary/10">
            {schoolInfo.logo_url ? (
              <img src={schoolInfo.logo_url} className="w-full h-full object-cover" alt="School logo" />
            ) : (
              <span className="text-primary font-bold text-xs">
                {schoolInfo.name.substring(0, 3).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div>
          <h1 className="text-foreground font-bold text-sm leading-tight truncate max-w-[140px]">{schoolInfo.name}</h1>
          <p className="text-xs text-muted-foreground">Accounts System</p>
        </div>
      </div>

      <nav className="flex-1 mt-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-secondary-foreground" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-foreground text-sm font-medium truncate">{user?.name}</p>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground">
              {user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-2.5 w-full rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
