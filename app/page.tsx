'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { CalendarDays, CheckCircle2, Clock3, LogOut, Plus, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

type Status = 'todo' | 'in_progress' | 'done';
type Priority = 'low' | 'medium' | 'high';
type Task = {
  id: string; title: string; description: string; status: Status; priority: Priority;
  progress: number; start_at: string | null; due_at: string | null; created_at: string;
};

const supabase = createClient();
const emptyForm = { title: '', description: '', priority: 'medium' as Priority, start_at: '', due_at: '' };

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin'|'signup'>('signin');
  const [message, setMessage] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<'all'|Status>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUserId(data.user?.id ?? null); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) { setTasks([]); return; }
    loadTasks();
    const channel = supabase.channel('tasks-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` }, loadTasks)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  async function loadTasks() {
    const { data, error } = await supabase.from('tasks').select('*').order('due_at', { ascending: true, nullsFirst: false });
    if (!error) setTasks(data ?? []);
  }

  async function authenticate(e: FormEvent) {
    e.preventDefault(); setMessage('');
    const result = authMode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setMessage(result.error?.message ?? (authMode === 'signup' ? 'Account created. Check your email if confirmation is enabled.' : 'Signed in.'));
  }

  async function addTask(e: FormEvent) {
    e.preventDefault(); if (!userId || !form.title.trim()) return;
    const { error } = await supabase.from('tasks').insert({
      user_id: userId, title: form.title.trim(), description: form.description.trim(), priority: form.priority,
      start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null
    });
    if (error) setMessage(error.message); else { setForm(emptyForm); loadTasks(); }
  }

  async function updateTask(id: string, values: Partial<Task>) {
    await supabase.from('tasks').update(values).eq('id', id); loadTasks();
  }
  async function removeTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id); loadTasks();
  }

  const visible = useMemo(() => filter === 'all' ? tasks : tasks.filter(t => t.status === filter), [tasks, filter]);
  const done = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t => t.due_at && isPast(new Date(t.due_at)) && t.status !== 'done').length;

  if (loading) return <main className="center"><div className="spinner" /></main>;
  if (!userId) return <main className="auth-shell"><section className="auth-card">
    <div className="brand"><CheckCircle2 size={30}/> TaskFlow</div>
    <h1>{authMode === 'signin' ? 'Welcome back' : 'Create your workspace'}</h1>
    <p>Plan deadlines, track progress and see live task updates.</p>
    <form onSubmit={authenticate} className="stack">
      <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
      <input type="password" placeholder="Password (6+ characters)" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required />
      <button className="primary">{authMode === 'signin' ? 'Sign in' : 'Sign up'}</button>
    </form>
    {message && <div className="notice">{message}</div>}
    <button className="link" onClick={()=>setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
      {authMode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
    </button>
  </section></main>;

  return <main className="app-shell">
    <header><div className="brand"><CheckCircle2/> TaskFlow</div><button className="ghost" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> Sign out</button></header>
    <section className="hero"><div><span className="eyebrow">PERSONAL COMMAND CENTER</span><h1>Make progress visible.</h1><p>Turn plans into focused work with timelines, priorities and live updates.</p></div>
      <div className="stats"><div><b>{tasks.length}</b><span>Total</span></div><div><b>{done}</b><span>Done</span></div><div><b>{overdue}</b><span>Overdue</span></div></div>
    </section>
    <section className="grid">
      <aside className="panel"><h2><Plus size={20}/> Add task</h2><form onSubmit={addTask} className="stack">
        <label>Task<input placeholder="Ship onboarding flow" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required /></label>
        <label>Details<textarea placeholder="Notes, acceptance criteria, links…" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
        <label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value as Priority})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <label>Starts<input type="datetime-local" value={form.start_at} onChange={e=>setForm({...form,start_at:e.target.value})}/></label>
        <label>Due<input type="datetime-local" value={form.due_at} onChange={e=>setForm({...form,due_at:e.target.value})}/></label>
        <button className="primary"><Plus size={17}/> Create task</button>
      </form></aside>
      <section><div className="toolbar"><h2>Your tasks</h2><div className="filters">{(['all','todo','in_progress','done'] as const).map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{x.replace('_',' ')}</button>)}</div></div>
      <div className="tasks">{visible.length === 0 ? <div className="empty"><CheckCircle2 size={42}/><h3>Clear runway</h3><p>Add a task or change the filter.</p></div> : visible.map(task=><article className={`task priority-${task.priority}`} key={task.id}>
        <div className="task-head"><div><span className="badge">{task.priority}</span><h3>{task.title}</h3></div><button className="icon" onClick={()=>removeTask(task.id)} aria-label="Delete"><Trash2 size={17}/></button></div>
        {task.description && <p>{task.description}</p>}
        <div className="dates">{task.start_at && <span><CalendarDays size={15}/> {format(new Date(task.start_at),'MMM d, p')}</span>}{task.due_at && <span className={isPast(new Date(task.due_at))&&task.status!=='done'?'late':''}><Clock3 size={15}/> {isPast(new Date(task.due_at)) ? 'Due ' + formatDistanceToNow(new Date(task.due_at)) + ' ago' : 'Due in ' + formatDistanceToNow(new Date(task.due_at))}</span>}</div>
        <div className="progress-row"><input type="range" min="0" max="100" value={task.progress} onChange={e=>{const progress=Number(e.target.value); updateTask(task.id,{progress,status:progress===100?'done':progress>0?'in_progress':'todo'})}}/><b>{task.progress}%</b></div>
        <div className="status-buttons">{(['todo','in_progress','done'] as Status[]).map(s=><button key={s} className={task.status===s?'selected':''} onClick={()=>updateTask(task.id,{status:s,progress:s==='done'?100:task.progress===100?50:task.progress})}>{s.replace('_',' ')}</button>)}</div>
      </article>)}</div></section>
    </section>{message && <div className="toast">{message}</div>}
  </main>;
}
