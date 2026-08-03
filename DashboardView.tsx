import React from 'react';
import { Part, Transaction, ViewTab } from './types';
import {
  Package,
  Layers,
  AlertTriangle,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  History,
  Boxes,
  ChevronRight,
  TrendingDown,
  Clock,
} from 'lucide-react';

interface DashboardViewProps {
  parts: Part[];
  transactions: Transaction[];
  onNavigateTab: (tab: ViewTab) => void;
  onOpenBinCard: (part: Part) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  parts,
  transactions,
  onNavigateTab,
  onOpenBinCard,
}) => {
  const totalParts = parts.length;
  const totalStockQuantity = parts.reduce((sum, p) => sum + p.currentStock, 0);

  const lowStockParts = parts.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock);
  const outOfStockParts = parts.filter((p) => p.currentStock === 0);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Banner Intro */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight">SỔ THẺ KHO ĐIỆN TỬ LINH KIỆN</h2>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
            Hệ thống quản lý kho linh kiện điện tử chuẩn hóa. Theo dõi biến động nhập xuất, định mức tồn an toàn và in thẻ kho tự động.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => onNavigateTab('stock_in')}
            className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Nhập Kho</span>
          </button>
          <button
            onClick={() => onNavigateTab('stock_out')}
            className="flex items-center space-x-1.5 bg-white text-blue-900 hover:bg-blue-50 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Xuất Kho</span>
          </button>
        </div>
      </div>

      {/* TOP STATS BENTO ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Parts */}
        <div
          onClick={() => onNavigateTab('parts')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng mã linh kiện</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalParts.toLocaleString('vi-VN')}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Total Stock */}
        <div
          onClick={() => onNavigateTab('parts')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng số lượng tồn</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalStockQuantity.toLocaleString('vi-VN')}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Warning */}
        <div
          onClick={() => onNavigateTab('parts')}
          className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group bg-amber-50/20"
        >
          <div>
            <p className="text-amber-800 text-xs font-bold uppercase tracking-wider">Sắp hết hàng</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{lowStockParts.length}</p>
          </div>
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Out of Stock Alert */}
        <div
          onClick={() => onNavigateTab('parts')}
          className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group bg-red-50/20"
        >
          <div>
            <p className="text-red-800 text-xs font-bold uppercase tracking-wider">Đã hết hàng</p>
            <p className="text-2xl font-black text-red-600 mt-1">{outOfStockParts.length}</p>
          </div>
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* DASHBOARD MAIN BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT TRANSACTIONS (2 COLS) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Clock className="w-4 h-4" />
              </span>
              THẺ KHO ĐIỆN TỬ (Giao dịch gần đây)
            </h3>

            <button
              onClick={() => onNavigateTab('bin_card')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>Xem toàn bộ &rarr;</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase text-[11px] tracking-wider">
                  <th className="p-3.5 pl-5">Ngày</th>
                  <th className="p-3.5">Linh kiện</th>
                  <th className="p-3.5 text-center">Nhập</th>
                  <th className="p-3.5 text-center">Xuất</th>
                  <th className="p-3.5 text-center">Tồn cuối</th>
                  <th className="p-3.5 pr-5">Diễn giải</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                      Chưa có giao dịch nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => {
                    const part = parts.find((p) => p.id === tx.partId);
                    const isStockIn = tx.type === 'IN';
                    const isAudit = tx.type === 'AUDIT_ADJUSTMENT';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 pl-5 font-medium text-slate-600 whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })}
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-blue-700 mr-1.5">[{tx.partCode}]</span>
                          <span className="font-semibold text-slate-800">{tx.partName}</span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-emerald-600">
                          {isStockIn ? `+${tx.quantity}` : '—'}
                        </td>
                        <td className="p-3.5 text-center font-bold text-blue-600">
                          {!isStockIn && !isAudit ? `-${tx.quantity}` : '—'}
                        </td>
                        <td className="p-3.5 text-center font-black text-slate-900">
                          {tx.stockAfter} {tx.unit}
                        </td>
                        <td className="p-3.5 pr-5 text-slate-500 text-xs italic truncate max-w-[180px]">
                          {tx.productionOrder ? `#${tx.productionOrder} ` : ''}
                          {tx.reasonOrPurpose || tx.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOW STOCK WARNING BENTO SIDE PANEL */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span className="text-red-500">🚨</span> SẮP HẾT HÀNG / HẾT HÀNG
              </h3>
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded-full">
                {outOfStockParts.length + lowStockParts.length}
              </span>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[380px]">
              {outOfStockParts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onOpenBinCard(p)}
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100/60 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-red-600 shadow-xs shrink-0">
                    0
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-red-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-red-700 font-mono">[{p.code}] • Kệ: {p.location}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateTab('stock_in');
                    }}
                    className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                  >
                    Nhập
                  </button>
                </div>
              ))}

              {lowStockParts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onOpenBinCard(p)}
                  className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100/60 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-amber-600 shadow-xs shrink-0">
                    {p.currentStock}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-amber-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-amber-700 font-mono">[{p.code}] • Min: {p.minStock} {p.unit}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateTab('stock_in');
                    }}
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                  >
                    Nhập
                  </button>
                </div>
              ))}

              {outOfStockParts.length === 0 && lowStockParts.length === 0 && (
                <p className="text-xs text-slate-400 p-6 text-center italic">
                  Tất cả linh kiện đều nằm trong định mức an toàn!
                </p>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('stock_check')}
              className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-xs font-bold hover:border-blue-400 hover:text-blue-600 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>+ TẠO PHIẾU KIỂM KÊ KHO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
