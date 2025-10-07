import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { 
  CalendarDays, CheckSquare, Clock, ListTodo, Pause, Play, Plus, 
  Trash2, Printer, ChevronLeft, ChevronRight 
} from "lucide-react";

const Card = ({ children, className = "" }) => (
  <div className={`bg-white shadow-xl rounded-2xl p-5 md:p-6 border border-gray-100 ${className}`}>{children}</div>
);

const Input = (props) => (
  <input {...props} className={`w-full rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-gray-800 px-3 py-2 text-sm ${props.className||""}`} />
);

const Button = ({ children, variant = "solid", className = "", ...rest }) => {
  const base = "rounded-2xl px-4 py-2 font-medium shadow-sm border active:shadow text-sm";
  const styles =
    variant === "solid"
      ? "bg-gray-900 text-white border-gray-900 hover:bg-black"
      : variant === "ghost"
      ? "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
      : "bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200";
  return (
    <button {...rest} className={`${base} ${styles} ${className}`}>{children}</button>
  );
};

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const todayISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

const useLocalState = (key, def) => {
  const [state, setState] = useState(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
  });
  useEffect(()=>{ try { localStorage.setItem(key, JSON.stringify(state)); } catch {} }, [key, state]);
  return [state, setState];
};

function Pomodoro() {
  const [duration, setDuration] = useLocalState("pomodoro_duration", 25);
  const [breakLen, setBreakLen] = useLocalState("pomodoro_break", 5);
  const [seconds, setSeconds] = useLocalState("pomodoro_seconds", duration*60);
  const [running, setRunning] = useLocalState("pomodoro_running", false);
  const [mode, setMode] = useLocalState("pomodoro_mode", "work");
  const intervalRef = useRef(null);

  useEffect(()=>{ if (!running) return; intervalRef.current = setInterval(()=> setSeconds(s=>s-1), 1000); return ()=>clearInterval(intervalRef.current); }, [running]);
  useEffect(()=>{ if (seconds>=0) return; if (mode==="work") { setMode("break"); setSeconds(breakLen*60); } else { setMode("work"); setSeconds(duration*60); } }, [seconds, mode, breakLen, duration]);
  useEffect(()=>{ if (mode==="work") setSeconds(duration*60); }, [duration]);
  useEffect(()=>{ if (mode==="break") setSeconds(breakLen*60); }, [breakLen]);

  const mm = Math.floor(seconds/60); const ss = Math.max(seconds%60,0);

  return (
    <Card>
      <div className="flex items-center gap-3 mb-2"><Clock className="w-5 h-5"/><h3 className="text-lg font-semibold">Focus Timer</h3></div>
      <p className="text-sm text-gray-600 mb-3">{mode === "work" ? "Work sprint" : "Break"} — stay focused in short bursts.</p>
      <div className="flex items-center gap-6">
        <div className="text-5xl font-semibold tabular-nums">{pad(mm)}:{pad(ss)}</div>
        <div className="flex gap-2">
          {running ? (
            <Button onClick={()=>setRunning(false)}><Pause className="inline w-4 h-4 mr-2"/>Pause</Button>
          ) : (
            <Button onClick={()=>setRunning(true)}><Play className="inline w-4 h-4 mr-2"/>Start</Button>
          )}
          <Button variant="ghost" onClick={()=>{ setRunning(false); setSeconds(mode==="work"?duration*60:breakLen*60);} }>Reset</Button>
        </div>
      </div>
    </Card>
  );
}

