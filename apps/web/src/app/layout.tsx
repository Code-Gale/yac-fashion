import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import Script from 'next/script';
import '../styles/globals.css';
import { Providers } from '@/components/providers/Providers';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { WhatsAppButton } from '@/components/shared/WhatsAppButton';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'YAC Fashion House | Premium Fashion',
  description: 'Shop premium fashion at YAC Fashion House. Free delivery available.',
  openGraph: {
    type: 'website',
    siteName: 'YAC Fashion House',
    images: ['/og-default.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-body antialiased">
        {GTM_ID ? (
          <>
            <Script id="gtm" strategy="afterInteractive">
              {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
            </Script>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
                title="GTM"
              />
            </noscript>
          </>
        ) : (
          <>
            {GA4_ID && (
              <>
                <Script
                  src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
                  strategy="afterInteractive"
                />
                <Script id="ga4" strategy="afterInteractive">
                  {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4_ID}');`}
                </Script>
              </>
            )}
            {FB_PIXEL_ID && (
              <Script id="fb-pixel" strategy="afterInteractive">
                {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${FB_PIXEL_ID}');fbq('track','PageView');`}
              </Script>
            )}
            {TIKTOK_PIXEL_ID && (
              <Script id="tiktok-pixel" strategy="afterInteractive">
                {`!function(w,d,t){var n=d.getElementsByTagName("script")[0],s=d.createElement("script");s.type="text/javascript";s.async=true;s.src="https://analytics.tiktok.com/i18n/pixel/static/sdk.js";n.parentNode.insertBefore(s,n);s.onload=function(){ttq.load('${TIKTOK_PIXEL_ID}');ttq.page();}(w,d,t);}(window,document);`}
              </Script>
            )}
          </>
        )}
        <Providers>
          <AnalyticsProvider>{children}</AnalyticsProvider>
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
