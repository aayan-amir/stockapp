export default function LoadingSpinner({ text = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-16 gap-3 text-accent/40 text-sm">
      <span className="animate-spin text-xl">◌</span>
      {text}
    </div>
  )
}