function Tasks({ date }) {
  const key = `tasks_${date}`;
  const [tasks, setTasks] = useLocalState(key, []);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("M");
  const [when, setWhen] = useState("");
  const [area, setArea] = useState("General");

  const addTask = () => {
    if (!text.trim()) return;
    const t = { id: crypto.randomUUID(), text: text.trim(), priority, when, area, done:false };
    setTasks([t, ...tasks]);
    setText(""); setWhen("");
  };
  const toggle = (id) => setTasks(tasks.map(t=> t.id===id?{...t, done:!t.done}:t));
  const remove = (id) => setTasks(tasks.filter(t=>t.id!==id));

  const sorted = React.useMemo(()=>{
    const rank = {H:0, M:1, L:2};
    return [...tasks].sort((a,b)=> (rank[a.priority]-rank[b.priority]) || (a.when || "zz").localeCompare(b.when||"zz"));
  }, [tasks]);

  return (
    <Card>
      <div className="flex items-center gap-3 mb-2"><ListTodo className="w-5 h-5"/><h3 className="text-lg font-semibold">Tasks</h3></div>
      <div className="grid md:grid-cols-5 gap-3 mb-3">
        <div className="md:col-span-2"><Input placeholder="Add a task…" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') addTask(); }} /></div>
        <div>
          <select value={priority} onChange={e=>setPriority(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm">
            <option value="H">High</option>
            <option value="M">Medium</option>
            <option value="L">Low</option>
          </select>
        </div>
        <div><Input type="time" value={when} onChange={e=>setWhen(e.target.value)}/></div>
        <div>
          <select value={area} onChange={e=>setArea(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm">
            <option>General</option>
            <option>Study</option>
            <option>Work</option>
            <option>Health</option>
            <option>Personal</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <Button onClick={addTask}><Plus className="inline w-4 h-4 mr-2"/>Add</Button>
        <Button variant="ghost" onClick={()=>setTasks(tasks.filter(t=>!t.done))}><Trash2 className="inline w-4 h-4 mr-2"/>Clear Completed</Button>
      </div>
      <ul className="divide-y">
        {sorted.map(t=> (
          <li key={t.id} className="py-2 flex items-center gap-3">
            <input type="checkbox" checked={t.done} onChange={()=>toggle(t.id)} className="w-4 h-4"/>
            <span className={`text-sm flex-1 ${t.done?"line-through text-gray-400":""}`}>
              <span className={`mr-2 inline-block text-[10px] px-2 py-0.5 rounded-full border ${t.priority==='H'?"bg-red-50 text-red-700 border-red-200": t.priority==='M'?"bg-amber-50 text-amber-700 border-amber-200":"bg-green-50 text-green-700 border-green-200"}`}>{t.priority}</span>
              {t.text} {t.when && <span className="ml-2 text-xs text-gray-500">@{t.when}</span>} {t.area && <span className="ml-1 text-[10px] text-gray-500">[{t.area}]</span>}
            </span>
            <button onClick={()=>remove(t.id)} className="text-gray-400 hover:text-gray-600"><Trash2 className="w-4 h-4"/></button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Habits({ date }) {
  const key = `habits_${date}`;
  const [habits, setHabits] = useLocalState(key, [
    { id: crypto.randomUUID(), name: "Hydrate (8 glasses)", done:false },
    { id: crypto.randomUUID(), name: "10k steps / cardio", done:false },
    { id: crypto.randomUUID(), name: "Study DSA 30m", done:false },
  ]);
  const [name, setName] = useState("");
  const add = () => { if(!name.trim()) return; setHabits([...habits, { id: crypto.randomUUID(), name:name.trim(), done:false }]); setName(""); };
  const toggle = (id) => setHabits(habits.map(h=>h.id===id?{...h, done:!h.done}:h));
  const remove = (id) => setHabits(habits.filter(h=>h.id!==id));

  const completion = Math.round((habits.filter(h=>h.done).length / (habits.length||1))*100);

  return (
    <Card>
      <div className="flex items-center gap-3 mb-2"><CheckSquare className="w-5 h-5"/><h3 className="text-lg font-semibold">Habits</h3></div>
      <div className="flex gap-2 mb-3">
        <Input placeholder="Add habit…" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') add(); }}/>
        <Button onClick={add}><Plus className="inline w-4 h-4 mr-1"/>Add</Button>
      </div>
      <ul className="divide-y">
        {habits.map(h=> (
          <li key={h.id} className="py-2 flex items-center gap-3">
            <input type="checkbox" checked={h.done} onChange={()=>toggle(h.id)} className="w-4 h-4"/>
            <span className={`text-sm flex-1 ${h.done?"line-through text-gray-400":""}`}>{h.name}</span>
            <button onClick={()=>remove(h.id)} className="text-gray-400 hover:text-gray-600"><Trash2 className="w-4 h-4"/></button>
          </li>
        ))}
      </ul>
      <div className="mt-3 text-xs text-gray-600">Completion: {completion}%</div>
    </Card>
  );
}

function Notes({ date }) {
  const key = `notes_${date}`;
  const [notes, setNotes] = useLocalState(key, "");
  return (
    <Card>
      <div className="flex items-center gap-3 mb-2"><ListTodo className="w-5 h-5"/><h3 className="text-lg font-semibold">Notes</h3></div>
      <textarea className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm min-h-[100px]" placeholder="Brain dump, gratitude, reminders…" value={notes} onChange={e=>setNotes(e.target.value)} />
    </Card>
  );
}

function useToday() {
  const [date, setDate] = useLocalState("planner_date", todayISO());
  const d = new Date(date);
  const move = (days) => { const nd = new Date(d); nd.setDate(d.getDate()+days); setDate(todayISO(nd)); };
  return { date, setDate, move, nice: d.toLocaleDateString(undefined,{ weekday:"long", month:"long", day:"numeric" }) };
}

export default function App() {
  const { date, setDate, move, nice } = useToday();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <div className="max-w-6xl mx-auto px-5 py-8 md:py-12">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Vrunda’s Daily Planner</h1>
            <p className="text-gray-600 mt-1">Plan your day with tasks, habits, and focus sessions.</p>
          </div>
          <Button variant="ghost" onClick={()=>window.print()}><Printer className="w-4 h-4 mr-2"/>Print</Button>
        </div>

        <Card className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={()=>move(-1)}><ChevronLeft className="w-4 h-4 mr-1"/>Prev</Button>
            <Input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-[180px]"/>
            <Button variant="ghost" onClick={()=>setDate(todayISO())}>Today</Button>
            <Button variant="ghost" onClick={()=>move(1)}>Next<ChevronRight className="w-4 h-4 ml-1"/></Button>
            <div className="ml-auto text-sm text-gray-600 flex items-center gap-2"><CalendarDays className="w-4 h-4"/>{nice}</div>
          </div>
        </Card>

        <div className="grid md:grid-cols-5 gap-6 mt-6">
          <div className="md:col-span-3 space-y-6">
            <Tasks date={date} />
          </div>
          <div className="md:col-span-2 space-y-6">
            <Pomodoro />
            <Habits date={date} />
            <Notes date={date} />
          </div>
        </div>
      </div>
    </div>
  );
}
