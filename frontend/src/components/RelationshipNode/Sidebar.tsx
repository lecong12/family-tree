'use client';

import React from 'react';
import { Sidebar } from 'flowbite-react';
import { HiChartPie, HiUser, HiUpload, HiLogout } from 'react-icons/hi';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const AdminSidebar = () => {
  const { logout } = useAuth();

  return (
    <div className="h-screen border-r border-gray-200 w-64">
      {/* Giữ lại thẻ Sidebar cha để có container và aria-label */}
      <Sidebar aria-label="Admin sidebar">
        <div className="flex flex-col justify-between h-full py-4 px-3">
          <div className="space-y-2">
            {/* Dashboard */}
            <Link href="/admin" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
              <HiChartPie className="w-6 h-6 text-gray-500" />
              <span className="ml-3 font-medium">Dashboard</span>
            </Link>

            {/* Quản lý thành viên */}
            <Link href="/admin/persons" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
              <HiUser className="w-6 h-6 text-gray-500" />
              <span className="ml-3 font-medium">Quản lý thành viên</span>
            </Link>

            {/* NÚT IMPORT CSV */}
            <Link href="/admin/import" className="flex items-center p-2 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 group">
              <HiUpload className="w-6 h-6" />
              <span className="ml-3 font-bold text-blue-700">Import CSV</span>
            </Link>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-200">
            {/* Nút Đăng xuất */}
            <button
              onClick={logout}
              className="flex items-center w-full p-2 text-red-600 rounded-lg hover:bg-red-50 group"
            >
              <HiLogout className="w-6 h-6" />
              <span className="ml-3 font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </Sidebar>
    </div>
  );
};

export default AdminSidebar;