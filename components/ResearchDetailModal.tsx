import React, { useState, useEffect } from 'react';
import { ResearchRecord, Milestone, ResearchStatusTag, ActivityLog, Attachment, Collaborator, getStatusColor } from '../types';
import { X, Calendar, CheckCircle, Clock, FileText, Plus, Trash2, Tag, ChevronDown, Link as LinkIcon, Users, ExternalLink, Briefcase } from 'lucide-react';

interface ResearchDetailModalProps {
  research: ResearchRecord;
  onClose: () => void;
  onUpdate: (updatedRecord: ResearchRecord) => void;
}

const ResearchDetailModal: React.FC<ResearchDetailModalProps> = ({ research, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'milestones' | 'activity' | 'files' | 'collaborators'>('milestones');
  
  // Data State
  const [milestones, setMilestones] = useState<Milestone[]>(research.milestones || []);
  const [statusTag, setStatusTag] = useState<ResearchStatusTag>(research.statusTag || 'On Track');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(research.activityLog || []);
  const [attachments, setAttachments] = useState<Attachment[]>(research.attachments || []);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(research.collaborators || []);

  // Form State
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneWeight, setNewMilestoneWeight] = useState(10);
  
  const [newLogContent, setNewLogContent] = useState('');
  
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentType, setNewAttachmentType] = useState<'file' | 'link'>('link');

  // Tag Colors
  const getTagColor = (tag: ResearchStatusTag) => {
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

  // Sync Updates to Parent
  useEffect(() => {
    const totalWeight = milestones.reduce((acc, m) => acc + m.weight, 0);
    const completedWeight = milestones.reduce((acc, m) => m.isCompleted ? acc + m.weight : acc, 0);
    const newProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    // Only update if changed to avoid loops
    // Simplified: We assume onUpdate handles simple object replacement
    // In a real app, careful diffing is needed. Here we construct the object.
    const updated: ResearchRecord = {
        ...research,
        milestones,
        statusTag,
        activityLog: activityLogs,
        attachments,
        collaborators,
        progress: newProgress
    };
    
    // We only trigger update if data actually changed from props 'research'
    // To implement "save on change" without infinite loop, we might need a debounce or manual save.
    // However, for this demo, we'll assume the parent updates the prop or ignore the loop if strict.
    // Better strategy for this modal: Local state is source of truth, 
    // we trigger onUpdate immediately but check deep equality or just rely on react's state batching.
    // Let's just trigger it.
    
    // NOTE: To avoid infinite update loops if parent re-renders with new object reference but same data:
    if (
        JSON.stringify(updated.milestones) !== JSON.stringify(research.milestones) ||
        updated.statusTag !== research.statusTag ||
        JSON.stringify(updated.activityLog) !== JSON.stringify(research.activityLog) ||
        JSON.stringify(updated.attachments) !== JSON.stringify(research.attachments)
    ) {
         onUpdate(updated);
    }
  }, [milestones, statusTag, activityLogs, attachments, collaborators]);

  // --- Handlers ---
  
  // Milestones
  const handleToggleMilestone = (id: string) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, isCompleted: !m.isCompleted } : m));
  };
  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    const newMilestone: Milestone = {
      id: `ms_${Date.now()}`,
      title: newMilestoneTitle,
      weight: newMilestoneWeight,
      isCompleted: false,
      order: milestones.length + 1
    };
    setMilestones([...milestones, newMilestone]);
    setNewMilestoneTitle('');
    
    // Auto-log
    handleAddLog(`Milestone created: ${newMilestoneTitle}`, 'milestone');
  };
  const handleDeleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  // Activity Log
  const handleAddLog = (content: string = newLogContent, type: 'log' | 'milestone' | 'status_change' = 'log') => {
      if (!content.trim()) return;
      const newLog: ActivityLog = {
          id: `log_${Date.now()}`,
          date: new Date().toISOString(),
          content: content,
          type
      };
      setActivityLogs([newLog, ...activityLogs]); // Newest first
      setNewLogContent('');
  };

  // Attachments
  const handleAddAttachment = () => {
      if (!newAttachmentName.trim() || !newAttachmentUrl.trim()) return;
      const newAtt: Attachment = {
          id: `att_${Date.now()}`,
          name: newAttachmentName,
          url: newAttachmentUrl,
          type: newAttachmentType,
          date: new Date().toISOString().split('T')[0]
      };
      setAttachments([...attachments, newAtt]);
      setNewAttachmentName('');
      setNewAttachmentUrl('');
  };

  // D-Day
  const dDay = research.deadline ? Math.ceil((new Date(research.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  const getDDayStyle = (days: number | null) => {
    if (days === null) return 'bg-slate-100 text-slate-500';
    if (days < 0) return 'bg-slate-200 text-slate-600'; 
    if (days <= 7) return 'bg-red-100 text-red-600 animate-pulse'; 
    if (days <= 30) return 'bg-orange-100 text-orange-600'; 
    return 'bg-blue-100 text-blue-600'; 
  };
   const getTimelineProgress = () => {
      if (!research.startDate || !research.deadline) return 0;
      const start = new Date(research.startDate).getTime();
      const end = new Date(research.deadline).getTime();
      const now = new Date().getTime();
      const total = end - start;
      const current = now - start;
      return Math.min(Math.max((current / total) * 100, 0), 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="flex justify-between items-start mb-4">
             <div className="flex-1 mr-4">
                <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(research.status).replace('bg-opacity-20', '')}`}>
                        {research.type}
                    </span>
                    <span className="text-slate-400 text-xs">|</span>
                    {research.deadline && (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getDDayStyle(dDay)}`}>
                            {dDay !== null ? (dDay < 0 ? `D+${Math.abs(dDay)}` : `D-${dDay}`) : 'No Date'}
                        </span>
                    )}
                </div>
                <h2 className="text-2xl font-bold text-navy leading-tight">{research.title}</h2>
                
                {/* Meta Info Row */}
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                    {research.targetJournal && (
                        <div className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            <span>Target: <strong className="text-slate-700">{research.targetJournal}</strong></span>
                        </div>
                    )}
                    {research.fundingAgency && (
                        <div className="flex items-center gap-1">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded">Funding: {research.fundingAgency}</span>
                        </div>
                    )}
                    {research.submissionDate && (
                         <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Submit: {research.submissionDate}</span>
                        </div>
                    )}
                </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
             </button>
          </div>

          {/* Timeline Bar */}
          {research.startDate && research.deadline && (
              <div className="mt-4 mb-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
                      <span>{research.startDate}</span>
                      <span>Today</span>
                      <span>{research.deadline}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full relative overflow-hidden">
                      <div className="absolute top-0 bottom-0 left-0 bg-blue-200" style={{ width: '100%' }}></div>
                      <div className="absolute top-0 bottom-0 left-0 bg-navy opacity-30" style={{ width: `${getTimelineProgress()}%` }}></div>
                      <div className="absolute top-0 bottom-0 w-1 bg-navy z-10" style={{ left: `${getTimelineProgress()}%` }}></div>
                  </div>
              </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between mt-6">
              <div className="flex items-center space-x-4">
                  {/* Status Tag Selector */}
                  <div className="relative group">
                      <button className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-sm font-bold transition-all ${getTagColor(statusTag)}`}>
                          <Tag className="w-4 h-4" />
                          <span>{statusTag}</span>
                          <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                      </button>
                      <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 p-1 hidden group-hover:block z-20">
                          {['On Track', 'At Risk', 'Delayed', 'On Hold', 'Under Review', 'Completed'].map((tag) => (
                              <button
                                key={tag}
                                onClick={() => {
                                    setStatusTag(tag as ResearchStatusTag);
                                    handleAddLog(`Status changed to ${tag}`, 'status_change');
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                              >
                                {tag}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="h-8 w-px bg-slate-200"></div>

                  <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Overall Progress</span>
                      <span className="text-xl font-bold text-navy">{Math.round(research.progress)}%</span>
                  </div>
              </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/50 px-6 flex space-x-6 overflow-x-auto">
            {['milestones', 'activity', 'files', 'collaborators'].map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`py-4 text-sm font-bold border-b-2 transition-colors capitalize whitespace-nowrap ${activeTab === tab ? 'border-navy text-navy' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    {tab === 'activity' ? 'Activity Log' : tab}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
            {activeTab === 'milestones' && (
                <div className="space-y-6">
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newMilestoneTitle}
                            onChange={(e) => setNewMilestoneTitle(e.target.value)}
                            placeholder="Add a new milestone..."
                            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                        />
                        <input
                             type="number"
                             value={newMilestoneWeight}
                             onChange={(e) => setNewMilestoneWeight(parseInt(e.target.value))}
                             className="w-20 px-4 py-2 rounded-lg border border-slate-200 text-sm"
                             min="1" max="100"
                        />
                        <button
                            onClick={handleAddMilestone}
                            className="bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy-light transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {milestones.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                No milestones defined yet.
                            </div>
                        ) : (
                            milestones.sort((a,b) => a.order - b.order).map((ms) => (
                                <div key={ms.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center group transition-all hover:shadow-md">
                                    <button
                                        onClick={() => handleToggleMilestone(ms.id)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${ms.isCompleted ? 'bg-sage border-sage' : 'border-slate-300 hover:border-navy'}`}
                                    >
                                        {ms.isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
                                    </button>
                                    
                                    <div className="flex-1">
                                        <h4 className={`font-bold text-sm ${ms.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                            {ms.title}
                                        </h4>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                            {ms.weight}%
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteMilestone(ms.id)}
                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'activity' && (
                <div className="space-y-4">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex gap-2">
                        <input
                            type="text" 
                            value={newLogContent}
                            onChange={(e) => setNewLogContent(e.target.value)}
                            placeholder="Type a new activity log..."
                            className="flex-1 text-sm outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
                        />
                        <button onClick={() => handleAddLog()} className="text-navy font-bold text-sm hover:underline">Add Log</button>
                    </div>

                    <div className="space-y-0 relative">
                        {activityLogs.length === 0 && (
                            <div className="text-center py-8 text-slate-400">No activity logs yet.</div>
                        )}
                        {/* Timeline line */}
                        {activityLogs.length > 0 && <div className="absolute left-6 top-3 bottom-3 w-px bg-slate-200"></div>}
                        
                        {activityLogs.map((log) => (
                            <div key={log.id} className="relative pl-12 py-3 group">
                                <div className={`absolute left-4 w-4 h-4 rounded-full border-2 border-white shadow-sm mt-0.5 z-10 ${log.type === 'milestone' ? 'bg-indigo-500' : log.type === 'status_change' ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-slate-800">{log.content}</p>
                                        <span className="text-xs text-slate-400">{new Date(log.date).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

             {activeTab === 'files' && (
                <div className="space-y-6">
                    {/* Add File/Link Form */}
                    <div className="bg-slate-100 p-4 rounded-xl space-y-3">
                        <div className="flex gap-2 text-sm">
                            <button 
                                className={`px-3 py-1 rounded-full ${newAttachmentType === 'link' ? 'bg-white shadow-sm text-navy' : 'text-slate-500'}`}
                                onClick={() => setNewAttachmentType('link')}
                            >
                                Link
                            </button>
                            <button 
                                className={`px-3 py-1 rounded-full ${newAttachmentType === 'file' ? 'bg-white shadow-sm text-navy' : 'text-slate-500'}`}
                                onClick={() => setNewAttachmentType('file')}
                            >
                                File
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                             <input
                                type="text"
                                value={newAttachmentName}
                                onChange={(e) => setNewAttachmentName(e.target.value)}
                                placeholder="Name (e.g. Draft v1)"
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm w-full"
                             />
                             <input
                                type="text"
                                value={newAttachmentUrl}
                                onChange={(e) => setNewAttachmentUrl(e.target.value)}
                                placeholder={newAttachmentType === 'link' ? "https://..." : "Filename for simulation"}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm w-full"
                             />
                        </div>
                        <div className="flex justify-end">
                            <button onClick={handleAddAttachment} className="text-xs font-bold bg-navy text-white px-3 py-1.5 rounded-lg hover:bg-navy-light">
                                Add Attachment
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {attachments.map(att => (
                            <div key={att.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3 hover:shadow-md transition-shadow">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    {att.type === 'link' ? <LinkIcon size={18} /> : <FileText size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-bold text-sm text-slate-800 truncate">{att.name}</h5>
                                    <a href={att.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 truncate">
                                        {att.url} <ExternalLink size={10} />
                                    </a>
                                </div>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{att.date}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'collaborators' && (
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3 text-blue-800 text-sm">
                         <Briefcase size={20} />
                         <span>Collaborator management allows you to track co-authors and external partners.</span>
                    </div>
                    <div className="space-y-2">
                        {collaborators.map(c => (
                            <div key={c.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">{c.role}</span>
                                            {c.isExternal && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded">External</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                         {collaborators.length === 0 && (
                            <div className="text-center py-8 text-slate-400">No collaborators listed.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ResearchDetailModal;
