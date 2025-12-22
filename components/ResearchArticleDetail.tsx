import React, { useState, useEffect } from 'react';
import { ResearchRecord, PaperAuthor, getProgressColor } from '../types';
import { generateStages } from '../services/mockData';
import { CheckCircle, Plus, Trash2, Edit2, User, Clock, FileText, ChevronDown } from 'lucide-react';
import Button from './Button';

interface ResearchArticleDetailProps {
  paper: ResearchRecord;
  onUpdate: (paper: ResearchRecord) => void;
  onDelete?: (id: string) => void;
  currentUser: any;
  onClose: () => void;
}

const ResearchArticleDetail: React.FC<ResearchArticleDetailProps> = ({ 
    paper, 
    onUpdate, 
    onDelete,
    currentUser,
    onClose
}) => {
  // Local UI State
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [newDeadline, setNewDeadline] = useState(paper.deadline || '');
  
  // Author Editing State
  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null);
  const [editAuthorName, setEditAuthorName] = useState('');
  const [editAuthorRole, setEditAuthorRole] = useState('');
  const [editAuthorResp, setEditAuthorResp] = useState('');

  // Auto-repair effect: Ensure paper has stages
  useEffect(() => {
    if (!paper.stages || paper.stages.length === 0) {
        const estimatedCompleted = Math.floor((paper.progress || 0) / 11);
        const newStages = generateStages(estimatedCompleted);
        onUpdate({
            ...paper,
            stages: newStages
        });
    }
  }, [paper.id]); 

  // --- Logic Helpers ---

    const getProgressGradient = (progress: number) => {
      if (progress >= 80) return 'bg-gradient-to-r from-green-400 to-green-600';
      if (progress >= 50) return 'bg-gradient-to-r from-blue-400 to-blue-600';
      if (progress >= 25) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      return 'bg-gradient-to-r from-slate-300 to-slate-400';
  };

  const handleStageToggle = (stageId: string) => {
      const updatedStages = (paper.stages || []).map(s => {
          if (s.id === stageId) {
              return {
                  ...s,
                  completed: !s.completed,
                  completedDate: !s.completed ? new Date().toISOString().split('T')[0] : undefined
              };
          }
          return s;
      });
      
      const totalWeight = updatedStages.reduce((sum, s) => sum + s.weight, 0);
      const completedWeight = updatedStages.reduce((sum, s) => s.completed ? sum + s.weight : sum, 0);
      const newProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

      onUpdate({
          ...paper,
          stages: updatedStages,
          progress: newProgress
      });
  };

  const handleChecklistToggle = (stageId: string, itemId: string) => {
    const updatedStages = (paper.stages || []).map(s => {
        if (s.id === stageId) {
            return {
                ...s,
                checklist: (s.checklist || []).map(item => {
                    if (item.id === itemId) return { ...item, completed: !item.completed };
                    return item;
                })
            };
        }
        return s;
    });
    
    onUpdate({ ...paper, stages: updatedStages });
  };

  const handleAddChecklistItem = (stageId: string, text: string) => {
    if(!text.trim()) return;
    const updatedStages = (paper.stages || []).map(s => {
        if (s.id === stageId) {
            return {
                ...s,
                checklist: [...(s.checklist || []), { id: `${stageId}-c${Date.now()}`, text, completed: false }]
            };
        }
        return s;
    });
    onUpdate({ ...paper, stages: updatedStages });
  };

  const handleDeleteChecklistItem = (stageId: string, itemId: string) => {
    const updatedStages = (paper.stages || []).map(s => {
        if (s.id === stageId) {
            return {
                ...s,
                checklist: (s.checklist || []).filter(item => item.id !== itemId)
            };
        }
        return s;
    });
    onUpdate({ ...paper, stages: updatedStages });
  };

  const handleMemoChange = (stageId: string, memo: string) => {
    const updatedStages = (paper.stages || []).map(s => {
        if (s.id === stageId) {
            return { ...s, memo };
        }
        return s;
    });
    onUpdate({ ...paper, stages: updatedStages });
  };

  const handleAddAuthor = (name: string, role: string, responsibility: string) => {
      if (!name) return;
      const newAuthor: PaperAuthor = {
          id: `a-${Date.now()}`,
          name,
          role: role as '1저자' | '교신저자' | '공저자',
          responsibilities: responsibility.split(',').map(r => r.trim()).filter(r => r),
          order: (paper.authors || []).length + 1
      };
      onUpdate({
          ...paper,
          authors: [...(paper.authors || []), newAuthor]
      });
  };

  const handleDeleteAuthor = (authorId: string) => {
      onUpdate({
          ...paper,
          authors: (paper.authors || []).filter(a => a.id !== authorId)
      });
  };

  const handleStartEditAuthor = (author: PaperAuthor) => {
      setEditingAuthorId(author.id);
      setEditAuthorName(author.name);
      setEditAuthorRole(author.role);
      setEditAuthorResp(author.responsibilities.join(', '));
  };

  const handleSaveAuthor = (authorId: string) => {
      const updatedAuthors = (paper.authors || []).map(a => {
          if (a.id === authorId) {
              return {
                  ...a,
                  name: editAuthorName,
                  role: editAuthorRole as '1저자' | '교신저자' | '공저자',
                  responsibilities: editAuthorResp.split(',').map(r => r.trim()).filter(r => r)
              };
          }
          return a;
      });
      onUpdate({ ...paper, authors: updatedAuthors });
      setEditingAuthorId(null);
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-in slide-in-from-top-2 duration-300 pb-24 relative">
                                                    
        {/* Header Details */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-800 leading-tight">{paper.title}</h3>
                    <div className="flex gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-tight">{paper.status}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border uppercase tracking-tight ${
                            paper.statusTag === 'On Track' ? 'bg-green-50 text-green-700 border-green-200' :
                            paper.statusTag === 'At Risk' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>{paper.statusTag || 'No Status'}</span>
                    </div>
                </div>
                <div className="text-sm text-slate-500 font-medium">TYPE <span className="text-slate-700 ml-1">{paper.type || 'Research'}</span></div>
            </div>

            <div className="flex items-center gap-4">
                <div onClick={onClose} className="cursor-pointer p-1 hover:bg-slate-200 rounded-full text-slate-400">
                    <ChevronDown className="transform rotate-180" size={20}/>
                </div>
            </div>
        </div>

        {/* Layout: Stages in Grid, Authors Below */}
        <div className="space-y-8">
            
            {/* SECTION 1: Research Stages (2-Col Grid) */}
            <div>
                <h4 className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-3">
                    <CheckCircle size={16} className="text-blue-500"/> 단계별 진행 (Step-by-Step Progress)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(paper.stages || []).sort((a,b) => a.order - b.order).map((stage, index, allStages) => {
                            const isCompleted = stage.completed;
                            const isCurrent = !isCompleted && (index === 0 || allStages[index-1].completed);
                            
                            return (
                                <div key={stage.id} 
                                    onClick={() => handleStageToggle(stage.id)}
                                    className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                        isCompleted ? 'bg-green-50 border-green-400' : 
                                        isCurrent ? 'bg-blue-50 border-blue-400 shadow-md ring-1 ring-blue-100' : 
                                        'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                                isCompleted ? 'bg-green-500 text-white' : 'bg-white border-2 border-slate-300 text-transparent'
                                            }`}>
                                                <CheckCircle size={16} fill="currentColor" className={isCompleted ? 'block' : 'hidden'} />
                                            </div>
                                            <div>
                                                <span className={`text-base font-bold ${isCompleted ? 'text-green-800' : isCurrent ? 'text-blue-800' : 'text-slate-600'}`}>{stage.stageType}</span>
                                                {isCurrent && <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-[10px] rounded-full font-bold uppercase tracking-wide">Current</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {isCompleted ? (
                                                <span className="text-sm font-medium text-green-700">{stage.completedDate}</span>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">{stage.weight}% Weight</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {(isCurrent || isCompleted || true) && (
                                        <div className="mt-4 pt-4 border-t border-slate-200/50 space-y-3">
                                            {/* Checklist Items */}
                                            {stage.checklist && stage.checklist.length > 0 && (
                                                <div className="space-y-2">
                                                    {stage.checklist.map(item => (
                                                        <div 
                                                            key={item.id} 
                                                            className="group/item flex items-center gap-3 p-2 rounded hover:bg-black/5 transition-colors"
                                                            onClick={(e) => { e.stopPropagation(); handleChecklistToggle(stage.id, item.id); }}
                                                        >
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                                                item.completed ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'
                                                            }`}>
                                                                {item.completed && <CheckCircle size={10} className="text-white" strokeWidth={4} />}
                                                            </div>
                                                            <span className={`text-sm flex-1 ${item.completed ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-700'}`}>
                                                                {item.text}
                                                            </span>
                                                            {/* Delete Button (Visible on hover) */}
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteChecklistItem(stage.id, item.id); }}
                                                                className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-100 text-red-500 rounded transition-all"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {/* Add New Item */}
                                            <div className="flex items-center gap-2 px-2" onClick={e => e.stopPropagation()}>
                                                <Plus size={14} className="text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Add checklist item..." 
                                                    className="bg-transparent text-sm w-full outline-none placeholder:text-slate-400"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleAddChecklistItem(stage.id, e.currentTarget.value);
                                                            e.currentTarget.value = '';
                                                        }
                                                    }}
                                                />
                                            </div>

                                            {/* Memo Field */}
                                            <div className="pt-2 mt-2 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                                                <textarea
                                                    placeholder="Add stage notes or memos..."
                                                    value={stage.memo || ''}
                                                    onChange={(e) => handleMemoChange(stage.id, e.target.value)}
                                                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded p-2 focus:ring-1 focus:ring-blue-200 outline-none resize-none"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* SECTION 2: Author Info & Details (Full Width Below) */}
            <div>
                    <h4 className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-3">
                        <User size={16} className="text-slate-400"/> Author Info
                    </h4>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-4 py-2">Name</th>
                                    <th className="px-4 py-2">Role</th>
                                    <th className="px-4 py-2">Resp.</th>
                                    <th className="px-4 py-2 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(paper.authors || []).sort((a,b) => a.order - b.order).map(author => {
                                    const isEditing = editingAuthorId === author.id;
                                    return (
                                        <tr key={author.id} className="group/row hover:bg-slate-50/[0.5]">
                                            <td className="px-4 py-3 font-bold text-slate-800">
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        value={editAuthorName} 
                                                        onChange={e => setEditAuthorName(e.target.value)}
                                                        className="w-full border rounded px-1 py-0.5"
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 uppercase">{author.name[0]}</div>
                                                        {author.name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <select 
                                                        value={editAuthorRole} 
                                                        onChange={e => setEditAuthorRole(e.target.value)}
                                                        className="w-full border rounded px-1 py-0.5"
                                                    >
                                                        <option value="공저자">공저자</option>
                                                        <option value="1저자">1저자</option>
                                                        <option value="교신저자">교신저자</option>
                                                    </select>
                                                ) : (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                        author.role === '1저자' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                                        author.role === '교신저자' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                                                        'bg-slate-50 border-slate-200 text-slate-600'
                                                    }`}>{author.role}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 text-xs">
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        value={editAuthorResp} 
                                                        onChange={e => setEditAuthorResp(e.target.value)}
                                                        className="w-full border rounded px-1 py-0.5"
                                                    />
                                                ) : (
                                                    author.responsibilities.length > 0 ? author.responsibilities.join(', ') : '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right flex gap-1 justify-end">
                                                {isEditing ? (
                                                    <button onClick={() => handleSaveAuthor(author.id)} className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100"><CheckCircle size={12}/></button>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleStartEditAuthor(author)} className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={12}/></button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteAuthor(author.id); }}
                                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                                                        >
                                                            <Trash2 size={12}/>
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                
                                {/* Add Author Row */}
                                <tr className="bg-slate-50/50">
                                    <td className="px-4 py-2">
                                        <input 
                                            id={`new-author-name-${paper.id}`}
                                            type="text" 
                                            placeholder="Name" 
                                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-300"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <select 
                                            id={`new-author-role-${paper.id}`}
                                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-300"
                                        >
                                            <option value="공저자">공저자</option>
                                            <option value="1저자">1저자</option>
                                            <option value="교신저자">교신저자</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            id={`new-author-resp-${paper.id}`}
                                            type="text" 
                                            placeholder="Resp..." 
                                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-300"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const nameInput = document.getElementById(`new-author-name-${paper.id}`) as HTMLInputElement;
                                                    const roleInput = document.getElementById(`new-author-role-${paper.id}`) as HTMLSelectElement;
                                                    const respInput = document.getElementById(`new-author-resp-${paper.id}`) as HTMLInputElement;
                                                    
                                                    handleAddAuthor(nameInput.value, roleInput.value, respInput.value);
                                                    nameInput.value = '';
                                                    respInput.value = '';
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <button 
                                            onClick={() => {
                                                const nameInput = document.getElementById(`new-author-name-${paper.id}`) as HTMLInputElement;
                                                const roleInput = document.getElementById(`new-author-role-${paper.id}`) as HTMLSelectElement;
                                                const respInput = document.getElementById(`new-author-resp-${paper.id}`) as HTMLInputElement;
                                                
                                                handleAddAuthor(nameInput.value, roleInput.value, respInput.value);
                                                nameInput.value = '';
                                                respInput.value = '';
                                            }}
                                            className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                        >
                                            <Plus size={14}/>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="secondary" size="sm" onClick={() => { setNewDeadline(paper.deadline || ''); setIsEditingDeadline(true); }}>
                            <Edit2 size={14} className="mr-1.5"/> Full Edit
                        </Button>
                        {currentUser?.role === 'admin' && onDelete && (
                            <Button variant="danger" size="sm" onClick={() => { if(confirm('Delete?')) onDelete(paper.id); }}>
                                <Trash2 size={14} className="mr-1.5"/> Delete
                            </Button>
                        )}
                    </div>
            </div>
        </div>

        {/* Sticky Bottom Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg rounded-b-2xl flex items-center gap-4 z-20">
            <div className="text-sm font-bold text-slate-700 whitespace-nowrap w-24">
                Overall Progress
            </div>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${getProgressGradient(paper.progress || 0)}`} 
                    style={{ width: `${paper.progress || 0}%` }}
                ></div>
            </div>
            <div className="text-lg font-bold text-navy w-12 text-right">
                {paper.progress}%
            </div>
        </div>
    </div>
  );
};

export default ResearchArticleDetail;
