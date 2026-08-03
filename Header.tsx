import React, { useState, useEffect } from 'react';
import { AppSettings, ViewTab } from './types';
import { ArrowDownLeft, ArrowUpRight, Clock, Building2, Search, PlusCircle } from 'lucide-react';

interface HeaderProps {
  settings: AppSettings;
  onNavigateTab: (tab: ViewTab) => void;
  onOpenQuickAdd: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onNavigateTab,
  onOpenQuickAdd,
  searchTerm,
  onSearchChange,
}) => {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }) +
          ' | ' +
          now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10 shadow-xs">
      {/* Title & Warehouse Info */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-base leading-snug">{settings.warehouseName}</h2>
          <p className="text-xs text-slate-500 font-medium">{settings.companyName}</p>
        </div>
      </div>

      {/* Quick Search & Actions */}
      <div className="flex items-center space-x-3 flex-wrap">
        {/* Global Search Bar */}
        <div className="relative w-80 sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm mã linh kiện hoặc tên..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border-none rounded-full focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all placeholder-slate-400"
          />
        </div>

        {/* Quick Stock-In Button */}
        <button
          onClick={() => onNavigateTab('stock_in')}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>+ Nhập kho</span>
        </button>

        {/* Quick Stock-Out Button */}
        <button
          onClick={() => onNavigateTab('stock_out')}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>- Xuất kho</span>
        </button>

        {/* Add Part Button */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Thêm linh kiện</span>
        </button>

        {/* Real-time Clock */}
        <div className="hidden xl:flex items-center space-x-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="capitalize">{timeString}</span>
        </div>
      </div>
    </header>
  );
};
