import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { LogOut, Download, Trash2, ShieldCheck, Eye, Scale, FileText, AlertTriangle, X, Cookie } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface InteractionRecord {
  timestamp: number;
  duration: number;
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

interface UserMenuProps {
  history: InteractionRecord[];
  students: Student[];
  corners: Corner[];
  evaluations: any[];
  customEvaluationTypes: any[];
  attendanceHistory: Record<string, string[]>;
  moetjes: any[];
  moetjeEvaluations: any[];
  choiceSettings: any;
  exclusions: any[];
  fixedCorners: any[];
  allCustomImages: string[];
  cornerHistory: Record<string, any>;
  moetjeHistory: Record<string, any>;
  onLogout?: () => void;
  onDeleteData?: () => void;
  isOwner?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ 
  history, 
  students, 
  corners, 
  evaluations,
  customEvaluationTypes,
  attendanceHistory,
  moetjes,
  moetjeEvaluations,
  choiceSettings,
  exclusions,
  fixedCorners,
  allCustomImages,
  cornerHistory,
  moetjeHistory,
  onLogout,
  onDeleteData,
  isOwner = true
}) => {
  const { user, logout } = useAuth();
  const [showPrivacyModal, setShowPrivacyModal] = React.useState(false);
  const [legalModalTab, setLegalModalTab] = React.useState<'privacy' | 'terms'>('privacy');

  if (!user) return null;

  const downloadHTML = () => {
    const exportData = {
      history,
      students,
      corners,
      evaluations,
      customEvaluationTypes,
      attendanceHistory,
      moetjes,
      moetjeEvaluations,
      choiceSettings,
      exclusions,
      fixedCorners,
      allCustomImages,
      cornerHistory,
      moetjeHistory,
      exportDate: new Date().toISOString(),
      user: {
        name: user.displayName,
        email: user.email
      }
    };

    const htmlContent = `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Keuzebord Export - ${user.displayName || user.email}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .tab-btn.active { background-color: #4f46e5; color: white; }
        .sub-tab-btn.active { background-color: #3b82f6; color: white; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .student-pill.active { background-color: #4f46e5; color: white; border-color: #4f46e5; }
    </style>
</head>
<body class="p-4 md:p-8">
    <div class="max-w-6xl mx-auto">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 class="text-3xl font-black text-gray-900 tracking-tight">Keuzebord Export</h1>
                <p class="text-gray-500 font-bold text-sm uppercase tracking-widest mt-1">${user.displayName || user.email} • ${new Date().toLocaleDateString('nl-NL')}</p>
            </div>
            <div class="flex gap-2 bg-gray-100 p-1 rounded-2xl overflow-x-auto max-w-full">
                <button onclick="showTab('stats')" class="tab-btn active px-4 py-2 rounded-xl text-xs font-black transition-all">STATS</button>
                <button onclick="showTab('attendance')" class="tab-btn px-4 py-2 rounded-xl text-xs font-black transition-all">AFWEZIGHEDEN</button>
            </div>
        </header>

        <main id="content">
            <!-- Dashboard -->
            <div id="dashboard" class="tab-content space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-50 flex flex-col items-center text-center">
                        <span class="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Totaal Bezoeken</span>
                        <span class="text-4xl font-black text-indigo-600" id="stat-total-visits">-</span>
                    </div>
                    <div class="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 flex flex-col items-center text-center">
                        <span class="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Leerlingen</span>
                        <span class="text-4xl font-black text-blue-500" id="stat-total-students">-</span>
                    </div>
                    <div class="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-50 flex flex-col items-center text-center">
                        <span class="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Hoeken</span>
                        <span class="text-4xl font-black text-emerald-500" id="stat-total-corners">-</span>
                    </div>
                    <div class="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-50 flex flex-col items-center text-center">
                        <span class="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Evaluaties</span>
                        <span class="text-4xl font-black text-amber-500" id="stat-total-evals">-</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-50">
                        <h2 class="text-lg font-black text-gray-900 mb-4 uppercase tracking-tighter">Meest bezochte hoeken</h2>
                        <div class="space-y-3" id="top-corners"></div>
                    </div>
                    <div class="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-50">
                        <h2 class="text-lg font-black text-gray-900 mb-4 uppercase tracking-tighter">Actiefste leerlingen</h2>
                        <div class="space-y-3" id="top-students"></div>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div id="stats" class="tab-content active space-y-6">
                <!-- Stats Header with Sub-nav -->
                <div class="flex flex-col gap-6">
                    <!-- Time Range Filter -->
                    <div class="flex justify-center">
                        <div class="flex bg-white rounded-2xl border-2 border-gray-100 p-1 shadow-sm">
                            <button onclick="setRange('day')" id="range-day" class="px-5 py-2 text-[10px] font-black hover:bg-gray-50 rounded-xl transition-all border-r border-gray-50">DAG</button>
                            <button onclick="setRange('week')" id="range-week" class="px-5 py-2 text-[10px] font-black hover:bg-gray-50 rounded-xl transition-all border-r border-gray-50">WEEK</button>
                            <button onclick="setRange('month')" id="range-month" class="px-5 py-2 text-[10px] font-black hover:bg-gray-50 rounded-xl transition-all border-r border-gray-50">MAAND</button>
                            <button onclick="setRange('schoolyear')" id="range-schoolyear" class="px-5 py-2 text-[10px] font-black hover:bg-gray-50 rounded-xl transition-all">SCHOOLJAAR</button>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-4 items-center justify-between">
                        <div class="flex bg-gray-100 p-1 rounded-2xl">
                            <button onclick="setStatsView('class')" id="stats-class-btn" class="px-6 py-2 rounded-xl text-xs font-black transition-all bg-white shadow-sm text-indigo-600">KLASOVERZICHT</button>
                            <button onclick="setStatsView('individual')" id="stats-indiv-btn" class="px-6 py-2 rounded-xl text-xs font-black transition-all text-gray-500">INDIVIDUEEL</button>
                        </div>

                        <!-- Class Sub-nav -->
                        <div id="class-sub-nav" class="flex gap-2 bg-white/50 p-1 rounded-2xl border border-gray-200">
                            <button onclick="setClassSubTab('sociogram')" id="sub-soc-btn" class="px-4 py-2 rounded-xl text-[10px] font-black transition-all bg-blue-500 text-white">SOCIOGRAM</button>
                            <button onclick="setClassSubTab('corners')" id="sub-cor-btn" class="px-4 py-2 rounded-xl text-[10px] font-black transition-all text-gray-400">HOEKEN</button>
                            <button onclick="setClassSubTab('logs')" id="sub-log-btn" class="px-4 py-2 rounded-xl text-[10px] font-black transition-all text-gray-400">LOGBOEK</button>
                        </div>

                        <!-- Student Selector (shown for Individual) -->
                        <div id="student-selector-container" class="hidden flex gap-2 bg-white p-1 rounded-2xl border border-gray-200 overflow-x-auto max-w-full">
                            <div id="student-selector-list" class="flex gap-2 px-1"></div>
                        </div>
                    </div>

                    <!-- Class Views -->
                    <div id="class-views" class="space-y-6">
                        <div id="stats-sociogram" class="stats-sub-view bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 shadow-sm overflow-hidden">
                            <h2 class="text-xl font-black uppercase tracking-tighter mb-6 text-indigo-600">Klas Sociogram (% samen)</h2>
                            <div class="overflow-auto custom-scrollbar relative" style="max-height: 80vh;">
                                <table id="sociogram-table" class="border-separate border-spacing-1"></table>
                            </div>
                        </div>

                        <div id="stats-corners" class="stats-sub-view hidden bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 shadow-sm">
                            <h2 class="text-xl font-black text-gray-900 mb-6 uppercase tracking-tighter">Hoekverdeling Volledige Klas</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" id="class-corner-stats"></div>
                        </div>

                        <div id="stats-logs" class="stats-sub-view hidden space-y-4">
                            <div class="bg-white p-5 rounded-3xl border-2 border-gray-50 shadow-sm flex justify-between items-center">
                                <h2 class="text-lg font-black text-gray-900 uppercase tracking-tighter">Klas Logboek</h2>
                                <span class="text-xs font-bold text-gray-400" id="class-log-count">- records</span>
                            </div>
                            <div class="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                                <table class="w-full text-left">
                                    <thead class="bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[9px]">
                                        <tr>
                                            <th class="px-6 py-4">Tijdstip</th>
                                            <th class="px-6 py-4">Hoek</th>
                                            <th class="px-6 py-4">Eval</th>
                                            <th class="px-6 py-4">Duur</th>
                                            <th class="px-6 py-4">Leerlingen</th>
                                        </tr>
                                    </thead>
                                    <tbody id="class-logs-table" class="divide-y divide-gray-50"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Individual Views -->
                    <div id="individual-views" class="hidden space-y-6">
                        <!-- Student Profile Card -->
                        <div id="student-profile" class="hidden grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 shadow-sm flex items-center gap-4">
                                <div id="indiv-avatar" class="w-16 h-16 rounded-3xl shrink-0"></div>
                                <div>
                                    <h3 id="indiv-name" class="text-2xl font-black text-gray-900 tracking-tighter uppercase"></h3>
                                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gedetailleerd overzicht</p>
                                </div>
                            </div>
                            <div class="bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 shadow-sm flex flex-col items-center justify-center">
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Totaal Tijd</span>
                                <span id="indiv-total-time" class="text-3xl font-black text-indigo-600"></span>
                            </div>
                            <div class="bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 shadow-sm flex flex-col items-center justify-center">
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sessies</span>
                                <span id="indiv-total-sessions" class="text-3xl font-black text-blue-500"></span>
                            </div>
                        </div>

                        <!-- Individual Sociogram Card -->
                        <div id="student-sociogram-card" class="hidden bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 shadow-sm overflow-hidden">
                            <h4 class="font-black text-gray-900 uppercase tracking-tighter mb-4">Met wie heeft deze kleuter gespeeld? (% samen)</h4>
                            <div class="overflow-x-auto custom-scrollbar pb-2">
                                <div id="indiv-sociogram-grid" class="flex gap-4"></div>
                            </div>
                        </div>

                        <div id="student-details" class="hidden grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Favorite Corners -->
                            <div class="bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 shadow-sm">
                                <h4 class="font-black text-gray-900 uppercase tracking-tighter mb-4">Favoriete Hoeken</h4>
                                <div id="indiv-corners" class="space-y-2"></div>
                            </div>
                            <!-- Recent Activity -->
                            <div class="bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 shadow-sm">
                                <h4 class="font-black text-gray-900 uppercase tracking-tighter mb-4">Logboek</h4>
                                <div class="overflow-y-auto custom-scrollbar pr-2" style="max-height: 400px;">
                                    <table class="w-full text-left">
                                        <tbody id="indiv-logs-table" class="divide-y divide-gray-50 text-[10px]"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div id="no-student-selected" class="bg-white/50 p-20 rounded-[3rem] border-2 border-dashed border-gray-200 text-center">
                            <p class="text-gray-400 font-black uppercase tracking-widest">Selecteer een leerling hierboven</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Standard Logboek (kept for backward compatibility or simple view) -->
            <div id="logs" class="tab-content space-y-4">
                <div class="flex justify-between items-center bg-white p-5 rounded-3xl border-2 border-gray-50 shadow-sm">
                    <h2 class="text-lg font-black text-gray-900 uppercase tracking-tighter">Volledig Logboek</h2>
                    <span class="text-xs font-bold text-gray-400" id="log-count">- records</span>
                </div>
                <div class="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[9px]">
                            <tr>
                                <th class="px-6 py-4">Tijdstip</th>
                                <th class="px-6 py-4">Hoek</th>
                                <th class="px-6 py-4">Eval</th>
                                <th class="px-6 py-4">Duur</th>
                                <th class="px-6 py-4">Leerlingen</th>
                            </tr>
                        </thead>
                        <tbody id="logs-table" class="divide-y divide-gray-50"></tbody>
                    </table>
                </div>
            </div>

            <!-- Attendance -->
            <div id="attendance" class="tab-content space-y-4">
                <div class="bg-white p-5 rounded-3xl border-2 border-gray-100 shadow-sm mb-6">
                    <h2 class="text-lg font-black text-gray-900 uppercase tracking-tighter">Afwezigheden</h2>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="attendance-list"></div>
            </div>

            <!-- Config -->
            <div id="config" class="tab-content space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-3xl border-2 border-gray-50 shadow-sm">
                        <h2 class="text-lg font-black text-gray-900 mb-4 uppercase tracking-tighter">Instellingen</h2>
                        <pre class="bg-gray-50 p-4 rounded-2xl text-[10px] font-mono overflow-auto" id="config-settings"></pre>
                    </div>
                    <div class="bg-white p-6 rounded-3xl border-2 border-gray-50 shadow-sm">
                        <h2 class="text-lg font-black text-gray-900 mb-4 uppercase tracking-tighter">Evaluatiesystemen</h2>
                        <div class="space-y-4" id="config-evals"></div>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-3xl border-2 border-gray-50 shadow-sm">
                    <h2 class="text-lg font-black text-gray-900 mb-4 uppercase tracking-tighter">Geregistreerde Leerlingen</h2>
                    <div class="grid grid-cols-2 md:grid-cols-6 gap-3" id="config-students"></div>
                </div>
            </div>
        </main>
    </div>

    <script>
        const data = ${JSON.stringify(exportData)};
        let currentStatsView = 'class'; 
        let currentClassSubTab = 'sociogram';
        let selectedStudentId = null;
        let currentRange = 'schoolyear';

        function formatDuration(ms) {
            if (ms < 0) ms = 0;
            const min = Math.round(ms / 60000);
            if (min < 60) return min + 'm';
            return Math.floor(min / 60) + 'u ' + (min % 60) + 'm';
        }

        function getFilteredHistory() {
            const now = new Date();
            let start = new Date(0);
            let end = new Date();

            if (currentRange === 'day') {
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else if (currentRange === 'week') {
                const day = now.getDay() || 7;
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
            } else if (currentRange === 'month') {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (currentRange === 'schoolyear') {
                const year = now.getFullYear();
                const month = now.getMonth();
                const startYear = month < 8 ? year - 1 : year;
                start = new Date(startYear, 8, 1);
            }

            return data.history.filter(r => r.timestamp >= start.getTime() && r.timestamp <= end.getTime());
        }

        function setRange(range) {
            currentRange = range;
            updateRangeButtons();
            
            // Re-run all analytics with filtered history
            initDashboard();
            initSociogram();
            initCornerStats();
            initClassLogs();
            if (selectedStudentId) selectStudent(selectedStudentId);
        }

        function updateRangeButtons() {
            ['day', 'week', 'month', 'schoolyear'].forEach(r => {
                const btn = document.getElementById('range-' + r);
                if (btn) {
                    btn.classList.toggle('bg-indigo-600', r === currentRange);
                    btn.classList.toggle('text-white', r === currentRange);
                    btn.classList.toggle('text-gray-500', r !== currentRange);
                }
            });
        }

        function showTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
            if (btn) btn.classList.add('active');
        }

        function setStatsView(view) {
            currentStatsView = view;
            document.getElementById('class-views').classList.toggle('hidden', view !== 'class');
            document.getElementById('individual-views').classList.toggle('hidden', view !== 'individual');
            document.getElementById('class-sub-nav').classList.toggle('hidden', view !== 'class');
            document.getElementById('student-selector-container').classList.toggle('hidden', view !== 'individual');
            
            // Update buttons
            document.getElementById('stats-class-btn').className = \`px-6 py-2 rounded-xl text-xs font-black transition-all \${view === 'class' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}\`;
            document.getElementById('stats-indiv-btn').className = \`px-6 py-2 rounded-xl text-xs font-black transition-all \${view === 'individual' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}\`;
        }

        function setClassSubTab(tab) {
            currentClassSubTab = tab;
            document.querySelectorAll('.stats-sub-view').forEach(el => el.classList.add('hidden'));
            document.getElementById('stats-' + tab).classList.remove('hidden');
            
            // Update buttons
            document.getElementById('sub-soc-btn').className = \`px-4 py-2 rounded-xl text-[10px] font-black transition-all \${tab === 'sociogram' ? 'bg-blue-500 text-white' : 'text-gray-400'}\`;
            document.getElementById('sub-cor-btn').className = \`px-4 py-2 rounded-xl text-[10px] font-black transition-all \${tab === 'corners' ? 'bg-blue-500 text-white' : 'text-gray-400'}\`;
            document.getElementById('sub-log-btn').className = \`px-4 py-2 rounded-xl text-[10px] font-black transition-all \${tab === 'logs' ? 'bg-blue-500 text-white' : 'text-gray-400'}\`;
        }

        function selectStudent(id) {
            selectedStudentId = id;
            const filteredHistory = getFilteredHistory();
            
            document.getElementById('no-student-selected').classList.add('hidden');
            document.getElementById('student-profile').classList.remove('hidden');
            document.getElementById('student-details').classList.remove('hidden');
            document.getElementById('student-sociogram-card').classList.remove('hidden');

            const student = data.students.find(s => s.id === id);
            document.getElementById('indiv-name').textContent = student.name;
            document.getElementById('indiv-avatar').style.backgroundColor = student.avatarColor;

            // Highlight pill
            document.querySelectorAll('.student-pill').forEach(el => {
                el.classList.toggle('active', el.getAttribute('onclick').includes(id));
            });

            // Calculate student stats
            const studentLogs = filteredHistory.filter(r => r.students.includes(id)).sort((a,b) => b.timestamp - a.timestamp);
            const totalMs = studentLogs.reduce((acc, r) => acc + r.duration, 0);
            
            document.getElementById('indiv-total-time').textContent = formatDuration(totalMs);
            document.getElementById('indiv-total-sessions').textContent = studentLogs.length;

            // Individual Sociogram
            const partnerTimes = {};
            studentLogs.forEach(r => {
                r.students.forEach(pid => {
                    if (pid === id) return;
                    partnerTimes[pid] = (partnerTimes[pid] || 0) + r.duration;
                });
            });

            const sortedPartners = Object.entries(partnerTimes)
                .map(([pid, ms]) => ({ id: pid, ms, student: data.students.find(s => s.id === pid) }))
                .filter(p => p.student)
                .sort((a, b) => b.ms - a.ms);

            document.getElementById('indiv-sociogram-grid').innerHTML = sortedPartners.length > 0 
                ? sortedPartners.map(p => {
                    const perc = totalMs > 0 ? Math.round(((p.ms / totalMs) / 0.83) * 100) : 0;
                    const displayPerc = Math.min(100, perc);
                    return \`
                        <div class="flex flex-col items-center min-w-[60px] p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <div class="w-10 h-10 rounded-xl mb-2 flex items-center justify-center text-white font-black text-xs shadow-sm" style="background-color: \${p.student.avatarColor}">
                                \${p.student.name[0]}
                            </div>
                            <span class="text-[8px] font-black text-gray-900 uppercase truncate w-full text-center mb-1">\${p.student.name}</span>
                            <span class="text-[10px] font-black text-indigo-600">\${displayPerc}%</span>
                        </div>
                    \`;
                }).join('')
                : '<p class="text-[10px] font-bold text-gray-400 py-4 px-2">Geen speelpartners in deze periode</p>';

            // All Corners Distribution for this student
            const cornerUsage = {};
            data.corners.forEach(c => cornerUsage[c.id] = 0);
            studentLogs.forEach(r => {
                if (cornerUsage[r.cornerId] !== undefined) {
                    cornerUsage[r.cornerId] += r.duration;
                }
            });
            const sortedUsage = Object.entries(cornerUsage).sort((a,b) => b[1] - a[1]);
            document.getElementById('indiv-corners').innerHTML = sortedUsage.map(([cid, ms]) => {
                const corner = data.corners.find(c => c.id === cid) || { name: 'Verwijderde hoek', color: '#ccc' };
                const perc = totalMs > 0 ? Math.round((ms / totalMs) * 100) : 0;
                return \`
                    <div class="flex flex-col p-3 bg-gray-50 rounded-2xl">
                        <div class="flex justify-between items-center mb-1">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full" style="background-color: \${corner.color}"></div>
                                <span class="font-black text-[10px] text-gray-700 uppercase tracking-tighter">\${corner.name}</span>
                            </div>
                            <span class="font-black text-indigo-600 text-[10px]">\${formatDuration(ms)} (\${perc}%)</span>
                        </div>
                        <div class="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div class="h-full bg-indigo-500 rounded-full" style="width: \${perc}%"></div>
                        </div>
                    </div>
                \`;
            }).join('');

            // Individual Logs
            document.getElementById('indiv-logs-table').innerHTML = studentLogs.map(r => \`
                <tr class="hover:bg-gray-50/50 transition-colors">
                    <td class="py-3 pr-4">
                        <div class="flex flex-col">
                            <span class="font-black text-gray-700 uppercase">\${r.cornerName}</span>
                            <span class="text-[8px] font-bold text-gray-400 uppercase">\${new Date(r.timestamp).toLocaleDateString()}</span>
                        </div>
                    </td>
                    <td class="py-3 text-right">
                        <span class="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg font-black uppercase text-[9px]">\${formatDuration(r.duration)}</span>
                    </td>
                </tr>
            \`).join('') || '<tr><td class="py-10 text-center text-gray-400">Nog geen geschiedenis</td></tr>';
        }

        // Initialize Everything
        function init() {
            updateRangeButtons();
            
            // Totals
            document.getElementById('stat-total-visits').textContent = data.history.length;
            document.getElementById('stat-total-students').textContent = data.students.length;
            document.getElementById('stat-total-corners').textContent = data.corners.length;
            document.getElementById('stat-total-evals').textContent = data.evaluations.length + data.moetjeEvaluations.length;
            document.getElementById('log-count').textContent = data.history.length + ' interacties';
            
            // Student selector (always shows all students)
            const sortedStudents = [...data.students].sort((a,b) => a.name.localeCompare(b.name));
            document.getElementById('student-selector-list').innerHTML = sortedStudents.map(s => \`
                <button onclick="selectStudent('\${s.id}')" class="student-pill px-4 py-2 rounded-xl text-[10px] font-black transition-all bg-gray-100 text-gray-500 whitespace-nowrap">
                    \${s.name}
                </button>
            \`).join('');

            initDashboard();
            initSociogram();
            initCornerStats();
            initClassLogs(); 
            initLogs(); 
            initAttendance();
            initConfig();
        }

        function initClassLogs() {
            const table = document.getElementById('class-logs-table');
            const filteredHistory = getFilteredHistory();
            const logs = [...filteredHistory].sort((a,b) => b.timestamp - a.timestamp);
            document.getElementById('class-log-count').textContent = logs.length + ' sessies';
            
            table.innerHTML = logs.map(r => {
                const date = new Date(r.timestamp);
                const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
                const fullDate = date.toLocaleDateString('nl-NL');
                const studentNames = r.students.map(id => data.students.find(s => s.id === id)?.name || id).join(', ');
                
                const eval = data.evaluations.find(e => e.timestamp >= r.timestamp && e.timestamp <= r.timestamp + r.duration && e.cornerId === r.cornerId);
                let evalChar = '-';
                if (eval) {
                    if (eval.rating === 'happy') evalChar = '😊';
                    else if (eval.rating === 'neutral') evalChar = '😐';
                    else if (eval.rating === 'sad') evalChar = '☹️';
                    else evalChar = '⭐';
                }

                return \`
                    <tr class="hover:bg-gray-50/50 transition-colors">
                        <td class="px-6 py-4">
                            <div class="flex flex-col">
                                <span class="text-xs font-black text-gray-900">\${time}</span>
                                <span class="text-[8px] font-bold text-gray-400 uppercase">\${fullDate}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 font-black text-[10px] text-gray-700 uppercase tracking-tight">\${r.cornerName}</td>
                        <td class="px-6 py-4 text-center">\${evalChar}</td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[10px]">
                                \${formatDuration(r.duration)}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-[10px] text-gray-500 font-bold line-clamp-1">\${studentNames}</td>
                    </tr>
                \`;
            }).join('') || '<tr><td colspan="5" class="py-10 text-center text-gray-400 italic">Geen gegevens voor deze periode</td></tr>';
        }

        function initDashboard() {
            const cornerCounts = {};
            const studentCounts = {};
            const filteredHistory = getFilteredHistory();

            filteredHistory.forEach(r => {
                cornerCounts[r.cornerName] = (cornerCounts[r.cornerName] || 0) + 1;
                r.students.forEach(id => {
                    const name = data.students.find(s => s.id === id)?.name || id;
                    studentCounts[name] = (studentCounts[name] || 0) + r.duration;
                });
            });

            const sortedCorners = Object.entries(cornerCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
            document.getElementById('top-corners').innerHTML = sortedCorners.map(([name, count]) => \`
                <div class="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-xl">
                    <span class="font-black text-gray-700 uppercase tracking-tighter">\${name}</span>
                    <span class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-black">\${count} keer</span>
                </div>
            \`).join('') || '<p class="text-[10px] text-gray-400 py-4 text-center">Nog geen data</p>';

            const sortedStudents = Object.entries(studentCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
            document.getElementById('top-students').innerHTML = sortedStudents.map(([name, ms]) => \`
                <div class="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-xl">
                    <span class="font-black text-gray-700 uppercase tracking-tighter">\${name}</span>
                    <span class="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black">\${formatDuration(ms)}</span>
                </div>
            \`).join('') || '<p class="text-[10px] text-gray-400 py-4 text-center">Nog geen data</p>';
        }

        function initSociogram() {
            const sortedStudents = [...data.students].sort((a, b) => a.name.localeCompare(b.name));
            const matrix = {};
            const totalTime = {};
            const filteredHistory = getFilteredHistory();

            // Calculate durations
            sortedStudents.forEach(s => { matrix[s.id] = {}; totalTime[s.id] = 0; });

            filteredHistory.forEach(r => {
                const duration = r.duration;
                if (duration < 30000) return;
                
                r.students.forEach(id => {
                    if (totalTime[id] !== undefined) totalTime[id] += duration;
                });

                r.students.forEach((id1, i) => {
                    r.students.forEach((id2, j) => {
                        if (id1 === id2) return;
                        matrix[id1][id2] = (matrix[id1][id2] || 0) + duration;
                    });
                });
            });

            const table = document.getElementById('sociogram-table');
            table.innerHTML = '';
            
            // Header Row
            const header = document.createElement('tr');
            header.innerHTML = '<th class="p-2 bg-gray-50 rounded-xl border border-gray-100"></th>' + sortedStudents.map(s => \`
                <th class="p-2 bg-gray-50 min-w-[30px] border border-gray-100 rounded-xl">
                    <div class="flex flex-col items-center">
                        <span class="text-[7px] font-black text-gray-500 uppercase [writing-mode:vertical-lr] rotate-180 mb-1">\${s.name}</span>
                        <div class="w-3 h-3 rounded-full shadow-inner" style="background-color: \${s.avatarColor}"></div>
                    </div>
                </th>
            \`).join('');
            table.appendChild(header);

            // Data Rows
            sortedStudents.forEach(s1 => {
                const row = document.createElement('tr');
                let html = \`<td class="p-2 bg-gray-50 text-[8px] font-black text-gray-700 rounded-xl border border-gray-100 transition-colors hover:bg-gray-100">\${s1.name}</td>\`;
                
                sortedStudents.forEach(s2 => {
                    if (s1.id === s2.id) {
                        html += '<td class="bg-gray-50/50 rounded-lg"></td>';
                    } else {
                        const timeTogether = (matrix[s1.id][s2.id] || 0) + (matrix[s2.id][s1.id] || 0);
                        const total = totalTime[s1.id] || 0;
                        const percentage = total > 0 ? Math.round(((timeTogether / total) / 0.83) * 100) : 0;
                        const displayPerc = Math.min(100, percentage);
                        
                        let color = '22, 197, 94';
                        let opacity = displayPerc / 100;
                        if (displayPerc === 0) opacity = 0;

                        const style = displayPerc > 0 ? \`background-color: rgba(\${color}, \${Math.max(0.1, opacity)}); border: 1px solid rgba(\${color}, 0.2);\` : 'background-color: #f9fafb;';
                        
                        html += \`
                            <td class="p-1 min-w-[32px] h-[32px]">
                                <div class="w-full h-full rounded-lg flex flex-col items-center justify-center transition-all hover:scale-110 cursor-help" title="\${s1.name} & \${s2.name}: \${formatDuration(timeTogether)}" style="\${style}">
                                    <span class="text-[7px] font-black \${displayPerc > 0 ? 'text-green-800' : 'text-gray-300'}">\${displayPerc}%</span>
                                </div>
                            </td>
                        \`;
                    }
                });
                row.innerHTML = html;
                table.appendChild(row);
            });
        }

        function initCornerStats() {
            const usage = {};
            let totalTime = 0;
            const filteredHistory = getFilteredHistory();

            // Initialize all corners
            data.corners.forEach(c => {
                usage[c.id] = { ms: 0, count: 0, name: c.name };
            });

            filteredHistory.forEach(r => {
                if (r.duration < 30000) return;
                totalTime += r.duration;
                if (usage[r.cornerId]) {
                    usage[r.cornerId].ms += r.duration;
                    usage[r.cornerId].count += 1;
                }
            });

            const statsList = Object.entries(usage).sort((a,b) => b[1].ms - a[1].ms);
            document.getElementById('class-corner-stats').innerHTML = statsList.map(([id, d]) => {
                const perc = totalTime > 0 ? Math.round((d.ms / totalTime) * 100) : 0;
                return \`
                    <div class="bg-gray-50 p-4 rounded-3xl border border-transparent hover:border-indigo-100 transition-all group">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-[10px] font-black text-gray-900 uppercase tracking-tighter">\${d.name}</span>
                            <span class="text-xs font-black text-indigo-600">\${perc}%</span>
                        </div>
                        <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div class="h-full bg-indigo-500 rounded-full transition-all duration-500" style="width: \${perc}%"></div>
                        </div>
                        <div class="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                            <span>\${formatDuration(d.ms)}</span>
                            <span>\${d.count} sessies</span>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function initLogs() {
            const table = document.getElementById('logs-table');
            const logs = [...data.history].sort((a,b) => b.timestamp - a.timestamp);
            
            table.innerHTML = logs.map(r => {
                const date = new Date(r.timestamp);
                const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
                const fullDate = date.toLocaleDateString('nl-NL');
                const studentNames = r.students.map(id => data.students.find(s => s.id === id)?.name || id).join(', ');
                
                // Simplified evaluation search
                const eval = data.evaluations.find(e => e.timestamp >= r.timestamp && e.timestamp <= r.timestamp + r.duration && e.cornerId === r.cornerId);
                let evalChar = '-';
                if (eval) {
                    if (eval.rating === 'happy') evalChar = '😊';
                    else if (eval.rating === 'neutral') evalChar = '😐';
                    else if (eval.rating === 'sad') evalChar = '☹️';
                    else evalChar = '⭐';
                }

                return \`
                    <tr class="hover:bg-gray-50/50 transition-colors">
                        <td class="px-6 py-4">
                            <div class="flex flex-col">
                                <span class="text-xs font-black text-gray-900">\${time}</span>
                                <span class="text-[8px] font-bold text-gray-400 uppercase">\${fullDate}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 font-black text-[10px] text-gray-700 uppercase tracking-tight">\${r.cornerName}</td>
                        <td class="px-6 py-4 text-center">\${evalChar}</td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[10px]">
                                \${formatDuration(r.duration)}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-[10px] text-gray-500 font-bold">\${studentNames}</td>
                    </tr>
                \`;
            }).join('');
        }

        function initAttendance() {
            const list = document.getElementById('attendance-list');
            const sorted = Object.entries(data.attendanceHistory).sort((a,b) => b[0].localeCompare(a[0]));
            list.innerHTML = sorted.map(([date, ids]) => {
                const names = ids.map(id => data.students.find(s => s.id === id)?.name || id).join(', ');
                return \`
                    <div class="bg-white p-5 rounded-[2rem] border-2 border-gray-50 shadow-sm">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-sm font-black text-gray-900 uppercase tracking-tight">\${date}</span>
                            <span class="px-2 py-1 bg-red-50 text-red-600 text-[9px] font-black rounded-lg uppercase">\${ids.length} AFWEZIG</span>
                        </div>
                        <p class="text-[10px] text-gray-400 font-bold tracking-tight">\${names || 'Iedereen aanwezig'}</p>
                    </div>
                \`;
            }).join('');
        }

        function initConfig() {
            document.getElementById('config-settings').textContent = JSON.stringify(data.choiceSettings, null, 2);
            document.getElementById('config-evals').innerHTML = data.customEvaluationTypes.map(t => \`
                <div class="bg-gray-50 p-4 rounded-3xl">
                    <h3 class="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-3">\${t.name}</h3>
                    <div class="flex flex-wrap gap-2">
                        \${t.options.map(o => \`<span class="px-3 py-1 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-600">\${o.label}</span>\`).join('')}
                    </div>
                </div>
            \`).join('');
            document.getElementById('config-students').innerHTML = data.students.map(s => \`
                <div class="flex items-center gap-2 p-2 bg-gray-50 rounded-2xl">
                    <div class="w-6 h-6 rounded-full shrink-0" style="background-color: \${s.avatarColor}"></div>
                    <span class="text-[10px] font-black text-gray-700 truncate">\${s.name}</span>
                </div>
            \`).join('');
        }

        init();
    <\/script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Keuzebord_Analytics_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-all outline-none">
        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
          <AvatarImage src={user.photoURL || undefined} />
          <AvatarFallback className="bg-indigo-500 text-white font-bold">
            {user.displayName?.[0] || user.email?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-black text-gray-900 px-2 py-1.5">
            <div className="flex flex-col">
              <span>{user.displayName || 'Gebruiker'}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{user.email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={downloadHTML}
          className="rounded-xl font-bold text-gray-600 focus:bg-gray-50 focus:text-indigo-600 cursor-pointer py-3"
        >
          <Download className="mr-2 h-5 w-5 text-indigo-500" />
          <div className="flex flex-col">
            <span>Download HTML Dashboard</span>
            <span className="text-[9px] text-gray-400 font-normal">Interactief overzicht van al jouw data</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => { setLegalModalTab('privacy'); setShowPrivacyModal(true); }}
          className="rounded-xl font-bold text-gray-600 focus:bg-gray-50 focus:text-indigo-600 cursor-pointer py-3"
        >
          <ShieldCheck className="mr-2 h-5 w-5 text-indigo-500" />
          <div className="flex flex-col">
            <span>Privacyverklaring & Cookies</span>
            <span className="text-[9px] text-gray-400 font-normal">Informatie over jouw gegevens & AVG</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => { window.dispatchEvent(new CustomEvent('open-cookie-settings')); }}
          className="rounded-xl font-bold text-gray-600 focus:bg-gray-50 focus:text-indigo-600 cursor-pointer py-3"
        >
          <Cookie className="mr-2 h-5 w-5 text-indigo-500" />
          <div className="flex flex-col">
            <span>Cookie-instellingen</span>
            <span className="text-[9px] text-gray-400 font-normal">Aanpassen van jouw functionele cookievoorkeuren</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => { setLegalModalTab('terms'); setShowPrivacyModal(true); }}
          className="rounded-xl font-bold text-gray-600 focus:bg-gray-50 focus:text-indigo-600 cursor-pointer py-3"
        >
          <Scale className="mr-2 h-5 w-5 text-indigo-500" />
          <div className="flex flex-col">
            <span>Gebruikersvoorwaarden</span>
            <span className="text-[9px] text-gray-400 font-normal">Wettelijke disclaimer & uitsluiting aansprakelijkheid</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        {isOwner && (
          <>
            <DropdownMenuItem 
              onClick={onDeleteData}
              className="rounded-lg text-[7px] font-black text-black hover:text-red-600 hover:bg-red-50 cursor-pointer py-2 px-1 mt-12 text-center justify-center border-none transition-all font-sans uppercase tracking-[0.1em]"
            >
              <span>account verwijderen</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="opacity-10" />
          </>
        )}
        <DropdownMenuItem 
          onClick={onLogout || logout}
          className="rounded-xl font-bold text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Uitloggen</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Privacyverklaring Modal Overlay inside UserMenu */}
    {showPrivacyModal && (
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-left">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 rounded-2xl text-indigo-600">
                {legalModalTab === 'privacy' ? <ShieldCheck size={22} strokeWidth={2.5} /> : <Scale size={22} strokeWidth={2.5} />}
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-950 uppercase tracking-tight font-sans">
                  {legalModalTab === 'privacy' ? 'Privacyverklaring & Cookies' : 'Algemene Gebruikersvoorwaarden & EULA'}
                </h3>
                <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest leading-none mt-1">
                  {legalModalTab === 'privacy' 
                    ? 'In overeenstemming met de AVG / GDPR & Belgische Privacywetgeving' 
                    : 'Juridisch bindende overeenkomst en volledige aansprakelijkheidsuitsluiting'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowPrivacyModal(false)}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all font-black text-xs cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/35 px-6 gap-1.5 pt-2 shrink-0">
            <button
              onClick={() => setLegalModalTab('privacy')}
              className={`px-4 py-3 font-black text-[10px] uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                legalModalTab === 'privacy'
                  ? 'border-indigo-600 text-indigo-650 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'
                  : 'border-transparent text-gray-400 hover:text-gray-650 bg-transparent'
              }`}
            >
              <ShieldCheck size={13} />
              Privacybeleid (AVG / GDPR)
            </button>
            <button
              onClick={() => setLegalModalTab('terms')}
              className={`px-4 py-3 font-black text-[10px] uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                legalModalTab === 'terms'
                  ? 'border-indigo-600 text-indigo-650 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'
                  : 'border-transparent text-gray-400 hover:text-gray-650 bg-transparent'
              }`}
            >
              <Scale size={13} />
              Gebruikersvoorwaarden & Disclaimer
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto text-xs text-gray-600 leading-relaxed font-bold custom-scrollbar flex-1">
            {legalModalTab === 'privacy' ? (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-indigo-50/50 text-indigo-900 p-4 rounded-2xl space-y-2 border border-indigo-100">
                  <p className="font-black text-[11.5px] uppercase tracking-wide">Bij Keuzebord hechten we grote waarde aan de privacy van jou én je leerlingen.</p>
                  <p className="text-[10.5px] font-semibold text-indigo-700 leading-relaxed">
                    Omdat deze applicatie in klaslokalen wordt ingezet voor jonge kleuters en leerlingen onder de 16 jaar, hebben we de gegevensverwerking tot een absoluut minimum beperkt en maximaal beveiligd. Hieronder lees je exact welke persoonsgegevens we wel en niet verwerken.
                  </p>
                </div>

                {/* Welke gegevens gebruikt deze app? */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-black text-gray-905 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span> 1. Welke gegevens worden verwerkt en waarom?
                  </h4>
                  <p className="text-[10.5px] font-medium text-gray-505">
                    Wij verwerken uitsluitend gegevens die noodzakelijk zijn om het klas-keuzebord te laten functioneren, bezochte hoeken te analyseren en de accounts van leerkrachten te beveiligen:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-650 text-[10.5px]">
                    <li><strong>E-mailadres & accountgegevens:</strong> Van jou (de leerkracht) om je account aan te maken, veilig in te loggen en je gegevens te synchroniseren zodat ze niet verloren gaan.</li>
                    <li><strong>Voor- en achternamen van leerlingen:</strong> Dit wordt ingevoerd door de leerkracht om de leerlingen op de digitale houten blokjes/kaartjes weer te geven. Inactieve accounts en namen worden na 2 jaar inactiviteit gewist.</li>
                    <li><strong>Foto/Afbeelding (Optioneel):</strong> De leerkracht heeft de optie om een foto/avatar te koppelen aan een leerling. Dit wordt direct versleuteld en beveiligd opgeslagen op onze Firebase-cloudopslag.</li>
                    <li><strong>IP-adres & Technische logs:</strong> Je browser- of apparaattype en IP-adres worden automatisch gelogd door de hostinginfrastructuur (Google Firebase). Dit gebeurt puur voor netwerkbeveiliging (zoals brute-force inlogaanvallen voorkomen) en storingsdiagnose. Deze logbestanden worden nach maximaal 30 dagen overschreven.</li>
                    <li><strong>Activiteiten & Evaluaties:</strong> De app houdt bij welke leerlingen op welk moment welke hoek hebben gekozen en eventueel hun humeur-/smileyevaluaties, om educatieve statistieken voor de leerkracht te berekenen.</li>
                  </ul>
                </div>

                {/* Welke gegevens verwerken we NIET? */}
                <span className="block border-t border-gray-100 my-4" />
                <div className="space-y-2">
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650">
                    <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span> 2. Welke gegevens gebruiken we absoluut NIET?
                  </h4>
                  <p className="text-[10.5px] font-medium text-gray-505">
                    Er is geen enkele functionele reden of juridische basis om gevoelige of bijzondere overheidsgegevens van leerlingen op te slaan. Wij slaan daarom de volgende informatie <strong>NIET</strong> op:
                  </p>
                  <table className="w-full text-left text-[10.5px] border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                    <thead className="bg-gray-50 text-[9px] uppercase font-black tracking-wider text-gray-400">
                      <tr>
                        <th className="px-3 py-2">Categorie</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2">Toelichting</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-105 font-bold text-gray-600">
                      <tr>
                        <td className="px-3 py-2"><strong>BSN / Rijksregisternummer</strong></td>
                        <td className="px-3 py-2 text-center text-red-600 font-extrabold text-[9px]">❌ GEEN VERWERKING</td>
                        <td className="px-3 py-2 text-gray-500 font-semibold text-[9.5px]">Alleen gemachtigde overheidsinstanties mogen het BSN gebruiken. Wij vragen of bewaren dit nooit.</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2"><strong>Bank- of financiële gegevens</strong></td>
                        <td className="px-3 py-2 text-center text-red-650 font-extrabold text-[9px]">❌ GEEN VERWERKING</td>
                        <td className="px-3 py-2 text-gray-500 font-semibold text-[9.5px]">Deze website is gratis in gebruik. We verwerken geen betaal- of creditcardgegevens.</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2"><strong>Bijzondere Persoonsgegevens</strong></td>
                        <td className="px-3 py-2 text-center text-red-600 font-extrabold text-[9px]">❌ GEEN VERWERKING</td>
                        <td className="px-3 py-2 text-gray-500 font-semibold text-[9.5px]">Informatie over ras, godsdienst, politieke voorkeur, medische status of seksuele geaardheid is strikt verboden te bewaren.</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2"><strong>Surfgedrag- & Marketingcookies</strong></td>
                        <td className="px-3 py-2 text-center text-red-600 font-extrabold text-[9px]">❌ GEEN VERWERKING</td>
                        <td className="px-3 py-2 text-gray-500 font-semibold text-[9.5px]">Wij maken geen gebruik van advertentienetwerken of marketingtrackers om surfgedrag over websites heen te volgen.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Minderjarigen en leerlingen jonger dan 16 */}
                <span className="block border-t border-gray-100 my-4" />
                <div className="space-y-2 p-4 bg-orange-50/70 text-orange-950 border border-orange-100 rounded-2xl">
                  <h4 className="font-sans font-black text-[11px] uppercase tracking-tight text-orange-850 flex items-center gap-1.5 flex-row">
                    <Scale size={16} /> 3. Leerlingen jonger dan 16 jaar
                  </h4>
                  <p className="text-[10.5px] font-semibold leading-relaxed">
                    De kleuters en scholieren die gebruik maken van het fysieke of digitale keuzebord zijn in de regel jonger dan 16 jaar. 
                  </p>
                  <p className="text-[10.5px] font-medium text-orange-900 mt-1 leading-relaxed">
                    Op grond van de AVG/GDPR is hiervoor wettelijk toestemming vereist van ouders of voogden. De school of jij als leerkracht verklaart bij registratie dat deze toestemming geregeld is onder de algemene AVG-richtlijnen van de school of dat ouders hiervoor uitdrukkelijke toestemming hebben gegeven (bijv. voor het gebruik van hun naam en/of foto in de beveiligde schoolomgeving).
                  </p>
                </div>

                {/* Bewaartermijnen */}
                <span className="block border-t border-gray-100 my-4" />
                <div className="space-y-2">
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650">
                    <Eye size={16} /> 4. Hoe lang worden gegevens bewaard? (Bewaartermijnen)
                  </h4>
                  <p className="text-[10.5px] font-medium text-gray-505">
                    Wij bewaren gegevens niet langer dan noodzakelijk voor het functionele doel:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-650 text-[10.5px]">
                    <li><strong>Actieve Accounts:</strong> Zolang je account actief gebruikt wordt, bewaren we je klasgegevens zodat je dagelijks direct aan de slag kunt. Accounts die al twee jaar inactief zijn, worden automatisch verwijderd.</li>
                    <li><strong>Definitieve verwijdering door jou:</strong> Je hebt onder de AVG het recht om vergeten te worden. Je kunt op elk gewenst moment ál je leerlingen, afbeeldingen, keuzes en je hele account met één klik <strong>permanent</strong> en definitief vernietigen. Dit regelt de app technisch direct via de knop <em>"Account verwijderen"</em> in het dropdown-menu van je profiel.</li>
                  </ul>
                </div>

                {/* Derden & Verwerkers */}
                <span className="block border-t border-gray-100 my-4" />
                <div className="space-y-2">
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-emerald-600">
                    <ShieldCheck size={16} /> 5. Delen met derden / ICT-Verwerkers
                  </h4>
                  <p className="text-[10.5px] font-medium text-gray-550 leading-relaxed font-bold">
                    Keuzebord verkoopt of deelt NOOIT gegevens met derden. We maken uitsluitend gebruik van gecertificeerde hostingpartners om de service stabiel en veilig in te richten:
                  </p>
                  <div className="p-3.5 bg-gray-50 rounded-xl space-y-1 text-[10.5px] border border-gray-100 leading-relaxed font-semibold text-gray-600">
                    <p><strong>Subverwerker:</strong> Google Firebase Cloud (Google Cloud Platform Inc.)</p>
                    <p><strong>Doel:</strong> Beveiligde database-opslag (Cloud Firestore) en authenticatie-infrastructuur (Firebase Authentication) op serverlocaties binnen de Europese Unie (EU).</p>
                    <p className="text-[10px] text-gray-400 font-bold leading-normal">Er zijn sluitende modelcontractbepalingen (Verwerkersovereenkomst) van kracht met Google Cloud om de strikte geheimhouding, back-ups en ISO 27001-informatiebeveiliging te garanderen.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-amber-50/70 text-amber-950 p-4 rounded-2xl space-y-2 border border-amber-100 flex items-start gap-3">
                  <div className="p-2 bg-white text-amber-600 rounded-xl shrink-0 mt-0.5 shadow-sm">
                    <AlertTriangle size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-black text-[11px] uppercase tracking-wide text-amber-900">Belangrijke Juridische Vrijwaring & Contract</p>
                    <p className="text-[10.5px] font-semibold text-amber-800 leading-normal">
                      Lees deze voorwaarden aandachtig door. Door gebruik te maken van dit platform (Keuzebord) sluit je een bindende, wettelijke overeenkomst en vrijwaar je de ontwikkelaar/auteur volledig van elke aansprakelijkheid.
                    </p>
                  </div>
                </div>

                {/* Art 1. Toepasselijkheid en Doel */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-gray-100 text-[9px] font-black flex items-center justify-center text-indigo-600">1</span>
                    Art 1. Toepasselijkheid & Contractsluiting
                  </h4>
                  <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed">
                    Deze Algemene Gebruikersvoorwaarden gelden voor elk gebruik van het platform Keuzebord. Door de applicatie te openen, te registreren of in te loggen, ontstaat er een bindend contract tussen de gebruiker (leerkracht of de vertegenwoordigde school) en de onafhankelijke ontwikkelaar/auteur van Keuzebord. Indien je niet akkoord gaat met alle bepalingen, ben je niet gemaaktigd om de app te gebruiken.
                  </p>
                </div>

                {/* Art 2. GDPR Rol & Privacy Verplichtingen */}
                <span className="block border-t border-gray-100 my-4" />
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-gray-100 text-[9px] font-black flex items-center justify-center text-indigo-600">2</span>
                    Art 2. GDPR Rollen: Gebruiker is de "Verwerkingsverantwoordelijke"
                  </h4>
                  <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed">
                    Onder de Europese Algemene Verordening Gegevensbescherming (AVG / GDPR) treedt de gebruiker (of de desbetreffende school) op als de <strong>Verwerkingsverantwoordelijke ("Data Controller")</strong> voor alle ingevoerde leerlingengegevens (zoals namen, klasbezetting, hoekenstatistieken en optionele foto's).
                  </p>
                  <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed mt-1">
                    De applicatie en haar ontwikkelaar fungeren louter als een <strong>technische passieve ICT-dienstverlener</strong>. De gebruiker/school draagt de volledige en exclusieve verantwoordelijkheid om:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-650 text-[10.5px] mt-1">
                    <li>Voorafgaande, geldige toestemming van de ouders of wettelijke voogden van de leerlingen (jonger dan 16 jaar) te verkrijgen voor de invoer en verwerking van namen en foto's.</li>
                    <li>De rechten van de betrokkene (recht op inzage, correctie, data-export of verwijdering) jegens ouders en leerlingen uit te voeren.</li>
                    <li>Te verifiëren dat het gebruik van deze cloud-applicatie conform het interne privacyreglement van de desbetreffende school of scholenkoepel is.</li>
                  </ul>
                </div>

                {/* Art 3. Volledige Exoneratie en Uitsluiting Aansprakelijkheid */}
                <span className="block border-t border-gray-100 my-4" />
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-red-650">
                    <span className="w-4 h-4 rounded bg-red-50 text-[9px] font-black flex items-center justify-center text-red-650">3</span>
                    Art 3. Totale Uitsluiting van Aansprakelijkheid (Exoneratie)
                  </h4>
                  <p className="text-[10.5px] text-red-900 bg-red-50/50 p-3 rounded-xl border border-red-105 font-medium leading-relaxed">
                    De applicatie wordt geleverd op een <strong>"as-is" (in de huidige feitelijke en juridische staat)</strong> en "as available" basis, zonder enige expliciete of impliciete garanties omtrent de werking, geschiktheid voor een specifiek doel, bugvrijheid of ononderbroken beschikbaarheid.
                  </p>
                  <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed mt-1.5">
                    Voor zover wettelijk toegestaan onder het Belgische en Europese recht (inclusief het Nieuw Belgisch Burgerlijk Wetboek), is de ontwikkelaar/auteur onder <strong>geen enkele omstandigheid</strong> aansprakelijk voor enige directe, indirecte, incidentele, bijzondere of gevolgschade. Dit omvat, maar is niet beperkt tot:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-650 text-[10.5px] mt-1">
                    <li><strong>Dataverlies of corruptie:</strong> Verlies of onbeschikbaarheid van leerlingengegevens, statistieken of instellingen in de Firestore online database.</li>
                    <li><strong>Infrastructuurstoringen:</strong> Technische storingen, uitval van de applicatieserver, of onbereikbaarheid op smartboards of tablets tijdens schooluren.</li>
                    <li><strong>Beveiligingsincidenten:</strong> Datalekken, hackaanvallen, of ongeoorloofde toegang tot gebruikersaccounts via phishing of zwakke wachtwoorden.</li>
                    <li><strong>Pedagogische of administratieve fouten:</strong> Eventuele foute keuze-registraties of foute statistieken bij humeurevaluaties.</li>
                  </ul>
                </div>

                {/* Art 4. Vrijwaring */}
                <span className="block border-t border-gray-100 my-4" />
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-gray-100 text-[9px] font-black flex items-center justify-center text-indigo-600">4</span>
                    Art 4. Vrijwaring (Indemnification)
                  </h4>
                  <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed">
                    De gebruiker en/of de school stemmen er onherroepelijk mee in de ontwikkelaar/auteur van Keuzebord volledig te verdedigen, te <strong>vrijwaren</strong> en schadeloos te stellen tegen alle claims, aansprakelijkheden, schadevergoedingen, boetes (inclusief administratieve boetes opgelegd door de Belgische Gegevensbeschermingsautoriteit (GBA) of toezichthouders), kosten of uitgaven (inclusief advocaatkosten) die voortvloeien uit of verband houden met de invoer van leerlinggegevens zonder ouderlijke toestemming of enige inbreuk op de verplichtingen onder de AVG/GDPR.
                  </p>
                </div>

                {/* Art 5. Beëindiging en Recht tot Vergetelheid */}
                <span className="block border-t border-gray-100 my-4" />
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-gray-950 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-gray-100 text-[9px] font-black flex items-center justify-center text-indigo-600">5</span>
                    Art 5. Beëindiging & Permanente Verwijdering
                  </h4>
                  <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed">
                    Zowel de gebruiker als de ontwikkelaar heeft het recht de overeenkomst op elk moment op te zeggen. De gebruiker kan dit doen door de knop "Account verwijderen" te gebruiken. Dit verwijdert onherroepelijk en permanent alle klassen, leerlingen en instellingen van onze servers. De ontwikkelaar behoudt zich het recht voor om bij misbruik, buitensporige belasting van servers of inbreuk op deze voorwaarden, de toegang tot het platform direct te blokkeren zonder voorafgaande kennisgeving en zonder recht op schadevergoeding.
                  </p>
                </div>

                {/* Art 6. Toepasselijk recht en bevoegde rechtbanken */}
                <span className="block border-t border-gray-100 my-4" />
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-gray-100 text-[9px] font-black flex items-center justify-center text-emerald-600">6</span>
                    Art 6. Toepasselijk recht & Bevoegde rechtbanken
                  </h4>
                  <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed">
                    Op deze overeenkomst, de Algemene Gebruikersvoorwaarden en alle geschillen die hieruit voortvloeien, is uitsluitend het <strong>Belgisch recht</strong> van toepassing. Alle geschillen van welke aard dan ook zullen bij uitsluiting worden voorgelegd aan de bevoegde rechtbanken van de maatschappelijke zetel van de ontwikkelaar of diens woonplaats in België.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end shrink-0">
            <Button 
              onClick={() => setShowPrivacyModal(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] py-5 px-8 rounded-xl shadow-md cursor-pointer"
            >
              Ik begrijp het & Sluit
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
