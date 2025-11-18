import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MathFlow - 수포자를 위한 중독형 수학 앱',
  description: '게임처럼 재미있는 수학 학습 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  )
}
