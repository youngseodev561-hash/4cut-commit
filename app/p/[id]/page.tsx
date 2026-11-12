import { notFound } from 'next/navigation';
import { getMeta, retentionDays } from '@/lib/storage';
import ShareButtons from './ShareButtons';

export const dynamic = 'force-dynamic';

export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getMeta(id);
  if (!meta) notFound();

  return (
    <div className="m-page">
      <header className="m-head">
        <span className="brand">
          <img src="/brand/logo-black.png" alt="" width={26} height={27} style={{ verticalAlign: -7, marginRight: 8 }} />
          4CUT.COMMIT
        </span>
        <span className="muted">{id.slice(0, 7)}</span>
      </header>
      <main className="m-main">
        <div>
          <div className="prompt" style={{ fontSize: 12 }}>&gt; git pull memory</div>
          <h1 className="h1" style={{ fontSize: 28 }}>네컷이 도착했어요</h1>
        </div>
        <ShareButtons id={id} url={meta.url} downloadUrl={meta.downloadUrl} assets={meta.assets} />
      </main>
      <footer className="m-foot">
        <span>컴퓨터소프트웨어과 졸업작품전</span>
        <span>사진은 {retentionDays}일 후 자동 삭제돼요. 지금 저장해 주세요.</span>
      </footer>
    </div>
  );
}
