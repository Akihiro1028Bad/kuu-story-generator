import type { Metadata } from 'next'
import './globals.css'
import { ClientErrorReporter } from './components/ClientErrorReporter'

export const metadata: Metadata = {
  title: 'kuu-story-generator',
  description: 'くぅーストーリージェネレーター',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" data-theme="glass">
      <body className="font-sans antialiased">
        <ClientErrorReporter />
        {children}
      </body>
    </html>
  )
}
