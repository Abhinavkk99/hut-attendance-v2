import { Layout } from '../components/Layout';
import { useState } from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle2 } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  spots: number;
  spotsAvailable: number;
  description: string;
  registered: boolean;
}

export default function ParticipantEvents() {
  const [events, setEvents] = useState<Event[]>([
    { id: '1', name: 'Yoga for Beginners', date: '2026-03-20', time: '9:00 AM – 10:00 AM', location: 'Main Hall', spots: 20, spotsAvailable: 12, description: 'A gentle yoga class suitable for all fitness levels', registered: false },
    { id: '2', name: 'Art Workshop', date: '2026-03-22', time: '2:00 PM – 4:00 PM', location: 'Art Studio', spots: 15, spotsAvailable: 8, description: 'Learn watercolor painting techniques', registered: true },
    { id: '3', name: 'Cooking Class', date: '2026-03-25', time: '5:00 PM – 7:00 PM', location: 'Community Kitchen', spots: 12, spotsAvailable: 5, description: 'Healthy meal preparation and cooking tips', registered: false },
    { id: '4', name: 'Dance Fitness', date: '2026-03-27', time: '6:00 PM – 7:00 PM', location: 'Dance Studio', spots: 25, spotsAvailable: 18, description: 'Fun cardio workout with dance moves', registered: false },
    { id: '5', name: 'Book Club Meeting', date: '2026-03-28', time: '3:00 PM – 4:30 PM', location: 'Library Room', spots: 15, spotsAvailable: 10, description: 'Monthly book discussion and social gathering', registered: true },
  ]);

  const [filter, setFilter] = useState<'all' | 'available' | 'registered'>('all');

  const register = (id: string) =>
    setEvents((evs) =>
      evs.map((e) =>
        e.id === id
          ? {
              ...e,
              registered: !e.registered,
              spotsAvailable: e.registered ? e.spotsAvailable + 1 : e.spotsAvailable - 1,
            }
          : e
      )
    );

  const filtered = events.filter((e) => {
    if (filter === 'registered') return e.registered;
    if (filter === 'available') return !e.registered && e.spotsAvailable > 0;
    return true;
  });

  const tabs: Array<{ key: typeof filter; label: string }> = [
    { key: 'all', label: 'All events' },
    { key: 'available', label: 'Available' },
    { key: 'registered', label: 'Registered' },
  ];

  return (
    <Layout title="Events" subtitle="Browse and sign up for programs">
      <div className="mb-4 inline-flex rounded-lg border border-zinc-800 bg-[#111113] p-0.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === t.key ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((e) => {
          const filled = e.spots - e.spotsAvailable;
          const pct = (filled / e.spots) * 100;
          const low = e.spotsAvailable < 5;
          return (
            <div
              key={e.id}
              className="rounded-xl border border-zinc-800/80 bg-[#111113] p-5 transition-colors hover:border-zinc-700"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-zinc-100">{e.name}</h3>
                {e.registered && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    <CheckCircle2 size={11} /> Registered
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-zinc-500" />
                  {new Date(e.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-zinc-500" />
                  {e.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-zinc-500" />
                  {e.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={13} className="text-zinc-500" />
                  {e.spotsAvailable} of {e.spots} spots available
                </div>
              </div>

              <p className="mt-3 text-xs text-zinc-500">{e.description}</p>

              <div className="mt-4 h-1 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className={`h-full rounded-full transition-all ${low ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <button
                onClick={() => register(e.id)}
                disabled={e.spotsAvailable === 0 && !e.registered}
                className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  e.registered
                    ? 'border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15'
                    : e.spotsAvailable === 0
                      ? 'cursor-not-allowed bg-zinc-900 text-zinc-600'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-indigo-500'
                }`}
              >
                {e.registered ? 'Cancel registration' : e.spotsAvailable === 0 ? 'Event full' : 'Register'}
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-6 rounded-xl border border-zinc-800/80 bg-[#111113] px-4 py-10 text-center text-sm text-zinc-500">
          No events match this filter.
        </div>
      )}
    </Layout>
  );
}
