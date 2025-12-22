
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Key, ArrowRight, User } from 'lucide-react';
import { User as UserType } from '../types';
// import * as THREE from 'three'; // THREE.js temporarily disabled for stability
const AUTO_APPROVED_EMAILS = [
    'prof.lee@uos.ac.kr',
    'jaeho19@gmail.com', 'ojikch79@gmail.com', 'namugnel@naver.com', 
    'rdt9690@uos.ac.kr', 'jiyunlee41016@uos.ac.kr', 'dayeon34@uos.ac.kr',
    'heejin02@uos.ac.kr', 'jinnieel@uos.ac.kr', 'sungaeae@uos.ac.kr'
];

interface AuthSystemProps {
    onLogin: (user: UserType) => void;
    onSignup: (user: UserType) => void; 
    users: UserType[];
}

const AuthSystem: React.FC<AuthSystemProps> = ({ onLogin, onSignup, users }) => {
    const [view, setView] = useState<'login' | 'pending'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    
    // const mountRef = useRef<HTMLDivElement>(null); // Ref not needed for CSS version

    // --- Login Logic (Unchanged) ---
    // ... logic remains same ...
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (email.toUpperCase() === 'SDCLAB') {
            if (password === 'justdoit') {
                 const sharedUser: UserType = {
                    id: 'shared_researcher',
                    email: 'lab@sdc.com', 
                    name: 'SDC Researcher',
                    role: 'user',
                    status: 'active',
                    photoUrl: '' 
                 };
                 onLogin(sharedUser);
                 return;
            } else {
                setError('비밀번호가 올바르지 않습니다.');
                return;
            }
        }

        if (email === 'admin' || (email === 'prof.lee@uos.ac.kr')) {
            const adminUser: UserType = {
                id: 'admin_1',
                email: 'prof.lee@uos.ac.kr',
                name: '이재호',
                role: 'admin',
                status: 'active',
                photoUrl: '/images/lee_jae_ho.png'
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
            setError('등록되지 않은 ID입니다.');
        }
    };

    /* Three.js logic removed for stability */

    // --- Template ---
    // Using CSS Background


    // --- Pending View (Simple Dark) ---
    if (view === 'pending') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4 font-sans">
                 <div className="bg-[#111] border border-[#333] rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="w-16 h-16 bg-yellow-900/30 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-white">승인 대기 중</h2>
                    <p className="text-gray-400 mb-6">관리자(이재호)의 승인을 기다리고 있습니다.</p>
                    <div className="p-4 bg-black/50 rounded-lg text-sm text-gray-400 mb-6 font-mono border border-white/10">
                        ID: {email}
                    </div>
                    <button onClick={() => setView('login')} className="text-gray-500 hover:text-white transition-colors text-sm">
                        로그인 화면으로 돌아가기
                    </button>
                 </div>
            </div>
        );
    }

    // --- Main Login View (Immersive) ---
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] font-sans text-white selection:bg-[#b026ff] selection:text-white">
            {/* 3D Background */}
            {/* CSS Animated Background */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#b026ff] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse" style={{animationDuration: '4s'}}></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00f3ff] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse" style={{animationDuration: '7s'}}></div>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-12">
                        {/* Logo Removed as requested */}
                        
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 overflow-hidden whitespace-nowrap border-r-4 border-[#00f3ff] animate-typewriter mx-auto w-fit">
                            SDC <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#b026ff]">LAB</span>
                        </h1>
                        <p className="text-gray-400 font-light tracking-wide animate-fade-in-up" style={{animationDelay: '1s'}}>Spatial Data & Community Lab</p>
                        <p className="text-sm font-mono text-[#00f3ff] mt-2 tracking-[0.2em] uppercase animate-fade-in-up" style={{animationDelay: '1.2s'}}>Research Dashboard</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-[#111]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in-up" style={{animationDelay: '0.5s'}}>
                        <form onSubmit={handleLogin} className="space-y-6">
                            
                            {/* ID Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Member ID</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-500 group-focus-within:text-[#00f3ff] transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f3ff]/50 focus:ring-1 focus:ring-[#00f3ff]/50 transition-all"
                                        placeholder="Enter ID"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Key className="h-5 w-5 text-gray-500 group-focus-within:text-[#b026ff] transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#b026ff]/50 focus:ring-1 focus:ring-[#b026ff]/50 transition-all"
                                        placeholder="Enter Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="button"
                                onClick={handleLogin}
                                className="w-full relative group overflow-hidden bg-white text-black font-black py-4 rounded-xl text-lg hover:scale-[1.02] transition-transform duration-200"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#00f3ff] to-[#b026ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative z-10 flex items-center justify-center">
                                    Sign In <ArrowRight className="ml-2 w-5 h-5" />
                                </span>
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8 text-xs text-gray-600 font-mono animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                        © 2025 SDC Lab. Authorized Personnel Only.
                    </div>
                </div>
            </div>

            {/* Global Styles for Animations */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes typewriter {
                    from { width: 0; }
                    to { width: 100%; }
                }
                @keyframes blink {
                    50% { border-color: transparent; }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.8s ease-out forwards;
                    opacity: 0;
                }
                .animate-typewriter {
                    animation: typewriter 2s steps(40) 1s forwards, blink 0.75s step-end infinite;
                    width: 0;
                }
                /* Font Overrides for Sophisticated Look */
                .font-sans {
                    font-family: 'Outfit', 'Noto Sans KR', sans-serif !important;
                }
            `}</style>
        </div>
    );
};

export default AuthSystem;
