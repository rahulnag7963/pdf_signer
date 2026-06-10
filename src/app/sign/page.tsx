import type { Metadata } from 'next';
import { Editor } from '@/components/Editor';

export const metadata: Metadata = { title: 'InkPress — Editor' };

export default function SignPage() {
  return <Editor />;
}
