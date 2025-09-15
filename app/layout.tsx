import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CRM-Bisneando ',
  description: 'Pagina para administrar productos, ordenes y usarios',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en">

      <body >{children}</body>
    </html>
  )
}
