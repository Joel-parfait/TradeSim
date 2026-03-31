"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, TrendingUp, Wallet, Users, Trophy, UserCircle, 
  LogOut, Menu, X, ArrowUpRight, ArrowDownRight, Bell, Search 
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const CRYPTO_LIST = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#f97316' },
  { symbol: 'ETH', name: 'Ethereum', color: '#3b82f6' },
  { symbol: 'SOL', name: 'Solana', color: '#8b5cf6' },
  { symbol: 'BNB', name: 'BNB', color: '#eab308' },
  { symbol: 'XRP', name: 'Ripple', color: '#22d3ee' },
  { symbol: 'ADA', name: 'Cardano', color: '#2563eb' },
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [marketData, setMarketData] = useState<any>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const router = useRouter();

  // 1. CHARGEMENT UTILISATEUR + TOAST DE BIENVENUE
  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        setUser(res.data);
        const name = res.data.username || res.data.email.split('@')[0];
        // Le Toast "Welcome" exact que tu as demandé
        toast.success(`Welcome ${name}`, {
            description: "Synchronisation avec le marché réussie."
        });
      })
      .catch(() => {
        toast.error("Session expirée");
        router.push('/');
      });
  }, [router]);

  // 2. RÉCUPÉRATION PRIX TEMPS RÉEL (BINANCE)
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await res.json();
        const formatted = data.reduce((acc: any, curr: any) => {
          const symbol = curr.symbol.replace('USDT', '');
          if (CRYPTO_LIST.find(c => c.symbol === symbol)) {
            acc[symbol] = {
              price: parseFloat(curr.lastPrice),
              change: parseFloat(curr.priceChangePercent),
            };
          }
          return acc;
        }, {});
        setMarketData(formatted);
      } catch (e) { console.error("Erreur API Binance"); }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  // 3. MISE À JOUR DU GRAPHIQUE
  useEffect(() => {
    if (marketData[selectedCrypto]) {
      const basePrice = marketData[selectedCrypto].price;
      const points = Array.from({ length: 20 }, (_, i) => ({
        time: i,
        price: basePrice * (1 + (Math.random() - 0.5) * 0.01)
      }));
      setChartData(points);
    }
  }, [selectedCrypto, marketData]);

  const formatBinance = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: val < 1 ? 4 : 2,
      maximumFractionDigits: val < 1 ? 4 : 2,
    }).format(val);
  };

  const isPos = marketData[selectedCrypto]?.change >= 0;
  const userName = user?.username || user?.email?.split('@')[0] || 'Trader';

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] font-sans flex flex-col overflow-x-hidden">
      
      {/* --- NAVBAR RESPONSIVE --- */}
      <nav className="border-b border-white/5 bg-[#181A20] sticky top-0 z-[100] w-full">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-xl text-primary-start">
              <TrendingUp size={24} /> <span className="hidden xs:block tracking-tighter">CryptoSim</span>
            </div>
            <div className="hidden lg:flex items-center gap-1">
              <NavLink label="Dashboard" active icon={<LayoutDashboard size={16}/>} />
              <NavLink label="Trade" icon={<TrendingUp size={16}/>} />
              <NavLink label="Wallet" icon={<Wallet size={16}/>} />
              <NavLink label="Referrals" icon={<Users size={16}/>} />
              <NavLink label="Leaderboard" icon={<Trophy size={16}/>} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block border-r border-white/10 pr-4">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Balance</p>
              <p className="text-sm font-bold text-[#00C087]">${formatBinance(user?.balance ?? 0)}</p>
            </div>
            <button className="p-2 text-gray-400 lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
            <button className="hidden lg:block text-gray-500 hover:text-red-400" onClick={() => { localStorage.clear(); router.push('/'); }}>
              <LogOut size={20}/>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 w-full bg-[#181A20] border-b border-white/5 p-4 flex flex-col gap-2 animate-in slide-in-from-top duration-300">
            <NavLink label="Dashboard" active fullWidth />
            <NavLink label="Trade" fullWidth />
            <NavLink label="Wallet" fullWidth />
            <NavLink label="Account" fullWidth />
            <button className="flex items-center gap-3 p-3 text-red-400 font-bold" onClick={() => router.push('/')}>
              <LogOut size={18}/> Logout
            </button>
          </div>
        )}
      </nav>

      {/* --- CONTENT --- */}
      <main className="max-w-[1400px] mx-auto p-4 md:p-8 w-full">
        
        {/* TITRES DEMANDÉS */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Welcome back, <span className="text-primary-start">{userName}!</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base font-medium mt-1">
            Here's your trading overview
          </p>
        </div>

        {/* HEADER STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatBox title="Available Balance" value={`$${formatBinance(user?.balance ?? 0)}`} color="text-white" />
          <StatBox title="PNL (24h)" value={`$${formatBinance((user?.balance ?? 0) * 0.02)}`} subValue="+2.15%" subColor="text-[#00C087]" />
          <StatBox title="Equity" value={`$${formatBinance(user?.balance ?? 0)}`} color="text-white" />
        </div>

        {/* LAYOUT GRAPHE / MARCHÉ */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          <div className="flex-[2] bg-[#181A20] rounded-3xl border border-white/5 p-5 md:p-8 min-w-0">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter">${formatBinance(marketData[selectedCrypto]?.price ?? 0)}</h2>
                <span className={`text-xs font-bold px-2 py-1 rounded ${isPos ? 'bg-[#00C087]/10 text-[#00C087]' : 'bg-[#F6465D]/10 text-[#F6465D]'}`}>
                  {isPos ? '▲' : '▼'} {marketData[selectedCrypto]?.change}%
                </span>
              </div>
              <select 
                value={selectedCrypto}
                onChange={(e) => setSelectedCrypto(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                {CRYPTO_LIST.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol}</option>)}
              </select>
            </div>

            <div className="h-[250px] md:h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPos ? '#00C087' : '#F6465D'} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={isPos ? '#00C087' : '#F6465D'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{backgroundColor: '#1e2329', border: 'none', borderRadius: '8px'}} />
                  <Area type="monotone" dataKey="price" stroke={isPos ? '#00C087' : '#F6465D'} strokeWidth={3} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MARKET OVERVIEW */}
          <div className="flex-1 bg-[#181A20] rounded-3xl border border-white/5 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="font-bold">Market Overview</h3>
              <button className="px-4 py-2 bg-primary-start rounded-xl text-xs font-bold shadow-lg shadow-blue-500/10 hover:scale-105 transition-transform">
                Start Trading
              </button>
            </div>
            <div className="flex-grow overflow-y-auto max-h-[450px] custom-scrollbar">
              {CRYPTO_LIST.map((crypto) => {
                const data = marketData[crypto.symbol];
                return (
                  <div key={crypto.symbol} onClick={() => setSelectedCrypto(crypto.symbol)} className={`p-4 flex items-center justify-between cursor-pointer transition-all ${selectedCrypto === crypto.symbol ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs" style={{backgroundColor: `${crypto.color}20`, color: crypto.color}}>{crypto.symbol[0]}</div>
                      <div>
                        <p className="font-bold text-sm">{crypto.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{crypto.symbol} / USDT</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${formatBinance(data?.price ?? 0)}</p>
                      <p className={`text-[10px] font-bold ${data?.change >= 0 ? 'text-[#00C087]' : 'text-[#F6465D]'}`}>{data?.change}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavLink({ label, icon, active, fullWidth }: any) {
  return (
    <button className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${fullWidth ? 'w-full' : ''} ${active ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
      {icon} {label}
    </button>
  );
}

function StatBox({ title, value, subValue, color, subColor }: any) {
  return (
    <div className="bg-[#181A20] border border-white/5 p-6 rounded-3xl flex flex-col justify-center min-h-[120px]">
      <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-1">{title}</p>
      <p className={`text-2xl md:text-3xl font-black tracking-tighter ${color}`}>{value}</p>
      {subValue && <p className={`text-[10px] mt-1 font-bold ${subColor}`}>{subValue}</p>}
    </div>
  );
}