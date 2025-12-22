import React, { useState } from 'react';
import { ResearchRecord, Member, getStatusColor, ResearchStatusTag } from '../types';
import { Upload, Download, FileText, Tag } from 'lucide-react';
import ResearchDetailModal from './ResearchDetailModal';

interface ResearchListProps {
  research: ResearchRecord[];
  members: Member[];
  onUpdateResearch: (research: ResearchRecord) => void;
}

const ResearchList: React.FC<ResearchListProps> = ({ research, members, onUpdateResearch }) => {
  const [editingItem, setEditingItem] = useState<ResearchRecord | null>(null);

  const getTagColor = (tag?: ResearchStatusTag) => {
    switch (tag) {
      case 'On Track': return 'bg-green-100 text-green-700 border-green-200';
      case 'At Risk': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Delayed': return 'bg-red-100 text-red-700 border-red-200';
      case 'On Hold': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Under Review': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-sage-bg text-sage border-sage';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleUpdate = (updatedItem: ResearchRecord) => {
      onUpdateResearch(updatedItem);
      // Update the local state to reflect changes immediately in the modal
      setEditingItem(updatedItem);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Research Articles</h2>
          <p className="text-slate-500">Track publications, thesis work, and new studies.</p>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold">Title / Description</th>
                <th className="px-6 py-4 font-bold">Assigned To</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Health</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {research.map(item => {
                const member = members.find(m => m.id === item.assignedMemberId);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setEditingItem(item)}>
                    <td className="px-6 py-4 max-w-sm">
                      <div className="font-bold text-slate-900 group-hover:text-navy transition-colors">{item.title}</div>
                      {item.targetJournal && (
                        <div className="text-xs text-blue-600 mt-1">Target: {item.targetJournal}</div>
                      )}

                      {/* Interactive Progress Bar */}
                      <div className="mt-2 relative">
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-navy h-1.5 rounded-full transition-all"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 text-right font-medium">
                            {item.progress}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {member ? (
                        <div className="flex items-center space-x-2">
                          <img src={member.photoUrl} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                          <div className="text-sm font-medium text-slate-700">{member.name}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       {item.statusTag && (
                           <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getTagColor(item.statusTag)}`}>
                               {item.statusTag}
                           </span>
                       )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border border-opacity-20 ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.deadline ? (
                        <span className="flex items-center font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded-md text-xs">
                          {item.deadline}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {research.map(item => {
          const member = members.find(m => m.id === item.assignedMemberId);
          return (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200" onClick={() => setEditingItem(item)}>
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
                {item.statusTag && (
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getTagColor(item.statusTag)}`}>
                        {item.statusTag}
                    </span>
                )}
              </div>

              <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
              
              <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{item.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-navy h-1.5 rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                    ></div>
                 </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  {member ? (
                    <>
                      <img src={member.photoUrl} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-xs font-medium text-slate-700">{member.name}</span>
                    </>
                  ) : <span className="text-xs text-slate-400">Unassigned</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Research Detail Modal */}
      {editingItem && (
        <ResearchDetailModal 
            research={editingItem} 
            onClose={() => setEditingItem(null)} 
            onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default ResearchList;