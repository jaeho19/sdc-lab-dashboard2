import React from 'react';
import { User } from '../types';
import { Check, X, Shield, Users } from 'lucide-react';
import Button from './Button';

interface AdminPanelProps {
    users: User[];
    onApprove: (userId: string) => void;
    onReject: (userId: string) => void;
    onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, onApprove, onReject, onClose }) => {
    const pendingUsers = users.filter(u => u.status === 'pending');
    const activeUsers = users.filter(u => u.status === 'active' && u.role !== 'admin');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-navy text-white">
                    <div className="flex items-center space-x-3">
                        <Shield className="w-6 h-6 text-coral" />
                        <h2 className="text-xl font-bold">Admin Panel - User Management</h2>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-navy mb-4 flex items-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 text-xs mr-2">
                                {pendingUsers.length}
                            </span>
                            Pending Requests
                        </h3>

                        {pendingUsers.length === 0 ? (
                            <p className="text-slate-400 italic text-sm p-4 bg-slate-50 rounded-lg text-center">대기 중인 가입 요청이 없습니다.</p>
                        ) : (
                            <div className="space-y-3">
                                {pendingUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-4 bg-white border border-yellow-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <div>
                                            <div className="font-bold text-slate-800">{user.name}</div>
                                            <div className="text-sm text-slate-500">{user.email}</div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button size="sm" variant="danger" onClick={() => onReject(user.id)}>
                                                <X size={16} className="mr-1" /> Reject
                                            </Button>
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onApprove(user.id)}>
                                                <Check size={16} className="mr-1" /> Approve
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-navy mb-4 flex items-center">
                            <Users size={20} className="mr-2 text-slate-400" />
                            Active Users
                        </h3>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100">
                            {activeUsers.map(user => (
                                <div key={user.id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy font-bold text-xs">
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-800">{user.name}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Active</span>
                                </div>
                            ))}
                            {activeUsers.length === 0 && (
                                <div className="p-4 text-center text-slate-400 text-sm">No active users yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
