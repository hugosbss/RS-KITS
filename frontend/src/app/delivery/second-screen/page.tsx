import type { Metadata } from 'next';
import { SecondScreen } from '@/components/delivery/second-screen';

export default function SecondScreenPage() {
  return <SecondScreen />;
}

export const metadata: Metadata = { title: 'Conferencia do atleta' };
