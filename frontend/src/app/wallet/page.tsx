"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, TrendingUp, Wallet, Users, Trophy, UserCircle, 
  LogOut, Menu, X, PieChart, History, ArrowUpRight, ArrowDownRight, 
  Banknote, Loader2, AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function WalletPage() {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // États pour le retrait
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const loadData = useCallback(async () => {
    try {
      const [userRes, transRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/trades/history')
      ]);
      setUser(userRes.data);
      const data = transRes.data;
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur chargement données");
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    
    // Logique de validation
    if (!withdrawAmount || isNaN(amount)) return toast.error("Veuillez entrer un montant valide");
    if (amount < 100) return toast.error("Le montant minimum de retrait est de 100$");
    if (user && amount > user.balance) return toast.error("Solde insuffisant");

    setWithdrawLoading(true);

    // Simulation de chargement
    setTimeout(() => {
      setWithdrawLoading(false);
      setIsWithdrawOpen(false);
      setWithdrawAmount("");
      toast.info("Veuillez contacter votre trader pour effectuer un retrait", {
        duration: 5000,
      });
    }, 2500);
  };

  const dynamicHoldings = useMemo(() => {
    if (!user) return [];
    const b = Number(user.balance);
    return [
      { id: 1, name: 'Bitcoin', symbol: 'BTC', amount: (b * 0.000015).toFixed(6), value: b * 0.60, change: '+2.45%', color: 'bg-orange-500' },
      { id: 2, name: 'Ethereum', symbol: 'ETH', amount: (b * 0.00021).toFixed(4), value: b * 0.25, change: '-1.12%', color: 'bg-blue-500' },
      { id: 3, name: 'Solana', symbol: 'SOL', amount: (b * 0.005).toFixed(2), value: b * 0.10, change: '+5.18%', color: 'bg-purple-500' },
      { id: 4, name: 'Tether', symbol: 'USDT', amount: (b * 0.05).toFixed(2), value: b * 0.05, change: '0.00%', color: 'bg-green-500' },
    ];
  }, [user]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] font-sans flex flex-col overflow-x-hidden relative">
      
      {/* --- POPUP RETRAIT (MODAL) --- */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !withdrawLoading && setIsWithdrawOpen(false)} />
          <div className="relative bg-[#181A20] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Banknote className="text-blue-500" /> Retrait de fonds
              </h2>
              <button onClick={() => setIsWithdrawOpen(false)} disabled={withdrawLoading} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Combien voulez-vous retirer ?</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</div>
                  <input 
                    type="number" 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={withdrawLoading}
                    className="w-full bg-[#0B0E11] border border-white/5 rounded-2xl py-4 pl-8 pr-4 outline-none focus:border-blue-500 transition-all font-bold text-lg"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                  <AlertCircle size={12} /> Minimum de retrait : 100.00$
                </p>
              </div>

              <button 
                onClick={handleWithdraw}
                disabled={withdrawLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                {withdrawLoading ? <Loader2 className="animate-spin" size={20} /> : "Confirmer le retrait"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <p className="text-base font-bold text-white tracking-tight">{user ? formatCurrency(user.balance) : '$0.00'}</p>
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

      <main className="max-w-[1400px] mx-auto p-6 md:p-10 w-full space-y-10 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white">My Wallet</h1>
            <button 
                onClick={() => setIsWithdrawOpen(true)}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
                <Banknote size={18} className="text-blue-500" /> Withdraw Funds
            </button>
        </div>

        {/* --- TOP CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#4F46E5] to-[#9333EA] p-8 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6 text-white/90"><Wallet size={18} /><span className="text-[11px] font-bold uppercase tracking-widest">Available Balance</span></div>
            <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">{user ? formatCurrency(user.balance) : '$0.00'}</p>
          </div>
          <div className="bg-[#181A20] p-8 rounded-2xl border border-white/5 transition-all hover:border-white/10">
            <div className="flex items-center gap-2 mb-6 text-green-500"><TrendingUp size={18} /><span className="text-[11px] font-bold uppercase tracking-widest">Portfolio Value</span></div>
            <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">{user ? formatCurrency(user.balance) : '$0.00'}</p>
          </div>
          <div className="bg-[#181A20] p-8 rounded-2xl border border-white/5 transition-all hover:border-white/10">
            <div className="flex items-center gap-2 mb-6 text-blue-400"><PieChart size={18} /><span className="text-[11px] font-bold uppercase tracking-widest">Total Assets</span></div>
            <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">{user ? formatCurrency(user.balance) : '$0.00'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Holdings */}
          <div className="bg-[#121418] p-8 rounded-3xl border border-white/5 min-h-[400px] flex flex-col">
            <h3 className="text-xl font-bold text-white mb-10">Your Holdings</h3>
            <div className="space-y-4">
              {dynamicHoldings.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-4 bg-[#0B0E11] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${asset.color} rounded-full flex items-center justify-center font-bold text-white text-xs`}>{asset.symbol}</div>
                    <div><p className="font-bold text-white text-sm">{asset.name}</p><p className="text-[11px] text-gray-500 font-medium">{asset.amount} {asset.symbol}</p></div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white text-sm">{formatCurrency(asset.value)}</p>
                    <p className={`text-[10px] font-bold ${asset.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{asset.change}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-[#121418] p-8 rounded-3xl border border-white/5 min-h-[400px] flex flex-col">
            <h3 className="text-xl font-bold text-white mb-10">Recent Transactions</h3>
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-[#0B0E11] rounded-2xl border border-white/5 transition-all hover:border-white/10">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${tx.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {tx.status === 'completed' ? <ArrowUpRight size={20} /> : <TrendingUp size={20} className="animate-pulse" />}
                      </div>
                      <div><p className="font-bold text-white text-sm">{tx.crypto_symbol}/USDT</p><p className="text-[10px] text-gray-500 uppercase tracking-wider">{new Date(tx.start_time).toLocaleDateString()} • {tx.status}</p></div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${tx.status === 'completed' ? 'text-green-500' : 'text-white'}`}>
                        {tx.status === 'completed' ? `+${formatCurrency(Number(tx.target_profit) - Number(tx.amount_invested))}` : formatCurrency(Number(tx.amount_invested))}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase">{tx.status === 'completed' ? 'Net Profit' : 'Invested'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <History size={48} className="mb-4" />
                  <p className="font-bold">No transactions found</p>
                </div>
              )}
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