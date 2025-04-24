import "./globals.css"

export const metadata = {
  title: "Veronica",
  description: "Personal Assistant to help with daily life.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-precomposed.png" />

      </head>
      <body className="dark:bg-stone-950 bg-stone-50 dark:text-stone-100">
        {children}
      </body>
    </html>
  )
}