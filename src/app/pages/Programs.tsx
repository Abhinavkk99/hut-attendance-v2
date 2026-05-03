import { useState, useEffect, Fragment } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Users, Clock, Calendar, X, AlertCircle } from 'lucide-react';

interface Program {
  id: string;
  name: string;
  description: string;
  days: string[];
  start_time: string;
  end_time: string;
  capacity: number;
  recurrence_type: string;
  event_date?: string;
  start_date?: string;
  week_of_month?: number;
  day_of_week?: string;
  created_at: string;
}

interface ProgramStaff {
  id: string;
  program_id: string;
  user_id: string;
  assigned_at: string;
  profiles?: { full_name: string; email: string };
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface ProgramWithEnrollment extends Program {
  enrollment_count?: number;
}

const emptyForm = {
  name: '',
  description: '',
  days: [] as string[],
  start_time: '',
  end_time: '',
  capacity: 20,
  recurrence_type: 'weekly',
  event_date_month: '',
  event_date_day: '',
  event_date_year: '',
  start_date_month: '',
  start_date_day: '',
  start_date_year: '',
  week_of_month: '',
  day_of_week: '',
};

type FormData = typeof emptyForm;

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const monthOptions = [
  { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' }, { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' }, { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' }, { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
];
const dayOptions = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString());

const timeOptions: string[] = (() => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return times;
})();

const inputClass =
  'w-full rounded-lg border border-zinc-800 bg-[#0e0e10] px-3 py-2 text-sm text-zinc-100 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

const labelClass = 'mb-1.5 block text-xs font-medium text-zinc-400';

