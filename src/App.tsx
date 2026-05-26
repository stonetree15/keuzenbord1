import { useState, useEffect, useMemo, ReactNode, ChangeEvent, DragEvent, useRef, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear,
  endOfYear,
  isWithinInterval, 
  eachDayOfInterval,
  isSameDay,
  subDays,
  subWeeks,
  subMonths,
  addMonths,
  addDays,
  startOfToday
} from 'date-fns';
import { nl } from 'date-fns/locale';
import AnalyticsView from './components/AnalyticsView';
import { QRCodeSVG } from 'qrcode.react';
import { SyncModal } from './components/SyncModal';
import { 
  Plus, 
  Settings, 
  Users, 
  LayoutGrid, 
  Trash2, 
  X, 
  RotateCcw,
  ClipboardList,
  Home,
  Palette,
  BookOpen,
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
  Eraser,
  Save,
  UserPlus,
  Check,
  FlaskConical,
  ChevronDown,
  Microscope,
  Pencil,
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
  Hourglass,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Maximize,
  Minimize,
  Lock,
  LogOut,
  QrCode,
  MonitorSmartphone,
  Upload,
  Image,
  Dices,
  Shuffle,
  Users2,
  Sparkles,
  MapPin,
  Play,
  Settings2,
  Clock,
  ChevronUp,
  UserCheck,
  Search,
  UserX,
  Calendar,
  ArrowRight,
  Pause,
} from 'lucide-react';

import Cropper from 'react-easy-crop';
import { getCroppedImg } from './lib/imageUtils';
import { AuthProviderComponent, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { UserMenu } from './components/UserMenu';
import { CookieBanner } from './components/CookieBanner';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit,
  writeBatch,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  where,
  documentId
} from 'firebase/firestore';

// --- Types ---

interface InteractionRecord {
  id?: string;
  timestamp: number;
  duration: number; // in milliseconds
  students: string[];
  cornerId: string;
  cornerName: string;
  cornerIcon: string | null;
  cornerImage: string | null;
}

interface Student {
  id: string;
  name: string;
  avatarColor: string;
  icon?: string;
  image?: string;
}

interface Corner {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  capacity: number;
  color: string;
  fixedId?: string;
}

interface Moetje {
  id: string;
  name: string;
  icon?: string | null;
  image?: string | null;
  color: string;
  isPermanent: boolean;
  isActive: boolean;
  hasEvaluation?: boolean;
  evaluationMethod?: 'corner' | 'standard' | 'custom';
  evaluationCustomId?: string;
}

interface MoetjeEvaluation {
  id?: string;
  studentId: string;
  moetjeId: string;
  evaluationValue: string;
  timestamp: number;
  type: string; // happy, neutral, sad, etc.
  isReset?: boolean;
  resetMessage?: string;
  moetjeName?: string;
  moetjeIcon?: string | null;
  moetjeImage?: string | null;
}

// --- Constants ---

const COLORS = [
  'bg-red-600',    // Rood
  'bg-blue-500',   // Blauw
  'bg-yellow-300', // Geel
  'bg-orange-500', // Oranje
  'bg-green-500',  // Groen
  'bg-purple-500', // Paars
  'bg-amber-900',  // Bruin
  'bg-pink-400',   // Roze
  'bg-gray-400',   // Grijs
  'bg-white',      // Wit
  'bg-black'       // Zwart
];

const COLOR_CLASSES: Record<string, { border: string, text: string }> = {
  'bg-red-600': { border: 'border-red-600', text: 'text-red-600' },
  'bg-red-500': { border: 'border-red-500', text: 'text-red-500' },
  'bg-blue-500': { border: 'border-blue-500', text: 'text-blue-500' },
  'bg-yellow-300': { border: 'border-yellow-300', text: 'text-yellow-300' },
  'bg-yellow-400': { border: 'border-yellow-400', text: 'text-yellow-400' },
  'bg-orange-500': { border: 'border-orange-500', text: 'text-orange-500' },
  'bg-amber-500': { border: 'border-amber-500', text: 'text-amber-500' },
  'bg-green-500': { border: 'border-green-500', text: 'text-green-500' },
  'bg-purple-500': { border: 'border-purple-500', text: 'text-purple-500' },
  'bg-amber-900': { border: 'border-amber-900', text: 'text-amber-900' },
  'bg-pink-400': { border: 'border-pink-400', text: 'text-pink-400' },
  'bg-gray-400': { border: 'border-gray-400', text: 'text-gray-400' },
  'bg-white': { border: 'border-gray-200', text: 'text-gray-400' },
  'bg-black': { border: 'border-black', text: 'text-black' },
  'bg-red-400': { border: 'border-red-400', text: 'text-red-400' },
  'bg-blue-400': { border: 'border-blue-400', text: 'text-blue-400' },
  'bg-green-400': { border: 'border-green-400', text: 'text-green-400' },
  'bg-purple-400': { border: 'border-purple-400', text: 'text-purple-400' },
  'bg-orange-400': { border: 'border-orange-400', text: 'text-orange-400' },
  'bg-teal-400': { border: 'border-teal-400', text: 'text-teal-400' },
  'bg-indigo-400': { border: 'border-indigo-400', text: 'text-indigo-400' },
  'bg-lime-400': { border: 'border-lime-400', text: 'text-lime-400' }
};

const getBorderClass = (bg: string) => COLOR_CLASSES[bg]?.border || 'border-gray-200';
const getTextClass = (bg: string) => COLOR_CLASSES[bg]?.text || 'text-gray-500';

const ICON_MAP: Record<string, any> = {
  Home, Palette, BookOpen, Monitor, Puzzle, Music, Utensils, Hammer, 
  LayoutGrid, Backpack, Gamepad2, Brush, Blocks, Car, Baby,
  FlaskConical, Microscope, Pencil, Theater, ShoppingCart, TreePine,
  Heart, Star, Sun, Moon, Cloud, Ghost, Rocket, Plane, TrainFront,
  Bike, Dog, Cat, Fish, Bird, Apple, Cherry, Pizza
};

const CORNER_ICONS = [
  'Home', 'BookOpen', 'Palette', 'Monitor', 'Puzzle', 'Music', 
  'Utensils', 'Hammer', 'FlaskConical', 'Microscope', 'Pencil', 'Theater', 
  'ShoppingCart', 'TreePine', 'LayoutGrid'
];

const STUDENT_ICONS = [
  'Baby', 'Car', 'Gamepad2', 'Heart', 'Star', 'Sun', 'Moon', 'Cloud', 
  'Ghost', 'Rocket', 'Plane', 'TrainFront', 'Bike', 'Dog', 'Cat', 
  'Fish', 'Bird', 'Apple', 'Cherry', 'Pizza', 'Backpack', 'Brush'
];

const INITIAL_CORNERS: Corner[] = [
  { id: '1', name: 'Bouwhoek', icon: 'LayoutGrid', capacity: 4, color: 'bg-orange-400' },
  { id: '2', name: 'Huishoudhoek', icon: 'Home', capacity: 3, color: 'bg-red-400' },
  { id: '3', name: 'Leeshoek', icon: 'BookOpen', capacity: 6, color: 'bg-blue-400' },
  { id: '4', name: 'Knutselhoek', icon: 'Palette', capacity: 4, color: 'bg-pink-400' },
  { id: '5', name: 'Computer', icon: 'Monitor', capacity: 4, color: 'bg-teal-400' },
  { id: '6', name: 'Puzzelhoek', icon: 'Puzzle', capacity: 2, color: 'bg-green-400' },
];

const INITIAL_STUDENTS: Student[] = [
  { id: 's1', name: 'Liam', avatarColor: 'bg-blue-500', icon: 'Car' },
  { id: 's2', name: 'Emma', avatarColor: 'bg-pink-500', icon: 'Baby' },
  { id: 's3', name: 'Noah', avatarColor: 'bg-green-500', icon: 'Gamepad2' },
  { id: 's4', name: 'Olivia', avatarColor: 'bg-yellow-500', icon: 'Brush' },
  { id: 's5', name: 'Lucas', avatarColor: 'bg-red-500', icon: 'Gamepad2' },
  { id: 's6', name: 'Mila', avatarColor: 'bg-purple-500', icon: 'Music' },
  { id: 's7', name: 'James', avatarColor: 'bg-orange-500', icon: 'Hammer' },
  { id: 's8', name: 'Sophia', avatarColor: 'bg-teal-500', icon: 'Palette' },
  { id: 's9', name: 'Daan', avatarColor: 'bg-indigo-500', icon: 'Puzzle' },
  { id: 's10', name: 'Tess', avatarColor: 'bg-lime-500', icon: 'Backpack' },
];

// --- Components ---

/**
 * SmileyIcon Component
 * Custom SVG smileys for evaluation results.
 */
