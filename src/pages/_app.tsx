// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/reactQueryClient'
import Script from 'next/script'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/qz-tray/qz-tray.js"
        strategy="beforeInteractive"
      />
      <Component {...pageProps} />
    </>
    </QueryClientProvider>
  )
}
