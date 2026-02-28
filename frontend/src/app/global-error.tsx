'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global Error:', error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-red-50 text-red-900">
                    <h2 className="text-2xl font-bold mb-4">Đã xảy ra lỗi nghiêm trọng!</h2>
                    <div className="bg-white p-4 rounded shadow border border-red-200 mb-4 max-w-lg overflow-auto">
                        <p className="font-mono text-sm text-red-600">{error.message}</p>
                        {error.digest && <p className="text-xs text-gray-500 mt-2">Digest: {error.digest}</p>}
                    </div>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Thử lại
                    </button>
                </div>
            </body>
        </html>
    );
}