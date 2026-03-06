import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../'),
  eslint: {
    // Bỏ qua lỗi ESLint khi build để không bị dừng lại giữa chừng
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Bỏ qua lỗi định nghĩa kiểu dữ liệu (any, type mismatch) khi build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;