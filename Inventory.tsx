import React from 'react';
import { inventoryService } from './inventoryService';
import { UnitStatus } from './types';

export const Inventory: React.FC = () => {
  const products = inventoryService.getProducts();
  const units = inventoryService.getUnits();

  // Group units by product and status
  const inventoryData = products.map(p => {
    const productUnits = units.filter(u => u.productId === p.id);
    return {
      ...p,
      total: productUnits.length,
      new: productUnits.filter(u => u.status === UnitStatus.NEW).length,
      sold: productUnits.filter(u => u.status === UnitStatus.SOLD).length,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Trạng thái tồn kho</h2>
          <p className="text-slate-500">Chi tiết theo từng Model và trạng thái.</p>
        </div>
        <button className="text-water-600 text-sm font-medium hover:underline">Xuất báo cáo (CSV)</button>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {inventoryData.map(item => (
           <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{item.model}</h3>
                  <p className="text-slate-500 text-sm">{item.brand} • {item.specs}</p>
                </div>
              </div>
                 
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Hàng mới</p>
                    <p className="text-2xl font-bold text-green-800 mt-1">{item.new}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Đã bán</p>
                    <p className="text-2xl font-bold text-slate-700 mt-1">{item.sold}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Tổng</p>
                    <p className="text-2xl font-bold text-blue-800 mt-1">{item.total}</p>
                </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};