'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { useStore } from '@/lib/store';

export default function Dashboard() {
  const { current } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!current) router.replace('/');
  }, [current, router]);

  if (!current) return null;
  return <WorkspaceShell current={current} />;
}
