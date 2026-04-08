export default function LoadingSpinner({ text = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-16 gap-3 text-accent-dim text-sm">
      <span className="animate-spin text-xl">◌</span>
      {text}
    </div>
  )
}
