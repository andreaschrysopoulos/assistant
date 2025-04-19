import "./globals.css"

export const metadata = {
  title: "Veronica",
  description: "Personal Assistant to help with daily life.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="dark:bg-stone-950 bg-stone-100 dark:text-stone-100">
        {children}
      </body>
    </html>
  )
}