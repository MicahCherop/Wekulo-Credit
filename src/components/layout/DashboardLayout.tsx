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

  // Global idle timeout (10 mins)
  useIdleTimeout();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      console.log('DashboardLayout: Checking session...');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey || supabaseUrl === '' || supabaseKey === '') {
        console.error('DashboardLayout: Supabase config is missing!');
        setInitError('Supabase Configuration Missing. Please check your environment variables.');
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (!mounted) return;

        if (!session) {
          console.log('DashboardLayout: No session, redirecting to login');
          navigate('/login');
          return;
        }

        console.log('DashboardLayout: Session found', session.user.email);
        setUser(session.user);
        await syncProfile(session.user);
      } catch (error) {
        console.error('DashboardLayout: Session check failed:', error);
      } finally {
        if (mounted) {
          console.log('DashboardLayout: Clearing loading state');
          setIsLoading(false);
        }
      }
    };

    // Safety timeout
    const timeoutId = window.setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('DashboardLayout: Auth check timed out. Forcing UI render.');
        setIsLoading(false);
      }
    }, 8000);

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('DashboardLayout: Auth state change:', event, session?.user?.email);
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        setUser(null);
        setProfile(null);
        if (location.pathname !== '/login') navigate('/login');
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .single();

      if (data) {
        setProfile(data);
      } else if (error && error.code === 'PGRST116') {
        const { data: preAuth } = await supabase
          .from('pre_authorized_emails')
          .select('role')
          .eq('email', userData.email)
          .single();
        
        const role = preAuth?.role || (userData.email === 'mic1dev.me@gmail.com' ? 'developer' : 'officer');
        
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{ id: userData.id, email: userData.email, role }])
          .select()
          .single();
        
        if (newProfile) setProfile(newProfile);
      }
    } catch (err) {
      console.error('Error syncing profile:', err);
    }
  };

  const handleLogout = async () => {
    console.log('DashboardLayout: Attempting logout...');
    try {
      // Force loading state
      setIsLoading(true);
      
      // Attempt signOut with a timeout
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 3000)
      );

      await Promise.race([signOutPromise, timeoutPromise]);
      console.log('DashboardLayout: Logout successful');
    } catch (err) {
      console.error('DashboardLayout: Logout error or timeout:', err);
      // Even if it fails, clear local state and navigate
      setUser(null);
      setProfile(null);
    } finally {
      navigate('/login');
      setIsLoading(false);
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
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium animate-pulse">Initializing Security...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-rose-50 p-6 text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mb-6">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-rose-900 mb-2">Configuration Error</h1>
        <p className="text-rose-700 mb-8 max-w-md">{initError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg active:scale-95"
        >
          Check Settings & Retry
        </button>
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
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </section>
      </main>
    </div>
  );
}
