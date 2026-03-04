'use client';

import React from 'react';
import { Sidebar } from 'flowbite-react'; // Sidebar.Items và Sidebar.ItemGroup được import ngầm
import { HiChartPie, HiUser, HiUpload, HiLogout } from 'react-icons/hi';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const AdminSidebar = () => {
  const { logout } = useAuth();
  
  return (
    <div className="h-screen w-64">
      {/* Sử dụng cấu trúc component của Flowbite để code sạch sẽ và dễ bảo trì hơn.
          Cấu trúc này giúp giữ nút Đăng xuất ở cuối danh sách. */}
      <Sidebar aria-label="Admin sidebar" className="h-full flex flex-col justify-between border-r border-gray-200">
        <Sidebar.Items>
          <Sidebar.ItemGroup>
            <Sidebar.Item as={Link} href="/admin" icon={HiChartPie}>
              Dashboard
            </Sidebar.Item>
            <Sidebar.Item as={Link} href="/admin/persons" icon={HiUser}>
              Quản lý thành viên
            </Sidebar.Item>
            <Sidebar.Item
              as={Link}
              href="/admin/import"
              icon={HiUpload}
              className="bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              <span className="font-bold">Import CSV</span>
            </Sidebar.Item>
          </Sidebar.ItemGroup>
          <Sidebar.ItemGroup>
            <Sidebar.Item icon={HiLogout} onClick={logout} className="text-red-600 hover:bg-red-50">
              Đăng xuất
            </Sidebar.Item>
          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>
    </div>
  );
};

export default AdminSidebar;