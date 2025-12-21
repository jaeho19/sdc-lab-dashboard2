import React, { useState } from 'react';
import { CalendarEvent, Category } from '../types';
import { ChevronLeft, ChevronRight, Plus, Tag, X, Clock, Trash2, Calendar } from 'lucide-react';
import Button from './Button';

interface CalendarViewProps {
  events: CalendarEvent[];
  categories: Category[];
  onAddCategory: (name: string, color: string) => void;
  onAddEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, categories, onAddCategory, onAddEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Event State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventTime, setNewEventTime] = useState('10:00');
  const [newEventCategory, setNewEventCategory] = useState(categories[0]?.id || 'c1');
  const [newIsMajorEvent, setNewIsMajorEvent] = useState(false);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleCreateCategory = () => {
    const name = window.prompt("새 카테고리 이름:");
    if (name) {
      const colors = [
        'bg-pink-100 text-pink-800', 'bg-indigo-100 text-indigo-800',
        'bg-teal-100 text-teal-800', 'bg-orange-100 text-orange-800',
        'bg-cyan-100 text-cyan-800'
      ];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      onAddCategory(name, randomColor);
    }
  };

  const handleSaveEvent = () => {
    console.log("handleSaveEvent called");
    console.log("Title:", newEventTitle);
    console.log("Date:", newEventDate);

    if (!newEventTitle || !newEventDate) {
      console.error("Missing title or date");
      return;
    }

    const start = new Date(`${newEventDate}T${newEventTime}`);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour duration

    const newEvent: CalendarEvent = {
      id: `e${Date.now()}`,
      title: newEventTitle,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      categoryId: newEventCategory,
      participantIds: [],
      isMajorEvent: newIsMajorEvent
    };

    console.log("Creating new event object:", newEvent);

    onAddEvent(newEvent);
    console.log("onAddEvent called");

    setIsAddModalOpen(false);

    // Reset
    setNewEventTitle('');
    setNewEventTime('10:00');
    setNewIsMajorEvent(false);
  };

  const handleConfirmDelete = () => {
    if (selectedEvent) {
      onDeleteEvent(selectedEvent.id);
      setSelectedEvent(null);
      setIsDeleting(false);
    }
  };

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  const numDays = daysInMonth(currentYear, currentDate.getMonth());
  const startDay = firstDayOfMonth(currentYear, currentDate.getMonth());

  const days = [];
  // Empty slots for previous month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50/50 border-b border-r border-slate-100"></div>);
  }

  // Days of current month
  for (let day = 1; day <= numDays; day++) {
    const dateStr = new Date(currentYear, currentDate.getMonth(), day).toDateString();

    // Find events for this day
    const dayEvents = events.filter(e => {
      const eStart = new Date(e.startTime);
      const eEnd = new Date(e.endTime);

      // Normalize times to compare dates only
      const currentDayStart = new Date(currentYear, currentDate.getMonth(), day);
      const currentDayEnd = new Date(currentYear, currentDate.getMonth(), day, 23, 59, 59, 999);

      return eStart <= currentDayEnd && eEnd >= currentDayStart;
    });

    const isToday = new Date().toDateString() === dateStr;

    days.push(
      <div key={`day-${day}`} className={`h-24 md:h-32 border-b border-r border-slate-100 p-1 md:p-2 relative group hover:bg-slate-50 transition-colors ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}>
        <span className={`text-xs md:text-sm font-medium ${isToday ? 'bg-navy text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
          {day}
        </span>

        <div className="mt-1 md:mt-2 space-y-1 overflow-y-auto max-h-[60px] md:max-h-[80px] custom-scrollbar">
          {dayEvents.map(event => {
            const cat = categories.find(c => c.id === event.categoryId);
            const isMultiDay = new Date(event.startTime).toDateString() !== new Date(event.endTime).toDateString();
            const showEndDate = isMultiDay && (cat?.name === '휴가' || cat?.name === '학회' || cat?.name === '출장' || cat?.name === '답사');

            return (
              <div
                key={`${event.id}-${day}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                }}
                className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-80 ${cat?.color || 'bg-gray-100'}`}
                title={`${event.title} (${new Date(event.startTime).toLocaleDateString()} ~ ${new Date(event.endTime).toLocaleDateString()})`}
              >
                {event.title}
                {showEndDate && <span className="opacity-75 ml-1 text-[8px]">~{new Date(event.endTime).getDate()}일</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy">연구실 일정</h2>
          <p className="text-slate-500">주요 미팅 및 마감일 관리</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-white rounded-md shadow-sm border border-slate-200">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 border-r border-slate-200">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="px-4 py-2 font-bold text-navy w-32 text-center">
              {currentYear}년 {currentMonthName}
            </div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 border-l border-slate-200">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-navy hover:bg-navy-light shadow-lg shadow-navy/20">
            <Plus className="w-4 h-4 mr-1" /> 일정 추가
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, idx) => (
            <div key={d} className={`py-2 text-center text-xs font-bold uppercase tracking-wider ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 bg-slate-100 gap-px flex-1">
          {days}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-sm bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <span className="font-bold text-slate-700">카테고리:</span>
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center space-x-1">
            <span className={`w-3 h-3 rounded-full ${cat.color.split(' ')[0]}`}></span>
            <span className="text-slate-600 text-xs">{cat.name}</span>
          </div>
        ))}
        <button
          onClick={handleCreateCategory}
          className="ml-auto text-xs text-blue-600 font-medium hover:underline flex items-center bg-blue-50 px-2 py-1 rounded"
        >
          <Tag className="w-3 h-3 mr-1" />
          추가
        </button>
      </div>

      {/* Event Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-soft-grey">
              <h3 className="font-bold text-lg text-navy">새 일정 추가</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-navy p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">제목</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                  placeholder="일정 제목 입력"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">날짜</label>
                  <input
                    type="date"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">시간</label>
                  <input
                    type="time"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">카테고리</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setNewEventCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${newEventCategory === cat.id
                        ? `${cat.color} border-current ring-1 ring-offset-1`
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="majorEvent"
                  checked={newIsMajorEvent}
                  onChange={(e) => setNewIsMajorEvent(e.target.checked)}
                  className="w-4 h-4 text-navy rounded border-slate-300 focus:ring-navy"
                />
                <label htmlFor="majorEvent" className="text-sm text-slate-600 font-medium cursor-pointer">
                  주요 연구실 일정 (대시보드 노출)
                </label>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 bg-soft-grey">
              <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} size="sm">취소</Button>
              <Button onClick={handleSaveEvent} className="bg-navy hover:bg-navy-light" size="sm">저장</Button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details/Delete Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-soft-grey">
              <h3 className="font-bold text-lg text-navy flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-slate-500" />
                일정 상세
              </h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-navy p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${categories.find(c => c.id === selectedEvent.categoryId)?.color || 'bg-gray-100'}`}>
                    {categories.find(c => c.id === selectedEvent.categoryId)?.name || '기타'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(selectedEvent.startTime).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-navy mb-1">{selectedEvent.title}</h2>
                <div className="flex items-center text-slate-600 text-sm">
                  <Clock className="w-4 h-4 mr-1.5" />
                  {new Date(selectedEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  &nbsp;-&nbsp;
                  {new Date(selectedEvent.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {selectedEvent.description && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed mb-4">
                  {selectedEvent.description}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-soft-grey">
              {isDeleting ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-red-600 font-bold">정말 삭제하시겠습니까?</span>
                  <button
                    onClick={handleConfirmDelete}
                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    네
                  </button>
                  <button
                    onClick={() => setIsDeleting(false)}
                    className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-300"
                  >
                    아니오
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsDeleting(true)}
                  className="flex items-center text-red-600 hover:text-red-700 text-sm font-bold px-3 py-2 rounded hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> 삭제
                </button>
              )}
              <Button onClick={() => setSelectedEvent(null)} className="bg-navy hover:bg-navy-light shadow-lg shadow-navy/20" size="sm">확인</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;