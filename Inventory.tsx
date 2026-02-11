
import React, { useState, useMemo } from 'react';
import { inventoryService } from './inventoryService';
import { exportExcelReport } from './reportService';
import { UnitStatus } from './types';
import { FileSpreadsheet, Warehouse as WarehouseIcon, Package, Info, CheckCircle, BarChart3, ChevronRight, Hash } from 'lucide-react';

export const Inventory: React.FC = () => {
  const warehouses = inventoryService.getWarehouses();
  const products = inventoryService.getProducts();
  const allUnits = inventoryService.getUnits();

  const [selectedWhName, setSelectedWhName] = useState<string>('');

  // Lấy thông tin kho đang được chọn
  const currentWarehouse = useMemo(() => 
    warehouses.find(w => w.name === selectedWhName),
  [selectedWhName, warehouses]);

  // Tính toán dữ liệu tồn kho dựa trên kho được chọn
  const inventoryData = useMemo(() => {
    if (!selectedWhName) return [];

    return products.map(p => {
      const productUnitsInWh = allUnits.filter(u => 
        u.productId === p.id && u.warehouseLocation === selectedWhName
      );
      
      const inStockUnits = productUnitsInWh.filter(u => u.status === UnitStatus.NEW);
      
      return {
        ...p,
        total: productUnitsInWh.length,
        new: inStockUnits.length,
        sold: productUnitsInWh.filter(u => u.status === UnitStatus.SOLD).length,
        imeiList: inStockUnits.map(u => u.serialNumber) // Lấy danh sách IMEI đang tồn
      };
    }).filter(item => item.total > 0); // Chỉ hiện các model có hàng trong kho này
  }, [selectedWhName, products, allUnits]);

  // Tính toán thông số tổng quan của kho
  const whStats = useMemo(() => {
    if (!selectedWhName) return null;
    const inWh = allUnits.filter(u => u.warehouseLocation === selectedWhName && u.status === UnitStatus.NEW).length;
    const capacity = currentWarehouse?.maxCapacity || 0;
    const percent = capacity > 0 ? Math.round((inWh / capacity) * 100) : 0;
    return { inWh, capacity, percent };
  }, [selectedWhName, allUnits, currentWarehouse]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Trạng thái Tồn kho</h2>
          <p className="text-slate-500">Xem chi tiết hàng hóa và danh sách IMEI theo từng kho.</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={exportExcelReport}
              className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              <FileSpreadsheet size={18} /> Xuất Báo cáo (.xlsx)
            </button>
        </div>
      </div>

      {/* Bộ lọc chọn kho */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-3 min-w-[200px]">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <WarehouseIcon size={24} />
            </div>
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Vui lòng chọn kho</label>
                <select 
                    className="block w-full font-bold text-slate-700 outline-none cursor-pointer bg-transparent"
                    value={selectedWhName}
                    onChange={(e) => setSelectedWhName(e.target.value)}
                >
                    <option value="">-- Chọn Kho hàng --</option>
                    {warehouses.map(wh => (
                        <option key={wh.id} value={wh.name}>{wh.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {whStats && (
            <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-3 gap-4 border-l-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Đang chứa thực tế</span>
                    <span className="text-xl font-bold text-blue-600">{whStats.inWh} <span className="text-sm font-medium text-slate-400">máy</span></span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Sức chứa tối đa</span>
                    <span className="text-xl font-bold text-slate-800">{whStats.capacity || '∞'} <span className="text-sm font-medium text-slate-400">máy</span></span>
                </div>
                <div className="col-span-2 md:col-span-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tỷ lệ lấp đầy</span>
                        <span className={`text-xs font-bold ${whStats.percent > 90 ? 'text-red-500' : 'text-blue-500'}`}>{whStats.percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-700 ${whStats.percent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${whStats.percent}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {!selectedWhName ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center text-center">
            <div className="bg-slate-50 p-6 rounded-full mb-4 text-slate-300">
                <BarChart3 size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Chưa chọn kho dữ liệu</h3>
            <p className="text-slate-500 max-w-sm mt-2">Vui lòng chọn một kho hàng từ danh sách phía trên để xem báo cáo tồn kho chi tiết.</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 ml-1">
                <Package size={20} className="text-blue-500"/>
                Danh mục hàng hóa tại {selectedWhName}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {inventoryData.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all flex flex-col gap-6 group">
                        {/* Header của thẻ sản phẩm */}
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                    <BarChart3 size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg">{item.model}</h4>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{item.brand}</p>
                                </div>
                            </div>
                            <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                                {item.new} máy sẵn có
                            </div>
                        </div>

                        {/* Các con số thống kê nhanh */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Hàng Mới</span>
                                <span className="text-xl font-black text-green-600">{item.new}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Đã Xuất</span>
                                <span className="text-xl font-black text-slate-700">{item.sold}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Tổng Giao dịch</span>
                                <span className="text-xl font-black text-blue-800">{item.total}</span>
                            </div>
                        </div>

                        {/* PHẦN MỚI: Danh sách IMEI chi tiết */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
                                <Hash size={14} /> Danh sách IMEI đang tại kho
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 max-h-40 overflow-y-auto custom-scrollbar">
                                {item.imeiList.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {item.imeiList.map(imei => (
                                            <div key={imei} className="bg-white border border-slate-200 px-2 py-1.5 rounded-lg text-center font-mono text-[10px] font-bold text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all">
                                                {imei}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-slate-300 italic text-xs">
                                        Không có mã IMEI nào ở trạng thái sẵn sàng.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {inventoryData.length === 0 && (
                    <div className="col-span-full bg-slate-50 p-12 rounded-2xl border border-dashed text-center flex flex-col items-center">
                        <Info size={32} className="text-slate-300 mb-2" />
                        <p className="text-slate-500 italic font-medium">Kho này hiện không có bất kỳ sản phẩm nào.</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
