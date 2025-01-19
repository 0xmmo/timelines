import { corben } from './fonts'
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <title>Wiki2Timeline</title>
      <body className={`${corben.variable} font-sans`}>{children}</body>
    </html>
  )
}

