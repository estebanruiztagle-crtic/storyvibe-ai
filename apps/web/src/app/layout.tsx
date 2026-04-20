import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ThemeProvider from '@/components/ThemeProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StoryVibe AI',
  description: 'Tablero de diseño de presentaciones con IA',
}

// Runs before React hydrates — prevents flash of wrong theme
const themeScript = `(function(){try{var t=localStorage.getItem('sv-theme');var v=t==='light'?'light':'dark';document.documentElement.setAttribute('data-theme',v);document.documentElement.classList.add(v);}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
