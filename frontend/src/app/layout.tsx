import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@xyflow/react/dist/style.css';
import { AuthProvider } from '../context/AuthContext';
import Providers from '../components/Providers';
import { KEYWORD, SITE_DESCRIPTION, SITE_TITLE, SITE_URL, THUMBNAIL } from 'src/constants/metadata';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    keywords: KEYWORD,
    publisher: 'Quyền Lê Đình',
    robots: {
        follow: true,
        index: true,
        googleBot: {
            index: true,
            follow: true,
        },
    },
    alternates: {
        canonical: '/',
    },
    openGraph: {
        type: 'website',
        url: SITE_URL,
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        siteName: SITE_TITLE,
        countryName: 'Vietnam',
        images: {
            url: SITE_URL + THUMBNAIL.src,
            secureUrl: THUMBNAIL.src,
            type: 'image/png',
            width: THUMBNAIL.width,
            height: THUMBNAIL.height,
        },
    },
    twitter: {
        card: 'summary_large_image',
        site: '@site',
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        images: {
            url: SITE_URL + THUMBNAIL.src,
            secureUrl: THUMBNAIL.src,
            type: 'image/png',
            width: THUMBNAIL.width,
            height: THUMBNAIL.height,
        },
    },
    appleWebApp: {
        capable: true,
        title: SITE_TITLE,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>
                    <AuthProvider>
                        {children}
                        <ToastContainer
                            position="top-right"
                            autoClose={3000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            theme="light"
                        />
                    </AuthProvider>
                </Providers>
            </body>
        </html>
    );
}
