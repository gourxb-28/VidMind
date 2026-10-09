import type { KeyboardEvent } from 'react'

export type TabId = 'notes' | 'chat'

const TABS: { id: TabId; label: string }[] = [
  { id: 'notes', label: 'AI Notes' },
  { id: 'chat', label: 'AI Chat' },
]

interface TabsProps {
  active: TabId
  onChange: (tab: TabId) => void
}

export default function Tabs({ active, onChange }: TabsProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const next: TabId = active === 'notes' ? 'chat' : 'notes'
    onChange(next)
    document.getElementById(`tab-${next}`)?.focus()
  }

  return (
    <div role="tablist" aria-label="AI tools" className="flex gap-1 rounded-xl bg-black/30 p-1">
      {TABS.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={handleKeyDown}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-indigo-400 ${
              selected
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}