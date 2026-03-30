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
  { score: 0, emoji: "😓", label: "En difficulté" },
  { score: 1, emoji: "😐", label: "Plat" },
  { score: 2, emoji: "🙂", label: "OK" },
  { score: 3, emoji: "😊", label: "Bien" },
  { score: 4, emoji: "😄", label: "Excellent" },
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
const todayStr = today.toISOString().split("T")[0];
const isOverdue = (due) => due && new Date(due) < today;

const formatTodayLabel = () => {
  return today.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
};

const getDeptColor = (deptId) => DEPTS.find(d => d.id === deptId)?.color || "#888";
const getDeptIcon = (deptId) => DEPTS.find(d => d.id === deptId)?.icon || "";
const getTempEmoji = (score) => TEMPS.find(t => t.score === score)?.emoji || "🙂";

export default function App() {
  const [tab, setTab] = useState("kanban");
  const [projects, setProjects] = useState(initialProjects);
  const [tasks, setTasks] = useState(initialTasks);
  const [journal, setJournal] = useState(initialJournal);
  const [deptFilter, setDeptFilter] = useState("all");
  const [showModal, setShowModal] = useState(null);
  const [form, setForm] = useState({});
  const [dragging, setDragging] = useState(null);
  const [storageReady, setStorageReady] = useState(false);
  const [dataTab, setDataTab] = useState("projects");
  const [editingCell, setEditingCell] = useState(null); // {table, id, field}
  const [cellValue, setCellValue] = useState("");
  const [kanbanShowDone, setKanbanShowDone] = useState(false);

  // ── LOAD from Supabase on mount ──
  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: p }, { data: t }, { data: j }] = await Promise.all([
          supabase.from("projects").select("*"),
          supabase.from("tasks").select("*"),
          supabase.from("journal").select("*"),
        ]);
        if (p?.length) setProjects(p);
        if (t?.length) setTasks(t);
        if (j?.length) setJournal(j);
      } catch (e) {}
      setStorageReady(true);
    };
    load();
  }, []);

  // ── SYNC helpers ──
  const syncRecord = async (table, record) => {
    try { await supabase.from(table).upsert(record); } catch (e) {}
  };
  const deleteRecord = async (table, id) => {
    try { await supabase.from(table).delete().eq("id", id); } catch (e) {}
  };

  const updateProjects = (val) => setProjects(val);
  const updateTasks = (val) => setTasks(val);
  const updateJournal = (val) => setJournal(val);

  // ── Export CSV ──
  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const rows = [keys.join(","), ...data.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
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
    if (form.id) {
      record = { ...tasks.find(t => t.id === form.id), ...form };
      updated = tasks.map(t => t.id === form.id ? record : t);
    } else {
      const id = "T" + Date.now();
      record = { ...form, id, passedH: 0, temp: form.temp ?? 2, status: form.status || "À faire" };
      updated = [...tasks, record];
    }
    updateTasks(updated);
    syncRecord("tasks", record);
    setShowModal(null);
  };

  const saveJournal = () => {
    if (!form.title) return;
    const id = "J" + Date.now();
    const record = { ...form, id, date: new Date().toISOString().split("T")[0] };
    const updated = [record, ...journal];
    updateJournal(updated);
    syncRecord("journal", record);
    setShowModal(null);
  };

  const saveProject = () => {
    if (!form.name) return;
    let updated, record;
    if (form.id) {
      record = { ...projects.find(p => p.id === form.id), ...form };
      updated = projects.map(p => p.id === form.id ? record : p);
    } else {
      const id = "P" + Date.now();
      record = { ...form, id };
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
    const updated = tasks.map(t => t.id === dragging ? { ...t, status } : t);
    updateTasks(updated);
    syncRecord("tasks", { ...task, status });
    setDragging(null);
  };

  // Inline cell editing
  const startEdit = (table, id, field, value) => {
    setEditingCell({ table, id, field });
    setCellValue(String(value ?? ""));
  };
  const commitEdit = () => {
    if (!editingCell) return;
    const { table, id, field } = editingCell;
    if (table === "projects") {
      const record = { ...projects.find(p => p.id === id), [field]: cellValue };
      updateProjects(projects.map(p => p.id === id ? record : p));
      syncRecord("projects", record);
    } else if (table === "tasks") {
      const record = { ...tasks.find(t => t.id === id), [field]: cellValue };
      updateTasks(tasks.map(t => t.id === id ? record : t));
      syncRecord("tasks", record);
    } else if (table === "journal") {
      const record = { ...journal.find(j => j.id === id), [field]: cellValue };
      updateJournal(journal.map(j => j.id === id ? record : j));
      syncRecord("journal", record);
    }
    setEditingCell(null);
  };
  const deleteRow = (table, id) => {
    if (table === "projects") updateProjects(projects.filter(p => p.id !== id));
    else if (table === "tasks") updateTasks(tasks.filter(t => t.id !== id));
    else if (table === "journal") updateJournal(journal.filter(j => j.id !== id));
    deleteRecord(table, id);
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
      border: variant === "ghost" ? "1px solid #ddd" : "none",
      background: variant === "primary" ? "#5b4ef8" : variant === "ghost" ? "#fff" : "#f0f0f0",
      color: variant === "primary" ? "#fff" : "#222",
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
        </div>
      </div>

      {/* Hello Martin */}
      <div style={{ textAlign: "center", padding: "32px 24px 16px", background: "#fff" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#222", margin: 0 }}>Hello Martin 👋</h1>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[["kanban", "🗂 Kanban"], ["home", "🏠 Accueil"], ["projects", "📁 Projets"], ["dashboard", "📊 Dashboard"], ["journal", "📝 Journal"], ["data", "🗄 Données"]].map(([id, label]) => (
          <button key={id} style={s.tabBtn(tab === id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <div style={s.body}>

        {/* ── KANBAN ── */}
        {tab === "kanban" && (
          <div>
            <div style={{ ...s.sectionTitle, marginBottom: 16 }}>
              <span>TÂCHES — VUE KANBAN</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  style={{ ...s.btn("ghost"), fontSize: 13, padding: "6px 12px", color: kanbanShowDone ? "#5b4ef8" : "#aaa", borderColor: kanbanShowDone ? "#5b4ef8" : "#ddd" }}
                  onClick={() => setKanbanShowDone(!kanbanShowDone)}>
                  {kanbanShowDone ? "✓ Terminées visibles" : "Masquer terminées"}
                </button>
                <button style={s.btn("primary")} onClick={() => openModal("task", { status: "À faire", priority: "Moyenne", dept: deptFilter === "all" ? "ops" : deptFilter, temp: 2 })}>+ Nouvelle tâche</button>
              </div>
            </div>
            <div style={{ ...s.kanbanGrid, gridTemplateColumns: kanbanShowDone ? "repeat(4, 1fr)" : "repeat(2, 1fr)" }}>
              {STATUSES.filter(status => kanbanShowDone ? true : (status === "À faire" || status === "En cours")).map(status => {
                const colTasks = filteredTasks.filter(t => t.status === status);
                return (
                  <div key={status} style={s.kanbanCol}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => onDrop(status)}>
                    <div style={s.kanbanColHeader}>
                      {STATUS_ICONS[status]} {status} <span style={{ color: "#333", marginLeft: 4 }}>({colTasks.length})</span>
                    </div>
                    {colTasks.map(task => (
                      <div key={task.id} style={s.taskCard(task.dept)}
                        draggable onDragStart={() => onDragStart(task.id)}
                        onClick={() => openModal("task", { ...task })}>
                        <div style={{ fontSize: 14, color: "#222", marginBottom: 6, lineHeight: 1.4 }}>{task.name}</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={s.tag(getDeptColor(task.dept))}>{getDeptIcon(task.dept)}</span>
                          <span style={s.tag(PRIO_COLOR[task.priority])}>{task.priority}</span>
                          {isOverdue(task.due) && status !== "Terminé" && status !== "Abandonné" && <span style={s.tag("#E85555")}>⚠ Retard</span>}
                          <span style={{ marginLeft: "auto", fontSize: 14 }}>{getTempEmoji(task.temp)}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>Échéance {task.due}</div>
                      </div>
                    ))}
                    {colTasks.length === 0 && <div style={{ color: "#ddd", fontSize: 13, textAlign: "center", padding: "20px 0" }}>—</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
            .sort((a, b) => a.date.localeCompare(b.date))
            .filter(j => deptFilter === "all" || j.dept === deptFilter)
            .map(j => ({
              date: j.date.slice(5), // MM-DD
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

          return (
            <div>
              <div style={s.sectionTitle}>
                <span>DASHBOARD — {deptFilter === "all" ? "TOUS DÉPARTEMENTS" : DEPTS.find(d => d.id === deptFilter)?.label.toUpperCase()}</span>
              </div>

              {/* Row 1: Dial + Pie + Overdue summary */}
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

                {/* Overdue / active summary */}
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

              {/* Row 4: Temperature line chart */}
              <div style={{ ...chartCard, marginTop: 0 }}>
                <div style={chartTitle}>Tendance température 😓 → 😄</div>
                {tempLine.length < 2
                  ? <div style={{ textAlign: "center", color: "#aaa", fontSize: 13, padding: "40px 0" }}>Pas assez d'entrées journal pour afficher la tendance.</div>
                  : <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={tempLine}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#aaa" }} />
                      <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#aaa" }}
                        tickFormatter={v => ["😓", "😐", "🙂", "😊", "😄"][v]} />
                      <Tooltip formatter={(val) => [["😓", "😐", "🙂", "😊", "😄"][val], "Température"]} labelFormatter={l => `Date: ${l}`} />
                      <Line type="monotone" dataKey="temp" stroke="#5b4ef8" strokeWidth={2.5} dot={{ fill: "#5b4ef8", r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                }
              </div>
            </div>
          );
        })()}

        {/* ── JOURNAL ── */}
        {tab === "journal" && (
          <div style={{ maxWidth: 680 }}>
            <div style={s.sectionTitle}>
              <span>JOURNAL</span>
              <button style={s.btn("primary")} onClick={() => openModal("journal", { type: "📝 Note", temp: 2, dept: deptFilter === "all" ? "ops" : deptFilter, priority: "Moyenne" })}>+ Entrée</button>
            </div>
            {filteredJournal.map(j => (
              <div key={j.id} style={{ ...s.card, borderLeft: `3px solid ${getDeptColor(j.dept)}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 13, color: "#222" }}>{j.title}</span>
                    <span style={{ marginLeft: 8, fontSize: 14 }}>{getTempEmoji(j.temp)}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#aaa" }}>{j.date}</span>
                </div>
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                  <span style={s.tag(getDeptColor(j.dept))}>{getDeptIcon(j.dept)}</span>
                  <span style={s.tag("#555")}>{j.type}</span>
                  {j.priority === "Haute" && <span style={s.tag(PRIO_COLOR.Haute)}>Haute</span>}
                </div>
                {j.description && <div style={{ fontSize: 13, color: "#666", marginBottom: j.nextAction ? 6 : 0, lineHeight: 1.5 }}>{j.description}</div>}
                {j.nextAction && <div style={{ fontSize: 12, color: "#5b4ef8" }}>→ {j.nextAction}</div>}
              </div>
            ))}
          </div>
        )}

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
                    else openModal("journal", { type: "📝 Note", temp: 2, dept: "ops", priority: "Moyenne" });
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
                {showModal === "task" ? (form.id ? "Modifier tâche" : "Nouvelle tâche") : showModal === "journal" ? "Nouvelle entrée journal" : showModal === "project" ? (form.id ? "Modifier projet" : "Nouveau projet") : ""}
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
                    <label style={s.label}>Heures estimées</label>
                    <input type="number" step="0.5" style={s.input} value={form.estH || ""} onChange={e => setForm({ ...form, estH: parseFloat(e.target.value) })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Heures passées</label>
                    <input type="number" step="0.5" style={s.input} value={form.passedH || ""} onChange={e => setForm({ ...form, passedH: parseFloat(e.target.value) })} />
                  </div>
                </div>

                <label style={s.label}>Température</label>
                <div style={{ ...s.row, marginBottom: 10 }}>
                  {TEMPS.map(t => (
                    <button key={t.score} style={s.tempBtn(form.temp === t.score)} onClick={() => setForm({ ...form, temp: t.score })} title={t.label}>{t.emoji}</button>
                  ))}
                </div>

                <label style={s.label}>Notes</label>
                <textarea style={{ ...s.input, resize: "vertical", minHeight: 60 }} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} />

                <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    {form.id && <button style={s.btnDanger} onClick={() => { if (window.confirm("Supprimer cette tâche ?")) { deleteRow("tasks", form.id); setShowModal(null); } }}>🗑 Supprimer</button>}
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

                <label style={s.label}>Température</label>
                <div style={{ ...s.row, marginBottom: 10 }}>
                  {TEMPS.map(t => (
                    <button key={t.score} style={s.tempBtn(form.temp === t.score)} onClick={() => setForm({ ...form, temp: t.score })} title={t.label}>{t.emoji}</button>
                  ))}
                </div>

                <label style={s.label}>Prochaine action</label>
                <input style={s.input} value={form.nextAction || ""} onChange={e => setForm({ ...form, nextAction: e.target.value })} placeholder="→ Que faire ensuite ?" />

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
          </div>
        </div>
      )}
    </div>
  );
}