const SmileyIcon = ({ type, size = 20, className = "", withBackground = false }: { type: string, size?: number, className?: string, withBackground?: boolean }) => {
  const getColors = () => {
    switch (type) {
      case 'happy': return { bg: 'bg-green-500', text: 'text-white', stroke: 'stroke-white', defaultText: 'text-green-500' };
      case 'neutral': return { bg: 'bg-amber-500', text: 'text-white', stroke: 'stroke-white', defaultText: 'text-amber-500' };
      case 'sad': return { bg: 'bg-red-500', text: 'text-white', stroke: 'stroke-white', defaultText: 'text-red-500' };
      default: return { bg: 'bg-gray-500', text: 'text-white', stroke: 'stroke-white', defaultText: 'text-gray-500' };
    }
  };

  const colors = getColors();
  const iconColorClass = className.includes('text-') ? '' : (withBackground ? '' : colors.defaultText);

  return (
    <div 
      className={`rounded-full flex items-center justify-center transition-all ${withBackground ? colors.bg + ' ' + colors.text + ' shadow-sm' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className={`w-full h-full fill-none ${withBackground ? colors.stroke : 'stroke-current'}`} strokeWidth="8" strokeLinecap="round">
        {!withBackground && <circle cx="50" cy="50" r="45" strokeWidth="6" />}
        {type === 'happy' && (
          <g className={iconColorClass}>
            <circle cx="33" cy="38" r="6" stroke="none" fill="currentColor" />
            <circle cx="67" cy="38" r="6" stroke="none" fill="currentColor" />
            <path d="M30 60 Q 50 85 70 60" strokeWidth="8" />
            {/* Blushed cheeks for a "fuller" face look */}
            <circle cx="20" cy="55" r="4" stroke="none" fill="currentColor" opacity="0.4" />
            <circle cx="80" cy="55" r="4" stroke="none" fill="currentColor" opacity="0.4" />
          </g>
        )}
        {type === 'neutral' && (
          <g className={iconColorClass}>
            <circle cx="33" cy="40" r="6" stroke="none" fill="currentColor" />
            <circle cx="67" cy="40" r="6" stroke="none" fill="currentColor" />
            <line x1="30" y1="65" x2="70" y2="65" strokeWidth="10" />
          </g>
        )}
        {type === 'sad' && (
          <g className={iconColorClass}>
            <circle cx="33" cy="42" r="6" stroke="none" fill="currentColor" />
            <circle cx="67" cy="42" r="6" stroke="none" fill="currentColor" />
            <path d="M30 75 Q 50 50 70 75" strokeWidth="8" />
          </g>
        )}
      </svg>
    </div>
  );
};

/**
 * ReflectionBoard Component
 * Displays a grid of students and corners with their average evaluation results over a time period.
 */
function ReflectionBoard({ 
  onClose, 
  students, 
  corners, 
  evaluations, 
  customEvaluationTypes,
  interactionHistory,
  assignments,
  assignmentTimestamps,
  moetjes = [],
  moetjeEvaluations = [],
  activeEvaluationType = 'standard',
  moetjesEvaluationMethod = 'corner',
  moetjesEvaluationCustomId
}: { 
  onClose: () => void, 
  students: Student[], 
  corners: Corner[], 
  evaluations: any[],
  customEvaluationTypes: any[],
  interactionHistory: InteractionRecord[],
  assignments: Record<string, string[]>,
  assignmentTimestamps: Record<string, number>,
  moetjes?: any[],
  moetjeEvaluations?: any[],
  activeEvaluationType?: string,
  moetjesEvaluationMethod?: 'corner' | 'standard' | 'custom',
  moetjesEvaluationCustomId?: string
}) {
  const [sourceMode, setSourceMode] = useState<'corners' | 'moetjes'>('corners');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfDay(new Date()),
    end: endOfDay(new Date())
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedEvalTypeId, setSelectedEvalTypeId] = useState<string>(activeEvaluationType);

  // Switch evaluation type when source mode changes to match the "active" method for that mode
  useEffect(() => {
    if (sourceMode === 'corners') {
      setSelectedEvalTypeId(activeEvaluationType);
    } else {
      if (moetjesEvaluationMethod === 'standard') {
        setSelectedEvalTypeId('standard');
      } else if (moetjesEvaluationMethod === 'custom') {
        setSelectedEvalTypeId(moetjesEvaluationCustomId || 'standard');
      } else {
        // 'corner' method means it follows corners setting
        setSelectedEvalTypeId(activeEvaluationType);
      }
    }
  }, [sourceMode, activeEvaluationType, moetjesEvaluationMethod, moetjesEvaluationCustomId]);

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

  // Filter corners or moetjes that were active during the selected period
  const activeItems = useMemo(() => {
    const items = sourceMode === 'corners' 
      ? corners.map(c => ({ ...c, type: 'corner' as const }))
      : moetjes.map(m => ({ ...m, type: 'moetje' as const }));

    // Filter for items that actually have evaluations in this period
    // OR are active (for moetjes)
    return items.filter(item => {
      const hasEval = (item.type === 'corner' ? evaluations : moetjeEvaluations).some(e => 
        (item.type === 'corner' ? (e as any).cornerId === item.id : (e as any).moetjeId === item.id) &&
        isWithinInterval(new Date(e.timestamp), { start: dateRange.start, end: dateRange.end })
      );
      
      if (item.type === 'moetje') {
        return (item as Moetje).isActive !== false || hasEval;
      }
      return hasEval;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [sourceMode, corners, moetjes, evaluations, moetjeEvaluations, dateRange]);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const currentEvalType = useMemo(() => {
    if (selectedEvalTypeId === 'standard') {
      return {
        id: 'standard',
        name: 'Standaard',
        options: [
          { id: 'happy', label: 'Leuk', color: 'bg-green-500', image: '', type: 'happy' },
          { id: 'neutral', label: 'Matig', color: 'bg-amber-500', image: '', type: 'neutral' },
          { id: 'sad', label: 'Niet leuk', color: 'bg-red-500', image: '', type: 'sad' }
        ]
      };
    }
    return customEvaluationTypes.find(t => t.id === selectedEvalTypeId);
  }, [selectedEvalTypeId, customEvaluationTypes]);

  const getAggregatedRating = (studentId: string, itemId: string) => {
    if (sourceMode === 'corners') {
      const periodEvaluations = evaluations.filter(e => 
        e.studentId === studentId && 
        e.cornerId === itemId &&
        (
          (selectedEvalTypeId === 'standard' && (e.evaluationTypeId === 'standard' || e.evaluationTypeId === undefined)) ||
          (e.evaluationTypeId === selectedEvalTypeId)
        ) &&
        isWithinInterval(new Date(e.timestamp), { start: dateRange.start, end: dateRange.end }) &&
        (e.duration === undefined || e.duration >= 30000)
      );

      const isActiveSession = assignments[itemId]?.includes(studentId) && 
                              assignmentTimestamps[studentId] && 
                              (Date.now() - Number(assignmentTimestamps[studentId])) >= 30000;

      const sessionsCount = interactionHistory.filter(i => 
        i.students.includes(studentId) && 
        i.cornerId === itemId &&
        i.duration >= 30000 &&
        isWithinInterval(new Date(i.timestamp), { start: dateRange.start, end: dateRange.end })
      ).length + (isActiveSession ? 1 : 0);

      const autoLogCount = Math.max(0, sessionsCount - periodEvaluations.length);

      if (periodEvaluations.length === 0) {
        return null;
      }

      // Numerical aggregation for standard smileys
      if (selectedEvalTypeId === 'standard') {
        const scores: Record<string, number> = { 'happy': 3, 'neutral': 2, 'sad': 1 };
        // Incorporate auto-logs as "neutral" (2) to balance, but they will be overridden by enough manual data
        const totalManualScore = periodEvaluations.reduce((acc, e) => acc + (scores[e.rating] || 2), 0);
        const totalScore = totalManualScore + (autoLogCount * 2);
        const avg = totalScore / (periodEvaluations.length + autoLogCount);
        
        if (avg >= 2.3) return 'happy';
        if (avg <= 1.7) return 'sad';
        return 'neutral';
      }

      // Most frequent for custom types
      const counts: Record<string, number> = {};
      periodEvaluations.forEach(e => {
        counts[e.rating] = (counts[e.rating] || 0) + 1;
      });
      if (autoLogCount > 0) counts['?'] = autoLogCount;

      const sorted = Object.entries(counts)
        .filter(([key]) => key !== '?') // Don't let '?' win in custom types either
        .sort((a, b) => b[1] - a[1]);
      
      if (sorted.length === 0) return null;
      return sorted[0][0];
    } else {
      const periodEvaluations = moetjeEvaluations.filter(e => 
        e.studentId === studentId && 
        e.moetjeId === itemId &&
        !e.isReset &&
        (
          (selectedEvalTypeId === 'standard' && (e.type === 'standard' || e.type === undefined)) ||
          (e.type === selectedEvalTypeId)
        ) &&
        isWithinInterval(new Date(e.timestamp), { start: dateRange.start, end: dateRange.end })
      );

      if (periodEvaluations.length === 0) return null;

      // Standard smiley logic for moetjes
      if (selectedEvalTypeId === 'standard') {
        const scores: Record<string, number> = { 'happy': 3, 'neutral': 2, 'sad': 1 };
        const totalScore = periodEvaluations.reduce((acc, e) => acc + (scores[e.evaluationValue] || 2), 0);
        const avg = totalScore / periodEvaluations.length;
        
        if (avg >= 2.4) return 'happy';
        if (avg >= 1.6) return 'neutral';
        return 'sad';
      }

      // Most frequent for custom types in moetjes
      const counts: Record<string, number> = {};
      let maxCount = 0;
      let mostFrequent = periodEvaluations[0].evaluationValue;

      periodEvaluations.forEach(e => {
        counts[e.evaluationValue] = (counts[e.evaluationValue] || 0) + 1;
        if (counts[e.evaluationValue] > maxCount) {
          maxCount = counts[e.evaluationValue];
          mostFrequent = e.evaluationValue;
        }
      });

      return mostFrequent;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col"
    >
      {/* Header */}
      <div className="p-2 sm:p-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-white sticky top-0 z-[110]">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500 p-1.5 rounded-lg shadow-md">
            <ClipboardList className="text-white" size={18} strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 leading-none uppercase tracking-tight">Reflectiebord</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {selectedEvalTypeId === 'standard' && (
            <div className="hidden xl:flex items-center gap-3 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-1 grayscale opacity-50">
                <SmileyIcon type="happy" size={12} />
                <span className="text-[7px] font-black uppercase tracking-tighter">Positief</span>
              </div>
              <div className="flex items-center gap-1 grayscale opacity-50">
                <SmileyIcon type="neutral" size={12} />
                <span className="text-[7px] font-black uppercase tracking-tighter">Gemiddeld</span>
              </div>
              <div className="flex items-center gap-1 grayscale opacity-50">
                <SmileyIcon type="sad" size={12} />
                <span className="text-[7px] font-black uppercase tracking-tighter">Negatief</span>
              </div>
            </div>
          )}

          <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
            <button 
              onClick={() => setSourceMode('corners')} 
              className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${sourceMode === 'corners' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:bg-white/50'}`}
            >
              HOEKEN
            </button>
            <button 
              onClick={() => setSourceMode('moetjes')} 
              className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${sourceMode === 'moetjes' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500 hover:bg-white/50'}`}
            >
              MOETJES
            </button>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
            <button onClick={() => setRange('day')} className="px-3 py-1 text-[9px] font-black hover:bg-white rounded-md transition-all">Dag</button>
            <button onClick={() => setRange('week')} className="px-3 py-1 text-[9px] font-black hover:bg-white rounded-md transition-all border-x border-gray-200">Week</button>
            <button onClick={() => setRange('month')} className="px-3 py-1 text-[9px] font-black hover:bg-white rounded-md transition-all border-r border-gray-200">Maand</button>
            <button onClick={() => setRange('schoolyear')} className="px-3 py-1 text-[9px] font-black hover:bg-white rounded-md transition-all">Schooljaar</button>
          </div>

          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-indigo-200 transition-all text-[9px] font-black text-gray-700 relative"
          >
            <CalendarIcon size={12} className="text-indigo-500" />
            <span>{format(dateRange.start, 'd MMM', { locale: nl })} - {format(dateRange.end, 'd MMM', { locale: nl })}</span>
          </button>

          <button 
            onClick={onClose}
            className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-1 sm:p-2 bg-gray-50/50">
        <div className="bg-white rounded-[1.25rem] border-2 border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-full">
          <div className="overflow-auto flex-1 relative">
            <table className="w-full border-collapse">
              <thead>
                <tr className="sticky top-0 z-40 bg-white shadow-sm">
                  <th className="p-1 border-b-2 border-gray-200 sticky left-0 z-50 bg-white min-w-[100px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-col">
                        <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest text-left leading-none">Evaluatietype</span>
                      </div>
                      <select 
                        value={selectedEvalTypeId}
                        onChange={(e) => setSelectedEvalTypeId(e.target.value)}
                        className="w-full p-1 bg-gray-50 border border-gray-100 rounded-lg text-[8px] font-black text-gray-700 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="standard">Standaard</option>
                    {customEvaluationTypes.map((t, idx) => (
                      <option key={`rb-eval-opt-${t.id}-${idx}`} value={t.id}>{t.name}</option>
                    ))}
                      </select>
                    </div>
                  </th>
                  {activeItems.map((item, idx) => (
                    <th key={`reflection-board-header-${item.id}-${idx}`} className="p-2 border-b-2 border-gray-100 min-w-[60px] bg-white">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center text-white shadow-sm overflow-hidden relative`}>
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : item.icon && ICON_MAP[item.icon] ? (
                            (() => {
                              const Icon = ICON_MAP[item.icon!];
                              return <Icon size={16} strokeWidth={3} />;
                            })()
                          ) : (
                            <LayoutGrid size={16} />
                          )}
                        </div>
                        <span className="text-[8px] font-black text-gray-900 uppercase tracking-tight truncate max-w-[50px] leading-none">{item.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student, idx) => (
                  <tr key={`reflection-board-row-${student.id}-${idx}`} className="group hover:bg-gray-50 transition-colors">
                    <td className="p-2 border-b border-gray-100 z-10 sticky left-0 bg-white group-hover:bg-indigo-50/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${student.avatarColor} flex items-center justify-center text-[10px] font-black text-white shrink-0 overflow-hidden shadow-sm border border-white`}>
                          {student.image ? (
                            <img src={student.image} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : student.icon && ICON_MAP[student.icon] ? (
                            (() => {
                              const Icon = ICON_MAP[student.icon!];
                              return <Icon size={14} strokeWidth={3} />;
                            })()
                          ) : (
                            student.name[0]
                          )}
                        </div>
                        <span className="text-[11px] font-black text-gray-800 truncate max-w-[80px]">{student.name}</span>
                      </div>
                    </td>
                    {activeItems.map((item, idx) => {
                      const ratingId = getAggregatedRating(student.id, item.id);
                      const option = currentEvalType?.options.find((o: any) => o.id === ratingId);

                      return (
                        <td key={`reflection-board-cell-${student.id}-${item.id}-${idx}`} className="p-1 border-b border-gray-50 text-center transition-all">
                          {option ? (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="flex justify-center"
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110 ${option.image ? 'bg-white shadow-sm border border-gray-100 p-0.5' : ''}`}>
                                {option.image ? (
                                  <img src={option.image} alt={option.label} className="w-full h-full object-cover rounded-md" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="flex flex-col items-center">
                                    {['happy', 'neutral', 'sad'].includes(option.type) ? (
                                      <SmileyIcon type={option.type} size={20} withBackground={true} className="drop-shadow-sm" />
                                    ) : (
                                      <div className={`w-5 h-5 rounded-full ${option.color || 'bg-gray-300'}`} />
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ) : (
                            <div className="w-1.5 h-1.5 bg-gray-100 rounded-full mx-auto opacity-30" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                
                {/* Summary Row */}
                <tr className="bg-gray-100/50 border-t-2 border-gray-200">
                  <td className="p-2 sticky left-0 bg-gray-100 group-hover:bg-gray-200 transition-colors z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Totaal</span>
                  </td>
                  {activeItems.map((item, idx) => {
                    const stats = sortedStudents.reduce((acc, student) => {
                      const ratingId = getAggregatedRating(student.id, item.id);
                      if (ratingId) {
                        const option = currentEvalType?.options.find((o: any) => o.id === ratingId);
                        const type = option?.type || 'other';
                        acc[type] = (acc[type] || 0) + 1;
                      }
                      return acc;
                    }, {} as Record<string, number>);

                    const hasStats = Object.values(stats).some((count) => Number(count) > 0);

                    return (
                      <td key={`reflection-board-summary-${item.id}-${idx}`} className="p-1 py-3 text-center border-b border-gray-100">
                        {hasStats ? (
                          <div className="flex flex-col items-center gap-1.5">
                            {(stats['happy'] || 0) > 0 && (
                              <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-green-100">
                                <SmileyIcon type="happy" size={10} />
                                <span className="text-[8px] font-black text-green-600">{stats['happy']}</span>
                              </div>
                            )}
                            {(stats['neutral'] || 0) > 0 && (
                              <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-amber-100">
                                <SmileyIcon type="neutral" size={10} />
                                <span className="text-[8px] font-black text-amber-600">{stats['neutral']}</span>
                              </div>
                            )}
                            {(stats['sad'] || 0) > 0 && (
                              <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-red-100">
                                <SmileyIcon type="sad" size={10} />
                                <span className="text-[8px] font-black text-red-600">{stats['sad']}</span>
                              </div>
                            )}
                            {(stats['other'] || 0) > 0 && (
                               <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-gray-100">
                                 <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                 <span className="text-[8px] font-black text-gray-500">{stats['other']}</span>
                               </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-gray-200">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const IconPicker = ({ 
  selected, 
  onSelect, 
  icons, 
  customImages = [],
  onSelectCustom,
  usedSymbols = [],
  onDeleteImage,
  isAdmin = false
}: { 
  selected: string | null, 
  onSelect: (icon: string) => void, 
  icons: string[],
  customImages?: string[],
  onSelectCustom?: (img: string) => void,
  usedSymbols?: string[],
  onDeleteImage?: (img: string) => void,
  isAdmin?: boolean
}) => {
  return (
    <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 rounded-2xl border-2 border-gray-100 max-h-48 overflow-y-auto custom-scrollbar">
      {/* Custom Images First - Show only unused images or the currently selected one */}
      {customImages.filter(img => !usedSymbols.includes(img) || selected === img).map((img, idx) => (
        <div key={`custom-img-${img.substring(0, 20)}-${img.substring(img.length - 20)}-${idx}`} className="relative group">
          <button
            onClick={() => onSelectCustom?.(img)}
            className={`w-full aspect-square rounded-xl transition-all overflow-hidden border-2 ${
              selected === img 
                ? 'border-orange-500 shadow-md scale-95' 
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            <img src={img} alt="Custom" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteImage?.(img);
            }}
            className={`absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center ${isAdmin ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-10 hover:bg-red-600`}
            title="Verwijder foto"
          >
            <X size={10} strokeWidth={4} />
          </button>
        </div>
      ))}
      
      {/* Standard Icons */}
      {icons.filter(iconName => !usedSymbols.includes(iconName) || selected === iconName).map((iconName, idx) => {
        const Icon = ICON_MAP[iconName];
        if (!Icon) return null;
        return (
          <button
            key={`${iconName}-${idx}`}
            onClick={() => onSelect(iconName)}
            className={`p-3 rounded-xl transition-all flex items-center justify-center ${
              selected === iconName 
                ? 'bg-orange-50 text-orange-500 border-2 border-orange-500 shadow-sm' 
                : 'hover:bg-white text-gray-400 hover:text-gray-600 border-2 border-transparent'
            }`}
          >
            <Icon size={24} />
          </button>
        );
      })}
    </div>
  );
};

const EvaluationOverlay = ({ 
  student, 
  onSelect, 
  onClose,
  evaluationType = 'standard',
  customTypes = [],
  customTypeId
}: { 
  student: Student, 
  onSelect: (rating: string) => void | Promise<void>,
  onClose: () => void,
  evaluationType?: string,
  customTypes?: any[],
  customTypeId?: string,
  key?: string
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 20000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const effectiveTypeId = evaluationType === 'custom' ? (customTypeId || evaluationType) : evaluationType;

  const currentType = effectiveTypeId === 'standard' 
    ? { name: 'Standaard', options: [
        { id: 'happy', label: 'Leuk', color: 'bg-green-500', image: '', type: 'happy' },
        { id: 'neutral', label: 'Matig', color: 'bg-amber-500', image: '', type: 'neutral' },
        { id: 'sad', label: 'Niet leuk', color: 'bg-red-500', image: '', type: 'sad' }
      ]}
    : customTypes.find(t => t.id === effectiveTypeId) || { name: 'Standaard', options: [
        { id: 'happy', label: 'Leuk', color: 'bg-green-500', image: '', type: 'happy' },
        { id: 'neutral', label: 'Matig', color: 'bg-amber-500', image: '', type: 'neutral' },
        { id: 'sad', label: 'Niet leuk', color: 'bg-red-500', image: '', type: 'sad' }
      ]};

  // Migration for old format if needed
  const displayOptions = (currentType as any).options || [
    { id: 'happy', label: (currentType as any).happyLabel || 'Leuk', color: 'bg-green-500', image: (currentType as any).happyImage, type: 'happy' },
    { id: 'neutral', label: (currentType as any).neutralLabel || 'Matig', color: 'bg-amber-500', image: (currentType as any).neutralImage, type: 'neutral' },
    { id: 'sad', label: (currentType as any).sadLabel || 'Niet leuk', color: 'bg-red-500', image: (currentType as any).sadImage, type: 'sad' },
    ...((currentType as any).extraLabel ? [{ id: 'extra', label: (currentType as any).extraLabel, color: 'bg-blue-500', image: (currentType as any).extraImage, type: 'extra' }] : [])
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center p-8"
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
      >
        <X size={48} className="text-gray-500" />
      </button>

      <div className="flex flex-col items-center gap-12 w-full max-w-7xl">
         {/* Student Symbol */}
         <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="flex flex-col items-center mb-4"
         >
           <div className={`w-32 h-32 rounded-full ${student.avatarColor} flex items-center justify-center shadow-2xl border-4 border-white overflow-hidden`}>
             {student.image ? (
               <img src={student.image} alt="" className="w-full h-full object-cover" />
             ) : student.icon && ICON_MAP[student.icon] ? (
               (() => {
                 const Icon = ICON_MAP[student.icon];
                 return <Icon size={64} strokeWidth={3} className="text-white" />;
               })()
             ) : (
               <span className="text-4xl font-black text-white">{student.name[0]}</span>
             )}
           </div>
           <p className="mt-4 text-2xl font-black text-gray-900 uppercase tracking-widest">{student.name}</p>
         </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 lg:gap-10">
          {displayOptions.map((option: any, idx: number) => (
            <button 
              key={`${option.id}-${idx}`}
              onClick={() => onSelect(option.id)}
              className="group flex flex-col items-center gap-4 transition-transform hover:scale-110 active:scale-95"
            >
              <div className={`w-32 h-32 md:w-40 md:h-40 ${option.color || 'bg-blue-500'} rounded-full flex items-center justify-center shadow-2xl border-8 border-white overflow-hidden text-white`}>
                {option.image ? (
                  <img src={option.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <SmileyIcon type={option.type} size={80} className="text-white" />
                )}
              </div>
              <span className={`text-lg md:text-xl font-black uppercase tracking-widest ${
                evaluationType === 'standard' 
                  ? getTextClass(option.color || 'bg-blue-500') 
                  : 'text-gray-500'
              }`}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Moetje Evaluation Icon Component
 * Custom SVG icons for moetje evaluation results.
 */
const MoetjeEvalIcon = ({ type, size = 32, className = "" }: { type: string, size?: number, className?: string }) => {
  const defaultColors: Record<string, string> = {
    happy: 'text-green-500',
    neutral: 'text-amber-500',
    sad: 'text-red-500'
  };

  const activeColorClass = className.includes('text-') ? className : `${defaultColors[type] || 'text-gray-400'} ${className}`;

  return (
    <svg 
      viewBox="0 0 100 100" 
      className={activeColorClass} 
      style={{ width: size, height: size }} 
      stroke="currentColor" 
      fill="none" 
      strokeWidth="8" 
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="50" cy="50" r="45" strokeWidth="6" />
      {type === 'happy' && (
        <g>
          <circle cx="33" cy="40" r="6" fill="currentColor" stroke="none" />
          <circle cx="67" cy="40" r="6" fill="currentColor" stroke="none" />
          <path d="M30 62 Q 50 82 70 62" />
        </g>
      )}
      {type === 'neutral' && (
        <g>
          <circle cx="33" cy="40" r="6" fill="currentColor" stroke="none" />
          <circle cx="67" cy="40" r="6" fill="currentColor" stroke="none" />
          <line x1="30" y1="65" x2="70" y2="65" />
        </g>
      )}
      {type === 'sad' && (
        <g>
          <circle cx="33" cy="40" r="6" fill="currentColor" stroke="none" />
          <circle cx="67" cy="40" r="6" fill="currentColor" stroke="none" />
          <path d="M30 75 Q 50 55 70 75" />
        </g>
      )}
    </svg>
  );
};

 interface MoetjesbordViewProps {
  moetjes: Moetje[];
  students: Student[];
  evaluations: MoetjeEvaluation[];
  onEvaluate: (studentId: string, moetjeId: string) => void;
  onResetMoetje: (studentId: string, moetjeId: string) => void;
  onClose: () => void;
  isAdmin: boolean;
  onEditMoetje: (moetje: Moetje) => void;
  onDeleteMoetje: (id: string) => void;
  onToggleMoetje: (id: string, active: boolean) => void;
  evalType: string;
  customEvalTypes: any[];
  displayMode: 'both' | 'names' | 'pictos';
}

function MoetjesbordView({ 
  moetjes, 
  students, 
  evaluations, 
  onEvaluate, 
  onResetMoetje,
  onClose,
  isAdmin,
  onEditMoetje,
  onDeleteMoetje,
  onToggleMoetje,
  onAddMoetje,
  evalType,
  customEvalTypes,
  displayMode
}: MoetjesbordViewProps & { onAddMoetje: () => void }) {
  const activeMoetjes = moetjes.filter(m => m.isActive || isAdmin);

  // Layout scaling logic based on counts
  const columns = activeMoetjes.length <= 1 ? 'grid-cols-1' : 
                 activeMoetjes.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : 
                 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  
  const studentColsClass = students.length <= 12 ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5' :
                          students.length <= 24 ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8' :
                          'grid-cols-5 sm:grid-cols-8 md:grid-cols-10';
  
  const iconSizeClass = students.length > 20 ? 'w-8 h-8' : 
                       students.length > 12 ? 'w-12 h-12' : 'w-16 h-16';

  const getDynamicFontSize = (name: string) => {
    const len = name.length;
    const base = students.length > 20 ? 7 : students.length > 12 ? 9 : 11;
    if (len <= 6) return `${base}px`;
    if (len <= 10) return `${base * 0.9}px`;
    if (len <= 15) return `${base * 0.8}px`;
    return `${base * 0.7}px`;
  };

  return (
    <div 
      className="flex-1 flex flex-col min-h-0 bg-white rounded-3xl border-2 border-gray-100 relative"
      style={{ transform: 'scale(0.97)', transformOrigin: 'top center' }}
    >
      <div className="p-4 flex items-center justify-between bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-xl shadow-lg shadow-amber-200">
            <ClipboardList className="text-white" size={24} strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Moetjesbord</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button 
              onClick={onAddMoetje}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-100 hover:scale-105 transition-all"
            >
              <Plus size={14} strokeWidth={3} />
              + Nieuw Moetje
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500 hover:text-red-600"
          >
            <X size={28} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4">
        {activeMoetjes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center">
              <ClipboardList size={48} strokeWidth={2} />
            </div>
            <div className="text-center space-y-2">
              <p className="font-black uppercase tracking-widest text-sm">Geen actieve moetjes</p>
              {isAdmin && (
                <button 
                  onClick={onAddMoetje}
                  className="mx-auto flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-amber-100 hover:scale-105 transition-all active:scale-95"
                >
                  <Plus size={18} strokeWidth={4} />
                  + Nieuw Moetje
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`grid ${columns} gap-4 sm:gap-6 items-start`}>
            {activeMoetjes.map((moetje, midx) => {
              return (
                <div 
                  key={`${moetje.id}-${midx}`}
                  className={`bg-white rounded-3xl border-2 shadow-lg flex flex-col overflow-hidden transition-all h-full ${moetje.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60 grayscale'}`}
                >
                  <div className="p-3 bg-gray-50/50 flex flex-col items-center gap-1 border-b-2 border-amber-50 relative shrink-0">
                    <div className={`${activeMoetjes.length > 3 ? 'w-12 h-12' : 'w-20 h-20'} rounded-2xl border-4 ${getBorderClass(moetje.color)} flex items-center justify-center bg-white shadow-inner overflow-hidden`}>
                      {moetje.image ? (
                        <img src={moetje.image} alt={moetje.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        (() => {
                          const Icon = moetje.icon && ICON_MAP[moetje.icon] ? ICON_MAP[moetje.icon] : LayoutGrid;
                          return <Icon size={activeMoetjes.length > 3 ? 24 : 40} className={getTextClass(moetje.color)} strokeWidth={3} />;
                        })()
                      )}
                    </div>
                    <h3 className={`font-black text-gray-900 text-center ${activeMoetjes.length > 3 ? 'text-sm' : 'text-lg'} uppercase tracking-tight`}>{moetje.name}</h3>
                    
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button 
                          onClick={() => onToggleMoetje(moetje.id, !moetje.isActive)}
                          className={`p-1.5 rounded-lg shadow-sm border-2 transition-all flex flex-col items-center gap-0.5 ${moetje.isActive ? 'bg-green-500 border-green-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
                          title={moetje.isActive ? "Deactiveren (KO)" : "Activeren (KO)"}
                        >
                          <Check size={12} strokeWidth={3} />
                          <span className="text-[5px] font-black uppercase">KO</span>
                        </button>
                        <button 
                          onClick={() => onEditMoetje(moetje)}
                          className="p-1.5 bg-blue-500 border-2 border-blue-600 text-white rounded-lg shadow-sm transition-all hover:scale-105"
                          title="Aanpassen"
                        >
                          <Pencil size={14} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={() => onDeleteMoetje(moetje.id)}
                          className="p-1.5 bg-red-500 border-2 border-red-600 text-white rounded-lg shadow-sm transition-all hover:scale-105"
                          title="Verwijderen"
                        >
                          <Trash2 size={14} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={`p-2 sm:p-4 grid ${studentColsClass} gap-2 content-start overflow-hidden flex-1 min-h-0`}>
                    {students.map(student => {
                      // Get the latest evaluation that is NOT reset
                      const filteredEvals = evaluations
                        .filter(e => e.studentId === student.id && e.moetjeId === moetje.id)
                        .sort((a, b) => b.timestamp - a.timestamp);
                      
                      const latestEval = filteredEvals[0];
                      const isCompleted = latestEval && !latestEval.isReset;

                      return (
                        <div 
                          key={`moetje-slot-${moetje.id}-${student.id}`}
                          className="flex flex-col items-center gap-1 group relative"
                        >
                          <div className="relative">
                            <button
                              onClick={() => {
                                if (!isCompleted) {
                                  onEvaluate(student.id, moetje.id);
                                }
                              }}
                              className={`${iconSizeClass} rounded-2xl flex items-center justify-center transition-all relative ${
                                displayMode === 'names'
                                  ? 'border-0 bg-transparent shadow-none'
                                  : `border-4 ${isCompleted ? 'border-green-500 bg-green-100 shadow-green-100' : 'border-red-600 bg-red-100/50 hover:scale-110 shadow-lg shadow-red-200'}`
                              }`}
                              disabled={isCompleted && !isAdmin}
                            >
                              <div className={`w-full h-full rounded-xl overflow-hidden flex items-center justify-center ${displayMode === 'names' ? '' : 'bg-white/50'}`}>
                                {displayMode === 'names' ? (
                                  <span 
                                    className={`font-black text-center px-0.5 break-words leading-tight uppercase ${isCompleted ? 'text-green-600' : 'text-red-600'}`}
                                    style={{ fontSize: getDynamicFontSize(student.name) }}
                                  >
                                    {student.name}
                                  </span>
                                ) : (
                                  <>
                                    {student.image ? (
                                      <img src={student.image} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : student.icon && ICON_MAP[student.icon] ? (
                                      (() => {
                                        const Icon = ICON_MAP[student.icon];
                                        return <Icon size={students.length > 20 ? 14 : 24} className={isCompleted ? 'text-green-600' : 'text-red-600'} strokeWidth={3} />;
                                      })()
                                    ) : (
                                      <span className={`${students.length > 20 ? 'text-xs' : 'text-xl'} font-black ${isCompleted ? 'text-green-600' : 'text-red-600'}`}>{student.name[0]}</span>
                                    )}
                                  </>
                                )}
                              </div>

                              {isCompleted && (
                                <div className={`absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border-2 border-green-500 shadow-sm overflow-hidden flex items-center justify-center ${displayMode === 'names' ? 'scale-75' : ''}`}>
                                  {latestEval.type === 'standard' ? (
                                    <SmileyIcon type={latestEval.evaluationValue} size={students.length > 20 ? 10 : 14} withBackground={true} />
                                  ) : (
                                    <div className={`${students.length > 20 ? 'w-2 h-2' : 'w-3 h-3'} rounded-full ${latestEval.evaluationValue.startsWith('bg-') ? latestEval.evaluationValue : 'bg-green-500'}`} />
                                  )}
                                </div>
                              )}
                            </button>

                            {isCompleted && isAdmin && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onResetMoetje(student.id, moetje.id);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors border-2 border-white z-10"
                                title="Individueel resetten"
                              >
                                <RotateCcw size={students.length > 20 ? 8 : 12} strokeWidth={4} />
                              </button>
                            )}
                          </div>
                          {displayMode === 'both' && (
                            <span 
                              className={`font-black uppercase text-center leading-[1.1] transition-colors break-words w-full ${
                                isCompleted ? 'text-green-600' : 'text-red-600'
                              }`}
                              style={{ fontSize: getDynamicFontSize(student.name) }}
                            >
                              {student.name}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {isAdmin && (
              <button 
                onClick={onAddMoetje}
                className="bg-white rounded-3xl border-4 border-dashed border-amber-300 flex flex-col items-center justify-center gap-4 p-8 hover:bg-amber-50 hover:border-amber-400 transition-all text-amber-500 group shadow-lg min-h-[200px]"
              >
                <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Plus size={40} strokeWidth={3} />
                </div>
                <span className="font-black uppercase tracking-tight text-lg">+ Nieuw Moetje</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AddMoetjeForm({ 
  onSubmit, 
  onCancel, 
  customImages, 
  fixedCorners,
  initialData,
  onUpload,
  onDeleteImage,
  isAdmin = false
}: { 
  onSubmit: (data: Partial<Moetje>) => void; 
  onCancel: () => void; 
  customImages: string[]; 
  fixedCorners: Corner[];
  initialData?: Moetje | null;
  onUpload?: (img: string) => void;
  onDeleteImage?: (img: string) => void;
  isAdmin?: boolean;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.color || 'bg-blue-400');
  const [icon, setIcon] = useState<string | undefined>(initialData?.icon);
  const [image, setImage] = useState<string | undefined>(initialData?.image);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showFixedSelection, setShowFixedSelection] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for the original file before cropping
        setValidationError('Deze afbeelding is erg groot. Geen zorgen, je kunt hem hieronder bijsnijden om hem kleiner te maken voor de database.');
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (_truncatedArea: any, pixelArea: any) => {
    setCroppedAreaPixels(pixelArea);
  };

  const saveCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    try {
      const croppedBase64 = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setImage(croppedBase64);
      setIcon(undefined);
      setValidationError(null);
      setImageToCrop(null);
      onUpload?.(croppedBase64);
    } catch (e) {
      console.error(e);
      setValidationError('Fout bij het bijsnijden van de afbeelding');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFixedSelect = (fc: Corner) => {
    setName(fc.name);
    setColor(fc.color);
    setIcon(fc.icon);
    setImage(fc.image);
    setShowFixedSelection(false);
  };

  return (
    <div className="flex flex-col min-h-[400px]">
      <div className="flex-1 p-3 space-y-4 pb-20">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowFixedSelection(!showFixedSelection)}
            className="flex-1 py-2 bg-indigo-50 border-2 border-indigo-100 rounded-xl text-indigo-600 font-black uppercase text-[10px] hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
          >
            <LayoutGrid size={14} strokeWidth={3} />
            {showFixedSelection ? 'ZELF INVOEREN' : 'KIES UIT VASTE HOEK'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {showFixedSelection ? (
            <motion.div 
              key="fixed-selection"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[250px] overflow-y-auto p-1"
            >
              {fixedCorners.map((fc, fidx) => (
                <button
                  key={`${fc.id}-${fidx}`}
                  onClick={() => handleFixedSelect(fc)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all bg-white shadow-sm group"
                >
                  <div className={`w-10 h-10 rounded-lg border-2 ${getBorderClass(fc.color)} flex items-center justify-center bg-white shadow-inner overflow-hidden shrink-0`}>
                    {fc.image ? (
                      <img src={fc.image} alt={fc.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      (() => {
                        const Icon = fc.icon && ICON_MAP[fc.icon] ? ICON_MAP[fc.icon] : LayoutGrid;
                        return <Icon size={20} className={getTextClass(fc.color)} strokeWidth={3} />;
                      })()
                    )}
                  </div>
                  <span className="text-[9px] font-black text-gray-900 group-hover:text-indigo-600 truncate w-full text-center leading-none">{fc.name}</span>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="custom-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {validationError && (
                <div className="bg-red-50 border-2 border-red-100 p-2 rounded-xl text-red-600 text-[10px] font-black uppercase text-center animate-in slide-in-from-top-1">
                  {validationError}
                </div>
              )}

              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Naam van het moetje</label>
                <input 
                  ref={nameRef}
                  type="text" 
                  value={name}
                  onChange={(e) => { setName(e.target.value); setValidationError(null); }}
                  placeholder="Bijv. Kleuromtrekken"
                  className="w-full p-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-xs font-black"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Kleur</label>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                  {COLORS.map((c, cidx) => (
                    <button 
                      key={`fixed-corner-color-${c}-${cidx}`}
                      onClick={() => { setColor(c); setValidationError(null); }}
                      className={`aspect-square rounded-lg ${c} border-2 transition-all ${color === c ? 'border-indigo-500 scale-105 shadow-md' : 'border-white hover:scale-105 shadow-sm'}`}
                    />
                  ))}
                </div>
              </div>

              {imageToCrop && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col p-4 animate-in fade-in duration-300">
                  <div className="flex-1 relative rounded-2xl overflow-hidden mb-4">
                    <Cropper
                      image={imageToCrop}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                  </div>
                  <div className="bg-white rounded-2xl p-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black uppercase text-gray-400">Zoom</span>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <p className="text-[7px] text-gray-400 font-bold uppercase text-center w-full">
                        * De afbeelding wordt automatisch geoptimaliseerd voor de database
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setImageToCrop(null)}
                        className="flex-1 py-3 text-[10px] font-black uppercase text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                      >
                        Annuleren
                      </button>
                      <button
                        onClick={saveCroppedImage}
                        className="flex-1 py-3 text-[10px] font-black uppercase text-white bg-indigo-500 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-all"
                      >
                        BIJSNIJDEN & OPSLAAN
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4" ref={mediaRef}>
                <div className="space-y-2">
                  <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">Icoon</label>
                  <div className="grid grid-cols-4 gap-1.5 h-32 overflow-y-auto p-1.5 bg-gray-50 rounded-xl border-2 border-gray-100 custom-scrollbar">
                    {CORNER_ICONS.map((i, idx) => {
                      const Icon = ICON_MAP[i];
                      return (
                        <button 
                          key={`fixed-corner-icon-${i}-${idx}`}
                          onClick={() => { 
                            setIcon(i); 
                            setImage(undefined); 
                            setValidationError(null);
                          }}
                          className={`p-1.5 rounded-lg border-2 transition-all flex items-center justify-center bg-white ${icon === i ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-white text-gray-400 hover:bg-gray-50'}`}
                        >
                          <Icon size={16} strokeWidth={3} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Afbeelding</label>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1 px-2 bg-indigo-500 text-white rounded-lg text-[7px] font-black uppercase hover:bg-indigo-600 transition-colors shadow-sm"
                    >
                      Upload
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`h-32 border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden transition-all relative group ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}
                  >
                    {image ? (
                      <>
                        <img src={image} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setImage(undefined)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={12} />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-300">
                        <Image size={20} strokeWidth={1} />
                        <p className="text-[6px] font-black uppercase text-center px-2">Drag & drop</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Of kies uit bibliotheek</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 h-24 overflow-y-auto p-2 bg-gray-50 rounded-xl border-2 border-gray-100 custom-scrollbar">
                  {customImages.map((img, idx) => (
                    <button
                      key={`custom-img-${idx}`}
                      onClick={() => { 
                        setImage(img); 
                        setIcon(undefined); 
                        setValidationError(null);
                      }}
                      className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${image === img ? 'border-indigo-500 shadow-md' : 'border-white hover:border-indigo-200'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      {image === img && (
                        <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                          <Check size={12} className="text-white" strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  ))}
                  {customImages.length === 0 && (
                    <div className="col-span-full h-full flex items-center justify-center text-[7px] font-black text-gray-300 uppercase italic">
                      Geen afbeeldingen
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t-2 border-gray-50 flex gap-3">
        <button 
          onClick={onCancel}
          className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-xl"
        >
          Annuleren
        </button>
        <button 
          onClick={async () => {
            if (isSaving) return;
            
            if (!name.trim()) {
              setValidationError('Vul een naam in voor het moetje');
              nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              nameRef.current?.focus();
              return;
            }
            if (!icon && !image) {
              setValidationError('Kies een icoon of afbeelding');
              mediaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return;
            }

            setIsSaving(true);
            setValidationError(null);
            try {
              await onSubmit({ name, color, icon, image });
            } catch (error: any) {
              console.error("Fout bij opslaan:", error);
              if (error.message?.includes('exceeds the maximum allowed size')) {
                setValidationError('Deze afbeelding is te groot voor de database. Gebruik de bijsnijder om de afbeelding kleiner te maken.');
              } else {
                setValidationError('Er is iets misgegaan bij het opslaan. Probeer het opnieuw.');
              }
            } finally {
              setIsSaving(false);
            }
          }}
          className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
        >
          {isSaving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
          {initialData ? 'BIJWERKEN' : 'OPSLAAN'}
        </button>
      </div>
    </div>
  );
}

const LoadingScreen = ({ message }: { message?: string }) => (
  <div className="fixed inset-0 bg-[#F8F9FA] z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-500">
    <div className="relative mb-8">
      <div className="w-24 h-24 border-8 border-gray-100 rounded-full"></div>
      <div className="absolute inset-0 w-24 h-24 border-8 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <LayoutGrid className="text-orange-500" size={32} strokeWidth={3} />
      </div>
    </div>
    <div className="flex flex-col items-center gap-2">
      <h2 className="text-xl font-black tracking-tight text-gray-900 leading-none">Keuzebord Laden</h2>
      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{message || 'Even geduld alsjeblieft...'}</p>
      {message && message.includes('Koppelen') && (
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200"
        >
          Opnieuw proberen
        </button>
      )}
    </div>
    
    <div className="mt-12 flex gap-1.5">
      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce"></div>
    </div>
  </div>
);

function MainApp() {
  const { user, loading, logout, signInAnonymously, deleteAccount } = useAuth();
  const [syncId, setSyncId] = useState<string | null>(null);
  const [syncSecret, setSyncSecret] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);
  const [pairingCompleted, setPairingCompleted] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [pairingStatus, setPairingStatus] = useState<string>('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const hasLoadedBoard = useRef(false);
  const hasLoadedSettings = useRef(false);
  const hasLoadedExclusions = useRef(false);
  const hasLoadedEvalTypes = useRef(false);
  const hasLoadedFixedCorners = useRef(false);
  const hasLoadedImages = useRef(false);
  const hasLoadedAttendance = useRef(false);
  const hasLoadedChoiceSettings = useRef(false);
  const hasLoadedStudents = useRef(false);
  const hasLoadedCorners = useRef(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkInitialLoad = () => {
    if (
      hasLoadedBoard.current &&
      hasLoadedSettings.current &&
      hasLoadedExclusions.current &&
      hasLoadedEvalTypes.current &&
      hasLoadedFixedCorners.current &&
      hasLoadedImages.current &&
      hasLoadedAttendance.current &&
      hasLoadedChoiceSettings.current &&
      hasLoadedStudents.current &&
      hasLoadedCorners.current
    ) {
      setIsDataLoaded(true);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sync = urlParams.get('sync');
    const secret = urlParams.get('secret');
    
    if (sync) {
      setSyncId(sync);
      if (secret) {
        setSyncSecret(secret);
      }
    }
  }, []);

  const isPairingRef = useRef(false);
  const pairingCompletedRef = useRef(false);

  // Pairing Logic
  useEffect(() => {
    const setupPairing = async () => {
      // Basic checks to see if we should even run
      if (!syncId || !syncSecret) return;
      if (pairingCompleted || pairingCompletedRef.current) return;
      if (isPairingRef.current) return;
      if (user?.uid === syncId) return;

      isPairingRef.current = true;
      setIsPairing(true);
      setPairingError(null);
      setPairingStatus('Koppelen starten...');

      try {
        console.log("[Pairing] Starting for owner:", syncId);
        let currentUid = user?.uid;
        
        // 1. Ensure we have an identity
        if (!currentUid) {
          setPairingStatus('Bezig met aanmelden...');
          console.log("[Pairing] No user found, signing in anonymously...");
          try {
            await signInAnonymously();
            setPairingStatus('Gevalideerd, verbinding maken...');
            console.log("[Pairing] Anonymous sign-in triggered");
          } catch (authErr: any) {
            console.error("[Pairing] Auth error:", authErr);
            throw new Error(`Authenticatie mislukt: ${authErr.message || 'Onbekende fout'}`);
          }
          // The effect will re-run when user state changes
          return;
        }

        setPairingStatus('Koppelingsrecord aanmaken...');
        console.log("[Pairing] Creating record for user:", currentUid);
        // 2. Create/Update pairing record
        // ID is satelliteUid_ownerUid
        const pairingId = `${currentUid}_${syncId}`;
        
        // We use a timeout for the setDoc call
        const pairPromise = setDoc(doc(db, 'pairing', pairingId), {
          ownerUid: syncId,
          satelliteUid: currentUid,
          secret: syncSecret,
          updatedAt: Date.now(),
          createdAt: serverTimestamp()
        }, { merge: true });

        // Race against a timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Verbinding met server duurt te lang (timeout).")), 15000)
        );

        await Promise.race([pairPromise, timeoutPromise]);
        
        setPairingStatus('Gekoppeld! Data ophalen...');
        console.log("[Pairing] Success for", pairingId);
        pairingCompletedRef.current = true;
        setPairingCompleted(true);
      } catch (err: any) {
        console.error("[Pairing] Failed:", err);
        let msg = err.message || String(err);
        
        if (msg.includes('permission-denied')) {
          msg = "Geen toegang. Controleer of de QR-code nog geldig is of dat de beheerder het scherm heeft openstaan.";
          handleFirestoreError(err, OperationType.WRITE, `pairing/${user?.uid}_${syncId}`);
        } else if (msg.includes('auth/operation-not-allowed')) {
          msg = "Anoniem inloggen staat niet aan in Firebase. Schakel 'Anonymous' in bij Authentication > Sign-in method.";
        }
        
        setPairingError(msg);
      } finally {
        isPairingRef.current = false;
        setIsPairing(false);
      }
    };

    setupPairing();
  }, [syncId, syncSecret, user?.uid, pairingCompleted]); // We can keep user?.uid and pairingCompleted in dependencies

  const effectiveUid = syncId || user?.uid;
  const isSatellite = !!effectiveUid && effectiveUid !== user?.uid;
  
  useEffect(() => {
    // If our own UID is the same as syncId, we can remove the parameter to keep URL clean,
    // but keep the syncId state because it represents our current view mode.
    if (user && syncId === user.uid) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('sync')) {
        url.searchParams.delete('sync');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [user, syncId]);

  useEffect(() => {
    if (user && !isSatellite && isDataLoaded && !syncSecret) {
      console.log("Generating first-time sync secret...");
      const newSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setSyncSecret(newSecret); // Set locally immediately for UI responsiveness
      setDoc(doc(db, `users/${user.uid}/config/sync`), { secret: newSecret }, { merge: true });
    }
  }, [user, isSatellite, syncSecret, isDataLoaded]);

  // Track last data from firestore to prevent write-loops
  const lastCloudBoardState = useRef<string>('');
  
  const [corners, setCorners] = useState<Corner[]>(INITIAL_CORNERS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [displayMode, setDisplayMode] = useState<'both' | 'names' | 'pictos'>('both');
  const [totalStudentSlots, setTotalStudentSlots] = useState<number>(27);
  const [minPlayTime, setMinPlayTime] = useState<number>(0);
  const [assignmentTimestamps, setAssignmentTimestamps] = useState<Record<string, number>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDistributionMenu, setShowDistributionMenu] = useState(false);
  const [showChoiceProcess, setShowChoiceProcess] = useState(false);
  const [choiceProcessIndex, setChoiceProcessIndex] = useState(0);
  const [absentStudentIds, setAbsentStudentIds] = useState<string[]>([]);
  const [skippedStudentIds, setSkippedStudentIds] = useState<string[]>([]);
  const [choiceSettings, setChoiceSettings] = useState({
    startTimeEnabled: false,
    startTimeMinutes: 5,
  });
  const [showChoiceSettings, setShowChoiceSettings] = useState(false);

  const [showGDPRModal, setShowGDPRModal] = useState(false);
  const [gdprMathProblem, setGDPRMathProblem] = useState<{ a: number, b: number, answer: number } | null>(null);
  const [gdprMathInput, setGDPRMathInput] = useState('');
  const [gdprConfirmText, setGDPRConfirmText] = useState('');

  const openGDPRModal = () => {
    const a = Math.floor(Math.random() * 50) + 1;
    const b = Math.floor(Math.random() * 49) + 1;
    setGDPRMathProblem({ a, b, answer: a + b });
    setGDPRMathInput('');
    setGDPRConfirmText('');
    setShowGDPRModal(true);
  };

  const performGDPRDelete = async () => {
    if (!user) return;
    const myUid = user.uid;
    
    try {
      setIsSyncing(true);
      
      // 1. Delete all subcollections of the user
      // These are identified from the code and rules
      const subCollections = [
        'students', 'corners', 'moetjes', 'interactions', 'evaluations', 
        'moetjeEvaluations', 'attendance', 'config', 'state'
      ];
      
      for (const colName of subCollections) {
        try {
          const q = collection(db, `users/${myUid}/${colName}`);
          const snapshot = await getDocs(q);
          const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
        } catch (colErr: any) {
          console.warn(`Could not finish deleting sub-collection ${colName}:`, colErr);
        }
      }

      // 2. Delete pairings where user is involved
      try {
        const pairingDeletes: Promise<void>[] = [];
        
        // Find pairings where this user is the owner
        const qOwner = query(collection(db, 'pairing'), where('ownerUid', '==', myUid));
        const snapOwner = await getDocs(qOwner);
        snapOwner.docs.forEach(d => {
          pairingDeletes.push(deleteDoc(d.ref));
        });

        // Find pairings where this user is a satellite (viewer)
        const qSatellite = query(collection(db, 'pairing'), where('satelliteUid', '==', myUid));
        const snapSatellite = await getDocs(qSatellite);
        snapSatellite.docs.forEach(d => {
          pairingDeletes.push(deleteDoc(d.ref));
        });
        
        await Promise.all(pairingDeletes);
      } catch (pErr) {
        console.warn("Could not clear all pairings:", pErr);
      }

      // 3. Final root document delete
      try {
        await deleteDoc(doc(db, `users/${myUid}`));
      } catch (rootErr: any) {
        console.warn("Root document delete failed (might be already gone):", rootErr.message);
      }

      setShowGDPRModal(false);
      localStorage.clear();
      sessionStorage.clear();
      
      alert("Al je gegevens zijn succesvol verwijderd. Je account wordt nu definitief opgeheven.");
      try {
        await deleteAccount();
      } catch (authErr: any) {
        if (authErr.code === 'auth/requires-recent-login') {
          alert("Voor de veiligheid moet je opnieuw inloggen voordat je je account definitief kunt verwijderen. Log a.u.b. opnieuw in en probeer het nogmaals.");
        } else {
          console.error("Fout bij verwijderen auth user:", authErr);
          alert("Er is iets misgegaan bij het verwijderen van je inloggegevens. Neem contact op als dit blijft gebeuren.");
        }
      }
      await logout();
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `users/${myUid}`);
    } finally {
      setIsSyncing(false);
    }
  };
  const [showAttendanceOverview, setShowAttendanceOverview] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pendingFullscreenExit, setPendingFullscreenExit] = useState(false);
  const [mustRestoreFullscreen, setMustRestoreFullscreen] = useState(false);
  const [fixedCorners, setFixedCorners] = useState<Corner[]>([]);
  const [isAddingFixedCorner, setIsAddingFixedCorner] = useState(false);
  const [editingFixedCorner, setEditingFixedCorner] = useState<Corner | null>(null);
  const [showFixedCornerSelection, setShowFixedCornerSelection] = useState(false);
  const isExitingRef = useRef(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const [showHourglass, setShowHourglass] = useState<string | null>(null);
  const [overrideStudentId, setOverrideStudentId] = useState<string | null>(null);
  const [mathProblem, setMathProblem] = useState<{ a: number, b: number, op: string, answer: number, q: string } | null>(null);
  const [mathInput, setMathInput] = useState('');
  const [securityTimer, setSecurityTimer] = useState<number | null>(null);

  const [cornerEvaluationEnabled, setCornerEvaluationEnabled] = useState<boolean>(false);
  const [evaluationType, setEvaluationType] = useState<string>('standard');
  const [customEvaluationTypes, setCustomEvaluationTypes] = useState<any[]>([]);
  const [pendingEvaluation, setPendingEvaluation] = useState<{ studentId: string, cornerId: string, startTime: number } | null>(null);
  const [showEvaluationSettings, setShowEvaluationSettings] = useState(false);
  const [showExclusionModal, setShowExclusionModal] = useState(false);
  const [showReflectionBoard, setShowReflectionBoard] = useState(false);
  const [showMoetjesbordSettings, setShowMoetjesbordSettings] = useState(false);
  const [isCreatingCustomEval, setIsCreatingCustomEval] = useState(false);
  const [editingCustomEvalId, setEditingCustomEvalId] = useState<string | null>(null);
  const [newCustomEval, setNewCustomEval] = useState<{
    name: string;
    options: { id: string; label: string; image: string; color: string; type: string }[];
  }>({
    name: '',
    options: [
      { id: 'happy', label: 'Leuk', image: '', color: 'bg-green-500', type: 'happy' },
      { id: 'neutral', label: 'Matig', image: '', color: 'bg-amber-500', type: 'neutral' },
      { id: 'sad', label: 'Niet leuk', image: '', color: 'bg-red-500', type: 'sad' }
    ]
  });
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [exclusions, setExclusions] = useState<{
    studentId: string;
    forbiddenCornerIds: string[];
    forbiddenStudentIds: string[];
    isTwoWay: Record<string, boolean>; // studentId -> boolean
  }[]>([]);

  const [classColorFilter, setClassColorFilter] = useState<string | null>(null);
  const [showColorFilter, setShowColorFilter] = useState(false);
  const [studentForColorEdit, setStudentForColorEdit] = useState<Student | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [interactionHistory, setInteractionHistory] = useState<InteractionRecord[]>([]);
  const [cornerHistory, setCornerHistory] = useState<Record<string, { name: string, icon: string | null, image: string | null }>>({});
  const [moetjeHistory, setMoetjeHistory] = useState<Record<string, { name: string, icon: string | null, image: string | null }>>({});
  const [allCustomImages, setAllCustomImages] = useState<string[]>([]);
  const [isMoetjesbordEnabled, setIsMoetjesbordEnabled] = useState<boolean>(false);
  const [moetjesHasEvaluation, setMoetjesHasEvaluation] = useState<boolean>(true);
  const [moetjesEvaluationMethod, setMoetjesEvaluationMethod] = useState<'corner' | 'standard' | 'custom'>('corner');
  const [moetjesEvaluationCustomId, setMoetjesEvaluationCustomId] = useState<string | undefined>(undefined);
  const [isMoetjesbordView, setIsMoetjesbordView] = useState<boolean>(false);
  const [moetjes, setMoetjes] = useState<Moetje[]>([]);
  const [moetjeEvaluations, setMoetjeEvaluations] = useState<MoetjeEvaluation[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [showResetOptionsModal, setShowResetOptionsModal] = useState<boolean>(false);
  const [isAddingMoetje, setIsAddingMoetje] = useState(false);
  const [editingMoetje, setEditingMoetje] = useState<Moetje | null>(null);


  // Firestore Syncing
  useEffect(() => {
    // Reset all state when user changes or logs out
    hasLoadedBoard.current = false;
    hasLoadedSettings.current = false;
    hasLoadedExclusions.current = false;
    hasLoadedEvalTypes.current = false;
    hasLoadedFixedCorners.current = false;
    hasLoadedImages.current = false;
    hasLoadedAttendance.current = false;
    hasLoadedChoiceSettings.current = false;
    hasLoadedStudents.current = false;
    hasLoadedCorners.current = false;
    setIsDataLoaded(false);


    if (effectiveUid) {
      setCorners([]);
      setStudents([]);
    } else {
      setCorners(INITIAL_CORNERS);
      setStudents(INITIAL_STUDENTS);
    }
    setFixedCorners([]);
    setAssignments({});
    setInteractionHistory([]);
    setCornerHistory({});
    setMoetjeHistory({});
    setAssignmentTimestamps({});
    setExclusions([]);
    setCustomEvaluationTypes([]);
    setEvaluations([]);
    setAllCustomImages([]);
    setTotalStudentSlots(27);
    setMinPlayTime(0);
    setCornerEvaluationEnabled(false);
    setEvaluationType('standard');
    setPendingEvaluation(null);
    setIsMoetjesbordEnabled(false);
    setMoetjesHasEvaluation(true);
    setMoetjesEvaluationMethod('corner');
    setMoetjesEvaluationCustomId(undefined);
    setIsMoetjesbordView(false);
    setMoetjes([]);
    setMoetjeEvaluations([]);
  }, [user]);

  // Sync Attendance (Today)
  useEffect(() => {
    if (!effectiveUid) return;
    if (isSatellite && !pairingCompleted) return;
    const today = new Date().toISOString().split('T')[0];
    const unsub = onSnapshot(doc(db, `users/${effectiveUid}/attendance/${today}`), (docSnap) => {
      if (docSnap.exists()) {
        setAbsentStudentIds(docSnap.data().absentIds || []);
      } else {
        setAbsentStudentIds([]);
      }
      hasLoadedAttendance.current = true;
      checkInitialLoad();
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${effectiveUid}/attendance/${today}`));
    return unsub;
  }, [effectiveUid, isSatellite, pairingCompleted]);

  const [attendanceHistory, setAttendanceHistory] = useState<Record<string, string[]>>({});
  const [attendanceStartDate, setAttendanceStartDate] = useState<string>(new Date(Math.max(0, new Date().setDate(new Date().getDate() - 30))).toISOString().split('T')[0]);
  const [attendanceEndDate, setAttendanceEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAttendanceCalendar, setShowAttendanceCalendar] = useState(false);
  const [attendanceCalendarMonth, setAttendanceCalendarMonth] = useState(new Date());
  useEffect(() => {
    if (!effectiveUid) return;
    if (isSatellite && !pairingCompleted) return;
    const q = query(
      collection(db, `users/${effectiveUid}/attendance`),
      orderBy('__name__', 'desc'),
      limit(365)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const history: Record<string, string[]> = {};
      snapshot.docs.forEach(d => {
        history[d.id] = d.data().absentIds || [];
      });
      setAttendanceHistory(history);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${effectiveUid}/attendance`));
    return unsub;
  }, [effectiveUid, isSatellite, pairingCompleted]);

  // Sync Choice Settings
  useEffect(() => {
    if (!effectiveUid) return;
    if (isSatellite && !pairingCompleted) return;
    const unsub = onSnapshot(doc(db, `users/${effectiveUid}/state/choiceSettings`), (docSnap) => {
      if (docSnap.exists()) {
        setChoiceSettings(docSnap.data() as any);
      }
      hasLoadedChoiceSettings.current = true;
      checkInitialLoad();
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${effectiveUid}/state/choiceSettings`));
    return unsub;
  }, [effectiveUid, isSatellite, pairingCompleted]);

  const updateAttendance = async (ids: string[]) => {
    if (!effectiveUid) return;
    const today = new Date().toISOString().split('T')[0];
    const uniqueIds = Array.from(new Set(ids));
    setAbsentStudentIds(uniqueIds);
    try {
      await setDoc(doc(db, `users/${effectiveUid}/attendance/${today}`), {
        absentIds: uniqueIds
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/attendance/${today}`);
    }
  };

  const updateChoiceSettings = async (settings: typeof choiceSettings) => {
    if (!effectiveUid) return;
    setChoiceSettings(settings);
    try {
      await setDoc(doc(db, `users/${effectiveUid}/state/choiceSettings`), settings);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/state/choiceSettings`);
    }
  };

  useEffect(() => {
    if (!effectiveUid) return;
    if (isSatellite && !pairingCompleted) return;

    // Sync Settings
    const settingsUnsub = onSnapshot(doc(db, `users/${effectiveUid}/config/settings`), (docSnap) => {
      hasLoadedSettings.current = true;
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.totalStudentSlots !== undefined) setTotalStudentSlots(data.totalStudentSlots);
        if (data.minPlayTime !== undefined) setMinPlayTime(data.minPlayTime);
        if (data.cornerEvaluationEnabled !== undefined) setCornerEvaluationEnabled(data.cornerEvaluationEnabled);
        if (data.evaluationType !== undefined) setEvaluationType(data.evaluationType);
        if (data.isMoetjesbordEnabled !== undefined) setIsMoetjesbordEnabled(data.isMoetjesbordEnabled);
        if (data.moetjesHasEvaluation !== undefined) setMoetjesHasEvaluation(data.moetjesHasEvaluation);
        if (data.moetjesEvaluationMethod !== undefined) setMoetjesEvaluationMethod(data.moetjesEvaluationMethod);
        if (data.moetjesEvaluationCustomId !== undefined) setMoetjesEvaluationCustomId(data.moetjesEvaluationCustomId);
        if (data.displayMode !== undefined) setDisplayMode(data.displayMode);
      }
      checkInitialLoad();
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${effectiveUid}/config/settings`));

    // Sync Secret (Owner only)
    let syncUnsub = () => {};
    if (!isSatellite) {
      syncUnsub = onSnapshot(doc(db, `users/${effectiveUid}/config/sync`), (docSnap) => {
        if (docSnap.exists()) {
          setSyncSecret(docSnap.data().secret);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `users/${effectiveUid}/config/sync`));
    }

    // Sync Moetjes
    const moetjesUnsub = onSnapshot(collection(db, `users/${effectiveUid}/moetjes`), (querySnap) => {
      const fetchedMoetjes: Moetje[] = [];
      querySnap.forEach((doc) => {
        const data = doc.data() as Moetje;
        fetchedMoetjes.push({ ...data, id: data.id || doc.id });
      });
      setMoetjes(fetchedMoetjes);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${effectiveUid}/moetjes`));

    // Sync Moetje Evaluations (Owner only)
    let moetjeEvaluationsUnsub = () => {};
    if (!isSatellite) {
      moetjeEvaluationsUnsub = onSnapshot(collection(db, `users/${effectiveUid}/moetjeEvaluations`), (querySnap) => {
        const fetchedEvals: MoetjeEvaluation[] = [];
        querySnap.forEach((doc) => {
          const data = doc.data() as MoetjeEvaluation;
          fetchedEvals.push({ ...data, id: (data as any).id || doc.id });
        });
        setMoetjeEvaluations(fetchedEvals);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${effectiveUid}/moetjeEvaluations`));
    }

    // Sync Corners
    const cornersUnsub = onSnapshot(collection(db, `users/${effectiveUid}/corners`), (querySnap) => {
      const fetchedCorners: Corner[] = [];
      querySnap.forEach((doc) => {
        const data = doc.data() as Corner;
        fetchedCorners.push({ ...data, id: data.id || doc.id });
      });
      setCorners(fetchedCorners);
      hasLoadedCorners.current = true;
      checkInitialLoad();
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${effectiveUid}/corners`));

    // Sync Students
    const studentsUnsub = onSnapshot(collection(db, `users/${effectiveUid}/students`), (querySnap) => {
      const fetchedStudents: Student[] = [];
      querySnap.forEach((doc) => {
        const data = doc.data() as Student;
        fetchedStudents.push({ ...data, id: data.id || doc.id });
      });
      setStudents(fetchedStudents);
      hasLoadedStudents.current = true;
      checkInitialLoad();
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${effectiveUid}/students`));

    // Sync Interactions (limit to last 500 for performance)
    let interactionsUnsub = () => {};
    if (effectiveUid) {
      interactionsUnsub = onSnapshot(
        query(collection(db, `users/${effectiveUid}/interactions`), orderBy('timestamp', 'desc'), limit(500)), 
        (querySnap) => {
          const fetchedInteractions: InteractionRecord[] = [];
          querySnap.forEach((doc) => {
            const data = doc.data() as InteractionRecord;
            fetchedInteractions.push({ ...data, id: data.id || doc.id });
          });
          setInteractionHistory(fetchedInteractions);
        }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${effectiveUid}/interactions`)
      );
    }

    // Sync Evaluations
    let evaluationsUnsub = () => {};
    if (effectiveUid) {
      evaluationsUnsub = onSnapshot(collection(db, `users/${effectiveUid}/evaluations`), (querySnap) => {
        const fetchedEvaluations: any[] = [];
        querySnap.forEach((doc) => fetchedEvaluations.push(doc.data()));
        setEvaluations(fetchedEvaluations);
      }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${effectiveUid}/evaluations`));
    }

    // Sync Exclusions
    const exclusionsUnsub = onSnapshot(doc(db, `users/${effectiveUid}/config/exclusions`), (snapshot) => {
      hasLoadedExclusions.current = true;
      if (snapshot.exists()) {
        setExclusions(snapshot.data().list || []);
      }
      checkInitialLoad();
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${effectiveUid}/config/exclusions`));

    // Sync Eval Types
    const evalTypesUnsub = onSnapshot(doc(db, `users/${effectiveUid}/config/evaluationTypes`), (snapshot) => {
      hasLoadedEvalTypes.current = true;
      if (snapshot.exists()) {
        setCustomEvaluationTypes(snapshot.data().list || []);
      }
      checkInitialLoad();
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${effectiveUid}/config/evaluationTypes`));

    // Sync Fixed Corners
    const fixedCornersUnsub = onSnapshot(doc(db, `users/${effectiveUid}/config/fixedCorners`), (snapshot) => {
      hasLoadedFixedCorners.current = true;
      if (snapshot.exists()) {
        setFixedCorners(snapshot.data().list || []);
      }
      checkInitialLoad();
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${effectiveUid}/config/fixedCorners`));

    // Sync Images
    const imagesUnsub = onSnapshot(doc(db, `users/${effectiveUid}/config/images`), (snapshot) => {
      hasLoadedImages.current = true;
      if (snapshot.exists()) {
        setAllCustomImages(snapshot.data().list || []);
      }
      checkInitialLoad();
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${effectiveUid}/config/images`));

    // Sync Board State
    const boardStateUnsub = onSnapshot(doc(db, `users/${effectiveUid}/state/currentBoard`), (snapshot) => {
      hasLoadedBoard.current = true;
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Deep comparison to prevent loops
        const dataString = JSON.stringify(data);
        if (dataString === lastCloudBoardState.current) {
          checkInitialLoad();
          return;
        }
        lastCloudBoardState.current = dataString;

        if (data.assignments) {
          setAssignments(data.assignments);
          // If a student we are currently evaluating is unassigned on another device, close the evaluation
          setPendingEvaluation(prev => {
            if (!prev) return null;
            const isStillAssigned = Object.values(data.assignments as Record<string, string[]>).some(sids => sids.includes(prev.studentId));
            return isStillAssigned ? prev : null;
          });
        }
        if (data.assignmentTimestamps) setAssignmentTimestamps(data.assignmentTimestamps);
        if (data.cornerHistory) setCornerHistory(data.cornerHistory);
        if (data.moetjeHistory) setMoetjeHistory(data.moetjeHistory);
        setIsPaused(!!data.isPaused);
        setPausedAt(data.pausedAt || null);
      }
      checkInitialLoad();
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${effectiveUid}/state/currentBoard`));

    return () => {
      settingsUnsub();
      syncUnsub();
      cornersUnsub();
      studentsUnsub();
      interactionsUnsub();
      evaluationsUnsub();
      exclusionsUnsub();
      evalTypesUnsub();
      fixedCornersUnsub();
      imagesUnsub();
      moetjesUnsub();
      moetjeEvaluationsUnsub();
      boardStateUnsub();
    };
  }, [effectiveUid, isSatellite, pairingCompleted]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isAddingStudent, setIsAddingStudent] = useState(false);

  const addMoetje = async (data: Partial<Moetje>) => {
    if (!effectiveUid) {
      throw new Error("Je bent niet ingelogd.");
    }

    if (data.image && data.image.length > 900000) {
      throw new Error("Deze afbeelding is na het bijsnijden nog steeds te groot. Probeer de zoom aan te passen of een andere foto.");
    }

    try {
      const id = editingMoetje?.id || Math.random().toString(36).substring(2, 11);
      const newMoetje: any = {
        id,
        name: data.name || '',
        color: data.color || 'bg-blue-400',
        icon: data.icon || null,
        image: data.image || null,
        isPermanent: data.isPermanent || false,
        isActive: editingMoetje?.isActive ?? true
      };
      
      const docRef = doc(db, `users/${effectiveUid}/moetjes/${newMoetje.id}`);
      await setDoc(docRef, newMoetje);
      
      setIsAddingMoetje(false);
      setEditingMoetje(null);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, `users/${effectiveUid}/moetjes`);
    }
  };

  const deleteMoetje = async (id: string) => {
    if (!effectiveUid) return;
    try {
      await deleteDoc(doc(db, `users/${effectiveUid}/moetjes/${id}`));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${effectiveUid}/moetjes/${id}`);
    }
  };

  const toggleMoetje = async (id: string, active: boolean) => {
    if (!effectiveUid) return;
    try {
      await setDoc(doc(db, `users/${effectiveUid}/moetjes/${id}`), { isActive: active }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/moetjes/${id}`);
    }
  };

  const recordMoetjeEvaluation = async (studentId: string, moetjeId: string, value: string, type: string) => {
    if (!effectiveUid) return;
    const moetje = moetjes.find(m => m.id === moetjeId);
    const timestamp = Date.now();
    const evaluation: MoetjeEvaluation = {
      studentId,
      moetjeId,
      evaluationValue: value,
      timestamp,
      type,
      moetjeName: moetje?.name,
      moetjeIcon: moetje?.icon,
      moetjeImage: moetje?.image
    };
    try {
      // Use unique ID for history
      await setDoc(doc(db, `users/${effectiveUid}/moetjeEvaluations/${timestamp}-${studentId}-${moetjeId}`), evaluation);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/moetjeEvaluations`);
    }
  };

  const recordMoetjeReset = async (studentId: string, moetjeId: string) => {
    if (!effectiveUid) return;
    
    // Find the latest evaluation for this student-moetje that is not already reset
    const latest = moetjeEvaluations
      .filter(e => e.studentId === studentId && e.moetjeId === moetjeId && !e.isReset)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (!latest || !latest.id) return;

    const student = students.find(s => s.id === studentId);
    
    try {
      // Update the existing evaluation document using its ID
      await setDoc(doc(db, `users/${effectiveUid}/moetjeEvaluations/${latest.id}`), {
        ...latest,
        isReset: true,
        resetMessage: `De leerkracht heeft ${student?.name || 'deze leerling'} het moetje opnieuw laten doen omdat er iets niet juist was`
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/moetjeEvaluations/${latest.id}`);
    }
  };

  const [pendingMoetjeEval, setPendingMoetjeEval] = useState<{ 
    studentId: string, 
    moetjeId: string, 
    evalType: string,
    customTypeId?: string 
  } | null>(null);

  const handleMoetjeEvaluate = async (studentId: string, moetjeId: string) => {
    const moetje = moetjes.find(m => m.id === moetjeId);
    if (!moetje) return;

    if (moetjesHasEvaluation === false) {
      await recordMoetjeEvaluation(studentId, moetjeId, 'completed', 'none');
      return;
    }

    let targetEvalType = evaluationType;
    let targetCustomId = undefined;

    if (moetjesEvaluationMethod === 'standard') {
      targetEvalType = 'standard';
    } else if (moetjesEvaluationMethod === 'custom') {
      targetEvalType = 'custom';
      targetCustomId = moetjesEvaluationCustomId;
    } else {
      // corner (choice board) method
      targetEvalType = evaluationType;
    }

    setPendingMoetjeEval({ 
      studentId, 
      moetjeId, 
      evalType: targetEvalType,
      customTypeId: targetCustomId
    });
  };

  const submitMoetjeEvaluation = async (rating: string, type: string) => {
    if (pendingMoetjeEval) {
      const { studentId, moetjeId } = pendingMoetjeEval;
      setPendingMoetjeEval(null);
      await recordMoetjeEvaluation(studentId, moetjeId, rating, type);
    }
  };

  const [editingCorner, setEditingCorner] = useState<Corner | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Persistence with Debouncing
  useEffect(() => {
    if (!effectiveUid || !hasLoadedBoard.current) return;
    
    // Check if current state matches what we last got from cloud
    const boardState = {
      assignments,
      assignmentTimestamps,
      cornerHistory,
      moetjeHistory,
      isPaused,
      pausedAt
    };
    const currentStateString = JSON.stringify(boardState);
    if (currentStateString === lastCloudBoardState.current) return;

    const timeoutId = setTimeout(() => {
      setDoc(doc(db, `users/${effectiveUid}/state/currentBoard`), boardState, { merge: true })
        .then(() => {
          lastCloudBoardState.current = currentStateString;
        })
        .catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/state/currentBoard`);
        });
    }, 1000); // Debounce by 1 second

    return () => clearTimeout(timeoutId);
  }, [assignments, assignmentTimestamps, cornerHistory, moetjeHistory, isPaused, pausedAt, effectiveUid]);

  // Sync moetje history
  useEffect(() => {
    if (moetjes.length === 0) return;
    setMoetjeHistory(prev => {
      let changed = false;
      const next = { ...prev };
      moetjes.forEach(m => {
        if (!next[m.id] || next[m.id].name !== m.name || next[m.id].icon !== m.icon || next[m.id].image !== m.image) {
          next[m.id] = { name: m.name, icon: m.icon || null, image: m.image || null };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [moetjes]);

  useEffect(() => {
    if (!effectiveUid || isSatellite || !hasLoadedSettings.current) return;
    
    const timeoutId = setTimeout(() => {
      const settings = {
        totalStudentSlots,
        minPlayTime,
        cornerEvaluationEnabled,
        evaluationType,
        moetjesEvaluationMethod,
        moetjesEvaluationCustomId: moetjesEvaluationCustomId !== undefined ? moetjesEvaluationCustomId : null,
        displayMode
      };
      setDoc(doc(db, `users/${effectiveUid}/config/settings`), settings, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/config/settings`));
    }, 2000); // Settings rarely change rapidly

    return () => clearTimeout(timeoutId);
  }, [totalStudentSlots, minPlayTime, cornerEvaluationEnabled, evaluationType, moetjesEvaluationMethod, moetjesEvaluationCustomId, displayMode, effectiveUid, isSatellite]);

  useEffect(() => {
    if (!effectiveUid || isSatellite || !hasLoadedExclusions.current) return;
    setDoc(doc(db, `users/${effectiveUid}/config/exclusions`), { list: exclusions })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/config/exclusions`));
  }, [exclusions, effectiveUid, isSatellite]);

  useEffect(() => {
    if (!effectiveUid || isSatellite || !hasLoadedEvalTypes.current) return;
    setDoc(doc(db, `users/${effectiveUid}/config/evaluationTypes`), { list: customEvaluationTypes })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/config/evaluationTypes`));
  }, [customEvaluationTypes, effectiveUid, isSatellite]);

  useEffect(() => {
    if (!effectiveUid || isSatellite || !hasLoadedFixedCorners.current) return;
    setDoc(doc(db, `users/${effectiveUid}/config/fixedCorners`), { list: fixedCorners })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/config/fixedCorners`));
  }, [fixedCorners, effectiveUid, isSatellite]);

  useEffect(() => {
    if (!effectiveUid || isSatellite || !hasLoadedImages.current) return;
    setDoc(doc(db, `users/${effectiveUid}/config/images`), { list: allCustomImages })
      .catch(error => {
        console.error("Fout bij opslaan van afbeeldingenlijst:", error);
        if (error.message?.includes('exceeds the maximum allowed size')) {
          // If the list is too large, prune it even more
          setAllCustomImages(prev => prev.slice(0, 5));
        }
      });
  }, [allCustomImages, effectiveUid, isSatellite]);

  // Sync allCustomImages with images currently in use to ensure they are never lost
  useEffect(() => {
    const usedImages = new Set<string>();
    corners.forEach(c => { if (c.image) usedImages.add(c.image); });
    fixedCorners.forEach(c => { if (c.image) usedImages.add(c.image); });
    students.forEach(s => { if (s.image) usedImages.add(s.image); });
    moetjes.forEach(m => { if (m.image) usedImages.add(m.image); });
    
    const currentImages = new Set(allCustomImages);
    let changed = false;
    
    usedImages.forEach(img => {
      if (!currentImages.has(img)) {
        currentImages.add(img);
        changed = true;
      }
    });
    
    if (changed) {
      setAllCustomImages(Array.from(currentImages).slice(0, 100)); // Increased limit to 100
    }
  }, [corners, fixedCorners, students, moetjes, allCustomImages]);

  const deleteImage = (imgToDelete: string) => {
    // Determine where this image is currently in use
    const usages: string[] = [];
    
    if (corners.some(c => c.image === imgToDelete)) usages.push("- Hoeken (vrije keuze)");
    if (fixedCorners.some(c => c.image === imgToDelete)) usages.push("- Vaste hoeken");
    if (students.some(s => s.image === imgToDelete)) usages.push("- Leerlingen");
    if (moetjes.some(m => m.image === imgToDelete)) usages.push("- Moetjes");
    if (customEvaluationTypes.some(t => t.options.some(o => o.image === imgToDelete))) usages.push("- Evaluatie opties");

    if (usages.length > 0) {
      alert(`Oei, deze foto is nog in gebruik! Je kunt hem pas verwijderen als hij nergens meer getoond wordt. Hij wordt nu nog gebruikt bij:\n\n${usages.join('\n')}\n\nHaal de foto eerst weg op deze plek(ken) voordat je hem hier definitief verwijdert.`);
      return;
    }

    setAllCustomImages(prev => prev.filter(img => img !== imgToDelete));
  };

  // Derived state
  const assignedStudentIds = useMemo(() => {
    return Object.values(assignments).flat();
  }, [assignments]);

  const unassignedStudents = useMemo(() => {
    return students.filter(s => !assignedStudentIds.includes(s.id));
  }, [students, assignedStudentIds]);

  const usedSymbols = useMemo(() => {
    const symbols = new Set<string>();
    corners.forEach(c => {
      if (c.icon) symbols.add(c.icon);
      if (c.image) symbols.add(c.image);
    });
    fixedCorners.forEach(c => {
      if (c.icon) symbols.add(c.icon);
      if (c.image) symbols.add(c.image);
    });
    students.forEach(s => {
      if (s.icon) symbols.add(s.icon);
      if (s.image) symbols.add(s.image);
    });
    return Array.from(symbols);
  }, [corners, fixedCorners, students]);

  // Actions
  const assignStudent = (studentId: string, cornerId: string) => {
    const corner = corners.find(c => c.id === cornerId);
    if (!corner) return;

    // Check exclusions
    const studentExclusions = exclusions.find(ex => ex.studentId === studentId);
    const targetCornerStudents = assignments[cornerId] || [];

    if (studentExclusions) {
      // Corner exclusion
      if (studentExclusions.forbiddenCornerIds.includes(cornerId) || 
          (corner.fixedId && studentExclusions.forbiddenCornerIds.includes(corner.fixedId))) return;

      // Student exclusion (one-way or two-way)
      for (const otherId of targetCornerStudents) {
        if (studentExclusions.forbiddenStudentIds.includes(otherId)) return;
      }
    }

    // Two-way check from others already in the corner
    for (const otherId of targetCornerStudents) {
      const otherExclusions = exclusions.find(ex => ex.studentId === otherId);
      if (otherExclusions && otherExclusions.forbiddenStudentIds.includes(studentId) && otherExclusions.isTwoWay[studentId]) {
        return;
      }
    }

    const currentInCorner = assignments[cornerId] || [];
    if (currentInCorner.length >= corner.capacity) return;

    // Remove from other corners first
    const newAssignments = { ...assignments };
    const removalPromises: Promise<void>[] = [];
    
    Object.keys(newAssignments).forEach(cid => {
      if (newAssignments[cid].includes(studentId)) {
        // Record duration for the previous session before moving
        removalPromises.push(recordSessionEnd(studentId, cid));
        newAssignments[cid] = newAssignments[cid].filter(id => id !== studentId);
      }
    });

    // Wait for recordings to finish before finalizing new assignments if we want total accuracy,
    // but the state update can happen immediately as long as we use the correct next state.
    newAssignments[cornerId] = [...(newAssignments[cornerId] || []), studentId];
    setAssignments(newAssignments);
    setAssignmentTimestamps(prev => ({ 
      ...prev, 
      [studentId]: Date.now(),
      ...(choiceSettings.startTimeEnabled ? { [`START_${studentId}`]: Date.now() } : {})
    }));
    
    // Cleanup any pending promises in background
    if (removalPromises.length > 0) {
      Promise.all(removalPromises).catch(err => console.error("Error recording session end:", err));
    }
    
    // Update corner history for analytics
    setCornerHistory(prev => ({
      ...prev,
      [corner.id]: {
        name: corner.name,
        icon: corner.icon || null,
        image: corner.image || null
      }
    }));

    setSelectedStudentId(null);
  };

  const updateSettings = async (newSettings: Partial<any>) => {
    if (!effectiveUid) return;
    try {
      await setDoc(doc(db, `users/${effectiveUid}/config/settings`), newSettings, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/config/settings`);
    }
  };

  const recordSessionEnd = async (studentId: string, cornerId: string, providedStartTime?: number, providedCurrentStudents?: string[]) => {
    const startTime = providedStartTime || Number(assignmentTimestamps[studentId]);
    if (!startTime || isNaN(startTime)) return;

    const duration = Math.max(0, Date.now() - startTime);
    const corner = corners.find(c => c.id === cornerId) || cornerHistory[cornerId];
    if (!corner) return;

    if (!effectiveUid) return;

    // Find all students who were in this corner during this session
    const currentStudents = providedCurrentStudents || assignments[cornerId] || [];
    
    const interaction: InteractionRecord = {
      timestamp: startTime,
      duration,
      students: [studentId, ...currentStudents.filter(id => id !== studentId)],
      cornerId,
      cornerName: corner.name,
      cornerIcon: 'icon' in corner ? (corner.icon || null) : (corner as any).icon,
      cornerImage: 'image' in corner ? (corner.image || null) : (corner as any).image
    };

    try {
      await setDoc(doc(db, `users/${effectiveUid}/interactions`, `${startTime}-${studentId}`), interaction);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/interactions`);
    }
  };

  const generateMathProblem = (max = 10) => {
    // Sum to max, only addition as requested
    const a = Math.floor(Math.random() * (max - 2)) + 1;
    const b = Math.floor(Math.random() * (max + 1 - a)); // Ensure a + b <= max
    const ops = ['+'];
    const op = ops[0];
    const answer = a + b;
    return { a, b, op, answer, q: `${a} ${op} ${b} = ?` };
  };

  const checkUnassign = (studentId: string) => {
    if (isAdmin) {
      unassignStudent(studentId);
      return;
    }

    const startTimestamp = assignmentTimestamps[`START_${studentId}`];
    if (choiceSettings.startTimeEnabled && startTimestamp) {
      const elapsedMinutes = (Date.now() - startTimestamp) / 60000;
      if (elapsedMinutes < choiceSettings.startTimeMinutes) {
        setOverrideStudentId(studentId);
        setMathProblem(generateMathProblem());
        setMathInput('');
        return;
      }
    }

    const startTime = assignmentTimestamps[studentId];
    if (startTime && minPlayTime > 0) {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      if (elapsedMinutes < minPlayTime) {
        setShowHourglass(studentId);
        setTimeout(() => setShowHourglass(null), 2000);
        return;
      }
    }

    if (cornerEvaluationEnabled) {
      const cornerId = Object.keys(assignments).find(cid => assignments[cid].includes(studentId));
      if (cornerId) {
        setPendingEvaluation({ studentId, cornerId, startTime: assignmentTimestamps[studentId] });
        return;
      }
    }

    unassignStudent(studentId);
  };

  const handleOverrideClick = (studentId: string) => {
    setOverrideStudentId(studentId);
    setMathProblem(generateMathProblem());
    setMathInput('');
    setShowHourglass(null);
  };

  const submitOverride = () => {
    if (parseInt(mathInput) === mathProblem?.answer) {
      if (overrideStudentId) unassignStudent(overrideStudentId);
      setOverrideStudentId(null);
      setMathProblem(null);
    } else {
      setMathInput('');
    }
  };

  const unassignStudent = (studentId: string) => {
    const cornersToUpdate = Object.keys(assignments).filter(cid => 
      assignments[cid].includes(studentId)
    );

    if (cornersToUpdate.length === 0) return;

    // Capture current data for background recording
    const startTime = Number(assignmentTimestamps[studentId]);
    const currentAssignments = { ...assignments };

    // Update state immediately for UI responsiveness
    setAssignments(prev => {
      const next = { ...prev };
      cornersToUpdate.forEach(cid => {
        next[cid] = next[cid].filter(id => id !== studentId);
      });
      return next;
    });

    setAssignmentTimestamps(prev => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });

    // Record in background
    cornersToUpdate.forEach(cid => {
      recordSessionEnd(studentId, cid, startTime, currentAssignments[cid]);
    });
  };

  const resetCorner = (cornerId: string) => {
    const studentIds = assignments[cornerId] || [];
    if (studentIds.length === 0) return;

    // Capture current data for background recording
    const currentStudents = [...studentIds];
    const currentTimestamps = { ...assignmentTimestamps };

    // Update state immediately
    setAssignments(prev => ({
      ...prev,
      [cornerId]: []
    }));

    setAssignmentTimestamps(prev => {
      const next = { ...prev };
      studentIds.forEach(sid => delete next[sid]);
      return next;
    });

    // Record in background
    currentStudents.forEach(sid => {
      recordSessionEnd(sid, cornerId, Number(currentTimestamps[sid]), currentStudents);
    });
  };

  const resetBoard = (saveStats: boolean = true) => {
    // Capture current data for background recording
    const currentAssignments = { ...assignments };
    const currentTimestamps = { ...assignmentTimestamps };

    // Update state immediately
    setAssignments({});
    setAssignmentTimestamps({});
    setIsPaused(false);
    setPausedAt(null);

    // Record in background ONLY if saveStats is true
    if (saveStats) {
      Object.keys(currentAssignments).forEach(cid => {
        currentAssignments[cid]?.forEach(sid => {
          recordSessionEnd(sid, cid, Number(currentTimestamps[sid]), currentAssignments[cid]);
        });
      });
    }
  };

  const resumeBoard = () => {
    if (!isPaused || !pausedAt) {
      setIsPaused(false);
      setPausedAt(null);
      return;
    }
    const pauseDuration = Math.max(0, Date.now() - pausedAt);

    // Shift timestamps forward!
    setAssignmentTimestamps(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (typeof next[key] === 'number') {
          next[key] = next[key] + pauseDuration;
        }
      });
      return next;
    });

    setIsPaused(false);
    setPausedAt(null);
  };

  const [distributionFeedback, setDistributionFeedback] = useState<{name: string, reasons: string[]}[]>([]);

  const distributeStudents = (mode: 'random' | 'infrequent_corners' | 'infrequent_peers' | 'combined' | 'frequent') => {
    // 1. Reset Board
    resetBoard();
    
    // 2. Data Preparation
    const allStudents = students.filter(s => !absentStudentIds.includes(s.id));
    const activeCorners = corners.filter(c => c.isActive !== false);
    const unassignedReasons: {name: string, reasons: string[]}[] = [];
    
    // Shuffle students initially
    for (let i = allStudents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allStudents[i], allStudents[j]] = [allStudents[j], allStudents[i]];
    }

    // Stats calculations
    const studentCornerStats: Record<string, Record<string, number>> = {};
    const studentPeerStats: Record<string, Record<string, number>> = {};
    
    if (mode !== 'random') {
      interactionHistory.forEach(record => {
        record.students.forEach(sid => {
          if (!studentCornerStats[sid]) studentCornerStats[sid] = {};
          studentCornerStats[sid][record.cornerId] = (studentCornerStats[sid][record.cornerId] || 0) + 1;
          
          if (!studentPeerStats[sid]) studentPeerStats[sid] = {};
          record.students.forEach(otherSid => {
            if (sid !== otherSid) {
              studentPeerStats[sid][otherSid] = (studentPeerStats[sid][otherSid] || 0) + 1;
            }
          });
        });
      });
    }

    const newAssignments: Record<string, string[]> = {};
    const cornerCapacities: Record<string, number> = {};
    activeCorners.forEach(c => cornerCapacities[c.id] = c.capacity);

    allStudents.forEach(student => {
      const exclusion = exclusions.find(e => e.studentId === student.id);
      let rejectionReasons = new Set<string>();
      let hasCapacityIssues = false;
      
      let candidates = activeCorners.filter(c => {
        // 1. Check Capacity
        if (cornerCapacities[c.id] <= 0) {
          hasCapacityIssues = true;
          return false;
        }
        
        // 2. Check Corner Exclusions
        if (exclusion?.forbiddenCornerIds.includes(c.id)) {
          rejectionReasons.add(`Mag niet in ${c.name}`);
          return false;
        }
        
        // 3. Check Peer Exclusions
        const currentInCorner = newAssignments[c.id] || [];
        const forbiddenPeerId = currentInCorner.find(sid => 
          exclusion?.forbiddenStudentIds.includes(sid) ||
          exclusions.find(e => e.studentId === sid)?.forbiddenStudentIds.includes(student.id)
        );

        if (forbiddenPeerId) {
          const peer = students.find(s => s.id === forbiddenPeerId);
          rejectionReasons.add(`Mag niet bij ${peer?.name || 'deze leerling'}`);
          return false;
        }
        
        return true;
      });

      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;
          
          if (mode === 'infrequent_corners' || mode === 'combined' || mode === 'frequent') {
            scoreA += (studentCornerStats[student.id]?.[a.id] || 0);
            scoreB += (studentCornerStats[student.id]?.[b.id] || 0);
          }
          
          if (mode === 'infrequent_peers' || mode === 'combined' || mode === 'frequent') {
            const currentInA = newAssignments[a.id] || [];
            const currentInB = newAssignments[b.id] || [];
            currentInA.forEach(sid => scoreA += (studentPeerStats[student.id]?.[sid] || 0));
            currentInB.forEach(sid => scoreB += (studentPeerStats[student.id]?.[sid] || 0));
          }
          
          if (scoreA === scoreB) return Math.random() - 0.5;
          
          // For 'frequent', we want HIGHER scores first, so scoreB - scoreA
          // For 'infrequent/combined', we want LOWER scores first, so scoreA - scoreB
          return mode === 'frequent' ? scoreB - scoreA : scoreA - scoreB;
        });

        const chosen = candidates[0];
        if (!newAssignments[chosen.id]) newAssignments[chosen.id] = [];
        newAssignments[chosen.id].push(student.id);
        cornerCapacities[chosen.id]--;
      } else {
        const reasons = rejectionReasons.size > 0 
          ? Array.from(rejectionReasons) 
          : (hasCapacityIssues ? ["Geen vrije plek meer"] : ["Geen actieve hoeken gevonden"]);
        unassignedReasons.push({ name: student.name, reasons });
      }
    });

    const now = Date.now();
    const newTimestamps: Record<string, number> = {};
    Object.values(newAssignments).flat().forEach(sid => {
      newTimestamps[sid] = now;
      if (choiceSettings.startTimeEnabled) {
        newTimestamps[`START_${sid}`] = now;
      }
    });

    setAssignments(newAssignments);
    setAssignmentTimestamps(prev => ({ ...prev, ...newTimestamps }));
    setDistributionFeedback(unassignedReasons);
    setShowDistributionMenu(false);

    // Save to Firestore so it's persisted and other devices sync
    if (effectiveUid) {
      setDoc(doc(db, `users/${effectiveUid}/state/currentBoard`), {
        assignments: newAssignments,
        assignmentTimestamps: { ...assignmentTimestamps, ...newTimestamps },
        cornerHistory
      }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/state/currentBoard`));
    }
  };

  const handleLogout = async () => {
    // 1. Reset Board Actions (Capture current state)
    const currentAssignments = { ...assignments };
    const currentTimestamps = { ...assignmentTimestamps };

    // Update state immediately for local UI (optional since we're leaving)
    setAssignments({});
    setAssignmentTimestamps({});

    // 2. Persist to Firestore while still authenticated
    if (effectiveUid && hasLoadedBoard.current) {
      const boardState = {
        assignments: {},
        assignmentTimestamps: {},
        cornerHistory
      };
      
      try {
        // Force an immediate write and wait for it
        await setDoc(doc(db, `users/${effectiveUid}/state/currentBoard`), boardState, { merge: true });
        
        // Also record all active sessions as ended
        const recordingPromises: Promise<any>[] = [];
        Object.keys(currentAssignments).forEach(cid => {
          currentAssignments[cid].forEach(sid => {
            recordingPromises.push(recordSessionEnd(sid, cid, Number(currentTimestamps[sid]), currentAssignments[cid]));
          });
        });
        
        if (recordingPromises.length > 0) {
          await Promise.all(recordingPromises);
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${effectiveUid}/state/currentBoard`);
      }
    }

    // 3. Perform the actual logout
    await logout();
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  const checkUniqueness = (name: string, image: string | null, icon: string | null, excludeId: string | null, type: 'student' | 'corner') => {
    const normalizedName = name.trim().toLowerCase();
    
    if (!name.trim()) {
      return "Je bent vergeten een naam in te vullen. Voeg een naam toe.";
    }

    if (!image && !icon) {
      return "Je hebt nog geen afbeelding of symbool gekozen. Selecteer een afbeelding.";
    }

    if (type === 'student') {
      const isDuplicateName = students.some(s => s.id !== excludeId && s.name.trim().toLowerCase() === normalizedName);
      if (isDuplicateName) return "Deze naam is al in gebruik door een andere kleuter.";
      
      if (image || icon) {
        const isDuplicateSymbol = students.some(s => 
          s.id !== excludeId && 
          ((image && s.image === image) || (icon && s.icon === icon))
        );
        if (isDuplicateSymbol) return "Dit symbool is al in gebruik door een andere kleuter.";
      }
    } else {
      const currentCornerOnBoard = corners.find(c => c.id === excludeId);
      const relatedFixedId = currentCornerOnBoard?.fixedId;

      const isDuplicateInCorners = corners.some(c => 
        c.id !== excludeId && 
        c.fixedId !== excludeId && 
        c.name.trim().toLowerCase() === normalizedName
      );
      
      const isDuplicateInFixed = fixedCorners.some(c => 
        c.id !== excludeId && 
        c.id !== relatedFixedId &&
        c.name.trim().toLowerCase() === normalizedName
      );
      
      if (isDuplicateInCorners || isDuplicateInFixed) return "Deze hoeknaam is al in gebruik.";
      
      if (image || icon) {
        const isDuplicateSymbol = 
          corners.some(c => 
            c.id !== excludeId && 
            c.fixedId !== excludeId && 
            ((image && c.image === image) || (icon && c.icon === icon))
          ) ||
          fixedCorners.some(c => 
            c.id !== excludeId && 
            c.id !== relatedFixedId && 
            ((image && c.image === image) || (icon && c.icon === icon))
          );
          
        if (isDuplicateSymbol) return "Dit symbool is al in gebruik door een andere hoek.";
      }
    }

    return null;
  };

  const addCorner = async (name: string, capacity: number, icon: string | null, image: string | null, color: string) => {
    const error = checkUniqueness(name, image, icon, editingCorner?.id || null, 'corner');
    if (error) {
      setValidationError(error);
      return;
    }

    if (!user) return;

    const cornerData = {
      name,
      capacity,
      icon: icon || null,
      image: image || null,
      color,
      fixedId: editingCorner?.fixedId || null
    };

    if (editingCorner) {
      const id = editingCorner.id;
      try {
        await setDoc(doc(db, `users/${effectiveUid}/corners`, id), { ...cornerData, id }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/corners/${id}`);
      }
      
      // Sync back to fixed corners
      if (editingCorner.fixedId) {
        setFixedCorners(prev => prev.map(fc => {
          if (fc.id === editingCorner.fixedId) {
            return { ...fc, capacity, color, name, icon: icon || null, image: image || null };
          }
          return fc;
        }));
      }

      setEditingCorner(null);
    } else {
      const id = `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      try {
        await setDoc(doc(db, `users/${effectiveUid}/corners`, id), { ...cornerData, id });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/corners`);
      }
    }
    
    if (image) {
      setAllCustomImages(prev => [image, ...prev.filter(img => img !== image)].slice(0, 10));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const currentlyFullscreen = !!document.fullscreenElement;
      
      // If we just exited and it wasn't intentional (e.g. Esc key, swipe, browser button)
      if (!currentlyFullscreen && isFullscreen && !isExitingRef.current) {
        setPendingFullscreenExit(true);
        setMathProblem(generateMathProblem());
        setMathInput('');
      }
      
      setIsFullscreen(currentlyFullscreen);
      if (!currentlyFullscreen) {
        isExitingRef.current = false;
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        // Try to prevent default and stop propagation
        e.preventDefault();
        e.stopPropagation();
        
        // Try to re-request fullscreen immediately to "cancel" the exit
        if (document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        
        if (!pendingFullscreenExit) {
          setPendingFullscreenExit(true);
          setMathProblem(generateMathProblem());
          setMathInput('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isFullscreen, pendingFullscreenExit]);

  const toggleFullscreen = (bypassCheck = false) => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen().catch(e => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
    } else {
      if (bypassCheck) {
        isExitingRef.current = true;
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(err => {
            console.error(`Error attempting to exit full-screen mode: ${err.message}`);
          });
        }
      } else {
        setPendingFullscreenExit(true);
        setMathProblem(generateMathProblem());
        setMathInput('');
      }
    }
  };

  const submitFullscreenExit = () => {
    if (parseInt(mathInput) === mathProblem?.answer) {
      isExitingRef.current = true;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      setPendingFullscreenExit(false);
      setMathProblem(null);
      setMathInput('');
    } else {
      setSecurityStatus('error');
      setTimeout(() => {
        setPendingFullscreenExit(false);
        setMathProblem(null);
        setMathInput('');
        setSecurityStatus('idle');
        // Force back to fullscreen if we were kicked out
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {
            setMustRestoreFullscreen(true);
          });
        }
      }, 1000);
    }
  };

  const [pendingSecurityAction, setPendingSecurityAction] = useState<{
    action: () => void;
    onCancel?: () => void;
    problem: { a: number; b: number; op: string; answer: number };
    needsExtraWarning?: boolean;
  } | null>(null);
  const [showExtraWarning, setShowExtraWarning] = useState(false);
  const [securityInput, setSecurityInput] = useState('');
  const [securityStatus, setSecurityStatus] = useState<'idle' | 'error'>('idle');

  const confirmWithMath = (action: () => void, forceShow: boolean = false, difficulty: 'easy' | 'hard' = 'easy', needsExtraWarning: boolean = false, onCancel?: () => void) => {
    if (isAdmin && !forceShow && !needsExtraWarning) {
      action();
      return;
    }
    setPendingSecurityAction({
      action,
      onCancel,
      problem: generateMathProblem(difficulty === 'hard' ? 100 : 10),
      needsExtraWarning
    });
    setSecurityInput('');
    setSecurityStatus('idle');
    setShowExtraWarning(false);
  };

  const deleteCorner = async (id: string) => {
    if (!effectiveUid) return;
    try {
      await deleteDoc(doc(db, `users/${effectiveUid}/corners`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${effectiveUid}/corners/${id}`);
    }
    
    const newAssignments = { ...assignments };
    if (newAssignments[id]) {
      delete newAssignments[id];
      setAssignments(newAssignments);
    }
  };

  const deleteFixedCorner = (id: string) => {
    confirmWithMath(() => {
      const cornerToRemove = fixedCorners.find(c => c.id === id);
      if (!cornerToRemove) return;

      // Remove from fixed corners
      setFixedCorners(fixedCorners.filter(c => c.id !== id));

      // Clean up exclusions
      setExclusions(prev => prev.map(ex => ({
        ...ex,
        forbiddenCornerIds: ex.forbiddenCornerIds.filter(cid => cid !== id)
      })));

      // Remove from analytics history as requested
      // We match by name and icon/image to be sure we catch all instances
      setInteractionHistory(prev => prev.filter(record => 
        record.cornerName !== cornerToRemove.name || 
        (record.cornerIcon !== cornerToRemove.icon && record.cornerImage !== cornerToRemove.image)
      ));
    }, true, 'hard', true);
  };

  const addFixedCorner = async (name: string, capacity: number, icon: string | null, image: string | null, color: string) => {
    const error = checkUniqueness(name, image, icon, editingFixedCorner?.id || null, 'corner');
    if (error) {
      setValidationError(error);
      return;
    }

    if (editingFixedCorner) {
      setFixedCorners(fixedCorners.map(c => c.id === editingFixedCorner.id ? {
        ...c,
        name,
        capacity,
        icon: icon || null,
        image: image || null,
        color
      } : c));
      
      // Sync to board corners
      if (effectiveUid && !isSatellite) { // Ensure only owner updates these
        const boardCornersToUpdate = corners.filter(c => c.fixedId === editingFixedCorner.id);
        const updatePromises = boardCornersToUpdate.map(c => {
          const updatedCorner = { 
            ...c, 
            name, 
            capacity, 
            color, 
            icon: icon || null, 
            image: image || null 
          };
          return setDoc(doc(db, `users/${effectiveUid}/corners`, c.id), updatedCorner, { merge: true });
        });
        try {
          await Promise.all(updatePromises);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/corners`);
        }
      }

      setEditingFixedCorner(null);
    } else {
      const newCorner: Corner = {
        id: `fixed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        capacity,
        icon: icon || null,
        image: image || null,
        color
      };
      setFixedCorners([...fixedCorners, newCorner]);
    }
    
    if (image) {
      setAllCustomImages(prev => [image, ...prev.filter(img => img !== image)].slice(0, 10));
    }
    
    setIsAddingFixedCorner(false);
  };

  const addStudent = async (name: string, color: string, icon: string | null, image: string | null) => {
    const error = checkUniqueness(name, image, icon, editingStudent?.id || null, 'student');
    if (error) {
      setValidationError(error);
      return;
    }

    if (!user) return;

    const studentData = {
      name,
      avatarColor: color.includes('bg-') ? color.replace('-400', '-500') : color,
      icon: icon || null,
      image: image || null
    };

    if (editingStudent) {
      const id = editingStudent.id;
      try {
        await setDoc(doc(db, `users/${effectiveUid}/students`, id), { ...studentData, id }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/students/${id}`);
      }
      setEditingStudent(null);
    } else {
      const id = `s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      try {
        await setDoc(doc(db, `users/${effectiveUid}/students`, id), { ...studentData, id });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/students`);
      }
      setIsAddingStudent(false); // Close modal after creating new student
    }

    if (image) {
      setAllCustomImages(prev => [image, ...prev.filter(img => img !== image)].slice(0, 10));
    }

    setIsAddingStudent(false);
  };

  const deleteStudent = (id: string) => {
    confirmWithMath(async () => {
      if (!effectiveUid) return;
      try {
        await deleteDoc(doc(db, `users/${effectiveUid}/students`, id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${effectiveUid}/students/${id}`);
      }
      unassignStudent(id);
      
      // Clean up interaction history
      setInteractionHistory(prev => prev.filter(r => !r.students.includes(id)));
      
      // Clean up evaluations
      setEvaluations(prev => prev.filter(e => e.studentId !== id));
      
      // Clean up exclusions
      setExclusions(prev => prev.filter(ex => ex.studentId !== id).map(ex => ({
        ...ex,
        forbiddenStudentIds: ex.forbiddenStudentIds.filter(fid => fid !== id),
        isTwoWay: Object.fromEntries(Object.entries(ex.isTwoWay).filter(([fid]) => fid !== id))
      })));
    }, true, 'hard', true);
  };

  const handleStudentClick = (studentId: string) => {
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
    } else {
      setSelectedStudentId(studentId);
    }
  };

  const [attendanceViewMode, setAttendanceViewMode] = useState<'day' | 'week' | 'custom' | 'individual'>('day');
  const [selectedAttendanceStudentId, setSelectedAttendanceStudentId] = useState<string | null>(null);

  const getAttendanceStats = (mode: 'week' | 'custom') => {
    const now = new Date();
    const historyEntries = Object.entries(attendanceHistory);
    let filteredEntries = historyEntries;

    if (mode === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(now.getDate() - 7);
      const threshold = lastWeek.toISOString().split('T')[0];
      filteredEntries = historyEntries.filter(([date]) => date >= threshold);
    } else if (mode === 'custom') {
      filteredEntries = historyEntries.filter(([date]) => date >= attendanceStartDate && date <= attendanceEndDate);
    }

    const absenceCounts: Record<string, number> = {};
    students.forEach(s => absenceCounts[s.id] = 0);
    
    filteredEntries.forEach(([, absentIds]) => {
      (absentIds as string[]).forEach(id => {
        if (absenceCounts[id] !== undefined) absenceCounts[id]++;
      });
    });

    return filteredEntries.length > 0 
      ? Object.entries(absenceCounts)
          .sort((a, b) => b[1] - a[1]) // highest absence first
          .map(([id, count]) => ({ 
            student: students.find(s => s.id === id), 
            count, 
            percentage: Math.round((count / filteredEntries.length) * 100) 
          }))
          .filter(stat => stat.student)
      : [];
  };

  if (loading || (effectiveUid && !isDataLoaded)) {
    let message = 'Even geduld alsjeblieft...';
    if (pairingError) {
      message = `Fout bij koppelen: ${pairingError}`;
    } else if (isSatellite && !pairingCompleted) {
      message = isPairing ? (pairingStatus || 'Bezig met koppelen...') : 'Initialiseren...';
    } else if (isSatellite && pairingCompleted && !isDataLoaded) {
      message = 'Data ophalen...';
    }
    return <LoadingScreen message={message} />;
  }

  const isVerified = user ? user.emailVerified : true;

  if (!user && !syncId) {
    return <Login />;
  }

  if (user && !isVerified && !syncId) {
    return <Login />;
  }

  return (
    <div className="h-screen bg-[#F8F9FA] text-gray-800 font-sans p-1 md:p-2 select-none flex flex-col overflow-hidden">
      {/* Header */}
      <header className="max-w-7xl w-full mx-auto flex flex-col items-center mb-1 gap-1 flex-shrink-0 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-1 w-full flex-wrap justify-center md:justify-start shrink-0">
          <div className="flex items-center gap-1 flex-wrap">
            {!isSatellite && (
              <button 
                onClick={() => isAdmin ? setIsAdmin(false) : confirmWithMath(() => setIsAdmin(true), true)}
                className={`flex md:hidden items-center gap-1 px-2 py-1 rounded-md transition-all shadow-sm font-black border text-[9px] ${
                  isAdmin 
                    ? 'bg-orange-500 border-orange-600 text-white shadow-orange-200' 
                    : 'bg-white border-gray-100 text-gray-500'
                }`}
              >
                <Settings size={10} className={isAdmin ? 'animate-spin-slow' : ''} />
                <span>{isAdmin ? 'Keuzebord' : 'Beheer'}</span>
              </button>
            )}
            <button 
              onClick={() => confirmWithMath(() => setShowResetOptionsModal(true), true)}
              className="flex items-center gap-1 px-1.5 py-1 bg-white border border-gray-100 rounded-md hover:border-red-200 hover:bg-red-50 transition-all text-gray-500 font-black shadow-sm group text-[8px]"
              title="Reset het bord"
            >
              <RotateCcw size={10} strokeWidth={3} className="group-hover:rotate-[-45deg] transition-transform" />
              <span className="inline">Reset</span>
            </button>
            <button 
              onClick={() => {
                if (isPaused) {
                  confirmWithMath(resumeBoard, true);
                } else {
                  confirmWithMath(() => {
                    setIsPaused(true);
                    setPausedAt(Date.now());
                  }, true);
                }
              }}
              className={`flex items-center gap-1 px-1.5 py-1 border rounded-md transition-all font-black shadow-sm group text-[8px] ${
                isPaused 
                  ? 'bg-amber-500 border-amber-600 hover:bg-amber-600 text-white shadow-amber-200' 
                  : 'bg-white border-gray-100 hover:border-amber-200 hover:bg-amber-50 text-gray-500'
              }`}
              title={isPaused ? "Hervat het spel" : "Pauzeer het bord"}
            >
              {isPaused ? (
                <Play size={10} strokeWidth={3} className="text-white group-hover:scale-110 transition-transform" />
              ) : (
                <Pause size={10} strokeWidth={3} className="text-amber-500 group-hover:scale-110 transition-transform" />
              )}
              <span className="inline">{isPaused ? 'Hervat' : 'Pauze'}</span>
            </button>
            <button 
              onClick={() => confirmWithMath(() => setShowDistributionMenu(true), true)}
              className="flex items-center gap-1 px-1.5 py-1 bg-white border border-gray-100 rounded-md hover:border-emerald-200 hover:bg-emerald-50 transition-all text-gray-500 font-black shadow-sm group text-[8px]"
              title="Reset & Verdeel"
            >
              <Shuffle size={10} strokeWidth={3} className="group-hover:scale-110 transition-transform text-emerald-500" />
              <span className="inline">Verdeel</span>
            </button>
            <div className="flex items-center bg-white border border-gray-100 rounded-md overflow-hidden shadow-sm">
              <button 
                onClick={() => confirmWithMath(() => {
                  resetBoard();
                  setChoiceProcessIndex(0);
                  setSkippedStudentIds([]);
                  setShowChoiceProcess(true);
                }, true)}
                className="flex items-center gap-1 px-1.5 py-1 hover:bg-indigo-50 transition-all text-gray-500 font-black group text-[8px] border-r border-gray-100"
                title="Start Keuzenproces"
              >
                <Play size={10} strokeWidth={3} className="group-hover:scale-110 transition-transform text-indigo-500" />
                <span className="inline uppercase">Kies</span>
              </button>
              <button 
                onClick={() => confirmWithMath(() => setShowChoiceSettings(true), true, 'easy')}
                className="p-1 hover:bg-gray-50 text-gray-400 hover:text-indigo-500 transition-all"
                title="Instellingen Keuzenproces"
              >
                <Settings2 size={10} strokeWidth={3} />
              </button>
            </div>
            <button 
              onClick={() => confirmWithMath(() => setShowReflectionBoard(true), true, 'easy')}
              className="flex items-center gap-1 px-1.5 py-1 bg-white border border-gray-100 rounded-md hover:border-indigo-200 hover:bg-indigo-50 transition-all text-gray-500 font-black shadow-sm group text-[8px]"
              title="Reflectiebord"
            >
              <ClipboardList size={10} strokeWidth={3} className="group-hover:scale-110 transition-transform text-indigo-500" />
              <span className="inline">Reflectie</span>
            </button>
            <button 
              onClick={() => {
                if (isFullscreen) {
                  confirmWithMath(() => toggleFullscreen(true), true, 'easy');
                } else {
                  toggleFullscreen();
                }
              }}
              className={`flex items-center gap-1 px-1.5 py-1 rounded-md transition-all shadow-sm font-black border text-[8px] ${
                isFullscreen 
                  ? 'bg-purple-500 border-purple-600 text-white shadow-purple-200' 
                  : 'bg-white border-gray-100 text-gray-500 hover:border-purple-200'
              }`}
              title="Volledig scherm"
            >
              {isFullscreen ? <Minimize size={10} strokeWidth={3} /> : <Maximize size={10} strokeWidth={3} />}
              <span className="inline">{isFullscreen ? 'Venster' : 'Full'}</span>
            </button>
          </div>

          <div className="flex gap-1 items-center ml-auto">
            {!isSatellite && (
              <button 
                onClick={() => isAdmin ? setIsAdmin(false) : confirmWithMath(() => setIsAdmin(true), true)}
                className={`hidden md:flex items-center gap-1 px-1.5 py-1 rounded-md transition-all shadow-sm font-black border text-[8px] ${
                  isAdmin 
                    ? 'bg-orange-500 border-orange-600 text-white shadow-orange-200' 
                    : 'bg-white border-gray-100 text-gray-500 hover:border-orange-200'
                }`}
              >
                <Settings size={10} className={isAdmin ? 'animate-spin-slow' : ''} />
                <span>{isAdmin ? 'Keuzebord' : 'Beheer'}</span>
              </button>
            )}


            {isAdmin && !isSatellite && (
              <UserMenu 
                history={interactionHistory}
                students={students}
                corners={corners}
                evaluations={evaluations}
                customEvaluationTypes={customEvaluationTypes}
                attendanceHistory={attendanceHistory}
                moetjes={moetjes}
                moetjeEvaluations={moetjeEvaluations}
                choiceSettings={choiceSettings}
                exclusions={exclusions}
                fixedCorners={fixedCorners}
                allCustomImages={allCustomImages}
                cornerHistory={cornerHistory}
                moetjeHistory={moetjeHistory}
                onLogout={handleLogout}
                onDeleteData={openGDPRModal}
                isOwner={!isSatellite}
              />
            )}

            {isSatellite && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-600 font-black shadow-sm text-[8px]">
                <MonitorSmartphone size={10} strokeWidth={3} />
                <span>Gedownload</span>
              </div>
            )}
          </div>
        </div>

        {isAdmin && !isSatellite && (
          <div className="flex items-center gap-1 w-full flex-wrap justify-center md:justify-start pb-1 md:pb-0 shrink-0 lg:ml-2">
            <div className="flex gap-1 shrink-0 flex-wrap justify-center md:justify-start">
              <button 
                onClick={() => setShowSyncModal(true)}
                className="flex items-center gap-1 px-1.5 py-1 bg-white border border-gray-100 rounded-md hover:border-indigo-200 hover:bg-indigo-50 transition-all text-gray-500 font-black shadow-sm group text-[8px]"
              >
                <QrCode size={10} strokeWidth={3} className="text-indigo-500" />
                <span>Koppel</span>
              </button>
              <button 
                onClick={() => setShowAttendanceOverview(true)}
                className="flex items-center gap-1 px-1.5 py-1 bg-white border border-gray-100 rounded-md hover:border-red-200 hover:bg-red-50 transition-all text-gray-500 font-black shadow-sm group text-[8px]"
              >
                <UserX size={10} strokeWidth={3} className="text-red-500" />
                <span>Afwezig</span>
              </button>
              <button 
                onClick={() => setShowAnalytics(true)}
                className="flex items-center gap-1 px-1.5 py-1 bg-white border border-gray-100 rounded-md hover:border-blue-200 hover:bg-blue-50 transition-all text-gray-500 font-black shadow-sm group text-[8px]"
              >
                <BarChart3 size={10} strokeWidth={3} className="text-blue-500" />
                <span>Stats</span>
              </button>
              <button 
                onClick={() => setShowEvaluationSettings(true)}
                className="flex items-center gap-1 px-1.5 py-1 bg-white border border-gray-100 rounded-md hover:border-orange-200 hover:bg-orange-50 transition-all text-gray-500 font-black shadow-sm group text-[8px]"
              >
                <Heart size={10} strokeWidth={3} className="text-red-500" />
                <span>Evaluatie</span>
              </button>
              <button 
                onClick={() => setShowExclusionModal(true)}
                className="flex items-center gap-1 px-1.5 py-1 bg-white border border-gray-100 rounded-md hover:border-purple-200 hover:bg-purple-50 transition-all text-gray-500 font-black shadow-sm group text-[8px]"
              >
                <ShieldAlert size={10} strokeWidth={3} className="text-purple-500" />
                <span>Uitsluit</span>
              </button>
              <button 
                onClick={() => setShowMoetjesbordSettings(true)}
                className="flex items-center gap-1 px-1.5 py-1 bg-white border border-gray-100 rounded-md hover:border-amber-200 hover:bg-amber-50 transition-all text-gray-500 font-black shadow-sm group text-[8px]"
              >
                <ClipboardList size={10} strokeWidth={3} className="text-amber-500" />
                <span>Moetjes</span>
              </button>
            </div>
            
            <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-md px-1.5 py-0.5 shadow-sm">
              <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">Klas:</span>
              <input 
                type="number" 
                value={totalStudentSlots} 
                onChange={(e) => updateSettings({ totalStudentSlots: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-10 bg-transparent outline-none font-black text-[10px] text-gray-700 text-center"
              />
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-md px-1.5 py-0.5 shadow-sm shrink-0">
              <Hourglass size={10} strokeWidth={3} className="text-gray-400" />
              <input 
                type="number" 
                value={minPlayTime} 
                onChange={(e) => updateSettings({ minPlayTime: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-10 bg-transparent outline-none font-black text-[10px] text-gray-700 text-center"
              />
            </div>
            <div className="flex items-center bg-white border border-gray-100 rounded-md px-1 py-0.5 shadow-sm shrink-0 min-w-[70px]">
              <select 
                value={displayMode}
                onChange={(e) => updateSettings({ displayMode: e.target.value as any })}
                className="bg-transparent outline-none font-black text-[8px] text-gray-700 appearance-none cursor-pointer w-full text-center"
              >
                <option value="names">Naam</option>
                <option value="both">Beide</option>
                <option value="pictos">Picto</option>
              </select>
            </div>
          </div>
        )}
      </header>

      <main className="w-full mx-auto flex flex-col md:flex-row gap-2 sm:gap-4 flex-1 min-h-0 overflow-hidden px-1 sm:px-2 pb-2">
        {isPaused ? (
          <div className="flex-1 w-full flex flex-col items-center justify-center p-4 text-center select-none animate-in fade-in zoom-in-95 duration-500">
            <div className="max-w-md w-full p-8 bg-white rounded-[2rem] border-4 border-amber-500 space-y-6 shadow-sm">
              <div>
                <div className="w-20 h-20 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-pulse">
                  <div className="flex items-center gap-1.5 justify-center">
                    <div className="w-2.5 h-8 bg-white rounded-full"></div>
                    <div className="w-2.5 h-8 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Ssst... het is speeltijd</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Het keuzebord is gepauzeerd
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => confirmWithMath(resumeBoard, true)}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-650 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-b-4 border-amber-700 active:translate-y-0.5 active:border-b-2 cursor-pointer shadow-md"
                >
                  <Play size={14} fill="currentColor" className="text-white" />
                  <span>Hervat het spel</span>
                </button>
                <p className="text-[10px] font-bold text-gray-400 italic mt-3">"Alleen voor de juf of meester (met verificatiesom)"</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Left: Unassigned Students */}
        {!isMoetjesbordView && !showDistributionMenu && (
          <section className="w-full md:w-[22%] lg:w-[18%] h-[25%] md:h-full flex-shrink-0 flex flex-col min-h-0 overflow-hidden">
            <div className="bg-white p-2 rounded-xl border-2 border-gray-100 shadow-lg shadow-gray-200/30 relative overflow-hidden flex flex-col h-full">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500" />
              
              <div className="flex flex-col h-full gap-1 overflow-hidden">
                <div className="flex items-center justify-between mb-1 flex-shrink-0 pt-1 px-1">
                  <h2 className="text-[10px] font-black flex items-center gap-1.5 text-gray-900 uppercase tracking-wider">
                    <Users className="text-blue-500" size={12} strokeWidth={3} />
                    Klas
                  </h2>
                  <div className="relative">
                    <button 
                      onClick={() => setShowColorFilter(!showColorFilter)}
                      className={`flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md text-[8px] font-black transition-all hover:bg-blue-100 ${classColorFilter ? 'ring-2 ring-blue-500 shadow-sm' : ''}`}
                    >
                      {students.length}
                      <ChevronDown size={8} className={`transition-transform ${showColorFilter ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {showColorFilter && (
                        <div key="color-filter-root">
                          <div key="color-filter-overlay" className="fixed inset-0 z-40" onClick={() => setShowColorFilter(false)} />
                          <motion.div 
                            key="color-filter-modal"
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-2xl border-2 border-gray-100 p-2 min-w-[100px]"
                          >
                            <div className="flex flex-col gap-1">
                              <button 
                                onClick={() => { setClassColorFilter(null); setShowColorFilter(false); }}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[8px] font-black transition-all ${!classColorFilter ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                              >
                                <RotateCcw size={10} />
                                <span>Alle kleuren</span>
                              </button>
                              <div className="h-px bg-gray-100 my-1" />
                              <div className="grid grid-cols-4 gap-1">
                                 {(Array.from(new Set(students.map(s => s.avatarColor))) as string[]).map((color, cidx) => (
                                  <button 
                                    key={`filter-color-${color}-${cidx}`}
                                    onClick={() => { setClassColorFilter(color === classColorFilter ? null : color); setShowColorFilter(false); }}
                                    className={`w-6 h-6 rounded-md ${color} border-2 transition-all ${classColorFilter === color ? 'border-blue-500 scale-110 shadow-md ring-2 ring-blue-100' : 'border-white hover:scale-105 shadow-sm'}`}
                                    title={color.replace('bg-', '').replace('-500', '').toUpperCase()}
                                  />
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                  <div 
                    className="flex-1 bg-gray-50/50 rounded-xl overflow-hidden p-1 sm:p-2"
                  >
                    <div 
                      className="grid h-full w-full gap-x-1 sm:gap-x-2 gap-y-1 sm:gap-y-2 items-center justify-items-center"
                      style={{
                        gridTemplateColumns: `repeat(${windowSize.width < 768 ? 4 : windowSize.width < 1200 ? 2 : 3}, 1fr)`,
                        gridTemplateRows: `repeat(${Math.ceil(Math.max(students.length, totalStudentSlots) / (windowSize.width < 768 ? 4 : windowSize.width < 1200 ? 2 : 3))}, 1fr)`,
                      }}
                    >
                      {Array.from({ length: Math.max(students.length, totalStudentSlots) }).map((_, idx) => {
                        const student = students[idx];
                        const totalCount = Math.max(students.length, totalStudentSlots);
                        const isMobile = windowSize.width < 768;

                        const cols = isMobile ? 4 : windowSize.width < 1200 ? 2 : 3;
                        const rows = Math.ceil(totalCount / cols);
                        
                        // Reference height for items based on viewport with slightly more accurate padding deduction
                        const headerHeight = isAdmin ? 80 : 60;
                        const mainPadding = 32;
                        const sectionHeight = isMobile ? (windowSize.height * 0.28) : (windowSize.height - headerHeight - mainPadding);
                        const itemHeight = Math.floor(sectionHeight / rows);
                        const iconSize = displayMode === 'pictos' ? Math.min(itemHeight * 0.85, 64) : Math.min(itemHeight * 0.6, 42);
                        const baseFontSize = Math.min(itemHeight * 0.22, 11);


                          if (!student) {
                            return isAdmin ? (
                              <button 
                                key={`empty-slot-${idx}`}
                                onClick={() => setIsAddingStudent(true)}
                                style={{ height: `${itemHeight}px` }}
                                className="w-full rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-200 hover:border-blue-100 hover:text-blue-200 transition-all hover:bg-blue-50/30 group"
                              >
                                <Plus size={iconSize * 0.4} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                              </button>
                            ) : (
                              <div key={`empty-slot-${idx}`} style={{ height: `${itemHeight}px` }} className="w-full rounded-2xl border-2 border-dashed border-gray-50 bg-gray-50/30" />
                            );
                          }

                          const isAssigned = assignedStudentIds.includes(student.id);
                          const isFiltered = classColorFilter && student.avatarColor !== classColorFilter;
                          
                          // Improved font scaling and truncation logic
                          const getStudentDisplayName = (name: string) => {
                            if (displayMode === 'names') return name; // Show full name in names-only mode
                            if (name.length <= 18) return name;
                            return name.substring(0, 16) + '...';
                          };

                          const getDynamicFontSize = (name: string, base: number) => {
                            const len = name.length;
                            let factor = 1;
                            if (len <= 5) factor = 1.3; 
                            else if (len <= 8) factor = 1.1;
                            else if (len <= 12) factor = 0.9;
                            else if (len <= 15) factor = 0.75;
                            else factor = 0.65;
                            
                            // More aggressive scaling for names-only mode to avoid overflow in the class bar
                            if (displayMode === 'names') {
                               if (len > 12) {
                                 factor = Math.max(0.3, factor * (12 / len));
                               }
                            }
                            
                            return base * factor;
                          };

                          const currentFontSize = getDynamicFontSize(student.name, baseFontSize);

                          return (
                            <motion.div
                              key={`klasbalk-${student.id}-${idx}`}
                              layout
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ 
                                opacity: isFiltered ? 0.1 : 1, 
                                scale: isFiltered ? 0.9 : 1,
                                filter: isFiltered ? 'grayscale(1)' : 'none'
                              }}
                              onClick={() => !isAssigned && !isFiltered && handleStudentClick(student.id)}
                              style={{ height: `${itemHeight}px` }}
                              className={`group relative flex flex-col items-center justify-center w-full transition-all duration-300 ${isAssigned ? 'grayscale opacity-40' : ''}`}
                            >
                              <div className="flex flex-col items-center justify-center h-full w-full py-1">
                                {(displayMode === 'both' || displayMode === 'pictos') && (
                                  <div 
                                    style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                                    className={`
                                      rounded-full border-2 md:border-4 shrink-0
                                      ${isAssigned ? 'border-gray-300 bg-gray-200' : `${getBorderClass(student.avatarColor)} ${student.avatarColor}`}
                                      flex items-center justify-center shadow-sm
                                      cursor-pointer transition-all duration-300
                                      ${selectedStudentId === student.id ? 'ring-4 ring-blue-500 scale-110 z-10' : 'hover:scale-105'}
                                      overflow-hidden
                                    `}
                                  >
                                    {student.image ? (
                                      <img src={student.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : student.icon && ICON_MAP[student.icon] ? (
                                      (() => {
                                        const Icon = ICON_MAP[student.icon!];
                                        return <Icon size={iconSize * 0.6} strokeWidth={3} className="text-white" />;
                                      })()
                                    ) : (
                                      <span className="font-black text-white" style={{ fontSize: `${iconSize * 0.4}px` }}>{student.name[0]}</span>
                                    )}
                                  </div>
                                )}
                                {(displayMode === 'both' || displayMode === 'names') && (
                                  <div className={`w-full ${displayMode === 'names' ? 'flex-1 flex items-center justify-center' : 'h-[1.3em] flex items-center justify-center mt-0.5'}`}>
                                    <span 
                                      className={`font-black block text-center tracking-tight leading-none px-1 ${isAssigned ? 'text-gray-400' : 'text-gray-950'} ${displayMode === 'names' ? 'whitespace-nowrap' : 'truncate'}`}
                                      style={{ fontSize: `${displayMode === 'names' ? currentFontSize * 1.5 : currentFontSize}px` }}
                                      title={student.name}
                                    >
                                      {getStudentDisplayName(student.name)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {isAdmin && (
                                <div className={`absolute top-0 right-0 flex flex-col gap-1 ${isAdmin ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-20`}>
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setStudentForColorEdit(student);
                                    }}
                                    className="p-1 rounded-full shadow-lg border-2 border-white bg-blue-500 hover:bg-blue-600 text-white transition-all"
                                    title="Kleur aanpassen"
                                  >
                                    <Palette size={10} strokeWidth={4} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); deleteStudent(student.id); }}
                                    className="bg-red-500 text-white p-1 rounded-full shadow-lg border-2 border-white hover:bg-red-600 transition-colors"
                                    title="Verwijderen"
                                  >
                                    <X size={10} strokeWidth={4} />
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>


          </section>
        )}

        {/* Right: Choice Grid */}
        <section className={`${isMoetjesbordView ? 'w-full' : 'md:w-[78%] lg:w-[82%]'} flex flex-col min-h-0 h-[70%] md:h-full relative pb-20 overflow-visible`}>
          {isMoetjesbordView ? (
            <MoetjesbordView 
              moetjes={moetjes}
              students={students}
              evaluations={moetjeEvaluations}
              onEvaluate={handleMoetjeEvaluate}
              onResetMoetje={recordMoetjeReset}
              onClose={() => setIsMoetjesbordView(false)}
              isAdmin={isAdmin}
              onAddMoetje={() => { setEditingMoetje(null); setIsAddingMoetje(true); }}
              onEditMoetje={(m) => { setEditingMoetje(m); setIsAddingMoetje(true); }}
              onDeleteMoetje={(id) => confirmWithMath(() => deleteMoetje(id), true)}
              onToggleMoetje={toggleMoetje}
              evalType={evaluationType}
              customEvalTypes={customEvaluationTypes}
              displayMode={displayMode}
            />
          ) : (
          <div 
            className={`grid gap-2 pb-2 px-2 flex-1 min-h-0 overflow-visible ${
              (() => {
                const totalBoardItems = corners.length + (isAdmin ? 1 : 0) + (isMoetjesbordEnabled ? 1 : 0);
                const ratio = windowSize.width / windowSize.height;
                
                if (ratio > 1.5) { // Wide screen
                  if (totalBoardItems <= 4) return 'grid-cols-4';
                  if (totalBoardItems <= 8) return 'grid-cols-4';
                  if (totalBoardItems <= 12) return 'grid-cols-4';
                  if (totalBoardItems <= 15) return 'grid-cols-5';
                  if (totalBoardItems <= 20) return 'grid-cols-5';
                  return 'grid-cols-6';
                } else if (ratio < 0.8) { // Tall screen (mobile portrait)
                  if (totalBoardItems <= 2) return 'grid-cols-1';
                  if (totalBoardItems <= 4) return 'grid-cols-2';
                  if (totalBoardItems <= 6) return 'grid-cols-2';
                  if (totalBoardItems <= 9) return 'grid-cols-3';
                  if (totalBoardItems <= 12) return 'grid-cols-3';
                  return 'grid-cols-4';
                } else { // Square-ish
                  if (totalBoardItems <= 4) return 'grid-cols-2';
                  if (totalBoardItems <= 6) return 'grid-cols-3';
                  if (totalBoardItems <= 9) return 'grid-cols-3';
                  if (totalBoardItems <= 12) return 'grid-cols-4';
                  if (totalBoardItems <= 16) return 'grid-cols-4';
                  return 'grid-cols-5';
                }
              })()
            }`}
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(${(() => {
                const totalBoardItems = corners.length + (isAdmin ? 1 : 0) + (isMoetjesbordEnabled ? 1 : 0);
                const ratio = windowSize.width / windowSize.height;
                let cols = 4;
                if (ratio > 1.5) {
                  if (totalBoardItems <= 4) cols = 4;
                  else if (totalBoardItems <= 12) cols = 4;
                  else if (totalBoardItems <= 20) cols = 5;
                  else cols = 6;
                } else if (ratio < 0.8) {
                  if (totalBoardItems <= 2) cols = 1;
                  else if (totalBoardItems <= 6) cols = 2;
                  else if (totalBoardItems <= 12) cols = 3;
                  else cols = 4;
                } else {
                  if (totalBoardItems <= 4) cols = 2;
                  else if (totalBoardItems <= 9) cols = 3;
                  else if (totalBoardItems <= 16) cols = 4;
                  else cols = 5;
                }
                return Math.ceil(totalBoardItems / cols);
              })()}, 1fr)`,
              height: '100%',
              maxHeight: '100%',
              transform: 'scale(0.97)',
              transformOrigin: 'top center'
            }}
          >
            <AnimatePresence mode="popLayout">
              {corners.map((corner, idx) => {
                const cornerStudents = (assignments[corner.id] || [])
                  .map(id => students.find(s => s.id === id))
                  .filter(Boolean) as Student[];
                
                const isFull = cornerStudents.length >= corner.capacity;
                
                const isCornerExcluded = selectedStudentId && exclusions.some(ex => 
                  ex.studentId === selectedStudentId && 
                  (ex.forbiddenCornerIds.includes(corner.id) || (corner.fixedId && ex.forbiddenCornerIds.includes(corner.fixedId)))
                );

                const isStudentExcluded = selectedStudentId && cornerStudents.some(other => {
                  const selEx = exclusions.find(ex => ex.studentId === selectedStudentId);
                  if (selEx && selEx.forbiddenStudentIds.includes(other.id)) return true;
                  const otherEx = exclusions.find(ex => ex.studentId === other.id);
                  if (otherEx && otherEx.forbiddenStudentIds.includes(selectedStudentId) && otherEx.isTwoWay[selectedStudentId]) return true;
                  return false;
                });

                const isExcluded = isCornerExcluded || isStudentExcluded;

                const ratio = windowSize.width / windowSize.height;
                const totalBoardItems = corners.length + (isAdmin ? 1 : 0) + (isMoetjesbordEnabled ? 1 : 0);
                let cols = 4;
                if (ratio > 1.5) {
                  if (totalBoardItems <= 4) cols = 4;
                  else if (totalBoardItems <= 12) cols = 4;
                  else if (totalBoardItems <= 20) cols = 5;
                  else cols = 6;
                } else if (ratio < 0.8) {
                  if (totalBoardItems <= 2) cols = 1;
                  else if (totalBoardItems <= 6) cols = 2;
                  else if (totalBoardItems <= 12) cols = 3;
                  else cols = 4;
                } else {
                  if (totalBoardItems <= 4) cols = 2;
                  else if (totalBoardItems <= 9) cols = 3;
                  else if (totalBoardItems <= 16) cols = 4;
                  else cols = 5;
                }
                const actualRows = Math.ceil(totalBoardItems / cols);

                const isCompact = actualRows > 2 || windowSize.height < 700;
                const isVeryCompact = actualRows > 3 || windowSize.height < 500;

                return (
                  <motion.div
                    key={`active-corner-on-board-${corner.id}-${idx}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => {
                      if (selectedStudentId && !isFull && !isExcluded) {
                        assignStudent(selectedStudentId, corner.id);
                      }
                    }}
                    className={`
                      relative bg-[#F1F3F5] rounded-[1.5rem] border-2 md:border-4 transition-all duration-500 cursor-pointer flex flex-col items-center justify-start h-full
                      ${displayMode === 'names' 
                        ? (isVeryCompact ? 'p-0.5 pt-1' : isCompact ? 'p-1 pt-2' : 'p-2 pt-3')
                        : (isVeryCompact ? 'p-1 pt-2' : isCompact ? 'p-2 pt-3' : 'p-3 pt-4')
                      }
                      ${isExcluded
                        ? 'border-red-600 bg-red-50'
                        : isFull 
                          ? 'border-red-400 bg-red-50/30' 
                          : selectedStudentId 
                            ? 'border-blue-400 ring-4 ring-blue-50 scale-[1.02]' 
                            : 'border-gray-200 hover:border-orange-300 hover:shadow-xl'
                      }
                    `}
                  >
                    {/* Excluded Overlay */}
                    {isExcluded && (
                      <div className="absolute inset-0 bg-red-600/10 backdrop-blur-[1px] rounded-[1.5rem] z-40 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                          <X size={120} strokeWidth={4} className="text-white" />
                        </div>
                        <div className="relative flex flex-col items-center gap-2">
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-red-600 border-4 border-red-100">
                             {isStudentExcluded ? (
                                <User size={32} strokeWidth={3} />
                             ) : corner.image ? (
                                <img src={corner.image} alt="" className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                <Blocks size={32} strokeWidth={3} />
                              )}
                          </div>
                          {/* Verboden text removed as per user request */}
                        </div>
                      </div>
                    )}
                    {/* Main Icon - Smaller */}
                    <div className={`
                      rounded-[1rem] border-2 flex items-center justify-center bg-white shadow-inner flex-shrink-0
                      ${displayMode === 'names'
                        ? (isVeryCompact ? 'w-5 h-5 mb-0.5' : isCompact ? 'w-7 h-7 mb-0.5' : 'w-10 h-10 mb-1')
                        : (isVeryCompact ? 'w-8 h-8 mb-1' : isCompact ? 'w-10 h-10 mb-1' : 'w-14 h-14 mb-2')
                      }
                      ${getBorderClass(corner.color)}
                    `}>
                      {corner.image ? (
                        <img src={corner.image} alt={corner.name} className="w-full h-full object-cover rounded-[0.8rem]" referrerPolicy="no-referrer" />
                      ) : (
                        (() => {
                          const Icon = corner.icon && ICON_MAP[corner.icon] ? ICON_MAP[corner.icon] : LayoutGrid;
                          return <Icon size={isVeryCompact ? 16 : isCompact ? 20 : 24} strokeWidth={2.5} className={getTextClass(corner.color)} />;
                        })()
                      )}
                    </div>

                    {/* Corner Name */}
                    <h3 className={`font-black text-gray-900 text-center px-1 leading-none uppercase tracking-tight flex-shrink-0 
                      ${displayMode === 'names'
                        ? (isVeryCompact ? 'text-[9px] mb-0.5' : isCompact ? 'text-[12px] mb-0.5' : 'text-[15px] mb-1')
                        : (isVeryCompact ? 'text-[12px] mb-1' : isCompact ? 'text-[16px] mb-1' : 'text-[20px] mb-2')
                      }
                    `}>
                      {corner.name}
                    </h3>

                    {/* Student Slots - Dynamically sized to fill space without overlap */}
                    <div className={`
                      grid w-full px-1 flex-1 items-center content-center overflow-hidden min-h-0 py-1
                      ${displayMode === 'names' ? 'gap-0.5' : 'gap-1'}
                      ${displayMode === 'names' ? (corner.capacity > 8 ? 'grid-cols-2' : 'grid-cols-1') : (corner.capacity >= 12 ? 'grid-cols-5' : corner.capacity >= 9 ? 'grid-cols-4' : corner.capacity >= 5 ? 'grid-cols-3' : corner.capacity >= 3 ? 'grid-cols-2' : 'grid-cols-1')}
                    `}>
                      {Array.from({ length: corner.capacity }).map((_, idx) => {
                        const student = cornerStudents[idx];
                        const isNamesOnly = displayMode === 'names';
                        
                        // Adaptive sizing logic for slots inside corners - scaling up when there's room
                        const getSlotSize = () => {
                          if (displayMode === 'pictos') {
                            if (isVeryCompact) {
                              return corner.capacity > 10 ? 'w-5 h-5' : corner.capacity > 6 ? 'w-7 h-7' : 'w-9 h-9';
                            }
                            if (isCompact) {
                              return corner.capacity > 10 ? 'w-7 h-7' : corner.capacity > 6 ? 'w-10 h-10' : 'w-12 h-12';
                            }
                            // Normal mode - adjust to prevent overlap observed in screenshot
                            return corner.capacity > 10 ? 'w-11 h-11' : 
                                   corner.capacity > 6 ? 'w-16 h-16' : 
                                   corner.capacity >= 3 ? 'w-20 h-20' :
                                   'w-28 h-28';
                          }
                          
                          if (displayMode === 'names') {
                            if (isVeryCompact) return 'w-1.5 h-1.5';
                            if (isCompact) return 'w-2.5 h-2.5';
                            return 'w-3.5 h-3.5';
                          }

                          if (isVeryCompact) {
                            return corner.capacity > 10 ? 'w-3.5 h-3.5' : corner.capacity > 6 ? 'w-4.5 h-4.5' : 'w-5.5 h-5.5';
                          }
                          if (isCompact) {
                            return corner.capacity > 10 ? 'w-4.5 h-4.5' : corner.capacity > 6 ? 'w-6.5 h-6.5' : 'w-8 h-8';
                          }
                          return corner.capacity > 10 ? 'w-7 h-7' : 
                                 corner.capacity > 6 ? 'w-9 h-9 sm:w-11 sm:h-11' : 
                                 corner.capacity >= 3 ? 'w-12 h-12 sm:w-18 sm:h-18' :
                                 'w-18 h-18 sm:w-24 sm:h-24';
                        };

                        const slotSizeClass = getSlotSize();
                        
                        return (
                          <motion.div 
                            key={`corner-slot-${corner.id}-${idx}`}
                            whileHover={student ? { scale: isNamesOnly ? 1.05 : 1.1, rotate: isNamesOnly ? 0 : 2 } : {}}
                            onClick={(e) => {
                              if (student) {
                                e.stopPropagation();
                                checkUnassign(student.id);
                              }
                            }}
                            className={`relative flex ${isNamesOnly ? 'flex-row items-center w-full justify-start py-0.5 h-auto' : 'flex-col items-center justify-center h-full'} shrink-0 min-w-0`}
                          >
                            {(displayMode === 'both' || displayMode === 'pictos' || !student) && (
                              <div className={`
                                ${slotSizeClass} rounded-full border-2 flex items-center justify-center
                                transition-all duration-300 overflow-hidden shrink-0
                                ${student 
                                  ? `${student.avatarColor} ${getBorderClass(student.avatarColor)} shadow-sm` 
                                  : 'border-gray-100 bg-gray-50/50 border-dashed'
                                }
                              `}>
                                {student ? (
                                  student.image ? (
                                    <img src={student.image} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : student.icon && ICON_MAP[student.icon] ? (
                                    (() => {
                                      const Icon = ICON_MAP[student.icon];
                                      const getIconSize = () => {
                                        if (displayMode === 'pictos') {
                                          if (corner.capacity > 10) return 24;
                                          if (corner.capacity > 6) return 32;
                                          if (corner.capacity >= 3) return 48;
                                          return 64;
                                        }
                                        return corner.capacity > 10 ? 12 : 18;
                                      };
                                      return <Icon size={getIconSize()} className="text-white" strokeWidth={3} />;
                                    })()
                                  ) : (
                                    <span className={`
                                      font-black text-white
                                      ${displayMode === 'pictos' ? (
                                        corner.capacity > 10 ? 'text-2xl' : 
                                        corner.capacity > 6 ? 'text-3xl' : 
                                        corner.capacity >= 3 ? 'text-5xl' : 'text-6xl'
                                      ) : (
                                        isVeryCompact ? (corner.capacity > 10 ? 'text-[8px]' : 'text-[10px]') : 
                                        isCompact ? (corner.capacity > 10 ? 'text-[10px]' : 'text-xs') : 
                                        (corner.capacity > 10 ? 'text-sm' : 'text-xl')
                                      )}
                                    `}>
                                      {student.name[0]}
                                    </span>
                                  )
                                ) : null}
                              </div>
                            )}
                            {student && (displayMode === 'both' || displayMode === 'names') && (
                              <span 
                                className={`font-bold text-gray-950 uppercase w-full leading-tight pointer-events-none px-0.5 ${isNamesOnly ? 'text-left flex-1 ml-1 whitespace-nowrap' : 'text-center mt-0.5 truncate'}`}
                                style={{
                                  fontSize: (() => {
                                    const len = student.name.length;
                                    const base = isVeryCompact ? (corner.capacity > 12 ? 6 : corner.capacity > 8 ? 7 : 9) :
                                                 isCompact ? (corner.capacity > 12 ? 7 : corner.capacity > 8 ? 8 : 11) :
                                                 (corner.capacity > 12 ? 9 : corner.capacity > 8 ? 10 : corner.capacity > 5 ? 13 : 16);
                                    let calculatedBase = base;
                                    
                                    if (displayMode === 'names') {
                                      // Scale base based on capacity to ensure we don't overflow the corner card
                                      const capacityFactor = corner.capacity > 12 ? 0.9 : corner.capacity > 8 ? 1.0 : corner.capacity > 4 ? 1.2 : 1.4;
                                      calculatedBase = base * capacityFactor;
                                    }

                                    if (len <= 5) return `${calculatedBase}px`;
                                    if (len <= 8) return `${calculatedBase * 0.9}px`;
                                    if (len <= 12) return `${calculatedBase * 0.75}px`;
                                    if (len <= 16) return `${calculatedBase * 0.55}px`;
                                    
                                    // Extreme scaling for very long names
                                    const scalingFactor = Math.max(0.3, 0.5 * (12 / len));
                                    return `${calculatedBase * scalingFactor}px`;
                                  })()
                                }}
                              >
                                {displayMode === 'names' ? student.name : (student.name.length > 18 ? student.name.substring(0, 16) + '...' : student.name)}
                              </span>
                            )}


                            <AnimatePresence>
                              {student && showHourglass === student.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.5 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOverrideClick(student.id);
                                  }}
                                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center z-30 cursor-pointer"
                                >
                                  <Hourglass size={16} className="text-white animate-bounce" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>

                    {isFull && (
                      <div className={`absolute top-1 right-1 bg-red-500 text-white rounded-full font-black uppercase tracking-wider shadow-md border-2 border-white ${isVeryCompact ? 'px-1 py-0 text-[4px]' : 'px-2 py-0.5 text-[6px]'}`}>
                        Vol
                      </div>
                    )}

                    {selectedStudentId && !isFull && (
                      <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[1px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-[1.5rem]">
                        <div className={`bg-white rounded-full shadow-2xl text-blue-500 border-2 border-blue-100 ${isVeryCompact ? 'p-1' : 'p-2'}`}>
                          <Check size={isVeryCompact ? 16 : 24} strokeWidth={4} />
                        </div>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="absolute top-1 left-1 flex gap-0.5">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setEditingCorner(corner); 
                          }}
                          className={`backdrop-blur-sm p-0.5 rounded-full shadow-sm transition-colors ${
                            cornerStudents.length > 0 
                              ? 'bg-gray-100/50 text-gray-400 cursor-not-allowed' 
                              : 'bg-white/80 text-blue-500 hover:bg-white'
                          }`}
                          title={cornerStudents.length > 0 ? "Maak de hoek eerst leeg om aan te passen" : "Aanpassen"}
                        >
                          <Pencil size={isVeryCompact ? 6 : 8} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (cornerStudents.length > 0) {
                              resetCorner(corner.id);
                            }
                          }}
                          className={`backdrop-blur-sm p-0.5 rounded-full shadow-sm transition-colors ${
                            cornerStudents.length === 0
                              ? 'bg-gray-100/50 text-gray-300 cursor-not-allowed'
                              : 'bg-white/80 text-orange-500 hover:bg-white'
                          }`}
                          title="Hoek leegmaken"
                          disabled={cornerStudents.length === 0}
                        >
                          <RotateCcw size={isVeryCompact ? 6 : 8} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteCorner(corner.id); }}
                          className="bg-white/80 backdrop-blur-sm text-green-400 p-0.5 rounded-full shadow-sm hover:bg-white transition-colors"
                          title="Verwijderen"
                        >
                          <X size={isVeryCompact ? 6 : 8} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isMoetjesbordEnabled && (
              <button
                key="moetjesbord-button"
                onClick={() => setIsMoetjesbordView(true)}
                className="bg-amber-50/50 border-4 border-amber-100 text-slate-500 rounded-[2rem] flex flex-col items-center justify-center hover:bg-amber-100/50 transition-all group p-2 shadow shadow-amber-100/30 aspect-square shrink-0"
              >
                <ClipboardList size={20} className="mb-0.5 text-slate-400 group-hover:scale-110 transition-transform" strokeWidth={3} />
                <span className="font-black uppercase tracking-[0.05em] text-[7px] leading-tight text-center">Moetjes<br/>bord</span>
              </button>
            )}

            {isAdmin && (
              (() => {
                const isVeryCompact = corners.length > 15;
                return (
                  <button
                    key="add-corner-button"
                    onClick={() => {
                      setShowFixedCornerSelection(true);
                    }}
                    className="bg-white border-2 border-dashed border-gray-200 rounded-[1.5rem] flex flex-col items-center justify-center text-gray-300 hover:border-orange-300 hover:text-orange-400 transition-all group hover:bg-orange-50/20 p-2"
                  >
                    <Plus size={isVeryCompact ? 16 : 24} strokeWidth={3} className="mb-0.5 group-hover:scale-110 transition-transform" />
                    <span className={`font-black uppercase tracking-widest ${isVeryCompact ? 'text-[5px]' : 'text-[8px]'}`}>Nieuw</span>
                  </button>
                );
              })()
            )}
          </div>
          )}
        </section>
        {studentForColorEdit && (
          <Modal onClose={() => setStudentForColorEdit(null)} title="Kleur Aanpassen">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className={`
                    w-24 h-24 rounded-full border-4 shadow-xl
                    ${studentForColorEdit.avatarColor}
                    ${getBorderClass(studentForColorEdit.avatarColor)}
                    flex items-center justify-center overflow-hidden
                  `}>
                    {studentForColorEdit.image ? (
                      <img src={studentForColorEdit.image} alt="" className="w-full h-full object-cover" />
                    ) : studentForColorEdit.icon && ICON_MAP[studentForColorEdit.icon] ? (
                      (() => {
                        const Icon = ICON_MAP[studentForColorEdit.icon!];
                        return <Icon size={48} strokeWidth={3} className="text-white" />;
                      })()
                    ) : (
                      <span className="text-4xl font-black text-white">{studentForColorEdit.name[0]}</span>
                    )}
                  </div>
                  <span className="text-lg font-black text-gray-900">{studentForColorEdit.name}</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest text-center">Kies een nieuwe kleur</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {COLORS.map((c, cidx) => (
                    <button
                      key={`student-color-picker-${c}-${cidx}`}
                      onClick={() => {
                        if (effectiveUid) {
                          setDoc(doc(db, `users/${effectiveUid}/students`, studentForColorEdit.id), { 
                            ...studentForColorEdit, 
                            avatarColor: c 
                          }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/students`));
                        }
                        setStudentForColorEdit(null);
                      }}
                      className={`
                        aspect-square rounded-xl ${c} border-4 transition-all
                        ${studentForColorEdit.avatarColor === c ? 'border-blue-500 scale-110 shadow-lg' : 'border-white hover:scale-105 shadow-sm opacity-60 hover:opacity-100'}
                      `}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setStudentForColorEdit(null)}
                  className="w-full py-4 bg-gray-100 text-gray-400 font-bold rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </Modal>
        )}
          </>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {editingCorner && (
          <Modal onClose={() => setEditingCorner(null)} title="Hoek Aanpassen">
            <AddCornerForm 
              onSubmit={addCorner} 
              onCancel={() => setEditingCorner(null)} 
              customImages={allCustomImages}
              usedSymbols={usedSymbols}
              initialData={editingCorner}
              onUpload={(img) => setAllCustomImages(prev => [img, ...prev.filter(i => i !== img)].slice(0, 10))}
              onDeleteImage={deleteImage}
              restrictToCapacity={true}
            />
          </Modal>
        )}
        {showFixedCornerSelection && (
          <Modal onClose={() => setShowFixedCornerSelection(false)} title="Kies een vaste hoek">
            <div className="grid grid-cols-2 gap-4 p-4">
              {fixedCorners.map((fc, idx) => {
                const isAlreadyOnBoard = corners.some(c => c.fixedId === fc.id || (c.name === fc.name && (c.image === fc.image || c.icon === fc.icon)));
                
                return (
                  <div key={`fixed-corner-lib-${fc.id}-${idx}`} className="relative group">
                    <button
                      onClick={() => {
                        if (isAlreadyOnBoard) return;
                        // Add this fixed corner to the board
                        const newCorner: Corner = {
                          ...fc,
                          id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Use c- prefix
                          fixedId: fc.id
                        };
                        if (effectiveUid) {
                          setDoc(doc(db, `users/${effectiveUid}/corners`, newCorner.id), newCorner)
                            .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/corners`));
                        }
                        setShowFixedCornerSelection(false);
                      }}
                      className={`w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border-2 transition-all relative overflow-hidden ${
                        isAlreadyOnBoard 
                          ? 'border-red-500 bg-red-50 ring-4 ring-red-100 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                          : 'border-transparent hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      {/* Pulse effect for active corners */}
                      {isAlreadyOnBoard && (
                        <motion.div 
                          animate={{ opacity: [0.1, 0.3, 0.1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-red-400 pointer-events-none"
                        />
                      )}
                      
                      <div className={`relative z-10 w-12 h-12 rounded-xl bg-white border-2 flex items-center justify-center ${
                        isAlreadyOnBoard ? 'border-red-300 shadow-inner' : getBorderClass(fc.color)
                      }`}>
                        {fc.image ? (
                          <img src={fc.image} alt={fc.name} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                        ) : (
                          (() => {
                            const Icon = fc.icon && ICON_MAP[fc.icon] ? ICON_MAP[fc.icon] : LayoutGrid;
                            return <Icon size={24} strokeWidth={2.5} className={isAlreadyOnBoard ? 'text-red-500' : getTextClass(fc.color)} />;
                          })()
                        )}
                      </div>
                      <div className="relative z-10 text-left">
                        <p className={`font-black ${isAlreadyOnBoard ? 'text-red-700' : 'text-gray-900'}`}>{fc.name}</p>
                        <p className={`text-[10px] font-bold uppercase ${isAlreadyOnBoard ? 'text-red-500' : 'text-gray-400'}`}>
                          {isAlreadyOnBoard ? 'Actief op het bord' : `Capaciteit: ${fc.capacity}`}
                        </p>
                      </div>
                    </button>
                    
                    <div className={`absolute top-2 right-2 flex gap-1 ${isAdmin ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity z-20`}>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setEditingFixedCorner(fc);
                          setShowFixedCornerSelection(false);
                        }}
                        className="bg-white text-blue-500 p-1.5 rounded-full shadow-md border border-blue-100 hover:bg-blue-50 transition-colors"
                        title="Wijzig deze vaste hoek"
                      >
                        <Pencil size={12} strokeWidth={3} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteFixedCorner(fc.id); }}
                        className="bg-red-50 text-red-600 p-1.5 rounded-full shadow-md border border-red-100 hover:bg-red-200 transition-colors"
                        title="Definitief uit bibliotheek verwijderen"
                      >
                        <Trash2 size={12} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                onClick={() => {
                  setShowFixedCornerSelection(false);
                  setIsAddingFixedCorner(true);
                }}
                className="flex items-center gap-4 p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl hover:border-purple-300 hover:bg-purple-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-purple-400">
                  <Plus size={24} strokeWidth={3} />
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-400 group-hover:text-purple-500">Vaste hoek...</p>
                  <p className="text-[10px] font-bold text-gray-300 uppercase group-hover:text-purple-300">Nieuw toevoegen</p>
                </div>
              </button>
            </div>
          </Modal>
        )}
        {(isAddingFixedCorner || editingFixedCorner) && (
          <Modal 
            onClose={() => { setIsAddingFixedCorner(false); setEditingFixedCorner(null); }} 
            title={editingFixedCorner ? "Vaste hoek aanpassen" : "Nieuwe vaste hoek toevoegen"}
          >
            <AddCornerForm 
              onSubmit={addFixedCorner} 
              onCancel={() => { setIsAddingFixedCorner(false); setEditingFixedCorner(null); }} 
              customImages={allCustomImages}
              usedSymbols={usedSymbols}
              initialData={editingFixedCorner}
              onUpload={(img) => setAllCustomImages(prev => [img, ...prev.filter(i => i !== img)].slice(0, 10))}
              onDeleteImage={deleteImage}
              isAdmin={isAdmin}
            />
          </Modal>
        )}
        {isAddingStudent && (
          <Modal onClose={() => setIsAddingStudent(false)} title="Nieuwe Leerling">
            <AddStudentForm 
              onSubmit={addStudent} 
              onCancel={() => setIsAddingStudent(false)} 
              customImages={allCustomImages}
              usedSymbols={usedSymbols}
              onUpload={(img) => setAllCustomImages(prev => [img, ...prev.filter(i => i !== img)].slice(0, 10))}
              onDeleteImage={deleteImage}
              isAdmin={isAdmin}
            />
          </Modal>
        )}
        {editingStudent && (
          <Modal onClose={() => setEditingStudent(null)} title="Leerling Aanpassen">
            <AddStudentForm 
              onSubmit={addStudent} 
              onCancel={() => setEditingStudent(null)} 
              customImages={allCustomImages}
              usedSymbols={usedSymbols}
              initialData={editingStudent}
              onUpload={(img) => setAllCustomImages(prev => [img, ...prev.filter(i => i !== img)].slice(0, 10))}
              onDeleteImage={deleteImage}
              isAdmin={isAdmin}
            />
          </Modal>
        )}
        {showReflectionBoard && (
          <ReflectionBoard 
            onClose={() => setShowReflectionBoard(false)}
            students={students}
            corners={corners}
            evaluations={evaluations}
            customEvaluationTypes={customEvaluationTypes}
            interactionHistory={interactionHistory}
            assignments={assignments}
            assignmentTimestamps={assignmentTimestamps}
            moetjes={moetjes}
            moetjeEvaluations={moetjeEvaluations}
            activeEvaluationType={evaluationType}
            moetjesEvaluationMethod={moetjesEvaluationMethod}
            moetjesEvaluationCustomId={moetjesEvaluationCustomId}
          />
        )}
        {showAnalytics && (
          <Modal onClose={() => setShowAnalytics(false)} title="Analytics & Sociogram" wide>
            <AnalyticsView 
              history={interactionHistory}
              students={students}
              corners={corners}
              activeAssignments={assignments}
              assignmentTimestamps={assignmentTimestamps}
              evaluations={evaluations}
              customEvaluationTypes={customEvaluationTypes}
              evaluationType={evaluationType}
              moetjes={moetjes}
              moetjeEvaluations={moetjeEvaluations}
              moetjeHistory={moetjeHistory}
              allCustomImages={allCustomImages}
            />
          </Modal>
        )}

        {distributionFeedback.length > 0 && (
          <Modal 
            onClose={() => setDistributionFeedback([])} 
            title="Leerlingen niet ingedeeld"
          >
            <div className="p-4 space-y-4">
              <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-4 flex items-center gap-4">
                <div className="bg-white p-2 rounded-xl text-orange-500 shadow-sm">
                  <ShieldAlert size={24} strokeWidth={3} />
                </div>
                <p className="text-[11px] font-bold text-orange-700 leading-tight">
                  De volgende {distributionFeedback.length > 1 ? 'kleuters zijn' : 'kleuter is'} niet automatisch ingedeeld. Ze blijven in de klasbalk staan.
                </p>
              </div>

              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {distributionFeedback.map((item, idx) => (
                  <div key={`dist-fb-${item.name}-${idx}`} className="bg-gray-50 rounded-2xl p-3 border-2 border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{item.name}</span>
                      <span className="text-[8px] font-black text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full uppercase">Oorzaak:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.reasons.map((r, ridx) => (
                        <span key={ridx} className="text-[9px] font-bold bg-white text-red-500 border border-red-100 px-2.5 py-1 rounded-xl shadow-sm">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setDistributionFeedback([])}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg active:scale-95"
              >
                Ik begrijp het
              </button>
            </div>
          </Modal>
        )}

        {showChoiceSettings && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
            >
              <div className="bg-indigo-500 p-6 text-white relative">
                <button 
                  onClick={() => setShowChoiceSettings(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} strokeWidth={3} />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <Settings2 size={24} strokeWidth={3} />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Instellingen Keuzenproces</h2>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
                  <div className="bg-white p-2 rounded-xl text-emerald-500 shadow-sm animate-pulse">
                    <ShieldCheck size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">GDPR & Privacy</p>
                    <p className="text-[9px] font-bold text-emerald-600 leading-tight">
                      Je gegevens worden veilig opgeslagen in Europa. Alleen jij (en gekoppelde apparaten) hebben toegang tot deze informatie.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl text-amber-500 shadow-sm">
                      <ShieldAlert size={24} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-tight">Aansprakelijkheid & Disclaimer</p>
                      <span className="text-[8px] font-extrabold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded uppercase tracking-wider">GEBRUIK OP EIGEN RISICO</span>
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-amber-700 leading-normal">
                    Deze applicatie wordt geleverd "in de huidige staat" (as-is) zonder enige vorm van garantie, expliciet of impliciet. De ontwikkelaar/auteur is onder geen enkele omstandigheid aansprakelijk voor enige directe, indirecte of incidentele schade, dataverlies, systeemstoringen of eventuele beveiligingsincidenten.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border-2 border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-xl shadow-sm text-indigo-500">
                        <Clock size={20} strokeWidth={3} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-gray-900 uppercase">Starttijd Activeren</p>
                        <p className="text-[10px] font-bold text-gray-400">Minimale speeltijd bij start</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => updateChoiceSettings({ ...choiceSettings, startTimeEnabled: !choiceSettings.startTimeEnabled })}
                      className={`w-12 h-6 rounded-full p-1 transition-all flex ${choiceSettings.startTimeEnabled ? 'bg-indigo-500 justify-end' : 'bg-gray-200 justify-start'}`}
                    >
                      <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-md" />
                    </button>
                  </div>

                  {choiceSettings.startTimeEnabled && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-indigo-50/50 p-4 rounded-2xl border-2 border-indigo-100"
                    >
                      <p className="text-[10px] font-bold text-indigo-600 uppercase mb-3 italic">
                        "Als u starttijd activeert moeten de kleuters bij het begin van het keuzenproces minstens een bepaalde tijd in de hoek spelen"
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-700 uppercase">Aantal minuten:</span>
                        <div className="flex items-center gap-3 bg-white border-2 border-indigo-200 rounded-xl px-2 py-1">
                          <span className="text-lg font-black text-indigo-600 min-w-[2ch] text-center">{choiceSettings.startTimeMinutes}</span>
                          <div className="flex flex-col border-l border-indigo-100 pl-2">
                            <button 
                              onClick={() => updateChoiceSettings({ ...choiceSettings, startTimeMinutes: Math.min(60, choiceSettings.startTimeMinutes + 1) })}
                              className="text-indigo-400 hover:text-indigo-600 transition-colors"
                            >
                              <ChevronUp size={16} strokeWidth={4} />
                            </button>
                            <button 
                              onClick={() => updateChoiceSettings({ ...choiceSettings, startTimeMinutes: Math.max(1, choiceSettings.startTimeMinutes - 1) })}
                              className="text-indigo-400 hover:text-indigo-600 transition-colors"
                            >
                              <ChevronDown size={16} strokeWidth={4} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => setShowChoiceSettings(false)}
                  className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
                >
                  GEREED
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showAttendanceOverview && (
          <Modal 
            onClose={() => setShowAttendanceOverview(false)} 
            title="Overzicht Afwezigheden"
            wide={attendanceViewMode === 'individual'}
          >
            <div className="p-4 space-y-4">
              {/* Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto custom-scrollbar">
                {(['day', 'week', 'individual'] as const).map((mode, midx) => (
                  <button
                    key={`attendance-tab-${mode}-${midx}`}
                    onClick={() => setAttendanceViewMode(mode)}
                    className={`flex-1 min-w-[70px] py-3 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${attendanceViewMode === mode ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {mode === 'day' ? 'Vandaag' : mode === 'week' ? 'Klasoverzicht' : 'Individueel'}
                  </button>
                ))}
              </div>

              {/* Range Selector Bar - STREAMLINED */}
              {(attendanceViewMode === 'week' || attendanceViewMode === 'individual') && (
                <div className="flex flex-wrap items-center gap-1 bg-gray-100/50 p-1 rounded-xl">
                  <div className="flex bg-white rounded-lg border border-indigo-100 p-0.5 shadow-sm grow sm:grow-0">
                    <button 
                      onClick={() => {
                        const now = new Date();
                        setAttendanceStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
                        setAttendanceEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
                      }} 
                      className="flex-1 px-2 py-1 text-[7px] font-black hover:bg-indigo-50 rounded-md transition-colors uppercase tracking-widest text-indigo-500"
                    >
                      Week
                    </button>
                    <button 
                      onClick={() => {
                        const now = new Date();
                        setAttendanceStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
                        setAttendanceEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
                      }} 
                      className="flex-1 px-2 py-1 text-[7px] font-black hover:bg-indigo-50 rounded-md transition-colors border-x border-indigo-50 uppercase tracking-widest text-indigo-500"
                    >
                      Maand
                    </button>
                    <button 
                      onClick={() => {
                        const now = new Date();
                        const currentYear = now.getFullYear();
                        const currentMonth = now.getMonth() + 1;
                        const startYear = currentMonth >= 9 ? currentYear : currentYear - 1;
                        setAttendanceStartDate(format(new Date(startYear, 8, 1), 'yyyy-MM-dd'));
                        setAttendanceEndDate(format(new Date(startYear + 1, 7, 31), 'yyyy-MM-dd'));
                      }} 
                      className="flex-1 px-2 py-1 text-[7px] font-black hover:bg-indigo-50 rounded-md transition-colors uppercase tracking-widest text-indigo-500"
                    >
                      Schooljaar
                    </button>
                  </div>

                  <button 
                    onClick={() => setShowAttendanceCalendar(!showAttendanceCalendar)}
                    className="flex-1 flex items-center justify-between px-2 py-1 bg-white border border-indigo-100 rounded-lg hover:border-indigo-300 transition-all text-[8px] font-black text-gray-700 relative whitespace-nowrap min-w-0 shadow-sm"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar size={10} className="text-indigo-500 shrink-0" />
                      <span className="uppercase tracking-tight truncate">
                        {format(new Date(attendanceStartDate), 'd MMM', { locale: nl })} - {format(new Date(attendanceEndDate), 'd MMM', { locale: nl })}
                      </span>
                    </div>
                    <ChevronDown size={10} className={`text-indigo-300 transition-transform shrink-0 ${showAttendanceCalendar ? 'rotate-180' : ''}`} />
                    
                    {showAttendanceCalendar && (
                      <div 
                        className="absolute top-full left-0 right-0 mt-1 z-[60] bg-white rounded-2xl shadow-2xl border-2 border-indigo-50 p-3 w-80"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <button 
                            onClick={() => setAttendanceCalendarMonth(subMonths(attendanceCalendarMonth, 1))} 
                            className="p-1 px-2 hover:bg-indigo-50 rounded-lg transition-colors text-indigo-400"
                          >
                            <ChevronLeft size={16}/>
                          </button>
                          <span className="font-black text-[9px] uppercase tracking-widest text-indigo-900">
                            {format(attendanceCalendarMonth, 'MMMM yyyy', { locale: nl })}
                          </span>
                          <button 
                            onClick={() => setAttendanceCalendarMonth(addMonths(attendanceCalendarMonth, 1))} 
                            className="p-1 px-2 hover:bg-indigo-50 rounded-lg transition-colors text-indigo-400"
                          >
                            <ChevronRight size={16}/>
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {(['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'] as const).map((d, dIdx) => (
                            <div key={`att-cal-header-${d}-${dIdx}`} className="text-[7px] font-black text-indigo-300 text-center uppercase">{d}</div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {(() => {
                            const start = startOfWeek(startOfMonth(attendanceCalendarMonth), { weekStartsOn: 1 });
                            const end = endOfWeek(endOfMonth(attendanceCalendarMonth), { weekStartsOn: 1 });
                            const days = eachDayOfInterval({ start, end });
                            
                            const rangeStart = new Date(attendanceStartDate);
                            const rangeEnd = new Date(attendanceEndDate);
                            
                            return days.map((day, dayIdx) => {
                              const isSelected = isWithinInterval(startOfDay(day), { 
                                start: startOfDay(rangeStart), 
                                end: endOfDay(rangeEnd) 
                              });
                              const isStart = isSameDay(day, rangeStart);
                              const isEnd = isSameDay(day, rangeEnd);
                              const isCurrentMonth = day.getMonth() === attendanceCalendarMonth.getMonth();
                              const isToday = isSameDay(day, new Date());

                              return (
                                <button
                                  key={`att-cal-day-${dayIdx}`}
                                  onClick={() => {
                                    if (isSameDay(rangeStart, rangeEnd)) {
                                      if (day < rangeStart) {
                                        setAttendanceStartDate(format(day, 'yyyy-MM-dd'));
                                        setAttendanceEndDate(format(rangeStart, 'yyyy-MM-dd'));
                                      } else {
                                        setAttendanceEndDate(format(day, 'yyyy-MM-dd'));
                                      }
                                    } else {
                                      setAttendanceStartDate(format(day, 'yyyy-MM-dd'));
                                      setAttendanceEndDate(format(day, 'yyyy-MM-dd'));
                                    }
                                  }}
                                  className={`
                                    aspect-square text-[9px] font-black rounded-lg transition-all flex flex-col items-center justify-center relative
                                    ${!isCurrentMonth ? 'text-gray-200' : 'text-gray-700'}
                                    ${isSelected ? 'bg-indigo-500 text-white shadow-sm z-10' : 'hover:bg-indigo-50'}
                                    ${isStart || isEnd ? 'ring-1 ring-white' : ''}
                                    ${isToday && !isSelected ? 'text-indigo-500 underline' : ''}
                                  `}
                                >
                                  {format(day, 'd')}
                                </button>
                              );
                            });
                          })()}
                        </div>

                        <div className="mt-3 pt-3 border-t border-indigo-50 flex justify-between gap-2">
                           <button 
                             onClick={() => {
                                const today = new Date();
                                setAttendanceStartDate(format(today, 'yyyy-MM-dd'));
                                setAttendanceEndDate(format(today, 'yyyy-MM-dd'));
                             }}
                             className="flex-1 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[7px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                           >
                             Vandaag
                           </button>
                           <button 
                             onClick={() => setShowAttendanceCalendar(false)}
                             className="flex-1 py-1.5 bg-indigo-500 text-white rounded-lg text-[7px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                           >
                             Oke
                           </button>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              )}

              {attendanceViewMode === 'day' ? (
                <>
                  <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">Vandaag afwezig</h4>
                      <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">
                        {absentStudentIds.length} kleuters
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {absentStudentIds.length > 0 ? (
                        absentStudentIds.map((id, idx) => {
                          const s = students.find(student => student.id === id);
                          return (
                            <div key={`attv-abs-${id}-${idx}-${effectiveUid}`} className="flex items-center gap-2 bg-gray-50 pl-1.5 pr-1 py-1 rounded-xl border border-gray-100 group">
                              <div className={`w-6 h-6 rounded-full ${s?.avatarColor || 'bg-gray-200'} border border-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm`}>
                                {s?.image ? <img src={s.image} className="w-full h-full object-cover" /> : <span className="text-[8px] font-black">{s?.name?.[0] || '?'}</span>}
                              </div>
                              <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter truncate max-w-[70px]">{s?.name || 'Onbekend'}</span>
                              <button 
                                onClick={() => updateAttendance(absentStudentIds.filter(absId => absId !== id))}
                                className="w-5 h-5 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all ml-0.5 shadow-sm active:scale-95"
                                title="Markeer als aanwezig"
                              >
                                <UserCheck size={10} strokeWidth={3} />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="w-full py-6 flex flex-col items-center justify-center text-emerald-500/40 opacity-50">
                          <UserCheck size={32} strokeWidth={1} className="mb-1" />
                          <p className="text-[9px] font-black uppercase tracking-widest">Iedereen aanwezig</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : attendanceViewMode === 'week' ? (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(attendanceHistory)
                    .filter(([date]) => date >= attendanceStartDate && date <= attendanceEndDate)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .map(([date, absentIds], dateIdx) => {
                      const formattedDate = new Date(date).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' });
                      return (
                        <div key={`att-hist-${date}-${dateIdx}`} className="bg-white border border-gray-100 rounded-xl p-2 shadow-sm">
                          <h4 className="text-[8px] font-black uppercase text-indigo-600 mb-1.5 border-b border-gray-50 pb-0.5">{formattedDate}</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {(absentIds as string[]).length > 0 ? (
                              (absentIds as string[]).map((id, aidx) => {
                                const s = students.find(student => student.id === id);
                                return (
                                  <div key={`att-hist-item-${date}-${id}-${aidx}`} className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
                                    <div className={`w-4 h-4 rounded-full ${s?.avatarColor || 'bg-gray-200'} border border-white flex items-center justify-center overflow-hidden shrink-0`}>
                                      {s?.image ? <img src={s.image} className="w-full h-full object-cover" /> : <span className="text-[5px] font-black">{s?.name?.[0] || '?'}</span>}
                                    </div>
                                    <span className="text-[8px] font-bold text-gray-600 truncate max-w-[70px] uppercase tracking-tight">{s?.name || 'Onbekend'}</span>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-[7px] font-bold text-gray-300 uppercase italic">Iedereen aanwezig</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : attendanceViewMode === 'individual' ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="bg-white border border-gray-100 rounded-xl p-1.5 shadow-sm flex items-center grow">
                      <div className="relative flex items-center gap-2 w-full">
                        <User size={12} className="text-indigo-400 shrink-0" />
                        <select 
                          value={selectedAttendanceStudentId || ''} 
                          onChange={(e) => setSelectedAttendanceStudentId(e.target.value || null)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-3 pr-8 py-1.5 text-[10px] font-black text-gray-700 outline-none focus:border-indigo-300 focus:bg-white transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Kies Kleuter...</option>
                          {students.map((s, sidx) => (
                            <option key={`att-student-opt-${s.id}-${sidx}`} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                      </div>
                    </div>

                    {selectedAttendanceStudentId && (
                      <div className="bg-indigo-600 rounded-xl p-2 px-3 text-white shadow-sm flex items-center justify-between gap-4 font-black shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                          {(() => {
                            const student = students.find(s => s.id === selectedAttendanceStudentId);
                            return (
                              <div className={`w-8 h-8 rounded-full ${student?.avatarColor || 'bg-white/20'} border border-white/30 flex items-center justify-center overflow-hidden shrink-0`}>
                                {student?.image ? (
                                  <img src={student.image} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px]">{student?.name?.[0] || '?'}</span>
                                )}
                              </div>
                            );
                          })()}
                          <span className="text-[10px] uppercase truncate">
                            {students.find(s => s.id === selectedAttendanceStudentId)?.name}
                          </span>
                        </div>
                        <div className="bg-white/10 px-2 py-1 rounded-lg border border-white/20 text-center shrink-0">
                          <span className="text-[12px] leading-none block">
                            {Object.entries(attendanceHistory)
                              .filter(([date]) => date >= attendanceStartDate && date <= attendanceEndDate)
                              .filter(([, absentIds]) => (absentIds as string[]).includes(selectedAttendanceStudentId))
                              .length}
                          </span>
                          <span className="text-[5px] uppercase opacity-60">Afwezig</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {!selectedAttendanceStudentId ? (
                    <div className="bg-white border border-gray-100 rounded-2xl py-12 flex flex-col items-center justify-center text-gray-300">
                      <User size={32} strokeWidth={1} className="mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-center px-6">Selecteer een leerling</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto max-h-[45vh] custom-scrollbar">
                          <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-gray-50 z-20">
                              <tr>
                                <th className="px-3 py-1.5 text-left text-[7px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Datum</th>
                                <th className="px-3 py-1.5 text-right text-[7px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {Object.entries(attendanceHistory)
                                .filter(([date]) => date >= attendanceStartDate && date <= attendanceEndDate)
                                .sort((a, b) => b[0].localeCompare(a[0]))
                                .map(([date, absentIds]) => {
                                  const isAbsent = (absentIds as string[]).includes(selectedAttendanceStudentId);
                                  const formattedDate = format(new Date(date), 'eeee d MMMM', { locale: nl });
                                  return (
                                    <tr key={`ind-att-${date}`} className={`${isAbsent ? 'bg-red-50/30' : 'bg-transparent'}`}>
                                      <td className="px-3 py-1.5 text-[10px] font-bold text-gray-600 capitalize">{formattedDate}</td>
                                      <td className="px-3 py-1.5 text-right">
                                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${isAbsent ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                          {isAbsent ? 'Afwezig' : 'Aanwezig'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {getAttendanceStats(attendanceViewMode as any).map((stat, idx) => (
                    <div key={`att-stat-${stat.student?.id || 'none'}-${idx}-${attendanceViewMode}-${effectiveUid}-${stat.count}`} className="bg-gray-50 rounded-2xl p-3 border-2 border-gray-100 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${stat.student?.avatarColor} border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0`}>
                        {stat.student?.image ? (
                          <img src={stat.student.image} alt="" className="w-full h-full object-cover" />
                        ) : stat.student?.icon && ICON_MAP[stat.student.icon!] ? (
                          (() => {
                            const Icon = ICON_MAP[stat.student!.icon!];
                            return <Icon size={16} strokeWidth={3} className="text-white" />;
                          })()
                        ) : (
                          <span className="text-sm font-black text-white">{stat.student?.name[0]}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{stat.student?.name}</p>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="bg-red-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-red-500">{stat.count}x</p>
                        <p className="text-[7px] font-bold text-gray-400">AFWEZIG</p>
                      </div>
                    </div>
                  ))}
                  {getAttendanceStats(attendanceViewMode as any).length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-300">
                      <UserCheck size={48} strokeWidth={1} className="mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest text-center">Nog geen data beschikbaar voor deze periode</p>
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={() => setShowAttendanceOverview(false)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
              >
                Sluiten
              </button>
            </div>
          </Modal>
        )}

        {showChoiceProcess && (
          <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-300">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-4xl max-h-[95vh] overflow-hidden border-4 border-white"
            >
              {/* Header / Student View - Minimised */}
              <div className="py-2 px-4 bg-indigo-500 text-white flex flex-col items-center gap-2 relative shadow-md shrink-0">
                <button 
                  onClick={() => setShowChoiceProcess(false)}
                  className="absolute top-2 right-2 p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={18} strokeWidth={3} />
                </button>
                
                <div className="flex flex-col items-center w-full">
                  {/* Students hidden at top as requested */}
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] bg-white/10 px-4 py-1 rounded-full backdrop-blur-sm mb-1 mt-1">
                    Wie kiest er nu?
                  </span>
                
                {(() => {
                  // 1. All students who haven't moved yet and are present
                  const pendingStudents = students.filter(s => 
                    !Object.values(assignments).flat().includes(s.id) && 
                    !absentStudentIds.includes(s.id)
                  );

                  // 2. Out of those, who haven't been skipped in this session
                  const currentCandidates = pendingStudents.filter(s => !skippedStudentIds.includes(s.id));

                  if (currentCandidates.length === 0) {
                    //session complete: everyone either assigned, absent, or skipped
                    setTimeout(() => setShowChoiceProcess(false), 500);
                    return (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <div className="bg-white/20 p-3 rounded-full">
                          <UserCheck size={32} strokeWidth={2} />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Klaar voor nu!</h2>
                        <p className="text-[10px] font-bold text-indigo-100 uppercase italic">Resterende kleuters blijven in de klasbalk.</p>
                      </div>
                    );
                  }

                  const student = currentCandidates[0];
                  
                  return (
                    <div className="flex items-center justify-center gap-4 w-full max-w-2xl bg-white/10 py-1.5 px-4 rounded-2xl backdrop-blur-md border border-white/10">
                        <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={`choice-student-${student.id}`}
                        className="flex items-center gap-3"
                      >
                        {(displayMode === 'both' || displayMode === 'pictos') && (
                          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${student.avatarColor} border-2 border-white shadow-lg flex items-center justify-center overflow-hidden shrink-0`}>
                            {student.image ? (
                              <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                            ) : student.icon && ICON_MAP[student.icon!] ? (
                              (() => {
                                const Icon = ICON_MAP[student.icon!];
                                return <Icon size={24} strokeWidth={3} className="text-white" />;
                              })()
                            ) : (
                              <span className="text-2xl font-black text-white">{student.name[0]}</span>
                            )}
                          </div>
                        )}
                        {(displayMode === 'both' || displayMode === 'names') && (
                          <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight drop-shadow-sm truncate max-w-[200px]">{student.name}</h2>
                        )}
                      </motion.div>

                      <div className="flex gap-2 ml-4">
                        <button 
                          onClick={() => updateAttendance([...absentStudentIds, student.id])}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-400/20 hover:bg-red-400/40 border border-red-400/30 rounded-xl transition-all"
                        >
                          <UserX size={14} strokeWidth={3} className="text-red-100" />
                          <span className="font-black text-[8px] uppercase tracking-wider">Afwezig</span>
                        </button>
                        <button 
                          onClick={() => setSkippedStudentIds([...skippedStudentIds, student.id])}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all"
                        >
                          <Clock size={14} strokeWidth={3} className="text-indigo-100" />
                          <span className="font-black text-[8px] uppercase tracking-wider">Wacht</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Corners Selection - Optimized for space */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gray-50 flex justify-center">
              {(() => {
                const candidates = students.filter(s => 
                  !Object.values(assignments).flat().includes(s.id) && 
                  !absentStudentIds.includes(s.id) &&
                  !skippedStudentIds.includes(s.id)
                );
                
                const student = candidates[0];
                if (!student) return null;

                return (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 w-full max-w-7xl auto-rows-min pb-20 sm:pb-0">
                    {corners.filter(c => c.isActive !== false).map((corner, cidx) => {
                      const count = (assignments[corner.id] || []).length;
                      const isFull = count >= corner.capacity;
                      const exclusion = exclusions.find(e => e.studentId === student.id);
                      const isExcluded = exclusion?.forbiddenCornerIds.includes(corner.id) || 
                        (assignments[corner.id] || []).some(sid => 
                          exclusion?.forbiddenStudentIds.includes(sid) ||
                          exclusions.find(e => e.studentId === sid)?.forbiddenStudentIds.includes(student.id)
                        );
                      
                      const canChoose = !isFull && !isExcluded;

                      return (
                        <button
                          key={`choice-corner-${corner.id}-${cidx}`}
                          disabled={!canChoose}
                          onClick={() => {
                            const cid = corner.id;
                            const sid = student.id;
                            const newAssignments = { ...assignments };
                            if (!newAssignments[cid]) newAssignments[cid] = [];
                            newAssignments[cid].push(sid);
                            setAssignments(newAssignments);

                            setAssignmentTimestamps(prev => ({
                              ...prev,
                              [sid]: Date.now(),
                              ...(choiceSettings.startTimeEnabled ? { [`START_${sid}`]: Date.now() } : {})
                            }));
                          }}
                          className={`
                            relative flex flex-col items-center p-2 rounded-2xl border-2 transition-all duration-300
                            ${canChoose 
                              ? 'bg-white border-gray-100 hover:border-indigo-400 hover:shadow-lg shadow-sm' 
                              : isFull 
                                ? 'bg-gray-100 border-red-500 opacity-50 cursor-not-allowed' 
                                : 'bg-gray-100 border-orange-200 opacity-50 cursor-not-allowed'
                            }
                          `}
                        >
                          <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl ${corner.color} flex items-center justify-center text-white shadow-md mb-1 relative overflow-hidden shrink-0`}>
                            {corner.image ? (
                              <img src={corner.image} alt="" className="w-full h-full object-cover" />
                            ) : corner.icon && ICON_MAP[corner.icon] ? (
                              (() => {
                                const Icon = ICON_MAP[corner.icon!];
                                return <Icon size={16} strokeWidth={3} />;
                              })()
                            ) : (
                              <LayoutGrid size={16} />
                            )}
                            <div className="absolute top-0.5 right-0.5 bg-black/30 backdrop-blur-md px-1 py-0.5 rounded-[4px] text-[6px] font-black uppercase lg:text-[7px]">
                              {count}/{corner.capacity}
                            </div>
                          </div>
                          
                          <span className="text-[8px] font-black text-gray-900 uppercase tracking-tight text-center leading-tight truncate w-full lg:text-[9px]">
                            {corner.name}
                          </span>

                          {isFull && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-red-500/90 text-white px-1.5 py-0.5 rounded-full text-[6px] font-black uppercase rotate-[-15deg] shadow-lg">
                                VOL
                              </div>
                            </div>
                          )}
                          {isExcluded && !isFull && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-orange-500/90 text-white px-1.5 py-0.5 rounded-full text-[6px] font-black uppercase rotate-[-15deg] shadow-lg">
                                STOP
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            
            <div className="bg-white border-t border-gray-100 p-2 sm:p-4 flex items-center justify-between shrink-0">
              <div className="flex gap-2">
                {skippedStudentIds.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1.5">
                    <Clock size={10} className="text-indigo-500" />
                    <span className="text-[8px] font-black text-indigo-700 uppercase tracking-tight">Wachtend: {skippedStudentIds.length}</span>
                  </div>
                )}
                {Object.values(assignments).flat().length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1.5">
                    <UserCheck size={10} className="text-emerald-500" />
                    <span className="text-[8px] font-black text-emerald-700 uppercase tracking-tight">Klaar: {Object.values(assignments).flat().length}</span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setSkippedStudentIds([])}
                className="text-[8px] font-black text-gray-400 hover:text-indigo-500 transition-colors uppercase tracking-widest"
              >
                Reset wachtrij
              </button>
            </div>
          </motion.div>
        </div>
      )}
        {showDistributionMenu && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100"
            >
              <div className="bg-emerald-500 p-4 text-white relative">
                <button 
                  onClick={() => setShowDistributionMenu(false)}
                  className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={18} strokeWidth={3} />
                </button>
                <div className="flex items-center gap-3 mb-1">
                  <div className="bg-white/20 p-1.5 rounded-xl backdrop-blur-sm">
                    <Shuffle size={20} strokeWidth={3} />
                  </div>
                  <h2 className="text-lg font-black uppercase tracking-tight">Reset & Verdeel</h2>
                </div>
                <p className="text-emerald-50/80 font-bold text-xs">
                  Kies hoe je de kleuters wilt verdelen.
                </p>
              </div>

              <div className="p-3 grid gap-2">
                <button 
                  onClick={() => distributeStudents('random')}
                  className="flex items-center gap-3 p-3 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left shadow-sm shadow-emerald-100/50"
                >
                  <div className="bg-emerald-100 p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <Dices className="text-emerald-500" size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-black text-emerald-600 uppercase tracking-tight text-[11px]">Random verdelen</h3>
                    <p className="text-[9px] font-bold text-gray-400">Verdeel volledig willekeurig.</p>
                  </div>
                </button>

                <button 
                  onClick={() => distributeStudents('combined')}
                  className="flex items-center gap-3 p-3 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left shadow-sm shadow-emerald-100/50"
                >
                  <div className="bg-emerald-100 p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <Sparkles className="text-emerald-500" size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-black text-emerald-600 uppercase tracking-tight text-[11px]">Slimme mix</h3>
                    <p className="text-[9px] font-bold text-gray-400">Onbekende hoeken en nieuwe vriendjes.</p>
                  </div>
                </button>

                <button 
                  onClick={() => distributeStudents('infrequent_corners')}
                  className="flex items-center gap-3 p-3 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="bg-blue-100 p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <MapPin className="text-blue-500" size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-[11px]">Onbekende hoeken</h3>
                    <p className="text-[9px] font-bold text-gray-400">Prioriteit aan weinig bezochte hoeken.</p>
                  </div>
                </button>

                <button 
                  onClick={() => distributeStudents('infrequent_peers')}
                  className="flex items-center gap-3 p-3 rounded-2xl border-2 border-gray-100 hover:border-purple-500 hover:bg-purple-50 transition-all group text-left"
                >
                  <div className="bg-purple-100 p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <Users2 className="text-purple-500" size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-[11px]">Nieuwe vriendjes</h3>
                    <p className="text-[9px] font-bold text-gray-400">Stimuleer sociale cohesie.</p>
                  </div>
                </button>

                <button 
                  onClick={() => distributeStudents('frequent')}
                  className="flex items-center gap-3 p-3 rounded-2xl border-2 border-gray-100 hover:border-orange-500 hover:bg-orange-50 transition-all group text-left"
                >
                  <div className="bg-orange-100 p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <Heart className="text-orange-500" size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-[11px]">Speeltijd</h3>
                    <p className="text-[9px] font-bold text-gray-400">Favoriete hoeken bij vriendjes.</p>
                  </div>
                </button>
              </div>
              
              <div className="bg-gray-50 p-2 border-t border-gray-100">
                <p className="text-[8px] font-bold text-gray-400 uppercase text-center flex items-center justify-center gap-1.5">
                  <ShieldAlert size={10} />
                  Uitsluitingen worden gerespecteerd
                </p>
              </div>
            </motion.div>
          </div>
        )}
        {showSyncModal && user && syncSecret && (
          <SyncModal 
            uid={user.uid} 
            secret={syncSecret}
            onClose={() => setShowSyncModal(false)} 
          />
        )}
        {showSyncModal && user && !syncSecret && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-bold">Koppelingscode genereren...</p>
            </div>
          </div>
        )}
        {showExclusionModal && (
          <ExclusionModal 
            isOpen={showExclusionModal}
            onClose={() => setShowExclusionModal(false)}
            students={students}
            corners={fixedCorners}
            exclusions={exclusions}
            setExclusions={setExclusions}
          />
        )}
        {showEvaluationSettings && (
          <Modal onClose={() => { setShowEvaluationSettings(false); setIsCreatingCustomEval(false); }} title="Hoekevaluatie Instellingen">
            <div className="space-y-3 p-2">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border-2 border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cornerEvaluationEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                    <Heart size={24} fill={cornerEvaluationEnabled ? 'currentColor' : 'none'} />
                  </div>
                  <div>
                    <p className="font-black text-gray-900">Hoekevaluatie inschakelen</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Vraag kleuters hoe ze het vonden</p>
                  </div>
                </div>
                <button 
                  onClick={() => setCornerEvaluationEnabled(!cornerEvaluationEnabled)}
                  className={`w-14 h-8 rounded-full transition-all relative ${cornerEvaluationEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${cornerEvaluationEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {cornerEvaluationEnabled && (
                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 space-y-4">
                  <p className="text-xs font-black text-gray-700 uppercase tracking-widest">Type Evaluatie</p>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => setEvaluationType('standard')}
                      className={`p-3 rounded-xl font-black text-xs border-2 transition-all flex items-center justify-between ${evaluationType === 'standard' ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-transparent text-gray-400 hover:border-gray-200'}`}
                    >
                      <div className="flex items-center gap-2">
                        Standaard (Smilies)
                        <div className="flex gap-1 opacity-80">
                          <SmileyIcon type="happy" size={14} />
                          <SmileyIcon type="neutral" size={14} />
                          <SmileyIcon type="sad" size={14} />
                        </div>
                      </div>
                      {evaluationType === 'standard' && <Check size={14} />}
                    </button>

                    {customEvaluationTypes.map((type, idx) => {
                      const options = type.options || [
                        { id: 'happy', image: type.happyImage },
                        { id: 'neutral', image: type.neutralImage },
                        { id: 'sad', image: type.sadImage },
                        ...(type.extraImage ? [{ id: 'extra', image: type.extraImage }] : [])
                      ];
                      return (
                        <div key={`${type.id}-${idx}`} className="relative group">
                          <button 
                            onClick={() => setEvaluationType(type.id)}
                            className={`w-full p-3 rounded-xl font-black text-xs border-2 transition-all flex items-center justify-between ${evaluationType === type.id ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'bg-white border-transparent text-gray-400 hover:border-gray-200'}`}
                          >
                            <div className="flex items-center gap-2">
                              {type.name}
                              <div className="flex gap-0.5">
                                {options.slice(0, 4).map((opt: any, sidx) => (
                                  opt.image && <img key={`${opt.id}-${sidx}`} src={opt.image} className="w-3 h-3 rounded-full object-cover" />
                                ))}
                                {options.length > 4 && <span className="text-[8px] opacity-50">+{options.length - 4}</span>}
                              </div>
                            </div>
                            {evaluationType === type.id && <Check size={14} />}
                          </button>
                        <div className={`absolute -top-1 -right-1 flex gap-1 ${isAdmin ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCustomEvalId(type.id);
                              if (type.options) {
                                setNewCustomEval({ ...type });
                              } else {
                                // Migrate old format for editing
                                setNewCustomEval({
                                  name: type.name,
                                  options: [
                                    { id: 'happy', label: type.happyLabel || 'Leuk', image: type.happyImage || '', color: 'bg-green-500', type: 'happy' },
                                    { id: 'neutral', label: type.neutralLabel || 'Matig', image: type.neutralImage || '', color: 'bg-amber-500', type: 'neutral' },
                                    { id: 'sad', label: type.sadLabel || 'Niet leuk', image: type.sadImage || '', color: 'bg-red-500', type: 'sad' },
                                    ...(type.extraLabel ? [{ id: 'extra', label: type.extraLabel, image: type.extraImage || '', color: 'bg-blue-500', type: 'extra' }] : [])
                                  ]
                                });
                               }
                               setIsCreatingCustomEval(true);
                            }}
                            className="bg-blue-500 text-white p-1 rounded-full shadow-md hover:bg-blue-600"
                          >
                            <Pencil size={10} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmWithMath(() => {
                                setCustomEvaluationTypes(prev => prev.filter(t => t.id !== type.id));
                                if (evaluationType === type.id) setEvaluationType('standard');
                              }, true, 'easy', true);
                            }}
                            className="bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                        </div>
                      );
                    })}

                    {customEvaluationTypes.length < 14 && !isCreatingCustomEval && (
                      <button 
                        onClick={() => setIsCreatingCustomEval(true)}
                        className="p-3 rounded-xl font-black text-xs border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={14} />
                        Persoonlijk Toevoegen
                      </button>
                    )}
                  </div>

                  {isCreatingCustomEval && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-4 rounded-xl border-2 border-blue-100 space-y-4"
                    >
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Naam Evaluatie</label>
                        <input 
                          type="text" 
                          value={newCustomEval.name}
                          onChange={(e) => setNewCustomEval({...newCustomEval, name: e.target.value})}
                          placeholder="Bijv. Dieren"
                          className="w-full p-2 bg-gray-50 rounded-lg border-2 border-gray-100 outline-none font-bold text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {newCustomEval.options.map((opt, idx) => (
                                <div key={`${opt.id}-${idx}`} className="space-y-1 bg-gray-50 p-1.5 rounded-xl border border-gray-100 relative group">
                            {newCustomEval.options.length > 1 && (
                              <button 
                                onClick={() => {
                                  const next = [...newCustomEval.options];
                                  next.splice(idx, 1);
                                  setNewCustomEval({...newCustomEval, options: next});
                                }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-sm z-10"
                              >
                                <X size={10} />
                              </button>
                            )}
                            <input 
                              type="text"
                              value={opt.label}
                              onChange={(e) => {
                                const next = [...newCustomEval.options];
                                next[idx].label = e.target.value;
                                setNewCustomEval({...newCustomEval, options: next});
                              }}
                              className="w-full bg-white border border-gray-200 rounded-md p-1 text-[10px] font-black text-center outline-none focus:border-blue-400"
                              placeholder="Label..."
                            />
                            <div className={`relative aspect-square ${opt.color || 'bg-gray-100'} rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden group/img`}>
                              {opt.image ? (
                                <>
                                  <img src={opt.image} className="w-full h-full object-cover" />
                                    <button 
                                      onClick={() => {
                                        const next = [...newCustomEval.options];
                                        next[idx].image = '';
                                        setNewCustomEval({...newCustomEval, options: next});
                                      }}
                                      className={`absolute inset-0 bg-black/40 text-white flex items-center justify-center ${isAdmin ? 'opacity-100' : 'opacity-0 group-hover/img:opacity-100'} transition-opacity`}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                </>
                              ) : (
                                <label className="cursor-pointer w-full h-full flex items-center justify-center">
                                  <div className={`w-8 h-8 ${opt.color ? 'bg-white/20' : 'bg-gray-200'} rounded-full flex items-center justify-center shadow-inner`}>
                                    {['happy', 'neutral', 'sad'].includes(opt.type) ? (
                                      <div className="text-white">
                                        <svg viewBox="0 0 100 100" className="w-5 h-5 fill-none stroke-current" strokeWidth="10" strokeLinecap="round">
                                          {opt.type === 'happy' && (
                                            <>
                                              <circle cx="35" cy="40" r="6" fill="currentColor" />
                                              <circle cx="65" cy="40" r="6" fill="currentColor" />
                                              <path d="M30 65 Q50 85 70 65" />
                                            </>
                                          )}
                                          {opt.type === 'neutral' && (
                                            <>
                                              <circle cx="35" cy="40" r="6" fill="currentColor" />
                                              <circle cx="65" cy="40" r="6" fill="currentColor" />
                                              <line x1="30" y1="70" x2="70" y2="70" />
                                            </>
                                          )}
                                          {opt.type === 'sad' && (
                                            <>
                                              <circle cx="35" cy="40" r="6" fill="currentColor" />
                                              <circle cx="65" cy="40" r="6" fill="currentColor" />
                                              <path d="M30 75 Q50 55 70 75" />
                                            </>
                                          )}
                                        </svg>
                                      </div>
                                    ) : (
                                      <Plus size={14} className="text-gray-400" />
                                    )}
                                  </div>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          const next = [...newCustomEval.options];
                                          next[idx].image = reader.result as string;
                                          setNewCustomEval({...newCustomEval, options: next});
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {newCustomEval.options.length < 14 && (
                          <div className="flex items-center justify-center">
                            <button 
                              onClick={() => {
                                setNewCustomEval({
                                  ...newCustomEval,
                                  options: [
                                    ...newCustomEval.options,
                                    { id: `extra-${Date.now()}`, label: 'Extra', image: '', color: 'bg-gray-300', type: 'extra' }
                                  ]
                                });
                              }}
                              className="w-10 h-10 bg-blue-50 rounded-full border-2 border-dashed border-blue-200 flex items-center justify-center text-blue-400 hover:bg-blue-100 hover:border-blue-300 transition-all"
                              title="Extra optie toevoegen"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setIsCreatingCustomEval(false);
                            setEditingCustomEvalId(null);
                          }}
                          className="flex-1 py-2 bg-gray-100 text-gray-500 rounded-lg font-black text-[10px] uppercase"
                        >
                          Annuleren
                        </button>
                        <button 
                          onClick={() => {
                            if (!newCustomEval.name) return;
                            if (editingCustomEvalId) {
                              setCustomEvaluationTypes(prev => prev.map(t => t.id === editingCustomEvalId ? { ...newCustomEval } : t));
                              setEditingCustomEvalId(null);
                            } else {
                              const id = `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                              setCustomEvaluationTypes(prev => [...prev, { ...newCustomEval, id }]);
                              setEvaluationType(id);
                            }
                            setIsCreatingCustomEval(false);
                            setNewCustomEval({
                              name: '',
                              options: [
                                { id: 'happy', label: 'Leuk', image: '', color: 'bg-green-500', type: 'happy' },
                                { id: 'neutral', label: 'Matig', image: '', color: 'bg-amber-500', type: 'neutral' },
                                { id: 'sad', label: 'Niet leuk', image: '', color: 'bg-red-500', type: 'sad' }
                              ]
                            });
                          }}
                          className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-black text-[10px] uppercase"
                        >
                          {editingCustomEvalId ? 'Bijwerken' : 'Toevoegen'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
              
              <button 
                onClick={() => setShowEvaluationSettings(false)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
              >
                Opslaan
              </button>
            </div>
          </Modal>
        )}
        {showMoetjesbordSettings && (
          <Modal onClose={() => setShowMoetjesbordSettings(false)} title="Moetjesbord Instellingen" wide>
            <div className="p-2 space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border-2 border-gray-100 uppercase">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isMoetjesbordEnabled ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-200 text-gray-400'}`}>
                    <ClipboardList size={18} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 tracking-tight">Activeer Moetjesbord</h3>
                  </div>
                </div>
                <button 
                  onClick={() => updateSettings({ isMoetjesbordEnabled: !isMoetjesbordEnabled })}
                  className={`w-10 h-6 rounded-full transition-all relative ${isMoetjesbordEnabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${isMoetjesbordEnabled ? 'left-5' : 'left-1'}`} />
                </button>
              </div>

              <div className="bg-indigo-50/30 p-2.5 rounded-xl border-2 border-indigo-100/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                      <Check size={16} strokeWidth={3} />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Moetjesbord Evalueren</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings({ moetjesHasEvaluation: !moetjesHasEvaluation })}
                    className={`w-9 h-5 rounded-full transition-all relative ${moetjesHasEvaluation ? 'bg-indigo-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${moetjesHasEvaluation ? 'left-4.5' : 'left-0.5'}`} />
                  </button>
                </div>

                {moetjesHasEvaluation && (
                  <div className="animate-in fade-in duration-300">
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => updateSettings({ moetjesEvaluationMethod: 'corner' })}
                        className={`flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all ${moetjesEvaluationMethod === 'corner' ? 'bg-white border-indigo-500 text-indigo-600 shadow-sm' : 'bg-white/50 border-gray-100 text-gray-400 hover:bg-white'}`}
                      >
                         <div className={`w-1.5 h-1.5 rounded-full ${moetjesEvaluationMethod === 'corner' ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                        <span className="text-[7px] font-black uppercase text-center leading-none">Keuzebord</span>
                      </button>
                      <button
                        onClick={() => updateSettings({ moetjesEvaluationMethod: 'standard' })}
                        className={`flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all ${moetjesEvaluationMethod === 'standard' ? 'bg-white border-indigo-500 text-indigo-600 shadow-sm' : 'bg-white/50 border-gray-100 text-gray-400 hover:bg-white'}`}
                      >
                         <div className={`w-1.5 h-1.5 rounded-full ${moetjesEvaluationMethod === 'standard' ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                        <span className="text-[7px] font-black uppercase text-center leading-none">Standaard</span>
                      </button>
                      <button
                        onClick={() => updateSettings({ moetjesEvaluationMethod: 'custom' })}
                        className={`flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all ${moetjesEvaluationMethod === 'custom' ? 'bg-white border-indigo-500 text-indigo-600 shadow-sm' : 'bg-white/50 border-gray-100 text-gray-400 hover:bg-white'}`}
                      >
                         <div className={`w-1.5 h-1.5 rounded-full ${moetjesEvaluationMethod === 'custom' ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                        <span className="text-[7px] font-black uppercase text-center leading-none">Aangepast</span>
                      </button>
                    </div>

                    {moetjesEvaluationMethod === 'custom' && (
                      <div className="pt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <select
                          value={moetjesEvaluationCustomId || ''}
                          onChange={(e) => updateSettings({ moetjesEvaluationCustomId: e.target.value })}
                          className="w-full p-2 bg-white border-2 border-indigo-100 rounded-xl outline-none text-[8px] font-black uppercase tracking-widest"
                        >
                          <option value="">Kies een evaluatie...</option>
                           {customEvaluationTypes.map((type, tidx) => (
                            <option key={`moetje-settings-eval-${type.id}-${tidx}`} value={type.id}>{type.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Beheer Moetjes</h3>
                  <button 
                    onClick={() => { setEditingMoetje(null); setIsAddingMoetje(true); }}
                    className="flex items-center gap-1 px-3 py-1 bg-indigo-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-md shadow-indigo-100 hover:scale-105 transition-all"
                  >
                    <Plus size={10} strokeWidth={3} />
                    Nieuw Moetje
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-0.5 custom-scrollbar">
                  {moetjes.map((m, midx) => (
                    <div key={`${m.id}-${midx}`} className="bg-white border-2 border-gray-50 rounded-xl p-1.5 flex items-center justify-between group hover:border-indigo-100 transition-all shadow-sm">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg border-2 ${getBorderClass(m.color)} flex items-center justify-center overflow-hidden bg-white shadow-inner shrink-0`}>
                          {m.image ? (
                            <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            (() => {
                              const Icon = m.icon && ICON_MAP[m.icon] ? ICON_MAP[m.icon] : LayoutGrid;
                              return <Icon size={12} className={getTextClass(m.color)} strokeWidth={3} />;
                            })()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 text-[8px] uppercase tracking-tight truncate">{m.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button 
                          onClick={() => toggleMoetje(m.id, !m.isActive)}
                          className={`w-10 h-6.5 rounded-lg border-2 transition-all flex items-center justify-center gap-0.5 ${m.isActive ? 'bg-green-500 border-green-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
                        >
                          <Check size={8} strokeWidth={4} />
                          <span className="text-[5px] font-black">{m.isActive ? 'ACTIEF' : 'UIT'}</span>
                        </button>
                        <button 
                          onClick={() => { setEditingMoetje(m); setIsAddingMoetje(true); }}
                          className="w-6 h-6 bg-blue-500 border-2 border-blue-600 text-white rounded-md shadow-sm flex items-center justify-center"
                        >
                          <Pencil size={8} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={() => deleteMoetje(m.id)}
                          className="w-6 h-6 bg-red-500 border-2 border-red-600 text-white rounded-md shadow-sm flex items-center justify-center"
                        >
                          <Trash2 size={8} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {moetjes.length === 0 && (
                    <div className="col-span-full py-6 text-center text-gray-300 italic font-black uppercase text-[7px] tracking-widest">Geen moetjes aangemaakt</div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setShowMoetjesbordSettings(false)}
                  className="px-6 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </Modal>
        )}
        {(isAddingMoetje || editingMoetje) && (
          <Modal 
            onClose={() => { setIsAddingMoetje(false); setEditingMoetje(null); }} 
            title={editingMoetje ? "Moetje aanpassen" : "Nieuw Moetje toevoegen"}
          >
            <AddMoetjeForm 
              onSubmit={addMoetje} 
              onCancel={() => { setIsAddingMoetje(false); setEditingMoetje(null); }} 
              customImages={allCustomImages}
              fixedCorners={fixedCorners}
              initialData={editingMoetje}
              onUpload={(img) => setAllCustomImages(prev => [img, ...prev.filter(i => i !== img)].slice(0, 10))}
              onDeleteImage={deleteImage}
              isAdmin={isAdmin}
            />
          </Modal>
        )}
        <AnimatePresence mode="wait">
          {pendingMoetjeEval && (
            <EvaluationOverlay 
              key={`moetje-eval-${pendingMoetjeEval.studentId}-${pendingMoetjeEval.moetjeId}`}
              student={students.find(s => s.id === pendingMoetjeEval.studentId)!}
              evaluationType={pendingMoetjeEval.evalType}
              customTypes={customEvaluationTypes}
              customTypeId={pendingMoetjeEval.customTypeId}
              onSelect={async (rating) => {
                await submitMoetjeEvaluation(rating, pendingMoetjeEval.evalType);
              }}
              onClose={() => setPendingMoetjeEval(null)}
            />
          )}
        </AnimatePresence>

        {showResetOptionsModal && (
          <Modal 
            onClose={() => setShowResetOptionsModal(false)} 
            title="Bord resetten"
          >
            <div className="p-4 space-y-6 text-center">
              <div className="w-16 h-16 bg-orange-100 text-orange-650 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                <RotateCcw size={32} strokeWidth={3} className="text-orange-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-gray-900 uppercase">Kies een reset optie</h3>
                <p className="text-xs font-bold text-gray-500 leading-relaxed">
                  Je gaat het keuzebord leegmaken. Wat moet er gebeuren met de speeltijd van de kleuters die nu nog in een hoek spelen?
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {/* OPTIE 1: NIET OPSLAAN */}
                <button
                  onClick={() => {
                    resetBoard(false);
                    setShowResetOptionsModal(false);
                  }}
                  className="w-full text-left p-4 rounded-2xl border-2 border-red-200 bg-red-50/25 hover:bg-red-50 hover:border-red-400 font-bold transition-all flex items-start gap-4 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-black shrink-0">
                    <X size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="text-red-700 font-black text-[13px] uppercase">Optie 1: Niet opslaan</h4>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      Reset en neem de huidige spelgegevens <strong className="font-black text-red-650 uppercase text-[12px]">niet</strong> mee in de statistieken. (Gebruik dit als je vergeten bent het keuzebord te stoppen).
                    </p>
                  </div>
                </button>

                {/* OPTIE 2: WEL OPSLAAN */}
                <button
                  onClick={() => {
                    resetBoard(true);
                    setShowResetOptionsModal(false);
                  }}
                  className="w-full text-left p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/25 hover:bg-emerald-50 hover:border-emerald-400 font-bold transition-all flex items-start gap-4 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-black shrink-0">
                    <Check size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="text-emerald-750 font-black text-[13px] uppercase">Optie 2: Wel opslaan</h4>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      Reset en neem de huidige spelgegevens <strong className="font-black text-emerald-650 uppercase text-[12px]">wel</strong> mee in de statistieken. (Normale afronding van de speeltijd).
                    </p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowResetOptionsModal(false)}
                className="w-full py-3 bg-gray-150 hover:bg-gray-200 text-gray-500 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Annuleren
              </button>
            </div>
          </Modal>
        )}

        {showGDPRModal && gdprMathProblem && (
          <Modal 
            onClose={() => setShowGDPRModal(false)} 
            title="Privacy & Gegevensverwijdering"
          >
            <div className="p-4 space-y-6">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} strokeWidth={3} />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-lg font-black text-gray-900 uppercase">Ben je absoluut zeker?</h3>
                <p className="text-xs font-bold text-gray-500 leading-relaxed">
                  Dit zal al je leerlingen, hoeken, evaluaties en instellingen <span className="text-red-600">definitief verwijderen</span>. Dit kan niet ongedaan worden gemaakt.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Stap 1: Beveiligingssom</p>
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-xl font-black text-gray-700">{gdprMathProblem.a} + {gdprMathProblem.b} =</span>
                    <input 
                      type="number"
                      value={gdprMathInput}
                      onChange={(e) => setGDPRMathInput(e.target.value)}
                      placeholder="?"
                      className="w-20 p-2 text-center bg-white border-2 border-gray-200 rounded-xl font-black text-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Stap 2: Bevestigingstekst</p>
                  <p className="text-[9px] text-gray-400 text-center italic">Typ de volgende tekst over:</p>
                  <p className="text-[10px] font-bold text-gray-600 text-center select-none bg-white p-2 rounded-lg border border-gray-100">
                    ik ben zeker dat ik mijn volledig acount verwijderen
                  </p>
                  <input 
                    type="text"
                    value={gdprConfirmText}
                    onChange={(e) => setGDPRConfirmText(e.target.value)}
                    placeholder="Typ hier de tekst..."
                    className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl font-bold text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center pt-2">
                <button
                  disabled={
                    parseInt(gdprMathInput) !== gdprMathProblem.answer || 
                    gdprConfirmText !== "ik ben zeker dat ik mijn volledig acount verwijderen" ||
                    isSyncing
                  }
                  onClick={performGDPRDelete}
                  className={`px-6 py-2 rounded-xl font-black uppercase text-[8px] tracking-[0.2em] transition-all ${
                    parseInt(gdprMathInput) === gdprMathProblem.answer && 
                    gdprConfirmText === "ik ben zeker dat ik mijn volledig acount verwijderen"
                      ? 'bg-red-500 text-white shadow-md shadow-red-100 hover:bg-red-600' 
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isSyncing ? 'Bezig...' : 'Account verwijderen'}
                </button>
                <button
                  onClick={() => setShowGDPRModal(false)}
                  className="mt-4 px-4 py-2 text-gray-400 font-bold uppercase text-[7px] tracking-widest hover:text-gray-600 transition-all"
                >
                  Annuleren en terugkeren
                </button>
              </div>
            </div>
          </Modal>
        )}
        <AnimatePresence>
          {pendingSecurityAction && (
            <Modal onClose={() => {
              if (pendingSecurityAction.onCancel) pendingSecurityAction.onCancel();
              setPendingSecurityAction(null);
            }} title={showExtraWarning ? "Laatste Bevestiging" : "Beveiligingscontrole"}>
              <div className="p-4 text-center space-y-6">
                {!showExtraWarning ? (
                  <>
                    <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto">
                      <Lock size={40} strokeWidth={3} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900">Ben je het zeker?</h2>
                      <p className="text-gray-500 font-bold mt-1">Los de som op om door te gaan:</p>
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100 relative overflow-hidden">
                      {securityStatus === 'error' ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 bg-red-500 flex items-center justify-center z-10"
                        >
                          <span className="text-4xl font-black text-white uppercase tracking-widest">Fout!</span>
                        </motion.div>
                      ) : null}
                      <p className="text-4xl font-black text-gray-900 tracking-wider mb-4">
                        {pendingSecurityAction.problem.a} {pendingSecurityAction.problem.op} {pendingSecurityAction.problem.b} = ?
                      </p>
                      <input 
                        type="number"
                        autoFocus
                        value={securityInput}
                        onChange={(e) => setSecurityInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const isCorrect = parseInt(securityInput) === pendingSecurityAction.problem.answer;
                            if (isCorrect) {
                              if (pendingSecurityAction.needsExtraWarning) {
                                setShowExtraWarning(true);
                              } else {
                                pendingSecurityAction.action();
                                setPendingSecurityAction(null);
                              }
                            } else {
                              setSecurityStatus('error');
                              setTimeout(() => {
                                setPendingSecurityAction(null);
                                setSecurityStatus('idle');
                              }, 1000);
                            }
                          }
                        }}
                        className="w-full p-4 bg-white border-4 border-purple-100 rounded-2xl outline-none focus:border-purple-400 text-center text-3xl font-black transition-all"
                        placeholder="?"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setPendingSecurityAction(null)}
                        className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                      >
                        Annuleren
                      </button>
                      <button 
                        onClick={() => {
                          const isCorrect = parseInt(securityInput) === pendingSecurityAction.problem.answer;
                          if (isCorrect) {
                            if (pendingSecurityAction.needsExtraWarning) {
                              setShowExtraWarning(true);
                            } else {
                              pendingSecurityAction.action();
                              setPendingSecurityAction(null);
                            }
                          } else {
                            setSecurityStatus('error');
                            setTimeout(() => {
                              setPendingSecurityAction(null);
                              setSecurityStatus('idle');
                            }, 1000);
                          }
                        }}
                        className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all"
                      >
                        Bevestigen
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto">
                      <ShieldAlert size={40} strokeWidth={3} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900">Pas op!</h2>
                      <p className="text-gray-500 font-bold mt-1 italic">
                        Je staat op het punt om gegevens permanent te verwijderen. Weet je het echt heel zeker?
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setPendingSecurityAction(null)}
                        className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                      >
                        Niet verwijderen
                      </button>
                      <button 
                        onClick={() => {
                          pendingSecurityAction.action();
                          setPendingSecurityAction(null);
                          setShowExtraWarning(false);
                        }}
                        className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                      >
                        Ja, verwijder nu
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Modal>
          )}
          {validationError && (
            <Modal onClose={() => setValidationError(null)} title="Oeps! Dubbele gegevens">
              <div className="p-4 text-center space-y-6">
                <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <X size={40} strokeWidth={3} />
                </div>
                <p className="font-bold text-gray-600 leading-relaxed">
                  {validationError.split(/(naam|afbeelding|symbool)/i).map((part, i) => 
                    /naam|afbeelding|symbool/i.test(part) ? <strong key={`bold-${i}`} className="text-red-600 font-black">{part}</strong> : <span key={`text-${i}`}>{part}</span>
                  )}
                </p>
                <button 
                  onClick={() => setValidationError(null)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                >
                  Ik pas het aan
                </button>
              </div>
            </Modal>
          )}
          {pendingEvaluation && (
            <EvaluationOverlay 
              student={students.find(s => s.id === pendingEvaluation.studentId)!}
              evaluationType={evaluationType}
              customTypes={customEvaluationTypes}
              onSelect={async (rating) => {
                const studentIdToUnassign = pendingEvaluation.studentId;
                const startTime = pendingEvaluation.startTime;
                
                // Clear UI immediately for best UX
                setPendingEvaluation(null);
                unassignStudent(studentIdToUnassign);
                
                if (!effectiveUid) return;
                
                try {
                  const duration = startTime ? Date.now() - startTime : 0;
                  const timestamp = Date.now();
                  const evalData = { ...pendingEvaluation, rating, timestamp, duration, evaluationTypeId: evaluationType };
                  await setDoc(doc(db, `users/${effectiveUid}/evaluations`, `${timestamp}-${studentIdToUnassign}`), evalData);
                } catch (err: any) {
                  handleFirestoreError(err, OperationType.WRITE, `users/${effectiveUid}/evaluations`);
                }
              }}
              onClose={() => setPendingEvaluation(null)}
            />
          )}
        </AnimatePresence>
        {pendingFullscreenExit && mathProblem && (
          <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full text-center"
            >
              <div className="mb-8">
                <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Lock size={40} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Beveiligde Modus</h2>
                <p className="text-gray-500 font-bold mt-2">Los de som op om verder te gaan:</p>
                {securityTimer !== null && (
                  <p className="text-purple-500 font-black text-xs mt-2 uppercase tracking-widest">
                    Automatisch terug naar bord in: {securityTimer}s
                  </p>
                )}
              </div>

              <div className="text-6xl font-black text-purple-600 mb-8 tracking-widest bg-purple-50 py-8 rounded-[2rem] border-4 border-purple-100 relative overflow-hidden">
                {securityStatus === 'error' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 bg-red-500 flex items-center justify-center z-10"
                  >
                    <span className="text-4xl font-black text-white uppercase tracking-widest">Fout!</span>
                  </motion.div>
                ) : null}
                {mathProblem.q}
              </div>

              <input
                type="number"
                autoFocus
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitFullscreenExit()}
                className="w-full text-center text-5xl font-black p-6 bg-gray-50 border-4 border-gray-200 rounded-[2rem] focus:border-purple-400 focus:bg-white outline-none mb-8 transition-all"
                placeholder="?"
              />

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setPendingFullscreenExit(false);
                    setMathProblem(null);
                    setMathInput('');
                    // Try to re-enter fullscreen if we were kicked out
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen().catch(() => {});
                    }
                  }}
                  className="flex-1 py-6 bg-gray-100 text-gray-500 text-xl font-black rounded-[2rem] hover:bg-gray-200 transition-all active:scale-95"
                >
                  Annuleren
                </button>
                <button
                  onClick={submitFullscreenExit}
                  className="flex-1 py-6 bg-purple-500 text-white text-xl font-black rounded-[2rem] hover:bg-purple-600 shadow-xl shadow-purple-200 transition-all active:scale-95"
                >
                  Bevestigen
                </button>
              </div>
              
              <p className="mt-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                Ouder/Leerkracht Controle
              </p>
            </motion.div>
          </div>
        )}

        {mustRestoreFullscreen && (
          <div className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center p-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg w-full"
            >
              <div className="w-32 h-32 bg-purple-100 text-purple-600 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Maximize size={64} strokeWidth={3} />
                </motion.div>
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-4">Scherm herstellen</h2>
              <p className="text-xl font-bold text-gray-500 mb-12">
                De beveiligde modus is nog actief. Klik op de knop om terug te gaan naar het grote scherm.
              </p>
              <button
                onClick={() => {
                  document.documentElement.requestFullscreen().then(() => {
                    setMustRestoreFullscreen(false);
                  }).catch(() => {
                    // If it still fails, we stay here.
                  });
                }}
                className="w-full py-8 bg-purple-500 text-white text-3xl font-black rounded-[2.5rem] shadow-2xl shadow-purple-200 hover:bg-purple-600 transition-all active:scale-95 flex items-center justify-center gap-4"
              >
                <RotateCcw size={32} strokeWidth={3} />
                Terug naar bord
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Teacher Override Modal */}
      <AnimatePresence>
        {overrideStudentId && mathProblem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border-4 border-blue-500 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-red-600" size={32} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Eerder wisselen?</h2>
              <p className="text-gray-500 font-bold mb-6 italic text-sm">"Laat deze kleuter nu al wisselen? Los de som op om te bevestigen."</p>
              
              <div className="text-4xl font-black text-blue-600 mb-6 tracking-widest">
                {mathProblem.q}
              </div>

              <input
                type="number"
                autoFocus
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitOverride()}
                className="w-full text-center text-3xl font-black p-4 bg-gray-50 border-4 border-gray-100 rounded-2xl focus:border-blue-400 outline-none mb-6"
                placeholder="?"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setOverrideStudentId(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-xl hover:bg-gray-200 transition-all"
                >
                  Annuleren
                </button>
                <button
                  onClick={submitOverride}
                  className="flex-1 py-4 bg-blue-500 text-white font-black rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all"
                >
                  Bevestigen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 20px;
          border: 2px solid white;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProviderComponent>
      <MainApp />
      <CookieBanner />
    </AuthProviderComponent>
  );
}

// --- Helper Components ---

function ExclusionModal({ 
  isOpen, 
  onClose, 
  students, 
  corners, 
  exclusions, 
  setExclusions 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  students: Student[]; 
  corners: Corner[]; 
  exclusions: any[]; 
  setExclusions: Dispatch<SetStateAction<any[]>>; 
}) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'overview'>('edit');

  const currentExclusion = exclusions.find(ex => ex.studentId === selectedStudentId) || {
    studentId: selectedStudentId || '',
    forbiddenCornerIds: [],
    forbiddenStudentIds: [],
    isTwoWay: {}
  };

  const selectedStudent = students.find(st => st.id === selectedStudentId);

  const updateExclusion = (updates: any) => {
    if (!selectedStudentId) return;
    
    setExclusions(prev => {
      // 1. Create a deep copy reference map of the previous exclusions
      const nextMap = new Map<string, any>();
      prev.forEach(ex => {
        nextMap.set(ex.studentId, {
          studentId: ex.studentId,
          forbiddenCornerIds: [...(ex.forbiddenCornerIds || [])],
          forbiddenStudentIds: [...(ex.forbiddenStudentIds || [])],
          isTwoWay: { ...(ex.isTwoWay || {}) }
        });
      });

      // 2. Get or create student's own exclusion
      const oldEx = nextMap.get(selectedStudentId) || {
        studentId: selectedStudentId,
        forbiddenCornerIds: [],
        forbiddenStudentIds: [],
        isTwoWay: {}
      };

      // Apply updates to the student's own exclusion
      const updatedSelf = {
        studentId: selectedStudentId,
        forbiddenCornerIds: updates.forbiddenCornerIds !== undefined ? [...updates.forbiddenCornerIds] : [...oldEx.forbiddenCornerIds],
        forbiddenStudentIds: updates.forbiddenStudentIds !== undefined ? [...updates.forbiddenStudentIds] : [...oldEx.forbiddenStudentIds],
        isTwoWay: updates.isTwoWay !== undefined ? { ...updates.isTwoWay } : { ...oldEx.isTwoWay }
      };

      // 3. Handle removals: If any student was in the forbidden list but is no longer there
      oldEx.forbiddenStudentIds.forEach((otherId: string) => {
        if (!updatedSelf.forbiddenStudentIds.includes(otherId)) {
          // Clean up the two-way flag for this key in our own record
          if (updatedSelf.isTwoWay) {
            delete updatedSelf.isTwoWay[otherId];
          }
          // Also remove selectedStudentId from the other student's list of exclusions
          const otherEx = nextMap.get(otherId);
          if (otherEx) {
            otherEx.forbiddenStudentIds = otherEx.forbiddenStudentIds.filter((id: string) => id !== selectedStudentId);
            if (otherEx.isTwoWay) {
              delete otherEx.isTwoWay[selectedStudentId];
            }
            nextMap.set(otherId, otherEx);
          }
        }
      });

      // 4. Handle two-way toggle changes or automatic two-way mapping on additions
      if (updates.isTwoWay !== undefined) {
        Object.keys(updatedSelf.isTwoWay).forEach((otherId) => {
          const isNowTwoWay = updatedSelf.isTwoWay[otherId];
          const wasTwoWay = oldEx.isTwoWay[otherId] || false;

          if (isNowTwoWay && !wasTwoWay) {
            // Make sure other side also has selectedStudentId excluded and isTwoWay is true
            const otherEx = nextMap.get(otherId) || {
              studentId: otherId,
              forbiddenCornerIds: [],
              forbiddenStudentIds: [],
              isTwoWay: {}
            };
            if (!otherEx.forbiddenStudentIds.includes(selectedStudentId)) {
              otherEx.forbiddenStudentIds.push(selectedStudentId);
            }
            if (!otherEx.isTwoWay) otherEx.isTwoWay = {};
            otherEx.isTwoWay[selectedStudentId] = true;
            nextMap.set(otherId, otherEx);
          } else if (!isNowTwoWay && wasTwoWay) {
            // Was two-way, now one-way. Remove from other side.
            const otherEx = nextMap.get(otherId);
            if (otherEx) {
              otherEx.forbiddenStudentIds = otherEx.forbiddenStudentIds.filter((id: string) => id !== selectedStudentId);
              if (otherEx.isTwoWay) {
                delete otherEx.isTwoWay[selectedStudentId];
              }
              nextMap.set(otherId, otherEx);
            }
          }
        });
      } else if (updates.forbiddenStudentIds !== undefined) {
        // If forbiddenStudentIds was updated directly (adding/removing), sync any newly added ones
        // If a student is added, defaults as NOT two-way unless later toggled.
        // Clean up isTwoWay keys that are no longer in forbiddenStudentIds!
        if (updatedSelf.isTwoWay) {
          Object.keys(updatedSelf.isTwoWay).forEach((otherId) => {
            if (!updatedSelf.forbiddenStudentIds.includes(otherId)) {
              delete updatedSelf.isTwoWay[otherId];
            }
          });
        }
      }

      // Save updated self in map
      nextMap.set(selectedStudentId, updatedSelf);

      // Convert map to array & filter out empty exclusions
      const results: any[] = [];
      nextMap.forEach((val) => {
        if (val.forbiddenCornerIds.length > 0 || val.forbiddenStudentIds.length > 0) {
          results.push(val);
        }
      });

      return results;
    });
  };

  return (
    <Modal onClose={onClose} title="Uitsluitingen Beheren" wide>
      <div className="flex flex-col gap-3">
        <div className="flex bg-gray-100 p-0.5 rounded-xl self-center">
          <button 
            onClick={() => setViewMode('edit')}
            className={`px-4 py-1 rounded-lg text-[10px] font-black transition-all ${viewMode === 'edit' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            BEWERKEN
          </button>
          <button 
            onClick={() => setViewMode('overview')}
            className={`px-4 py-1 rounded-lg text-[10px] font-black transition-all ${viewMode === 'overview' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            OVERZICHT
          </button>
        </div>

        {viewMode === 'edit' ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-3">
            {/* Student Selection */}
            <div className="flex flex-col gap-1.5 min-h-0">
              <h3 className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-2 leading-none">Kies Kleuter</h3>
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-5 gap-0.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {[...students].sort((a, b) => a.name.localeCompare(b.name)).map((s, idx) => (
                  <button
                    key={`excl-st-sel-${s.id}-${idx}`}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all border ${selectedStudentId === s.id ? 'bg-purple-100 border-purple-300 shadow-sm' : 'bg-white border-gray-100 hover:border-purple-200'}`}
                  >
                    <div className={`w-6 h-6 rounded-full ${s.avatarColor} flex items-center justify-center text-[8px] text-white font-black shadow-sm overflow-hidden`}>
                      {s.image ? <img src={s.image} alt="" className="w-full h-full object-cover" /> : s.name[0]}
                    </div>
                    <span className="text-[6px] font-black text-gray-700 text-center truncate w-full leading-none">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Exclusion Controls */}
            <div className="flex flex-col gap-3 bg-gray-50 p-3 rounded-[1.25rem] border-2 border-gray-100 min-h-0">
              {!selectedStudentId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 py-8">
                  <ShieldAlert size={32} strokeWidth={1} />
                  <p className="text-[9px] font-bold uppercase tracking-wider">Selecteer een kleuter</p>
                </div>
              ) : (
                <>
                  {/* Forbidden Corners */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">Verboden hoeken:</h4>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {corners.map((c, idx) => {
                        const isForbidden = currentExclusion.forbiddenCornerIds.includes(c.id);
                        return (
                          <button
                            key={`excl-corner-sel-${c.id}-${idx}`}
                            onClick={() => {
                              const next = isForbidden 
                                ? currentExclusion.forbiddenCornerIds.filter(id => id !== c.id)
                                : [...currentExclusion.forbiddenCornerIds, c.id];
                              updateExclusion({ forbiddenCornerIds: next });
                            }}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border-2 transition-all ${isForbidden ? 'bg-red-500 border-red-600 text-white shadow-sm' : 'bg-white border-gray-100 text-gray-500 hover:border-red-200'}`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-md ${isForbidden ? 'bg-white/20' : c.color} flex items-center justify-center text-white overflow-hidden shrink-0`}>
                              {c.image ? (
                                <img src={c.image} alt="" className="w-full h-full object-cover" />
                              ) : c.icon && ICON_MAP[c.icon] ? (
                                (() => {
                                  const Icon = ICON_MAP[c.icon!];
                                  return <Icon size={10} strokeWidth={3} />;
                                })()
                              ) : <LayoutGrid size={10} />}
                            </div>
                            <span className="text-[9px] font-black leading-none">{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Forbidden Students */}
                  <div className="flex flex-col gap-2 flex-1 min-h-0">
                    <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">Mag niet spelen met:</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-1 overflow-y-auto pr-1 custom-scrollbar">
                      {[...students].sort((a, b) => a.name.localeCompare(b.name)).filter(s => s.id !== selectedStudentId).map((s, idx) => {
                        const isForbidden = currentExclusion.forbiddenStudentIds.includes(s.id);
                        const isTwoWay = currentExclusion.isTwoWay[s.id] || false;
                        return (
                          <div 
                            key={`excl-forbidden-st-${s.id}-${idx}`} 
                            onClick={() => {
                              const next = isForbidden 
                                ? currentExclusion.forbiddenStudentIds.filter(id => id !== s.id)
                                : [...currentExclusion.forbiddenStudentIds, s.id];
                              updateExclusion({ forbiddenStudentIds: next });
                            }}
                            className={`flex flex-col gap-0.5 p-1 rounded-lg border transition-all cursor-pointer select-none ${isForbidden ? 'bg-red-500 border-red-600 shadow-sm hover:bg-red-650' : 'bg-white border-gray-100 hover:border-red-200 hover:bg-red-50/20'}`}
                          >
                            <div className="flex items-center gap-1">
                              <div className="flex items-center gap-1 flex-1 p-0.5 rounded transition-all">
                                <div className={`w-4 h-4 rounded-full ${s.avatarColor} flex items-center justify-center text-white font-black text-[7px] overflow-hidden shrink-0`}>
                                  {s.image ? <img src={s.image} alt="" className="w-full h-full object-cover" /> : s.name[0]}
                                </div>
                                <span className={`text-[7.5px] font-black truncate ${isForbidden ? 'text-white' : 'text-gray-700'}`}>{s.name}</span>
                              </div>
                              
                              {isForbidden && (
                                <div className="flex flex-col items-end gap-1 animate-in fade-in duration-150">
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateExclusion({ 
                                          isTwoWay: { ...currentExclusion.isTwoWay, [s.id]: !isTwoWay } 
                                        });
                                      }}
                                      className={`w-6 h-3 rounded-full relative transition-all shrink-0 cursor-pointer ${isTwoWay ? 'bg-white shadow-inner' : 'bg-red-700/50'}`}
                                    >
                                      <div className={`absolute top-0.5 w-2 h-2 rounded-full transition-all ${isTwoWay ? 'left-3.5 bg-red-500' : 'left-0.5 bg-white'}`} />
                                    </button>
                                    <span className="text-[6px] font-black text-white/90 uppercase tracking-tighter text-right leading-none whitespace-nowrap">
                                      {isTwoWay ? 'BEIDE KANTEN' : 'EÉN KANT'}
                                    </span>
                                  </div>
                                  <p className="text-[5px] font-bold text-white/80 uppercase leading-tight text-right w-full">
                                    {isTwoWay ? (
                                      `${selectedStudent.name} en ${s.name} mogen niet samen`
                                    ) : (
                                      `${selectedStudent.name} mag niet naar ${s.name}, maar ${s.name} wel naar ${selectedStudent.name}`
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {exclusions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                <ShieldAlert size={48} strokeWidth={1} />
                <p className="text-sm font-bold">Geen actieve uitsluitingen</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {exclusions.map((ex, idx) => {
                  const student = students.find(s => s.id === ex.studentId);
                  if (!student) return null;
                  if (ex.forbiddenCornerIds.length === 0 && ex.forbiddenStudentIds.length === 0) return null;

                  return (
                    <div key={`${ex.studentId}-${idx}`} className="bg-white p-4 rounded-3xl border-2 border-purple-100 shadow-sm flex flex-col gap-3">
                      <div className="flex items-center gap-3 border-b-2 border-gray-50 pb-3">
                        <div className={`w-8 h-8 rounded-full ${student.avatarColor} flex items-center justify-center text-white font-black text-xs overflow-hidden`}>
                          {student.image ? <img src={student.image} alt="" className="w-full h-full object-cover" /> : student.name[0]}
                        </div>
                        <span className="text-xs font-black text-gray-900">{student.name}</span>
                        <button 
                          onClick={() => {
                            setExclusions(prev => {
                              // 1. Remove the record itself
                              let next = prev.filter(e => e.studentId !== ex.studentId);
                              
                              // 2. Clean up any two-way links pointing to this student
                              return next.map(e => {
                                if (e.forbiddenStudentIds.includes(ex.studentId)) {
                                  const nextIsTwoWay = { ...e.isTwoWay };
                                  delete nextIsTwoWay[ex.studentId];
                                  return {
                                    ...e,
                                    forbiddenStudentIds: e.forbiddenStudentIds.filter(id => id !== ex.studentId),
                                    isTwoWay: nextIsTwoWay
                                  };
                                }
                                return e;
                              }).filter(e => e.forbiddenCornerIds.length > 0 || e.forbiddenStudentIds.length > 0);
                            });
                          }}
                          className="ml-auto p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>

                      {ex.forbiddenCornerIds.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Verboden Hoeken:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {ex.forbiddenCornerIds.map((cid, cidx) => {
                              const corner = corners.find(c => c.id === cid);
                              if (!corner) return null;
                              return (
                                <div key={`${cid}-${cidx}`} className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black border border-red-100">
                                  <div className={`w-4 h-4 rounded-md ${corner.color} flex items-center justify-center text-white overflow-hidden shrink-0`}>
                                    {corner.image ? (
                                      <img src={corner.image} alt="" className="w-full h-full object-cover" />
                                    ) : corner.icon && ICON_MAP[corner.icon] ? (
                                      (() => {
                                        const Icon = ICON_MAP[corner.icon!];
                                        return <Icon size={10} strokeWidth={3} />;
                                      })()
                                    ) : <LayoutGrid size={10} />}
                                  </div>
                                  <span>{corner.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {ex.forbiddenStudentIds.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Mag niet spelen met:</span>
                          <div className="flex flex-col gap-1.5">
                            {ex.forbiddenStudentIds.map((fid, fidx) => {
                              const other = students.find(s => s.id === fid);
                              if (!other) return null;
                              const isTwoWay = ex.isTwoWay[fid] || false;
                              return (
                                <div key={`${fid}-${fidx}`} className="flex flex-col gap-1 p-2 bg-red-50 border border-red-100 rounded-xl">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-5 h-5 rounded-full ${other.avatarColor} flex items-center justify-center text-white font-black text-[8px] overflow-hidden`}>
                                        {other.image ? <img src={other.image} alt="" className="w-full h-full object-cover" /> : other.name[0]}
                                      </div>
                                      <span className="text-[9px] font-black text-gray-900">{other.name}</span>
                                    </div>
                                    <div className={`px-1.5 py-0.5 rounded-full text-[6px] font-black uppercase ${isTwoWay ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'}`}>
                                      {isTwoWay ? 'Beide kanten' : 'Eén kant'}
                                    </div>
                                  </div>
                                  <p className="text-[7px] font-bold text-red-400 uppercase leading-tight italic">
                                    {isTwoWay ? (
                                      `${student.name} en ${other.name} mogen niet samen`
                                    ) : (
                                      `${student.name} mag niet naar ${other.name}, maar ${other.name} wel naar ${student.name}`
                                    )}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button 
          onClick={onClose}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
        >
          Klaar
        </button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose, title, wide, preventClose, footer }: { children: ReactNode, onClose: () => void, title: string, wide?: boolean, preventClose?: boolean, footer?: ReactNode }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-gray-900/60 backdrop-blur-md"
      onClick={preventClose ? undefined : onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-[1.5rem] sm:rounded-[2rem] w-full overflow-hidden shadow-2xl flex flex-col ${wide ? 'max-w-7xl h-[98vh] sm:h-[96vh]' : 'max-w-lg max-h-[95vh] sm:max-h-[90vh]'}`}
      >
        <div className={`${wide ? 'p-1.5 px-4' : 'p-4'} border-b-2 border-gray-50 flex justify-between items-center bg-white shrink-0`}>
          <h2 className={`${wide ? 'text-[11px] uppercase tracking-widest' : 'text-lg'} font-black text-gray-900 uppercase tracking-tight`}>{title}</h2>
          {!preventClose && (
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
              <X size={wide ? 14 : 20} strokeWidth={3} />
            </button>
          )}
        </div>
        <div className={`${wide ? 'p-1.5' : 'p-4'} overflow-y-auto custom-scrollbar flex-1`}>
          {children}
        </div>
        {footer && (
          <div className="p-6 bg-gray-50 border-t-2 border-gray-100 shrink-0">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function AddCornerForm({ 
  onSubmit, 
  onCancel,
  customImages = [],
  usedSymbols = [],
  initialData,
  onUpload,
  onDeleteImage,
  restrictToCapacity = false,
  isAdmin = false
}: { 
  onSubmit: (n: string, cap: number, i: string | null, img: string | null, color: string) => void, 
  onCancel: () => void,
  customImages?: string[],
  usedSymbols?: string[],
  initialData?: Corner,
  onUpload?: (img: string) => void,
  onDeleteImage?: (img: string) => void,
  restrictToCapacity?: boolean,
  isAdmin?: boolean
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [capacity, setCapacity] = useState(initialData?.capacity || 4);
  const [icon, setIcon] = useState<string | null>(() => {
    if (initialData?.icon) return initialData.icon;
    if (initialData?.image) return null;
    // Find first unused icon from the list
    return CORNER_ICONS.find(i => !usedSymbols.includes(i)) || 'LayoutGrid';
  });
  const [image, setImage] = useState<string | null>(initialData?.image || null);
  const [color, setColor] = useState(initialData?.color || COLORS[0]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditing = !!initialData;
  const isLocked = false; // Fix: Corners should always be editable by the teacher regardless of capacity settings

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setValidationError('Grote afbeelding gedetecteerd. Gebruik de bijsnijder om deze te optimaliseren.');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (_truncatedArea: any, pixelArea: any) => {
    setCroppedAreaPixels(pixelArea);
  };

  const saveCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    try {
      const croppedBase64 = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setImage(croppedBase64);
      setIcon(null);
      setValidationError(null);
      setImageToCrop(null);
      onUpload?.(croppedBase64);
    } catch (e) {
      console.error(e);
      setValidationError('Fout bij het bijsnijden van de afbeelding');
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <div className="flex justify-center mb-2">
        <div className={`w-40 rounded-[2rem] border-4 p-4 flex flex-col items-center justify-center transition-all ${color} ${getBorderClass(color)}`}>
          {/* Main Icon */}
          <div className="w-12 h-12 rounded-[1rem] border-2 border-gray-300 flex items-center justify-center mb-2 bg-white shadow-inner">
            {image ? (
              <img src={image} alt="Preview" className="w-full h-full object-cover rounded-[0.8rem]" referrerPolicy="no-referrer" />
            ) : (
              (() => {
                const Icon = icon && ICON_MAP[icon] ? ICON_MAP[icon] : LayoutGrid;
                return <Icon size={20} strokeWidth={2.5} className={getTextClass(color)} />;
              })()
            )}
          </div>

          <h3 className="text-[10px] font-black text-gray-900 truncate leading-tight mb-2 uppercase">{name || 'Naam hoek'}</h3>
          
          <div className={`grid gap-2 ${capacity > 6 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {Array.from({ length: Math.min(capacity, 6) }).map((_, idx) => (
              <div key={`cap-slot-${idx}`} className="w-8 h-8 rounded-full border-2 border-gray-200 bg-gray-200/50" />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {restrictToCapacity && (
          <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-3 mb-2">
             <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight leading-tight">
               Je past deze hoek aan op het bord. Om naam of kleur te wijzigen, doe je dit best in de hoekenbibliotheek (+ Nieuw).
             </p>
          </div>
        )}
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Naam van de hoek</label>
        <input 
          autoFocus
          disabled={isLocked || restrictToCapacity}
          value={name}
          onChange={e => setName(e.target.value)}
          className={`w-full p-3 bg-gray-50 border-2 border-gray-50 rounded-xl focus:border-orange-400 focus:bg-white outline-none transition-all font-black text-lg placeholder:text-gray-200 ${(isLocked || restrictToCapacity) ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder="Bijv. Bouwhoek"
        />
        {validationError && (
          <p className="text-[10px] font-bold text-red-500 uppercase px-1 animate-pulse">{validationError}</p>
        )}
      </div>

      {/* Color Selection */}
      <div className={`space-y-2 ${restrictToCapacity ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Kleur</label>
        <div className={`flex flex-wrap gap-2 p-3 bg-gray-50 rounded-2xl border-2 border-gray-100 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
          {COLORS.map((c, idx) => (
            <button
              key={`${c}-${idx}`}
              disabled={isLocked || restrictToCapacity}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                color === c ? 'border-gray-900 scale-110 shadow-md' : 'border-white hover:scale-105'
              } ${c}`}
            />
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Aantal plekken</label>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCapacity(Math.max(0, capacity - 1))}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg font-black hover:bg-gray-200 transition-colors"
            >
              -
            </button>
            <div className="flex-1 text-center text-2xl font-black">{capacity}</div>
            <button 
              onClick={() => setCapacity(Math.min(12, capacity + 1))}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg font-black hover:bg-gray-200 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className={`space-y-2 ${restrictToCapacity ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
        <div className="flex justify-between items-center">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Kies een icoon of upload foto</label>
          {image && !isLocked && !restrictToCapacity && (
            <button 
              onClick={() => { 
                if (onDeleteImage) {
                  onDeleteImage(image);
                }
                setImage(null); 
                setIcon(CORNER_ICONS.find(i => !usedSymbols.includes(i)) || 'LayoutGrid'); 
              }} 
              className="text-[10px] text-red-500 font-bold hover:underline"
            >
              Verwijder foto definitief
            </button>
          )}
        </div>
        
        <div className={`flex gap-4 items-start ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex-1">
            <IconPicker 
              selected={image || icon} 
              onSelect={(i) => { setIcon(i); setImage(null); }} 
              onSelectCustom={(img) => { setImage(img); setIcon(null); }}
              icons={CORNER_ICONS} 
              customImages={customImages}
              usedSymbols={usedSymbols}
              onDeleteImage={onDeleteImage}
              isAdmin={isAdmin}
            />
          </div>
          <label className="cursor-pointer flex-shrink-0">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
              <Plus size={24} />
            </div>
          </label>
        </div>
      </div>

      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col p-4 animate-in fade-in duration-300">
          <div className="flex-1 relative rounded-2xl overflow-hidden mb-4">
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="bg-white rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase text-gray-400">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-orange-500"
              />
            </div>
            <div className="text-center">
                <p className="text-[7px] text-gray-400 font-bold uppercase italic">
                * De afbeelding wordt automatisch bijgesneden tot een vierkant
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setImageToCrop(null)}
                className="flex-1 py-3 text-[10px] font-black uppercase text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
              >
                Annuleren
              </button>
              <button
                onClick={saveCroppedImage}
                className="flex-1 py-3 text-[10px] font-black uppercase text-white bg-orange-500 rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all font-black"
              >
                BIJSNIJDEN & OPSLAAN
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button 
          onClick={onCancel}
          className="flex-1 p-3 bg-gray-100 text-gray-500 rounded-xl font-black text-base hover:bg-gray-200 transition-colors"
        >
          Annuleren
        </button>
        <button 
          onClick={() => name && onSubmit(name, capacity, icon, image, color)}
          className="flex-1 p-3 bg-orange-500 text-white rounded-xl font-black text-base hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
        >
          <Save size={18} strokeWidth={3} />
          {isEditing ? 'Opslaan' : 'Toevoegen'}
        </button>
      </div>
    </div>
  );
}

function AddStudentForm({ 
  onSubmit, 
  onCancel,
  customImages = [],
  usedSymbols = [],
  initialData,
  onUpload,
  onDeleteImage,
  isAdmin = false
}: { 
  onSubmit: (n: string, c: string, i: string | null, img: string | null) => void, 
  onCancel: () => void,
  customImages?: string[],
  usedSymbols?: string[],
  initialData?: Student,
  onUpload?: (img: string) => void,
  onDeleteImage?: (img: string) => void,
  isAdmin?: boolean
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.avatarColor || COLORS[0]);
  const [icon, setIcon] = useState<string | null>(() => {
    if (initialData?.icon) return initialData.icon;
    if (initialData?.image) return null;
    // Find first unused icon from the list
    return STUDENT_ICONS.find(i => !usedSymbols.includes(i)) || 'Baby';
  });
  const [image, setImage] = useState<string | null>(initialData?.image || null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setValidationError('Grote afbeelding gedetecteerd. Gebruik de bijsnijder om deze te optimaliseren.');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (_truncatedArea: any, pixelArea: any) => {
    setCroppedAreaPixels(pixelArea);
  };

  const saveCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    try {
      const croppedBase64 = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setImage(croppedBase64);
      setIcon(null);
      setValidationError(null);
      setImageToCrop(null);
      onUpload?.(croppedBase64);
    } catch (e) {
      console.error(e);
      setValidationError('Fout bij het bijsnijden van de afbeelding');
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <div className="flex justify-center mb-2">
        <div className="flex flex-col items-center gap-1">
          <div className={`
            w-20 aspect-square rounded-full border-4 
            ${getBorderClass(color)}
            ${color}
            flex items-center justify-center text-white shadow-lg
            overflow-hidden
          `}>
            {image ? (
              <img src={image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : icon && ICON_MAP[icon] ? (
              (() => {
                const Icon = ICON_MAP[icon];
                return <Icon size={40} strokeWidth={3} />;
              })()
            ) : (
              <span className="text-3xl font-black">{name[0] || '?'}</span>
            )}
          </div>
          <span className="text-[10px] font-black truncate w-24 text-center tracking-tight leading-none px-1 text-gray-900">{name || 'Naam'}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Naam van de leerling</label>
        <input 
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-3 bg-gray-50 border-2 border-gray-50 rounded-xl focus:border-blue-400 focus:bg-white outline-none transition-all font-black text-lg placeholder:text-gray-200"
          placeholder="Bijv. Liam"
        />
        {validationError && (
          <p className="text-[10px] font-bold text-red-500 uppercase px-1 animate-pulse">{validationError}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Kies een kleur</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c, idx) => (
            <button
              key={`${c}-${idx}`}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-lg ${c} ${color === c ? 'ring-2 ring-blue-200 scale-110 z-10' : 'opacity-60 hover:opacity-100'} transition-all shadow-sm`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Kies een symbool of upload foto</label>
          {image && (
            <button 
              onClick={() => { 
                if (onDeleteImage) {
                  onDeleteImage(image);
                }
                setImage(null); 
                setIcon(STUDENT_ICONS.find(i => !usedSymbols.includes(i)) || 'Baby'); 
              }} 
              className="text-[10px] text-red-500 font-bold hover:underline"
            >
              Verwijder foto definitief
            </button>
          )}
        </div>
        
        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <IconPicker 
              selected={image || icon} 
              onSelect={(i) => { setIcon(i); setImage(null); }} 
              onSelectCustom={(img) => { setImage(img); setIcon(null); }}
              icons={STUDENT_ICONS} 
              customImages={customImages}
              usedSymbols={usedSymbols}
              onDeleteImage={onDeleteImage}
              isAdmin={isAdmin}
            />
          </div>
          <label className="cursor-pointer flex-shrink-0">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
              <Plus size={24} />
            </div>
          </label>
        </div>
      </div>

      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col p-4 animate-in fade-in duration-300">
          <div className="flex-1 relative rounded-2xl overflow-hidden mb-4">
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="bg-white rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase text-gray-400">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
            </div>
            <div className="text-center">
                <p className="text-[7px] text-gray-400 font-bold uppercase italic">
                * De afbeelding wordt automatisch bijgesneden tot een vierkant
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setImageToCrop(null)}
                className="flex-1 py-3 text-[10px] font-black uppercase text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
              >
                Annuleren
              </button>
              <button
                onClick={saveCroppedImage}
                className="flex-1 py-3 text-[10px] font-black uppercase text-white bg-indigo-500 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-all font-black"
              >
                BIJSNIJDEN & OPSLAAN
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button 
          onClick={onCancel}
          className="flex-1 p-3 bg-gray-100 text-gray-500 rounded-xl font-black text-base hover:bg-gray-200 transition-colors"
        >
          Annuleren
        </button>
        <button 
          onClick={() => name && onSubmit(name, color, icon, image)}
          className="flex-1 p-3 bg-blue-500 text-white rounded-xl font-black text-base hover:bg-blue-600 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
        >
          <UserPlus size={18} strokeWidth={3} />
          Toevoegen
        </button>
      </div>
    </div>
  );
}
