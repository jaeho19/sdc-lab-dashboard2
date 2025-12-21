import React from 'react';
import { ResearchRecord, Member, getStatusColor } from '../types';
import { Upload, Download, FileText } from 'lucide-react';

interface ResearchListProps {
  research: ResearchRecord[];
  members: Member[];
  onUpdateResearch: (research: ResearchRecord) => void;
}

const ResearchList: React.FC<ResearchListProps> = ({ research, members, onUpdateResearch }) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [checklistMode, setChecklistMode] = React.useState<'writing' | 'review'>('writing');
  const [tempChecklist, setTempChecklist] = React.useState<string[]>([]);
  const [tempReviewChecklist, setTempReviewChecklist] = React.useState<string[]>([]);

  const WRITING_STEPS = [
    { id: 'intro', label: 'Introduction', weight: 15 },
    { id: 'lit_review', label: 'Literature Review', weight: 15 },
    { id: 'method', label: 'Methodology', weight: 15 },
    { id: 'results', label: 'Results/Analysis', weight: 20 },
    { id: 'discussion', label: 'Discussion', weight: 15 },
    { id: 'conclusion', label: 'Conclusion', weight: 10 },
    { id: 'abstract', label: 'Abstract & Ref', weight: 10 },
  ];

  const REVIEW_STEPS = [
    { id: 'submitted', label: 'Submitted', weight: 20 },
    { id: 'under_review', label: 'Under Review', weight: 20 },
    { id: 'revision_req', label: 'Revision Requested', weight: 0 }, // Status marker
    { id: 'revision_sub', label: 'Revision Submitted', weight: 30 },
    { id: 'accepted', label: 'Accepted', weight: 30 },
  ];

  const handleEditClick = (item: ResearchRecord) => {
    setEditingId(item.id);
    setTempChecklist(item.checklist || []);
    setTempReviewChecklist(item.reviewChecklist || []);
    // Default mode based on status
    if (item.status === 'Submitting' || item.status === 'Under Review' || item.status === 'Accepted') {
      setChecklistMode('review');
    } else {
      setChecklistMode('writing');
    }
  };

  const toggleCheckitem = (stepId: string, type: 'writing' | 'review') => {
    if (type === 'writing') {
      setTempChecklist(prev =>
        prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
      );
    } else {
      setTempReviewChecklist(prev =>
        prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
      );
    }
  };

  const calculateProgress = () => {
    const writingProgress = WRITING_STEPS.reduce((acc, step) =>
      tempChecklist.includes(step.id) ? acc + step.weight : acc, 0);

    // For simplicity, if we are in review mode, we mix the progress or take the max?
    // User asked for "Separate progress tracking". 
    // Let's assume the main 'progress' field reflects the active phase.

    if (checklistMode === 'review') {
      // Base progress could be 100% of writing? Or separate? 
      // Let's just calculate Review Progress 0-100 for the Review Phase.
      return REVIEW_STEPS.reduce((acc, step) =>
        tempReviewChecklist.includes(step.id) ? acc + step.weight : acc, 0);
    }

    return Math.min(writingProgress, 100);
  };

  const handleSaveProgress = () => {
    if (!editingId) return;
    const progress = calculateProgress();
    const item = research.find(r => r.id === editingId)!;

    onUpdateResearch({
      ...item,
      progress,
      checklist: tempChecklist,
      reviewChecklist: tempReviewChecklist
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Research Projects</h2>
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
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Deadline</th>
                <th className="px-6 py-4 font-bold">Files</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {research.map(item => {
                const member = members.find(m => m.id === item.assignedMemberId);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 max-w-sm">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      {item.targetJournal && (
                        <div className="text-xs text-blue-600 mt-1">Target: {item.targetJournal}</div>
                      )}

                      {/* Interactive Progress Bar */}
                      <div className="mt-2 group/progress cursor-pointer relative" onClick={() => handleEditClick(item)} title="Click to update progress">
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all group-hover/progress:bg-blue-500"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <div className="absolute top-0 right-0 -mt-4 text-xs font-bold text-blue-600 opacity-0 group-hover/progress:opacity-100 transition-opacity bg-blue-50 px-1 rounded">
                          {item.progress}% (Edit)
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
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border border-opacity-20 ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.deadline ? (
                        <span className="flex items-center font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs">
                          {item.deadline}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <label className="cursor-pointer text-slate-400 hover:text-blue-600 transition-colors" title="Upload">
                          <input type="file" className="hidden" />
                          <Upload className="w-4 h-4" />
                        </label>
                        <button className="text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-30" disabled={!item.fileAttachment} title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
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
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {item.type}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
              {item.targetJournal && (
                <div className="text-xs text-blue-600 mb-3">Target: {item.targetJournal}</div>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  {member ? (
                    <>
                      <img src={member.photoUrl} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-xs font-medium text-slate-700">{member.name}</span>
                    </>
                  ) : <span className="text-xs text-slate-400">Unassigned</span>}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md"
                  >
                    {item.progress}% Update
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checklist Progress Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">Update Progress</h3>
              <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                <button
                  onClick={() => setChecklistMode('writing')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${checklistMode === 'writing' ? 'bg-navy text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Writing
                </button>
                <button
                  onClick={() => setChecklistMode('review')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${checklistMode === 'review' ? 'bg-navy text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Review
                </button>
              </div>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                {(checklistMode === 'writing' ? WRITING_STEPS : REVIEW_STEPS).map(step => {
                  const isChecked = checklistMode === 'writing'
                    ? tempChecklist.includes(step.id)
                    : tempReviewChecklist.includes(step.id);

                  return (
                    <div
                      key={step.id}
                      onClick={() => toggleCheckitem(step.id, checklistMode)}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                        {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${isChecked ? 'text-blue-900' : 'text-slate-700'}`}>{step.label}</span>
                        <div className="text-[10px] text-slate-400">contribution: {step.weight}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="text-sm font-bold text-slate-600">
                Total: <span className="text-blue-600 text-lg">{calculateProgress()}%</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProgress}
                  className="px-4 py-2 text-sm font-bold text-white bg-navy hover:bg-navy-light rounded-lg shadow-sm transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchList;