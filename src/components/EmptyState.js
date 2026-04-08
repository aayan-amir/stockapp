export default function EmptyState({ icon = '◈', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4 text-slate-500">{icon}</div>
      <h3 className="text-slate-600 font-semibold mb-1">{title}</h3>
      {message && <p className="text-slate-500 text-sm mb-4">{message}</p>}
      {action}
    </div>
  )
}
