'use client';

import React from 'react';
import { Sidebar } from 'flowbite-react';
import { 
  HiChartPie, 
  HiUser, 
  HiUpload, 
  HiLogout
} from 'react-icons/hi';
import { useAuth } from '@/context/AuthContext';

const AdminSidebar = () => {
  const { logout } = useAuth();

  return (
    <div className="h-screen border-r border-gray-200">
      <Sidebar aria-label="Admin sidebar">
        {/* The <Sidebar.Items> wrapper is removed to fix a potential version conflict with flowbite-react */}
        <Sidebar.ItemGroup>
          {/* Mục Tổng quan */}
          <Sidebar.Item href="/admin" icon={HiChartPie}>
            Dashboard
          </Sidebar.Item>

          {/* Mục Quản lý thành viên */}
          <Sidebar.Item href="/admin/persons" icon={HiUser}>
            Quản lý thành viên
          </Sidebar.Item>

          {/* NÚT IMPORT CSV - CHÚNG TA THÊM Ở ĐÂY */}
          <Sidebar.Item 
            href="/admin/import"
            icon={HiUpload}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            Nạp dữ liệu (CSV)
          </Sidebar.Item>
        </Sidebar.ItemGroup>

        <Sidebar.ItemGroup>
          {/* Mục Đăng xuất */}
          <Sidebar.Item 
            onClick={logout} 
            icon={HiLogout} 
            className="cursor-pointer text-red-600 hover:bg-red-50"
          >
            Đăng xuất
          </Sidebar.Item>
        </Sidebar.ItemGroup>
      </Sidebar>
    </div>
  );
};

export default AdminSidebar;