export default function Programs() {
  const [programs, setPrograms] = useState<ProgramWithEnrollment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [programStaff, setProgramStaff] = useState<Record<string, ProgramStaff[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showStaff, setShowStaff] = useState(false);
  const [selected, setSelected] = useState<Program | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  useEffect(() => {
    fetchPrograms();
    fetchUsers();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('programs').select('*').order('name', { ascending: true });
      if (error) throw error;

      const withCounts = await Promise.all(
        (data || []).map(async (p) => {
          const { count } = await supabase
            .from('program_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('program_id', p.id);
          return { ...p, enrollment_count: count || 0 };
        })
      );
      setPrograms(withCounts);

      if (data && data.length) {
        const ids = data.map((p) => p.id);
        const { data: staff } = await supabase.from('program_staff').select('*').in('program_id', ids);
        if (staff && staff.length) {
          const userIds = [...new Set(staff.map((s: any) => s.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);
          const profilesMap = new Map<string, any>();
          (profiles || []).forEach((p: any) => profilesMap.set(p.id, p));
          const byProgram: Record<string, ProgramStaff[]> = {};
          staff.forEach((s: any) => {
            if (!byProgram[s.program_id]) byProgram[s.program_id] = [];
            byProgram[s.program_id].push({
              ...s,
              profiles: profilesMap.get(s.user_id) || { full_name: 'Unknown', email: 'Unknown' },
            });
          });
          setProgramStaff(byProgram);
        } else {
          setProgramStaff({});
        }
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to fetch programs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('approved', true)
        .order('full_name', { ascending: true });
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const validate = (f: FormData) => {
    if (!f.name) return 'Please enter a program name';
    if (f.recurrence_type === 'monthly') {
      if (!f.week_of_month || !f.day_of_week) return 'Select the week and day for the monthly event';
    } else if (!f.days.length) return 'Select at least one day';
    if (!f.start_time || !f.end_time) return 'Select start and end times';
    if (!f.start_date_month || !f.start_date_day || !f.start_date_year) return 'Select a start date';
    return null;
  };

  const buildPayload = (f: FormData): any => {
    const payload: any = {
      name: f.name,
      description: f.description,
      start_time: f.start_time,
      end_time: f.end_time,
      capacity: f.capacity,
      recurrence_type: f.recurrence_type,
      start_date: `${f.start_date_year}-${f.start_date_month.padStart(2, '0')}-${f.start_date_day.padStart(2, '0')}`,
    };
    if (f.recurrence_type === 'monthly') {
      payload.week_of_month = parseInt(f.week_of_month);
      payload.day_of_week = f.day_of_week;
      payload.days = [];
    } else {
      payload.days = f.days;
    }
    return payload;
  };

  const handleAdd = async () => {
    const err = validate(formData);
    if (err) return alert(err);
    const { error } = await supabase.from('programs').insert([buildPayload(formData)]);
    if (error) return alert('Failed: ' + error.message);
    setShowAdd(false);
    setFormData(emptyForm);
    fetchPrograms();
  };

  const handleEdit = async () => {
    if (!selected) return;
    const err = validate(formData);
    if (err) return alert(err);
    const { error } = await supabase.from('programs').update(buildPayload(formData)).eq('id', selected.id);
    if (error) return alert('Failed: ' + error.message);
    setShowEdit(false);
    setSelected(null);
    setFormData(emptyForm);
    fetchPrograms();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This removes all enrollments and attendance records.`)) return;
    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (error) return alert('Failed: ' + error.message);
    fetchPrograms();
  };

  const handleAssignStaff = async (userId: string) => {
    if (!selected) return;
    const { error } = await supabase
      .from('program_staff')
      .insert([{ program_id: selected.id, user_id: userId }]);
    if (error) {
      if (error.code === '23505') alert('Already assigned.');
      else alert('Failed: ' + error.message);
      return;
    }
    fetchPrograms();
  };

  const handleRemoveStaff = async (assignmentId: string) => {
    if (!confirm('Remove this staff member?')) return;
    const { error } = await supabase.from('program_staff').delete().eq('id', assignmentId);
    if (error) return alert('Failed: ' + error.message);
    fetchPrograms();
  };

  const openEdit = (p: Program) => {
    setSelected(p);
    const update: any = {
      ...emptyForm,
      name: p.name,
      description: p.description || '',
      days: p.days || [],
      start_time: p.start_time,
      end_time: p.end_time,
      capacity: p.capacity,
      recurrence_type: p.recurrence_type || 'weekly',
      week_of_month: p.week_of_month?.toString() || '',
      day_of_week: p.day_of_week || '',
    };
    if (p.start_date) {
      const [y, m, d] = p.start_date.split('-');
      update.start_date_year = y;
      update.start_date_month = m;
      update.start_date_day = d;
    }
    setFormData(update);
    setShowEdit(true);
  };

  const assignedStaffIds = selected ? (programStaff[selected.id] || []).map((s) => s.user_id) : [];
  const availableUsers = users.filter((u) => !assignedStaffIds.includes(u.id));
  const assignedUsers = selected ? programStaff[selected.id] || [] : [];

  const toggleDay = (day: string) =>
    setFormData((p) => ({
      ...p,
      days: p.days.includes(day) ? p.days.filter((d) => d !== day) : [...p.days, day],
    }));

  const renderForm = () => (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Program name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={inputClass}
          placeholder="e.g. Homework Club"
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={`${inputClass} resize-none`}
          rows={3}
          placeholder="Short description"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Recurrence *</label>
          <select
            value={formData.recurrence_type}
            onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value })}
            className={inputClass}
          >
            <option value="weekly">Weekly</option>
            <option value="fortnightly">Fortnightly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Capacity</label>
          <input
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 20 })}
            className={inputClass}
            min={1}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Start date *</label>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={formData.start_date_month}
            onChange={(e) => setFormData({ ...formData, start_date_month: e.target.value })}
            className={inputClass}
          >
            <option value="">Month</option>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={formData.start_date_day}
            onChange={(e) => setFormData({ ...formData, start_date_day: e.target.value })}
            className={inputClass}
          >
            <option value="">Day</option>
            {dayOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={formData.start_date_year}
            onChange={(e) => setFormData({ ...formData, start_date_year: e.target.value })}
            className={inputClass}
          >
            <option value="">Year</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {formData.recurrence_type === 'monthly' ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Week of month *</label>
            <select
              value={formData.week_of_month}
              onChange={(e) => setFormData({ ...formData, week_of_month: e.target.value })}
              className={inputClass}
            >
              <option value="">Select</option>
              <option value="1">1st</option>
              <option value="2">2nd</option>
              <option value="3">3rd</option>
              <option value="4">4th</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Day of week *</label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
              className={inputClass}
            >
              <option value="">Select</option>
              {daysOfWeek.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div>
          <label className={labelClass}>Days *</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {daysOfWeek.map((day) => {
              const active = formData.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Start time *</label>
          <select
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className={inputClass}
          >
            <option value="">Select</option>
            {timeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>End time *</label>
          <select
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            className={inputClass}
          >
            <option value="">Select</option>
            {timeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Programs" subtitle="Create, edit and assign staff to programs">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-zinc-500">
          {loading ? 'Loading…' : `${programs.length} program${programs.length === 1 ? '' : 's'}`}
        </div>
        <button
          onClick={() => {
            setFormData(emptyForm);
            setShowAdd(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-indigo-500"
        >
          <Plus size={15} /> Add program
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-zinc-800/80 bg-[#111113] px-4 py-10 text-center text-sm text-zinc-500">
          Loading programs…
        </div>
      ) : programs.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/80 bg-[#111113] px-4 py-10 text-center text-sm text-zinc-500">
          No programs yet. Click "Add program" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((p) => {
            const remaining = p.capacity - (p.enrollment_count || 0);
            return (
              <div
                key={p.id}
                className="rounded-xl border border-zinc-800/80 bg-[#111113] p-4 transition-colors hover:border-zinc-700"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold text-zinc-100">{p.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-blue-400"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {p.description && (
                  <p className="mb-3 line-clamp-2 text-xs text-zinc-500">{p.description}</p>
                )}
                <div className="space-y-1.5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-zinc-500" />
                    {p.recurrence_type === 'monthly'
                      ? p.week_of_month && p.day_of_week
                        ? `${['1st', '2nd', '3rd', '4th'][p.week_of_month - 1]} ${p.day_of_week} each month`
                        : 'Monthly'
                      : `${p.recurrence_type === 'fortnightly' ? 'Fortnightly · ' : ''}${p.days?.join(', ') || '—'}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-zinc-500" />
                    {p.start_time} – {p.end_time}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-zinc-500" />
                    {p.enrollment_count}/{p.capacity} enrolled
                    {remaining === 0 && <span className="rounded bg-red-500/15 px-1.5 text-[10px] text-red-300">Full</span>}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelected(p);
                    setShowStaff(true);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                >
                  <Users size={13} />
                  Manage staff ({(programStaff[p.id] || []).length})
                </button>
              </div>
            );
          })}
        </div>
      )}

      {(showAdd || showEdit) && (
        <Modal
          title={showAdd ? 'Add program' : 'Edit program'}
          onClose={() => {
            setShowAdd(false);
            setShowEdit(false);
            setSelected(null);
            setFormData(emptyForm);
          }}
        >
          {renderForm()}
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAdd(false);
                setShowEdit(false);
                setSelected(null);
                setFormData(emptyForm);
              }}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-700 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={showAdd ? handleAdd : handleEdit}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-indigo-500"
            >
              {showAdd ? 'Add program' : 'Save changes'}
            </button>
          </div>
        </Modal>
      )}

      {showStaff && selected && (
        <Modal
          title="Manage staff"
          subtitle={selected.name}
          onClose={() => {
            setShowStaff(false);
            setSelected(null);
          }}
        >
          <div className="space-y-5">
            <div>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Assigned</h4>
              {assignedUsers.length === 0 ? (
                <p className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-3 text-sm text-zinc-500">
                  No staff assigned yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {assignedUsers.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2"
                    >
                      <div>
                        <div className="text-sm text-zinc-100">{s.profiles?.full_name}</div>
                        <div className="text-xs text-zinc-500">{s.profiles?.email}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveStaff(s.id)}
                        className="rounded-md px-2.5 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Available</h4>
              {availableUsers.length === 0 ? (
                <p className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-3 text-sm text-zinc-500">
                  All users are already assigned.
                </p>
              ) : (
                <ul className="space-y-2">
                  {availableUsers.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2"
                    >
                      <div>
                        <div className="text-sm text-zinc-100">{u.full_name}</div>
                        <div className="text-xs text-zinc-500">{u.email} · {u.role}</div>
                      </div>
                      <button
                        onClick={() => handleAssignStaff(u.id)}
                        className="rounded-md bg-blue-500/15 px-2.5 py-1 text-xs text-blue-300 transition-colors hover:bg-blue-500/25"
                      >
                        Assign
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-800 bg-[#111113] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
            {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
