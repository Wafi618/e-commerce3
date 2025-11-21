import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Script from 'next/script';

const GoogleOneTap = () => {
    const { data: session, status } = useSession();
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        if (status === 'loading' || session || !scriptLoaded) return;

        const initializeGoogleOneTap = () => {
            if (!window.google) return;

            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
                callback: async (response: any) => {
                    if (response.credential) {
                        // Set a short-lived cookie to identify One Tap login
                        document.cookie = "auth-method=one-tap; path=/; max-age=60";

                        await signIn('credentials', {
                            googleIdToken: response.credential,
                            redirect: false,
                        });
                        // Refresh page or redirect handled by session change
                        window.location.reload();
                    }
                },
                auto_select: true, // Optional: automatically sign in if only one account
                cancel_on_tap_outside: false,
            });

            window.google.accounts.id.prompt((notification: any) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    console.log('One Tap skipped or not displayed:', notification.getNotDisplayedReason());
                }
            });
        };

        initializeGoogleOneTap();
    }, [status, session, scriptLoaded]);

    return (
        <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
            onLoad={() => setScriptLoaded(true)}
        />
    );
};

export default GoogleOneTap;
