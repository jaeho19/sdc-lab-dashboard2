import React from 'react';
import { CalendarEvent, ResearchRecord, Member, getStatusColor, getProgressColor } from '../types';
import { Calendar as CalendarIcon, Clock, ChevronRight, FileText, Activity, Users, AlertCircle } from 'lucide-react';

interface DashboardProps {
  events: CalendarEvent[];
  research: ResearchRecord[];
  members: Member[];
  categories: any[];
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ events, research, members, categories, onNavigate }) => {
  const today = new Date();

  const activeResearch = research.slice(0, 8); // Show top 8

  const upcomingEvents = events
    .filter(e => new Date(e.endTime) >= today && e.isMajorEvent)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-navy tracking-tight">Lab Dashboard</h2>
          <p className="text-slate-500 mt-1">SDC Lab Management Overview</p>
        </div>
        <div className="text-sm font-medium text-navy bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center">
          <CalendarIcon className="w-4 h-4 mr-2 text-sage" />
          {today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* 1. Schedule Section (Moved to Top) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-navy flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-navy-light" />
            Upcoming Schedule
          </h3>
          <button
            onClick={() => onNavigate('calendar')}
            className="text-xs text-slate-500 hover:text-navy font-bold uppercase tracking-wider flex items-center transition-colors"
          >
            View Calendar <ChevronRight className="w-3 h-3 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingEvents.length === 0 ? (
            <div className="col-span-full text-center py-8 text-slate-400 bg-soft-grey rounded-xl border border-dashed border-slate-200">
              No upcoming events.
            </div>
          ) : (
            upcomingEvents.map(event => {
              const category = categories.find(c => c.id === event.categoryId);
              const startTime = new Date(event.startTime);
              return (
                <div key={event.id} className="flex flex-col p-4 bg-soft-grey/50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100 group relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${category?.color.split(' ')[0] || 'bg-slate-300'}`}></div>

                  <div className="flex justify-between items-start mb-2">
                    <div className="text-center bg-white rounded-lg p-1.5 shadow-sm border border-slate-100 min-w-[3rem]">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{startTime.toLocaleDateString('en-US', { month: 'short' })}</div>
                      <div className="text-lg font-bold text-navy">{startTime.getDate()}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ml-2 ${category?.color}`}>
                      {category?.name || 'Event'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm truncate mb-1" title={event.title}>{event.title}</h4>
                  <p className="text-xs text-slate-500 flex items-center mt-auto">
                    <Clock className="w-3 h-3 mr-1" />
                    {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Research Table (Below Schedule) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="text-lg font-bold text-navy flex items-center">
            <Activity className="w-5 h-5 mr-2 text-navy-light" />
            Active Research Status
          </h3>
          <button
            onClick={() => onNavigate('research')}
            className="text-xs text-slate-500 hover:text-navy font-bold uppercase tracking-wider flex items-center transition-colors"
          >
            All Projects <ChevronRight className="w-3 h-3 ml-1" />
          </button>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-soft-grey border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Project Title</th>
                <th className="px-6 py-4 font-bold tracking-wider">Researcher</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold tracking-wider">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeResearch.map(item => {
                const member = members.find(m => m.id === item.assignedMemberId);
                return (
                  <tr key={item.id} className="hover:bg-soft-grey/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-navy max-w-md truncate" title={item.title}>{item.title}</td>
                    <td className="px-6 py-4">
                      {member && (
                        <div className="flex items-center space-x-2">
                          <img src={member.photoUrl} alt={member.name} className="w-6 h-6 rounded-full object-cover ring-2 ring-white shadow-sm" />
                          <span className="text-slate-600 font-medium text-xs">{member.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex flex-col space-y-1">
                        <div className="flex justify-between text-[10px] font-medium text-slate-500">
                          <span>{item.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-700 ease-out ${getProgressColor(item.progress)}`}
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;