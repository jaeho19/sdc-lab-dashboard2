import React, { useState, useRef } from 'react';
import { MeetingLog, Member, User, Comment } from '../types';
import { Search, Filter, Plus, User as UserIcon, MoreHorizontal, Heart, MessageCircle, Share2, Send, Trash2, X, Download, FileText, CheckSquare, MessageSquare, Calendar } from 'lucide-react';
import Button from './Button';

interface MeetingLogsProps {
  logs: MeetingLog[];
  members: Member[];
  onAddLog: (log: MeetingLog) => void;
  onUpdateLog: (log: MeetingLog) => void;
  currentUser: User;
}

const MeetingLogs: React.FC<MeetingLogsProps> = ({ logs, members, onAddLog, onUpdateLog, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCommentLogId, setActiveCommentLogId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // New Log State
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNextMeeting, setNewNextMeeting] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newActionItems, setNewActionItems] = useState('');
  const [newFileName, setNewFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredLogs = logs.filter(log => {
    // Use authorId if available, fallback to first attendee (backward compatibility)
    const authorId = log.authorId || log.attendeeIds[0];
    const member = members.find(m => m.id === authorId);

    const matchesSearch =
      log.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesMember = selectedMemberId === 'all' || authorId === selectedMemberId;

    return matchesSearch && matchesMember;
  });

  // Sort logs by date desc
  const sortedLogs = [...filteredLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleLike = (log: MeetingLog) => {
    const isLiked = log.likes?.includes(currentUser.id);
    let newLikes = log.likes || [];

    if (isLiked) {
      newLikes = newLikes.filter(id => id !== currentUser.id);
    } else {
      newLikes = [...newLikes, currentUser.id];
    }

    onUpdateLog({ ...log, likes: newLikes });
  };

  const handleAddComment = (log: MeetingLog) => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: `c${Date.now()}`,
      authorId: currentUser.id,
      content: commentText,
      date: new Date().toISOString() // specific format or just ISO
    };

    onUpdateLog({ ...log, comments: [...(log.comments || []), newComment] });
    setCommentText('');
    setActiveCommentLogId(null);
  };

  const handleShare = (log: MeetingLog) => {
    // Simulate share
    const url = `${window.location.origin}/logs/${log.id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFileName(file.name);
    }
  };

  const handleSave = () => {
    if (!newContent) return;

    // Determine author: if admin, they might select a student. If student, it's them.
    // For simplicity, let's assume specific logic in modal. 
    // Wait, the modal UI below needs to adapt.

    // Default to currentUser's id if role is user, or user selection if admin
    // For now, let's just use a select box for student name again but ideally 
    // if I am a student, I am the author.

    let targetAuthorId = currentUser.role === 'admin' ? members[0]?.id : currentUser.id;
    // (We will improve this in the modal)

    const newLog: MeetingLog = {
      id: `mt${Date.now()}`,
      date: newDate,
      attendeeIds: [targetAuthorId],
      content: newContent,
      actionItems: newActionItems,
      relatedResearchId: '',
      fileAttachment: newFileName || undefined,
      authorId: targetAuthorId,
      likes: [],
      comments: [],
      nextMeetingDate: newNextMeeting || undefined
    };

    onAddLog(newLog);
    setIsModalOpen(false);

    setNewContent('');
    setNewActionItems('');
    setNewFileName('');
    setNewNextMeeting('');
  };

  const getAuthor = (id: string) => {
    // Search in members first
    const member = members.find(m => m.id === id);
    if (member) return { name: member.name, photoUrl: member.photoUrl };

    // If not (e.g. admin comment), maybe define generic
    if (id.startsWith('admin')) return { name: '이재호', photoUrl: '/images/이재호.png' };

    return { name: 'Unknown', photoUrl: '' };
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-3xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-navy tracking-tight">Community Feed</h2>
          <p className="text-slate-500 text-sm mt-1">Share and discuss research progress</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center shadow-lg shadow-navy/20 hover:shadow-xl transition-shadow bg-navy rounded-full px-6">
          <Plus className="w-4 h-4 mr-2" /> New Post
        </Button>
      </div>

      {/* Stories / Highlights (Optional visual flair) */}
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm pb-4 pt-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search posts..."
            className="w-full pl-12 pr-4 py-3 bg-white border-0 shadow-sm rounded-2xl focus:ring-2 focus:ring-navy/20 outline-none text-slate-700"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-8">
        {sortedLogs.map(log => {
          const authorId = log.authorId || log.attendeeIds[0];
          const author = getAuthor(authorId);
          const isLiked = log.likes?.includes(currentUser.id);

          return (
            <div key={log.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Post Header */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white shadow-sm">
                    {author.photoUrl ? (
                      <img src={author.photoUrl} alt={author.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <UserIcon size={20} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{author.name}</h3>
                    <p className="text-xs text-slate-500">{new Date(log.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-navy p-2 rounded-full hover:bg-slate-50">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Post Content */}
              <div className="px-6 pb-4">
                {/* Feedback Section */}
                <div className="mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-[15px]">
                        {log.content}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Items Box */}
                {log.actionItems && (
                  <div className="bg-coral-bg/10 rounded-xl p-5 mb-4 border border-coral/10">
                    <h4 className="text-xs font-bold text-coral uppercase tracking-wider mb-3 flex items-center">
                      <CheckSquare size={14} className="mr-1.5" /> Next Steps
                    </h4>
                    <ul className="space-y-2">
                      {log.actionItems.split('\n').map((item, idx) => (
                        <li key={idx} className="flex items-start text-sm text-slate-700">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-coral mt-1.5 mr-2.5 flex-shrink-0"></span>
                          <span className="leading-relaxed">{item.replace(/^\d+\.\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Meeting Info */}
                {log.nextMeetingDate && (
                  <div className="flex items-center space-x-2 mb-4 text-xs font-semibold text-slate-500 bg-slate-50 p-2 rounded-lg inline-flex border border-slate-200">
                    <Calendar className="w-4 h-4 text-navy" />
                    <span>Next Meeting: {new Date(log.nextMeetingDate).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}

                {/* Next Meeting Info */}
                {log.nextMeetingDate && (
                  <div className="flex items-center space-x-2 mb-4 text-xs font-semibold text-slate-500 bg-slate-50 p-2 rounded-lg inline-flex border border-slate-200">
                    <Calendar className="w-4 h-4 text-navy" />
                    <span>Next Meeting: {new Date(log.nextMeetingDate).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}

                {/* Attachment */}
                {log.fileAttachment && (
                  <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{log.fileAttachment}</p>
                      <p className="text-xs text-slate-500">Document</p>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all">
                      <Download size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Interactions */}
              <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLike(log)}
                    className={`flex items-center space-x-2 text-sm font-medium transition-colors ${isLiked ? 'text-pink-500' : 'text-slate-500 hover:text-pink-500'}`}
                  >
                    <Heart size={22} className={isLiked ? 'fill-current' : ''} />
                    <span>{log.likes?.length || 0}</span>
                  </button>
                  <button
                    onClick={() => setActiveCommentLogId(activeCommentLogId === log.id ? null : log.id)}
                    className="flex items-center space-x-2 text-sm font-medium text-slate-500 hover:text-navy transition-colors"
                  >
                    <MessageCircle size={22} />
                    <span>{log.comments?.length || 0}</span>
                  </button>
                  <button
                    onClick={() => handleShare(log)}
                    className="text-slate-500 hover:text-navy transition-colors transform hover:-translate-y-0.5"
                  >
                    <Share2 size={22} />
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {(activeCommentLogId === log.id || (log.comments && log.comments.length > 0)) && (
                <div className="bg-slate-50/50 border-t border-slate-100 p-6 pt-4">
                  {/* List */}
                  {log.comments && log.comments.length > 0 && (
                    <div className="space-y-4 mb-6">
                      {log.comments.map(comment => {
                        const commentAuthor = getAuthor(comment.authorId);
                        return (
                          <div key={comment.id} className="flex space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                              {commentAuthor.photoUrl ? (
                                <img src={commentAuthor.photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400"><UserIcon size={12} /></div>
                              )}
                            </div>
                            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-900">{commentAuthor.name}</span>
                                <span className="text-[10px] text-slate-400">{formatDate(comment.date)}</span>
                              </div>
                              <p className="text-sm text-slate-700">{comment.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Input */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                      {currentUser.photoUrl ? (
                        <img src={currentUser.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400"><UserIcon size={12} /></div>
                      )}
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-navy/10 focus:border-navy outline-none transition-all"
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddComment(log);
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(log)}
                        disabled={!commentText.trim()}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-navy text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-navy-light transition-colors"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Write Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-soft-grey">
              <h3 className="font-bold text-lg text-navy">New Mentoring Log</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-navy transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Controls */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-navy/10 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Next Meeting (Optional)</label>
                  <input
                    type="datetime-local"
                    value={newNextMeeting}
                    onChange={e => setNewNextMeeting(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-navy/10 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Feedback / Content</label>
                <textarea
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg h-32 text-sm resize-none focus:ring-2 focus:ring-navy/10 outline-none"
                  placeholder="Share feedback or discussion points..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-coral uppercase mb-1">Next Steps (Action Items)</label>
                <textarea
                  className="w-full p-3 bg-coral-bg/10 border border-coral/20 rounded-lg h-24 text-sm resize-none focus:ring-2 focus:ring-coral/20 outline-none"
                  placeholder="List upcoming tasks..."
                  value={newActionItems}
                  onChange={e => setNewActionItems(e.target.value)}
                />
              </div>

              <div>
                <label className="cursor-pointer flex items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <div className="text-center">
                    {newFileName ? (
                      <div className="flex items-center text-navy font-medium">
                        <FileText size={16} className="mr-2" /> {newFileName}
                      </div>
                    ) : (
                      <>
                        <div className="text-slate-400 mb-1"><FileText size={20} className="mx-auto" /></div>
                        <span className="text-xs text-slate-500">Attach Document (Optional)</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-navy">Post Update</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingLogs;