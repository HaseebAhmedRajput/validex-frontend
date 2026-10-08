 

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { apiFetch, ApiError } from '../lib/api-client';
import { User, UserRole } from '../types';
import { Mail, Lock, User as UserIcon, Phone, BookOpen, GraduationCap, ArrowRight, CornerDownLeft, Shield, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onAuthSuccess: (user: User) => void;
  addToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

type AuthView = 'login' | 'register' | 'otp' | 'forgot_password' | 'reset_password';

export default function LoginForm({ onAuthSuccess, addToast }: LoginFormProps) {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Common authentication state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration state
  const [fullname, setFullname] = useState('');
  const [number, setNumber] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [department, setDepartment] = useState('');
  const [batch, setBatch] = useState('');
  const [regNo, setRegNo] = useState('');
  
  // OTP state (for signup verification & reset verification)
  const [otp, setOtp] = useState('');
  const [pendingAction, setPendingAction] = useState<'create_user' | 'reset_password'>('create_user');

  // Forgot / Reset password state
  const [newPassword, setNewPassword] = useState('');

  // 1. LOGIN SUBMISSION
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('error', 'Please fill in all credentials.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiFetch<User>('/users/auth/loginUser', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      addToast('success', response.message || 'Logged in successfully!');
      onAuthSuccess(response.data);
    } catch (err: any) {
      let message = err.message || 'Login failed. Please verify credentials.';
      if (err.statusCode === 403) {
        message = 'Your Teacher account is currently awaiting Administrator approval. Please notify your department head.';
      }
      addToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  // 2. REGISTER USER (Staged inside temp Redis storage, sends OTP)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname || !email || !number || !password || !department) {
      addToast('error', 'Please fill in all mandatory fields.');
      return;
    }
    if (password.length < 8) {
      addToast('error', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const body: any = {
        fullname,
        email,
        number: Number(number),
        password,
        role,
        department,
      };

      if (role === 'student') {
        body.batch = batch;
        body.regNo = regNo;
      }

      const response = await apiFetch<any>('/users/registerUser', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      addToast('success', response.message || `An OTP verification code was dispatched to ${email}`);
      setPendingAction('create_user');
      setView('otp');
    } catch (err: any) {
      addToast('error', err.message || 'Registration failed. Check if user already exists.');
    } finally {
      setLoading(false);
    }
  };

  // 3. OTP VERIFICATION
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      addToast('error', 'Please enter the verification code.');
      return;
    }

    setLoading(true);
    try {
      if (pendingAction === 'create_user') {
        const response = await apiFetch<User>('/users/auth/createUser', {
          method: 'POST',
          body: JSON.stringify({ email, otp: Number(otp) }),
        });

        if (response.statusCode === 201) {
          addToast('success', 'Email verified! Please wait for Administrator approval before logging in.');
          setView('login');
        } else {
          addToast('success', 'Account fully verified! Opening portal...');
          onAuthSuccess(response.data);
        }
      } else {
        // Redirection state to change password
        setView('reset_password');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Invalid or expired OTP. Please check your inbox.');
    } finally {
      setLoading(false);
    }
  };

  // 4. FORGOT PASSWORD REQUEST DISPATCH
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast('error', 'Please enter your account email.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch<any>('/users/auth/forgetPassword', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      addToast('success', response.message || 'Reset code sent to your email.');
      setPendingAction('reset_password');
      setView('otp');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to dispatch reset code.');
    } finally {
      setLoading(false);
    }
  };

  // 5. RESET PASSWORD EXECUTION
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      addToast('error', 'Please specify a new password.');
      return;
    }
    if (newPassword.length < 8) {
      addToast('error', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch<any>('/users/auth/resetPassword', {
        method: 'POST',
        body: JSON.stringify({
          email,
          newPassword,
          otp: Number(otp),
        }),
      });
      addToast('success', response.message || 'Password updated! Please log in with your new credentials.');
      setPassword('');
      setView('login');
    } catch (err: any) {
      addToast('error', err.message || 'Password reset failed. Ensure verification code remains valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Decorative left art panel */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col p-12 text-white relative overflow-hidden select-none">
        {/* Subtle radial geometric backgrounds */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,#3b82f61a,transparent_60%)] z-0" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,#1e1b4b,transparent_60%)] z-0" />
        
        <div className="flex items-center gap-3 z-10">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center font-display font-bold text-xl tracking-tight text-white shadow-lg">
            V
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">Valid<span className="text-indigo-400">Ex</span></span>
          <span className="text-xs font-mono py-1 px-1.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 ml-2"> Smart Instructor</span>
        </div>

       
        <div className="max-w-md mt-24 z-10" id="login-hero-card">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl lg:text-5xl font-semibold tracking-tight leading-none mb-6">
             Secure Exam Management System.
            </h1>
            <p className="text-slate-400 leading-relaxed text-base">
                Conduct, manage, and monitor online exams with secure desktop proctoring and a streamlined experience for students and instructors.
            </p>
          </motion.div>
        </div>

       
        <div className="mt-auto pt-12 z-10 flex items-center gap-4 text-xs text-slate-500 font-mono">
          <span>&copy; {new Date().getFullYear()} ValidEx. All rights reserved.</span>
          <span>&middot;</span>
          <span>Faculty & Academic Portal</span>
        </div>
      </div>

      {/* Auth Interaction Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-premium p-8 sm:p-10">
          
          {/* Header information based on current view */}
          {view === 'login' && (
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Sign In to ValidEx</h2>
              <p className="text-slate-500 text-sm mt-1.5">Enter your academic credentials to access your dashboard.</p>
            </div>
          )}

          {view === 'register' && (
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Create Academic Account</h2>
              <p className="text-slate-500 text-sm mt-1.5">Fill out details to register as student or faculty.</p>
            </div>
          )}

          {view === 'otp' && (
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Verify Email Address</h2>
              <p className="text-slate-500 text-sm mt-1.5">We have sent a verification code to <span className="font-semibold text-indigo-600">{email}</span></p>
            </div>
          )}

          {view === 'forgot_password' && (
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Recover Password</h2>
              <p className="text-slate-500 text-sm mt-1.5">Enter your account email to receive a password reset code.</p>
            </div>
          )}

          {view === 'reset_password' && (
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Configure New Password</h2>
              <p className="text-slate-500 text-sm mt-1.5">Create a highly secure, non-compromised password for your account.</p>
            </div>
          )}

          {/* Form renders */}
          <form className="space-y-4" id="auth-main-form" onSubmit={
            view === 'login' ? handleLogin :
            view === 'register' ? handleRegister :
            view === 'otp' ? handleVerifyOtp :
            view === 'forgot_password' ? handleForgotPassword :
            handleResetPassword
          }>
            
            {/* REGISTER FIELDS SPECIFIC */}
            {view === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Role Type</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      id="role-student-btn"
                      onClick={() => setRole('student')}
                      className={`py-2 px-3 border rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all focus:outline-none ${
                        role === 'student'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <GraduationCap className="h-4 w-4" /> Student
                    </button>
                    <button
                      type="button"
                      id="role-teacher-btn"
                      onClick={() => setRole('teacher')}
                      className={`py-2 px-3 border rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all focus:outline-none ${
                        role === 'teacher'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <Shield className="h-4 w-4" /> Teacher
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600/20 text-slate-900 transition-colors"
                      placeholder="Haseeb Ahmed"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Contact Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="number"
                      className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600/20 text-slate-900 transition-colors"
                      placeholder="03163022981"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Academic Department</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600/20 text-slate-900 transition-colors"
                      placeholder="Information Technology"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {role === 'student' && (
                  <div className="grid grid-cols-2 gap-3" id="student-academic-fields">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Batch</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600/20 text-slate-900 transition-colors"
                        placeholder="2k22"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Registration No.</label>
                      <input
                        type="text"
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600/20 text-slate-900 transition-colors"
                        placeholder="2k22-IT-181"
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* DEFAULT & LOGIN FIELDS */}
            {(view === 'login' || view === 'register' || view === 'forgot_password') && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600/20 text-slate-900 transition-colors"
                    placeholder="example@academy.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {(view === 'login' || view === 'register') && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
                  {view === 'login' && (
                    <button
                      type="button"
                      onClick={() => setView('forgot_password')}
                      className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 focus:outline-none"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600/20 text-slate-900 transition-colors"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* OTP ENTER FORM */}
            {view === 'otp' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Verification Code (OTP)</label>
                <input
                  type="text"
                  maxLength={5}
                  className="w-full text-center tracking-widest text-[#1a202c] font-mono text-xl py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600/20 transition-colors"
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Did not receive it? Check your email spam folder, or query your administrator to verify your email service credentials.
                </p>
              </div>
            )}

            {/* RESET PASSWORD VALUE */}
            {view === 'reset_password' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600/20 text-slate-900 transition-colors"
                    placeholder="At least 8 parameters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              id="auth-submit-btn"
              disabled={loading}
              className="w-full mt-4 bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 hover:border-indigo-800 disabled:bg-indigo-400 disabled:border-indigo-500 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {view === 'login' && 'Sign In'}
                  {view === 'register' && 'Register Account'}
                  {view === 'otp' && 'Verify Code'}
                  {view === 'forgot_password' && 'Request Reset Email'}
                  {view === 'reset_password' && 'Submit New Password'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer view toggles */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
            {view === 'login' && (
              <p className="text-sm text-slate-600 text-center">
                New to ValidEx?{' '}
                <button
                  type="button"
                  id="toggle-register-btn"
                  onClick={() => setView('register')}
                  className="text-indigo-600 font-semibold hover:text-indigo-800 hover:underline"
                >
                  Create an account
                </button>
              </p>
            )}

            {view === 'register' && (
              <p className="text-sm text-slate-600 text-center">
                Already registered?{' '}
                <button
                  type="button"
                  id="toggle-login-btn"
                  onClick={() => setView('login')}
                  className="text-indigo-600 font-semibold hover:text-indigo-800 hover:underline"
                >
                  Log In
                </button>
              </p>
            )}

            {view !== 'login' && view !== 'register' && (
              <button
                type="button"
                onClick={() => {
                  setOtp('');
                  setView('login');
                }}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1.5"
              >
                <CornerDownLeft className="h-4 w-4" /> Back to Sign In
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
