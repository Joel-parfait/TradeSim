"use client";
import React, { useState, useEffect } from 'react';
import { Mail, Lock, TrendingUp, Eye, EyeOff, User, Gift, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function AuthPage() {
  // --- ÉTATS DE NAVIGATION ---
  const [step, setStep] = useState('auth'); 
  const [isLogin, setIsLogin] = useState(true);
  
  // --- ÉTATS DES CHAMPS ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otp, setOtp] = useState(''); 
  const [newPassword, setNewPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- DÉTECTION DU PARRAINAGE ---
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setIsLogin(false); 
      setReferralCode(ref.toUpperCase());
      toast.info("Referral code applied!");
    }
  }, [searchParams]);

  // --- LOGIQUE LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.requireVerification) {
        toast.info("Please verify your email to continue.");
        setStep('verify');
        return;
      }

      localStorage.setItem('token', res.data.token);
      const userData = res.data.user;

      if (userData && (userData.role === 'admin' || userData.role === 'super_admin')) {
        toast.success(`Welcome Admin ${userData.username}`);
        router.push('/admin');
      } else {
        toast.success(`Welcome back ${userData.username}`);
        router.push('/dashboard');
      }

    } catch (err: any) {
      toast.error(err.response?.data?.message || "Connection error");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIQUE REGISTER ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match!");
    }
    if (!username.trim()) return toast.error("Choose a username");
    
    setLoading(true);
    try {
      await api.post('/auth/register', { 
        username: username.trim(), 
        email: email.toLowerCase().trim(), 
        password, 
        referralCode 
      });
      
      toast.success("Security code sent to your email!");
      setStep('verify'); 
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration error");
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.toLowerCase().trim() });
      toast.success("A reset code has been sent to your inbox.");
      setStep('reset');
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error sending code");
    } finally {
      setLoading(false);
    }
  };

  // --- RESET PASSWORD (CORRIGÉ) ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match!");
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code: otp, newPassword });
      toast.success("Password updated! You can now log in.");
      setStep('auth');
      setIsLogin(true);
      setPassword('');
      setConfirmPassword('');
      setNewPassword('');
      setOtp('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid code or error");
    } finally {
      setLoading(false);
    }
  };

  // --- VERIFY OTP ---
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, code: otp });
      toast.success("Email verified successfully!");
      setStep('auth');
      setIsLogin(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Incorrect verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] flex flex-col items-center justify-center p-4 text-white font-sans">
      
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
          <TrendingUp size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">CryptoSim</h1>
        <p className="text-gray-400 text-sm italic">Institutional Grade Security</p>
      </div>

      <div className="w-full max-w-md bg-[#121418] p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl transition-all">
        
        {step === 'auth' && (
          <>
            <div className="flex bg-black/40 p-1 rounded-xl mb-8">
              <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${isLogin ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-400'}`}>Login</button>
              <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${!isLogin ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-400'}`}>Register</button>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 text-gray-600" size={18} />
                    <input type="text" placeholder="Unique name" className="w-full bg-black border border-white/10 rounded-xl py-3.5 pl-11 text-sm outline-none focus:border-blue-500/50 transition-all text-white" value={username} onChange={(e) => setUsername(e.target.value)} required />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 text-gray-600" size={18} />
                  <input type="email" placeholder="Enter email" className="w-full bg-black border border-white/10 rounded-xl py-3.5 pl-11 text-sm outline-none focus:border-blue-500/50 transition-all text-white" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Password</label>
                  {isLogin && (
                    <button type="button" onClick={() => setStep('forgot')} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors">Forgot Password?</button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-gray-600" size={18} />
                  <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full bg-black border border-white/10 rounded-xl py-3.5 pl-11 pr-12 text-sm outline-none focus:border-blue-500/50 transition-all text-white" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest text-blue-400">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 text-gray-600" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Repeat password" 
                      className="w-full bg-black border border-white/10 rounded-xl py-3.5 pl-11 text-sm outline-none focus:border-blue-500/50 transition-all text-white" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 text-white">
                {loading ? <RefreshCw className="animate-spin mx-auto" /> : (isLogin ? "Login" : "Get Started")}
              </button>
            </form>
          </>
        )}

        {/* --- STEP: FORGOT PASSWORD --- */}
        {step === 'forgot' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button onClick={() => setStep('auth')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-6 transition-colors">
              <ArrowLeft size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Back</span>
            </button>
            <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
            <p className="text-gray-400 text-sm mb-8">Enter your account email to receive a recovery code.</p>
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-gray-600" size={18} />
                <input type="email" placeholder="Enter email" className="w-full bg-black border border-white/10 rounded-xl py-3.5 pl-11 text-sm outline-none focus:border-blue-500/50 transition-all text-white" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 rounded-xl font-bold shadow-lg hover:bg-blue-500 transition-all disabled:opacity-50 text-white">
                {loading ? 'Sending...' : 'Send Recovery Code'}
              </button>
            </form>
          </div>
        )}

        {/* --- STEP: RESET PASSWORD (AVEC CONFIRMATION ET VISIBILITÉ) --- */}
        {step === 'reset' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold mb-2 text-blue-500">Security Check</h2>
            <p className="text-gray-400 text-sm mb-8">Enter the code sent to your email and set your new password.</p>
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Verification Code</label>
                <input type="text" maxLength={6} placeholder="000000" className="w-full bg-black border border-white/10 rounded-xl py-3.5 text-center text-2xl tracking-[0.5em] font-bold text-blue-500 outline-none" value={otp} onChange={(e) => setOtp(e.target.value)} required />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-gray-600" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Min. 8 characters" 
                    className="w-full bg-black border border-white/10 rounded-xl py-3.5 pl-11 pr-12 text-sm outline-none focus:border-blue-500/50 transition-all text-white" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-blue-400">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-gray-600" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Repeat new password" 
                    className="w-full bg-black border border-white/10 rounded-xl py-3.5 pl-11 text-sm outline-none focus:border-blue-500/50 transition-all text-white" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold shadow-lg hover:brightness-110 transition-all disabled:opacity-50 text-white">
                {loading ? <RefreshCw className="animate-spin mx-auto" /> : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* --- STEP: VERIFY --- */}
        {step === 'verify' && (
          <div className="text-center py-4 animate-in zoom-in-95 duration-300">
            <div className="mx-auto mb-4 w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Mail className="text-blue-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Check your inbox</h2>
            <p className="text-gray-400 text-sm mb-8">We've sent a 6-digit verification code to <br/><span className="text-white font-medium">{email}</span></p>
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <input type="text" maxLength={6} placeholder="000000" className="w-full bg-black border border-white/10 rounded-xl py-4 text-center text-3xl tracking-[0.5em] font-bold text-blue-500 outline-none" value={otp} onChange={(e) => setOtp(e.target.value)} required />
              <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold shadow-lg disabled:opacity-50 text-white">
                {loading ? <RefreshCw className="animate-spin mx-auto" /> : 'Verify Email'}
              </button>
            </form>
            <button onClick={() => setStep('auth')} className="mt-6 text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto">
              <RefreshCw size={12} /> Resend or Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}