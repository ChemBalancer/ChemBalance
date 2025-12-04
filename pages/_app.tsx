// pages/_app.tsx
import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import Script from "next/script";
import '../styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <>
      {/* Google Analytics (GA4) */}
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-P6LGQ98G71"
      />

      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-P6LGQ98G71');
        `}
      </Script>

      <Component {...pageProps} />
    </>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
