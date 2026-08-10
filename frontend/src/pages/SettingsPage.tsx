import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi, userApi } from '../services/api';
import type { User, Role } from '../types';
import { Badge } from '../components/Common/Badge';
import {
  Building,
  Sliders,
  CheckCircle2,
  Globe,
  UserCheck,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  Users,
  Key,
  UserPlus,
  Trash2,
  X,
} from 'lucide-react';
import { COUNTRIES_CURRENCIES } from '../utils/countries';

export const DEFAULT_COMPANY_SETTINGS = {
  companyName: 'NEXUS WHOLESALE DISTRIBUTORS',
  gstin: '27AAAAA1234A1Z0',
  phone: '+91 98765 00000',
  email: 'operations@nexusdistributors.com',
  address: 'Plot 120, Freight Logistics Park, Industrial Area Phase II, Mumbai',
  defaultMinStock: 5,
  challanPrefix: 'CH-2026-',
  currencySymbol: 'INR (₹)',
  country: 'India',
};

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  // User Account Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [updatingAccount, setUpdatingAccount] = useState(false);

  // Admin Team Accounts Management State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);
  const [userErrorMsg, setUserErrorMsg] = useState<string | null>(null);

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('SALES');
  const [creatingUser, setCreatingUser] = useState(false);

  // System & Organization Form State
  const [companySuccess, setCompanySuccess] = useState(false);
  const [companyForm, setCompanyForm] = useState(() => {
    const saved = localStorage.getItem('companySettings');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_SETTINGS;
  });

  const fetchUsers = async () => {
    if (user?.role !== 'ADMIN') return;
    try {
      const res = await userApi.getUsers();
      if (res.success && res.data) {
        setUsersList(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load users list:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleCountryChange = (countryName: string) => {
    const found = COUNTRIES_CURRENCIES.find((c) => c.country === countryName);
    setCompanyForm((prev: any) => ({
      ...prev,
      country: countryName,
      currencySymbol: found ? `${found.currency} (${found.symbol})` : prev.currencySymbol,
    }));
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);
    setAccountSuccess(null);

    if (newPassword && newPassword !== confirmPassword) {
      setAccountError('New password and confirm password do not match');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setAccountError('New password must be at least 6 characters long');
      return;
    }

    setUpdatingAccount(true);
    try {
      const res = await authApi.updateProfile({
        name,
        email,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      if (res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setAccountSuccess('Personal account details & email updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (err: any) {
      setAccountError(err.response?.data?.message || err.message || 'Failed to update account credentials');
    } finally {
      setUpdatingAccount(false);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !resetPasswordInput) return;

    if (resetPasswordInput.length < 6) {
      setUserErrorMsg('Password must be at least 6 characters');
      return;
    }

    setResettingPassword(true);
    setUserErrorMsg(null);
    setUserSuccessMsg(null);
    try {
      const res = await userApi.resetPassword(resetModalUser.id, resetPasswordInput);
      if (res.success) {
        setUserSuccessMsg(`Password reset successfully for ${resetModalUser.email}! New Password: ${resetPasswordInput}`);
        setResetModalUser(null);
        setResetPasswordInput('');
        fetchUsers();
      }
    } catch (err: any) {
      setUserErrorMsg(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setUserErrorMsg(null);
    setUserSuccessMsg(null);
    try {
      const res = await userApi.createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      if (res.success) {
        setUserSuccessMsg(`User account created successfully for ${newUserEmail}! Password: ${newUserPassword}`);
        setIsAddUserModalOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        fetchUsers();
      }
    } catch (err: any) {
      setUserErrorMsg(err.response?.data?.message || err.message || 'Failed to create user account');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (targetUserId: string, targetEmail: string) => {
    if (!window.confirm(`Are you sure you want to delete the user account for ${targetEmail}?`)) return;
    setUserErrorMsg(null);
    setUserSuccessMsg(null);
    try {
      const res = await userApi.deleteUser(targetUserId);
      if (res.success) {
        setUserSuccessMsg(`User account ${targetEmail} deleted successfully.`);
        fetchUsers();
      }
    } catch (err: any) {
      setUserErrorMsg(err.response?.data?.message || err.message || 'Failed to delete user');
    }
  };

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('companySettings', JSON.stringify(companyForm));
    setCompanySuccess(true);
    setTimeout(() => setCompanySuccess(false), 3000);
  };

  const getRoleVariant = (role?: string): 'purple' | 'info' | 'warning' | 'success' => {
    switch (role) {
      case 'ADMIN':
        return 'purple';
      case 'SALES':
        return 'info';
      case 'WAREHOUSE':
        return 'warning';
      case 'ACCOUNTS':
        return 'success';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System & Account Settings</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Manage your personal account credentials, team user passwords, company profile, country & currency formats, and inventory rules.
        </p>
      </div>

      {/* Section 1: User Account & Password Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Personal Account & Login Credentials
            </h3>
            <p className="text-xs text-slate-500">Edit your display name, official email ID, or update password</p>
          </div>
        </div>

        {accountSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{accountSuccess}</span>
          </div>
        )}

        {accountError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{accountError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateAccount} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Full Display Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Account Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-3">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Change Account Password (Optional)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={updatingAccount}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {updatingAccount ? 'Updating Account...' : 'Save Account Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: ADMIN ONLY - Team User Management & Password Reset */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Admin Team Account & Password Management
                </h3>
                <p className="text-xs text-slate-500">View team members, reset user passwords, or create new accounts</p>
              </div>
            </div>

            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New User</span>
            </button>
          </div>

          {userSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{userSuccessMsg}</span>
            </div>
          )}

          {userErrorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{userErrorMsg}</span>
            </div>
          )}

          {/* System Default Passwords Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Key className="w-4 h-4 text-amber-500" />
              <span>Default System User Credentials Reference</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="font-bold text-slate-900">Admin</div>
                <div className="text-[11px] text-slate-500 truncate">admin@example.com</div>
                <div className="font-mono text-[11px] font-bold text-indigo-600 mt-1">Pass: Admin@123</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="font-bold text-slate-900">Sales Executive</div>
                <div className="text-[11px] text-slate-500 truncate">sales@example.com</div>
                <div className="font-mono text-[11px] font-bold text-indigo-600 mt-1">Pass: Sales@123</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="font-bold text-slate-900">Warehouse Ops</div>
                <div className="text-[11px] text-slate-500 truncate">warehouse@example.com</div>
                <div className="font-mono text-[11px] font-bold text-indigo-600 mt-1">Pass: Warehouse@123</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="font-bold text-slate-900">Accounts Lead</div>
                <div className="text-[11px] text-slate-500 truncate">accounts@example.com</div>
                <div className="font-mono text-[11px] font-bold text-indigo-600 mt-1">Pass: Accounts@123</div>
              </div>
            </div>
          </div>

          {/* Registered Users Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3">User Member</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Role Privilege</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-700">{u.email}</td>
                    <td className="p-3">
                      <Badge variant={getRoleVariant(u.role)}>{u.role}</Badge>
                    </td>
                    <td className="p-3 flex items-center gap-2">
                      <button
                        onClick={() => setResetModalUser(u)}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Reset User Password"
                      >
                        <Key className="w-3 h-3 text-amber-600" />
                        <span>Reset Password</span>
                      </button>

                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Key className="w-5 h-5 text-amber-500" />
                <span>Reset User Password</span>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-slate-600">
                Resetting password for: <strong className="text-slate-900">{resetModalUser.name}</strong> ({resetModalUser.email})
              </p>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  New Password *
                </label>
                <input
                  type="text"
                  required
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  placeholder="Enter new password (e.g. User@123)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resettingPassword}
                onClick={handleAdminResetPassword}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30 cursor-pointer disabled:opacity-50"
              >
                {resettingPassword ? 'Resetting...' : 'Set New Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>Create Team Member Account</span>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="text-xs space-y-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Employee Name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="employee@company.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Initial Login Password *
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Set initial password (e.g. Employee@123)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Account Privilege Role *
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="SALES">Sales Executive (CRM & Challans)</option>
                  <option value="WAREHOUSE">Warehouse Manager (Stock & Inventory)</option>
                  <option value="ACCOUNTS">Accounts Lead (Analytics & Billing)</option>
                  <option value="ADMIN">System Admin (Full Access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                >
                  {creatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section 3: Country & Currency Selection */}
      <form onSubmit={handleSaveCompanySettings} className="space-y-6">
        {companySuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Organization settings & billing configuration saved successfully!</span>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Operating Country & Global Currency Format
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Operating Country Selection
              </label>
              <select
                value={companyForm.country || 'India'}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                {COUNTRIES_CURRENCIES.map((c) => (
                  <option key={c.country} value={c.country}>
                    {c.country} ({c.code}) - {c.currency} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Active Currency & Symbol Format
              </label>
              <select
                value={companyForm.currencySymbol || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                {COUNTRIES_CURRENCIES.map((c) => (
                  <option key={c.country + c.currency} value={`${c.currency} (${c.symbol})`}>
                    {c.currency} ({c.symbol}) - {c.country}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Company Organization Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Wholesale Business Profile & Invoice Billing Metadata
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Company Legal Title</label>
              <input
                type="text"
                value={companyForm.companyName || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                placeholder="Leave blank for -"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Tax ID / GSTIN Number</label>
              <input
                type="text"
                value={companyForm.gstin || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value })}
                placeholder="Leave blank for -"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Operations Phone</label>
              <input
                type="text"
                value={companyForm.phone || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                placeholder="Leave blank for -"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Official Company Email</label>
              <input
                type="email"
                value={companyForm.email || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                placeholder="Leave blank for -"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Dispatch & Registered Address
              </label>
              <textarea
                rows={2}
                value={companyForm.address || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                placeholder="Leave blank for -"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Operational & Inventory Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Inventory & Challan Configurations
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Default Minimum Stock Threshold
              </label>
              <input
                type="number"
                min="1"
                value={companyForm.defaultMinStock || ''}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, defaultMinStock: e.target.value ? Number(e.target.value) : '' })
                }
                placeholder="Leave blank for -"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Challan Numbering Prefix
              </label>
              <input
                type="text"
                value={companyForm.challanPrefix || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, challanPrefix: e.target.value })}
                placeholder="Leave blank for -"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Save Company & Organization Settings
          </button>
        </div>
      </form>
    </div>
  );
};
