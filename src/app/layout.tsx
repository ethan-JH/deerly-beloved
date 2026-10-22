import type { Metadata } from 'next'
import { VT323, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Crispometer } from '@/components/Crispometer'

const vt323 = VT323({
  variable: '--font-vt323',
  subsets: ['latin'],
  weight: '400',
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Bechan & Ethan — 12 June 2027',
  description: 'Join us to celebrate our wedding at Deer Park Country House, Devon.',
  icons: { icon: '/icons/home.png' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${vt323.variable} ${playfair.variable} h-full`}>
      <head>
        {/* Shave the handshake off the Travel window's embedded map */}
        <link rel="preconnect" href="https://maps.google.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="h-full font-[family-name:var(--font-vt323)]">
        {/* SVG filter definitions — grain texture for Playfair text */}
        <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
          <defs>
            <filter id="grain" x="-5%" y="-5%" width="110%" height="110%">
              {/* Noise source — used for both edge displacement and surface grain */}
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" seed="2" stitchTiles="stitch" result="noise" />
              {/* Edge roughness: displaces letter outlines based on noise */}
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.00" xChannelSelector="R" yChannelSelector="G" result="displaced" />
              {/* Surface grain: clips noise to letter faces, blends softly */}
              <feColorMatrix in="noise" type="saturate" values="0" result="grayNoise" />
              <feComposite operator="in" in="grayNoise" in2="displaced" result="maskedGrain" />
              <feBlend in="displaced" in2="maskedGrain" mode="soft-light" />
            </filter>
          </defs>
        </svg>
        {children}
        {process.env.NODE_ENV === 'development' && <Crispometer />}
      </body>
    </html>
  )
}
