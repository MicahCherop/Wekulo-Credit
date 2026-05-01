import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Shield, Trash2, Mail, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface Profile {
  id: string;
  email: string;
  role: 'developer' | 'admin' | 'officer';
  created_at: string;
}

export default function Admin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setCurrentProfile(profile);

      // Only allow developers to see the full list for now
      if (profile?.role === 'developer' || profile?.role === 'admin') {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        setProfiles(data || []);
      }
    }
    setLoading(false);
  };

  const updateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (error) {
      alert(error.message);
    } else {
      fetchData();
    }
  };

  if (currentProfile?.role !== 'developer' && currentProfile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Shield size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have administrative privileges.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
          <p className="text-sm text-slate-400 mt-1">Manage platform administrators and access rights</p>
        </div>
        {currentProfile?.role === 'developer' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900 transition-all shadow-md active:scale-95"
          >
            <UserPlus size={18} />
            Promote User
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-xs font-medium text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">User</th>
                <th className="px-8 py-5">Role</th>
                <th className="px-8 py-5">Joined</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 text-sm">Loading users...</td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 text-sm">No users found.</td>
                </tr>
              ) : profiles.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <UserIcon size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{item.email}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest">{item.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium border ${
                      item.role === 'developer' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      item.role === 'admin' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      'bg-slate-50 text-slate-700 border-slate-100'
                    }`}>
                      {item.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-4 text-right">
                    {currentProfile.role === 'developer' && item.role !== 'developer' && (
                      <select
                        value={item.role}
                        onChange={(e) => updateRole(item.id, e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="admin">Make Admin</option>
                        <option value="officer">Make Officer</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
           <div className="p-6 border-b border-slate-100 flex items-center justify-between">
             <h3 className="text-lg font-semibold text-slate-800">Change Role</h3>
             <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
               <X size={24} />
             </button>
           </div>
           <form className="p-6 space-y-4" onSubmit={(e) => {
             e.preventDefault();
             // In a real app we'd search or invite by email
             alert("Search for existing users in the table to modify roles.");
             setShowAddModal(false);
           }}>
             <p className="text-sm text-slate-500">Search for a user in the database to promote them to Admin.</p>
             <button
               type="button"
               onClick={() => setShowAddModal(false)}
               className="w-full px-4 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-all"
             >
               Close
             </button>
           </form>
         </div>
       </div>
      )}
    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
