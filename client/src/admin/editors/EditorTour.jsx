import { useState } from 'react';
import { Eye, History, Layers, MousePointerClick, PanelRight, Rocket, ShieldCheck } from 'lucide-react';
import { Button, Modal } from '../components/ui.jsx';
import { cx } from '../../utils/links.js';

const TOUR_KEY = 'pf-editor-tour-done'; // per-browser: has this person seen the tour?

export function hasSeenTour() {
  try {
    return localStorage.getItem(TOUR_KEY) === '1';
  } catch {
    return true; // storage blocked: don't nag on every visit
  }
}

function markSeen() {
  try {
    localStorage.setItem(TOUR_KEY, '1');
  } catch {
    /* ignore */
  }
}

const STEPS = [
  {
    icon: ShieldCheck,
    title: 'Welcome to the page editor',
    body: 'Change your website here without any code. Don’t worry about breaking anything: visitors only see your changes after you click Publish.',
  },
  {
    icon: MousePointerClick,
    title: 'Click anything to change it',
    body: 'The middle area shows your real page. Click any heading, text, picture or button in it, and its settings open on the right. Use Desktop / Tablet / Mobile at the top to check how it looks on each screen.',
  },
  {
    icon: Layers,
    title: 'Sections: the building blocks',
    body: 'A page is a stack of sections (intro banner, about me, projects…). On the left you can add a section, drag ⋮⋮ to move one up or down, hide it with the eye icon, copy it, or delete it.',
  },
  {
    icon: PanelRight,
    title: 'Change the details on the right',
    body: 'Type your text, choose or upload pictures, and set where buttons go. “Content” is what it says; “Design” is how it looks. Less common settings are under “More options”.',
  },
  {
    icon: Rocket,
    title: 'Save, preview, publish',
    body: 'Your work is saved automatically as a draft. Click Preview to see the draft in a new tab, and Publish when you are happy. Made a mistake? Use Undo, or History to bring back any earlier published version.',
  },
];

export default function EditorTour({ open, onClose }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const finish = () => {
    markSeen();
    setStep(0);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={finish}
      title={`Quick tour · ${step + 1} of ${STEPS.length}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={finish} className="mr-auto">
            Skip tour
          </Button>
          {step > 0 && <Button onClick={() => setStep((n) => n - 1)}>Back</Button>}
          <Button variant="primary" onClick={() => (last ? finish() : setStep((n) => n + 1))}>
            {last ? 'Start editing' : 'Next'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <s.icon size={28} />
        </span>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
        <div className="mt-5 flex gap-1.5" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={cx('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-300')} />
          ))}
        </div>
        {last && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
            <Eye size={13} /> <History size={13} /> You can reopen this tour any time with the ? button.
          </p>
        )}
      </div>
    </Modal>
  );
}
