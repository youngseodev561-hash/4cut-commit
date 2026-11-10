import type { Metadata } from 'next';
import AdminApp from '@/components/guestbook/AdminApp';
import '../g/write.css';

export const metadata: Metadata = { title: '방명록 관리', robots: { index: false, follow: false } };

export default function Page() {
  return <AdminApp />;
}
