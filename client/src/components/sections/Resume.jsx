import { FileText } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { CmsButton } from '../common/CmsButton.jsx';
import { RichText } from '../common/RichText.jsx';
import { SectionFrame, SectionHeader } from './SectionFrame.jsx';

export default function Resume({ section }) {
  const d = section.data;
  const { settings } = useSite();
  const url = d.downloadButton?.url || settings?.resume?.url || '';
  const isPdf = /\.pdf($|\?)/i.test(url) || url.includes('/raw/upload/');

  return (
    <SectionFrame section={section} label={d.heading || 'Résumé'}>
      <SectionHeader data={d} className="!mb-6" />
      <RichText html={d.body} field="body" className="max-w-2xl" />
      <div className="mt-8 flex flex-wrap gap-3">
        <CmsButton button={{ ...d.downloadButton, newTab: true }} field="downloadButton" fallbackUrl={settings?.resume?.url} icon />
      </div>
      {!url && (
        <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted">
          <FileText size={16} aria-hidden="true" /> A downloadable résumé has not been published yet.
        </p>
      )}
      {d.showEmbed && url && isPdf && (
        <div className="card mt-10 overflow-hidden">
          <iframe src={url} title="Résumé preview" className="h-[75vh] min-h-[480px] w-full bg-white" loading="lazy" />
        </div>
      )}
    </SectionFrame>
  );
}
