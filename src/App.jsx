import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";

const DEPTS = [
  { id: "ops", label: "Opérations", icon: "⚙️", color: "#4A90D9" },
  { id: "sales", label: "Ventes & Marketing", icon: "📈", color: "#E8A838" },
  { id: "prod", label: "Production", icon: "🏭", color: "#6BBF6B" },
  { id: "res", label: "Résilience", icon: "🌱", color: "#B07FE8" },
];

const STATUSES = ["À faire", "En cours", "Terminé", "Abandonné"];
const STATUS_ICONS = { "À faire": "📋", "En cours": "⚡", "Terminé": "✅", "Abandonné": "🗃" };
const PRIORITIES = ["Haute", "Moyenne", "Basse"];
const PRIO_COLOR = { Haute: "#E85555", Moyenne: "#E8A838", Basse: "#888" };
const PROJECT_STATUSES = ["Potentiel", "En cours", "Terminé", "Abandonné"];
const PROJECT_STATUS_COLOR = { Potentiel: "#aaa", "En cours": "#4A90D9", "Terminé": "#6BBF6B", "Abandonné": "#ccc" };
const TEMPS = [
  { score: 0, emoji: "💀", label: "Catastrophe" },
  { score: 1, emoji: "😫", label: "Très dur" },
  { score: 2, emoji: "😓", label: "Difficile" },
  { score: 3, emoji: "😟", label: "Compliqué" },
  { score: 4, emoji: "😐", label: "Plat" },
  { score: 5, emoji: "🙂", label: "OK" },
  { score: 6, emoji: "😊", label: "Bien" },
  { score: 7, emoji: "😄", label: "Très bien" },
  { score: 8, emoji: "😁", label: "Super" },
  { score: 9, emoji: "🤩", label: "Excellent" },
  { score: 10, emoji: "🚀", label: "Parfait" },
];

const initialProjects = [
  { id: "P001", name: "Refonte pitch coaching", dept: "sales", status: "En cours", description: "Clarifier l'offre et le message clé", startDate: "2026-01-15", endDate: "2026-03-31", estHours: 20, revenue: 0, notes: "Focus sur la différenciation" },
  { id: "P002", name: "Pipeline Q1 2026", dept: "sales", status: "En cours", description: "Développer 5 nouvelles opportunités", startDate: "2026-01-01", endDate: "2026-03-31", estHours: 30, revenue: 15000, notes: "" },
  { id: "P003", name: "Portefeuille investissement", dept: "ops", status: "En cours", description: "Rebalancer et suivre les positions", startDate: "2026-02-01", endDate: "2026-04-30", estHours: 10, revenue: 0, notes: "Saxo Bank + Stockopedia" },
  { id: "P004", name: "Livraison client Arnaud", dept: "prod", status: "En cours", description: "Facturation architecte + livrables", startDate: "2026-01-20", endDate: "2026-02-20", estHours: 15, revenue: 3500, notes: "Facture impayée — relancer" },
  { id: "P005", name: "Santé & sport", dept: "res", status: "En cours", description: "Maintenir routine sportive 3x/semaine", startDate: "2026-01-01", endDate: "2026-12-31", estHours: 0, revenue: 0, notes: "" },
  { id: "P006", name: "Nouveau service conseil", dept: "sales", status: "Potentiel", description: "Explorer une offre conseil entreprises PME", startDate: "", endDate: "", estHours: 0, revenue: 8000, notes: "À qualifier en mars" },
];

const initialTasks = [
  { id: "T001", name: "Préparer slides pitch v3", project: "P001", dept: "sales", status: "En cours", priority: "Haute", due: "2026-03-05", estH: 4, passedH: 2, temp: 3, notes: "" },
  { id: "T002", name: "Contacter 3 prospects LinkedIn", project: "P002", dept: "sales", status: "À faire", priority: "Haute", due: "2026-03-01", estH: 2, passedH: 0, temp: 2, notes: "" },
  { id: "T003", name: "Analyser positions Saxo", project: "P003", dept: "ops", status: "Terminé", priority: "Moyenne", due: "2026-02-20", estH: 3, passedH: 2.5, temp: 3, notes: "" },
  { id: "T004", name: "Relancer Arnaud facture", project: "P004", dept: "prod", status: "À faire", priority: "Haute", due: "2026-02-25", estH: 0.5, passedH: 0, temp: 1, notes: "3ème relance" },
  { id: "T005", name: "Session sport lundi", project: "P005", dept: "res", status: "Terminé", priority: "Moyenne", due: "2026-02-24", estH: 1, passedH: 1, temp: 4, notes: "" },
  { id: "T006", name: "Rédiger proposition client B", project: "P002", dept: "sales", status: "En cours", priority: "Haute", due: "2026-03-03", estH: 3, passedH: 1, temp: 2, notes: "" },
  { id: "T007", name: "Mettre à jour KPIs dashboard", project: "P003", dept: "ops", status: "À faire", priority: "Moyenne", due: "2026-03-07", estH: 1.5, passedH: 0, temp: 2, notes: "" },
  { id: "T008", name: "Lire 2 articles R&D", project: "P005", dept: "res", status: "À faire", priority: "Basse", due: "2026-03-10", estH: 1, passedH: 0, temp: 3, notes: "" },
  { id: "T009", name: "Facturer client A", project: "P004", dept: "prod", status: "Terminé", priority: "Haute", due: "2026-02-15", estH: 0.5, passedH: 0.5, temp: 2, notes: "" },
  { id: "T010", name: "Réviser budget Q1", project: "P003", dept: "ops", status: "Abandonné", priority: "Basse", due: "2026-02-28", estH: 2, passedH: 0, temp: 1, notes: "Reporté Q2" },
];

const initialJournal = [
  { id: "J001", date: "2026-02-26", type: "💡 Idée", temp: 3, title: "Nouveau format atelier coaching", description: "Format 2h intensif plutôt que sessions hebdo", project: "P001", dept: "sales", priority: "Haute", nextAction: "Tester avec un client existant" },
  { id: "J002", date: "2026-02-25", type: "🚧 Obstacle", temp: 1, title: "Arnaud ne répond plus", description: "3ème relance sans réponse — envisager courrier recommandé", project: "P004", dept: "prod", priority: "Haute", nextAction: "Appel direct vendredi" },
  { id: "J003", date: "2026-02-24", type: "📝 Note", temp: 4, title: "Bonne session sport", description: "Dans le flow — 45 min sans regarder l'heure", project: "P005", dept: "res", priority: "Basse", nextAction: "" },
];

const today = new Date(); today.setHours(0, 0, 0, 0);
const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
const tomorrowDate = new Date(today); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrowStr = tomorrowDate.toISOString().split("T")[0];
const endOfWeek = new Date(today);
endOfWeek.setDate(endOfWeek.getDate() + (endOfWeek.getDay() === 0 ? 0 : 7 - endOfWeek.getDay()));
const endOfWeekStr = endOfWeek.toISOString().split("T")[0];

const isOverdue = (due) => due && new Date(due) < today;

// Priority columns for Kanban
const PRIORITY_COLS = [
  { id: "Basse", label: "Basse", icon: "📦" },
  { id: "Moyenne", label: "Moyenne", icon: "📋" },
  { id: "Haute", label: "Haute", icon: "🔥" },
];

const getDueDateFilter = (due) => {
  if (!due) return "later";
  if (due < todayStr) return "overdue";
  if (due === todayStr) return "today";
  if (due === tomorrowStr) return "tomorrow";
  if (due <= endOfWeekStr) return "week";
  return "later";
};

// Period aggregation helpers
const getWeekKey = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay() || 7; // Mon=1..Sun=7
  d.setDate(d.getDate() + 4 - day); // Thursday of the week
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  // Return the Monday of that week as label
  const mon = new Date(dateStr + "T00:00:00");
  mon.setDate(mon.getDate() - (mon.getDay() || 7) + 1);
  return mon.getFullYear() + "-" + String(mon.getMonth() + 1).padStart(2, "0") + "-" + String(mon.getDate()).padStart(2, "0");
};
const getMonthKey = (dateStr) => dateStr.slice(0, 7); // YYYY-MM

const aggregateByPeriod = (data, period, valueKeys, mode = "sum") => {
  if (period === "daily") return data;
  const keyFn = period === "weekly" ? getWeekKey : getMonthKey;
  const groups = {};
  data.forEach(d => {
    const key = keyFn(d.date);
    if (!groups[key]) { groups[key] = { date: key, _count: 0 }; valueKeys.forEach(k => groups[key][k] = 0); }
    valueKeys.forEach(k => { groups[key][k] += (d[k] || 0); });
    groups[key]._count++;
  });
  if (mode === "avg") {
    Object.values(groups).forEach(g => { valueKeys.forEach(k => { g[k] = Math.round(g[k] / g._count * 10) / 10; }); });
  }
  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
};

const formatTodayLabel = () => {
  return today.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
};

const getDeptColor = (deptId) => DEPTS.find(d => d.id === deptId)?.color || "#888";
const getDeptIcon = (deptId) => DEPTS.find(d => d.id === deptId)?.icon || "";
const getTempEmoji = (score) => TEMPS.find(t => t.score === score)?.emoji || "🙂";

