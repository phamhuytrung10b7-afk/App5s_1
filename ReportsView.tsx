import React, { useMemo } from 'react';
import { Part, Transaction } from './types';
import { storageService } from './storage';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  FileSpreadsheet,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Package,
} from 'lucide-react';

interface ReportsViewProps {
  parts: Part[];
  transactions: Transaction[];
  onOpenBinCard: (part: Part) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ parts, transactions, onOpenBinCard }) => {
  // Top 5 parts with highest stock
  const highestStockParts = useMemo(() => {
    return [...parts].sort((a, b) => b.currentStock - a.currentStock).slice(0, 5);
  }, [parts]);

  // Low stock parts
  const lowStockParts = useMemo(() => {
    return parts.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock);
  }, [parts]);

  // Out of stock parts
  const outOfStockParts = useMemo(() => {
    return parts.filter((p) => p.currentStock === 0);
  }, [parts]);

  // Most imported parts
  const mostImportedParts = useMemo(() => {
    const importMap: Record<string, { code: string; name: string; totalIn: number; unit: string }> = {};
    transactions
      .filter((t) => t.type === 'IN')
      .forEach((t) => {
        if (!importMap[t.partId]) {
          importMap[t.partId] = { code: t.partCode, name: t.partName, totalIn: 0, unit: t.unit };
        }
        importMap[t.partId].totalIn += t.quantity;
      });
    return Object.values(importMap)
      .sort((a, b) => b.totalIn - a.totalIn)
      .slice(0, 5);
  }, [transactions]);

  // Most exported parts
  const mostExportedParts = useMemo(() => {
    const exportMap: Record<string, { code: string; name: string; totalOut: number; unit: string }> = {};
    transactions
      .filter((t) => t.type === 'OUT')
      .forEach((t) => {
        if (!exportMap[t.partId]) {
          exportMap[t.partId] = { code: t.partCode, name: t.partName, totalOut: 0, unit: t.unit };
        }
        exportMap[t.partId].totalOut += t.quantity;
      });
    return Object.values(exportMap)
      .sort((a, b) => b.totalOut - a.totalOut)
      .slice(0, 5);
  }, [transactions]);

  // Chart data for stock distribution
  const stockDistributionData = [
    { name: 'An toàn', value: parts.length - lowStockParts.length - outOfStockParts.length, color: '#10B981' },
    { name: 'Sắp hết', value: lowStockParts.length, color: '#F59E0B' },
    { name: 'Đã hết', value: outOfStockParts.length, color: '#EF4444' },
  ];

  const handleExportReportExcel = () => {
    storageService.exportPartsToExcel(parts, 'bao_cao_tong_hop_kho.xlsx');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">BÁO CÁO THỐNG KÊ TỒN KHO & BIẾN ĐỘNG</h2>
            <p className="text-xs text-slate-500">
              Phân tích tổng quan linh kiện tồn kho, linh kiện sắp hết và xuất nhập nhiều nhất.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportReportExcel}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất Báo Cáo Excel</span>
        </button>
      </div>

      {/* TOP CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Highest Stock Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center">
            <Package className="w-4 h-4 text-blue-600 mr-2" />
            Top Linh Kiện Có Số Lượng Tồn Kho Nhiều Nhất
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={highestStockParts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [`${value} đơn vị`, 'Tồn kho']}
                  labelFormatter={(label) => `Mã: ${label}`}
                />
                <Bar dataKey="currentStock" fill="#2563EB" radius={[6, 6, 0, 0]} name="Tồn hiện tại" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Status Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Phân Bổ Trạng Thái Tồn Kho</h3>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stockDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} mã`, 'Số lượng']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center text-xs">
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="font-bold text-emerald-800 block">{stockDistributionData[0].value}</span>
              <span className="text-[10px] text-emerald-600">An toàn</span>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
              <span className="font-bold text-amber-800 block">{stockDistributionData[1].value}</span>
              <span className="text-[10px] text-amber-600">Sắp hết</span>
            </div>
            <div className="p-2 bg-red-50 rounded-lg border border-red-100">
              <span className="font-bold text-red-800 block">{stockDistributionData[2].value}</span>
              <span className="text-[10px] text-red-600">Hết hàng</span>
            </div>
          </div>
        </div>
      </div>

      {/* WARNING TABLES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Out of stock list */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-red-600">
            <XCircle className="w-5 h-5" />
            <h3 className="font-bold text-slate-800 text-sm">
              Linh Kiện Đã Hết Hàng ({outOfStockParts.length})
            </h3>
          </div>

          {outOfStockParts.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-4 text-center">Không có linh kiện nào bị hết hàng!</p>
          ) : (
            <div className="space-y-2">
              {outOfStockParts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onOpenBinCard(p)}
                  className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:bg-red-100/60 transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-red-700">[{p.code}]</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{p.name}</p>
                    <p className="text-[11px] text-slate-500">Vị trí: {p.location}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-bold text-[10px]">
                    0 {p.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock list */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-slate-800 text-sm">
              Linh Kiện Cảnh Báo Sắp Hết ({lowStockParts.length})
            </h3>
          </div>

          {lowStockParts.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-4 text-center">Tất cả linh kiện đều ở mức an toàn!</p>
          ) : (
            <div className="space-y-2">
              {lowStockParts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onOpenBinCard(p)}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:bg-amber-100/60 transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-amber-800">[{p.code}]</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{p.name}</p>
                    <p className="text-[11px] text-slate-500">Định mức tối thiểu: {p.minStock} {p.unit}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-800 text-sm">{p.currentStock}</span>{' '}
                    <span className="text-[11px] text-slate-500">{p.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TOP IMPORTED / EXPORTED RANKINGS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most imported */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-bold text-slate-800 text-sm">Linh Kiện Nhập Kho Nhiều Nhất</h3>
          </div>

          <div className="space-y-2">
            {mostImportedParts.map((item, idx) => (
              <div
                key={item.code}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-mono font-bold text-blue-700">[{item.code}]</span>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                  </div>
                </div>
                <span className="font-black text-emerald-700 text-sm">
                  +{item.totalIn.toLocaleString('vi-VN')} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Most exported */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-blue-600">
            <TrendingDown className="w-5 h-5" />
            <h3 className="font-bold text-slate-800 text-sm">Linh Kiện Xuất Sản Xuất Nhiều Nhất</h3>
          </div>

          <div className="space-y-2">
            {mostExportedParts.map((item, idx) => (
              <div
                key={item.code}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-mono font-bold text-blue-700">[{item.code}]</span>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                  </div>
                </div>
                <span className="font-black text-blue-700 text-sm">
                  -{item.totalOut.toLocaleString('vi-VN')} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
