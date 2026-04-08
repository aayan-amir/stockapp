import Sidebar from '@/components/Sidebar'
import AutoTasks from '@/components/AutoTasks'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE = 'sms_auth'
const PIN = process.env.ACCESS_PIN || '1234'

export default async function AppLayout({ children }) {
  const token = (await cookies()).get(COOKIE)?.value
  if (token !== PIN) redirect('/login')

  return (
    <div className="flex min-h-screen bg-[#0f1115]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-8 min-h-screen">
        {children}
      </main>
      <AutoTasks />
    </div>
  )
}
