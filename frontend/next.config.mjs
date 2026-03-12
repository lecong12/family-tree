import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Tắt việc tạo source map trong môi trường production để tránh lỗi 404
    productionBrowserSourceMaps: false,
    // Chỉ định thư mục gốc của workspace để tắt cảnh báo về nhiều file lock
    outputFileTracingRoot: path.join(__dirname, '..'),
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: 'www.cartoonize.net',
            },
            {
                protocol: 'https',
                hostname: 'encrypted-tbn0.gstatic.com',
            },
        ],
    },
};

export default nextConfig;