import React, { useState } from 'react';
import { Member, MemberRole, User } from '../types';
import { LayoutDashboard, Users, Calendar, MessageSquare, LogOut, ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
  members: Member[];
  onSelectMember: (member: Member) => void;
  currentUser: User;
  onLogout: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onChangeTab, members, onSelectMember, currentUser, onLogout, className }) => {
  const [isMembersExpanded, setIsMembersExpanded] = useState(true);

  // Sorting order: PostDoc -> PhD -> Researcher -> MS
  const roleOrder = [MemberRole.PostDoc, MemberRole.PhD, MemberRole.Researcher, MemberRole.MS];

  // Map roles to display titles
  const roleTitles: Record<MemberRole, string> = {
    [MemberRole.PostDoc]: 'POST-DOC',
    [MemberRole.PhD]: 'PHD COURSE',
    [MemberRole.Researcher]: 'RESEARCHER',
    [MemberRole.MS]: 'MS COURSE'
  };

  // Group members by role
  const membersByRole = roleOrder.reduce((acc, role) => {
    acc[role] = members.filter(m => m.role === role);
    return acc;
  }, {} as Record<MemberRole, Member[]>);

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'mentoring', label: 'Mentoring', icon: MessageSquare },
  ];

  return (
    <div className={`w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white h-screen flex flex-col shadow-2xl overflow-y-auto custom-scrollbar ${className}`}>
      {/* Header */}
      <div 
        onClick={() => onChangeTab('dashboard')} 
        className="p-6 border-b border-white/10 flex-shrink-0 cursor-pointer hover:bg-white/5 transition-all duration-300 group"
      >
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-teal-300 transition-all">SDC Lab</h1>
        <p className="text-xs text-slate-400 mt-1 font-light">Spatial Data & Community Lab</p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {mainNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 font-semibold scale-105'
                : 'text-slate-300 hover:bg-white/10 hover:text-white hover:scale-102'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'drop-shadow-lg' : ''}`} />
            <span>{item.label}</span>
          </button>
        ))}

        {/* Members Section */}
        <div className="pt-6 mt-6 border-t border-white/10">
          <button
            onClick={() => {
              setIsMembersExpanded(!isMembersExpanded);
              onChangeTab('members');
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'members'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 font-semibold'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5" />
              <span className="font-medium">Members</span>
            </div>
            {isMembersExpanded ? 
              <ChevronDown className="w-4 h-4" /> : 
              <ChevronRight className="w-4 h-4" />
            }
          </button>

          {/* Members List */}
          {isMembersExpanded && (
            <div className="mt-2 space-y-3 pl-2">
              {roleOrder.map(role => {
                const roleMembers = membersByRole[role];
                if (!roleMembers || roleMembers.length === 0) return null;

                return (
                  <div key={role}>
                    <div className="text-[10px] font-bold text-emerald-400/70 uppercase px-4 mb-2 tracking-widest">
                      {roleTitles[role]}
                    </div>
                    <div className="space-y-0.5">
                      {roleMembers.map(member => (
                        <button
                          key={member.id}
                          onClick={() => onSelectMember(member)}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200 text-left group"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            member.status === 'Active' 
                              ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] animate-pulse' 
                              : 'bg-slate-500'
                          } group-hover:scale-125 transition-transform`}></div>
                          <span className="truncate">
                            {member.name}
                            {member.label && 
                              <span className="text-[10px] text-slate-400 ml-1">
                                ({member.label})
                              </span>
                            }
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10 mt-auto flex-shrink-0 bg-gradient-to-b from-transparent to-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex-shrink-0 flex items-center justify-center text-sm font-bold ring-2 ring-white/20 overflow-hidden shadow-lg">
              {currentUser.photoUrl ? (
                <img src={currentUser.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white drop-shadow-lg">{currentUser.name[0]}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider font-medium">
                {currentUser.role === 'admin' ? 'RESEARCHER' : 'RESEARCHER'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:rotate-6"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
