import './globals.css'

export const metadata = {
  title: 'Stock Management System',
  description: 'Inventory and stock management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
