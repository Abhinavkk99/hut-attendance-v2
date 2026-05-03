import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import {
  Home,
  ClipboardCheck,
  UserPlus,
  UserCheck,
  Search,
  BarChart3,
  FolderOpen,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  PlayCircle,
  ExternalLink,
  RotateCcw,
  HelpCircle,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';

interface TrainingStep {
  stepNumber: number | string;
  title: string;
  description: string;
}

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: 'gray' | 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'amber';
  route: string | null;
  steps: TrainingStep[];
}

const toneStyles: Record<TrainingModule['tone'], { bg: string; text: string; ring: string; gradient: string }> = {
  gray: { bg: 'bg-zinc-500/10', text: 'text-zinc-300', ring: 'ring-zinc-500/20', gradient: 'from-zinc-500 to-zinc-600' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-300', ring: 'ring-blue-500/20', gradient: 'from-blue-500 to-indigo-600' },
  green: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', ring: 'ring-emerald-500/20', gradient: 'from-emerald-500 to-green-600' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-300', ring: 'ring-purple-500/20', gradient: 'from-purple-500 to-fuchsia-600' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-300', ring: 'ring-orange-500/20', gradient: 'from-orange-500 to-red-500' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-300', ring: 'ring-teal-500/20', gradient: 'from-cyan-500 to-teal-600' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-300', ring: 'ring-amber-500/20', gradient: 'from-amber-500 to-orange-500' },
};

const trainingModules: TrainingModule[] = [
  {
    id: 'basics',
    title: 'Staff Portal Basics',
    description: 'Navigation and layout of the staff portal — header, sidebar, and dashboard.',
    icon: Home,
    tone: 'gray',
    route: '/dashboard',
    steps: [
      {
        stepNumber: 1,
        title: 'Click the logo to return home',
        description:
          'When you are logged in, clicking The Hut logo returns to the Dashboard. When logged out, the same logo returns to the staff portal home page.',
      },
      {
        stepNumber: 2,
        title: 'Use Sign Out to end the session',
        description:
          'Open the user menu in the top right and choose Sign Out to leave the staff portal and return to the login page.',
      },
      {
        stepNumber: 3,
        title: 'Use the left sidebar to move around',
        description:
          'The left sidebar lists the main staff functions. The highlighted item shows the page you are currently on.',
      },
      {
        stepNumber: 4,
        title: 'Each dashboard card opens a staff function',
        description:
          'The cards on the Dashboard take staff to Mark Attendance, Add New Participant, Add to Program, Find Participant, View Reports, Manage Programs and Staff Training.',
      },
    ],
  },
  {
    id: 'attendance',
    title: 'Mark Attendance',
    description: 'Record participant attendance for programs and activities.',
    icon: ClipboardCheck,
    tone: 'blue',
    route: '/attendance',
    steps: [
      {
        stepNumber: 1,
        title: "Today's date",
        description:
          "Confirm today's date at the top of the page before recording attendance.",
      },
      {
        stepNumber: 2,
        title: 'Select program and date',
        description:
          'Choose the program scheduled for today, then confirm or adjust the attendance date before continuing.',
      },
      {
        stepNumber: 3,
        title: 'Tick participants and save',
        description:
          'Tick each participant who attended, review the summary, and click Save Attendance to submit the record.',
      },
    ],
  },
  {
    id: 'add-participant',
    title: 'Add New Participant',
    description: 'Register a new participant to the system step by step.',
    icon: UserPlus,
    tone: 'green',
    route: '/add-participant-multistep',
    steps: [
      {
        stepNumber: '1.1',
        title: 'General info — Personal information',
        description:
          "Start with the participant's personal details. Complete name, email, phone, gender and date of birth before moving on.",
      },
      {
        stepNumber: '1.2',
        title: 'General info — Home and postal address',
        description:
          "Complete the participant's home address including township, post code and council region. If the postal address is different, add it in the postal address fields below.",
      },
      {
        stepNumber: '1.3',
        title: 'General info — Emergency details',
        description:
          'Record emergency contact details so staff know who to contact if support is needed during activities.',
      },
      {
        stepNumber: '1.4',
        title: 'General info — Cultural background',
        description:
          'Capture cultural background information — Aboriginal or Torres Strait Islander status, languages spoken, country of birth and cultural identity.',
      },
      {
        stepNumber: '1.5',
        title: 'General info — Other',
        description:
          'Review communication preferences, how the participant heard about The Hut, and the photo consent options.',
      },
      {
        stepNumber: '2.1',
        title: "Select programs — Children's programs",
        description:
          "In Step 2, review the Children's Programs area and select any youth or family programs the participant wants to join.",
      },
      {
        stepNumber: '2.2',
        title: 'Select programs — Fitness & wellbeing',
        description:
          'Review the Fitness & Wellbeing programs and choose any relevant health, exercise or wellbeing activities.',
      },
      {
        stepNumber: '2.3',
        title: 'Select programs — General programs',
        description:
          'Use the General Programs section for broader community activities and workshops outside the children or fitness categories.',
      },
      {
        stepNumber: 3,
        title: 'Program details',
        description:
          'Step 3 collects extra information for the chosen programs (such as child details or health information) before completing registration.',
      },
    ],
  },
  {
    id: 'add-to-program',
    title: 'Add to Program',
    description: 'Enroll an existing participant in a program.',
    icon: UserCheck,
    tone: 'purple',
    route: '/add-to-program',
    steps: [
      {
        stepNumber: 1,
        title: 'Search for a participant',
        description:
          'Use the search box to look up participants by name, email or phone number before choosing who to add.',
      },
      {
        stepNumber: 2,
        title: 'Review the participant list',
        description:
          'The participant list shows matching results. Click Select on the right side of a row to choose that participant.',
      },
      {
        stepNumber: 3,
        title: 'Choose program and add',
        description:
          "After selecting, the participant's basic information appears. Choose a program from Select Program and click Add to Program.",
      },
    ],
  },
  {
    id: 'search',
    title: 'Find Participant',
    description: 'Search and view participant information.',
    icon: Search,
    tone: 'orange',
    route: '/search',
    steps: [
      {
        stepNumber: '1.1',
        title: 'Search for participants',
        description: 'Use the search box to find participants by name, email or phone number.',
      },
      {
        stepNumber: '1.2',
        title: 'Review active participants',
        description:
          "Active Participants appear first. Each row shows the participant's basic information and includes a View Profile button.",
      },
      {
        stepNumber: '1.3',
        title: 'Expand inactive participants',
        description:
          'Use the Inactive Participants section to expand and review participants who are not currently enrolled. These rows also include a View Profile button.',
      },
      {
        stepNumber: '2.1',
        title: 'Profile — General info',
        description:
          'The participant profile shows the key information collected in Add New Participant Step 1 — contact, personal, emergency, cultural background, communication preferences and photo consent.',
      },
      {
        stepNumber: '2.2',
        title: 'Profile — Program-specific info',
        description:
          'Below the general details the page shows any program-specific registration information collected in Add New Participant Step 3.',
      },
      {
        stepNumber: '2.3',
        title: 'Profile — Enrolled programs',
        description:
          "The Enrolled Programs section lists the participant's current programs and basic enrolment details.",
      },
      {
        stepNumber: '2.4',
        title: 'Active profile actions',
        description:
          'For an active participant, staff can go Back to Search, Edit Details, Delete, Add to Program, or make the profile inactive.',
      },
      {
        stepNumber: '2.5',
        title: 'Inactive profile actions',
        description:
          'For an inactive participant, staff can go Back to Search, Edit Details, Delete, or reactivate by adding the participant back to a program.',
      },
    ],
  },
  {
    id: 'reports',
    title: 'View Reports',
    description: 'Generate analytics and export data.',
    icon: BarChart3,
    tone: 'teal',
    route: '/reports',
    steps: [
      {
        stepNumber: 1,
        title: 'Choose a reporting period',
        description:
          'Choose a reporting period — Weekly, Monthly, Quarterly, Annually or Custom Range — then confirm Start date and End date.',
      },
      {
        stepNumber: 2,
        title: 'Choose program filters',
        description:
          'Use Program category and Program to narrow the report to the relevant activities before reviewing the results.',
      },
      {
        stepNumber: 3,
        title: 'Choose participant filters',
        description:
          'Use Age group, Gender, ATSI status, CALD background, Council and Township to focus the report on the participant group you need.',
      },
      {
        stepNumber: 4,
        title: 'Preview the report',
        description:
          'Click Preview Report to generate the report on the page. Review the summary cards, charts and report table that follow.',
      },
      {
        stepNumber: 5,
        title: 'Export the report',
        description:
          'When the preview looks correct, click Export Report and choose CSV or PDF depending on the format you need.',
      },
    ],
  },
  {
    id: 'programs',
    title: 'Manage Programs',
    description: 'View, edit and assign staff to programs.',
    icon: FolderOpen,
    tone: 'amber',
    route: '/programs',
    steps: [
      {
        stepNumber: 1,
        title: 'Add a new program',
        description:
          'Click Add Program to open the Add New Program form. Enter program name, recurrence, days, start date, time and capacity, then click Add Program to create it.',
      },
      {
        stepNumber: 2,
        title: 'Programs are grouped by category',
        description:
          "Programs are displayed in three sections — Children's Programs, Fitness & Wellbeing Programs and General Programs — making the program list easier to browse.",
      },
      {
        stepNumber: 3,
        title: 'Edit or delete a program',
        description:
          'Each program card includes Edit and Delete buttons so staff can update program details or remove a program when needed.',
      },
      {
        stepNumber: 4,
        title: 'Manage staff for each program',
        description:
          'Use Manage Staff on a program card to choose which staff members are assigned to that program and confirm the selection.',
      },
    ],
  },
];

const PROGRESS_KEY = 'hut.training.progress.v1';

function loadProgress(): Record<string, number[]> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, number[]>) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* ignore quota errors */
  }
}

