"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, TrendingUp, Wallet, Users, Trophy, UserCircle, 
  LogOut, Menu, X, Copy, Share2, CheckCircle2, Gift
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function ReferralsPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({ totalReferrals: 0, totalEarnings: 0, referralCode: "", referrals: [] });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const loadData = useCallback(async () => {
    try {
      const [userRes, statsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/referrals/stats')
      ]);
      setUser(userRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Erreur chargement referrals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const referralLink = `https://cryptosim.app/?ref=${stats.referralCode || '...'}`;

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

            {/* Desktop Navigation */}
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
                {user ? `$${Number(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
              </p>
            </div>
            <button onClick={() => { localStorage.clear(); router.push('/'); }} className="text-gray-400 hover:text-white transition-colors"><LogOut size={20}/></button>
            
            {/* Burger Menu Button */}
            <button className="p-2 text-gray-400 lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* --- MOBILE MENU --- */}
        {isMenuOpen && (
          <div className="lg:hidden bg-[#181A20] border-b border-white/5 p-4 flex flex-col gap-2 animate-in slide-in-from-top duration-300">
            <NavLink href="/dashboard" label="Dashboard" active={pathname === '/dashboard'} fullWidth />
            <NavLink href="/trade" label="Trade" active={pathname === '/trade'} fullWidth />
            <NavLink href="/wallet" label="Wallet" active={pathname === '/wallet'} fullWidth />
            <NavLink href="/referrals" label="Referrals" active={pathname === '/referrals'} fullWidth />
            <NavLink href="/leaderboard" label="Leaderboard" active={pathname === '/leaderboard'} fullWidth />
            <NavLink href="/account" label="Account" active={pathname === '/account'} fullWidth />
          </div>
        )}
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-[1400px] mx-auto p-6 md:p-10 w-full space-y-10 flex-1">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Referral Program</h1>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#4F46E5] to-[#9333EA] p-8 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6 text-white/90"><Users size={18} /><span className="text-[11px] font-bold uppercase tracking-widest">Total Referrals</span></div>
            <p className="text-4xl md:text-5xl font-bold text-white tracking-tight">{stats.totalReferrals}</p>
          </div>
          <div className="bg-[#181A20] p-8 rounded-2xl border border-white/5 transition-all hover:border-white/10">
            <div className="flex items-center gap-2 mb-6 text-green-500"><Gift size={18} /><span className="text-[11px] font-bold uppercase tracking-widest">Total Earnings</span></div>
            <p className="text-4xl md:text-5xl font-bold text-white tracking-tight">${Number(stats.totalEarnings).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-[#181A20] p-8 rounded-2xl border border-white/5 transition-all hover:border-white/10">
            <div className="flex items-center gap-2 mb-6 text-blue-500"><CheckCircle2 size={18} /><span className="text-[11px] font-bold uppercase tracking-widest">Reward per Referral</span></div>
            <p className="text-4xl md:text-5xl font-bold text-white tracking-tight">$5</p>
          </div>
        </div>

        {/* --- REFERRAL LINK SECTION --- */}
        <div className="bg-[#121418] p-8 rounded-3xl border border-white/5 space-y-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Your Referral Link</h3>
            <p className="text-gray-500 text-sm">Share your unique referral link and earn $5 for each friend who signs up!</p>
          </div>
          <div className="max-w-4xl space-y-4">
            <div className="bg-[#181A20] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Referral Code</p>
                <p className="text-lg font-mono font-bold text-white tracking-wider uppercase">{stats.referralCode || "---"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copyToClipboard(stats.referralCode)} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                  <Copy size={16} /> {copied ? "Copied!" : "Copy Link"}
                </button>
                <button className="bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl border border-white/5 transition-all"><Share2 size={18} /></button>
              </div>
            </div>
            <div className="bg-[#0B0E11] border border-white/5 rounded-2xl p-4"><p className="text-gray-400 font-mono text-sm break-all">{referralLink}</p></div>
          </div>
        </div>

        {/* --- YOUR REFERRALS TABLE --- */}
        <div className="bg-[#121418] p-8 rounded-3xl border border-white/5 overflow-hidden">
          <h3 className="text-xl font-bold text-white mb-8">Your Referrals</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
                  <th className="pb-4 font-bold">Username</th>
                  <th className="pb-4 font-bold text-center">Join Date</th>
                  <th className="pb-4 font-bold text-center">Earnings</th>
                  <th className="pb-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.referrals.length > 0 ? stats.referrals.map((ref: any, idx: number) => (
                  <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600/20 to-purple-500/20 flex items-center justify-center text-blue-400 font-bold text-sm uppercase">
                          {ref.email.charAt(0)}
                        </div>
                        <span className="font-bold text-white text-sm">{ref.email.split('@')[0]}</span>
                      </div>
                    </td>
                    <td className="py-5 text-center text-sm text-gray-400">
                      {new Date(ref.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-5 text-center font-bold text-green-500 text-sm">
                      +$5.00
                    </td>
                    <td className="py-5 text-right">
                      <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded-full tracking-wider">
                        {ref.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-gray-500 italic text-sm">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <Users size={40} />
                        <p>No referrals yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- HOW IT WORKS --- */}
        <div className="bg-[#121418] p-8 rounded-3xl border border-white/5">
          <h3 className="text-xl font-bold text-white mb-12">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <Step number="1" color="bg-blue-600" title="Share Your Link" desc="Send your unique referral link to friends via email, social media, or messaging apps." />
            <Step number="2" color="bg-purple-600" title="Friend Joins" desc="Your friend signs up using your referral link and creates an account." />
            <Step number="3" color="bg-green-600" title="Earn Rewards" desc="Get $5 credited to your account instantly when they complete registration." />
          </div>
        </div>
      </main>
    </div>
  );
}

function Step({ number, color, title, desc }: any) {
  return (
    <div className="flex flex-col items-center text-center space-y-4">
      <div className={`w-14 h-14 ${color} rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg`}>{number}</div>
      <div className="space-y-2">
        <h4 className="font-bold text-white text-lg">{title}</h4>
        <p className="text-gray-500 text-sm leading-relaxed px-4 md:px-0">{desc}</p>
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