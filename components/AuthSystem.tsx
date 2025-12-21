import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Shield, CheckCircle, Clock, AlertTriangle, UserPlus } from 'lucide-react';
import Button from './Button';

interface AuthSystemProps {
    onLogin: (user: User) => void;
    users: User[];
    onSignup: (newUser: User) => void;
}

const AuthSystem: React.FC<AuthSystemProps> = ({ onLogin, users, onSignup }) => {
    const [view, setView] = useState<'login' | 'signup' | 'pending'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Simulated password
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Admin backdoor for demo
        if (email === 'admin' || (email === 'prof.lee@uos.ac.kr')) {
            // Simulate Admin Login
            const adminUser: User = {
                id: 'admin_1',
                email: 'prof.lee@uos.ac.kr',
                name: '이재호',
                role: 'admin',
                status: 'active',
                photoUrl: '/images/이재호.png'
            };
            onLogin(adminUser);
            return;
        }

        const foundUser = users.find(u => u.email === email);

        if (foundUser) {
            if (foundUser.status === 'pending') {
                setView('pending');
            } else if (foundUser.status === 'rejected') {
                setError('가입이 거절되었습니다. 관리자에게 문의하세요.');
            } else {
                onLogin(foundUser);
            }
        } else {
            setError('등록되지 않은 이메일입니다. 회원가입을 해주세요.');
        }
    };

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !name) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        const existing = users.find(u => u.email === email);
        if (existing) {
            setError('이미 등록된 이메일입니다.');
            return;
        }

        const newUser: User = {
            id: `u${Date.now()}`,
            email,
            name,
            role: 'user',
            status: 'pending', // Default pending
            photoUrl: ''
        };

        onSignup(newUser);
        setView('pending');
    };

    if (view === 'pending') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-navy mb-2">승인 대기 중</h2>
                    <p className="text-slate-600 mb-6">
                        관리자(이재호)의 승인을 기다리고 있습니다.<br />
                        승인이 완료되면 이메일로 로그인할 수 있습니다.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-500 mb-6">
                        ID: {email || '신청한 이메일'}
                    </div>
                    <Button variant="secondary" onClick={() => setView('login')}>
                        로그인 화면으로 돌아가기
                    </Button>
                </div>
            </div>
        );
    }

    if (view === 'signup') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-navy text-white rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-slate-900 shadow-lg shadow-navy/20">
                            <Shield size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-navy">연구원 등록 (Sign Up)</h2>
                        <p className="text-slate-500 text-sm mt-1">SDC Lab Manager 접근 권한 신청</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">이름</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all"
                                placeholder="홍길동"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">이메일</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all"
                                placeholder="user@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        {error && <div className="text-sm text-red-500 flex items-center"><AlertTriangle size={14} className="mr-1" />{error}</div>}

                        <Button className="w-full bg-navy hover:bg-navy-light py-3 text-lg font-bold shadow-lg shadow-navy/20">
                            가입 신청하기
                        </Button>

                        <div className="text-center mt-4">
                            <span className="text-slate-400 text-sm">이미 계정이 있으신가요? </span>
                            <button type="button" onClick={() => { setView('login'); setError(''); }} className="text-navy font-bold text-sm hover:underline">
                                로그인
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Login View
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-xl grid grid-cols-1 md:grid-cols-2 max-w-4xl w-full overflow-hidden">
                {/* Left: Branding */}
                <div className="bg-navy p-10 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="z-10">
                        <div className="flex items-center space-x-2 mb-2">
                            <Shield className="w-8 h-8 text-coral" />
                            <span className="text-xl font-bold tracking-widest text-white/90">SDC LAB</span>
                        </div>
                        <h1 className="text-4xl font-extrabold leading-tight mb-4 text-white">
                            Spatial Data & <br />
                            <span className="text-coral">Community Lab</span>
                        </h1>
                        <p className="text-slate-300 leading-relaxed max-w-xs">
                            효율적인 연구 관리와 협업을 위한 랩 매니지먼트 시스템입니다.
                        </p>
                    </div>
                    <div className="z-10 text-sm text-slate-400">
                        © 2024 SDC Lab. All rights reserved.
                    </div>

                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-coral/20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
                </div>

                {/* Right: Login Form */}
                <div className="p-10 flex flex-col justify-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Sign In</h2>

                    {/* Simulated Google Button */}
                    <button
                        onClick={() => { setError(''); setEmail('prof.lee@uos.ac.kr'); }} // Demo shortcut
                        className="w-full flex items-center justify-center px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors mb-4 group"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span className="text-slate-600 font-medium">Sign in with Google (Simulated)</span>
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-400">Or sign in with email</span></div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && <div className="text-sm text-coral font-medium flex items-center bg-coral-bg/10 p-2 rounded"><AlertTriangle size={14} className="mr-2" />{error}</div>}

                        <Button className="w-full bg-navy hover:bg-navy-light py-3 text-lg font-bold shadow-lg shadow-navy/20">
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-sm">
                            계정이 없으신가요?
                            <button onClick={() => setView('signup')} className="text-navy font-bold ml-1 hover:underline">
                                가입 신청
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthSystem;
