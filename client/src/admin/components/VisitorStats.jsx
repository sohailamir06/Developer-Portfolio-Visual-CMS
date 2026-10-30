import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Download, Eye, FileText, Minus, Table2 } from 'lucide-react';
import { adminApi } from '../../services/api.js';
import { useAsync } from '../../utils/hooks.js';
import { cx } from '../../utils/links.js';
import { Card, ErrorBox, Spinner } from './ui.jsx';
import HelpTip from './HelpTip.jsx';

const RANGES = [
  [7, '7 days'],
  [30, '30 days'],
  [90, '90 days'],
];

const fmtDay = (iso, opts = { day: 'numeric', month: 'short' }) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' });
const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));

/** Rounded "nice" axis maximum so gridlines land on clean numbers. */
function niceMax(v) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow * 4 >= v) * pow;
  return step * 4;
}

function Delta({ now, before, days }) {
  if (!before && !now) return <p className="mt-1 text-xs text-slate-500">No visits yet</p>;
  if (!before) return <p className="mt-1 text-xs text-slate-500">None in the previous {days} days</p>;
  const pct = Math.round(((now - before) / before) * 100);
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  return (
    <p className={cx('mt-1 inline-flex items-center gap-1 text-xs font-medium', pct > 0 ? 'text-emerald-700' : pct < 0 ? 'text-red-700' : 'text-slate-500')}>
      <Icon size={13} aria-hidden="true" />
      {pct > 0 ? '+' : ''}
      {pct}% <span className="font-normal text-slate-500">vs previous {days} days</span>
    </p>
  );
}

function StatTile({ icon: Icon, label, value, children }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon size={14} aria-hidden="true" /> {label}
      </p>
      <p className="mt-1.5 truncate text-2xl font-semibold text-slate-900">{value}</p>
      {children}
    </div>
  );
}

