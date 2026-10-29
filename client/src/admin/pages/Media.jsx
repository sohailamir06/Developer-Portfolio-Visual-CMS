import MediaLibrary from '../components/MediaLibrary.jsx';
import { PageHeader } from '../components/ui.jsx';

export default function Media() {
  return (
    <>
      <PageHeader title="Media Library" description="Upload, describe and manage the images and documents used on your site." />
      <MediaLibrary mode="manage" type="all" />
    </>
  );
}
