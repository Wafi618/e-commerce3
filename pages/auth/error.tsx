import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AuthError() {
    const router = useRouter();
    const { error } = router.query;
    const [errorMessage, setErrorMessage] = useState('An error occurred during authentication');

    useEffect(() => {
        if (error) {
            switch (error) {
                case 'OAuthCallback':
                    setErrorMessage('There was a problem with the login service. Please try again.');
                    break;
                case 'OAuthSignin':
                    setErrorMessage('Error starting the login process.');
                    break;
                case 'OAuthAccountNotLinked':
                    setErrorMessage('This email is already associated with another account. Please sign in with your original account.');
                    break;
                case 'Callback':
                    setErrorMessage('Error during the login callback.');
                    break;
                case 'OAuthCreateAccount':
                    setErrorMessage('Could not create OAuth account.');
                    break;
                case 'EmailCreateAccount':
                    setErrorMessage('Could not create email account.');
                    break;
                case 'Callback':
                    setErrorMessage('Error during the login callback.');
                    break;
                case 'OAuthAccountNotLinked':
                    setErrorMessage('To confirm your identity, sign in with the same account you used originally.');
                    break;
                case 'EmailSignin':
                    setErrorMessage('Check your email address.');
                    break;
                case 'CredentialsSignin':
                    setErrorMessage('Sign in failed. Check the details you provided are correct.');
                    break;
                default:
                    setErrorMessage('An unknown error occurred.');
            }
        }
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Authentication Error
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {errorMessage}
                    </p>
                </div>
                <div className="mt-8 space-y-4">
                    <Link
                        href="/"
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Return to Home
                    </Link>
                    <Link
                        href="/?login=true"
                        className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Try Again
                    </Link>
                </div>
            </div>
        </div>
    );
}