export default function App() {
  const [tab, setTab] = useState("home");
  const [projects, setProjects] = useState(initialProjects);
  const [tasks, setTasks] = useState(initialTasks);
  const [journal, setJournal] = useState(initialJournal);
  const [deptFilter, setDeptFilter] = useState("all");
  const [showModal, setShowModal] = useState(null);
  const [form, setForm] = useState({});
  const [dragging, setDragging] = useState(null);
  const [storageReady, setStorageReady] = useState(false);
  const [dataTab, setDataTab] = useState("projects");
  const [veloDept, setVeloDept] = useState("all");
  const [veloProject, setVeloProject] = useState("all");
  const [veloPeriod, setVeloPeriod] = useState("daily");
  const [satPeriod, setSatPeriod] = useState("daily");
  const [editingCell, setEditingCell] = useState(null); // {table, id, field}
  const [cellValue, setCellValue] = useState("");
  const [kanbanShowDone, setKanbanShowDone] = useState(false);
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [kanbanOrder, setKanbanOrder] = useState([]);
  const [dragOverId, setDragOverId] = useState(null);
  const [kanbanSearch, setKanbanSearch] = useState("");
  const [completionJournal, setCompletionJournal] = useState(null); // {task, project, dept} when completing a task
  const [journalProjectFilter, setJournalProjectFilter] = useState("all");
  const [journalDeptFilter, setJournalDeptFilter] = useState("all");
  const [journalTypeFilter, setJournalTypeFilter] = useState("all");
  const [journalScoreFilter, setJournalScoreFilter] = useState("all");
  const [kanbanDateFilter, setKanbanDateFilter] = useState("all");

  // ── HABIT TRACKER STATE ──
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [habitDeptFilter, setHabitDeptFilter] = useState("all");
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [quickLogHabit, setQuickLogHabit] = useState(null);

  // ── LOAD from Supabase on mount ──
  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: p }, { data: t }, { data: j }, { data: h }, { data: hl }] = await Promise.all([
          supabase.from("projects").select("*"),
          supabase.from("tasks").select("*"),
          supabase.from("journal").select("*"),
          supabase.from("habits").select("*"),
          supabase.from("habit_logs").select("*"),
        ]);
        if (p?.length) setProjects(p);
        if (t?.length) setTasks(t);
        if (j?.length) setJournal(j);
        if (h?.length) setHabits(h);
        if (hl?.length) setHabitLogs(hl);
      } catch (e) {}
      setStorageReady(true);
    };
    load();
  }, []);

  // ── SYNC helpers ──
  const syncRecord = async (table, record) => {
    try {
      const { error } = await supabase.from(table).upsert(record);
      if (error) console.error(`Sync error (${table}):`, error.message);
    } catch (e) { console.error(`Sync exception (${table}):`, e); }
  };
  const deleteRecord = async (table, id) => {
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) console.error(`Delete error (${table}):`, error.message);
    } catch (e) { console.error(`Delete exception (${table}):`, e); }
  };

  const updateProjects = (val) => setProjects(val);
  const updateTasks = (val) => setTasks(val);
  const updateJournal = (val) => setJournal(val);

  // ── HABIT TRACKER FUNCTIONS ──
  const updateHabits = (val) => setHabits(val);
  const updateHabitLogs = (val) => setHabitLogs(val);

  const quickLogHabitNow = async (habitId, completed = true) => {
    const logId = "HL" + Date.now();
    const record = {
      id: logId,
      habit_id: habitId,
      user_id: "default",
      logged_at: new Date().toISOString(),
      completed,
      created_at: new Date().toISOString(),
    };
    const updated = [...habitLogs, record];
    updateHabitLogs(updated);
    await syncRecord("habit_logs", record);
  };

  const saveHabit = async () => {
    if (!form.name) return;
    let updated, record;
    if (form.id) {
      record = { ...habits.find(h => h.id === form.id), ...form, updated_at: new Date().toISOString() };
      updated = habits.map(h => h.id === form.id ? record : h);
    } else {
      const id = "H" + Date.now();
      record = {
        ...form,
        id,
        user_id: "default",
        habit_type: form.habit_type || "acquire",
        icon: form.icon || (form.habit_type === "acquire" ? "✅" : "❌"),
        target_days: form.target_days || 60,
        allowed_misses: form.allowed_misses || 0,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      updated = [...habits, record];
    }
    updateHabits(updated);
    await syncRecord("habits", record);
    setShowModal(null);
  };

  const saveHabitLog = async () => {
    if (!quickLogHabit) return;
    const logId = "HL" + Date.now();
    const record = {
      id: logId,
      habit_id: quickLogHabit.id,
      user_id: "default",
      logged_at: form.logged_at || new Date().toISOString(),
      completed: form.completed !== undefined ? form.completed : true,
      note: form.note || null,
      time_spent_minutes: form.time_spent_minutes || null,
      temp: form.temp || null,
      created_at: new Date().toISOString(),
    };
    const updated = [...habitLogs, record];
    updateHabitLogs(updated);
    await syncRecord("habit_logs", record);
    setQuickLogHabit(null);
    setForm({});
  };

  const getHabitStreak = (habitId) => {
    const logs = habitLogs
      .filter(l => l.habit_id === habitId && l.completed)
      .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
    if (!logs.length) return 0;
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < logs.length; i++) {
      const logDate = new Date(logs[i].logged_at);
      logDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((now - logDate) / (1000 * 60 * 60 * 24));
      if (daysDiff === i) streak++;
      else break;
    }
    return streak;
  };

  const getHabitCompletionLast7Days = (habitId) => {
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().split("T")[0];
      const logged = habitLogs.some(l => {
        const logDate = new Date(l.logged_at);
        logDate.setHours(0, 0, 0, 0);
        return l.habit_id === habitId && l.completed && logDate.toISOString().split("T")[0] === dateStr;
      });
      last7.push(logged);
    }
    return last7;
  };

  // ── Export CSV ──
  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const rows = [keys.join(","), ...data.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  // ── Export All Data (Backup) ──
  const exportAllData = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    const tables = [
      { name: "projects", data: projects },
      { name: "tasks", data: tasks },
      { name: "journal", data: journal },
      { name: "habits", data: habits },
      { name: "habit_logs", data: habitLogs },
    ];
    
    let exported = [];
    tables.forEach(({ name, data }, index) => {
      if (data.length > 0) {
        setTimeout(() => exportCSV(data, `${timestamp}_${name}.csv`), index * 200);
        exported.push(`- ${timestamp}_${name}.csv`);
      }
    });
    
    setTimeout(() => {
      alert(`✅ Export complet lancé!\n\nFichiers téléchargés:\n${exported.join("\n")}`);
    }, tables.length * 200 + 100);
  };

  const filteredTasks = useMemo(() =>
    deptFilter === "all" ? tasks : tasks.filter(t => t.dept === deptFilter),
    [tasks, deptFilter]
  );

  const filteredJournal = useMemo(() =>
    deptFilter === "all" ? journal : journal.filter(j => j.dept === deptFilter),
    [journal, deptFilter]
  );

  // KPIs
  const kpis = useMemo(() => {
    const ft = filteredTasks.filter(t => t.status !== "Abandonné");
    const done = ft.filter(t => t.status === "Terminé");
    const active = ft.filter(t => t.status !== "Terminé");
    const overdue = active.filter(t => isOverdue(t.due));
    const estH = ft.reduce((s, t) => s + (t.estH || 0), 0);
    const passedH = ft.reduce((s, t) => s + (t.passedH || 0), 0);
    const avgTemp = filteredJournal.length
      ? (filteredJournal.reduce((s, j) => s + j.temp, 0) / filteredJournal.length).toFixed(1)
      : "—";
    const fp = deptFilter === "all" ? projects : projects.filter(p => p.dept === deptFilter);
    const activeProj = fp.filter(p => p.status === "Actif" || p.status === "En bonne voie" || p.status === "En retard").length;
    const completion = ft.length ? Math.round((done.length / ft.length) * 100) : 0;
    return { done: done.length, total: ft.length, completion, overdue: overdue.length, estH, passedH, avgTemp, activeProj };
  }, [filteredTasks, filteredJournal, projects, deptFilter]);

  const openModal = (type, prefill = {}) => {
    setForm(prefill);
    setShowModal(type);
  };

  const saveTask = () => {
    if (!form.name) return;
    let updated, record;
    const prevStatus = form.id ? tasks.find(t => t.id === form.id)?.status : null;
    const wasCompleted = form.id && prevStatus !== "Terminé" && form.status === "Terminé";
    if (form.id) {
      record = { ...tasks.find(t => t.id === form.id), ...form };
      // Only auto-set completedDate if status changes to Terminé AND no date was manually entered
      if (wasCompleted && !form.completedDate) record.completedDate = todayStr;
      // Only clear if status changes away from Terminé
      if (prevStatus === "Terminé" && form.status !== "Terminé") record.completedDate = null;
      updated = tasks.map(t => t.id === form.id ? record : t);
    } else {
      const id = "T" + Date.now();
      record = { ...form, id, passedH: 0, temp: form.temp ?? 5, status: form.status || "À faire", createdDate: todayStr };
      // Only auto-set if creating new task as Terminé AND no date provided
      if (form.status === "Terminé" && !form.completedDate) record.completedDate = todayStr;
      updated = [...tasks, record];
    }
    updateTasks(updated);
    syncRecord("tasks", record);
    setShowModal(null);
    if (wasCompleted) {
      setCompletionJournal({ taskId: record.id, taskName: record.name, project: record.project, dept: record.dept });
      setForm({ type: "📝 Note", temp: 5, dept: record.dept, project: record.project, priority: "Moyenne", title: "", description: "" });
    }
  };

  const saveJournal = () => {
    if (!form.title) return;
    let updated, record;
    if (completionJournal) {
      const id = "J" + Date.now();
      record = { ...form, id, date: new Date().toISOString().split("T")[0], project: completionJournal.project, dept: completionJournal.dept, linkedTask: completionJournal.taskId };
      updated = [record, ...journal];
    } else if (form.id) {
      record = { ...journal.find(j => j.id === form.id), ...form };
      updated = journal.map(j => j.id === form.id ? record : j);
    } else {
      const id = "J" + Date.now();
      record = { ...form, id, date: todayStr, createdDate: todayStr };
      updated = [record, ...journal];
    }
    updateJournal(updated);
    syncRecord("journal", record);
    setShowModal(null);
    setCompletionJournal(null);
  };

  const saveProject = () => {
    if (!form.name) return;
    let updated, record;
    if (form.id) {
      record = { ...projects.find(p => p.id === form.id), ...form };
      updated = projects.map(p => p.id === form.id ? record : p);
    } else {
      const id = "P" + Date.now();
      record = { ...form, id, createdDate: todayStr };
      updated = [...projects, record];
    }
    updateProjects(updated);
    syncRecord("projects", record);
    setShowModal(null);
  };

  const onDragStart = (taskId) => setDragging(taskId);
  const onDrop = (status) => {
    if (!dragging) return;
    const task = tasks.find(t => t.id === dragging);
    const record = { ...task, status };
    // Auto-set completedDate on drag to Terminé only if not already set, clear if dragged away
    if (status === "Terminé" && task.status !== "Terminé" && !task.completedDate) record.completedDate = todayStr;
    if (status !== "Terminé" && task.status === "Terminé") record.completedDate = null;
    const updated = tasks.map(t => t.id === dragging ? record : t);
    updateTasks(updated);
    syncRecord("tasks", record);
    setDragging(null);
  };

  // Kanban order sync — keep order in sync with tasks list
  useEffect(() => {
    setKanbanOrder(prev => {
      const taskIds = new Set(tasks.map(t => t.id));
      const kept = prev.filter(id => taskIds.has(id));
      const newIds = tasks.filter(t => !prev.includes(t.id)).map(t => t.id);
      return [...kept, ...newIds];
    });
  }, [tasks]);

  const onKanbanDragOver = (e, targetId) => {
    e.preventDefault();
    if (targetId !== dragging) setDragOverId(targetId);
  };

  const onKanbanDrop = (targetPriority) => {
    if (!dragging) { setDragOverId(null); return; }
    const task = tasks.find(t => t.id === dragging);
    if (!task) { setDragging(null); setDragOverId(null); return; }

    // Update priority when dropping in a different column
    if (task.priority !== targetPriority) {
      const record = { ...task, priority: targetPriority };
      const updated = tasks.map(t => t.id === dragging ? record : t);
      updateTasks(updated);
      syncRecord("tasks", record);
    }

    // Within-column reorder
    if (dragOverId && dragging !== dragOverId) {
      setKanbanOrder(prev => {
        const newOrder = prev.filter(id => id !== dragging);
        const targetIdx = newOrder.indexOf(dragOverId);
        newOrder.splice(targetIdx, 0, dragging);
        return newOrder;
      });
    }

    setDragging(null);
    setDragOverId(null);
  };

  // Inline cell editing
  const startEdit = (table, id, field, value) => {
    setEditingCell({ table, id, field });
    setCellValue(String(value ?? ""));
  };
  const commitEdit = async () => {
    if (!editingCell) return;
    const { table, id, field } = editingCell;
    if (table === "projects") {
      const record = { ...projects.find(p => p.id === id), [field]: cellValue };
      updateProjects(projects.map(p => p.id === id ? record : p));
      await syncRecord("projects", record);
    } else if (table === "tasks") {
      const prev = tasks.find(t => t.id === id);
      const record = { ...prev, [field]: cellValue };
      // Auto-set completedDate when status changes to Terminé, only if no date set; always clear if changing away
      if (field === "status" && cellValue === "Terminé" && prev.status !== "Terminé" && !prev.completedDate) record.completedDate = todayStr;
      if (field === "status" && cellValue !== "Terminé" && prev.status === "Terminé") record.completedDate = null;
      updateTasks(tasks.map(t => t.id === id ? record : t));
      await syncRecord("tasks", record);
    } else if (table === "journal") {
      const record = { ...journal.find(j => j.id === id), [field]: cellValue };
      updateJournal(journal.map(j => j.id === id ? record : j));
      await syncRecord("journal", record);
    } else if (table === "habits") {
      const record = { ...habits.find(h => h.id === id), [field]: cellValue, updated_at: new Date().toISOString() };
      updateHabits(habits.map(h => h.id === id ? record : h));
      await syncRecord("habits", record);
    } else if (table === "habit_logs") {
      const record = { ...habitLogs.find(hl => hl.id === id), [field]: cellValue };
      updateHabitLogs(habitLogs.map(hl => hl.id === id ? record : hl));
      await syncRecord("habit_logs", record);
    }
    setEditingCell(null);
  };
  const deleteRow = async (table, id) => {
    if (table === "projects") updateProjects(projects.filter(p => p.id !== id));
    else if (table === "tasks") updateTasks(tasks.filter(t => t.id !== id));
    else if (table === "journal") updateJournal(journal.filter(j => j.id !== id));
    else if (table === "habits") updateHabits(habits.filter(h => h.id !== id));
    else if (table === "habit_logs") updateHabitLogs(habitLogs.filter(hl => hl.id !== id));
    await deleteRecord(table, id);
  };

  const todayTasks = tasks.filter(t => t.due === todayStr && t.status !== "Terminé" && t.status !== "Abandonné");
  const recentTemp = journal.slice(0, 3).map(j => getTempEmoji(j.temp)).join(" ");

  const s = {
    app: { minHeight: "100vh", background: "#f5f5f5", color: "#222", fontFamily: "sans-serif", fontSize: 14 },
    header: { borderBottom: "1px solid #eee", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", position: "sticky", top: 0, zIndex: 100 },
    logo: { fontSize: 18, fontWeight: 700, color: "#222" },
    deptBar: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
    deptBtn: (active) => ({ padding: "6px 12px", borderRadius: 8, border: "1px solid #eee", background: active ? "#5b4ef8" : "#fafafa", color: active ? "#fff" : "#666", cursor: "pointer", fontSize: 13, fontFamily: "sans-serif", transition: "all 0.15s", fontWeight: active ? 600 : 400 }),
    tabs: { display: "flex", borderBottom: "1px solid #eee", padding: "0 24px", gap: 0, background: "#fff" },
    tabBtn: (active) => ({ padding: "12px 20px", background: "none", border: "none", borderBottom: active ? "2px solid #5b4ef8" : "2px solid transparent", color: active ? "#5b4ef8" : "#aaa", cursor: "pointer", fontSize: 14, fontFamily: "sans-serif", fontWeight: active ? 600 : 400, transition: "all 0.15s", marginBottom: -1 }),
    body: { padding: "24px" },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 13, color: "#aaa", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" },
    card: { background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: "12px 14px", marginBottom: 8 },
    kpiGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
    kpiCard: (color) => ({ background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: "16px" }),
    kpiValue: (color) => ({ fontSize: 30, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }),
    kpiLabel: { fontSize: 12, color: "#aaa" },
    kanbanGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, alignItems: "start" },
    kanbanCol: { background: "#f0f0f0", border: "1px solid #eee", borderRadius: 8, padding: "10px", minHeight: 200 },
    kanbanColHeader: { fontSize: 13, color: "#aaa", marginBottom: 10, padding: "0 2px", fontWeight: 600 },
    taskCard: (deptId) => ({ background: "#fafafa", border: "1px solid #eee", borderLeft: `3px solid ${getDeptColor(deptId)}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8, cursor: "grab", transition: "all 0.15s" }),
    tag: (color) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 6, background: color + "18", color, fontSize: 11, marginRight: 4 }),
    btn: (variant = "primary") => ({
      padding: "8px 16px",
      borderRadius: 8,
      border: variant === "ghost" ? "1px solid #ddd" : variant === "secondary" ? "1px solid #ddd" : variant === "danger" ? "1px solid #ffd0d0" : "none",
      background: variant === "primary" ? "#5b4ef8" : variant === "ghost" ? "#fff" : variant === "secondary" ? "#f0f0f0" : variant === "danger" ? "#fff5f5" : "#f0f0f0",
      color: variant === "primary" ? "#fff" : variant === "danger" ? "#E85555" : "#222",
      cursor: "pointer",
      fontSize: 14,
      fontFamily: "sans-serif",
      fontWeight: variant === "primary" ? 600 : 400,
    }),
    input: { width: "100%", padding: "8px 12px", background: "#fff", border: "1px solid #ddd", borderRadius: 8, color: "#222", fontFamily: "sans-serif", fontSize: 14, boxSizing: "border-box", outline: "none", marginBottom: 10 },
    select: { width: "100%", padding: "8px 12px", background: "#fff", border: "1px solid #ddd", borderRadius: 8, color: "#222", fontFamily: "sans-serif", fontSize: 14, boxSizing: "border-box", outline: "none", marginBottom: 10 },
    label: { fontSize: 12, color: "#aaa", display: "block", marginBottom: 4 },
    modal: { position: "fixed", inset: 0, background: "#00000044", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modalBox: { background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 24, width: 440, maxHeight: "80vh", overflowY: "auto" },
    row: { display: "flex", gap: 10 },
    tempBtn: (active) => ({ flex: 1, padding: "8px 4px", background: active ? "#f0eeff" : "#fafafa", border: active ? "1px solid #5b4ef8" : "1px solid #eee", borderRadius: 8, cursor: "pointer", fontSize: 18, transition: "all 0.1s" }),
    btnDanger: { padding: "8px 16px", borderRadius: 8, border: "1px solid #ffd0d0", background: "#fff5f5", color: "#E85555", cursor: "pointer", fontSize: 14, fontFamily: "sans-serif" },
  };

  return (
    <div style={s.app}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>⚡ Système Performance</div>
        <div style={s.deptBar}>
          <button style={s.deptBtn(deptFilter === "all")} onClick={() => setDeptFilter("all")}>TOUS</button>
          {DEPTS.map(d => (
            <button key={d.id} style={{ ...s.deptBtn(deptFilter === d.id), background: deptFilter === d.id ? d.color : "#fafafa", borderColor: deptFilter === d.id ? d.color : "#eee", color: deptFilter === d.id ? "#fff" : "#666" }}
              onClick={() => setDeptFilter(deptFilter === d.id ? "all" : d.id)}>
              {d.icon} {d.label}
            </button>
          ))}
          <button 
            style={{ ...s.btn("secondary"), marginLeft: "auto", padding: "6px 12px", fontSize: 13 }}
            onClick={exportAllData}
            title="Télécharger une sauvegarde complète (CSV)">
            💾 Backup
          </button>
        </div>
      </div>

      {/* Hello Martin */}
      <div style={{ textAlign: "center", padding: "32px 24px 16px", background: "#fff" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#222", margin: 0 }}>Hello Martin 👋</h1>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[["kanban", "🗂 Kanban"], ["home", "🏠 Accueil"], ["habits", "🎯 Habitudes"], ["projects", "📁 Projets"], ["dashboard", "📊 Dashboard"], ["journal", "📝 Journal"], ["data", "🗄 Données"]].map(([id, label]) => (
          <button key={id} style={s.tabBtn(tab === id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <div style={s.body}>

        {/* ── KANBAN ── */}
        {tab === "kanban" && (() => {
          let kanbanTasks = tasks;
          if (deptFilter !== "all") kanbanTasks = kanbanTasks.filter(t => t.dept === deptFilter);
          if (projectFilter === "none") kanbanTasks = kanbanTasks.filter(t => !t.project);
          else if (projectFilter !== "all") kanbanTasks = kanbanTasks.filter(t => t.project === projectFilter);
          if (statusFilter !== "all") kanbanTasks = kanbanTasks.filter(t => t.status === statusFilter);
          if (!kanbanShowDone) kanbanTasks = kanbanTasks.filter(t => t.status !== "Terminé" && t.status !== "Abandonné");
          if (kanbanSearch.trim()) {
            const q = kanbanSearch.toLowerCase();
            kanbanTasks = kanbanTasks.filter(t => t.name.toLowerCase().includes(q) || (t.notes || "").toLowerCase().includes(q));
          }
          // Date filter
          if (kanbanDateFilter !== "all") {
            kanbanTasks = kanbanTasks.filter(t => getDueDateFilter(t.due) === kanbanDateFilter);
          }

          // Sort: overdue first, then by custom order within each priority column
          kanbanTasks = [...kanbanTasks].sort((a, b) => {
            // Primary sort: overdue first
            const aOverdue = isOverdue(a.due) && a.status !== "Terminé" && a.status !== "Abandonné";
            const bOverdue = isOverdue(b.due) && b.status !== "Terminé" && b.status !== "Abandonné";
            if (aOverdue && !bOverdue) return -1;
            if (!aOverdue && bOverdue) return 1;
            
            // Secondary sort: custom kanban order
            const aIdx = kanbanOrder.indexOf(a.id);
            const bIdx = kanbanOrder.indexOf(b.id);
            return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
          });

          return (
            <div>
              {/* Filters */}
              <div style={{ display: "flex", gap: 16, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
                <div>
                  <label style={s.label}>Recherche</label>
                  <input style={{ ...s.input, marginBottom: 0, minWidth: 180 }} placeholder="🔍 Rechercher une tâche…" value={kanbanSearch} onChange={e => setKanbanSearch(e.target.value)} />
                </div>
                <div>
                  <label style={s.label}>Échéance</label>
                  <select style={{ ...s.select, marginBottom: 0, minWidth: 150 }} value={kanbanDateFilter} onChange={e => setKanbanDateFilter(e.target.value)}>
                    <option value="all">Toutes dates</option>
                    <option value="overdue">⚠ En retard</option>
                    <option value="today">📌 Aujourd'hui</option>
                    <option value="tomorrow">📅 Demain</option>
                    <option value="week">🗓 Cette semaine</option>
                    <option value="later">📦 Plus tard</option>
                  </select>
                </div>
                <div>
                  <label style={s.label}>Projet</label>
                  <select style={{ ...s.select, marginBottom: 0, minWidth: 170 }} value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
                    <option value="all">Tous les projets</option>
                    <option value="none">Aucun projet</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{getDeptIcon(p.dept)} {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Statut</label>
                  <select style={{ ...s.select, marginBottom: 0, minWidth: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">Tous les statuts</option>
                    {STATUSES.map(st => <option key={st} value={st}>{STATUS_ICONS[st]} {st}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>Département</label>
                  <select style={{ ...s.select, marginBottom: 0, minWidth: 160 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                    <option value="all">Tous les départements</option>
                    {DEPTS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
                  </select>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#666", cursor: "pointer", userSelect: "none" }}>
                    <input type="checkbox" checked={kanbanShowDone} onChange={e => setKanbanShowDone(e.target.checked)} style={{ accentColor: "#5b4ef8", width: 16, height: 16, cursor: "pointer" }} />
                    Tâches terminées
                  </label>
                  <button style={s.btn("primary")} onClick={() => openModal("task", { status: "À faire", priority: "Moyenne", dept: deptFilter === "all" ? "ops" : deptFilter, temp: 2 })}>+ Nouvelle tâche</button>
                </div>
              </div>

              {/* Priority columns */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, alignItems: "start" }}>
                {PRIORITY_COLS.map(col => {
                  const colTasks = kanbanTasks.filter(t => t.priority === col.id);
                  return (
                    <div key={col.id} style={s.kanbanCol}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => onKanbanDrop(col.id)}>
                      <div style={s.kanbanColHeader}>
                        {col.icon} {col.label} <span style={{ color: "#333", marginLeft: 4 }}>({colTasks.length})</span>
                      </div>
                      {colTasks.map(task => {
                        const taskOverdue = isOverdue(task.due) && task.status !== "Terminé" && task.status !== "Abandonné";
                        return (
                          <div key={task.id}
                            style={{
                              ...s.taskCard(task.dept),
                              opacity: dragging === task.id ? 0.4 : 1,
                              borderTop: dragOverId === task.id ? "2px solid #5b4ef8" : "none",
                              transition: "opacity 0.15s",
                              background: taskOverdue ? "#fff5f5" : "#fafafa",
                            }}
                            draggable
                            onDragStart={() => onDragStart(task.id)}
                            onDragOver={e => onKanbanDragOver(e, task.id)}
                            onDragEnd={() => { setDragging(null); setDragOverId(null); }}
                            onClick={() => openModal("task", { ...task })}>
                            <div style={{ fontSize: 14, color: "#222", marginBottom: 6, lineHeight: 1.4 }}>
                              {taskOverdue && <span style={{ color: "#E85555", marginRight: 4 }}>⚠</span>}
                              {task.name}
                            </div>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                              <span style={s.tag(getDeptColor(task.dept))}>{getDeptIcon(task.dept)}</span>
                              <span style={s.tag("#555")}>{STATUS_ICONS[task.status]} {task.status}</span>
                            </div>
                            <div style={{ fontSize: 11, color: taskOverdue ? "#E85555" : "#aaa", marginTop: 6 }}>
                              {taskOverdue ? `⚠ Retard: ${task.due}` : `Échéance ${task.due || "—"}`}
                            </div>
                          </div>
                        );
                      })}
                      {colTasks.length === 0 && <div style={{ color: "#ddd", fontSize: 13, textAlign: "center", padding: "20px 0" }}>—</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── ACCUEIL ── */}
        {tab === "home" && (
          <div style={{ maxWidth: 700 }}>
            {/* Today */}
            <div style={s.section}>
              <div style={s.sectionTitle}><span>AUJOURD'HUI — {formatTodayLabel()}</span></div>
              {todayTasks.length === 0
                ? <div style={{ ...s.card, color: "#aaa" }}>Aucune tâche aujourd'hui.</div>
                : todayTasks.map(t => (
                  <div key={t.id} style={s.card} onClick={() => openModal("task", { ...t })}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 13, color: "#E8E4DC", marginBottom: 4 }}>{t.name}</div>
                        <span style={s.tag(getDeptColor(t.dept))}>{getDeptIcon(t.dept)} {DEPTS.find(d => d.id === t.dept)?.label}</span>
                        <span style={s.tag(PRIO_COLOR[t.priority])}>{t.priority}</span>
                      </div>
                      <span style={{ fontSize: 13, color: "#aaa" }}>{t.estH}h est.</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Quick stats */}
            <div style={s.section}>
              <div style={s.sectionTitle}><span>RÉSUMÉ RAPIDE</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {[
                  ["Tâches actives", tasks.filter(t => t.status === "En cours").length, "#4A90D9"],
                  ["En retard", tasks.filter(t => isOverdue(t.due) && t.status !== "Terminé" && t.status !== "Abandonné").length, "#E85555"],
                  ["Cette semaine", tasks.filter(t => t.passedH > 0).reduce((s, t) => s + t.passedH, 0).toFixed(1) + "h", "#6BBF6B"],
                  ["Température", recentTemp || "—", "#B07FE8"],
                ].map(([label, val, color]) => (
                  <div key={label} style={s.kpiCard(color)}>
                    <div style={s.kpiValue(color)}>{val}</div>
                    <div style={s.kpiLabel}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active projects */}
            <div style={s.section}>
              <div style={s.sectionTitle}><span>PROJETS ACTIFS</span></div>
              {projects.filter(p => ["Actif", "En bonne voie", "En retard"].includes(p.status)).map(p => (
                <div key={p.id} style={{ ...s.card, borderLeft: `3px solid ${getDeptColor(p.dept)}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ color: "#E8E4DC", fontSize: 13 }}>{p.name}</span>
                      <span style={{ ...s.tag(getDeptColor(p.dept)), marginLeft: 8 }}>{getDeptIcon(p.dept)}</span>
                    </div>
                    <span style={{ ...s.tag(p.status === "En retard" ? "#E85555" : p.status === "En bonne voie" ? "#6BBF6B" : "#4A90D9") }}>{p.status}</span>
                  </div>
                  {p.revenue > 0 && <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>€{p.revenue.toLocaleString()} prévu</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROJETS ── */}
        {tab === "projects" && (
          <div>
            <div style={{ ...s.sectionTitle, marginBottom: 16 }}>
              <span>PROJETS</span>
              <button style={s.btn("primary")} onClick={() => openModal("project", { status: "Potentiel", dept: deptFilter === "all" ? "ops" : deptFilter, estHours: 0, revenue: 0 })}>+ Nouveau projet</button>
            </div>
            {PROJECT_STATUSES.map(ps => {
              const grouped = (deptFilter === "all" ? projects : projects.filter(p => p.dept === deptFilter)).filter(p => p.status === ps);
              if (grouped.length === 0) return null;
              return (
                <div key={ps} style={s.section}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ ...s.tag(PROJECT_STATUS_COLOR[ps]), fontSize: 12 }}>{ps}</span>
                    <span style={{ fontSize: 12, color: "#aaa" }}>{grouped.length} projet{grouped.length > 1 ? "s" : ""}</span>
                  </div>
                  {grouped.map(p => {
                    const projTasks = tasks.filter(t => t.project === p.id);
                    const doneTasks = projTasks.filter(t => t.status === "Terminé").length;
                    const pct = projTasks.length ? Math.round((doneTasks / projTasks.length) * 100) : 0;
                    const deptColor = getDeptColor(p.dept);
                    return (
                      <div key={p.id} style={{ ...s.card, borderLeft: `3px solid ${deptColor}`, cursor: "pointer" }}
                        onClick={() => openModal("project", { ...p })}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: "#222" }}>{p.name}</span>
                            <span style={{ ...s.tag(deptColor), marginLeft: 8 }}>{getDeptIcon(p.dept)} {DEPTS.find(d => d.id === p.dept)?.label}</span>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {p.revenue > 0 && <span style={{ fontSize: 12, color: "#6BBF6B", fontWeight: 600 }}>€{p.revenue.toLocaleString()}</span>}
                          </div>
                        </div>
                        {p.description && <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{p.description}</div>}
                        {projTasks.length > 0 && (
                          <div style={{ marginBottom: 6 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: "#aaa" }}>{doneTasks}/{projTasks.length} tâches</span>
                              <span style={{ fontSize: 11, color: "#aaa" }}>{pct}%</span>
                            </div>
                            <div style={{ background: "#f0f0f0", borderRadius: 4, height: 5 }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: deptColor, borderRadius: 4, transition: "width 0.3s" }} />
                            </div>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#aaa" }}>
                          {p.endDate && <span>📅 {p.endDate}</span>}
                          {p.estHours > 0 && <span>⏱ {p.estHours}h est.</span>}
                          {p.notes && <span style={{ color: "#bbb" }}>— {p.notes}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ── HABITUDES ── */}
        {tab === "habits" && (() => {
          const activeHabits = habits.filter(h => !h.archived);
          const filteredHabits = habitDeptFilter === "all" ? activeHabits : activeHabits.filter(h => h.department_id === habitDeptFilter);
          
          // Group by department
          const habitsByDept = DEPTS.map(dept => ({
            ...dept,
            habits: filteredHabits.filter(h => h.department_id === dept.id),
          })).filter(d => d.habits.length > 0);
          
          const ungrouped = filteredHabits.filter(h => !h.department_id);

          // Today's habits for quick dashboard
          const todayStr = new Date().toISOString().split("T")[0];
          const todayLogs = habitLogs.filter(l => {
            const logDate = new Date(l.logged_at).toISOString().split("T")[0];
            return logDate === todayStr;
          });
          const todayComplete = todayLogs.filter(l => l.completed).length;

          return (
            <div>
              <div style={{ ...s.sectionTitle, marginBottom: 16 }}>
                <span>HABITUDES — SUIVI</span>
                <button style={s.btn("primary")} onClick={() => {
                  setForm({ habit_type: "acquire", target_days: 60, allowed_misses: 0, icon: "✅" });
                  setShowModal("habit");
                }}>+ Nouvelle habitude</button>
              </div>

              {/* Today's Quick Dashboard */}
              <div style={{ ...s.card, marginBottom: 24, background: "#f9f9ff", border: "1px solid #e0e0ff" }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#5b4ef8" }}>
                  📅 Aujourd'hui — {todayStr}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
                  {todayComplete}/{activeHabits.length} habitudes complétées {activeHabits.length > 0 && `(${Math.round((todayComplete / activeHabits.length) * 100)}%)`}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {activeHabits.map(habit => {
                    const logged = todayLogs.some(l => l.habit_id === habit.id && l.completed);
                    return (
                      <button
                        key={habit.id}
                        onClick={() => !logged && quickLogHabitNow(habit.id)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: logged ? "2px solid #6BBF6B" : "1px solid #ddd",
                          background: logged ? "#e8f5e9" : "#fff",
                          cursor: logged ? "default" : "pointer",
                          fontSize: 13,
                          color: logged ? "#6BBF6B" : "#222",
                          fontWeight: logged ? 600 : 400,
                          transition: "all 0.2s",
                        }}
                        title={logged ? "Déjà fait aujourd'hui" : "Cliquer pour marquer comme fait"}>
                        {habit.icon} {habit.name} {logged && "✓"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Department filter */}
              <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#aaa" }}>Département:</span>
                <button style={s.deptBtn(habitDeptFilter === "all")} onClick={() => setHabitDeptFilter("all")}>Tous</button>
                {DEPTS.map(d => (
                  <button key={d.id} style={s.deptBtn(habitDeptFilter === d.id)} onClick={() => setHabitDeptFilter(d.id)}>
                    {d.icon} {d.label}
                  </button>
                ))}
              </div>

              {/* Habits by department */}
              {habitsByDept.map(dept => (
                <div key={dept.id} style={s.section}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: dept.color, marginBottom: 10 }}>
                    {dept.icon} {dept.label.toUpperCase()}
                  </div>
                  {dept.habits.map(habit => {
                    const streak = getHabitStreak(habit.id);
                    const last7 = getHabitCompletionLast7Days(habit.id);
                    const progress = Math.round((streak / habit.target_days) * 100);
                    const typeIcon = habit.habit_type === "acquire" ? "🟢" : "🔴";
                    return (
                      <div key={habit.id} style={{ ...s.card, marginBottom: 12, borderLeft: `3px solid ${dept.color}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setSelectedHabit(habit)}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: "#222" }}>
                              {habit.icon} {habit.name} {typeIcon}
                            </div>
                            {habit.description && (
                              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{habit.description}</div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => {
                                setForm({ ...habit });
                                setShowModal("habit");
                              }}
                              style={{
                                ...s.btn("secondary"),
                                padding: "6px 12px",
                                fontSize: 13,
                              }}>
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Supprimer "${habit.name}" et tous ses logs ?`)) {
                                  const updated = habits.filter(h => h.id !== habit.id);
                                  updateHabits(updated);
                                  await supabase.from("habits").delete().eq("id", habit.id);
                                }
                              }}
                              style={{
                                ...s.btn("danger"),
                                padding: "6px 12px",
                                fontSize: 13,
                              }}>
                              🗑️
                            </button>
                            <button
                              onClick={() => {
                                setQuickLogHabit(habit);
                                setForm({ logged_at: new Date().toISOString(), completed: true });
                                setShowModal("habitLog");
                              }}
                              style={{
                                ...s.btn("primary"),
                                padding: "6px 12px",
                                fontSize: 13,
                              }}>
                              ✓ Log
                            </button>
                          </div>
                        </div>

                        {/* Streak & Progress */}
                        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
                          <div>
                            <span style={{ fontSize: 11, color: "#aaa" }}>Série:</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: streak > 0 ? "#E85555" : "#888", marginLeft: 4 }}>
                              {streak} jours {streak > 0 && "🔥"}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: "#aaa" }}>Objectif: {habit.target_days} jours</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ background: "#f0f0f0", borderRadius: 4, height: 6 }}>
                              <div style={{ width: `${Math.min(progress, 100)}%`, height: "100%", background: dept.color, borderRadius: 4, transition: "width 0.3s" }} />
                            </div>
                            <span style={{ fontSize: 10, color: "#aaa" }}>{progress}%</span>
                          </div>
                        </div>

                        {/* Last 7 days */}
                        <div style={{ display: "flex", gap: 4 }}>
                          <span style={{ fontSize: 11, color: "#aaa", marginRight: 4 }}>7 derniers jours:</span>
                          {last7.map((done, idx) => (
                            <div
                              key={idx}
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 4,
                                background: done ? dept.color : "#f0f0f0",
                                border: done ? "none" : "1px solid #ddd",
                              }}
                              title={done ? "Fait" : "Manqué"}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Ungrouped habits */}
              {ungrouped.length > 0 && (
                <div style={s.section}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 10 }}>
                    SANS DÉPARTEMENT
                  </div>
                  {ungrouped.map(habit => {
                    const streak = getHabitStreak(habit.id);
                    const last7 = getHabitCompletionLast7Days(habit.id);
                    const progress = Math.round((streak / habit.target_days) * 100);
                    const typeIcon = habit.habit_type === "acquire" ? "🟢" : "🔴";
                    return (
                      <div key={habit.id} style={{ ...s.card, marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setSelectedHabit(habit)}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: "#222" }}>
                              {habit.icon} {habit.name} {typeIcon}
                            </div>
                            {habit.description && (
                              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{habit.description}</div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setQuickLogHabit(habit);
                              setForm({ logged_at: new Date().toISOString(), completed: true });
                              setShowModal("habitLog");
                            }}
                            style={{
                              ...s.btn("primary"),
                              padding: "6px 12px",
                              fontSize: 13,
                            }}>
                            ✓ Log
                          </button>
                        </div>

                        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
                          <div>
                            <span style={{ fontSize: 11, color: "#aaa" }}>Série:</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: streak > 0 ? "#E85555" : "#888", marginLeft: 4 }}>
                              {streak} jours {streak > 0 && "🔥"}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: "#aaa" }}>Objectif: {habit.target_days} jours</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ background: "#f0f0f0", borderRadius: 4, height: 6 }}>
                              <div style={{ width: `${Math.min(progress, 100)}%`, height: "100%", background: "#888", borderRadius: 4, transition: "width 0.3s" }} />
                            </div>
                            <span style={{ fontSize: 10, color: "#aaa" }}>{progress}%</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 4 }}>
                          <span style={{ fontSize: 11, color: "#aaa", marginRight: 4 }}>7 derniers jours:</span>
                          {last7.map((done, idx) => (
                            <div
                              key={idx}
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: 4,
                                background: done ? "#888" : "#f0f0f0",
                                border: done ? "none" : "1px solid #ddd",
                              }}
                              title={done ? "Fait" : "Manqué"}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredHabits.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa" }}>
                  Aucune habitude trouvée. Créez-en une pour commencer !
                </div>
              )}
            </div>
          );
        })()}

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (() => {
          const fp = deptFilter === "all" ? projects : projects.filter(p => p.dept === deptFilter);
          const ft = filteredTasks.filter(t => t.status !== "Abandonné");
          const done = ft.filter(t => t.status === "Terminé").length;
          const inProgress = ft.filter(t => t.status === "En cours").length;
          const todo = ft.filter(t => t.status === "À faire").length;
          const overdue = ft.filter(t => isOverdue(t.due) && t.status !== "Terminé").length;
          const completion = ft.length ? Math.round((done / ft.length) * 100) : 0;

          // Bar chart: tasks by dept
          const tasksByDept = DEPTS.map(d => {
            const dt = filteredTasks.filter(t => t.dept === d.id && t.status !== "Abandonné");
            return {
              name: d.icon,
              label: d.label,
              Terminé: dt.filter(t => t.status === "Terminé").length,
              "En cours": dt.filter(t => t.status === "En cours").length,
              "À faire": dt.filter(t => t.status === "À faire").length,
              color: d.color,
            };
          });

          // Hours bar chart
          const hoursByDept = DEPTS.map(d => {
            const dt = filteredTasks.filter(t => t.dept === d.id && t.status !== "Abandonné");
            return {
              name: d.icon,
              label: d.label,
              Estimées: parseFloat(dt.reduce((s, t) => s + (t.estH || 0), 0).toFixed(1)),
              Passées: parseFloat(dt.reduce((s, t) => s + (t.passedH || 0), 0).toFixed(1)),
              color: d.color,
            };
          });

          // Temperature line chart (journal over time)
          const tempLine = [...journal]
            .filter(j => j.type === "📝 Note")
            .sort((a, b) => a.date.localeCompare(b.date))
            .filter(j => deptFilter === "all" || j.dept === deptFilter)
            .map(j => ({
              date: j.date, // full YYYY-MM-DD for aggregation
              temp: j.temp,
              emoji: getTempEmoji(j.temp),
            }));

          // Pie: task status breakdown
          const pieData = [
            { name: "Terminé", value: done, color: "#6BBF6B" },
            { name: "En cours", value: inProgress, color: "#4A90D9" },
            { name: "À faire", value: todo, color: "#E8A838" },
            { name: "En retard", value: overdue, color: "#E85555" },
          ].filter(d => d.value > 0);

          // Radial: completion dial
          const radialData = [{ name: "Complétion", value: completion, fill: "#5b4ef8" }];

          const chartCard = { background: "#fafafa", border: "1px solid #eee", borderRadius: 12, padding: "20px 20px 10px 20px", marginBottom: 16 };
          const chartTitle = { fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 16 };

          const CustomTooltip = ({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: "#222" }}>{label}</div>
                {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
              </div>
            );
          };

          // Satisfaction score
          const avgScore = tempLine.length
            ? (tempLine.reduce((s, t) => s + t.temp, 0) / tempLine.length)
            : null;
          const avgScoreRounded = avgScore !== null ? Math.round(avgScore * 10) / 10 : null;
          const avgScoreEmoji = avgScore !== null ? getTempEmoji(Math.round(avgScore)) : "—";

          return (
            <div>
              <div style={s.sectionTitle}>
                <span>DASHBOARD — {deptFilter === "all" ? "TOUS DÉPARTEMENTS" : DEPTS.find(d => d.id === deptFilter)?.label.toUpperCase()}</span>
              </div>

              {/* Row 0: Satisfaction Score — compact */}
              <div style={{ ...chartCard, display: "flex", alignItems: "center", gap: 20, padding: "18px 24px", marginBottom: 16 }}>
                <div style={{ fontSize: 48 }}>{avgScoreEmoji}</div>
                <div>
                  <div style={chartTitle}>Score de satisfaction</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#5b4ef8" }}>{avgScoreRounded !== null ? `${avgScoreRounded}/10` : "—"}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{tempLine.length} entrée{tempLine.length > 1 ? "s" : ""} journal</div>
                </div>
              </div>

              {/* Velocity chart: tasks created vs completed */}
              {(() => {
                const getCreatedDate = (t) => t.createdDate || t.due || null;
                // Filter tasks by velocity filters
                let vTasks = tasks;
                if (veloDept !== "all") vTasks = vTasks.filter(t => t.dept === veloDept);
                if (veloProject !== "all") vTasks = vTasks.filter(t => t.project === veloProject);
                // Build date map
                const dateMap = {};
                vTasks.forEach(t => {
                  const cd = getCreatedDate(t);
                  if (cd) { dateMap[cd] = dateMap[cd] || { date: cd, created: 0, completed: 0 }; dateMap[cd].created++; }
                  // Use completedDate, or fallback to due/today for completed tasks
                  const doneDate = t.status === "Terminé" ? (t.completedDate || t.due || todayStr) : t.completedDate;
                  if (doneDate) { dateMap[doneDate] = dateMap[doneDate] || { date: doneDate, created: 0, completed: 0 }; dateMap[doneDate].completed++; }
                });
                const veloDataRaw = Object.values(dateMap).filter(d => d.date <= todayStr).sort((a, b) => a.date.localeCompare(b.date));
                const veloData = aggregateByPeriod(veloDataRaw, veloPeriod, ["created", "completed"], "sum");
                const selectStyle = { padding: "4px 8px", borderRadius: 6, border: "1px solid #e0e0e0", fontSize: 12, background: "#fff", color: "#333" };
                const toggleStyle = (active) => ({ padding: "4px 10px", borderRadius: 6, border: "1px solid " + (active ? "#5b4ef8" : "#e0e0e0"), background: active ? "#5b4ef8" : "#fff", color: active ? "#fff" : "#666", fontSize: 11, cursor: "pointer", fontWeight: active ? 600 : 400 });
                return (<>
                  <div style={{ ...chartCard, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={chartTitle}>Vélocité — Tâches créées vs complétées</div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[["daily", "Jour"], ["weekly", "Sem"], ["monthly", "Mois"]].map(([k, l]) => (
                            <button key={k} style={toggleStyle(veloPeriod === k)} onClick={() => setVeloPeriod(k)}>{l}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <select value={veloDept} onChange={e => setVeloDept(e.target.value)} style={selectStyle}>
                          <option value="all">Tous départements</option>
                          {DEPTS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
                        </select>
                        <select value={veloProject} onChange={e => setVeloProject(e.target.value)} style={selectStyle}>
                          <option value="all">Tous projets</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                    {veloData.length < 1
                      ? <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: "40px 0" }}>Pas assez de données pour afficher la vélocité.</div>
                      : <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={veloData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#aaa" }} tickFormatter={d => d.length > 7 ? d.slice(5) : d} />
                          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#aaa" }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="created" name="Créées" stroke="#4A90D9" strokeWidth={2.5} dot={{ fill: "#4A90D9", r: 4 }} />
                          <Line type="monotone" dataKey="completed" name="Complétées" stroke="#6BBF6B" strokeWidth={2.5} dot={{ fill: "#6BBF6B", r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    }
                  </div>

                  {/* Satisfaction trend — full width */}
                  {(() => {
                    const satData = aggregateByPeriod(tempLine, satPeriod, ["temp"], "avg");
                    const toggleStyle2 = (active) => ({ padding: "4px 10px", borderRadius: 6, border: "1px solid " + (active ? "#5b4ef8" : "#e0e0e0"), background: active ? "#5b4ef8" : "#fff", color: active ? "#fff" : "#666", fontSize: 11, cursor: "pointer", fontWeight: active ? 600 : 400 });
                    return (
                      <div style={{ ...chartCard, marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={chartTitle}>Tendance satisfaction 💀 → 🚀</div>
                          <div style={{ display: "flex", gap: 4 }}>
                            {[["daily", "Jour"], ["weekly", "Sem"], ["monthly", "Mois"]].map(([k, l]) => (
                              <button key={k} style={toggleStyle2(satPeriod === k)} onClick={() => setSatPeriod(k)}>{l}</button>
                            ))}
                          </div>
                        </div>
                        {satData.length < 1
                          ? <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: "40px 0" }}>Pas assez d'entrées journal pour afficher la tendance.</div>
                          : <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={satData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#aaa" }} tickFormatter={d => d.length > 7 ? d.slice(5) : d} />
                              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#aaa" }}
                                tickFormatter={v => getTempEmoji(v)} />
                              <Tooltip formatter={(val) => [getTempEmoji(Math.round(val)) + " " + val + "/10", "Satisfaction"]} labelFormatter={l => `${satPeriod === "daily" ? "Date" : satPeriod === "weekly" ? "Semaine du" : "Mois"}: ${l}`} />
                              <Line type="monotone" dataKey="temp" stroke="#5b4ef8" strokeWidth={2.5} dot={{ fill: "#5b4ef8", r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        }
                      </div>
                    );
                  })()}

                  {/* Habit tracking — logs per habit over time */}
                  {(() => {
                    if (!habits.length || !habitLogs.length) return null;
                    
                    // Build time series: each date has a count per habit
                    const dateMap = {};
                    const habitColors = ["#4A90D9", "#E8A838", "#6BBF6B", "#B07FE8", "#E85555", "#5b4ef8", "#FF6B9D", "#4ECDC4"];
                    
                    habitLogs.forEach(log => {
                      if (!log.completed) return; // Only count successful logs
                      const date = log.logged_at.split('T')[0]; // YYYY-MM-DD
                      if (!dateMap[date]) dateMap[date] = { date };
                      const habit = habits.find(h => h.id === log.habit_id);
                      if (habit) {
                        const key = habit.name;
                        dateMap[date][key] = (dateMap[date][key] || 0) + 1;
                      }
                    });

                    const habitTrackingData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
                    if (!habitTrackingData.length) return null;

                    // Get unique habit names for lines
                    const habitNames = [...new Set(habitLogs.map(log => {
                      const habit = habits.find(h => h.id === log.habit_id);
                      return habit?.name;
                    }).filter(Boolean))];

                    const toggleStyle3 = (active) => ({ padding: "4px 10px", borderRadius: 6, border: "1px solid " + (active ? "#5b4ef8" : "#e0e0e0"), background: active ? "#5b4ef8" : "#fff", color: active ? "#fff" : "#666", fontSize: 11, cursor: "pointer", fontWeight: active ? 600 : 400 });

                    return (
                      <div style={{ ...chartCard, marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={chartTitle}>🎯 Suivi des habitudes — Logs par jour</div>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                          <LineChart data={habitTrackingData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#aaa" }} tickFormatter={d => d.slice(5)} />
                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#aaa" }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            {habitNames.map((name, i) => (
                              <Line 
                                key={name} 
                                type="monotone" 
                                dataKey={name} 
                                stroke={habitColors[i % habitColors.length]} 
                                strokeWidth={2} 
                                dot={{ r: 3 }} 
                                activeDot={{ r: 5 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </>);
              })()}

              {/* Row 1: Dial + Pie + System state */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 0 }}>

                {/* Completion dial */}
                <div style={chartCard}>
                  <div style={chartTitle}>Taux de complétion</div>
                  <div style={{ position: "relative", height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="80%" innerRadius="70%" outerRadius="100%" startAngle={180} endAngle={0} data={[{ value: 100, fill: "#f0f0f0" }, { value: completion, fill: "#5b4ef8" }]}>
                        <RadialBar dataKey="value" cornerRadius={6} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center" }}>
                      <div style={{ fontSize: 32, fontWeight: 700, color: "#5b4ef8" }}>{completion}%</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>{done} / {ft.length} tâches</div>
                    </div>
                  </div>
                </div>

                {/* Pie: task breakdown */}
                <div style={chartCard}>
                  <div style={chartTitle}>Répartition des tâches</div>
                  <div style={{ height: 160, display: "flex", alignItems: "center", gap: 12 }}>
                    <ResponsiveContainer width="60%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ flex: 1, fontSize: 11 }}>
                      {pieData.map(d => (
                        <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                          <span style={{ color: "#666" }}>{d.name}</span>
                          <span style={{ marginLeft: "auto", fontWeight: 600, color: "#222" }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* System state */}
                <div style={chartCard}>
                  <div style={chartTitle}>État du système</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                    {[
                      ["Projets actifs", fp.filter(p => p.status === "En cours").length, "#4A90D9"],
                      ["Tâches en cours", inProgress, "#E8A838"],
                      ["En retard", overdue, overdue > 0 ? "#E85555" : "#6BBF6B"],
                      ["Terminées", done, "#6BBF6B"],
                    ].map(([label, val, color]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#fff", border: "1px solid #eee", borderLeft: `3px solid ${color}`, borderRadius: 8 }}>
                        <span style={{ fontSize: 12, color: "#666" }}>{label}</span>
                        <span style={{ fontSize: 20, fontWeight: 700, color }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Tasks by dept grouped bar */}
              <div style={{ ...chartCard, marginTop: 16 }}>
                <div style={chartTitle}>Tâches par département</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={tasksByDept} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 16 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#aaa" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="À faire" stackId="a" fill="#E8A83866" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="En cours" stackId="a" fill="#4A90D966" />
                    <Bar dataKey="Terminé" stackId="a" fill="#6BBF6B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Row 3: Hours estimated vs actual */}
              <div style={{ ...chartCard, marginTop: 0 }}>
                <div style={chartTitle}>Heures estimées vs passées par département</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hoursByDept} barGap={6} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 16 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#aaa" }} unit="h" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="Estimées" fill="#5b4ef833" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Passées" fill="#5b4ef8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* ── JOURNAL ── */}
        {tab === "journal" && (() => {
          let journalList = journal;
          if (journalDeptFilter !== "all") journalList = journalList.filter(j => j.dept === journalDeptFilter);
          if (journalProjectFilter !== "all") journalList = journalList.filter(j => j.project === journalProjectFilter);
          if (journalTypeFilter !== "all") journalList = journalList.filter(j => j.type === journalTypeFilter);
          if (journalScoreFilter !== "all") journalList = journalList.filter(j => j.temp === Number(journalScoreFilter));

          return (
          <div style={{ maxWidth: 680 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
              <div>
                <label style={s.label}>Projet</label>
                <select style={{ ...s.select, marginBottom: 0, minWidth: 160 }} value={journalProjectFilter} onChange={e => setJournalProjectFilter(e.target.value)}>
                  <option value="all">Tous les projets</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{getDeptIcon(p.dept)} {p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Département</label>
                <select style={{ ...s.select, marginBottom: 0, minWidth: 150 }} value={journalDeptFilter} onChange={e => setJournalDeptFilter(e.target.value)}>
                  <option value="all">Tous</option>
                  {DEPTS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Type</label>
                <select style={{ ...s.select, marginBottom: 0, minWidth: 130 }} value={journalTypeFilter} onChange={e => setJournalTypeFilter(e.target.value)}>
                  <option value="all">Tous</option>
                  {["📝 Note", "💡 Idée", "🚧 Obstacle"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Score</label>
                <select style={{ ...s.select, marginBottom: 0, minWidth: 100 }} value={journalScoreFilter} onChange={e => setJournalScoreFilter(e.target.value)}>
                  <option value="all">Tous</option>
                  {TEMPS.map(t => <option key={t.score} value={t.score}>{t.emoji} {t.score}</option>)}
                </select>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <button style={s.btn("primary")} onClick={() => openModal("journal", { type: "📝 Note", temp: 5, dept: journalDeptFilter === "all" ? "ops" : journalDeptFilter, priority: "Moyenne" })}>+ Entrée</button>
              </div>
            </div>
            {journalList.map(j => {
              const linkedTask = j.linkedTask ? tasks.find(t => t.id === j.linkedTask) : null;
              return (
                <div key={j.id} style={{ ...s.card, borderLeft: `3px solid ${getDeptColor(j.dept)}`, cursor: "pointer" }}
                  onClick={() => openModal("journal", { ...j })}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 13, color: "#222" }}>{j.title}</span>
                      <span style={{ marginLeft: 8, fontSize: 14 }}>{getTempEmoji(j.temp)}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#aaa" }}>{j.date}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={s.tag(getDeptColor(j.dept))}>{getDeptIcon(j.dept)}</span>
                    <span style={s.tag("#555")}>{j.type}</span>
                    {j.priority === "Haute" && <span style={s.tag(PRIO_COLOR.Haute)}>Haute</span>}
                    {linkedTask && <span style={s.tag("#5b4ef8")}>📋 {linkedTask.name}</span>}
                  </div>
                  {j.description && <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{j.description}</div>}
                </div>
              );
            })}
          </div>
          );
        })()}

        {/* ── DONNÉES ── */}
        {tab === "data" && (() => {
          const tables = {
            projects: {
              label: "Projets",
              data: projects,
              cols: [
                { key: "id", label: "ID", w: 60, readonly: true },
                { key: "name", label: "Nom", w: 180 },
                { key: "dept", label: "Dept", w: 80, type: "select", options: DEPTS.map(d => ({ value: d.id, label: d.icon + " " + d.label })) },
                { key: "status", label: "Statut", w: 110, type: "select", options: PROJECT_STATUSES.map(s => ({ value: s, label: s })) },
                { key: "startDate", label: "Début", w: 100, type: "date" },
                { key: "endDate", label: "Fin", w: 100, type: "date" },
                { key: "estHours", label: "H. est.", w: 70, type: "number" },
                { key: "revenue", label: "Revenu €", w: 90, type: "number" },
                { key: "notes", label: "Notes", w: 200 },
              ],
            },
            tasks: {
              label: "Tâches",
              data: tasks,
              cols: [
                { key: "id", label: "ID", w: 60, readonly: true },
                { key: "name", label: "Nom", w: 180 },
                { key: "project", label: "Projet", w: 80, type: "select", options: [{ value: "", label: "—" }, ...projects.map(p => ({ value: p.id, label: p.id }))] },
                { key: "dept", label: "Dept", w: 80, type: "select", options: DEPTS.map(d => ({ value: d.id, label: d.icon })) },
                { key: "status", label: "Statut", w: 100, type: "select", options: STATUSES.map(s => ({ value: s, label: s })) },
                { key: "priority", label: "Priorité", w: 80, type: "select", options: PRIORITIES.map(p => ({ value: p, label: p })) },
                { key: "due", label: "Échéance", w: 100, type: "date" },
                { key: "estH", label: "H. est.", w: 70, type: "number" },
                { key: "passedH", label: "H. réel", w: 70, type: "number" },
                { key: "temp", label: "Temp", w: 60, type: "number" },
                { key: "notes", label: "Notes", w: 160 },
              ],
            },
            journal: {
              label: "Journal",
              data: journal,
              cols: [
                { key: "id", label: "ID", w: 60, readonly: true },
                { key: "date", label: "Date", w: 100, type: "date" },
                { key: "type", label: "Type", w: 100, type: "select", options: ["📝 Note", "💡 Idée", "🚧 Obstacle"].map(t => ({ value: t, label: t })) },
                { key: "title", label: "Titre", w: 180 },
                { key: "dept", label: "Dept", w: 70, type: "select", options: DEPTS.map(d => ({ value: d.id, label: d.icon })) },
                { key: "temp", label: "Temp", w: 60, type: "number" },
                { key: "priority", label: "Priorité", w: 80, type: "select", options: PRIORITIES.map(p => ({ value: p, label: p })) },
                { key: "description", label: "Description", w: 200 },
                { key: "nextAction", label: "Prochaine action", w: 160 },
              ],
            },
            habits: {
              label: "Habitudes",
              data: habits,
              cols: [
                { key: "id", label: "ID", w: 80, readonly: true },
                { key: "name", label: "Nom", w: 180 },
                { key: "description", label: "Description", w: 200 },
                { key: "department_id", label: "Dept", w: 80, type: "select", options: DEPTS.map(d => ({ value: d.id, label: d.icon + " " + d.label })) },
                { key: "habit_type", label: "Type", w: 90, type: "select", options: [{ value: "acquire", label: "🟢 Acquérir" }, { value: "eliminate", label: "🔴 Éliminer" }] },
                { key: "icon", label: "Icône", w: 60 },
                { key: "target_days", label: "Jours cible", w: 90, type: "number" },
                { key: "allowed_misses", label: "Ratés permis", w: 100, type: "number" },
                { key: "archived", label: "Archivé", w: 70, type: "select", options: [{ value: false, label: "Non" }, { value: true, label: "Oui" }] },
              ],
            },
            habit_logs: {
              label: "Logs habitudes",
              data: habitLogs,
              cols: [
                { key: "id", label: "ID", w: 80, readonly: true },
                { key: "habit_id", label: "Habitude", w: 100, readonly: true },
                { key: "logged_at", label: "Date/Heure", w: 160, readonly: true },
                { key: "completed", label: "Fait", w: 60, type: "select", options: [{ value: true, label: "Oui" }, { value: false, label: "Non" }] },
                { key: "note", label: "Note", w: 200 },
                { key: "time_spent_minutes", label: "Minutes", w: 80, type: "number" },
                { key: "temp", label: "Temp", w: 60, type: "number" },
              ],
            },
          };

          const { data, cols } = tables[dataTab];
          const thStyle = { padding: "8px 10px", fontSize: 11, color: "#aaa", fontWeight: 600, textAlign: "left", borderBottom: "2px solid #eee", whiteSpace: "nowrap", background: "#fafafa" };
          const tdStyle = (editable) => ({ padding: "6px 10px", fontSize: 13, color: "#222", borderBottom: "1px solid #f0f0f0", cursor: editable ? "pointer" : "default", whiteSpace: "nowrap" });

          const CellDisplay = ({ row, col }) => {
            const val = row[col.key];
            const isEditing = editingCell?.table === dataTab && editingCell?.id === row.id && editingCell?.field === col.key;

            if (isEditing) {
              if (col.type === "select") {
                return (
                  <select autoFocus style={{ ...s.select, marginBottom: 0, padding: "3px 6px", fontSize: 12, width: col.w }}
                    value={cellValue}
                    onChange={e => setCellValue(e.target.value)}
                    onBlur={commitEdit}>
                    {col.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                );
              }
              return (
                <input autoFocus type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
                  style={{ ...s.input, marginBottom: 0, padding: "3px 6px", fontSize: 12, width: col.w }}
                  value={cellValue}
                  onChange={e => setCellValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingCell(null); }} />
              );
            }

            // Display value
            let display = val ?? "—";
            if (col.key === "dept") display = getDeptIcon(val) || val;
            if (col.key === "temp") display = getTempEmoji(Number(val));
            if (col.key === "project") display = val || "—";
            if (col.type === "select" && col.options) {
              const opt = col.options.find(o => o.value === val);
              if (opt) display = opt.label;
            }

            return (
              <span onClick={() => !col.readonly && startEdit(dataTab, row.id, col.key, val)}
                style={{ display: "block", minWidth: col.w, color: col.readonly ? "#ccc" : "#222" }}
                title={col.readonly ? "" : "Cliquer pour modifier"}>
                {String(display)}
              </span>
            );
          };

          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 0, background: "#f0f0f0", borderRadius: 8, padding: 3 }}>
                  {Object.entries(tables).map(([key, t]) => (
                    <button key={key}
                      style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: dataTab === key ? "#fff" : "transparent", color: dataTab === key ? "#222" : "#aaa", cursor: "pointer", fontSize: 13, fontFamily: "sans-serif", fontWeight: dataTab === key ? 600 : 400, boxShadow: dataTab === key ? "0 1px 3px #0001" : "none", transition: "all 0.15s" }}
                      onClick={() => { setDataTab(key); setEditingCell(null); }}>
                      {t.label} <span style={{ color: "#aaa", fontWeight: 400 }}>({t.data.length})</span>
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={s.btn("ghost")} onClick={() => exportCSV(data, `${dataTab}.csv`)}>↓ Export CSV</button>
                  <button style={s.btn("primary")} onClick={() => {
                    if (dataTab === "projects") openModal("project", { status: "Potentiel", dept: "ops", estHours: 0, revenue: 0 });
                    else if (dataTab === "tasks") openModal("task", { status: "À faire", priority: "Moyenne", dept: "ops", temp: 2 });
                    else if (dataTab === "journal") openModal("journal", { type: "📝 Note", temp: 2, dept: "ops", priority: "Moyenne" });
                    else if (dataTab === "habits") openModal("habit", { habit_type: "acquire", target_days: 60, allowed_misses: 0, icon: "✅" });
                    else if (dataTab === "habit_logs") openModal("habitLog", { logged_at: new Date().toISOString(), completed: true });
                  }}>+ Ajouter</button>
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>
                        {cols.map(col => <th key={col.key} style={{ ...thStyle, width: col.w }}>{col.label}</th>)}
                        <th style={{ ...thStyle, width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, i) => (
                        <tr key={row.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          {cols.map(col => (
                            <td key={col.key} style={tdStyle(!col.readonly)}>
                              <CellDisplay row={row} col={col} />
                            </td>
                          ))}
                          <td style={{ ...tdStyle(false), textAlign: "center" }}>
                            <button
                              onClick={() => { if (window.confirm("Supprimer cette ligne ?")) deleteRow(dataTab, row.id); }}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", fontSize: 16, padding: "0 4px" }}
                              title="Supprimer">×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f0f0", fontSize: 11, color: "#bbb" }}>
                  {data.length} entrée{data.length > 1 ? "s" : ""} · Cliquer une cellule pour modifier · Les modifications sont sauvegardées automatiquement
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowModal(null)}>
          <div style={s.modalBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#222" }}>
                {showModal === "task" ? (form.id ? "Modifier tâche" : "Nouvelle tâche") : 
                 showModal === "journal" ? (form.id ? "Modifier entrée journal" : "Nouvelle entrée journal") : 
                 showModal === "project" ? (form.id ? "Modifier projet" : "Nouveau projet") :
                 showModal === "habit" ? (form.id ? "Modifier habitude" : "Nouvelle habitude") :
                 showModal === "habitLog" ? "Logger habitude" : ""}
              </div>
              <button style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 20 }} onClick={() => setShowModal(null)}>×</button>
            </div>

            {showModal === "task" && (
              <>
                <label style={s.label}>Nom de la tâche</label>
                <input style={s.input} value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ce qui doit être fait…" />

                <label style={s.label}>Projet</label>
                <select style={s.select} value={form.project || ""} onChange={e => {
                  const proj = projects.find(p => p.id === e.target.value);
                  setForm({ ...form, project: e.target.value, dept: proj ? proj.dept : form.dept });
                }}>
                  <option value="">— Sans projet —</option>
                  {projects.filter(p => p.status !== "Abandonné" && p.status !== "Terminé").map(p => (
                    <option key={p.id} value={p.id}>{getDeptIcon(p.dept)} {p.name}</option>
                  ))}
                </select>

                <div style={s.row}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Département</label>
                    <select style={s.select} value={form.dept || "ops"} onChange={e => setForm({ ...form, dept: e.target.value })}>
                      {DEPTS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Statut</label>
                    <select style={s.select} value={form.status || "À faire"} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div style={s.row}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Priorité</label>
                    <select style={s.select} value={form.priority || "Moyenne"} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Échéance</label>
                    <input type="date" style={s.input} value={form.due || ""} onChange={e => setForm({ ...form, due: e.target.value })} />
                  </div>
                </div>

                <div style={s.row}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Date de complétion</label>
                    <input type="date" style={s.input} value={form.completedDate || ""} onChange={e => setForm({ ...form, completedDate: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Date de création</label>
                    <input type="date" style={{ ...s.input, background: "#f5f5f5", color: "#888" }} value={form.createdDate || ""} readOnly />
                  </div>
                </div>

                <div style={s.row}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Heures estimées</label>
                    <input type="number" step="0.5" style={s.input} value={form.estH || ""} onChange={e => setForm({ ...form, estH: parseFloat(e.target.value) })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Heures passées</label>
                    <input type="number" step="0.5" style={s.input} value={form.passedH || ""} onChange={e => setForm({ ...form, passedH: parseFloat(e.target.value) })} />
                  </div>
                </div>

                <label style={s.label}>Notes</label>
                <textarea style={{ ...s.input, resize: "vertical", minHeight: 60 }} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} />

                <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    {form.id && <>
                      <button style={s.btnDanger} onClick={() => { if (window.confirm("Supprimer cette tâche ?")) { deleteRow("tasks", form.id); setShowModal(null); } }}>🗑 Supprimer</button>
                      <button style={s.btn("ghost")} onClick={() => setForm({ ...form, id: undefined, name: form.name + " (copie)" })}>📋 Dupliquer</button>
                    </>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={s.btn("ghost")} onClick={() => setShowModal(null)}>Annuler</button>
                    <button style={s.btn("primary")} onClick={saveTask}>Enregistrer</button>
                  </div>
                </div>
              </>
            )}

            {showModal === "project" && (
              <>
                <label style={s.label}>Nom du projet</label>
                <input style={s.input} value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom court et descriptif…" />

                <label style={s.label}>Description</label>
                <textarea style={{ ...s.input, resize: "vertical", minHeight: 60 }} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Pourquoi ce projet existe…" />

                <div style={s.row}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Département</label>
                    <select style={s.select} value={form.dept || "ops"} onChange={e => setForm({ ...form, dept: e.target.value })}>
                      {DEPTS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Statut</label>
                    <select style={s.select} value={form.status || "Potentiel"} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div style={s.row}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Date de début</label>
                    <input type="date" style={s.input} value={form.startDate || ""} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Date de fin cible</label>
                    <input type="date" style={s.input} value={form.endDate || ""} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                </div>

                <div style={s.row}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Heures estimées</label>
                    <input type="number" step="1" style={s.input} value={form.estHours || ""} onChange={e => setForm({ ...form, estHours: parseFloat(e.target.value) })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Revenu lié (€)</label>
                    <input type="number" step="100" style={s.input} value={form.revenue || ""} onChange={e => setForm({ ...form, revenue: parseFloat(e.target.value) })} />
                  </div>
                </div>

                <label style={s.label}>Notes</label>
                <textarea style={{ ...s.input, resize: "vertical", minHeight: 60 }} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Contexte, blocages, prochaines étapes…" />

                <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    {form.id && <button style={s.btnDanger} onClick={() => { if (window.confirm("Supprimer ce projet ?")) { deleteRow("projects", form.id); setShowModal(null); } }}>🗑 Supprimer</button>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={s.btn("ghost")} onClick={() => setShowModal(null)}>Annuler</button>
                    <button style={s.btn("primary")} onClick={saveProject}>Enregistrer</button>
                  </div>
                </div>
              </>
            )}

            {showModal === "journal" && (
              <>
                <label style={s.label}>Type</label>
                <select style={s.select} value={form.type || "📝 Note"} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {["📝 Note", "💡 Idée", "🚧 Obstacle"].map(t => <option key={t}>{t}</option>)}
                </select>

                <label style={s.label}>Titre</label>
                <input style={s.input} value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Résumé en quelques mots…" />

                <label style={s.label}>Description</label>
                <textarea style={{ ...s.input, resize: "vertical", minHeight: 70 }} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} />

                <div style={s.row}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Département</label>
                    <select style={s.select} value={form.dept || "ops"} onChange={e => setForm({ ...form, dept: e.target.value })}>
                      {DEPTS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Priorité</label>
                    <select style={s.select} value={form.priority || "Moyenne"} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                {form.type === "📝 Note" && (<>
                  <label style={s.label}>Température (0-10)</label>
                  <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                    {TEMPS.map(t => (
                      <button key={t.score} style={{ ...s.tempBtn(form.temp === t.score), flex: "0 0 auto", padding: "6px 8px", fontSize: 16 }} onClick={() => setForm({ ...form, temp: t.score })} title={`${t.score} — ${t.label}`}>{t.emoji}</button>
                    ))}
                  </div>
                </>)}

                <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    {form.id && <button style={s.btnDanger} onClick={() => { if (window.confirm("Supprimer cette entrée ?")) { deleteRow("journal", form.id); setShowModal(null); } }}>🗑 Supprimer</button>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={s.btn("ghost")} onClick={() => setShowModal(null)}>Annuler</button>
                    <button style={s.btn("primary")} onClick={saveJournal}>Enregistrer</button>
                  </div>
                </div>
              </>
            )}

            {showModal === "habit" && (
              <>
                <label style={s.label}>Nom de l'habitude</label>
                <input style={s.input} value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Méditer 10 minutes" />

                <label style={s.label}>Description (optionnel)</label>
                <textarea style={{ ...s.input, resize: "vertical", minHeight: 60 }} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Détails ou notes..." />

                <div style={s.row}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Type</label>
                    <select style={s.select} value={form.habit_type || "acquire"} onChange={e => setForm({ ...form, habit_type: e.target.value })}>
                      <option value="acquire">🟢 Acquérir (construire)</option>
                      <option value="eliminate">🔴 Éliminer (arrêter)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Icône/Emoji</label>
                    <input style={s.input} value={form.icon || ""} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="✅" />
                  </div>
                </div>

                <label style={s.label}>Département</label>
                <select style={s.select} value={form.department_id || ""} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                  <option value="">— Sans département —</option>
                  {DEPTS.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
                </select>

                <div style={s.row}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Objectif (jours)</label>
                    <input type="number" style={s.input} value={form.target_days || 60} onChange={e => setForm({ ...form, target_days: parseInt(e.target.value) || 60 })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Manqués autorisés</label>
                    <input type="number" style={s.input} value={form.allowed_misses || 0} onChange={e => setForm({ ...form, allowed_misses: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                  <div>
                    {form.id && <button style={s.btnDanger} onClick={() => { if (window.confirm("Archiver cette habitude ?")) { const record = { ...habits.find(h => h.id === form.id), archived: true }; updateHabits(habits.map(h => h.id === form.id ? record : h)); syncRecord("habits", record); setShowModal(null); } }}>🗃 Archiver</button>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={s.btn("ghost")} onClick={() => setShowModal(null)}>Annuler</button>
                    <button style={s.btn("primary")} onClick={saveHabit}>Enregistrer</button>
                  </div>
                </div>
              </>
            )}

            {showModal === "habitLog" && quickLogHabit && (
              <>
                <div style={{ background: "#f0eeff", border: "1px solid #d8d0ff", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#5b4ef8" }}>
                  {quickLogHabit.icon} {quickLogHabit.name}
                </div>

                <label style={s.label}>Date & heure</label>
                <input type="datetime-local" style={s.input} value={form.logged_at ? new Date(form.logged_at).toISOString().slice(0, 16) : ""} onChange={e => setForm({ ...form, logged_at: new Date(e.target.value).toISOString() })} />

                <label style={s.label}>Statut</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button
                    onClick={() => setForm({ ...form, completed: true })}
                    style={{
                      ...s.btn(form.completed ? "primary" : "ghost"),
                      flex: 1,
                    }}>
                    ✅ Fait
                  </button>
                  <button
                    onClick={() => setForm({ ...form, completed: false })}
                    style={{
                      ...s.btn(form.completed === false ? "primary" : "ghost"),
                      flex: 1,
                    }}>
                    ❌ Manqué
                  </button>
                </div>

                <label style={s.label}>Note (optionnel)</label>
                <textarea style={{ ...s.input, resize: "vertical", minHeight: 60 }} value={form.note || ""} onChange={e => setForm({ ...form, note: e.target.value })} placeholder={form.completed === false ? "Pourquoi avez-vous manqué ?" : "Contexte ou observations..."} />

                <div style={s.row}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Temps passé (minutes)</label>
                    <input type="number" style={s.input} value={form.time_spent_minutes || ""} onChange={e => setForm({ ...form, time_spent_minutes: parseInt(e.target.value) || null })} placeholder="Ex: 30" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Temp (1-10)</label>
                    <input type="number" min="1" max="10" style={s.input} value={form.temp || ""} onChange={e => setForm({ ...form, temp: parseInt(e.target.value) || null })} placeholder="Humeur" />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                  <button style={s.btn("ghost")} onClick={() => { setShowModal(null); setQuickLogHabit(null); }}>Annuler</button>
                  <button style={s.btn("primary")} onClick={saveHabitLog}>Enregistrer</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── COMPLETION JOURNAL MODAL ── */}
      {completionJournal && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setCompletionJournal(null)}>
          <div style={s.modalBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#222" }}>
                ✅ Tâche terminée — Capturer une note ?
              </div>
              <button style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 20 }} onClick={() => setCompletionJournal(null)}>×</button>
            </div>

            <div style={{ background: "#f0eeff", border: "1px solid #d8d0ff", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#5b4ef8" }}>
              📋 {completionJournal.taskName}
            </div>

            <label style={s.label}>Type</label>
            <select style={s.select} value={form.type || "📝 Note"} onChange={e => setForm({ ...form, type: e.target.value })}>
              {["📝 Note", "💡 Idée", "🚧 Obstacle"].map(t => <option key={t}>{t}</option>)}
            </select>

            <label style={s.label}>Titre</label>
            <input style={s.input} value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Résumé en quelques mots…" />

            <label style={s.label}>Description</label>
            <textarea style={{ ...s.input, resize: "vertical", minHeight: 70 }} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Qu'avez-vous appris ? Que retenir ?" />

            {form.type === "📝 Note" && (<>
              <label style={s.label}>Température (0-10)</label>
              <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
                {TEMPS.map(t => (
                  <button key={t.score} style={{ ...s.tempBtn(form.temp === t.score), flex: "0 0 auto", padding: "6px 8px", fontSize: 16 }} onClick={() => setForm({ ...form, temp: t.score })} title={`${t.score} — ${t.label}`}>{t.emoji}</button>
                ))}
              </div>
            </>)}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={s.btn("ghost")} onClick={() => setCompletionJournal(null)}>Passer</button>
              <button style={s.btn("primary")} onClick={saveJournal}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
