"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, TrendingUp, Wallet, Users, Trophy, UserCircle, 
  LogOut, Menu, X, Bot, Zap, AlertTriangle, CheckCircle2, Coins, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, Tooltip, YAxis } from 'recharts';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function TradePage() {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // États pour la logique de trade
  const [amount, setAmount] = useState<string>("");
  const [cryptoSymbol, setCryptoSymbol] = useState<string>("BTC");
  const [loading, setLoading] = useState(false);
  const [activeTrade, setActiveTrade] = useState<any>(null);
  const [isFinished, setIsFinished] = useState(false); 

  const router = useRouter();
  const pathname = usePathname();

  const loadUser = useCallback(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => {
        toast.error("Session expirée");
        router.push('/');
      });
  }, [router]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const calculateDynamicTarget = (val: number) => {
    if (val >= 1000) return val * 14; 
    if (val >= 500) return val * 13;
    if (val >= 300) return val * 11.66;
    return val * 10;
  };

  const checkPersistedTrade = useCallback(async () => {
    try {
      const res = await api.get('/trades/active');
      const trade = res.data?.bot || (Array.isArray(res.data) ? res.data[0] : res.data);

      if (trade && trade.status === 'running') {
        setActiveTrade(trade);
        
        const startTime = new Date(trade.start_time).getTime();
        const durationMs = 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        
        // Calcul du statut terminé
        const finishedStatus = now >= (startTime + durationMs);
        setIsFinished(finishedStatus);

        const elapsed = now - startTime;
        const totalTargetProfit = Math.max(0, trade.target_profit - trade.amount_invested);
        const progressPercent = Math.min(elapsed / durationMs, 1);
        const currentProfit = totalTargetProfit * progressPercent;
        setLiveProfit(currentProfit);

        const historyPoints = [];
        for (let i = 0; i <= 20; i++) {
            historyPoints.push({
                time: i,
                profit: (currentProfit / 20) * i + (Math.random() * 0.5)
            });
        }
        setChartData(historyPoints);

        // --- CORRECTION : GÉNÉRATION DES HEURES BASÉES SUR LE PASSÉ ---
        // Si le trade est fini, on génère les transactions juste avant l'heure de fin.
        // Sinon, on les génère juste avant "maintenant".
        const referenceTime = finishedStatus ? (startTime + durationMs) : now;

        const initialTrades = Array.from({ length: 6 }, (_, i) => ({
            id: referenceTime - (i * 150000),
            pair: `${trade.crypto_symbol}/USDT`,
            type: Math.random() > 0.15 ? 'BUY' : 'SELL',
            profit: (Math.random() * 8 + 2).toFixed(2),
            // On utilise referenceTime pour que l'heure soit fixe à l'actualisation
            time: new Date(referenceTime - (i * 300000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setLiveTrades(initialTrades);

      } else {
        setActiveTrade(null);
        setIsFinished(false);
        setLiveProfit(0);
        setChartData([]);
      }
    } catch (error) {
      console.error("Erreur sync trade");
    }
  }, []);

  useEffect(() => {
    checkPersistedTrade();
  }, [checkPersistedTrade]);

  const [liveProfit, setLiveProfit] = useState(0);
  const [liveTrades, setLiveTrades] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [winRate, setWinRate] = useState(98.4);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTrade && !isFinished) { 
      interval = setInterval(() => {
        const startTime = new Date(activeTrade.start_time).getTime();
        const durationMs = 24 * 60 * 60 * 1000;
        const endTime = startTime + durationMs;
        const now = new Date().getTime();
        
        if (now >= endTime) {
            setIsFinished(true);
            console.log("Trade terminé");
            return; 
        }

        const elapsed = now - startTime;
        const totalTargetProfit = Math.max(0, activeTrade.target_profit - activeTrade.amount_invested);
        const progressPercent = Math.min(elapsed / durationMs, 1);
        const currentProfit = totalTargetProfit * progressPercent;

        setLiveProfit(currentProfit);

        setChartData(prev => {
            const newData = [...prev, { time: prev.length, profit: currentProfit + (Math.random() * 0.2) }];
            return newData.slice(-30); 
        });

        setWinRate(prev => parseFloat((98.2 + Math.random() * 1.3).toFixed(1)));

        const newTrade = {
            id: Date.now(),
            pair: `${activeTrade.crypto_symbol}/USDT`,
            type: Math.random() > 0.1 ? 'BUY' : 'SELL',
            profit: (Math.random() * 4 + 1).toFixed(2),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setLiveTrades(prev => [newTrade, ...prev].slice(0, 6));

      }, 4000);
    }
    return () => clearInterval(interval);
  }, [activeTrade, isFinished]);

  const handleStartBot = async () => {
    if (activeTrade && isFinished) {
        return toast.error("Veuillez d'abord retirer votre gain");
    }

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount < 100) {
      return toast.error("Montant minimum accepté : $100");
    }
    if (user && numAmount > user.balance) {
      return toast.error("Solde insuffisant");
    }

    setLoading(true);
    try {
      const dynamicTarget = calculateDynamicTarget(numAmount);
      await api.post('/trades/start', {
        amount: numAmount,
        crypto_symbol: cryptoSymbol,
        target_profit: dynamicTarget 
      });
      toast.success("AI Bot Trading activé !");
      setAmount("");
      loadUser();
      checkPersistedTrade();
    } catch (error: any) {
      toast.error("Erreur lors du lancement");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => {
    if (!activeTrade) {
      return toast.error("Veuillez d'abord démarrer un trade");
    }
    if (activeTrade && !isFinished) {
      return toast.error("Veuillez patienter jusqu'à la fin du trade");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] font-sans flex flex-col overflow-x-hidden">
      
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

      <main className="max-w-[1400px] mx-auto p-4 md:p-10 w-full space-y-8">
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 md:p-8 bg-[#181A20] rounded-3xl border border-white/5 gap-6">
            <div className='flex items-center gap-4 md:gap-6 w-full lg:w-auto'>
                 <div className={`bg-gradient-to-br from-blue-600 to-indigo-700 p-4 md:p-6 rounded-3xl shadow-lg shadow-blue-900/20 shrink-0 ${(activeTrade && !isFinished) ? 'animate-pulse' : ''}`}>
                    <Bot className="w-8 h-8 md:w-10 md:h-10 text-white" />
                 </div>
                 <div className="min-w-0">
                    <h2 className="text-2xl md:text-3xl font-bold mb-1 truncate">{(activeTrade && !isFinished) ? 'AI Bot Trading...' : 'AI Trading Bot'}</h2>
                    <p className="text-gray-400 text-sm md:text-base">Automated algorithmic trading powered by AI</p>
                 </div>
            </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full lg:w-32">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</div>
              <input type="number" placeholder="Montant" value={amount} onChange={(e) => setAmount(e.target.value)} 
                disabled={activeTrade && !isFinished}
                className="w-full bg-[#0B0E11] border border-white/10 rounded-xl py-3 pl-7 pr-3 outline-none focus:border-blue-500 text-sm font-bold disabled:opacity-50" />
            </div>
            <div className="relative w-full lg:w-32">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500"><Coins size={16} /></div>
              <select value={cryptoSymbol} onChange={(e) => setCryptoSymbol(e.target.value)} 
                disabled={activeTrade && !isFinished}
                className="w-full bg-[#0B0E11] border border-white/10 rounded-xl py-3 pl-9 pr-3 outline-none text-sm font-bold appearance-none cursor-pointer disabled:opacity-50">
                <option value="BTC">BTC</option><option value="ETH">ETH</option><option value="BNB">BNB</option><option value="SOL">SOL</option>
              </select>
            </div>

            <button onClick={handleStartBot} 
              disabled={loading || (activeTrade && !isFinished)}
              className="w-full lg:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20 disabled:opacity-50 text-sm"
            >
              <Bot size={18} /> {(activeTrade && !isFinished) ? "Bot Active" : (loading ? "..." : "Start Trading")}
            </button>

            <button 
              onClick={handleWithdraw}
              className="w-full lg:w-auto flex items-center justify-center gap-2 bg-white/5 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/10 text-sm"
            >
              Withdraw
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard icon={<Zap className="text-blue-400" />} label="Bot Status" value={(activeTrade && !isFinished) ? "RUNNING" : (isFinished ? "COMPLETED" : "IDLE")} status />
          <StatCard icon={<Trophy className="text-green-400" />} label="Total Profit" value={formatCurrency(liveProfit)} subValue={activeTrade ? `${((liveProfit / activeTrade.amount_invested) * 100).toFixed(2)}% ROI` : "0.00% ROI"} trend="up" />
          <StatCard icon={<Wallet className="text-purple-400" />} label="Invested Amount" value={activeTrade ? formatCurrency(activeTrade.amount_invested) : '$0.00'} subValue={`Target: ${activeTrade ? formatCurrency(activeTrade.target_profit) : '---'}`} trend="none" />
          <StatCard icon={<TrendingUp className="text-yellow-400" />} label="Win Rate" value={activeTrade ? `${winRate}%` : "0%"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#181A20] p-6 md:p-8 rounded-3xl border border-white/5 min-h-[350px] md:h-[400px] flex flex-col">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-blue-400" /> Trading Performance</h3>
            <div className="flex-1 relative bg-[#0B0E11]/50 rounded-lg overflow-hidden border border-white/5">
                {activeTrade ? (
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <YAxis hide domain={['dataMin', 'dataMax + 5']} />
                        <Area type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                        <defs><linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                      </AreaChart>
                   </ResponsiveContainer>
                ) : (
                   <p className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm italic px-4 text-center">Start the bot to see live trading performance graph.</p>
                )}
            </div>
          </div>

          <div className="bg-[#181A20] p-6 md:p-8 rounded-3xl border border-white/5 min-h-[350px] md:h-[400px] flex flex-col">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Zap size={18} className="text-blue-400" /> Live Trading Activity</h3>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {activeTrade && liveTrades.length > 0 ? (
                  liveTrades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-3 bg-[#0B0E11] rounded-2xl border border-white/5 animate-in fade-in slide-in-from-bottom-2">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${trade.type === 'BUY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                             {trade.type === 'BUY' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                          </div>
                          <div><p className="font-bold text-sm text-white">{trade.pair}</p><p className="text-[10px] text-gray-500">{trade.time}</p></div>
                       </div>
                       <div className="text-right">
                          <p className="font-bold text-sm text-green-500">+{formatCurrency(parseFloat(trade.profit))}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{trade.type} EXECUTION</p>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30">
                    <Bot size={48} className="text-gray-800" />
                    <p className="text-gray-500 text-sm md:text-base">No live trades. Start the bot!</p>
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

function StatCard({ icon, label, value, subValue, trend, status }: any) {
  return (
    <div className="bg-[#181A20] p-6 rounded-3xl border border-white/5 w-full transition-all hover:border-white/10">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-white/5 p-3 rounded-2xl shrink-0">{React.cloneElement(icon as React.ReactElement, { size: 20 })}</div>
        {status && (
          <span className={`bg-white/5 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shrink-0 ${value === "RUNNING" ? "text-blue-400 animate-pulse" : (value === "COMPLETED" ? "text-green-500" : "text-gray-400")}`}>
            {value}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1 truncate">{label}</p>
        <p className="text-xl md:text-2xl font-bold text-white truncate">{value}</p>
        {subValue && (
          <p className={`text-xs mt-1 font-medium truncate ${trend === 'up' ? 'text-green-500' : 'text-gray-500'}`}>
            {trend === 'up' && '↗ '} {subValue}
          </p>
        )}
      </div>
    </div>
  );
}