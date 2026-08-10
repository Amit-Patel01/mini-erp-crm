import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Common/Badge';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_COMPANY_SETTINGS } from './SettingsPage';
import { User as UserIcon, Mail, Shield, Clock, Settings, Building, Globe, FileText } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [companySettings, setCompanySettings] = useState<any>(DEFAULT_COMPANY_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem('companySettings');
    if (saved) {
      try {
        setCompanySettings(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

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

  const renderValue = (val: any) => {
    if (val === undefined || val === null || String(val).trim() === '') {
      return <span className="text-slate-400 font-mono font-bold">-</span>;
    }
    return <span className="font-bold text-slate-900">{val}</span>;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Profile & System Details</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            View active user profile summary and organization settings configured in the system.
          </p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>Edit Settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* User Account Overview Card */}
        <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-100">
            <div className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
              <UserIcon className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{user?.name}</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{user?.email}</p>
            </div>
            <Badge variant={getRoleVariant(user?.role)}>{user?.role} PRIVILEGE</Badge>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-semibold flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Full Name</span>
              </span>
              {renderValue(user?.name)}
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>Email Address</span>
              </span>
              {renderValue(user?.email)}
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Assigned Role</span>
              </span>
              {renderValue(user?.role)}
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Session Status</span>
              </span>
              <span className="text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Settings Values Overview Card (Reflects Settings Page Inputs) */}
        <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Configured System & Business Details</h3>
                <p className="text-xs text-slate-500">Live details set in Settings (unfilled fields display -)</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Company Legal Title</span>
                </span>
                <div className="text-sm font-bold text-slate-900 truncate">
                  {renderValue(companySettings.companyName)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>GSTIN / Tax ID</span>
                </span>
                <div className="text-sm font-bold font-mono text-slate-900 truncate">
                  {renderValue(companySettings.gstin)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Official Email</span>
                </span>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {renderValue(companySettings.email)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Operations Phone</span>
                </span>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {renderValue(companySettings.phone)}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Registered Address
              </span>
              <div className="text-xs font-medium text-slate-800 leading-relaxed">
                {renderValue(companySettings.address)}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Country</span>
                <div className="text-xs font-bold text-slate-900">{renderValue(companySettings.country)}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Currency</span>
                <div className="text-xs font-bold text-slate-900">{renderValue(companySettings.currencySymbol)}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Min Stock</span>
                <div className="text-xs font-bold font-mono text-indigo-600">{renderValue(companySettings.defaultMinStock)} Pcs</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Prefix</span>
                <div className="text-xs font-bold font-mono text-slate-900">{renderValue(companySettings.challanPrefix)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
