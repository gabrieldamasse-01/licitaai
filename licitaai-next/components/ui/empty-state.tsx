interface EmptyStateProps {
  icon: "search" | "document" | "opportunity" | "proposal"
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

function SearchIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="39.5" y1="39.5" x2="52" y2="52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="22" y1="28" x2="34" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="28" y1="22" x2="28" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <circle cx="14" cy="10" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="50" cy="20" r="1" fill="currentColor" opacity="0.2" />
      <circle cx="8" cy="44" r="1" fill="currentColor" opacity="0.2" />
    </svg>
  )
}

function DocumentIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 8h24l12 12v36H16V8z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M40 8v12h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="24" y1="28" x2="44" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="24" y1="36" x2="44" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="24" y1="44" x2="36" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  )
}

function OpportunityIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <circle cx="32" cy="32" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <circle cx="32" cy="32" r="2" fill="currentColor" />
      <line x1="32" y1="4" x2="32" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="32" y1="54" x2="32" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="4" y1="32" x2="10" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="54" y1="32" x2="60" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

function ProposalIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 6h28l10 10v44H14V6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M42 6v10h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="22" y1="26" x2="42" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="22" y1="34" x2="42" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="22" y1="42" x2="34" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M38 48l2.5 2.5L46 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  )
}

const illustrations = {
  search: SearchIllustration,
  document: DocumentIllustration,
  opportunity: OpportunityIllustration,
  proposal: ProposalIllustration,
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const Illustration = illustrations[icon]

  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
      <div className="text-slate-600 mb-4">
        <Illustration />
      </div>
      <p className="text-sm font-semibold text-slate-300 mb-1">{title}</p>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium px-4 py-2 hover:bg-blue-600/30 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
