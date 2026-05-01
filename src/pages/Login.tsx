import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Abstract background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-3xl -mr-96 -mt-96"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-200/50 rounded-full blur-3xl -ml-72 -mb-72"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="w-full max-w-xl bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden relative z-10 p-12 sm:p-20 group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100%] transition-all group-hover:bg-blue-50/50"></div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-12">
            <div className="w-20 h-20 bg-slate-800 border-8 border-white shadow-2xl rounded-[2rem] flex items-center justify-center text-white text-4xl font-semibold rotate-6 group-hover:rotate-0 transition-all duration-500">
              W
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Wekulo Credit</h2>
          <p className="text-slate-400 text-center text-sm mb-12">Authorized Personnel Only</p>

          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4"
            >
              <AlertCircle className="text-rose-500 shrink-0" size={20} />
              <p className="text-rose-700 text-sm font-medium leading-tight">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-500 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-200 focus:bg-white transition-all text-sm font-medium text-slate-800 placeholder:text-slate-300"
                  placeholder="admin@wekulo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-500 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-blue-200 focus:bg-white transition-all text-sm font-medium text-slate-800 placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl text-sm font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-blue-50 active:scale-95 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={18} />
                  Login
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-xs font-medium text-slate-400">
            Forgot access? <span className="text-blue-500 cursor-pointer hover:underline">Contact Administrator</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
