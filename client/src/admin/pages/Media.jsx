import MediaLibrary from '../components/MediaLibrary.jsx';
import { PageHeader } from '../components/ui.jsx';

export default function Media() {
  return (
    <>
      <PageHeader title="Pictures & files" description="Upload pictures and PDFs once, then use them anywhere on your site. Drag files onto this page to upload." />
      <MediaLibrary mode="manage" type="all" />
    </>
  );
}
