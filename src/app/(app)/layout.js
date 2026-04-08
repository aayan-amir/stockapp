import Sidebar from '@/components/Sidebar'
import AutoTasks from '@/components/AutoTasks'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE = 'sms_auth'
const PIN = process.env.ACCESS_PIN || '1234'

export default function AppLayout({ children }) {
  const token = cookies().get(COOKIE)?.value
  if (token !== PIN) redirect('/login')

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
