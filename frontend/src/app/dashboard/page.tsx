"use client";
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, TrendingUp, Wallet, Users, Trophy, UserCircle, 
  LogOut, Menu, X 
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const CRYPTO_LIST = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#f97316' },
  { symbol: 'ETH', name: 'Ethereum', color: '#3b82f6' },
  { symbol: 'BNB', name: 'BNB', color: '#eab308' },
  { symbol: 'SOL', name: 'Solana', color: '#8b5cf6' },
  { symbol: 'XRP', name: 'Ripple', color: '#2389ff' },
  { symbol: 'ADA', name: 'Cardano', color: '#2563eb' },
  { symbol: 'AVAX', name: 'Avalanche', color: '#e84142' },
  { symbol: 'DOT', name: 'Polkadot', color: '#e6007a' },
  { symbol: 'TRX', name: 'TRON', color: '#ff060a' },
  { symbol: 'DOGE', name: 'Dogecoin', color: '#ba9f33' },
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [marketData, setMarketData] = useState<any>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  
  const router = useRouter();
  const pathname = usePathname();

  // 1. CHARGEMENT UTILISATEUR
  useEffect(() => {
    api.get('/auth/me')
      .then(res => {
        setUser(res.data);
      })
      .catch(() => {
        toast.error("Session expirée");
        router.push('/');
      });
  }, [router]);

  // 2. RÉCUPÉRATION PRIX BINANCE (Pooling 10s)
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

  // 3. SIMULATION GRAPHIQUE
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const isPos = marketData[selectedCrypto]?.change >= 0;
  const userName = user?.username || user?.email?.split('@')[0] || 'Trader';

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] font-sans flex flex-col overflow-x-hidden">
      
      {/* --- NAVBAR OPTIMISÉE (DESIGN IMAGE) --- */}
      <nav className="bg-[#121212] border-b border-white/5 sticky top-0 z-[100] w-full">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-10">
            {/* Logo */}
            <div className="flex items-center gap-2">
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

          <div className="flex items-center gap-6">
            {/* Balance */}
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider leading-tight">Balance</p>
              <p className="text-base font-bold text-white tracking-tight">{formatCurrency(user?.balance ?? 10000)}</p>
            </div>

            {/* Logout */}
            <button 
              onClick={() => { localStorage.clear(); router.push('/'); }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={20}/>
            </button>

            {/* Mobile Toggle */}
            <button className="p-2 text-gray-400 lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-[#181A20] border-b border-white/5 p-4 flex flex-col gap-2">
            <NavLink href="/dashboard" label="Dashboard" active={pathname === '/dashboard'} fullWidth />
            <NavLink href="/trade" label="Trade" active={pathname === '/trade'} fullWidth />
            <NavLink href="/wallet" label="Wallet" active={pathname === '/wallet'} fullWidth />
            <button className="flex items-center gap-3 p-3 text-red-400 font-bold" onClick={() => router.push('/')}>
              <LogOut size={18}/> Logout
            </button>
          </div>
        )}
      </nav>

      <main className="max-w-[1400px] mx-auto p-6 md:p-10 w-full">
        {/* En-tête de bienvenue */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold">
            Welcome back, <span className="text-blue-500">{userName}!</span>
          </h1>
          <p className="text-gray-400 mt-2">Here's your trading overview</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-[#181A20] rounded-3xl border border-white/5 p-6">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-bold">${marketData[selectedCrypto]?.price.toLocaleString() ?? '---'}</h2>
                  <p className={`text-sm font-bold ${isPos ? 'text-green-500' : 'text-red-500'}`}>
                    {isPos ? '+' : ''}{marketData[selectedCrypto]?.change}% (24h)
                  </p>
                </div>
                <select 
                  value={selectedCrypto}
                  onChange={(e) => setSelectedCrypto(e.target.value)}
                  className="bg-[#0B0E11] border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
                >
                  {CRYPTO_LIST.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol}</option>)}
                </select>
             </div>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPos ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={isPos ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="price" stroke={isPos ? '#10b981' : '#ef4444'} strokeWidth={2} fill="url(#colorPrice)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Market List */}
          <div className="bg-[#181A20] rounded-3xl border border-white/5 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/5 font-bold">Market Overview</div>
            <div className="overflow-y-auto max-h-[400px]">
              {CRYPTO_LIST.map((crypto) => (
                <div 
                  key={crypto.symbol} 
                  onClick={() => setSelectedCrypto(crypto.symbol)}
                  className={`p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors ${selectedCrypto === crypto.symbol ? 'bg-white/[0.05]' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px]" style={{backgroundColor: `${crypto.color}20`, color: crypto.color}}>{crypto.symbol[0]}</div>
                    <div>
                      <p className="font-bold text-sm">{crypto.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{crypto.symbol} / USDT</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-bold">${marketData[crypto.symbol]?.price ?? '0.00'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// COMPOSANT NAVLINK AJUSTÉ
function NavLink({ href, label, icon, active, fullWidth }: any) {
  return (
    <Link 
      href={href}
      className={`
        flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-medium transition-all
        ${fullWidth ? 'w-full' : ''} 
        ${active 
          ? 'bg-[#1E1E1E] text-white shadow-sm ring-1 ring-white/10' 
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
        }
      `}
    >
      {icon && <span className={active ? 'text-white' : 'text-gray-500'}>{icon}</span>}
      {label}
    </Link>
  );
}