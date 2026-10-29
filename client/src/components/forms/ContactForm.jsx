import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { publicApi, toApiError } from '../../services/api.js';
import { useEditing } from '../../context/EditContext.jsx';

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' };

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Please enter your name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Please enter a valid email address';
  if (v.message.trim().length < 10) e.message = 'Message must be at least 10 characters';
  return e;
}

export default function ContactForm({ submitLabel = 'Send Message', successMessage }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [formError, setFormError] = useState('');
  const editing = useEditing();

  const update = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (editing) return; // never send from the editor preview
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setStatus('sending');
    setFormError('');
    try {
      await publicApi.contact(values);
      setStatus('sent');
      setValues(EMPTY);
    } catch (err) {
      const apiErr = toApiError(err);
      const fieldErrors = Object.fromEntries(apiErr.details.map((d) => [d.path, d.message]));
      setErrors(fieldErrors);
      setFormError(apiErr.message === 'Validation failed' ? 'Please fix the highlighted fields.' : apiErr.message);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
        <CheckCircle2 size={40} className="text-accent" aria-hidden="true" />
        <p className="max-w-sm text-base">{successMessage || 'Thanks! Your message has been sent.'}</p>
        <button type="button" className="btn btn-outline" onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    );
  }

  const field = (name, label, props = {}) => (
    <div>
      <label htmlFor={`cf-${name}`} className="mb-1.5 block text-sm font-medium">
        {label}
        {props.required && <span className="text-primary"> *</span>}
      </label>
      {props.as === 'textarea' ? (
        <textarea id={`cf-${name}`} rows={6} className="input resize-y" value={values[name]} onChange={update(name)} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `cf-${name}-err` : undefined} maxLength={5000} required={props.required} />
      ) : (
        <input id={`cf-${name}`} type={props.type || 'text'} className="input" value={values[name]} onChange={update(name)} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `cf-${name}-err` : undefined} autoComplete={props.autoComplete} maxLength={props.maxLength || 200} required={props.required} />
      )}
      {errors[name] && (
        <p id={`cf-${name}-err`} className="mt-1.5 text-xs text-red-400">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6 text-left sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {field('name', 'Name', { required: true, autoComplete: 'name', maxLength: 120 })}
        {field('email', 'Email', { required: true, type: 'email', autoComplete: 'email', maxLength: 254 })}
      </div>
      {field('subject', 'Subject')}
      {field('message', 'Message', { as: 'textarea', required: true })}
      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={update('website')} />
      </div>
      {formError && (
        <p role="alert" className="rounded-theme border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {formError}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={status === 'sending'}>
        {status === 'sending' ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
        {status === 'sending' ? 'Sending…' : submitLabel}
      </button>
    </form>
  );
}
