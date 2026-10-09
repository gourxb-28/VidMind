import { useState } from 'react'
import Notes from './Notes'
import Tabs, { type TabId } from './Tabs'

interface AssistantPanelProps {
  sessionId: string
  onSeek: (seconds: number) => void
  className?: string
}

export default function AssistantPanel({ sessionId, onSeek, className = '' }: AssistantPanelProps) {
  const [tab, setTab] = useState<TabId>('notes')

  return (
    <section
      className={`flex min-h-96 flex-col rounded-2xl border border-white/10 bg-white/5 ${className}`}
    >
      <div className="border-b border-white/10 p-2">
        <Tabs active={tab} onChange={setTab} />
      </div>

      <div
        role="tabpanel"
        id="panel-notes"
        aria-labelledby="tab-notes"
        hidden={tab !== 'notes'}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <Notes sessionId={sessionId} onSeek={onSeek} />
      </div>

      <div
        role="tabpanel"
        id="panel-chat"
        aria-labelledby="tab-chat"
        hidden={tab !== 'chat'}
        className="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-sm text-zinc-500"
      >
        AI Chat arrives in Phase 16.
      </div>
    </section>
  )
}