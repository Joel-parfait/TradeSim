"use client";
import React, { useState, useEffect } from 'react'; // Ajout de useEffect
import { Mail, Lock, TrendingUp, Eye, EyeOff, User, Gift, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation'; // Ajout de useSearchParams
import { toast } from 'sonner';

export default function AuthPage() {
  // --- ÉTATS DE NAVIGATION ---
  const [step, setStep] = useState('auth'); 
  const [isLogin, setIsLogin] = useState(true);
  
  // --- ÉTATS DES CHAMPS ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otp, setOtp] = useState(''); 
  
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook pour lire l'URL

  // --- LOGIQUE DE DÉTECTION DU PARRAINAGE ---
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setIsLogin(false); // Bascule sur le formulaire d'inscription
      setReferralCode(ref.toUpperCase()); // Remplit le champ automatiquement
      toast.info("Referral code applied!");
    }
  }, [searchParams]);

  // --- LOGIQUE LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.requireVerification) {
        setStep('verify');
        return;
      }
      localStorage.setItem('token', res.data.token);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur de connexion");
    }
  };

  // --- LOGIQUE REGISTER ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { username, email, password, referralCode });
      setStep('verify'); 
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de l'inscription");
    }
  };

  // --- LOGIQUE VÉRIFICATION OTP ---
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/verify-otp', { email, code: otp });
      toast.success("Email verified! Log in now.");
      setStep('auth');
      setIsLogin(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid code");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-white font-sans">
      
      {/* Logo & Header */}
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-start to-primary-end rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
          <TrendingUp size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">CryptoSim</h1>
        <p className="text-gray-400 text-sm">Security Level: 2FA Active</p>
      </div>

      <div className="w-full max-w-md bg-card p-6 md:p-8 rounded-2xl border border-white/5 shadow-xl">
        
        {step === 'auth' ? (
          <>
            <div className="flex bg-black/40 p-1 rounded-xl mb-8">
              <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${isLogin ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Login</button>
              <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${!isLogin ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Register</button>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 text-gray-600" size={18} />
                    <input type="text" placeholder="Username" className="w-full bg-black border border-white/10 rounded-xl py-3.5 pl-11 text-sm outline-none" value={username} onChange={(e) => setUsername(e.target.value)} required />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 text-gray-600" size={18} />
                  <input type="email" placeholder="Enter email" className="w-full bg-black border border-white/10 rounded-xl py-3.5 pl-11 text-sm outline-none" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-gray-600" size={18} />
                  <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full bg-black border border-white/10 rounded-xl py-3.5 pl-11 pr-12 text-sm outline-none" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase">Referral Code</label>
                  <div className="relative">
                    <Gift className="absolute left-3.5 top-3.5 text-gray-600" size={18} />
                    <input type="text" placeholder="Optional" className="w-full bg-black border border-white/10 rounded-xl py-3.5 pl-11 text-sm outline-none" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} />
                  </div>
                </div>
              )}

              <button type="submit" className="w-full py-4 bg-gradient-to-r from-primary-start to-primary-end rounded-xl font-semibold shadow-lg hover:brightness-110">
                {isLogin ? "Login" : "Create Account"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle className="mx-auto mb-4 text-primary-start" size={48} />
            <h2 className="text-2xl font-bold mb-2">Check your email</h2>
            <p className="text-gray-400 text-sm mb-8">We sent a 6-digit code to <br/><span className="text-white">{email}</span></p>
            
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <input 
                type="text" 
                maxLength={6}
                placeholder="000000"
                className="w-full bg-black border border-white/10 rounded-xl py-4 text-center text-3xl tracking-[0.5em] font-bold text-primary-start outline-none"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <button type="submit" className="w-full py-4 bg-gradient-to-r from-primary-start to-primary-end rounded-xl font-semibold shadow-lg">
                Verify Account
              </button>
            </form>
            
            <button onClick={() => setStep('auth')} className="mt-6 text-sm text-gray-500 hover:text-white transition-colors">
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}