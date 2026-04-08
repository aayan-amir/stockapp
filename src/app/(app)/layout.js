import Sidebar from '@/components/Sidebar'
import AutoTasks from '@/components/AutoTasks'

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-8 min-h-screen">
        {children}
      </main>
      <AutoTasks />
    </div>
  )
}
