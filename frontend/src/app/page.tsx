'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Home() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        // Debug log để kiểm tra trên Vercel
        console.log('--- DEBUG INFO ---');
        console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
        console.log('Auth Loading:', loading);
        console.log('User:', user);
        console.log('------------------');

        if (!loading) {
            if (user) {
                router.replace('/persons');
            } else {
                router.replace('/login');
            }
        }
    }, [user, loading, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500 text-sm font-medium animate-pulse">
                Đang tải dữ liệu gia phả...
            </p>
        </div>
    );
}