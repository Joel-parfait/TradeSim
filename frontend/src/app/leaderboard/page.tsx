"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, TrendingUp, Wallet, Users, Trophy, UserCircle, 
  LogOut, Menu, X, Medal, Crown, Target
} from 'lucide-react';
import api from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [user, setUser] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const loadData = useCallback(async () => {
    try {
      const [userRes, leadRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/leaderboard') // Route à créer dans ton index.ts
      ]);
      setUser(userRes.data);
      setRankings(leadRes.data);
    } catch (error) {
      console.error("Erreur leaderboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2,
    }).format(val || 0);
  };

  // Top 3 pour le podium
  const topThree = rankings.slice(0, 3);
  const others = rankings.slice(3);

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] font-sans flex flex-col overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
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
              <p className="text-base font-bold text-white tracking-tight">
                {user ? formatCurrency(user.balance) : '$0.00'}
              </p>
            </div>
            <button onClick={() => { localStorage.clear(); router.push('/'); }} className="text-gray-400 hover:text-white transition-colors"><LogOut size={20}/></button>
            <button className="p-2 text-gray-400 lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="lg:hidden bg-[#181A20] border-b border-white/5 p-4 flex flex-col gap-2">
            <NavLink href="/dashboard" label="Dashboard" active={pathname === '/dashboard'} fullWidth />
            <NavLink href="/trade" label="Trade" active={pathname === '/trade'} fullWidth />
            <NavLink href="/wallet" label="Wallet" active={pathname === '/wallet'} fullWidth />
            <NavLink href="/referrals" label="Referrals" active={pathname === '/referrals'} fullWidth />
            <NavLink href="/leaderboard" label="Leaderboard" active={pathname === '/leaderboard'} fullWidth />
            <NavLink href="/account" label="Account" active={pathname === '/account'} fullWidth />
          </div>
        )}
      </nav>

      {/* --- CONTENT --- */}
      <main className="max-w-[1400px] mx-auto p-6 md:p-10 w-full space-y-12 flex-1">
        
        <div className="flex items-center gap-4">
            <Trophy className="text-yellow-500" size={32} />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Leaderboard</h1>
        </div>

        {/* --- PODIUM (Top 3) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Rang #2 */}
          {topThree[1] && (
            <PodiumCard trader={topThree[1]} rank={2} color="text-gray-400" />
          )}

          {/* Rang #1 - CHAMPION */}
          {topThree[0] && (
            <div className="relative pt-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest z-10">Champion</div>
                <PodiumCard trader={topThree[0]} rank={1} color="text-yellow-500" isMain />
            </div>
          )}

          {/* Rang #3 */}
          {topThree[2] && (
            <PodiumCard trader={topThree[2]} rank={3} color="text-orange-600" />
          )}
        </div>

        {/* --- ALL RANKINGS TABLE --- */}
        <div className="bg-[#121418] p-8 rounded-3xl border border-white/5">
          <h3 className="text-xl font-bold text-white mb-8">All Rankings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
                  <th className="pb-4 font-bold">Rank</th>
                  <th className="pb-4 font-bold">Trader</th>
                  <th className="pb-4 font-bold text-center">Portfolio Value</th>
                  <th className="pb-4 font-bold text-right">Total Trades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {others.map((trader: any) => (
                  <tr key={trader.rank} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-5 font-bold text-gray-500">#{trader.rank}</td>
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center font-bold text-sm uppercase text-gray-400">
                          {trader.username.charAt(0)}
                        </div>
                        <span className="font-bold text-white text-sm">{trader.username}</span>
                      </div>
                    </td>
                    <td className="py-5 text-center font-bold text-white">{formatCurrency(trader.portfolioValue)}</td>
                    <td className="py-5 text-right text-sm text-gray-400 font-mono">{trader.totalTrades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function PodiumCard({ trader, rank, color, isMain }: any) {
    return (
        <div className={`p-8 rounded-3xl border flex flex-col items-center space-y-4 transition-all ${isMain ? 'bg-[#181A20] border-yellow-500/50 shadow-[0_0_40px_-10px_rgba(234,179,8,0.2)]' : 'bg-[#121418] border-white/5'}`}>
            <div className={`w-16 h-16 rounded-full bg-white/5 flex items-center justify-center ${color}`}>
                {rank === 1 ? <Crown size={32} /> : <Medal size={32} />}
            </div>
            <div className="text-center">
                <h4 className="font-bold text-white text-lg">{trader.username}</h4>
                <p className={`font-black text-xl mb-4 ${color}`}>#{rank}</p>
                <p className="text-2xl font-bold text-white tracking-tight">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(trader.portfolioValue)}</p>
            </div>
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