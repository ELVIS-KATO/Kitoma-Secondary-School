import React, { useEffect, useState } from 'react';
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
  UserPlus,
  X,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import client from '@/api/client';
import { User } from '@/types';
import { toast } from 'react-hot-toast';
import { useThemeStore } from '@/store/themeStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore();
  const { schoolInfo, setSchoolInfo, updateSchoolInfo, fetchSettings } = useSettingsStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('school');

  // School Settings State - now just for local edits before save
  const [localSchoolInfo, setLocalSchoolInfo] = useState(schoolInfo);
  const [isSavingSchool, setIsSavingSchool] = useState(false);

  // Update local state when store changes (e.g., after fetch)
  useEffect(() => {
    setLocalSchoolInfo(schoolInfo);
  }, [schoolInfo]);

  // Security State
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // System Preference State
  const [preferences, setPreferences] = useState({
    dark_mode: false,
    receipt_prefix: 'KSS',
    outflow_threshold: 5000000
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: 'accountant' as 'admin' | 'accountant' | 'viewer',
    password: '',
    is_active: true
  });
  const [isSavingUser, setIsSavingUser] = useState(false);

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

  const fetchAllSettings = async () => {
    try {
      const prefsRes = await client.get('/settings/preferences');
      setPreferences(prefsRes.data);
      await fetchSettings(); // Uses the store's fetch
    } catch (error) {
      console.error('Failed to fetch settings');
    }
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo file size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const logo_url = reader.result as string;
        const updatedInfo = { ...localSchoolInfo, logo_url };
        setLocalSchoolInfo(updatedInfo);
        
        // Auto-save the logo to the backend and update global store
        try {
          await updateSchoolInfo(updatedInfo);
          toast.success('Logo updated successfully');
        } catch (error) {
          toast.error('Failed to save logo');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSchoolInfoSave = async () => {
    setIsSavingSchool(true);
    try {
      await updateSchoolInfo(localSchoolInfo);
      toast.success('School information updated');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update school information');
    } finally {
      setIsSavingSchool(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      return toast.error('New passwords do not match');
    }
    setIsUpdatingPassword(true);
    try {
      await client.post('/settings/security/password', passwords);
      toast.success('Password updated successfully');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      await client.post('/settings/security/2fa', { enabled: !is2FAEnabled });
      setIs2FAEnabled(!is2FAEnabled);
      toast.success(`2FA ${!is2FAEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update 2FA status');
    }
  };

  const handlePrefsSave = async () => {
    setIsSavingPrefs(true);
    try {
      await client.post('/settings/preferences', preferences);
      toast.success('System preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await client.patch(`/users/${id}/toggle-active`);
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const openUserModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        name: user.name,
        email: user.email,
        role: user.role as any,
        password: '',
        is_active: user.is_active
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        name: '',
        email: '',
        role: 'accountant',
        password: '',
        is_active: true
      });
    }
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    try {
      if (editingUser) {
        const payload = { ...userFormData };
        if (!payload.password) delete (payload as any).password;
        await client.put(`/users/${editingUser.id}`, payload);
        toast.success('User updated successfully');
      } else {
        await client.post('/users/', userFormData);
        toast.success('User invited successfully');
      }
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save user');
    } finally {
      setIsSavingUser(false);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground text-sm">Manage school information, users, and system preferences</p>
        </div>
      </div>

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-border">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  {editingUser ? 'Edit User' : 'Invite New User'}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsUserModalOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <form onSubmit={handleUserSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <Input 
                    required
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email Address</label>
                  <Input 
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Role</label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as any })}
                  >
                    <option value="admin">Administrator</option>
                    <option value="accountant">Accountant</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                  </label>
                  <Input 
                    type="password"
                    required={!editingUser}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  />
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSavingUser}>
                  {isSavingUser ? 'Saving...' : (editingUser ? 'Update User' : 'Send Invite')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

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
              <Card className="shadow-sm border-border">
                <CardHeader>
                  <CardTitle>School Information</CardTitle>
                  <CardDescription>This information will appear on all official documents and receipts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">School Name</label>
                      <Input 
                        value={localSchoolInfo.name} 
                        onChange={(e) => setLocalSchoolInfo({ ...localSchoolInfo, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Official Email</label>
                      <Input 
                        value={localSchoolInfo.email}
                        onChange={(e) => setLocalSchoolInfo({ ...localSchoolInfo, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Phone Number</label>
                      <Input 
                        value={localSchoolInfo.phone}
                        onChange={(e) => setLocalSchoolInfo({ ...localSchoolInfo, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Address</label>
                      <Input 
                        value={localSchoolInfo.address}
                        onChange={(e) => setLocalSchoolInfo({ ...localSchoolInfo, address: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handleSchoolInfoSave}
                      disabled={isSavingSchool}
                    >
                      <Save className="w-4 h-4 mr-2" /> {isSavingSchool ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border">
                <CardHeader>
                  <CardTitle>School Logo</CardTitle>
                  <CardDescription>Upload your school crest for receipts and reports</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center space-x-6">
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-4xl shadow-lg overflow-hidden border-2 border-border/50">
                    {localSchoolInfo.logo_url ? (
                      <img src={localSchoolInfo.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      localSchoolInfo.name ? localSchoolInfo.name.substring(0, 3).toUpperCase() : 'SCH'
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="file" 
                        id="logo-upload"
                        className="hidden" 
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                      <Button 
                        variant="outline" 
                        className="h-9 border-border"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        Change Logo
                      </Button>
                      {localSchoolInfo.logo_url && (
                        <Button 
                          variant="ghost" 
                          className="h-9 text-destructive hover:text-destructive/90"
                          onClick={() => {
                            const updatedInfo = { ...localSchoolInfo, logo_url: '' };
                            setLocalSchoolInfo(updatedInfo);
                            updateSchoolInfo(updatedInfo);
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Recommended size: 512x512px. PNG, JPG or SVG format.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-end">
                <Button className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => openUserModal()}>
                  <UserPlus className="w-4 h-4 mr-2" /> Invite New User
                </Button>
              </div>
              
              <Card className="shadow-sm border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="px-6 py-4 font-bold text-foreground uppercase tracking-wider text-xs">Name & Email</th>
                        <th className="px-6 py-4 font-bold text-foreground uppercase tracking-wider text-xs">Role</th>
                        <th className="px-6 py-4 font-bold text-foreground uppercase tracking-wider text-xs">Status</th>
                        <th className="px-6 py-4 font-bold text-foreground uppercase tracking-wider text-xs text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {isLoadingUsers ? (
                        [1, 2, 3].map(i => <tr key={i} className="animate-pulse h-16 bg-muted/50" />)
                      ) : users.map(user => (
                        <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.is_active ? 'bg-emerald-500' : 'bg-destructive'}`} />
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openUserModal(user)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-8 w-8 ${user.is_active ? 'text-destructive/70 hover:text-destructive' : 'text-emerald-500/70 hover:text-emerald-500'}`}
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
              <Card className="shadow-sm border-border">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Keep your account secure by updating your password regularly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Current Password</label>
                    <Input 
                      type="password" 
                      value={passwords.current_password}
                      onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">New Password</label>
                      <Input 
                        type="password" 
                        value={passwords.new_password}
                        onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                      <Input 
                        type="password" 
                        value={passwords.confirm_password}
                        onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handlePasswordUpdate}
                      disabled={isUpdatingPassword}
                    >
                      <Key className="w-4 h-4 mr-2" /> {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border">
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">2FA is currently {is2FAEnabled ? 'enabled' : 'disabled'}</p>
                      <p className="text-xs text-muted-foreground">Protect your account with a second authentication step</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className={`font-bold h-10 ${is2FAEnabled ? 'border-destructive/20 text-destructive' : 'border-primary/20 text-primary'}`}
                    onClick={handleToggle2FA}
                  >
                    {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card className="shadow-sm border-border">
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure system behavior and display options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div>
                      <p className="font-bold text-foreground">Theme Mode</p>
                      <p className="text-xs text-muted-foreground">Choose between light and dark theme</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 border-border"
                      onClick={toggleTheme}
                    >
                      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div>
                      <p className="font-bold text-foreground">Receipt Prefix</p>
                      <p className="text-xs text-muted-foreground">Customize the prefix for official receipts</p>
                    </div>
                    <Input 
                      value={preferences.receipt_prefix} 
                      className="w-24 text-center font-bold" 
                      onChange={(e) => setPreferences({ ...preferences, receipt_prefix: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">Outflow Warning Threshold</p>
                      <p className="text-xs text-muted-foreground">Warn when an outflow exceeds this amount</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-muted-foreground">UGX</span>
                      <Input 
                        type="number"
                        value={preferences.outflow_threshold} 
                        className="w-32 text-right font-bold" 
                        onChange={(e) => setPreferences({ ...preferences, outflow_threshold: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handlePrefsSave}
                      disabled={isSavingPrefs}
                    >
                      <Save className="w-4 h-4 mr-2" /> {isSavingPrefs ? 'Updating...' : 'Save Preferences'}
                    </Button>
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
