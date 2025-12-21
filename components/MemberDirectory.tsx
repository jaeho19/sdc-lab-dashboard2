
import React, { useRef, useState } from 'react';
import { Member, ResearchRecord, MeetingLog, getRoleColor, getStatusColor, getProgressColor, ResearchType, ResearchStatus } from '../types';
import { X, FileText, MessageSquare, CheckCircle, Camera, Edit2, Plus, Trash2, Save, ChevronDown, ChevronUp, Calendar, Activity } from 'lucide-react';
import Button from './Button';

interface MemberDirectoryProps {
  members: Member[];
  research: ResearchRecord[];
  meetings: MeetingLog[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string) => void;
  onUpdateMember: (updatedMember: Member) => void;
  onClearSelection: () => void;
  onAddResearch: (record: ResearchRecord) => void;
  onUpdateResearch: (record: ResearchRecord) => void;
  onDeleteResearch: (id: string) => void;
}

const MemberDirectory: React.FC<MemberDirectoryProps> = ({ 
  members, 
  research, 
  meetings, 
  selectedMemberId,
  onSelectMember, 
  onUpdateMember,
  onClearSelection,
  onAddResearch,
  onUpdateResearch,
  onDeleteResearch
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for Research Editing Modal (Metadata: Title, Type, Status)
  const [isEditResearchOpen, setIsEditResearchOpen] = useState(false);
  const [editingResearchId, setEditingResearchId] = useState<string | null>(null);
  
  // State for Inline Detail Expansion (Progress & Plan)
  const [expandedResearchId, setExpandedResearchId] = useState<string | null>(null);
  const [detailForm, setDetailForm] = useState<{
    progress: number;
    deadline: string;
    description: string;
  }>({ progress: 0, deadline: '', description: '' });

  // Form State for adding/editing metadata
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<ResearchType>(ResearchType.NewResearch);
  const [formStatus, setFormStatus] = useState<ResearchStatus>(ResearchStatus.Preparing);
  const [formProgress, setFormProgress] = useState(0);

  // Derive selected member from props instead of local state
  const selectedMember = selectedMemberId ? members.find(m => m.id === selectedMemberId) || null : null;

  const handleClose = () => {
    onClearSelection();
    setIsEditResearchOpen(false);
    setExpandedResearchId(null);
  };

  const handleEditPhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Image compression utility to prevent LocalStorage quota exceeded errors
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Limit width to 300px for thumbnail use
                const MAX_WIDTH = 300; 
                const scaleSize = MAX_WIDTH / img.width;
                // If image is smaller than max width, keep original size
                const finalScale = scaleSize < 1 ? scaleSize : 1;
                
                canvas.width = img.width * finalScale;
                canvas.height = img.height * finalScale;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Compress to JPEG with 0.7 quality
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedDataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedMember) {
      try {
        const compressedBase64 = await compressImage(file);
        const updated = { ...selectedMember, photoUrl: compressedBase64 };
        onUpdateMember(updated);
      } catch (error) {
        console.error("Image processing failed", error);
        alert("이미지 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const getMemberResearch = (memberId: string) => research.filter(r => r.assignedMemberId === memberId);
  const getMemberMeetings = (memberId: string) => meetings.filter(m => m.attendeeIds.includes(memberId));

  // Helper to get Top priority research
  const getTopResearch = (memberId: string) => {
      const memberResearch = getMemberResearch(memberId);
      return memberResearch.sort((a, b) => b.progress - a.progress)[0];
  };

  // --- Inline Detail Expansion Handlers ---
  const toggleResearchExpansion = (r: ResearchRecord) => {
    if (expandedResearchId === r.id) {
        setExpandedResearchId(null);
    } else {
        setExpandedResearchId(r.id);
        // Initialize form with current values
        setDetailForm({
            progress: r.progress,
            deadline: r.deadline || '',
            description: r.description || ''
        });
    }
  };

  const handleSaveDetails = (r: ResearchRecord) => {
    const updated: ResearchRecord = {
        ...r,
        progress: detailForm.progress,
        deadline: detailForm.deadline,
        description: detailForm.description
    };
    onUpdateResearch(updated);
    alert("진행 상황이 저장되었습니다."); 
  };

  // --- Modal Research Edit Handlers ---
  const openResearchEditor = () => {
    setIsEditResearchOpen(true);
    setEditingResearchId(null); // Default to add mode
    resetForm();
  };

  const resetForm = () => {
    setFormTitle('');
    setFormType(ResearchType.NewResearch);
    setFormStatus(ResearchStatus.Preparing);
    setFormProgress(0);
  };

  const handleStartEditResearch = (r: ResearchRecord) => {
    setEditingResearchId(r.id);
    setFormTitle(r.title);
    setFormType(r.type);
    setFormStatus(r.status);
    setFormProgress(r.progress);
    setIsEditResearchOpen(true);
  };

  const handleSaveResearch = () => {
    if (!selectedMember) return;
    
    if (editingResearchId) {
      // Update existing
      const updated: ResearchRecord = {
        id: editingResearchId,
        assignedMemberId: selectedMember.id,
        title: formTitle,
        type: formType,
        status: formStatus,
        progress: formProgress,
        // Preserve other fields
        deadline: research.find(r => r.id === editingResearchId)?.deadline,
        description: research.find(r => r.id === editingResearchId)?.description,
      };
      onUpdateResearch(updated);
    } else {
      // Add new
      const newRecord: ResearchRecord = {
        id: `r${Date.now()}`,
        assignedMemberId: selectedMember.id,
        title: formTitle,
        type: formType,
        status: formStatus,
        progress: formProgress,
      };
      onAddResearch(newRecord);
    }
    setIsEditResearchOpen(false);
  };

  if (!selectedMember) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => {
          const topResearch = getTopResearch(member.id);
          return (
            <div 
              key={member.id} 
              onClick={() => onSelectMember(member.id)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex items-start space-x-4">
                 <div className="w-16 h-16 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Camera size={24} />
                      </div>
                    )}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 truncate">{member.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>
                    
                    {topResearch && (
                      <div className="mt-3 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Activity size={14} className="text-indigo-500" />
                          <span className="truncate font-medium">{topResearch.title}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${getProgressColor(topResearch.progress)}`} 
                            style={{ width: `${topResearch.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Helper for rendering research cards
  const memberResearch = getMemberResearch(selectedMember.id);
  const memberMeetings = getMemberMeetings(selectedMember.id);

  return (
    <div className="space-y-6">
      {/* Header / Back Button */}
      <button 
        onClick={handleClose}
        className="flex items-center text-slate-500 hover:text-slate-800 transition-colors"
      >
        <X size={20} className="mr-1" /> Back to Directory
      </button>

      {/* Member Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-md relative group">
              {selectedMember.photoUrl ? (
                <img src={selectedMember.photoUrl} alt={selectedMember.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Camera size={48} />
                </div>
              )}
              <div 
                 onClick={handleEditPhotoClick}
                 className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Edit2 className="text-white" size={24} />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{selectedMember.name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                   <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(selectedMember.role)}`}>
                     {selectedMember.role}
                   </span>
                   <span className="px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-600 border border-slate-200">
                     {selectedMember.status}
                   </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                   <label className="text-slate-500 block mb-1">Email</label>
                   <div className="font-medium text-slate-900">{selectedMember.email}</div>
                </div>
                <div>
                   <label className="text-slate-500 block mb-1">Admission Date</label>
                   <div className="font-medium text-slate-900">{selectedMember.admissionDate}</div>
                </div>
                <div>
                   <label className="text-slate-500 block mb-1">Expected Graduation</label>
                   <div className="font-medium text-slate-900">{selectedMember.expectedGraduation}</div>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Research Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="text-blue-500" /> Research Projects
            </h2>
            <Button onClick={openResearchEditor} variant="primary" size="sm">
                <Plus size={16} className="mr-1" /> New Research
            </Button>
        </div>

        <div className="space-y-3">
            {memberResearch.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-lg text-slate-500">
                    No research records found.
                </div>
            )}
            {memberResearch.map(r => (
                <div key={r.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => toggleResearchExpansion(r)}
                    >
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-slate-900 truncate">{r.title}</h3>
                                <span className={`flex-shrink-0 px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(r.status)}`}>
                                    {r.status}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                                <span>{r.type}</span>
                                {r.deadline && (
                                    <span className="flex items-center gap-1 text-orange-600 font-medium">
                                        <Calendar size={12} /> {r.deadline}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-24 md:w-32 bg-slate-100 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full ${getProgressColor(r.progress)}`} 
                                    style={{ width: `${r.progress}%` }}
                                />
                            </div>
                            <div className="text-sm font-bold w-9 text-right">{r.progress}%</div>
                            {expandedResearchId === r.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </div>
                    </div>

                    {/* Expanded Inline Detail Editor */}
                    {expandedResearchId === r.id && (
                        <div className="border-t border-slate-100 bg-slate-50 p-4 animate-in slide-in-from-top-2 duration-200">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Progress (%)</label>
                                    <input 
                                        type="range" 
                                        min="0" max="100" 
                                        value={detailForm.progress}
                                        onChange={(e) => setDetailForm({...detailForm, progress: parseInt(e.target.value)})}
                                        className="w-full accent-blue-600"
                                    />
                                    <div className="text-right text-xs text-slate-500 mt-1">{detailForm.progress}%</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Deadline</label>
                                    <input 
                                        type="date" 
                                        value={detailForm.deadline}
                                        onChange={(e) => setDetailForm({...detailForm, deadline: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                                    />
                                </div>
                             </div>
                             <div className="mb-4">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Description / Notes</label>
                                <textarea 
                                    value={detailForm.description}
                                    onChange={(e) => setDetailForm({...detailForm, description: e.target.value})}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                                    placeholder="Add research details..."
                                />
                             </div>
                             <div className="flex justify-end gap-2">
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleStartEditResearch(r)}
                                >
                                    <Edit2 size={14} className="mr-1" /> Edit Meta
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="danger"
                                    onClick={() => {
                                        if(window.confirm('Are you sure you want to delete this research?')) {
                                            onDeleteResearch(r.id);
                                        }
                                    }}
                                >
                                    <Trash2 size={14} className="mr-1" /> Delete
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="primary"
                                    onClick={() => handleSaveDetails(r)}
                                >
                                    <Save size={14} className="mr-1" /> Save Details
                                </Button>
                             </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

       {/* Edit Research Modal */}
       {isEditResearchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                    {editingResearchId ? 'Edit Research Metadata' : 'New Research'}
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input 
                            type="text" 
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                            placeholder="Research Title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select 
                            value={formType}
                            onChange={(e) => setFormType(e.target.value as ResearchType)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        >
                            {Object.values(ResearchType).map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select 
                            value={formStatus}
                            onChange={(e) => setFormStatus(e.target.value as ResearchStatus)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        >
                            {Object.values(ResearchStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    
                    {!editingResearchId && (
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Initial Progress</label>
                            <input 
                                type="range" 
                                min="0" max="100" 
                                value={formProgress}
                                onChange={(e) => setFormProgress(parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="text-right text-xs text-slate-500">{formProgress}%</div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button 
                        onClick={() => setIsEditResearchOpen(false)}
                        className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-md text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveResearch}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        {editingResearchId ? 'Save Changes' : 'Create Research'}
                    </button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default MemberDirectory;
