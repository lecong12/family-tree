'use client';

import React from 'react';
import { Sidebar } from 'flowbite-react'; // Sidebar.Items và Sidebar.ItemGroup được import ngầm
import { HiChartPie, HiUser, HiUpload, HiLogout } from 'react-icons/hi';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const AdminSidebar = () => {
  const { logout } = useAuth();
  
  // Ép kiểu Sidebar sang any để tránh lỗi TypeScript: Property 'Items' does not exist...
  // Đây là workaround cho vấn đề type definition của thư viện flowbite-react
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SidebarComponent = Sidebar as any;

  return (
    <div className="h-screen w-64">
      {/* Sử dụng cấu trúc component của Flowbite để code sạch sẽ và dễ bảo trì hơn.
          Cấu trúc này giúp giữ nút Đăng xuất ở cuối danh sách. */}
      <SidebarComponent aria-label="Admin sidebar" className="h-full flex flex-col justify-between border-r border-gray-200">
        <SidebarComponent.Items>
          <SidebarComponent.ItemGroup>
            <SidebarComponent.Item as={Link} href="/admin" icon={HiChartPie}>
              Dashboard
            </SidebarComponent.Item>
            <SidebarComponent.Item as={Link} href="/admin/persons" icon={HiUser}>
              Quản lý thành viên
            </SidebarComponent.Item>
            <SidebarComponent.Item
              as={Link}
              href="/admin/import"
              icon={HiUpload}
              className="bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              <span className="font-bold">Import CSV</span>
            </SidebarComponent.Item>
          </SidebarComponent.ItemGroup>
          <SidebarComponent.ItemGroup>
            <SidebarComponent.Item icon={HiLogout} onClick={logout} className="text-red-600 hover:bg-red-50">
              Đăng xuất
            </SidebarComponent.Item>
          </SidebarComponent.ItemGroup>
        </SidebarComponent.Items>
      </SidebarComponent>
    </div>
  );
};

export default AdminSidebar;