export default function Training() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Record<string, number[]>>({});
  const [activeModule, setActiveModule] = useState<TrainingModule | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const totalSteps = useMemo(
    () => trainingModules.reduce((s, m) => s + m.steps.length, 0),
    [],
  );
  const completedSteps = useMemo(
    () => Object.values(progress).reduce((s, arr) => s + arr.length, 0),
    [progress],
  );
  const overallPct = totalSteps === 0 ? 0 : (completedSteps / totalSteps) * 100;

  const markStepDone = (moduleId: string, idx: number) => {
    setProgress((prev) => {
      const current = new Set(prev[moduleId] ?? []);
      current.add(idx);
      const next = { ...prev, [moduleId]: Array.from(current).sort((a, b) => a - b) };
      saveProgress(next);
      return next;
    });
  };

  const resetModule = (moduleId: string) => {
    setProgress((prev) => {
      const next = { ...prev };
      delete next[moduleId];
      saveProgress(next);
      return next;
    });
  };

  const openModule = (m: TrainingModule) => {
    setActiveModule(m);
    setStepIndex(0);
  };

  const closeModal = () => setActiveModule(null);

  const goNext = () => {
    if (!activeModule) return;
    markStepDone(activeModule.id, stepIndex);
    if (stepIndex < activeModule.steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      closeModal();
    }
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const tryItNow = () => {
    if (!activeModule?.route) return;
    markStepDone(activeModule.id, stepIndex);
    closeModal();
    navigate(activeModule.route);
  };

  const currentStep = activeModule?.steps[stepIndex];
  const tone = activeModule ? toneStyles[activeModule.tone] : null;

  return (
    <Layout title="Staff Training" subtitle="Step-by-step walkthroughs of every staff function">
      {/* Overall progress */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#111113] p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">Your progress</h3>
          <span className="text-sm text-zinc-400">
            {completedSteps} / {totalSteps} steps
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {completedSteps === totalSteps
            ? 'All training complete — nice work!'
            : `${totalSteps - completedSteps} step${totalSteps - completedSteps === 1 ? '' : 's'} remaining`}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trainingModules.map((m) => {
          const Icon = m.icon;
          const t = toneStyles[m.tone];
          const done = progress[m.id]?.length ?? 0;
          const total = m.steps.length;
          const pct = total === 0 ? 0 : (done / total) * 100;
          const complete = done >= total;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => openModule(m)}
              className="group relative flex flex-col rounded-xl border border-zinc-800/80 bg-[#111113] p-4 text-left transition-colors hover:border-zinc-700 hover:bg-[#141416]"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${t.bg} ${t.ring}`}>
                  <Icon size={18} className={t.text} />
                </div>
                {complete && <CheckCircle2 size={18} className="text-emerald-400" />}
              </div>
              <h4 className="text-sm font-semibold text-zinc-100">{m.title}</h4>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{m.description}</p>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <PlayCircle size={11} /> {total} step{total === 1 ? '' : 's'}
                  </span>
                  <span>
                    {done} / {total}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${t.gradient} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Help */}
      <section className="mt-6 rounded-xl border border-zinc-800/80 bg-[#111113] p-5">
        <div className="mb-2 flex items-center gap-2">
          <HelpCircle size={15} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Need help?</h3>
        </div>
        <p className="text-xs text-zinc-500">
          Reach out to your supervisor or the IT support team if you get stuck.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <Mail size={12} /> support@thehut.org
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Phone size={12} /> (555) 123-4567
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} /> Mon–Fri 9:00–17:00
          </span>
        </div>
      </section>

      {/* Walkthrough modal */}
      {activeModule && currentStep && tone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#111113] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${tone.bg} ${tone.ring}`}>
                  <activeModule.icon size={17} className={tone.text} />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-zinc-100">
                    {activeModule.title}
                  </h3>
                  <p className="truncate text-xs text-zinc-500">
                    Step {stepIndex + 1} of {activeModule.steps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="flex-shrink-0 rounded-md p-1 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Step progress */}
            <div className="px-6 pt-4">
              <div className="h-1 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${tone.gradient} transition-all duration-300`}
                  style={{
                    width: `${((stepIndex + 1) / activeModule.steps.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-6">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${tone.bg} ${tone.text} ${tone.ring}`}>
                Step {currentStep.stepNumber}
              </div>
              <h4 className="mt-3 text-lg font-semibold text-zinc-100">
                {currentStep.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {currentStep.description}
              </p>

              {activeModule.route && (
                <button
                  onClick={tryItNow}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <ExternalLink size={13} /> Try it now
                </button>
              )}
            </div>

            {/* Step rail */}
            <div className="border-t border-zinc-800/80 px-6 py-3">
              <div className="flex flex-wrap gap-1.5">
                {activeModule.steps.map((s, i) => {
                  const isActive = i === stepIndex;
                  const isDone = (progress[activeModule.id] ?? []).includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setStepIndex(i)}
                      className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 text-[11px] font-medium transition-colors ${
                        isActive
                          ? `bg-gradient-to-r ${tone.gradient} text-white shadow`
                          : isDone
                            ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                      aria-label={`Go to step ${s.stepNumber}`}
                    >
                      {s.stepNumber}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-zinc-800/80 bg-[#0e0e10] px-6 py-3">
              <button
                onClick={() => resetModule(activeModule.id)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
              >
                <RotateCcw size={12} /> Reset module
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={goBack}
                  disabled={stepIndex === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={12} /> Back
                </button>
                <button
                  onClick={goNext}
                  className={`inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r ${tone.gradient} px-4 py-1.5 text-xs font-semibold text-white shadow-lg hover:brightness-110`}
                >
                  {stepIndex === activeModule.steps.length - 1 ? (
                    <>
                      Finish <CheckCircle2 size={12} />
                    </>
                  ) : (
                    <>
                      Next <ArrowRight size={12} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {completedSteps === totalSteps && completedSteps > 0 && (
        <div className="mt-6 rounded-xl border border-emerald-800/40 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <CheckCircle2 size={16} /> All modules complete
          </div>
          <p className="mt-1 text-xs text-emerald-200/70">
            You can revisit any module any time — your progress is saved on this device.
          </p>
        </div>
      )}
    </Layout>
  );
}
