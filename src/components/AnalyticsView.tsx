import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  User,
  Users,
  Clock,
  ArrowRight,
  LayoutGrid,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Filter,
  Check,
  X,
  Maximize2,
  Minimize2,
  ChevronDown,
  BookOpen,
  Home, 
  Palette, 
  Monitor, 
  Puzzle, 
  Music, 
  Utensils, 
  Hammer, 
  Backpack, 
  Gamepad2, 
  Brush, 
  Blocks, 
  Car, 
  Baby, 
  Theater, 
  ShoppingCart, 
  TreePine, 
  Heart, 
  Star, 
  Sun, 
  Moon, 
  Cloud, 
  Ghost, 
  Rocket, 
  Plane, 
  TrainFront, 
  Bike, 
  Dog, 
  Cat, 
  Fish, 
  Bird, 
  Apple, 
  Cherry, 
  Pizza, 
  FlaskConical, 
  Microscope
} from 'lucide-react';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfToday,
  isYesterday
} from 'date-fns';
import { nl } from 'date-fns/locale';
import * as d3 from 'd3';

interface InteractionRecord {
  timestamp: number;
  duration: number;
  students: string[];
  cornerId: string;
  cornerName: string;
  cornerIcon: string | null;
  cornerImage: string | null;
  _others?: string[];
}

interface Student {
  id: string;
  name: string;
  avatarColor: string;
  icon?: string;
  image?: string | null;
}

interface Corner {
  id: string;
  name: string;
  color: string;
  capacity: number;
  icon: string | null;
  image: string | null;
}

