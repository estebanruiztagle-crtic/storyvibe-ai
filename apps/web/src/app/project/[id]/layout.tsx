'use client'

import WizardShell from '@/components/wizard/WizardShell'
import { useParams } from 'next/navigation'

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { id } = useParams<{ id: string }>()

  return <WizardShell projectId={id}>{children}</WizardShell>
}
