import React from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Mail, 
  Palette, 
  CreditCard,
  ChevronRight,
  Save,
  Trash2,
  Lock,
  Building
} from 'lucide-react';
import { motion } from 'framer-motion';

const Settings: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your company preferences and system configuration</p>
        </div>
        <button className="btn-primary py-2 px-6 shadow-lg shadow-primary-500/20">
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { icon: Building, label: 'Company Profile', active: true },
            { icon: User, label: 'Account Settings', active: false },
            { icon: Shield, label: 'Role & Permissions', active: false },
            { icon: Bell, label: 'Notifications', active: false },
            { icon: Palette, label: 'Theme Customization', active: false },
            { icon: Globe, label: 'Language & Region', active: false },
            { icon: Lock, label: 'Security', active: false },
          ].map((item) => (
            <button 
              key={item.label}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${
                item.active 
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${item.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card-premium">
            <h3 className="text-lg font-bold text-slate-900 mb-8 pb-4 border-b border-slate-50">Company Profile</h3>
            
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[2rem] bg-slate-100 border-4 border-white shadow-md overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/initials/svg?seed=QB" alt="Logo" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100 text-primary-600 hover:text-primary-700 transition-all">
                    <SettingsIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-lg font-bold text-slate-900">Company Logo</h4>
                  <p className="text-sm text-slate-500 font-medium">Upload your company logo for invoices and branding. Recommded size 512x512px.</p>
                  <div className="flex gap-3 mt-4">
                    <button className="px-4 py-2 bg-primary-50 text-primary-600 font-bold rounded-lg text-xs hover:bg-primary-100 transition-all">Change Logo</button>
                    <button className="px-4 py-2 text-rose-600 font-bold rounded-lg text-xs hover:bg-rose-50 transition-all">Remove</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Company Name</label>
                  <input type="text" defaultValue="Quik Boom Private Limited" className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Business Category</label>
                  <select className="input-field">
                    <option>SaaS / Technology</option>
                    <option>Retail</option>
                    <option>Manufacturing</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                  <input type="email" defaultValue="contact@quikboom.com" className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                  <input type="text" defaultValue="+91 98765 43210" className="input-field" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Company Address</label>
                  <textarea rows={3} defaultValue="123, Tech Park, Sector 44, Gurgaon, Haryana - 122003" className="input-field"></textarea>
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium">
            <h3 className="text-lg font-bold text-slate-900 mb-8 pb-4 border-b border-slate-50">Danger Zone</h3>
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-rose-50 rounded-2xl border border-rose-100 gap-4">
              <div>
                <h4 className="text-sm font-bold text-rose-900">Delete Company Account</h4>
                <p className="text-xs text-rose-600 font-medium mt-1">Once you delete your account, there is no going back. Please be certain.</p>
              </div>
              <button className="px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20 text-sm whitespace-nowrap">
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
