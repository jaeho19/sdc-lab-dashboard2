import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MemberDirectory from './components/MemberDirectory';
import ResearchList from './components/ResearchList'; 

import CalendarView from './components/CalendarView';
import ProjectList from './components/ProjectList';
import MeetingLogs from './components/MeetingLogs';
import AuthSystem from './components/AuthSystem';
import AdminPanel from './components/AdminPanel';
import { Member, CalendarEvent, Category, MeetingLog, ResearchRecord, User } from './types';

import { Settings, Menu, Calendar as CalendarIcon, LogOut } from 'lucide-react';

// Mock Data
import {
  INITIAL_MEMBERS,
  INITIAL_RESEARCH,
  INITIAL_MEETINGS,
  INITIAL_EVENTS,
  INITIAL_CATEGORIES,
  INITIAL_PROJECTS,
  MOCK_USERS
} from './services/mockData';

// Version control for data. Incrementing this forces a reset of local storage
// to ensure users see the latest mock data changes and clear corrupted data.
const DATA_VERSION = '1.14'; // Increment loop

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Helper to load data with version check
  const loadData = <T,>(key: string, initialValue: T): T => {
    try {
      const savedVersion = localStorage.getItem('sdc_version');
      if (savedVersion !== DATA_VERSION) {
        return initialValue;
      }
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (e) {
      console.error("Failed to load data", e);
      return initialValue;
    }
  };

  // State initialization
  const [members, setMembers] = useState<Member[]>(() => loadData('sdc_members', INITIAL_MEMBERS));
  const [research, setResearch] = useState<ResearchRecord[]>(() => loadData('sdc_research', INITIAL_RESEARCH));
  const [meetings, setMeetings] = useState<MeetingLog[]>(() => loadData('sdc_meetings', INITIAL_MEETINGS));
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadData('sdc_events', INITIAL_EVENTS));
  const [categories, setCategories] = useState<Category[]>(() => loadData('sdc_categories', INITIAL_CATEGORIES));
  const [projects] = useState(INITIAL_PROJECTS);

  // Auth State
  const [users, setUsers] = useState<User[]>(() => loadData('sdc_users', MOCK_USERS));

  // Check login status on mount & Version sync
  useEffect(() => {
    const savedUser = localStorage.getItem('sdc_current_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    // Update version in storage to current
    localStorage.setItem('sdc_version', DATA_VERSION);
  }, []);

  // Persist data with Error Handling (Quota Exceeded)
  const saveData = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e: any) {
      console.error("Storage failed:", e);
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert("저장 공간이 부족합니다. 사진을 변경하거나 불필요한 데이터를 삭제해주세요.");
      }
    }
  };

  useEffect(() => saveData('sdc_members', members), [members]);
  useEffect(() => saveData('sdc_research', research), [research]);
  useEffect(() => saveData('sdc_events', events), [events]);
  useEffect(() => saveData('sdc_categories', categories), [categories]);
  useEffect(() => saveData('sdc_meetings', meetings), [meetings]);
  useEffect(() => saveData('sdc_users', users), [users]);
  useEffect(() => {
    if (currentUser) localStorage.setItem('sdc_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('sdc_current_user');
  }, [currentUser]);

  // Auth Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleSignup = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Admin Handlers
  const handleApproveUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
  };

  const handleRejectUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
  };

  // Feature Handlers
  const handleAddCategory = (name: string, color: string) => {
    const newCategory = {
      id: `c${Date.now()}`,
      name,
      color
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const handleAddEvent = (newEvent: CalendarEvent) => {
    setEvents(prev => [...prev, newEvent]);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const handleAddMeetingLog = (newLog: MeetingLog) => {
    setMeetings(prev => [newLog, ...prev]);
  };

  const handleUpdateMeetingLog = (updatedLog: MeetingLog) => {
    setMeetings(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));
  };

  const handleUpdateMember = (updatedMember: Member) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
  };

  const handleSelectMemberFromSidebar = (member: Member) => {
    setSelectedMemberId(member.id);
    setActiveTab('members');
  };

  // Research Handlers
  const handleAddResearch = (newRecord: ResearchRecord) => {
    setResearch(prev => [newRecord, ...prev]);
  };

  const handleUpdateResearch = (updatedRecord: ResearchRecord) => {
    setResearch(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };

  const handleDeleteResearch = (id: string) => {
    setResearch(prev => prev.filter(r => r.id !== id));
  };

  if (!currentUser) {
    return <AuthSystem onLogin={handleLogin} onSignup={handleSignup} users={users} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            events={events}
            research={research}
            members={members}
            categories={categories}
            onNavigate={setActiveTab}
            onLogout={handleLogout}
          />
        );
      case 'members':
        return (
          <MemberDirectory
            members={members}
            research={research}
            meetings={meetings}
            selectedMemberId={selectedMemberId}
            onSelectMember={(id) => setSelectedMemberId(id)}
            onUpdateMember={handleUpdateMember}
            onClearSelection={() => setSelectedMemberId(null)}
            onAddResearch={handleAddResearch}
            onUpdateResearch={handleUpdateResearch}
            onDeleteResearch={handleDeleteResearch}
            currentUser={currentUser}
          />
        );
      case 'research':
        // Legacy list (can be removed later if 'projects' replaces it entirely)
        return (
          <ResearchList
            research={research}
            members={members}
            onUpdateResearch={handleUpdateResearch}
          />
        );
      case 'mentoring':
        return (
          <MeetingLogs
            logs={meetings}
            members={members}
            onAddLog={handleAddMeetingLog}
            onUpdateLog={handleUpdateMeetingLog}
            currentUser={currentUser}
          />
        );

      case 'calendar':
        return (
          <CalendarView
            events={events}
            categories={categories}
            onAddCategory={handleAddCategory}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        );
      default:
        return <Dashboard events={events} research={research} members={members} categories={categories} onNavigate={setActiveTab} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      {/* Mobile Header / Hamburger */}
      <div className="md:hidden flex items-center justify-between p-4 bg-navy text-white sticky top-0 z-30 shadow-md">
        <h1 className="font-bold text-lg">SDC Lab</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Menu size={24} />
        </button>
      </div>

      <Sidebar
        activeTab={activeTab}
        onChangeTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }}
        members={members}
        onSelectMember={(m) => { handleSelectMemberFromSidebar(m); setIsSidebarOpen(false); }}
        currentUser={currentUser}
        onLogout={handleLogout}
        className={`transition-transform duration-300 transform fixed left-0 top-0 h-full z-40 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      />

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Admin Trigger for Prof. Lee */}
      {currentUser.role === 'admin' && (
        <button
          onClick={() => setIsAdminPanelOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-navy text-white p-3 rounded-full shadow-lg hover:bg-navy-light transition-transform hover:scale-105"
          title="Admin Panel"
        >
          <Settings size={24} />
        </button>
      )}

      {/* Admin Panel Modal */}
      {isAdminPanelOpen && (
        <AdminPanel
          users={users}
          onApprove={handleApproveUser}
          onReject={handleRejectUser}
          onClose={() => setIsAdminPanelOpen(false)}
        />
      )}

      <main className="md:pl-64 min-h-screen transition-all duration-300 pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
           {/* Global Header: Date & Logout */}
           <div className="flex justify-between items-center mb-6">
              {/* Spacer for Title (pages handle their own title) or Breadcrumbs if added later */}
              <div className="flex-1"></div> 
              <div className="flex items-center gap-3">
                <div className="hidden md:flex text-sm font-medium text-navy bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 items-center">
                  <CalendarIcon className="w-4 h-4 mr-2 text-sage" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center text-sm font-bold text-coral bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 hover:bg-coral-bg hover:border-coral transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </button>
              </div>
           </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
