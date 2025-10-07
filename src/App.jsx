import React, { useEffect, useState } from "react";
import { CalendarDays, CheckSquare, Clock, ListTodo, Pause, Play, Plus, Trash2, Printer, ChevronLeft, ChevronRight } from "lucide-react";

/* Helper Components */
const Card = ({ children, className = "" }) => (
  <div className={`bg-white shadow-xl rounded-2xl p-5 md:p-6 border border-gray-100 ${className}`}>{children}</div>
);

const Input = (props) => (
  <input {...props} className={`w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f9c8b1] focus:border-[#f9c8b1] ${props.className || ""}`} />
);

const Button = ({ children, variant = "solid", className = "", ...rest }) => {
  const base = "rounded-2xl px-4 py-2 font-medium shadow-sm border active:shadow text-sm transition-all duration-200";
  const styles =
    variant === "solid"
      ? "bg-[#f9c8b1] text-black border-[#f9c8b1] hover:bg-[#f7bfa4]"
      : variant === "ghost"
      ? "bg-white text-black border border-[#f3d1c1] hover:bg-[#ffe8dd]"
      : "bg-gray-100 text-black border border-gray-200 hover:bg-gray-200";
  return (
    <button {...rest} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
};

/* Utility functions */
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const todayISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const useLocalState = (key, def) => {
  const [state, setState] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch {
      return def;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
};

/* Pomodoro Timer */
function Pomodoro() {
  const [duration, setDuration] = useLocalState("pomodoro_duration", 25);
  const [breakLen, setBreakLen] = useLocalState("pomodoro_break", 5);
  const [seconds, setSeconds] = useLocalState("pomodoro_seconds", duration * 60);
  const [running, setRunning] = useLocalState("pomodoro_running", false);
  const [mode, setMode] = useLocalState("pomodoro_mode", "work");
  const intervalRef = React.useRef(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => {
    if (seconds >= 0) return;
    if (mode === "work") {
      setMode("break");
      setSeconds(breakLen * 60);
    } else {
      setMode("work");
      setSeconds(duration * 60);
    }
  }, [seconds, mode, breakLen, duration]);

  const mm = Math.floor(seconds / 60);
  const ss = Math.max(seconds % 60, 0);

  return (
    <Card>
      <div className="flex items-center gap-3 mb-2">
        <Clock className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Focus Timer</h3>
      </div>
      <p className="text-sm text-gray-600 mb-3">{mode === "work" ? "Work sprint" : "Break time"} — stay focused 💪</p>
      <div className="flex items-center gap-6">
        <div className="text-5xl font-semibold">{pad(mm)}:{pad(ss)}</div>
        <div className="flex gap-2">
          {running ? (
            <Button onClick={() => setRunning(false)}><Pause className="inline w-4 h-4 mr-2" />Pause</Button>
          ) : (
            <Button onClick={() => setRunning(true)}><Play className="inline w-4 h-4 mr-2" />Start</Button>
          )}
          <Button variant="ghost" onClick={() => { setRunning(false); setSeconds(mode === "work" ? duration * 60 : breakLen * 60); }}>Reset</Button>
        </div>
      </div>
    </Card>
  );
}

/* Tasks Section */
function Tasks({ date }) {
  const key = `tasks_${date}`;
  const [tasks, setTasks] = useLocalState(key, []);
  const [text, setText] = useState("");

  const addTask = () => {
    if (!text.trim()) return;
    const t = { id: crypto.randomUUID(), text: text.trim(), done: false };
    setTasks([t, ...tasks]);
    setText("");
  };

  const toggle = (id) => setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id) => setTasks(tasks.filter((t) => t.id !== id));

  return (
    <Card>
      <div className="flex items-center gap-3 mb-2"><ListTodo className="w-5 h-5" /><h3 className="text-lg font-semibold">Tasks</h3></div>
      <div className="flex gap-3 mb-3">
        <Input placeholder="Add a task…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} />
        <Button onClick={addTask}><Plus className="inline w-4 h-4 mr-2" />Add</Button>
      </div>
      <ul className="divide-y">
        {tasks.map((t) => (
          <li key={t.id} className="py-2 flex items-center gap-3">
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
            <span className={`text-sm flex-1 ${t.done ? "line-through text-gray-400" : ""}`}>{t.text}</span>
            <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600"><Trash2 className="w-4 h-4" /></button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* Habits Section */
function Habits({ date }) {
  const key = `habits_${date}`;
  const [habits, setHabits] = useLocalState(key, []);
  const [name, setName] = useState("");
  const add = () => { if (!name.trim()) return; setHabits([...habits, { id: crypto.randomUUID(), name, done: false }]); setName(""); };
  const toggle = (id) => setHabits(habits.map((h) => (h.id === id ? { ...h, done: !h.done } : h)));
  const remove = (id) => setHabits(habits.filter((h) => h.id !== id));

  return (
    <Card>
      <div className="flex items-center gap-3 mb-2"><CheckSquare className="w-5 h-5" /><h3 className="text-lg font-semibold">Habits</h3></div>
      <div className="flex gap-2 mb-3">
        <Input placeholder="Add habit…" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button onClick={add}><Plus className="inline w-4 h-4 mr-1" />Add</Button>
      </div>
      <ul className="divide-y">
        {habits.map((h) => (
          <li key={h.id} className="py-2 flex items-center gap-3">
            <input type="checkbox" checked={h.done} onChange={() => toggle(h.id)} />
            <span className={`text-sm flex-1 ${h.done ? "line-through text-gray-400" : ""}`}>{h.name}</span>
            <button onClick={() => remove(h.id)} className="text-gray-400 hover:text-gray-600"><Trash2 className="w-4 h-4" /></button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* Notes Section */
function Notes({ date }) {
  const key = `notes_${date}`;
  const [notes, setNotes] = useLocalState(key, "");
  return (
    <Card>
      <div className="flex items-center gap-3 mb-2"><ListTodo className="w-5 h-5" /><h3 className="text-lg font-semibold">Notes</h3></div>
      <textarea className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm min-h-[100px]" placeholder="Brain dump, gratitude, reminders…" value={notes} onChange={(e) => setNotes(e.target.value)} />
    </Card>
  );
}

/* Date Control */
function useToday() {
  const [date, setDate] = useLocalState("planner_date", todayISO());
  const d = new Date(date);
  const move = (days) => { const nd = new Date(d); nd.setDate(d.getDate() + days); setDate(todayISO(nd)); };
  return { date, setDate, move, nice: d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) };
}

/* Main App */
export default function App() {
  const { date, setDate, move, nice } = useToday();

  return (
    <div className="min-h-screen text-black fade-in">
      <div className="max-w-6xl mx-auto px-5 py-8 md:py-12">
        <div className="flex items-center justify-between gap-3 fade-in">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold italic" style={{ fontFamily: "'Playfair Display', serif" }}>
              Vrunda’s Daily Planner
            </h1>
            <p className="mt-1" style={{ color: "#444", fontFamily: "'Poppins', sans-serif" }}>
              Plan your day beautifully ✨
            </p>
          </div>
          <Button variant="ghost" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
        </div>

        <Card className="mt-6 fade-in">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={() => move(-1)}><ChevronLeft className="w-4 h-4 mr-1" />Prev</Button>
            <Input type="date" value={date} onChange={(e) =
