import type { AppProps } from 'next/app';
import { AppProvider } from '@/contexts';
import '../styles/globals.css';

import { SessionProvider } from 'next-auth/react';

import GoogleOneTap from '@/components/GoogleOneTap';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <AppProvider initialData={pageProps}>
        <Component {...pageProps} />
        <GoogleOneTap />
      </AppProvider>
    </SessionProvider>
  );
}

export default MyApp;
