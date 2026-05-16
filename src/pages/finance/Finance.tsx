import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Plus, 
  Wallet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const expenseData = [
  { category: 'Marketing', amount: 4500, color: '#3b82f6' },
  { category: 'Salary', amount: 12000, color: '#10b981' },
  { category: 'Rent', amount: 3000, color: '#f59e0b' },
  { category: 'Others', amount: 2500, color: '#6366f1' },
];

const transactions = [
  { id: 'TXN001', type: 'Income', amount: '₹12,000', source: 'Lead Conversion', status: 'Success', date: '2 mins ago' },
  { id: 'TXN002', type: 'Expense', amount: '₹1,500', source: 'Server Maintenance', status: 'Success', date: '1 hour ago' },
  { id: 'TXN003', type: 'Income', amount: '₹45,000', source: 'Project Payment', status: 'Pending', date: '4 hours ago' },
  { id: 'TXN004', type: 'Expense', amount: '₹800', source: 'Office Supplies', status: 'Success', date: 'Yesterday' },
];

const Finance: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Management</h1>
          <p className="text-sm text-slate-500 font-medium">Track your revenue, expenses and transaction history</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
            <Download className="w-4 h-4" />
            Financial Report
          </button>
          <button className="btn-primary py-2 px-4 shadow-lg shadow-primary-500/20">
            <Plus className="w-5 h-5" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-emerald-500 flex items-center gap-1 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +14%
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">₹42,50,000</h3>
        </div>
        <div className="card-premium">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="text-rose-500 flex items-center gap-1 font-bold text-xs bg-rose-50 px-2 py-0.5 rounded-full">
              <ArrowDownRight className="w-3 h-3" />
              -5.2%
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Expenses</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">₹12,18,000</h3>
        </div>
        <div className="card-premium">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="text-primary-500 flex items-center gap-1 font-bold text-xs bg-primary-50 px-2 py-0.5 rounded-full">
              <Plus className="w-3 h-3" />
              ₹84k today
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Balance</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">₹30,32,000</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expense Analytics */}
        <div className="card-premium">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Expense Analysis</h3>
            <select className="text-xs font-bold bg-slate-50 border-none rounded-lg px-3 py-1.5 focus:outline-none">
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card-premium">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
            <button className="text-xs font-bold text-primary-600 hover:underline">View All History</button>
          </div>
          <div className="space-y-5">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    txn.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {txn.type === 'Income' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{txn.source}</p>
                    <p className="text-xs text-slate-500 font-medium">{txn.date} • {txn.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    txn.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {txn.type === 'Income' ? '+' : '-'}{txn.amount}
                  </p>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    txn.status === 'Success' ? 'text-emerald-500' : 'text-orange-500'
                  }`}>
                    {txn.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
