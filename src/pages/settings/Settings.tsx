import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Save, 
  Lock, 
  Building,
  ChevronRight,
  Monitor,
  Key,
  Camera,
  Laptop,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('My Profile');

  const tabs = [
    { id: 'My Profile', icon: User, description: 'Personal details & avatar' },
    { id: 'Company Profile', icon: Building, description: 'Workspace branding & info' },
    { id: 'Account Security', icon: Lock, description: 'Passwords, 2FA & Sessions' },
    { id: 'Notifications', icon: Bell, description: 'Configure alert preferences' },
    { id: 'Theme', icon: Palette, description: 'Customize UI appearance' },
  ];

  const loginSessions = [
    { device: 'MacBook Pro', location: 'Gurgaon, India', time: 'Active Now', icon: Laptop, current: true },
    { device: 'iPhone 15 Pro', location: 'Delhi, India', time: '2 hours ago', icon: Smartphone, current: false },
    { device: 'Chrome on Windows', location: 'Mumbai, India', time: 'Yesterday', icon: Laptop, current: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage your identity and workspace preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl transition-all">
            Discard
          </button>
          <button className="btn-primary py-2.5 px-8 shadow-lg shadow-primary-500/20 text-sm">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all group border-2 ${
                activeTab === tab.id 
                ? 'bg-white border-primary-500 shadow-xl shadow-primary-500/5' 
                : 'bg-transparent border-transparent text-slate-500 hover:bg-white hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className={`p-2 rounded-xl transition-colors ${
                  activeTab === tab.id ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                }`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-600'}`}>{tab.id}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{tab.description}</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 transition-all ${activeTab === tab.id ? 'text-primary-500 translate-x-1' : 'opacity-0'}`} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {activeTab === 'My Profile' && (
                <div className="space-y-6">
                  <div className="card-premium">
                    <h3 className="text-xl font-bold text-slate-900 mb-8">Personal Information</h3>
                    <div className="flex flex-col md:flex-row gap-10">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                          <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 border-4 border-white shadow-lg overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
                          </div>
                          <button className="absolute bottom-0 right-0 p-2 bg-primary-500 text-white rounded-xl shadow-lg border-2 border-white hover:bg-primary-600 transition-all">
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-center">
                          <span className="px-3 py-1 bg-primary-50 text-primary-600 text-[10px] font-extrabold uppercase rounded-full">Super Admin</span>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                          <input type="text" defaultValue="Avinash Magar" className="input-field" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Public Email</label>
                          <input type="email" defaultValue="avinash@quikboom.com" className="input-field" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                          <input type="text" defaultValue="+91 99887 76655" className="input-field" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Designation</label>
                          <input type="text" defaultValue="Chief Executive Officer" className="input-field" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Bio / Status</label>
                          <textarea rows={3} defaultValue="Building the next generation of business intelligence tools. Focused on scalability and premium UX." className="input-field"></textarea>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card-premium">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">LinkedIn Profile</label>
                        <input type="text" defaultValue="linkedin.com/in/avinash" className="input-field" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Twitter (X)</label>
                        <input type="text" defaultValue="@avinash_quik" className="input-field" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Account Security' && (
                <div className="space-y-6">
                  <div className="card-premium">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                        <Key className="w-5 h-5 text-primary-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Password Management</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Current Password</label>
                          <input type="password" placeholder="••••••••" className="input-field" />
                        </div>
                        <div className="hidden md:block"></div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                          <input type="password" placeholder="••••••••" className="input-field" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                          <input type="password" placeholder="••••••••" className="input-field" />
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                          Strong passwords include at least 12 characters, a mix of letters, numbers, and symbols. 
                          Avoid using common words or personal information.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="card-premium">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-slate-900">Active Login Sessions</h3>
                      <button className="text-xs font-bold text-rose-600 hover:underline">Log out all other devices</button>
                    </div>
                    <div className="space-y-4">
                      {loginSessions.map((session, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                              <session.icon className={`w-5 h-5 ${session.current ? 'text-primary-600' : 'text-slate-400'}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-900">{session.device}</p>
                                {session.current && (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-extrabold uppercase rounded-full">Current</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-medium">{session.location} • {session.time}</p>
                            </div>
                          </div>
                          {!session.current && (
                            <button className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all">Revoke Access</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Company Profile' && (
                <div className="space-y-6">
                  <div className="card-premium">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                        <Building className="w-5 h-5 text-primary-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Company Branding</h3>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-[1.5rem] bg-white shadow-inner flex items-center justify-center overflow-hidden border-2 border-white">
                            <img src="https://api.dicebear.com/7.x/initials/svg?seed=QB" alt="Logo" className="w-full h-full object-cover" />
                          </div>
                          <button className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100 text-primary-600 hover:text-primary-700 transition-all">
                            <SettingsIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-md font-bold text-slate-900">Workspace Logo</h4>
                          <p className="text-xs text-slate-500 font-medium">This logo will be displayed on the sidebar, invoices, and email templates.</p>
                          <div className="flex gap-3 mt-4">
                            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-50 transition-all">Upload New</button>
                            <button className="px-4 py-2 text-rose-600 font-bold rounded-lg text-xs hover:bg-rose-50 transition-all">Remove</button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Company Legal Name</label>
                          <input type="text" defaultValue="Quik Boom Private Limited" className="input-field" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Business Category</label>
                          <input type="text" defaultValue="Enterprise SaaS" className="input-field" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Support Email</label>
                          <input type="email" defaultValue="support@quikboom.com" className="input-field" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Business Phone</label>
                          <input type="text" defaultValue="+91 98765 43210" className="input-field" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Headquarters Address</label>
                          <textarea rows={3} defaultValue="Unit 402, Tech Hub Tower, DLF Cyber City, Phase 3, Gurgaon - 122002" className="input-field"></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Theme' && (
                <div className="card-premium">
                  <h3 className="text-xl font-bold text-slate-900 mb-8">Interface Appearance</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {['Light Mode', 'Dark Mode', 'System Default'].map((mode) => (
                      <button 
                        key={mode}
                        className={`p-6 rounded-2xl border-2 transition-all text-left group ${
                          mode === 'Light Mode' ? 'border-primary-500 bg-primary-50/50' : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className={`w-full aspect-video rounded-lg mb-4 flex items-center justify-center shadow-sm ${
                          mode === 'Dark Mode' ? 'bg-slate-900' : 'bg-white'
                        }`}>
                          <Monitor className={`w-8 h-8 ${mode === 'Dark Mode' ? 'text-slate-700' : 'text-slate-200'}`} />
                        </div>
                        <p className="text-sm font-bold text-slate-900">{mode}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${mode === 'Light Mode' ? 'bg-primary-500' : 'bg-slate-300'}`}></div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {mode === 'Light Mode' ? 'Active' : 'Select'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Notifications' && (
                <div className="card-premium">
                  <h3 className="text-xl font-bold text-slate-900 mb-8">Notification Preferences</h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Email Notifications', desc: 'Receive daily digests and major updates via email' },
                      { label: 'Push Notifications', desc: 'Browser notifications for mentions and urgent tasks' },
                      { label: 'Marketing Communications', desc: 'Updates about new features and ecosystem news' },
                      { label: 'Security Alerts', desc: 'Always enabled for your account safety', disabled: true, checked: true },
                    ].map((pref, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className={`text-sm font-bold ${pref.disabled ? 'text-slate-400' : 'text-slate-900'}`}>{pref.label}</p>
                          <p className="text-xs text-slate-500">{pref.desc}</p>
                        </div>
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pref.checked || !pref.disabled ? 'bg-primary-500' : 'bg-slate-200'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${pref.checked || !pref.disabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
