import React, { useState } from 'react';
import { Member, MemberRole, User } from '../types';
import { LayoutDashboard, Users, Calendar, Beaker, FolderKanban, ChevronDown, ChevronRight, MessageSquare, LogOut, User as UserIcon } from 'lucide-react';

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

  // Map roles to display titles (Korean)
  const roleTitles: Record<MemberRole, string> = {
    [MemberRole.PostDoc]: 'Post-Doc',
    [MemberRole.PhD]: 'PhD Course',
    [MemberRole.Researcher]: 'Researcher',
    [MemberRole.MS]: 'MS Course'
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
    <div className={`w-64 bg-navy text-white h-screen flex flex-col shadow-2xl overflow-y-auto custom-scrollbar ${className}`}>
      <div 
        onClick={() => onChangeTab('dashboard')} 
        className="p-6 flex items-center space-x-3 border-b border-navy-light flex-shrink-0 cursor-pointer hover:bg-navy-light/50 transition-colors group"
      >
        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-colors">
          <Beaker className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">SDC Lab</h1>
          <p className="text-[10px] text-slate-300 font-light truncate max-w-[150px]">Spatial Data & Community Lab</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {mainNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === item.id
              ? 'bg-sage text-white shadow-lg shadow-sage/30 font-bold translate-x-1'
              : 'text-slate-300 hover:bg-navy-light hover:text-white'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}

        {/* Members Section */}
        <div className="pt-4 mt-4 border-t border-navy-light">
          <button
            onClick={() => {
              setIsMembersExpanded(!isMembersExpanded);
              onChangeTab('members');
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${activeTab === 'members'
              ? 'bg-navy-light text-white'
              : 'text-slate-300 hover:bg-navy-light hover:text-white'
              }`}
          >
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5" />
              <span className="font-medium">Members</span>
            </div>
            {isMembersExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {/* Sub-categories */}
          {isMembersExpanded && (
            <div className="mt-1 space-y-4 pl-4 pr-2">
              {roleOrder.map(role => {
                const roleMembers = membersByRole[role];
                if (!roleMembers || roleMembers.length === 0) return null;

                return (
                  <div key={role}>
                    <div className="text-[10px] font-bold text-slate-400 uppercase px-4 mb-2 mt-3 tracking-widest">
                      {roleTitles[role]}
                    </div>
                    <div className="space-y-1">
                      {roleMembers.map(member => (
                        <button
                          key={member.id}
                          onClick={() => onSelectMember(member)}
                          className="w-full flex items-center space-x-3 px-4 py-2 rounded-md text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left group"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-sage shadow-[0_0_8px_rgba(39,174,96,0.6)]' : 'bg-slate-500'} group-hover:scale-125 transition-transform`}></div>
                          <span className="truncate">{member.name} {member.label && <span className="text-[10px] opacity-60 ml-1">({member.label})</span>}</span>
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

      {/* User Status / Logout */}
      <div className="p-4 border-t border-navy-light mt-auto flex-shrink-0 bg-navy-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-navy-light flex-shrink-0 flex items-center justify-center text-xs font-bold ring-2 ring-white/10 overflow-hidden">
              {currentUser.photoUrl ? (
                <img src={currentUser.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                currentUser.name[0]
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{currentUser.role === 'admin' ? 'Administrator' : 'Researcher'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
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