/** Single-series column chart: daily page views. Each column is focusable and shows its value. */
function ViewsChart({ series }) {
  const [active, setActive] = useState(null);
  const max = niceMax(Math.max(...series.map((d) => d.views), 0));
  const ticks = [max, max / 2, 0];
  const labelEvery = series.length > 31 ? 15 : series.length > 10 ? 5 : 1;

  return (
    <div className="relative">
      <div className="flex gap-2">
        {/* Y axis */}
        <div className="flex h-40 flex-col justify-between py-0 text-right text-[10px] tabular-nums text-slate-400" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
              {compact(t)}
            </span>
          ))}
        </div>
        <div className="relative h-40 flex-1">
          {/* Hairline gridlines */}
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-slate-100" style={{ bottom: `${(t / max) * 100}%` }} aria-hidden="true" />
          ))}
          <ul className="absolute inset-0 flex items-end gap-[2px]" aria-label="Page views per day">
            {series.map((d, i) => (
              <li key={d.date} className="flex h-full flex-1 items-end justify-center">
                <button
                  type="button"
                  className="group flex h-full w-full items-end justify-center focus:outline-none"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={`${fmtDay(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}: ${d.views} page view${d.views === 1 ? '' : 's'}, ${d.resumeDownloads} CV download${d.resumeDownloads === 1 ? '' : 's'}`}
                >
                  <span
                    className={cx(
                      'block w-full max-w-[24px] rounded-t-[4px] transition-colors',
                      d.views ? 'bg-blue-600' : 'bg-transparent',
                      active === i && 'bg-blue-500 ring-2 ring-blue-200',
                      'group-focus-visible:ring-2 group-focus-visible:ring-blue-400',
                    )}
                    style={{ height: d.views ? `max(2px, ${(d.views / max) * 100}%)` : '100%' }}
                  />
                </button>
              </li>
            ))}
          </ul>
          {active !== null && (
            <div
              role="status"
              className={cx(
                'pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg',
                // Keep the tooltip inside the card near the edges.
                active / series.length > 0.8 ? '-translate-x-full' : active / series.length < 0.2 ? '' : '-translate-x-1/2',
              )}
              style={{ left: `${((active + (active / series.length > 0.8 ? 1 : active / series.length < 0.2 ? 0 : 0.5)) / series.length) * 100}%` }}
            >
              <span className="block font-semibold">
                {series[active].views} view{series[active].views === 1 ? '' : 's'}
                {series[active].resumeDownloads > 0 && ` · ${series[active].resumeDownloads} CV`}
              </span>
              <span className="block text-slate-300">{fmtDay(series[active].date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
          )}
        </div>
      </div>
      {/* X axis labels */}
      <div className="ml-8 mt-1.5 flex gap-[2px] text-[10px] text-slate-400" aria-hidden="true">
        {series.map((d, i) => (
          <span key={d.date} className="flex-1 overflow-visible whitespace-nowrap text-center">
            {i % labelEvery === 0 || i === series.length - 1 ? fmtDay(d.date) : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function VisitorStats() {
  const [days, setDays] = useState(30);
  const [asTable, setAsTable] = useState(false);
  const { data, loading, error, reload } = useAsync(() => adminApi.analytics(days), [days]);
  const top = data?.topPages?.[0];
  const activeDays = useMemo(() => (data?.series || []).filter((d) => d.views).length, [data]);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center text-sm font-semibold">
            Who is looking at your portfolio
            <HelpTip label="About visitor statistics">
              Counts page views and CV downloads only — no cookies or personal data. Search-engine bots, visitors who ask not to be tracked, and your own visits while signed in are not counted.
            </HelpTip>
          </h2>
          <p className="text-xs text-slate-500">Page views and CV downloads, per day</p>
        </div>
        <div role="group" aria-label="Date range" className="flex rounded-lg bg-slate-100 p-0.5">
          {RANGES.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={days === value}
              onClick={() => setDays(value)}
              className={cx('rounded-md px-2.5 py-1 text-xs font-medium transition', days === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5 p-5">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data ? (
          <Spinner label="Loading visitor statistics…" />
        ) : (
          data && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatTile icon={Eye} label="Page views" value={data.totals.views.toLocaleString()}>
                  <Delta now={data.totals.views} before={data.previous.views} days={days} />
                </StatTile>
                <StatTile icon={Download} label="CV downloads" value={data.totals.resumeDownloads.toLocaleString()}>
                  <Delta now={data.totals.resumeDownloads} before={data.previous.resumeDownloads} days={days} />
                </StatTile>
                <StatTile icon={FileText} label="Most visited page" value={top ? top.path : '—'}>
                  <p className="mt-1 text-xs text-slate-500">{top ? `${top.views} view${top.views === 1 ? '' : 's'} · visits on ${activeDays} of ${days} days` : 'No visits yet'}</p>
                </StatTile>
              </div>

              {data.totals.views === 0 ? (
                <p className="rounded-lg border-2 border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No visits in this period yet. Share your portfolio link on LinkedIn, your CV and job applications — visits will appear here.
                </p>
              ) : asTable ? (
                <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Date</th>
                        <th className="px-3 py-2 text-right font-semibold">Page views</th>
                        <th className="px-3 py-2 text-right font-semibold">CV downloads</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 tabular-nums">
                      {[...data.series].reverse().map((d) => (
                        <tr key={d.date}>
                          <td className="px-3 py-1.5">{fmtDay(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                          <td className="px-3 py-1.5 text-right">{d.views}</td>
                          <td className="px-3 py-1.5 text-right">{d.resumeDownloads}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ViewsChart series={data.series} />
              )}

              <div className="flex flex-wrap items-start justify-between gap-4">
                {data.topPages.length > 0 && (
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-2 text-xs font-semibold text-slate-700">Most visited pages</h3>
                    <ul className="space-y-1.5">
                      {data.topPages.map((p) => (
                        <li key={p.path} className="flex items-center gap-3 text-sm">
                          <span className="w-40 truncate text-slate-700 sm:w-56">{p.path}</span>
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                            <span className="block h-full rounded-full bg-blue-600" style={{ width: `${(p.views / data.topPages[0].views) * 100}%` }} />
                          </span>
                          <span className="w-10 text-right tabular-nums text-slate-500">{p.views}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.totals.views > 0 && (
                  <button type="button" onClick={() => setAsTable((t) => !t)} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:underline" aria-pressed={asTable}>
                    <Table2 size={14} /> {asTable ? 'Show as chart' : 'Show as table'}
                  </button>
                )}
              </div>
            </>
          )
        )}
      </div>
    </Card>
  );
}
