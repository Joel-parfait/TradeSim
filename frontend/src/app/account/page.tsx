"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, TrendingUp, Wallet, Users, Trophy, UserCircle, 
  LogOut, Menu, X, User as UserIcon, Settings, Share2, Headphones, 
  Save, Mail, Phone, Rocket, Diamond, Zap, Target, Star, Flame, Waves,
  Globe, Shield, Lock, Smartphone, Fingerprint, Copy, Send, MessageSquare, ChevronRight
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const AVATARS = [
  { id: 1, icon: <UserIcon size={24} />, color: "bg-blue-600" },
  { id: 2, icon: <Rocket size={24} />, color: "bg-purple-600" },
  { id: 3, icon: <Diamond size={24} />, color: "bg-cyan-500" },
  { id: 4, icon: <Zap size={24} />, color: "bg-yellow-500" },
  { id: 5, icon: <Target size={24} />, color: "bg-red-600" },
  { id: 6, icon: <Star size={24} />, color: "bg-green-500" },
  { id: 7, icon: <Flame size={24} />, color: "bg-orange-600" },
  { id: 8, icon: <Waves size={24} />, color: "bg-teal-500" },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // États Profile
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(1);

  // États Settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);
  const [pinProtection, setPinProtection] = useState(false);

  // États Support
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const router = useRouter();
  const pathname = usePathname();

  const loadData = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      setUsername(res.data.username || '');
      setSelectedAvatar(res.data.avatar_id || 1);
    } catch (error) {
      router.push('/');
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await api.put('/auth/update-profile', { username: username.trim(), avatar_id: selectedAvatar });
      toast.success(res.data.message);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error updating profile");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return toast.error("Please fill all fields");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    try {
      const res = await api.put('/auth/update-password', { currentPassword, newPassword });
      toast.success(res.data.message || "Password updated successfully");
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error updating password");
    }
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Ticket submitted! Our team will contact you soon.");
    setSubject('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] font-sans flex flex-col overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-[#121212] border-b border-white/5 sticky top-0 z-[100] w-full">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-10">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
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
                {user ? `$${Number(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
              </p>
            </div>
            <button onClick={() => { localStorage.clear(); router.push('/'); }} className="text-gray-400 hover:text-white transition-colors"><LogOut size={20}/></button>
            <button className="p-2 text-gray-400 lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>
        
        {/* --- MOBILE MENU --- */}
        {isMenuOpen && (
          <div className="lg:hidden bg-[#181A20] border-b border-white/5 p-4 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
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
      <main className="max-w-[1000px] mx-auto p-6 md:p-10 w-full space-y-8 flex-1">
        <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>

        {/* --- TABS --- */}
        <div className="bg-[#181A20] p-1 rounded-2xl flex items-center border border-white/5 no-scrollbar overflow-x-auto">
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon size={16}/>} label="Profile" />
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={16}/>} label="Settings" />
          <TabButton active={activeTab === 'invite'} onClick={() => setActiveTab('invite')} icon={<Share2 size={16}/>} label="Invite a Friend" />
          <TabButton active={activeTab === 'support'} onClick={() => setActiveTab('support')} icon={<Headphones size={16}/>} label="Support" />
        </div>

        {/* --- PROFILE --- */}
        {activeTab === 'profile' && (
          <div className="bg-[#121418] rounded-3xl border border-white/5 p-6 md:p-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-xl font-bold text-white mb-10">Personal Information</h2>
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Profile Avatar</label>
                <div className="flex flex-wrap gap-4">
                  {AVATARS.map((av) => (
                    <button key={av.id} type="button" onClick={() => setSelectedAvatar(av.id)} className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${av.color} text-white shadow-xl ${selectedAvatar === av.id ? 'ring-4 ring-blue-600 ring-offset-4 ring-offset-[#121418] scale-110' : 'opacity-40 hover:opacity-100'}`}>
                      {av.icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <AccountInput label="Username" value={username} onChange={(e:any) => setUsername(e.target.value)} />
                <AccountInput label="Email Address" value={user?.email || ''} disabled icon={<Mail size={16}/>} />
                <AccountInput label="Phone Number" value="+1 (555) 123-4567" disabled icon={<Phone size={16}/>} />
              </div>
              <button onClick={handleUpdateProfile} className="w-full md:w-fit bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-blue-600/20">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        )}

        {/* --- SETTINGS --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-[#121418] rounded-3xl border border-white/5 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-8"><Globe className="text-blue-500" size={20} /><h2 className="text-lg font-bold text-white">General Settings</h2></div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Language</label>
                <select className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-sm outline-none focus:border-blue-600/50 appearance-none text-white"><option>English</option><option>Français</option></select>
              </div>
            </div>
            <div className="bg-[#121418] rounded-3xl border border-white/5 p-6 md:p-8 space-y-10">
              <div className="flex items-center gap-3"><Shield className="text-green-500" size={20} /><h2 className="text-lg font-bold text-white">Security Settings</h2></div>
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider"><Lock size={14} /> Change Password</div>
                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-2xl">
                  <AccountInput label="Current Password" type="password" value={currentPassword} onChange={(e:any) => setCurrentPassword(e.target.value)} />
                  <AccountInput label="New Password" type="password" value={newPassword} onChange={(e:any) => setNewPassword(e.target.value)} />
                  <AccountInput label="Confirm New Password" type="password" value={confirmPassword} onChange={(e:any) => setConfirmPassword(e.target.value)} />
                  <button type="submit" className="w-full md:w-fit bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all">Update Password</button>
                </form>
              </div>
              <div className="h-px bg-white/5" />
              <div className="space-y-6">
                <ToggleItem icon={<Smartphone size={20} />} title="Two-Factor Authentication" description="Extra security layer" enabled={twoFactor} onToggle={() => setTwoFactor(!twoFactor)} />
                <ToggleItem icon={<Fingerprint size={20} />} title="PIN Protection" description="Require PIN for trades" enabled={pinProtection} onToggle={() => setPinProtection(!pinProtection)} />
              </div>
            </div>
          </div>
        )}

        {/* --- INVITE A FRIEND --- */}
        {activeTab === 'invite' && (
          <div className="bg-[#121418] rounded-3xl border border-white/5 p-6 md:p-10 animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">
            <h2 className="text-xl font-bold text-white mb-2">Invite a Friend</h2>
            <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-blue-900/40 border border-blue-500/20 p-6 md:p-8 rounded-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Share2 size={120} className="rotate-12" /></div>
               <h3 className="text-xl md:text-2xl font-black text-white mb-2">Earn $25 for Each Referral!</h3>
               <p className="text-gray-400 text-sm max-w-md">Share CryptoSim with your friends and earn rewards when they sign up using your referral link.</p>
            </div>
            <div className="space-y-8 max-w-3xl">
               <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Referral Code</label>
                  <div className="flex gap-3">
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-mono font-bold tracking-wider text-blue-400 break-all">{user?.referral_code || 'REF-LOADING...'}</div>
                    <button onClick={() => copyToClipboard(user?.referral_code, "Code copied!")} className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl shadow-lg transition-all active:scale-90"><Copy size={20} /></button>
                  </div>
               </div>
               <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Referral Link</label>
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-gray-400 break-all font-mono">{`https://cryptosim.app/?ref=${user?.referral_code}`}</div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ShareButton onClick={() => copyToClipboard(`https://cryptosim.app/?ref=${user?.referral_code}`, "Link copied!")} icon={<Copy size={18}/>} label="Copy Link" />
                  <ShareButton onClick={() => window.open(`mailto:?subject=Join me on CryptoSim&body=Use my link: https://cryptosim.app/?ref=${user?.referral_code}`)} icon={<Mail size={18}/>} label="Email" />
                  <ShareButton onClick={() => toast.info("Social share coming soon")} icon={<Send size={18}/>} label="Share" />
               </div>
            </div>
          </div>
        )}

        {/* --- SUPPORT --- */}
        {activeTab === 'support' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <ContactCard icon={<Mail className="text-blue-500" />} title="Email" detail="support@cryptosim.app" />
               <ContactCard icon={<Headphones className="text-green-500" />} title="Live Chat" detail="Available 24/7" />
               <ContactCard icon={<Phone className="text-purple-500" />} title="Phone" detail="1-800-CRYPTO" />
            </div>
            <div className="bg-[#121418] rounded-3xl border border-white/5 p-6 md:p-8 space-y-8">
               <h2 className="text-lg font-bold text-white">Send us a message</h2>
               <form onSubmit={handleSubmitTicket} className="space-y-6">
                  <AccountInput label="Subject" value={subject} onChange={(e:any) => setSubject(e.target.value)} />
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Message</label>
                    <textarea 
                      value={message} onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue or question..."
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-sm outline-none transition-all focus:border-blue-600/50 min-h-[150px] resize-none text-white"
                    />
                  </div>
                  <button type="submit" className="w-full md:w-fit bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                    <Send size={18} /> Submit Ticket
                  </button>
               </form>
            </div>
            <div className="bg-[#121418] rounded-3xl border border-white/5 p-6 md:p-8">
               <h2 className="text-lg font-bold text-white mb-6">Frequently Asked Questions</h2>
               <div className="space-y-4 divide-y divide-white/5">
                  <FaqItem question="How do I make my first trade?" />
                  <FaqItem question="What is the starting balance?" />
                  <FaqItem question="How does the referral program work?" />
                  <FaqItem question="Can I reset my portfolio?" />
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function ContactCard({ icon, title, detail }: any) {
  return (
    <div className="bg-[#121418] border border-white/5 p-6 md:p-8 rounded-3xl flex flex-col items-center text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl">{icon}</div>
      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{title}</h4>
      <p className="text-white font-bold break-all">{detail}</p>
    </div>
  );
}

function FaqItem({ question }: { question: string }) {
  return (
    <div className="flex items-center justify-between py-4 group cursor-pointer">
      <span className="text-sm text-gray-400 group-hover:text-white transition-colors">• {question}</span>
      <ChevronRight size={16} className="text-gray-600 group-hover:text-white" />
    </div>
  );
}

function ShareButton({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center justify-center gap-3 bg-white/5 border border-white/5 hover:bg-white/10 py-4 rounded-2xl text-sm font-bold transition-all active:scale-95">
      {icon} {label}
    </button>
  );
}

function ToggleItem({ icon, title, description, enabled, onToggle }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors shrink-0">{icon}</div>
        <div><h4 className="text-sm font-bold text-white">{title}</h4><p className="text-xs text-gray-500 line-clamp-1">{description}</p></div>
      </div>
      <button onClick={onToggle} className={`w-12 h-6 rounded-full p-1 transition-all duration-300 shrink-0 ${enabled ? 'bg-blue-600' : 'bg-white/10'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${active ? 'bg-[#121418] text-white shadow-lg ring-1 ring-white/10' : 'text-gray-500 hover:text-gray-300'}`}>
      {icon} {label}
    </button>
  );
}

function AccountInput({ label, value, onChange, placeholder, disabled, icon, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">{icon}</div>}
        <input 
          type={type} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder}
          className={`w-full bg-black/40 border border-white/5 rounded-2xl py-4 ${icon ? 'pl-12' : 'px-5'} pr-4 text-sm outline-none transition-all ${disabled ? 'opacity-40 cursor-not-allowed' : 'focus:border-blue-600/50 hover:border-white/10 text-white'}`}
        />
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