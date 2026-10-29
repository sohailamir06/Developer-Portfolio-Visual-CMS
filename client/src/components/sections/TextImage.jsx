import { CmsButton } from '../common/CmsButton.jsx';
import { CmsImage } from '../common/CmsImage.jsx';
import { RichText } from '../common/RichText.jsx';
import { SectionFrame, SectionHeader } from './SectionFrame.jsx';
import { cx } from '../../utils/links.js';

export default function TextImage({ section }) {
  const d = section.data;
  const hasImage = Boolean(d.image?.url) || section._editing;
  return (
    <SectionFrame section={section} label={d.heading || undefined}>
      <div className={cx('grid items-center gap-12', hasImage && 'lg:grid-cols-2')}>
        <div className={cx(hasImage && d.imagePosition === 'left' && 'lg:order-2')}>
          <SectionHeader data={d} className="!mb-6" />
          <RichText html={d.body} field="body" />
          <div className="mt-8">
            <CmsButton button={d.button} field="button" />
          </div>
        </div>
        {hasImage && <CmsImage image={d.image} field="image" width={900} aspect="4 / 3" className="ring-1 ring-line" />}
      </div>
    </SectionFrame>
  );
}
