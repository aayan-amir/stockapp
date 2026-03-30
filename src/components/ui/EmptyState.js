export default function EmptyState({ icon = '◈', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4 text-white/10">{icon}</div>
      <h3 className="text-white/40 font-semibold mb-1">{title}</h3>
      {message && <p className="text-white/20 text-sm mb-4">{message}</p>}
      {action}
    </div>
  )
}
