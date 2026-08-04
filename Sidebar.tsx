import React from 'react';
import { ViewTab } from './types';
import {
  Home,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  History,
  MapPin,
  BarChart3,
  Settings,
  ShieldAlert,
  Boxes,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  lowStockCount: number;
  outOfStockCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  lowStockCount,
  outOfStockCount,
  isOpenMobile = false,
  onCloseMobile,
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
    { id: 'warehouse_map', label: 'Sơ đồ kho (Vị trí)', icon: MapPin },
    { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
    { id: 'settings', label: 'Cài đặt & Dữ liệu', icon: Settings },
  ];

  const handleSelect = (tab: ViewTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-700 to-indigo-600 text-white rounded-xl shadow-md flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg text-blue-900 tracking-tight leading-tight">KHO LINH KIỆN</h1>
            <p className="text-xs text-slate-400 font-medium">Thẻ Kho Điện Tử</p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            title="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Danh mục chính
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 group cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-200/60'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
          <span className="font-medium text-slate-700">Đang hoạt động (Vercel / Mobile Web)</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Sổ Thẻ Kho Điện Tử v2.5</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-200 shadow-xs select-none z-20 shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile Drawer Slide-over Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
