"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ShieldCheck, Users, TrendingUp, DollarSign, Trash2, 
  Search, Loader2, X, Save, LogOut, Copy, Link as LinkIcon,
  UserPlus, UserMinus, RefreshCcw
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adminInfo, setAdminInfo] = useState<any>(null);
  
  // Modale Balance
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newBalance, setNewBalance] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const router = useRouter();

  // --- CHARGEMENT DES DONNÉES ---
  const loadData = useCallback(async () => {
    try {
      const [usersRes, meRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/auth/me')
      ]);
      
      if (meRes.data.role === 'user') {
        router.push('/dashboard');
        return;
      }

      setUsers(usersRes.data);
      setAdminInfo(meRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Session expirée");
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- ACTIONS ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success("Déconnexion");
    router.push('/');
  };

  const copyReferralLink = () => {
    if (!adminInfo?.referral_code) return;
    const link = `${window.location.origin}/?ref=${adminInfo.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Lien de parrainage copié !");
  };

  const handleUpdateBalance = async () => {
    const amount = parseFloat(newBalance);
    if (isNaN(amount)) return toast.error("Montant invalide");
    
    setEditLoading(true);
    try {
      await api.put('/admin/users/balance', { 
        targetUserId: selectedUser.id, 
        amount,
        type: 'set' 
      });
      toast.success("Solde mis à jour !");
      setSelectedUser(null);
      await loadData();
    } catch (err) {
      toast.error("Erreur serveur");
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.put('/admin/users/role', { targetUserId: userId, role: newRole });
      toast.success(`Rang mis à jour : ${newRole.toUpperCase()}`);
      await loadData();
    } catch (err) {
      toast.error("Action réservée au Super Admin");
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!window.confirm(`Supprimer ${userEmail} ?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("Utilisateur supprimé");
      await loadData();
    } catch (err) {
      toast.error("Erreur de suppression");
    }
  };

  // --- FILTRAGE OPTIMISÉ ---
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.email?.toLowerCase().includes(search.toLowerCase()) || 
      u.username?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  if (loading) return (
    <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center">
      <Loader2 className="text-blue-500 animate-spin" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] font-sans pb-20">
      
      {/* --- NAVIGATION HEADER --- */}
      <div className="bg-[#121418] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <ShieldCheck className="text-blue-500" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Admin Terminal</h1>
              <div className="flex gap-2 mt-0.5">
                <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-black uppercase">
                  {adminInfo?.role}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher un membre..." 
                className="bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-blue-500/50 text-sm w-64 text-white transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2.5 rounded-xl border border-red-500/20 transition-all font-bold text-sm active:scale-95">
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto p-6 space-y-8">
        
        {/* --- STATS & REFERRAL SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-white">
          <AdminStatCard icon={<Users className="text-blue-500" />} label="Total Membres" value={users.length} sub="Portefeuille Réseau" />
          <AdminStatCard icon={<DollarSign className="text-green-500" />} label="Balance Globale" value={`$${users.reduce((acc, u) => acc + Number(u.balance), 0).toLocaleString()}`} sub="Cumulative Wallets" />
          
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6 rounded-3xl border border-blue-500/20 flex flex-col justify-between relative group">
              <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Recrutement Admin</p>
                    <p className="text-3xl font-black text-white font-mono tracking-tighter">{adminInfo?.referral_code}</p>
                </div>
                <button onClick={copyReferralLink} className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all shadow-lg active:scale-90">
                    <Copy size={20} />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-gray-400">
                <LinkIcon size={12} className="text-blue-500" />
                <p className="text-[10px] uppercase font-bold tracking-tight italic">Partagez ce code pour affilier de nouveaux membres.</p>
              </div>
          </div>
        </div>

        {/* --- MAIN TABLE --- */}
        <div className="bg-[#121418] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h3 className="font-bold text-lg text-white">Gestion de la Hiérarchie</h3>
            <button onClick={loadData} className="flex items-center gap-2 text-xs text-blue-500 hover:text-blue-400 font-bold uppercase tracking-widest transition-all">
                <RefreshCcw size={14}/> Rafraîchir
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-gray-500 bg-black/20 font-bold">
                  <th className="p-6">Utilisateur / Grade</th>
                  <th className="p-6">Infos Réseau</th>
                  <th className="p-6">Fonds ($)</th>
                  <th className="p-6 text-right">Contrôle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="p-6">
                      <div className="font-bold text-white text-base">{u.username || 'No Name'}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {u.role}
                        </span>
                        <span className="text-[10px] text-gray-600 truncate max-w-[150px]">{u.email}</span>
                      </div>
                    </td>
                    <td className="p-6 font-mono text-xs text-gray-400 font-bold">
                        CODE: {u.referral_code}
                    </td>
                    <td className="p-6">
                        <div className="text-lg font-black text-white">${Number(u.balance).toLocaleString()}</div>
                        <div className={`text-[10px] font-bold uppercase ${u.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>{u.status}</div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        {/* PROMOTION : SUPER_ADMIN UNIQUEMENT */}
                        {adminInfo?.role === 'super_admin' && (
                          <button 
                            onClick={() => handleToggleRole(u.id, u.role)}
                            className={`p-2.5 rounded-xl transition-all ${u.role === 'admin' ? 'bg-purple-600/20 text-purple-400' : 'bg-white/5 text-gray-500 hover:bg-purple-600 hover:text-white'}`}
                            title="Changer le rang"
                          >
                            {u.role === 'admin' ? <UserMinus size={18} /> : <UserPlus size={18} />}
                          </button>
                        )}

                        <button onClick={() => { setSelectedUser(u); setNewBalance(u.balance.toString()); }} className="p-2.5 bg-white/5 hover:bg-blue-600 text-gray-400 hover:text-white rounded-xl transition-all shadow-md"><DollarSign size={18} /></button>
                        <button onClick={() => handleDeleteUser(u.id, u.email)} className="p-2.5 bg-white/5 hover:bg-red-600 text-gray-400 hover:text-white rounded-xl transition-all shadow-md"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- MODALE : ÉDITION BALANCE --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedUser(null)} />
          <div className="bg-[#181A20] border border-white/10 w-full max-w-md rounded-3xl p-8 relative shadow-2xl text-white">
            <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-xl font-bold mb-2">Ajustement Financier</h2>
            <p className="text-gray-500 text-sm mb-8">Compte cible : <span className="text-blue-400">{selectedUser.email}</span></p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Définir le solde ($)</label>
                <input 
                    type="number" 
                    value={newBalance} 
                    onChange={(e) => setNewBalance(e.target.value)} 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-blue-600 font-bold text-xl text-white shadow-inner" 
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelectedUser(null)} className="flex-1 py-4 bg-white/5 rounded-2xl font-bold hover:bg-white/10 transition-all">Fermer</button>
                <button 
                    onClick={handleUpdateBalance} 
                    disabled={editLoading}
                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {editLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminStatCard({ icon, label, value, sub }: any) {
  return (
    <div className="bg-[#121418] p-6 rounded-3xl border border-white/5 flex items-center gap-5 transition-all hover:bg-white/[0.02]">
      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-2xl shadow-lg">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">{label}</p>
        <p className="text-2xl font-black text-white tracking-tighter truncate">{value}</p>
        <p className="text-[10px] text-gray-600 font-bold truncate">{sub}</p>
      </div>
    </div>
  );
}