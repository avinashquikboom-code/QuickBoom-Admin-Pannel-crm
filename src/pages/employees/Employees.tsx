import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const employees = [
  { id: 'EMP001', name: 'Avinash Magar', role: 'Super Admin', dept: 'Management', status: 'Active', email: 'avinash@quikboom.com', phone: '+91 98765 43210', joined: '12 Jan 2024' },
  { id: 'EMP002', name: 'Sanjay Kumar', role: 'HR Manager', dept: 'Human Resources', status: 'Active', email: 'sanjay@quikboom.com', phone: '+91 98765 43211', joined: '15 Jan 2024' },
  { id: 'EMP003', name: 'Priya Sharma', role: 'Senior Developer', dept: 'Engineering', status: 'On Leave', email: 'priya@quikboom.com', phone: '+91 98765 43212', joined: '20 Jan 2024' },
  { id: 'EMP004', name: 'Rahul Verma', role: 'Sales Lead', dept: 'Sales', status: 'Active', email: 'rahul@quikboom.com', phone: '+91 98765 43213', joined: '05 Feb 2024' },
  { id: 'EMP005', name: 'Anjali Gupta', role: 'UI Designer', dept: 'Design', status: 'Active', email: 'anjali@quikboom.com', phone: '+91 98765 43214', joined: '10 Feb 2024' },
  { id: 'EMP006', name: 'Vikram Singh', role: 'Accountant', dept: 'Finance', status: 'Inactive', email: 'vikram@quikboom.com', phone: '+91 98765 43215', joined: '15 Feb 2024' },
];

const Employees: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Management</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your workforce, roles and departments</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-sm shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="btn-primary py-2 px-4 shadow-lg shadow-primary-500/20">
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card-premium p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name, ID, or email..." 
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <select className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl focus:outline-none focus:border-primary-500 text-sm">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Sales</option>
            <option>Design</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="card-premium overflow-hidden p-0 border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {employees.map((emp, idx) => (
                <motion.tr 
                  key={emp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`} alt="" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{emp.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{emp.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-700">{emp.role}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                      {emp.dept}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        emp.status === 'Active' ? 'bg-green-500' : 
                        emp.status === 'On Leave' ? 'bg-orange-500' : 'bg-slate-400'
                      }`}></span>
                      <span className="text-xs font-bold text-slate-700">{emp.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-500">{emp.joined}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-primary-50 hover:text-primary-600 rounded-lg text-slate-400 transition-all">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400 transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500 font-medium">Showing 1 to 6 of 42 employees</p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-all disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-primary-500 text-white rounded-lg text-xs font-bold">1</button>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-xs font-bold text-slate-600">2</button>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-white border border-transparent hover:border-slate-200 rounded-lg text-xs font-bold text-slate-600">3</button>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employees;
