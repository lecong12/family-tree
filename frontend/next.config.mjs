/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
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
            {
                protocol: 'https',
                hostname: 'ui-avatars.com', // Thêm tên miền cho avatar mặc định
            },
        ],
    },
};

export default nextConfig;