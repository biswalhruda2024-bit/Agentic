import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TaskFlow',
  description: 'Track tasks, timelines, deadlines and progress.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
