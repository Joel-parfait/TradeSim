"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Users, TrendingUp, DollarSign, Trash2, 
  Search, Filter, ArrowUpRight, MoreVertical, 
  CheckCircle2, AlertCircle, Loader2, X, Save, LogOut
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adminInfo, setAdminInfo] = useState<any>(null);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newBalance, setNewBalance] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const router = useRouter();

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
      toast.error("Accès refusé ou session expirée");
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success("Déconnexion réussie");
    router.push('/');
  };

  const handleUpdateBalance = async () => {
    if (!newBalance || isNaN(Number(newBalance))) return toast.error("Montant invalide");
    setEditLoading(true);
    try {
      await api.put('/admin/users/balance', { 
        targetUserId: selectedUser.id, 
        amount: Number(newBalance),
        type: 'set' 
      });
      toast.success("Solde mis à jour !");
      setSelectedUser(null);
      loadData();
    } catch (err: any) {
      toast.error("Erreur de mise à jour");
    } finally {
      setEditLoading(false);
    }
  };

  // NOUVELLE FONCTION : SUPPRIMER UN UTILISATEUR
  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT l'utilisateur ${userEmail} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("Utilisateur supprimé avec succès");
      loadData(); // Recharger la liste
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center">
      <Loader2 className="text-blue-500 animate-spin" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] font-sans pb-20">
      
      {/* --- HEADER --- */}
      <div className="bg-[#121418] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <ShieldCheck className="text-blue-500" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Admin Terminal</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">
                Mode: {adminInfo?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-blue-500/50 text-sm w-48 lg:w-64 transition-all text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2.5 rounded-xl border border-red-500/20 transition-all font-bold text-sm"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto p-6 space-y-8">
        
        {/* --- STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminStatCard icon={<Users className="text-blue-500" />} label="Utilisateurs Gérés" value={users.length} sub="Total Network" />
          <AdminStatCard icon={<DollarSign className="text-green-500" />} label="Balance Totale" value={`$${users.reduce((acc, u) => acc + Number(u.balance), 0).toLocaleString()}`} sub="Cumulative Wallets" />
          <AdminStatCard icon={<TrendingUp className="text-purple-500" />} label="Rôle" value={adminInfo?.role === 'super_admin' ? 'Super Admin' : 'Admin'} sub={adminInfo?.email} />
        </div>

        {/* --- TABLE --- */}
        <div className="bg-[#121418] rounded-3xl border border-white/5 overflow-hidden shadow-2xl text-white">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h3 className="font-bold text-lg">Gestion des comptes</h3>
            <button onClick={loadData} className="text-xs text-blue-500 hover:text-blue-400 font-bold uppercase tracking-widest transition-colors">Rafraîchir</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-gray-500 bg-black/20">
                  <th className="p-6">Membre</th>
                  <th className="p-6">Parrainage</th>
                  <th className="p-6">Solde</th>
                  <th className="p-6">Statut</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="p-6 text-white">
                      <div className="font-bold">{u.username || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="p-6 text-gray-400 text-xs font-mono">
                      CODE: {u.referral_code}
                    </td>
                    <td className="p-6 font-bold text-lg">
                      ${Number(u.balance).toLocaleString()}
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedUser(u); setNewBalance(u.balance.toString()); }}
                          className="p-2.5 bg-white/5 hover:bg-blue-600 text-gray-400 hover:text-white rounded-xl transition-all"
                          title="Modifier balance"
                        >
                          <DollarSign size={16} />
                        </button>
                        
                        {/* BOUTON SUPPRIMER AU LIEU DE SUSPENDRE */}
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="p-2.5 bg-white/5 hover:bg-red-600 text-gray-400 hover:text-white rounded-xl transition-all"
                          title="Supprimer l'utilisateur"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- MODAL EDIT BALANCE --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="bg-[#181A20] border border-white/10 w-full max-w-md rounded-3xl p-8 relative shadow-2xl">
            <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-xl font-bold mb-2">Modifier Balance</h2>
            <p className="text-gray-500 text-sm mb-8">Utilisateur : {selectedUser.email}</p>
            <div className="space-y-6">
              <input 
                type="number" 
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-blue-600 text-white font-bold text-lg"
              />
              <button 
                onClick={handleUpdateBalance}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminStatCard({ icon, label, value, sub }: any) {
  return (
    <div className="bg-[#121418] p-6 rounded-3xl border border-white/5 flex items-center gap-5 transition-all hover:border-white/10">
      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-2xl">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-[10px] text-gray-600">{sub}</p>
      </div>
    </div>
  );
}