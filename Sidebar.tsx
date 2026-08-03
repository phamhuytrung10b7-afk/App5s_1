import React from 'react';
import { ViewTab } from './types';
import {
  Home,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  History,
  BarChart3,
  Settings,
  ShieldAlert,
  Boxes,
} from 'lucide-react';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  lowStockCount: number;
  outOfStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  lowStockCount,
  outOfStockCount,
}) => {
  const menuItems: { id: ViewTab; label: string; icon: React.ElementType; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Trang chủ', icon: Home },
    {
      id: 'parts',
      label: 'Danh sách linh kiện',
      icon: Package,
      badge: lowStockCount + outOfStockCount > 0 ? lowStockCount + outOfStockCount : undefined,
      badgeColor: outOfStockCount > 0 ? 'bg-red-500' : 'bg-amber-500',
    },
    { id: 'stock_in', label: 'Nhập kho', icon: ArrowDownLeft },
    { id: 'stock_out', label: 'Xuất kho', icon: ArrowUpRight },
    { id: 'bin_card', label: 'Lịch sử / Thẻ kho', icon: History },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
    { id: 'settings', label: 'Cài đặt & Dữ liệu', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white text-slate-800 flex flex-col h-screen sticky top-0 border-r border-slate-200 shadow-xs select-none z-20 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center shrink-0">
          <Boxes className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-blue-900 tracking-tight leading-tight">KHO LINH KIỆN</h1>
          <p className="text-xs text-slate-400 font-medium">Thẻ Kho Điện Tử</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Danh mục chính
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 group cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-105 text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-xs font-bold text-white rounded-full ${
                    item.badgeColor || 'bg-amber-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Status Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-medium text-slate-700">Đang hoạt động (Ngoại tuyến)</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Sổ Thẻ Kho Điện Tử v2.5</p>
      </div>
    </aside>
  );
};
