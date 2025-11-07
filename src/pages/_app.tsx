// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Script from 'next/script'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/qz-tray/qz-tray.js"
        strategy="beforeInteractive"
      />
      <Component {...pageProps} />
    </>
  )
}
