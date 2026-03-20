import { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User as UserIcon, 
  Shield, 
  Database, 
  Globe, 
  Bell, 
  Moon, 
  Sun,
  Plus,
  Edit,
  Trash,
  Key,
  School,
  Save,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import client from '@/api/client';
import { User } from '@/types';
import { toast } from 'react-hot-toast';
import { formatDateTime } from '@/utils/formatters';

export default function Settings() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('school');

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await client.get<User[]>('/users/');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const handleToggleActive = async (id: string) => {
    try {
      await client.patch(`/users/${id}/toggle-active`);
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-500 text-sm">Manage school information, users, and system preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          <TabButton 
            active={activeTab === 'school'} 
            onClick={() => setActiveTab('school')} 
            icon={School} 
            label="School Information" 
          />
          <TabButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            icon={UserIcon} 
            label="User Management" 
          />
          <TabButton 
            active={activeTab === 'security'} 
            onClick={() => setActiveTab('security')} 
            icon={Shield} 
            label="Security & Auth" 
          />
          <TabButton 
            active={activeTab === 'system'} 
            onClick={() => setActiveTab('system')} 
            icon={SettingsIcon} 
            label="System Preferences" 
          />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {activeTab === 'school' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle>School Information</CardTitle>
                  <CardDescription>This information will appear on all official documents and receipts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">School Name</label>
                      <Input defaultValue="Kitoma Secondary School" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Official Email</label>
                      <Input defaultValue="admin@kitoma.ac.ug" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Phone Number</label>
                      <Input defaultValue="+256 700 000000" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Address</label>
                      <Input defaultValue="P.O. Box 123, Kitoma" />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle>School Logo</CardTitle>
                  <CardDescription>Upload your school crest for receipts and reports</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center space-x-6">
                  <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                    KSS
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="h-9 border-slate-200">Change Logo</Button>
                    <p className="text-xs text-slate-400">Recommended size: 512x512px. PNG or SVG format.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-end">
                <Button className="h-10 bg-indigo-600 hover:bg-indigo-700">
                  <UserPlus className="w-4 h-4 mr-2" /> Invite New User
                </Button>
              </div>
              
              <Card className="shadow-sm border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Name & Email</th>
                        <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Role</th>
                        <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Status</th>
                        <th className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoadingUsers ? (
                        [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-16 bg-slate-50/50" />)
                      ) : users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-8 w-8 ${user.is_active ? 'text-red-400 hover:text-red-600' : 'text-emerald-400 hover:text-emerald-600'}`}
                                onClick={() => handleToggleActive(user.id)}
                              >
                                {user.is_active ? <Trash className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Keep your account secure by updating your password regularly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Current Password</label>
                    <Input type="password" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">New Password</label>
                      <Input type="password" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                      <Input type="password" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <Key className="w-4 h-4 mr-2" /> Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">2FA is currently disabled</p>
                      <p className="text-xs text-slate-500">Protect your account with a second authentication step</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-indigo-200 text-indigo-600 font-bold h-10">Enable 2FA</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure system behavior and display options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">Dark Mode</p>
                      <p className="text-xs text-slate-500">Enable a darker theme for reduced eye strain</p>
                    </div>
                    <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200">
                      <Moon className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">Receipt Prefix</p>
                      <p className="text-xs text-slate-500">Customize the prefix for official receipts</p>
                    </div>
                    <Input defaultValue="KSS" className="w-24 text-center font-bold" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Outflow Warning Threshold</p>
                      <p className="text-xs text-slate-500">Warn when an outflow exceeds this amount</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-400">UGX</span>
                      <Input defaultValue="5,000,000" className="w-32 text-right font-bold" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
      <span>{label}</span>
    </button>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
