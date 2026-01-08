import './globals.css'

export const metadata = {
  title: 'AI Book Translator MVP',
  description: 'Translate PDFs preserving structure',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}