const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}u ${minutes}min`;
  }
  if (minutes > 0) {
    return `${minutes}min`;
  }
  return `${seconds}sec`;
};

const formatLogDate = (timestamp: number) => {
  const date = new Date(timestamp);
  if (isSameDay(date, new Date())) {
    return format(date, 'HH:mm:ss', { locale: nl });
  }
  if (isYesterday(date)) {
    return 'Gisteren';
  }
  return format(date, 'd/MM (d MMMM)', { locale: nl });
};

interface AnalyticsViewProps {
  history: InteractionRecord[];
  students: Student[];
  corners: Corner[];
  activeAssignments?: Record<string, string[]>;
  assignmentTimestamps?: Record<string, number>;
  evaluations?: any[];
  customEvaluationTypes?: any[];
  evaluationType?: string;
  moetjes?: any[];
  moetjeEvaluations?: any[];
  moetjeHistory?: Record<string, { name: string, icon: string | null, image: string | null }>;
  allCustomImages?: string[];
}

export default function AnalyticsView({ 
  history, 
  students, 
  corners, 
  activeAssignments = {}, 
  assignmentTimestamps = {},
  evaluations = [],
  customEvaluationTypes = [],
  evaluationType = 'standard',
  moetjes = [],
  moetjeEvaluations = [],
  moetjeHistory = {},
  allCustomImages = []
}: AnalyticsViewProps) {
  const [viewType, setViewType] = useState<'class' | 'individual'>('class');
  const [classViewMode, setClassViewMode] = useState<'sociogram' | 'corners' | 'logbook'>('sociogram');
  const [logFilter, setLogFilter] = useState<'all' | 'corners' | 'moetjes'>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [classFilterStudentIds, setClassFilterStudentIds] = useState<string[]>([]);
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [hiddenStudentIds, setHiddenStudentIds] = useState<Set<string>>(new Set());
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [isFullscreenSociogram, setIsFullscreenSociogram] = useState(false);

  // Update "now" every 10 seconds to keep percentages fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfDay(new Date()),
    end: endOfDay(new Date())
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const augmentedHistory = useMemo(() => {
    const activeRecords: InteractionRecord[] = [];
    
    Object.entries(activeAssignments).forEach(([cornerId, studentIds]) => {
      if (studentIds.length === 0) return;
      
      const corner = corners.find(c => c.id === cornerId);
      if (!corner) return;

      studentIds.forEach(studentId => {
        const startTime = Number(assignmentTimestamps[studentId]);
        if (startTime && !isNaN(startTime)) {
          activeRecords.push({
            timestamp: startTime,
            duration: Math.max(0, now - startTime),
            students: [studentId],
            cornerId,
            cornerName: corner.name,
            cornerIcon: corner.icon,
            cornerImage: corner.image,
            _others: studentIds.filter(id => id !== studentId)
          });
        }
      });
    });

    return [...history, ...activeRecords].filter(r => !isNaN(Number(r.duration)));
  }, [history, activeAssignments, assignmentTimestamps, corners, now]);

  const filteredHistory = useMemo(() => {
    return augmentedHistory.filter(record => {
      const date = new Date(record.timestamp);
      const inRange = isWithinInterval(date, {
        start: dateRange.start,
        end: dateRange.end
      });
      if (!inRange) return false;
      
      if (viewType === 'class' && classFilterStudentIds.length > 0) {
        return record.students.some(id => classFilterStudentIds.includes(id));
      }
      
      return true;
    });
  }, [augmentedHistory, dateRange, viewType, classFilterStudentIds]);

  const interactionMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    
    // Initialize
    students.forEach(s1 => {
      matrix[s1.id] = {};
      students.forEach(s2 => {
        if (s1.id !== s2.id) matrix[s1.id][s2.id] = 0;
      });
    });

    // Fill based on duration
    filteredHistory.forEach(record => {
      const duration = Number(record.duration);
      if (isNaN(duration) || duration < 30000) return; // Skip sessions < 30s for analytics
      
      // Use the first student as the primary subject of the record to avoid double counting
      const primaryId = record.students[0];
      const others = [...record.students.slice(1), ...(record._others || [])];

      if (matrix[primaryId]) {
        others.forEach(otherId => {
          if (matrix[primaryId][otherId] !== undefined) {
            matrix[primaryId][otherId] += duration;
          }
        });
      }
    });

    return matrix;
  }, [filteredHistory, students]);

  const totalTimePlayed = useMemo(() => {
    const totals: Record<string, number> = {};
    students.forEach(s => totals[s.id] = 0);

    filteredHistory.forEach(record => {
      const duration = Number(record.duration);
      if (isNaN(duration) || duration < 30000) return; // Skip sessions < 30s for analytics
      
      // Only count the duration for the primary student in the record to avoid double counting
      const primaryId = record.students[0];
      if (totals[primaryId] !== undefined) {
        totals[primaryId] += duration;
      }
    });
    return totals;
  }, [filteredHistory, students]);

  const setRange = (type: 'day' | 'week' | 'month' | 'schoolyear') => {
    const now = new Date();
    if (type === 'day') {
      setDateRange({ start: startOfDay(now), end: endOfDay(now) });
    } else if (type === 'week') {
      setDateRange({ start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
    } else if (type === 'month') {
      setDateRange({ start: startOfMonth(now), end: endOfMonth(now) });
    } else if (type === 'schoolyear') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const startYear = month < 8 ? year - 1 : year;
      setDateRange({ 
        start: startOfDay(new Date(startYear, 8, 1)), 
        end: endOfDay(new Date(startYear + 1, 7, 31)) 
      });
    }
  };

  return (
    <div className="flex flex-col gap-1 h-full">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-1.5 rounded-xl border-2 border-gray-100">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setViewType('class')}
            className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${viewType === 'class' ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Klasoverzicht
          </button>
          <button 
            onClick={() => setViewType('individual')}
            className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${viewType === 'individual' ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
          >
            Individueel
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white rounded-xl border-2 border-gray-100 p-1">
            <button onClick={() => setRange('day')} className="px-3 py-1 text-[10px] font-black hover:bg-gray-50 rounded-lg transition-colors">Dag</button>
            <button onClick={() => setRange('week')} className="px-3 py-1 text-[10px] font-black hover:bg-gray-50 rounded-lg transition-colors border-x-2 border-gray-50">Week</button>
            <button onClick={() => setRange('month')} className="px-3 py-1 text-[10px] font-black hover:bg-gray-50 rounded-lg transition-colors border-r-2 border-gray-50">Maand</button>
            <button onClick={() => setRange('schoolyear')} className="px-3 py-1 text-[10px] font-black hover:bg-gray-50 rounded-lg transition-colors">Schooljaar</button>
          </div>
          
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-100 rounded-xl hover:border-blue-200 transition-all text-xs font-black text-gray-700 relative"
          >
            <CalendarIcon size={14} className="text-blue-500" />
            <span>{format(dateRange.start, 'd MMM', { locale: nl })} - {format(dateRange.end, 'd MMM', { locale: nl })}</span>
            
            {showCalendar && (
              <div 
                className="absolute top-full right-0 mt-2 z-[60] bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-4 w-72"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16}/></button>
                  <span className="font-black text-sm uppercase tracking-widest">{format(calendarMonth, 'MMMM yyyy', { locale: nl })}</span>
                  <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronRight size={16}/></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(d => (
                    <div key={d} className="text-[8px] font-black text-gray-400 text-center">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const start = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 });
                    const end = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 });
                    const days = eachDayOfInterval({ start, end });
                    
                    return days.map(day => {
                      const isSelected = isWithinInterval(day, { start: startOfDay(dateRange.start), end: endOfDay(dateRange.end) });
                      const isStart = isSameDay(day, dateRange.start);
                      const isEnd = isSameDay(day, dateRange.end);
                      const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => {
                            if (isSameDay(dateRange.start, dateRange.end)) {
                              if (day < dateRange.start) {
                                setDateRange({ start: startOfDay(day), end: endOfDay(dateRange.start) });
                              } else {
                                setDateRange({ start: startOfDay(dateRange.start), end: endOfDay(day) });
                              }
                            } else {
                              setDateRange({ start: startOfDay(day), end: endOfDay(day) });
                            }
                          }}
                          className={`
                            aspect-square text-[10px] font-black rounded-lg transition-all flex items-center justify-center
                            ${!isCurrentMonth ? 'text-gray-200' : 'text-gray-700'}
                            ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-blue-50'}
                            ${isStart || isEnd ? 'ring-2 ring-blue-200' : ''}
                          `}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </button>

          {viewType === 'class' && (
            <div className="relative">
              <button 
                onClick={() => setShowClassFilter(!showClassFilter)}
                className={`flex items-center gap-2 px-4 py-2 bg-white border-2 rounded-xl transition-all text-xs font-black ${classFilterStudentIds.length > 0 ? 'border-blue-500 text-blue-600 shadow-lg shadow-blue-100' : 'border-gray-100 text-gray-700 hover:border-blue-200'}`}
              >
                <Filter size={14} className={classFilterStudentIds.length > 0 ? 'text-blue-500' : 'text-gray-400'} />
                <span>{classFilterStudentIds.length === 0 ? 'Alle Kleuters' : `${classFilterStudentIds.length} Kleuters`}</span>
                <ChevronDown size={14} className={`transition-transform ${showClassFilter ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showClassFilter && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 z-[60] bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-4 w-64"
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter Kleuters</span>
                      <button 
                        onClick={() => setClassFilterStudentIds([])}
                        className="text-[8px] font-black text-blue-500 hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                      {[...students].sort((a, b) => a.name.localeCompare(b.name)).map((student, sidx) => {
                        const isSelected = classFilterStudentIds.includes(student.id);
                        return (
                          <button
                            key={`class-filter-${student.id}-${sidx}`}
                            onClick={() => {
                              if (isSelected) {
                                setClassFilterStudentIds(classFilterStudentIds.filter(id => id !== student.id));
                              } else {
                                setClassFilterStudentIds([...classFilterStudentIds, student.id]);
                              }
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl transition-all ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-600'}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full ${student.avatarColor} flex items-center justify-center text-[8px] font-black text-white overflow-hidden`}>
                                {student.image ? (
                                  <img src={student.image} alt="" className="w-full h-full object-cover" />
                                ) : student.name[0]}
                              </div>
                              <span className="text-[10px] font-bold">{student.name}</span>
                            </div>
                            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200'}`}>
                              {isSelected && <Check size={10} strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="relative">
            <button 
              onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
              className={`p-2 rounded-xl border-2 transition-all ${hiddenStudentIds.size > 0 ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-200' : 'bg-white border-gray-100 text-gray-400 hover:border-orange-200 hover:text-orange-500'}`}
              title="Privacy instellingen (namen verbergen)"
            >
              {hiddenStudentIds.size > 0 ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>

            <AnimatePresence>
              {showPrivacyMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute top-full right-0 mt-2 z-[70] bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-4 w-64 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between px-2">
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Privacy Selectie</h5>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setHiddenStudentIds(new Set(students.map(s => s.id)))}
                        className="text-[8px] font-black text-blue-500 hover:underline"
                      >
                        Alles
                      </button>
                      <button 
                        onClick={() => setHiddenStudentIds(new Set())}
                        className="text-[8px] font-black text-gray-400 hover:underline"
                      >
                        Geen
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                    {[...students].sort((a, b) => a.name.localeCompare(b.name)).map((student, sidx) => {
                      const isHidden = hiddenStudentIds.has(student.id);
                      return (
                        <button
                          key={`${student.id}-${sidx}`}
                          onClick={() => {
                            const next = new Set(hiddenStudentIds);
                            if (isHidden) next.delete(student.id);
                            else next.add(student.id);
                            setHiddenStudentIds(next);
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl transition-all ${isHidden ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full ${student.avatarColor} flex items-center justify-center text-[8px] font-black text-white overflow-hidden`}>
                              {student.image ? (
                                <img src={student.image} alt="" className="w-full h-full object-cover" />
                              ) : student.name[0]}
                            </div>
                            <span className="text-[10px] font-bold">{student.name}</span>
                          </div>
                          <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${isHidden ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200'}`}>
                            {isHidden && <EyeOff size={10} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  <button 
                    onClick={() => setShowPrivacyMenu(false)}
                    className="w-full py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                  >
                    Sluiten
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex gap-1 overflow-hidden">
        {viewType === 'individual' && (
          <div className="w-36 bg-gray-50 rounded-xl border-2 border-gray-100 p-1 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar">
            {[...students].sort((a, b) => a.name.localeCompare(b.name)).map((student, idx) => (
              <button
                key={`student-list-${student.id}-${idx}`}
                onClick={() => setSelectedStudentId(student.id)}
                className={`flex items-center gap-2 p-1 rounded-xl transition-all ${selectedStudentId === student.id ? 'bg-white shadow-md border-2 border-blue-100' : 'hover:bg-white/50 border-2 border-transparent'}`}
              >
                <div className={`w-5 h-5 rounded-full ${student.avatarColor} flex items-center justify-center text-[9px] font-black text-white shrink-0 overflow-hidden shadow-sm`}>
                  {student.image ? (
                    <img src={student.image} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : student.icon && ICON_MAP[student.icon] ? (
                    (() => {
                      const Icon = ICON_MAP[student.icon!];
                      return <Icon size={12} strokeWidth={3} />;
                    })()
                  ) : (
                    student.name[0]
                  )}
                </div>
                <span className="text-[10px] font-black text-gray-700 truncate">
                  {hiddenStudentIds.has(student.id) ? 'Leerling' : student.name}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 bg-white rounded-[2rem] border-2 border-gray-100 p-2 flex flex-col overflow-hidden relative">
          {viewType === 'class' && (
            <div className="flex justify-center mb-1.5">
              <div className="relative flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 w-[304px]">
                <motion.div 
                  className="absolute top-0.5 bottom-0.5 bg-white rounded-xl shadow-md z-0"
                  initial={false}
                  animate={{ 
                    left: classViewMode === 'sociogram' ? '2px' : classViewMode === 'corners' ? '102px' : '202px',
                    width: '100px'
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
                <button 
                  onClick={() => setClassViewMode('sociogram')}
                  className={`relative z-10 w-[100px] py-1 text-[9px] font-black transition-colors flex items-center justify-center gap-2 ${classViewMode === 'sociogram' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Users size={12} />
                  SOCIOGRAM
                </button>
                <button 
                  onClick={() => setClassViewMode('corners')}
                  className={`relative z-10 w-[100px] py-1 text-[9px] font-black transition-colors flex items-center justify-center gap-2 ${classViewMode === 'corners' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid size={12} />
                  HOEK
                </button>
                <button 
                  onClick={() => setClassViewMode('logbook')}
                  className={`relative z-10 w-[100px] py-1 text-[9px] font-black transition-colors flex items-center justify-center gap-2 ${classViewMode === 'logbook' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <BookOpen size={12} />
                  LOGBOEK
                </button>
              </div>
            </div>
          )}

          {viewType === 'class' ? (
            classViewMode === 'sociogram' ? (
              <div className="flex-1 flex flex-col min-h-0 relative">
                <button 
                  onClick={() => setIsFullscreenSociogram(true)}
                  className="absolute top-2 right-2 z-40 p-2 bg-white/80 backdrop-blur shadow-sm rounded-xl border border-gray-100 text-gray-400 hover:text-blue-500 hover:scale-110 transition-all"
                  title="Groot scherm"
                >
                  <Maximize2 size={16} strokeWidth={3} />
                </button>
                <SociogramTable 
                  matrix={interactionMatrix} 
                  students={students} 
                  totalTimePlayed={totalTimePlayed}
                  hiddenStudentIds={hiddenStudentIds}
                />
              </div>
            ) : classViewMode === 'corners' ? (
              <ClassCornerStats 
                history={filteredHistory}
                corners={corners}
                students={students}
              />
            ) : (
              <ClassLogbook 
                history={filteredHistory}
                students={students}
                evaluations={evaluations}
                customEvaluationTypes={customEvaluationTypes}
                evaluationType={evaluationType}
                hiddenStudentIds={hiddenStudentIds}
                moetjes={moetjes}
                moetjeEvaluations={moetjeEvaluations}
                moetjeHistory={moetjeHistory}
                allCustomImages={allCustomImages}
                logFilter={logFilter}
                setLogFilter={setLogFilter}
              />
            )
          ) : selectedStudentId ? (
            <IndividualStats 
              studentId={selectedStudentId}
              matrix={interactionMatrix}
              students={students}
              history={filteredHistory}
              corners={corners}
              totalTimePlayed={totalTimePlayed}
              hiddenStudentIds={hiddenStudentIds}
              evaluations={evaluations}
              customEvaluationTypes={customEvaluationTypes}
              evaluationType={evaluationType}
              moetjes={moetjes}
              moetjeEvaluations={moetjeEvaluations}
              moetjeHistory={moetjeHistory}
              allCustomImages={allCustomImages}
              logFilter={logFilter}
              setLogFilter={setLogFilter}
              setIsFullscreenSociogram={setIsFullscreenSociogram}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4">
              <User size={64} strokeWidth={1} />
              <p className="font-black uppercase tracking-widest text-sm">Selecteer een leerling</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isFullscreenSociogram && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-[100] bg-white rounded-[1.5rem] border-2 border-blue-100 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3 text-blue-600">
                <Users size={20} strokeWidth={3} />
                <h3 className="font-black uppercase tracking-widest text-sm">Volledig Sociogram</h3>
              </div>
              <button 
                onClick={() => setIsFullscreenSociogram(false)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-500"
              >
                <Minimize2 size={20} strokeWidth={3} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col p-2">
              <SociogramTable 
                matrix={interactionMatrix} 
                students={students} 
                totalTimePlayed={totalTimePlayed}
                hiddenStudentIds={hiddenStudentIds}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SociogramTable({ 
  matrix, 
  students, 
  totalTimePlayed,
  filterStudentId,
  hiddenStudentIds = new Set()
}: { 
  matrix: Record<string, Record<string, number>>, 
  students: Student[],
  totalTimePlayed: Record<string, number>,
  filterStudentId?: string,
  hiddenStudentIds?: Set<string>
}) {
  const [hoveredCell, setHoveredCell] = useState<{
    s1Name: string;
    s2Name: string;
    percentage: number;
    timeTogether: number;
    x: number;
    y: number;
  } | null>(null);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const rowsToRender = useMemo(() => {
    if (filterStudentId) {
      return sortedStudents.filter(s => s.id === filterStudentId);
    }
    return sortedStudents;
  }, [sortedStudents, filterStudentId]);

  return (
    <div className="flex-1 overflow-auto custom-scrollbar relative bg-white">
      {/* Top mask to hide content scrolling above the sticky header */}
      <div className="sticky top-0 left-0 right-0 h-2 bg-white z-[35]" aria-hidden="true" />
      
      <div className="px-2 pb-2">
        <table className="w-full border-separate border-spacing-x-1 border-spacing-y-1">
          <thead className="sticky top-2 z-30">
            {/* Background shield for the header to prevent content peeking through gaps */}
            <tr className="absolute inset-0 bg-white -z-10" aria-hidden="true" />
            <tr>
              <th className="p-1.5 bg-gray-50 sticky left-0 z-40 min-w-[60px] border-2 border-gray-100 rounded-xl"></th>
              {sortedStudents.map((s, idx) => (
                <th key={`socio-header-col-${s.id}-${idx}`} className="p-0 bg-gray-50 min-w-[30px] h-[50px] relative border-t-2 border-x-2 border-gray-100 rounded-t-xl">
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 origin-bottom">
                  <span className="text-[7px] font-black text-gray-500 uppercase whitespace-nowrap [writing-mode:vertical-lr] rotate-180 leading-none">
                    {hiddenStudentIds.has(s.id) ? 'Leerling' : s.name}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${s.avatarColor} flex items-center justify-center text-[5px] font-black text-white shrink-0 overflow-hidden shadow-sm`}>
                    {s.image ? (
                      <img src={s.image} alt={s.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : s.icon && ICON_MAP[s.icon] ? (
                      (() => {
                        const Icon = ICON_MAP[s.icon!];
                        return <Icon size={8} strokeWidth={3} />;
                      })()
                    ) : (
                      s.name[0]
                    )}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowsToRender.map((s1, idx1) => (
            <tr key={`sociogram-row-group-${s1.id}-${idx1}`} className="group">
              <td className="p-1.5 bg-gray-50 sticky left-0 z-10 font-black text-[8px] text-gray-700 whitespace-nowrap rounded-l-xl border-2 border-gray-100 group-hover:bg-green-50 group-hover:border-green-200 group-hover:text-green-800 transition-all">
                {hiddenStudentIds.has(s1.id) ? 'Leerling' : s1.name}
              </td>
              {sortedStudents.map((s2, idx2) => {
                if (s1.id === s2.id) {
                  return <td key={`socio-cell-self-check-${s2.id}-${idx2}`} className="p-1 border border-gray-100 bg-gray-100/50"></td>;
                }
                
                const timeTogether = (matrix[s1.id]?.[s2.id] || 0) + (matrix[s2.id]?.[s1.id] || 0);
                const totalTime = totalTimePlayed[s1.id] || 0;
                const rawPercentage = totalTime > 0 ? (timeTogether / totalTime) * 100 : 0;
                
                // Scale so that 83% becomes 100%
                const scaledPercentage = Math.min(100, (rawPercentage / 83) * 100);
                const percentage = Math.round(scaledPercentage);
                
                // Calculate gradual opacity and color
                let opacity = 0;
                let color = '34, 197, 94'; // Default vibrant green
                
                if (scaledPercentage > 0) {
                  // Gradual opacity from almost 0 to 1.0
                  const ratio = scaledPercentage / 100;
                  opacity = Math.max(0.05, ratio);
                  
                  // Use a curve for color to keep the green hue longer before turning dark
                  const colorRatio = Math.pow(ratio, 1.2);
                  
                  // Gradual color interpolation from a more vivid green (22, 210, 60) to black-green (2, 30, 10)
                  const r = Math.round(22 + (2 - 22) * colorRatio);
                  const g = Math.round(210 + (30 - 210) * colorRatio);
                  const b = Math.round(60 + (10 - 60) * colorRatio);
                  color = `${r}, ${g}, ${b}`;
                }
 
                const bgColor = scaledPercentage > 0 ? `rgba(${color}, ${opacity})` : 'transparent';
                
                return (
                  <td 
                    key={`sociogram-interaction-cell-${s1.id}-${s2.id}-${idx2}`} 
                    className="p-0 border-none min-w-[28px] h-[32px] transition-all cursor-crosshair"
                    onMouseMove={(e) => {
                      setHoveredCell({
                        s1Name: hiddenStudentIds.has(s1.id) ? 'Leerling' : s1.name,
                        s2Name: hiddenStudentIds.has(s2.id) ? 'Leerling' : s2.name,
                        percentage,
                        timeTogether,
                        x: e.clientX,
                        y: e.clientY
                      });
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div 
                      className="w-full h-full rounded-lg flex flex-col items-center justify-end pb-1 transition-all group-hover:ring-2 group-hover:ring-green-400"
                      style={{ backgroundColor: bgColor }}
                    >
                      {percentage > 0 && (
                        <div className="bg-black/60 text-white text-[6.5px] px-1 py-0.5 rounded-md font-black leading-none mb-0.5">
                          {percentage}%
                        </div>
                      )}
                      {percentage === 0 && (
                        <div className="bg-gray-100 text-gray-400 text-[6.5px] px-1 py-0.5 rounded-md font-black leading-none mb-0.5">
                          0%
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

      {/* Custom Fast Tooltip */}
      <AnimatePresence>
        {hoveredCell && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.05 }}
            className="fixed z-[100] pointer-events-none bg-gray-900 text-white px-3 py-2 rounded-xl shadow-2xl border border-white/10 flex flex-col items-center gap-0.5"
            style={{ 
              left: hoveredCell.x,
              top: hoveredCell.y - 12,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[10px] font-black text-blue-400">{hoveredCell.s1Name}</span>
              <span className="text-[8px] text-gray-500">&</span>
              <span className="text-[10px] font-black text-orange-400">{hoveredCell.s2Name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black">{hoveredCell.percentage}%</span>
              <span className="text-[9px] text-gray-400">({formatDuration(hoveredCell.timeTogether)})</span>
            </div>
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45 border-r border-b border-white/10" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SmileyIcon = ({ type, size = 20, className = "", withBackground = false }: { type: string, size?: number, className?: string, withBackground?: boolean }) => {
  const getColors = () => {
    switch (type) {
      case 'happy': return { bg: 'bg-green-500', text: 'text-white', stroke: 'stroke-white' };
      case 'neutral': return { bg: 'bg-amber-500', text: 'text-white', stroke: 'stroke-white' };
      case 'sad': return { bg: 'bg-red-500', text: 'text-white', stroke: 'stroke-white' };
      default: return { bg: 'bg-gray-500', text: 'text-white', stroke: 'stroke-white' };
    }
  };

  const colors = getColors();

  return (
    <div 
      className={`rounded-full flex items-center justify-center transition-all ${withBackground ? colors.bg + ' shadow-sm' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className={`w-full h-full fill-none ${withBackground ? colors.stroke : 'stroke-current'}`} strokeWidth="8" strokeLinecap="round">
        {!withBackground && <circle cx="50" cy="50" r="45" strokeWidth="6" />}
        {type === 'happy' && (
          <g className={withBackground ? '' : 'text-green-500'}>
            <circle cx="35" cy="40" r="5" fill="currentColor" stroke="none" />
            <circle cx="65" cy="40" r="5" fill="currentColor" stroke="none" />
            <path d="M30 60 Q50 85 70 60" strokeWidth="8" />
          </g>
        )}
        {type === 'neutral' && (
          <g className={withBackground ? '' : 'text-amber-500'}>
            <circle cx="35" cy="40" r="5" fill="currentColor" stroke="none" />
            <circle cx="65" cy="40" r="5" fill="currentColor" stroke="none" />
            <line x1="30" y1="65" x2="70" y2="65" strokeWidth="8" />
          </g>
        )}
        {type === 'sad' && (
          <g className={withBackground ? '' : 'text-red-500'}>
            <circle cx="35" cy="40" r="5" fill="currentColor" stroke="none" />
            <circle cx="65" cy="40" r="5" fill="currentColor" stroke="none" />
            <path d="M30 75 Q50 50 70 75" strokeWidth="8" />
          </g>
        )}
        {type === 'extra' && (
          <circle cx="50" cy="50" r="20" fill="currentColor" />
        )}
      </svg>
    </div>
  );
};

function EvaluationDisplay({ 
  evaluation, 
  customEvaluationTypes,
  size = 32
}: { 
  evaluation: any, 
  customEvaluationTypes: any[],
  size?: number
}) {
  const evalTypeId = evaluation.evaluationTypeId || 'standard';
  const currentType = evalTypeId === 'standard' 
    ? { name: 'Standaard', options: [
        { id: 'happy', label: 'Leuk', color: 'bg-green-500', image: '', type: 'happy' },
        { id: 'neutral', label: 'Matig', color: 'bg-amber-500', image: '', type: 'neutral' },
        { id: 'sad', label: 'Niet leuk', color: 'bg-red-500', image: '', type: 'sad' }
      ]}
    : customEvaluationTypes.find(t => t.id === evalTypeId) || { name: 'Standaard', options: [
        { id: 'happy', label: 'Leuk', color: 'bg-green-500', image: '', type: 'happy' },
        { id: 'neutral', label: 'Matig', color: 'bg-amber-500', image: '', type: 'neutral' },
        { id: 'sad', label: 'Niet leuk', color: 'bg-red-500', image: '', type: 'sad' }
      ]};
  
  const options = (currentType as any).options || [];
  const option = options.find((o: any) => o.id === evaluation.rating);

  if (!option) {
    return (
      <div style={{ width: size, height: size }} className="rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
        <span className="text-[8px] font-black">?</span>
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size }} className={`rounded-full flex items-center justify-center shadow-sm overflow-hidden ${option.image ? 'bg-white' : option.color || 'bg-gray-200'}`}>
      {option.image ? (
        <img src={option.image} alt={option.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <SmileyIcon type={option.type} size={size} withBackground={true} />
      )}
    </div>
  );
}

function IndividualStats({ 
  studentId, 
  matrix, 
  students, 
  history, 
  corners, 
  totalTimePlayed, 
  hiddenStudentIds = new Set(),
  evaluations = [],
  customEvaluationTypes = [],
  evaluationType = 'standard',
  moetjes = [],
  moetjeEvaluations = [],
  moetjeHistory = {},
  allCustomImages = [],
  logFilter = 'all',
  setLogFilter = () => {},
  setIsFullscreenSociogram
}: { 
  studentId: string, 
  matrix: Record<string, Record<string, number>>, 
  students: Student[],
  history: InteractionRecord[],
  corners: Corner[],
  totalTimePlayed: Record<string, number>,
  hiddenStudentIds?: Set<string>,
  evaluations?: any[],
  customEvaluationTypes?: any[],
  evaluationType?: string,
  moetjes?: any[],
  moetjeEvaluations?: any[],
  moetjeHistory?: Record<string, { name: string, icon: string | null, image: string | null }>,
  allCustomImages?: string[],
  logFilter?: 'all' | 'corners' | 'moetjes',
  setLogFilter?: (f: 'all' | 'corners' | 'moetjes') => void,
  setIsFullscreenSociogram: (val: boolean) => void
}) {
  const [statsMode, setStatsMode] = useState<'total' | 'average'>('total');
  const [showHoekverdeling, setShowHoekverdeling] = useState(true);
  const [showSociogram, setShowSociogram] = useState(true);
  const [showLogbook, setShowLogbook] = useState(false);
  const student = students.find(s => s.id === studentId);
  if (!student) return null;

  const logs = useMemo(() => {
    // Discovery lookup for deleted moetjes that have details in some records
    const discoveredHistory: Record<string, { name: string, icon: string | null, image: string | null }> = {};
    moetjeEvaluations.forEach(e => {
      if (e.moetjeName && !discoveredHistory[e.moetjeId]) {
        discoveredHistory[e.moetjeId] = {
          name: e.moetjeName,
          icon: e.moetjeIcon || null,
          image: e.moetjeImage || null
        };
      }
    });

    // Regular corners
    const historyLogs = (logFilter === 'all' || logFilter === 'corners') ? history
      .filter(r => r.students[0] === studentId)
      .map(r => ({
        type: 'corner',
        timestamp: r.timestamp + r.duration,
        duration: r.duration,
        name: r.cornerName,
        icon: r.cornerIcon,
        image: r.cornerImage,
        cornerId: r.cornerId,
        recordTimestamp: r.timestamp,
        others: Array.from(new Set(r.students))
          .filter(id => id !== studentId)
          .map(id => students.find(s => s.id === id))
          .filter(Boolean) as Student[]
      })) : [];

    // Moetjes
    const moetjeLogs = (logFilter === 'all' || logFilter === 'moetjes') ? moetjeEvaluations
      .filter(e => e.studentId === studentId)
      .map(e => {
        const currentMoetje = moetjes.find(m => m.id === e.moetjeId);
        const historyMoetje = moetjeHistory[e.moetjeId] || discoveredHistory[e.moetjeId];
        
        return {
          type: 'moetje',
          timestamp: e.timestamp,
          duration: 0,
          name: e.moetjeName || currentMoetje?.name || historyMoetje?.name || 'Verwijderd Moetje',
          icon: e.moetjeIcon !== undefined ? e.moetjeIcon : (currentMoetje?.icon || historyMoetje?.icon || null),
          image: e.moetjeImage !== undefined ? e.moetjeImage : (currentMoetje?.image || historyMoetje?.image || null),
          moetjeId: e.moetjeId,
          evaluation: e,
          others: []
        };
      }) : [];

    return [...historyLogs, ...moetjeLogs].sort((a, b) => b.timestamp - a.timestamp);
  }, [history, studentId, moetjeEvaluations, moetjes, moetjeHistory, students, logFilter]);

  const interactions = Object.entries(matrix[studentId] || {})
    .map(([id, ms]) => ({ student: students.find(s => s.id === id), ms: Number(ms) }))
    .filter(i => i.student && i.ms > 0)
    .sort((a, b) => b.ms - a.ms);

  const cornerUsage = useMemo(() => {
    const usage: Record<string, { ms: number, sessionCount: number, name: string, icon: string | null, image: string | null }> = {};
    
    // Initialize with all current corners so they show up even with 0 minutes
    corners.forEach(c => {
      usage[c.id] = {
        ms: 0,
        sessionCount: 0,
        name: c.name,
        icon: c.icon || null,
        image: c.image || null
      };
    });

    let totalMs = 0;

    history.forEach(record => {
      if (record.students[0] === studentId) {
        const duration = Number(record.duration);
        if (!isNaN(duration) && duration >= 30000) { // Only count >= 30s for stats
          totalMs += duration;
          
          if (!usage[record.cornerId]) {
            // Handle historical corners that might have been deleted
            usage[record.cornerId] = { 
              ms: 0, 
              sessionCount: 0,
              name: record.cornerName, 
              icon: record.cornerIcon, 
              image: record.cornerImage 
            };
          }
          usage[record.cornerId].ms += duration;
          usage[record.cornerId].sessionCount += 1;
        }
      }
    });

    return Object.entries(usage)
      .map(([id, data]) => ({ 
        id, 
        ...data, 
        percentage: totalMs > 0 ? Math.round((data.ms / totalMs) * 100) : 0,
        averageMs: data.sessionCount > 0 ? data.ms / data.sessionCount : 0
      }))
      .sort((a, b) => statsMode === 'total' ? b.ms - a.ms : b.averageMs - a.averageMs);
  }, [history, studentId, corners, statsMode]);

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto custom-scrollbar pr-2">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${student.avatarColor} flex items-center justify-center text-lg font-black text-white shadow shadow-orange-100 overflow-hidden`}>
          {student.image ? (
            <img src={student.image} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : student.icon && ICON_MAP[student.icon] ? (
            (() => {
              const Icon = ICON_MAP[student.icon!];
              return <Icon size={20} strokeWidth={3} />;
            })()
          ) : (
            student.name[0]
          )}
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900">{hiddenStudentIds.has(student.id) ? 'Leerling' : student.name}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Corner Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setShowHoekverdeling(!showHoekverdeling)}
              className="flex items-center gap-2 text-orange-500 hover:text-orange-600 transition-colors group"
            >
              <div className={`p-1 rounded-lg bg-orange-50 group-hover:bg-orange-100 transition-colors`}>
                {showHoekverdeling ? <Minus size={14} /> : <Plus size={14} />}
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest leading-none">Hoekverdeling:</h4>
            </button>
            
            {/* Stats Mode Toggle */}
            <div className="relative flex items-center bg-gray-100 p-0.5 rounded-full border border-gray-200 w-[164px]">
              {/* Sliding Background */}
              <motion.div 
                className="absolute top-0.5 bottom-0.5 bg-white rounded-full shadow-sm z-0"
                initial={false}
                animate={{ 
                  left: statsMode === 'total' ? '2px' : '82px',
                  width: '80px'
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
              
              <button 
                onClick={() => setStatsMode('total')}
                className={`relative z-10 w-[80px] py-1 text-[8px] font-black transition-colors ${statsMode === 'total' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                TOTAAL
              </button>
              <button 
                onClick={() => setStatsMode('average')}
                className={`relative z-10 w-[80px] py-1 text-[8px] font-black transition-colors ${statsMode === 'average' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                GEMIDDELDE
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showHoekverdeling && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-1 overflow-hidden"
              >
              {cornerUsage.length > 0 ? cornerUsage.map((data, idx) => (
                  <div key={`corner-stat-${data.id}-${idx}`} className="flex items-start bg-gray-50 p-1.5 rounded-xl border border-transparent hover:border-orange-100 transition-all gap-2">
                    <div className={`w-7 h-7 shrink-0 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-orange-500 overflow-hidden shadow-sm`}>
                      {data.image ? (
                        <img src={data.image} alt={data.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : data.icon && ICON_MAP[data.icon] ? (() => {
                        const Icon = ICON_MAP[data.icon!];
                        return <Icon size={14} strokeWidth={3} />;
                      })() : <LayoutGrid size={14} />}
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-0.5 pt-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-gray-700 leading-none truncate max-w-[70px]">{data.name}</span>
                        <div className="flex items-center gap-1.5">
                          {statsMode === 'total' && (
                            <span className="text-[7px] font-bold text-gray-400 uppercase tracking-tighter">Tot: {formatDuration(data.ms)}</span>
                          )}
                          <span className="text-[10px] font-black text-orange-500 leading-none">
                            {statsMode === 'total' ? `${data.percentage}%` : formatDuration(data.averageMs)}
                          </span>
                        </div>
                      </div>
                      
                      {statsMode === 'total' && (
                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 transition-all duration-1000" 
                            style={{ width: `${data.percentage}%` }}
                          />
                        </div>
                      )}

                      {statsMode === 'average' && (
                        <div className="flex gap-1 overflow-hidden">
                          {Array.from({ length: Math.min(6, Math.ceil(data.averageMs / 60000)) }).map((_, i) => (
                            <div key={`analytics-avg-dot-${i}`} className="w-1 h-1 rounded-full bg-orange-400" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-[9px] font-bold text-gray-400 italic px-2">Nog geen hoekgebruik vastgelegd.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Individual Sociogram Row */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-green-600">
          <button 
            onClick={() => setShowSociogram(!showSociogram)}
            className="flex items-center gap-2 hover:text-green-700 transition-colors group"
          >
            <div className={`p-1 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors`}>
              {showSociogram ? <Minus size={14} /> : <Plus size={14} />}
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest leading-none">Individueel Sociogram (% samen):</h4>
          </button>
        </div>
        <AnimatePresence>
          {showSociogram && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border-2 border-gray-100 rounded-[1.25rem] p-1 overflow-hidden relative"
            >
              <SociogramTable 
                matrix={matrix} 
                students={students} 
                totalTimePlayed={totalTimePlayed} 
                filterStudentId={studentId}
                hiddenStudentIds={hiddenStudentIds}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logbook Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowLogbook(!showLogbook)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors group"
          >
            <div className={`p-1 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors`}>
              {showLogbook ? <Minus size={14} /> : <Plus size={14} />}
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest leading-none">Logboek</h4>
          </button>

          {showLogbook && (moetjeEvaluations?.length > 0 || moetjes?.length > 0) && (
            <div className="relative flex items-center bg-gray-100 p-0.5 rounded-full border border-gray-200 w-[140px]">
              <motion.div 
                className="absolute top-0.5 bottom-0.5 bg-white rounded-full shadow-sm z-0"
                initial={false}
                animate={{ 
                  left: logFilter === 'all' ? '2px' : logFilter === 'corners' ? '48px' : '94px',
                  width: '44px'
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
              <button 
                onClick={() => setLogFilter('all')}
                className={`relative z-10 w-[44px] py-0.5 text-[7px] font-black transition-colors ${logFilter === 'all' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                ALLES
              </button>
              <button 
                onClick={() => setLogFilter('corners')}
                className={`relative z-10 w-[44px] py-0.5 text-[7px] font-black transition-colors ${logFilter === 'corners' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                HOEKEN
              </button>
              <button 
                onClick={() => setLogFilter('moetjes')}
                className={`relative z-10 w-[44px] py-0.5 text-[7px] font-black transition-colors ${logFilter === 'moetjes' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                MOETJES
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showLogbook && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gray-50 rounded-[1.25rem] border-2 border-gray-100 overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-white/50">
                      <th className="text-left p-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Hoek</th>
                      <th className="text-center p-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Evaluatie</th>
                      <th className="text-center p-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Duur</th>
                      <th className="text-left p-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Tijdstip</th>
                      <th className="text-left p-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Samen met</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log, idx) => {
                      let evaluation = (log as any).evaluation;
                      if (log.type === 'corner') {
                        evaluation = evaluations.find(e => 
                          e.studentId === studentId && 
                          e.cornerId === log.cornerId && 
                          (e.startTime === log.recordTimestamp || Math.abs(e.timestamp - log.timestamp) < 10000)
                        );
                      }

                      const displayedOthers = log.others.slice(0, 9);

                      const isReset = log.type === 'moetje' && evaluation?.isReset;

                      return (
                        <tr 
                          key={`student-log-${log.timestamp}-${idx}-${(log as any).id || idx}`} 
                          className={`hover:bg-white/50 transition-colors ${isReset ? 'bg-red-50/50 border-l-4 border-red-500' : ''}`}
                        >
                          <td className="p-1.5">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-xl bg-white border-2 border-gray-100 flex items-center justify-center ${log.type === 'moetje' ? 'text-amber-500' : 'text-blue-500'} overflow-hidden shrink-0 relative`}>
                                  {log.image ? (
                                    <>
                                      <img src={log.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      {log.type === 'moetje' && !allCustomImages.includes(log.image) && (
                                        <div className="absolute inset-0 bg-gray-200/50 flex items-center justify-center">
                                          <X size={10} className="text-gray-400" strokeWidth={4} />
                                        </div>
                                      )}
                                    </>
                                  ) : log.icon && ICON_MAP[log.icon] ? (() => {
                                    const Icon = ICON_MAP[log.icon!];
                                    return <Icon size={14} strokeWidth={3} />;
                                  })() : (
                                    <div className="flex items-center justify-center relative w-full h-full">
                                      <LayoutGrid size={14} />
                                      {log.type === 'moetje' && (
                                        <div className="absolute inset-0 bg-gray-200/20 flex items-center justify-center">
                                          <X size={10} className="text-gray-400" strokeWidth={4} />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-gray-700 uppercase tracking-tight leading-none">{log.name}</span>
                                  {log.type === 'moetje' && <span className="text-[6px] font-black text-amber-500 uppercase tracking-widest mt-0.5">Moetje</span>}
                                </div>
                              </div>
                              {isReset && (
                                <div className="text-[7px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-lg mt-0.5 italic">
                                  {evaluation.resetMessage}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-1.5 text-center">
                            {evaluation ? (
                              <div className="flex justify-center">
                                {log.type === 'corner' ? (
                                  <EvaluationDisplay 
                                    evaluation={evaluation} 
                                    customEvaluationTypes={customEvaluationTypes} 
                                    size={18}
                                  />
                                ) : (
                                  <EvaluationDisplay 
                                    evaluation={{ 
                                      rating: evaluation.evaluationValue, 
                                      evaluationTypeId: evaluation.type 
                                    }} 
                                    customEvaluationTypes={customEvaluationTypes}
                                    size={18}
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-[9px] font-bold text-gray-300">-</span>
                            )}
                          </td>
                          <td className="p-1.5 text-center">
                            {log.type === 'corner' ? (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white rounded-lg border border-gray-100 shadow-sm">
                                <Clock size={8} className="text-blue-400" />
                                <span className="text-[9px] font-black text-gray-700">
                                  {formatDuration(log.duration)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[8px] font-black text-amber-500 uppercase">Voltooid</span>
                            )}
                          </td>
                          <td className="p-1.5 text-right">
                            <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">{formatLogDate(log.timestamp)}</span>
                          </td>
                          <td className="p-1.5">
                            <div className="flex flex-wrap gap-1">
                              {displayedOthers.map((other, oidx) => (
                                <div 
                                  key={`sociogram-other-${other.id}-${oidx}`}
                                  className={`w-5 h-5 rounded-full ${other.avatarColor} border border-white flex items-center justify-center text-[7px] font-black text-white overflow-hidden shadow-sm`}
                                  title={hiddenStudentIds.has(other.id) ? 'Leerling' : other.name}
                                >
                                  {other.image ? (
                                    <img src={other.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : other.name[0]}
                                </div>
                              ))}
                              {log.others.length > 9 && (
                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[7px] font-black text-gray-500 border border-white">
                                  +{log.others.length - 9}
                                </div>
                              )}
                              {log.others.length === 0 && log.type === 'corner' && (
                                <span className="text-[8px] font-bold text-gray-300 italic">Alleen gespeeld</span>
                              )}
                              {log.type === 'moetje' && (
                                <span className="text-[8px] font-bold text-amber-300 italic">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ClassCornerStats({ history, corners, students }: { history: InteractionRecord[], corners: Corner[], students: Student[] }) {
  const cornerUsage = useMemo(() => {
    const usage: Record<string, { ms: number, sessionCount: number, name: string, icon: string | null, image: string | null }> = {};
    const studentIds = new Set(students.map(s => s.id));
    
    corners.forEach(c => {
      usage[c.id] = {
        ms: 0,
        sessionCount: 0,
        name: c.name,
        icon: c.icon || null,
        image: c.image || null
      };
    });

    let totalMs = 0;

    history.forEach(record => {
      // Only count the record for the primary student to avoid double counting in class totals
      const primaryId = record.students[0];
      if (!studentIds.has(primaryId)) return;

      const duration = Number(record.duration);
      if (!isNaN(duration) && duration >= 30000) { // Only count >= 30s for stats
        totalMs += duration;
        
        if (!usage[record.cornerId]) {
          usage[record.cornerId] = { 
            ms: 0, 
            sessionCount: 0,
            name: record.cornerName, 
            icon: record.cornerIcon, 
            image: record.cornerImage 
          };
        }
        usage[record.cornerId].ms += duration;
        usage[record.cornerId].sessionCount += 1;
      }
    });

    return Object.entries(usage)
      .map(([id, data]) => ({ 
        id, 
        ...data, 
        percentage: totalMs > 0 ? Math.round((data.ms / totalMs) * 100) : 0
      }))
      .sort((a, b) => b.ms - a.ms);
  }, [history, corners, students]);

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto custom-scrollbar pr-2">
      <div className="flex items-center gap-2 text-orange-500 mb-1">
        <LayoutGrid size={16} />
        <h3 className="text-xs font-black uppercase tracking-widest">Hoekverdeling Volledige Klas</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {cornerUsage.map((data, idx) => (
          <div key={`class-corner-usage-stat-${data.id}-${idx}`} className="bg-gray-50 p-1.5 rounded-xl border-2 border-transparent hover:border-orange-100 transition-all flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-white border-2 border-gray-100 flex items-center justify-center text-orange-500 overflow-hidden shadow-sm">
                  {data.image ? (
                    <img src={data.image} alt={data.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : data.icon && ICON_MAP[data.icon] ? (() => {
                    const Icon = ICON_MAP[data.icon!];
                    return <Icon size={12} strokeWidth={3} />;
                  })() : <LayoutGrid size={12} />}
                </div>
                <span className="text-[8px] font-black text-gray-700 leading-none truncate max-w-[90px]">{data.name}</span>
              </div>
              <div className="bg-white px-1.5 py-0.5 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-[9px] font-black text-orange-500">{data.percentage}%</span>
              </div>
            </div>
            
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data.percentage}%` }}
                className="h-full bg-orange-500 rounded-full"
              />
            </div>
            
            <div className="flex justify-between text-[7px] font-bold text-gray-400 uppercase tracking-widest leading-none">
              <span>{formatDuration(data.ms)}</span>
              <span>{data.sessionCount} sessies</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassLogbook({ 
  history, 
  students, 
  evaluations, 
  customEvaluationTypes, 
  evaluationType,
  hiddenStudentIds,
  moetjes,
  moetjeEvaluations,
  moetjeHistory = {},
  allCustomImages = [],
  logFilter = 'all',
  setLogFilter = () => {}
}: { 
  history: InteractionRecord[], 
  students: Student[], 
  evaluations: any[], 
  customEvaluationTypes: any[], 
  evaluationType: string,
  hiddenStudentIds: Set<string>,
  moetjes: any[],
  moetjeEvaluations: any[],
  moetjeHistory?: Record<string, { name: string, icon: string | null, image: string | null }>,
  allCustomImages?: string[],
  logFilter?: 'all' | 'corners' | 'moetjes',
  setLogFilter?: (f: 'all' | 'corners' | 'moetjes') => void
}) {
  const logs = useMemo(() => {
    // Discovery lookup for deleted moetjes
    const discoveredHistory: Record<string, { name: string, icon: string | null, image: string | null }> = {};
    moetjeEvaluations.forEach(e => {
      if (e.moetjeName && !discoveredHistory[e.moetjeId]) {
        discoveredHistory[e.moetjeId] = {
          name: e.moetjeName,
          icon: e.moetjeIcon || null,
          image: e.moetjeImage || null
        };
      }
    });

    const historyLogs = (logFilter === 'all' || logFilter === 'corners') ? history.map(r => ({
      type: 'corner',
      timestamp: r.timestamp + r.duration,
      duration: r.duration,
      name: r.cornerName,
      icon: r.cornerIcon,
      image: r.cornerImage,
      cornerId: r.cornerId,
      recordTimestamp: r.timestamp,
      studentId: r.students[0]
    })) : [];

    const moetjeLogs = (logFilter === 'all' || logFilter === 'moetjes') ? moetjeEvaluations.map(e => {
      const currentMoetje = moetjes.find(m => m.id === e.moetjeId);
      const historyMoetje = moetjeHistory[e.moetjeId] || discoveredHistory[e.moetjeId];
      
      return {
        type: 'moetje',
        timestamp: e.timestamp,
        duration: 0,
        name: e.moetjeName || currentMoetje?.name || historyMoetje?.name || 'Verwijderd Moetje',
        icon: e.moetjeIcon !== undefined ? e.moetjeIcon : (currentMoetje?.icon || historyMoetje?.icon || null),
        image: e.moetjeImage !== undefined ? e.moetjeImage : (currentMoetje?.image || historyMoetje?.image || null),
        moetjeId: e.moetjeId,
        evaluation: e,
        studentId: e.studentId
      };
    }) : [];

    return [...historyLogs, ...moetjeLogs].sort((a, b) => b.timestamp - a.timestamp);
  }, [history, moetjeEvaluations, moetjes, moetjeHistory, logFilter]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {(moetjeEvaluations?.length > 0 || moetjes?.length > 0) && (
        <div className="flex justify-center mb-2.5">
          <div className="relative flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 w-[304px]">
            <motion.div 
              className="absolute top-0.5 bottom-0.5 bg-white rounded-lg shadow-sm z-0"
              initial={false}
              animate={{ 
                left: logFilter === 'all' ? '2px' : logFilter === 'corners' ? '102px' : '202px',
                width: '100px'
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
            <button 
              onClick={() => setLogFilter('all')}
              className={`relative z-10 px-2 py-1 text-[9px] font-black transition-colors w-[100px] ${logFilter === 'all' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              LOGBOEK
            </button>
            <button 
              onClick={() => setLogFilter('corners')}
              className={`relative z-10 px-2 py-1 text-[9px] font-black transition-colors w-[100px] ${logFilter === 'corners' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              HOEKEN
            </button>
            <button 
              onClick={() => setLogFilter('moetjes')}
              className={`relative z-10 px-2 py-1 text-[9px] font-black transition-colors w-[100px] ${logFilter === 'moetjes' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              MOETJES
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
      <div className="bg-gray-50 rounded-[1.25rem] border-2 border-gray-100 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-white/50">
              <th className="text-left p-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Kleuter</th>
              <th className="text-left p-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Hoek / Moetje</th>
              <th className="text-center p-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Evaluatie</th>
              <th className="text-center p-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Duur</th>
              <th className="text-left p-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Tijdstip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log, idx) => {
              const student = students.find(s => s.id === log.studentId);
              if (!student) return null;

              let evaluation = (log as any).evaluation;
              if (log.type === 'corner') {
                evaluation = evaluations.find(e => 
                  e.studentId === log.studentId && 
                  e.cornerId === log.cornerId && 
                  (e.startTime === log.recordTimestamp || Math.abs(e.timestamp - log.timestamp) < 10000)
                );
              }

              const isReset = log.type === 'moetje' && evaluation?.isReset;

              return (
                <tr 
                  key={`class-log-${log.timestamp}-${idx}-${(log as any).id || idx}`} 
                  className={`hover:bg-white/50 transition-colors ${isReset ? 'bg-red-50/50 border-l-4 border-red-500' : ''}`}
                >
                  <td className="p-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${student.avatarColor} flex items-center justify-center text-[8px] font-black text-white shrink-0 overflow-hidden shadow-sm`}>
                        {student.image ? (
                          <img src={student.image} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : student.icon && ICON_MAP[student.icon] ? (
                          (() => {
                            const Icon = ICON_MAP[student.icon!];
                            return <Icon size={10} strokeWidth={3} />;
                          })()
                        ) : (
                          student.name[0]
                        )}
                      </div>
                      <span className="text-[9px] font-black text-gray-700 truncate">
                        {hiddenStudentIds.has(student.id) ? 'Leerling' : student.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-1.5">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-xl bg-white border-2 border-gray-100 flex items-center justify-center ${log.type === 'moetje' ? 'text-amber-500' : 'text-blue-500'} overflow-hidden shrink-0 relative`}>
                          {log.image ? (
                            <>
                              <img src={log.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              {log.type === 'moetje' && !allCustomImages.includes(log.image) && (
                                <div className="absolute inset-0 bg-gray-200/50 flex items-center justify-center">
                                  <X size={10} className="text-gray-400" strokeWidth={4} />
                                </div>
                              )}
                            </>
                          ) : log.icon && ICON_MAP[log.icon] ? (() => {
                            const Icon = ICON_MAP[log.icon!];
                            return <Icon size={14} strokeWidth={3} />;
                          })() : (
                            <div className="flex items-center justify-center relative w-full h-full">
                              <LayoutGrid size={14} />
                              {log.type === 'moetje' && (
                                <div className="absolute inset-0 bg-gray-200/20 flex items-center justify-center">
                                  <X size={10} className="text-gray-400" strokeWidth={4} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-gray-700 uppercase leading-none">{log.name}</span>
                          {log.type === 'moetje' && <span className="text-[6px] font-black text-amber-500 uppercase mt-0.5">Moetje</span>}
                        </div>
                      </div>
                      {isReset && (
                        <div className="text-[7px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-lg mt-0.5 italic">
                          {evaluation.resetMessage}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-1.5 text-center">
                    {evaluation ? (
                      <div className="flex justify-center">
                        {log.type === 'corner' ? (
                          <EvaluationDisplay 
                            evaluation={evaluation} 
                            customEvaluationTypes={customEvaluationTypes} 
                            size={18}
                          />
                        ) : (
                          <EvaluationDisplay 
                            evaluation={{ 
                              rating: evaluation.evaluationValue, 
                              evaluationTypeId: evaluation.type 
                            }} 
                            customEvaluationTypes={customEvaluationTypes}
                            size={18}
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold text-gray-300">-</span>
                    )}
                  </td>
                  <td className="p-1.5 text-center">
                    {log.type === 'corner' ? (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <Clock size={8} className="text-blue-400" />
                        <span className="text-[9px] font-black text-gray-600">{formatDuration(log.duration)}</span>
                      </div>
                    ) : (
                      <span className="text-[8px] font-black text-amber-500 uppercase">Voltooid</span>
                    )}
                  </td>
                  <td className="p-1.5 text-right">
                    <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">{formatLogDate(log.timestamp)}</span>
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
}

const ICON_MAP: Record<string, any> = {
  Home, Palette, BookOpen, Monitor, Puzzle, Music, Utensils, Hammer, 
  Backpack, Gamepad2, Brush, Blocks, Car, Baby, Theater, ShoppingCart, 
  TreePine, Heart, Star, Sun, Moon, Cloud, Ghost, Rocket, Plane, 
  TrainFront, Bike, Dog, Cat, Fish, Bird, Apple, Cherry, Pizza, FlaskConical, Microscope
};
