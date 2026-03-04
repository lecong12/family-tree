'use client';

import React from 'react';
import { Sidebar } from 'flowbite-react';
import { 
  HiChartPie, 
  HiUser, 
  HiUpload, 
  HiLogout, 
  HiDatabase 
} from 'react-icons/hi';
import { useAuth } from '@/context/AuthContext';

const AdminSidebar = () => {
  const { logout } = useAuth();

  return (
    <div className="h-screen border-r border-gray-200">
      <Sidebar aria-label="Admin sidebar">
        <Sidebar.Items>
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
              className="font-medium"
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
        </Sidebar.Items>
      </Sidebar>
    </div>
  );
};

export default AdminSidebar;