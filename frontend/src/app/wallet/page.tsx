"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, TrendingUp, Wallet, Users, Trophy, UserCircle, 
  LogOut, Menu, X, PieChart, History
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function WalletPage() {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const loadUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (error) {
      console.error("Erreur chargement profil");
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] font-sans flex flex-col overflow-x-hidden">
      
      {/* --- NAVBAR (Identique à TradePage pour la cohérence) --- */}
      <nav className="bg-[#121212] border-b border-white/5 sticky top-0 z-[100] w-full">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-10">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-500 rounded-lg flex items-center justify-center">
                <TrendingUp size={18} className="text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">CryptoSim</span>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <NavLink href="/dashboard" label="Dashboard" active={pathname === '/dashboard'} icon={<LayoutDashboard size={18}/>} />
              <NavLink href="/trade" label="Trade" active={pathname === '/trade'} icon={<TrendingUp size={18}/>} />
              <NavLink href="/wallet" label="Wallet" active={pathname === '/wallet'} icon={<Wallet size={18}/>} />
              <NavLink href="/referrals" label="Referrals" active={pathname === '/referrals'} icon={<Users size={18}/>} />
              <NavLink href="/leaderboard" label="Leaderboard" active={pathname === '/leaderboard'} icon={<Trophy size={18}/>} />
              <NavLink href="/account" label="Account" active={pathname === '/account'} icon={<UserCircle size={18}/>} />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider leading-tight">Balance</p>
              <p className="text-base font-bold text-white tracking-tight">{user ? formatCurrency(user.balance) : '$0.00'}</p>
            </div>
            <button onClick={() => { localStorage.clear(); router.push('/'); }} className="text-gray-400 hover:text-white transition-colors"><LogOut size={20}/></button>
            <button className="p-2 text-gray-400 lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="lg:hidden bg-[#181A20] border-b border-white/5 p-4 flex flex-col gap-2">
            <NavLink href="/dashboard" label="Dashboard" active={pathname === '/dashboard'} fullWidth />
            <NavLink href="/trade" label="Trade" active={pathname === '/trade'} fullWidth />
            <NavLink href="/wallet" label="Wallet" active={pathname === '/wallet'} fullWidth />
          </div>
        )}
      </nav>

      {/* --- CONTENT --- */}
      <main className="max-w-[1400px] mx-auto p-6 md:p-10 w-full space-y-10">
        
        <h1 className="text-3xl md:text-4xl font-bold text-white">My Wallet</h1>

        {/* --- TOP CARDS (3 colonnes responsive) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card: Available Balance (Le dégradé de ton image) */}
          <div className="bg-gradient-to-br from-[#4F46E5] to-[#9333EA] p-8 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6 text-white/90">
              <Wallet size={18} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Available Balance</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              {user ? formatCurrency(user.balance) : '$0.00'}
            </p>
          </div>

          {/* Card: Portfolio Value */}
          <div className="bg-[#181A20] p-8 rounded-2xl border border-white/5 transition-all hover:border-white/10">
            <div className="flex items-center gap-2 mb-6 text-green-500">
              <TrendingUp size={18} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Portfolio Value</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-white">$0.00</p>
          </div>

          {/* Card: Total Assets */}
          <div className="bg-[#181A20] p-8 rounded-2xl border border-white/5 transition-all hover:border-white/10">
            <div className="flex items-center gap-2 mb-6 text-blue-400">
              <PieChart size={18} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Total Assets</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-white">
              {user ? formatCurrency(user.balance) : '$0.00'}
            </p>
          </div>
        </div>

        {/* --- BOTTOM SECTIONS (Holdings & Transactions) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Your Holdings */}
          <div className="bg-[#121418] p-8 rounded-3xl border border-white/5 min-h-[400px] flex flex-col">
            <h3 className="text-xl font-bold text-white mb-10">Your Holdings</h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                 <Wallet size={40} className="text-gray-700" />
              </div>
              <p className="text-gray-400 font-bold text-lg">No holdings yet</p>
              <p className="text-gray-600 text-sm mt-1">Start trading to see your portfolio here</p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-[#121418] p-8 rounded-3xl border border-white/5 min-h-[400px] flex flex-col">
            <h3 className="text-xl font-bold text-white mb-10">Recent Transactions</h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                 <History size={40} className="text-gray-700" />
              </div>
              <p className="text-gray-400 font-bold text-lg">No transactions yet</p>
              <p className="text-gray-600 text-sm mt-1">Your trading history will appear here</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function NavLink({ href, label, icon, active, fullWidth }: any) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${fullWidth ? 'w-full' : ''} ${active ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}>
      {icon && <span className={active ? 'text-white' : 'text-gray-500 shrink-0'}>{icon}</span>}
      <span className="truncate">{label}</span>
    </Link>
  );
}