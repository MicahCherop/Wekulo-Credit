import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Customer } from '../types';
import { 
  Users, 
  Search, 
  MoreVertical, 
  Phone, 
  Mail,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        loans:loans(count)
      `)
      .order('created_at', { ascending: false });

    if (data) setCustomers(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-200 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400 text-sm">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-sm italic">No customers found.</div>
        ) : customers.map((customer) => (
          <div key={customer.id} className="bg-white p-5 sm:p-7 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 rounded-bl-[100%] transition-all group-hover:bg-blue-50/50 -z-0"></div>
            
            <button className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10">
              <MoreVertical size={18} />
            </button>
            
            <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-8 relative z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-slate-100 overflow-hidden border-4 border-white shadow-lg transition-all duration-300">
                <img src={customer.photo_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg sm:text-xl text-slate-800 truncate leading-tight">{customer.name}</h3>
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 mt-1">
                  <Plus size={12} className="shrink-0" />
                  Verified
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 relative z-10">
              <div className="group/item flex items-center gap-3 sm:gap-4 transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:text-blue-500 transition-colors">
                  <Phone size={16} />
                </div>
                <div>
                   <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-none mb-1">Phone</p>
                   <p className="text-xs sm:text-sm font-medium text-slate-600">{customer.phone}</p>
                </div>
              </div>
              <div className="group/item flex items-center gap-3 sm:gap-4 transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:text-blue-500 transition-colors">
                  <Mail size={16} />
                </div>
                <div>
                   <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-none mb-1">Email</p>
                   <p className="text-xs sm:text-sm font-medium text-slate-600 truncate max-w-[120px] sm:max-w-[140px]">{customer.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 sm:pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
              <div className="bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-slate-100 text-center sm:text-left">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Loans</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-800">{customer.loans?.[0]?.count || 0}</p>
              </div>
              <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white text-xs font-medium rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95">
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
