import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  UserPlus, 
  FileText, 
  Bell, 
  LogOut, 
  LayoutDashboard,
  ClipboardList,
  ShieldCheck,
  Menu,
  X,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { useIdleTimeout } from '../../hooks/useIdleTimeout';

interface Profile {
  id: string;
  email: string;
  role: 'developer' | 'admin' | 'officer';
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Global idle timeout (10 mins)
  useIdleTimeout();

  useEffect(() => {
    let mounted = true;
    let timeoutId: number;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (!mounted) return;

        if (session) {
          setUser(session.user);
          await syncProfile(session.user);
        } else if (location.pathname !== '/login') {
          navigate('/login');
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    // Safety timeout: stop loading after 5 seconds no matter what
    timeoutId = window.setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('DashboardLayout: Auth check timed out. Forcing UI render.');
        setIsLoading(false);
      }
    }, 5000);

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || (!session && event === 'INITIAL_SESSION')) {
        setUser(null);
        setProfile(null);
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      } else if (session) {
        setUser(session.user);
        await syncProfile(session.user);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [navigate]);

  const syncProfile = async (userData: any) => {
    try {
      setSyncError(null);
      // Prefer "profiles" table for extra user data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .single();

      if (data) {
        setProfile(data);
      } else if (error && error.code === 'PGRST116') {
        // Not found, attempt to create
        const role = userData.email === 'mic1dev.me@gmail.com' ? 'developer' : 'officer';
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: userData.id, email: userData.email, role }])
          .select()
          .single();
        
        if (insertError) {
          // If insert fails (maybe already exists now?), try one more select
          const { data: retryData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userData.id)
            .single();
          if (retryData) {
            setProfile(retryData);
          } else {
            throw insertError;
          }
        } else if (newProfile) {
          setProfile(newProfile);
        }
      } else if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Profile sync error:', err);
      setSyncError(err.message || 'Failed to sync user profile. Data may not be visible.');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      navigate('/login');
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: UserPlus },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Active Loans', path: '/active-loans', icon: ClipboardList },
    { name: 'Loan Requests', path: '/requests', icon: Bell },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  // Add Admin if developer/admin
  const isDeveloper = user?.email === 'mic1dev.me@gmail.com';
  if (isDeveloper || profile?.role === 'developer' || profile?.role === 'admin') {
    menuItems.push({ name: 'Admin', path: '/admin', icon: ShieldCheck });
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
              W
            </div>
            <span className="font-semibold text-lg text-slate-800">Wekulo Credit</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <div className="px-4 py-2 text-xs font-medium text-slate-400 mb-1">Navigation</div>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon size={18} className={location.pathname === item.path ? 'text-blue-500' : 'text-slate-300'} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3 px-2 py-1 mb-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
              <Users size={18} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{user?.email?.split('@')[0] || 'Officer'}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{profile?.role || 'Officer'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors group"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">W</div>
                  <span className="font-semibold text-lg text-slate-800">Wekulo</span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      location.pathname === item.path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.name}
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t border-slate-100">
                 <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 text-rose-600 font-semibold text-sm"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 lg:hidden text-slate-500 hover:bg-slate-50 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-slate-700 truncate">
              {menuItems.find(item => item.path === location.pathname)?.name || 'Credit Portal'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative p-2 text-slate-300 hover:text-slate-500 cursor-pointer">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-400 rounded-full border-2 border-white"></span>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {syncError && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-sm animate-in slide-in-from-top duration-300">
                <AlertCircle size={20} className="text-amber-500 shrink-0" />
                <p className="flex-1">
                  <strong>Sync Warning:</strong> {syncError} This may affect data visibility. Try refreshing the page.
                </p>
                <button onClick={() => window.location.reload()} className="px-3 py-1 bg-amber-100 hover:bg-amber-200 rounded-lg font-bold transition-colors">
                  Retry
                </button>
              </div>
            )}
            
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              {children}
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
