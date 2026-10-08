interface NavbarProps {
  showNew: boolean
  onNew: () => void
}

export default function Navbar({ showNew, onNew }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight">YouTube AI Analyzer</span>
        </div>

        {showNew && (
          <button
            type="button"
            onClick={onNew}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            New
          </button>
        )}
      </div>
    </header>
  )
}