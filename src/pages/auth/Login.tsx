import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      dispatch(setCredentials({
        user: { id: '1', name: 'Avinash Magar', email: 'admin@quikboom.com', role: 'Super Admin' },
        token: 'dummy-jwt-token'
      }));
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="w-full max-w-6xl h-[700px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
      {/* Left Side - Visuals */}
      <div className="hidden md:flex md:w-1/2 bg-primary-500 relative overflow-hidden p-12 flex-col justify-between text-white">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-600 rounded-full -ml-48 -mb-48 blur-3xl"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">QUIK BOOM</span>
        </div>

        <div className="relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold leading-tight"
          >
            Manage your <br />
            <span className="text-primary-200">business</span> with <br />
            intelligence.
          </motion.h1>
          <p className="mt-6 text-primary-50 text-lg max-w-sm">
            Everything you need to manage CRM, HRM, and projects in one powerful platform.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary-200" />
            <span className="text-sm font-semibold">Fast & Secure</span>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary-200" />
            <span className="text-sm font-semibold">Global Support</span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 p-8 md:p-16 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 mt-2 font-medium">Please enter your details to sign in</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                  type="email" 
                  required
                  placeholder="admin@quikboom.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <button type="button" className="text-xs font-bold text-primary-600 hover:text-primary-700">Forgot Password?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500" />
              <label htmlFor="remember" className="text-sm font-semibold text-slate-600 cursor-pointer">Remember me for 30 days</label>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 disabled:opacity-70 group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 font-medium">
              Don't have an account? 
              <button className="ml-2 font-bold text-primary-600 hover:text-primary-700">Request access</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
