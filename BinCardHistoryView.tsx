import React, { useState, useMemo } from 'react';
import { Part, Transaction } from './types';
import { storageService } from './storage';
import {
  History,
  Search,
  Calendar,
  Filter,
  FileSpreadsheet,
  Printer,
  Package,
  Boxes,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';

interface BinCardHistoryViewProps {
  parts: Part[];
  transactions: Transaction[];
  onOpenBinCard: (part: Part) => void;
}

export const BinCardHistoryView: React.FC<BinCardHistoryViewProps> = ({
  parts,
  transactions,
  onOpenBinCard,
}) => {
  const [selectedPartId, setSelectedPartId] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [filterText, setFilterText] = useState<string>('');

  // Filter Transactions
  const filteredTxs = useMemo(() => {
    let result = [...transactions];

    // Part filter
    if (selectedPartId !== 'ALL') {
      result = result.filter((t) => t.partId === selectedPartId);
    }

    // Date filter
    if (dateFrom) {
      result = result.filter((t) => new Date(t.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      result = result.filter((t) => new Date(t.date) <= new Date(dateTo + 'T23:59:59'));
    }

    // Text search
    if (filterText) {
      const q = filterText.toLowerCase();
      result = result.filter(
        (t) =>
          t.partCode.toLowerCase().includes(q) ||
          t.partName.toLowerCase().includes(q) ||
          t.person.toLowerCase().includes(q) ||
          (t.productionOrder && t.productionOrder.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.reasonOrPurpose && t.reasonOrPurpose.toLowerCase().includes(q))
      );
    }

    // Chronological order descending for history view
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedPartId, dateFrom, dateTo, filterText]);

  const selectedPartObj = parts.find((p) => p.id === selectedPartId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">SỔ THẺ KHO ĐIỆN TỬ TỔNG HỢP</h2>
            <p className="text-xs text-slate-500">
              Nhật ký toàn bộ biến động nhập, xuất, cân đối kiểm kê được sắp xếp chuẩn theo dòng thời gian.
            </p>
          </div>
        </div>

        {selectedPartObj && (
          <button
            onClick={() => onOpenBinCard(selectedPartObj)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Xem & In Thẻ Kho Lẻ [{selectedPartObj.code}]</span>
          </button>
        )}
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Part Dropdown */}
          <div className="min-w-[220px]">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Chọn Linh Kiện:</label>
            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="ALL">-- Tất cả linh kiện --</option>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Từ ngày:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Đến ngày:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {(dateFrom || dateTo || selectedPartId !== 'ALL' || filterText) && (
            <button
              onClick={() => {
                setSelectedPartId('ALL');
                setDateFrom('');
                setDateTo('');
                setFilterText('');
              }}
              className="mt-4 text-blue-600 hover:underline font-semibold"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Text Filter Search */}
        <div className="relative min-w-[200px] mt-2 sm:mt-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm lệnh SX, người nhập..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
          />
        </div>
      </div>

      {/* CHRONOLOGICAL BIN CARD TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="p-3 pl-5 w-28">Ngày tháng</th>
                <th className="p-3 w-32">Mã linh kiện</th>
                <th className="p-3">Tên linh kiện</th>
                <th className="p-3 text-right text-emerald-800 bg-emerald-50/70">Nhập (+)</th>
                <th className="p-3 text-right text-blue-800 bg-blue-50/70">Xuất (-)</th>
                <th className="p-3 text-right text-slate-900 bg-amber-50/70 font-black">Tồn cuối</th>
                <th className="p-3">Người thực hiện</th>
                <th className="p-3">Lệnh sản xuất</th>
                <th className="p-3 pr-5">Diễn giải / Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400 italic">
                    Không có nhật ký giao dịch nào trong khoảng thời gian đã chọn.
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx) => {
                  const part = parts.find((p) => p.id === tx.partId);
                  const isStockIn = tx.type === 'IN';
                  const isAudit = tx.type === 'AUDIT_ADJUSTMENT';

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => part && onOpenBinCard(part)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      <td className="p-3 pl-5 font-medium text-slate-600 whitespace-nowrap">
                        {new Date(tx.date).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-700">{tx.partCode}</td>
                      <td className="p-3 font-semibold text-slate-800">{tx.partName}</td>
                      <td className="p-3 text-right font-bold text-emerald-700 bg-emerald-50/30">
                        {isStockIn ? `+${tx.quantity.toLocaleString('vi-VN')}` : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-700 bg-blue-50/30">
                        {!isStockIn && !isAudit ? `-${tx.quantity.toLocaleString('vi-VN')}` : '-'}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 bg-amber-50/30">
                        {tx.stockAfter.toLocaleString('vi-VN')} {tx.unit}
                      </td>
                      <td className="p-3 font-medium text-slate-700">{tx.person || '-'}</td>
                      <td className="p-3 font-mono font-semibold text-blue-600">
                        {tx.productionOrder || '-'}
                      </td>
                      <td className="p-3 pr-5 text-slate-600">
                        {tx.reasonOrPurpose} {tx.notes ? `(${tx.notes})` : ''}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
