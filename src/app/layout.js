import './globals.css'

export const metadata = {
  title: 'Stock Management System',
  description: 'Inventory · Purchases · Sales',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
