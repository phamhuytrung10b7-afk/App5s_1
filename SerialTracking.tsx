import React, { useState } from 'react';
import { inventoryService } from './inventoryService';
import { SerialUnit, Transaction } from './types';
import { Search, MapPin, User, Calendar, Box, ArrowRightLeft, CheckCircle } from 'lucide-react';

export const SerialTracking: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SerialUnit | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const unit = inventoryService.getUnitBySerial(query);
    const txHistory = inventoryService.getSerialHistory(query);
    
    setResult(unit || null);
    setHistory(txHistory);
    setSearched(true);
  };

  // Helper to get product details for rendering
  const productInfo = result ? inventoryService.getProductById(result.productId) : null;

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleString('vi-VN', {
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const renderTimelineEvent = (tx: Transaction, index: number) => {
    let icon = <Calendar size={16} />;
    let color = "bg-slate-400";
    let title = "";
    let description = "";

    if (tx.type === 'INBOUND') {
       icon = <Calendar size={16} />;
       color = "bg-green-500";
       title = "Nhập Kho";
       description = `Nhập mới vào vị trí: ${tx.toLocation || 'Kho Tổng'}`;
    } else if (tx.type === 'TRANSFER') {
       icon = <ArrowRightLeft size={16} />;
       color = "bg-blue-500";
       title = "Luân Chuyển Kho";
       description = `Chuyển đến: ${tx.toLocation}`;
    } else if (tx.type === 'OUTBOUND') {
       icon = <User size={16} />;
       color = "bg-orange-500";
       title = "Xuất Bán";
       description = `Khách hàng: ${tx.customer}`;
    }

    return (
      <div key={tx.id} className="relative pb-8 last:pb-0">
         {index !== history.length - 1 && (
            <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-slate-200"></div>
         )}
         <div className="flex gap-4">
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm ring-4 ring-white ${color}`}>
               {icon}
            </div>
            <div className="flex-1 pt-1">
               <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800">{title}</h4>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">{formatDateTime(tx.date)}</span>
               </div>
               <p className="text-slate-600 text-sm mt-1">{description}</p>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
       <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800">Tra cứu Serial</h2>
          <p className="text-slate-500 mt-2">Truy xuất lịch sử vòng đời chi tiết của từng máy RO.</p>
       </div>

       <form onSubmit={handleSearch} className="relative">
          <input 
            type="text"
            className="w-full p-4 pl-12 rounded-full border-2 border-slate-200 focus:border-water-500 outline-none shadow-sm text-lg"
            placeholder="Nhập số Serial (VD: SN-2023-001)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-5 text-slate-400" />
          <button type="submit" className="absolute right-2 top-2 bg-water-600 text-white px-6 py-2 rounded-full font-medium hover:bg-water-700 transition-colors">
            Tra cứu
          </button>
       </form>

       {searched && !result && (
         <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">Không tìm thấy dữ liệu cho mã "<span className="font-mono font-bold text-slate-700">{query}</span>"</p>
         </div>
       )}

       {result && (
         <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-fade-in-up">
            <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
               <div>
                 <p className="text-slate-300 text-sm">Số Serial</p>
                 <h3 className="text-2xl font-mono font-bold">{result.serialNumber}</h3>
               </div>
               <div className={`px-3 py-1 rounded text-sm font-bold flex items-center gap-2 ${result.status === 'NEW' ? 'bg-green-500' : 'bg-orange-500'}`}>
                 <CheckCircle size={14}/> {result.status}
               </div>
            </div>
            
            <div className="p-8">
               <div className="flex items-center gap-4 mb-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                     <MapPin size={24} />
                  </div>
                  <div>
                     <p className="text-xs text-blue-500 font-bold uppercase tracking-wider">Vị trí hiện tại</p>
                     <p className="text-xl font-bold text-slate-800">{result.warehouseLocation}</p>
                  </div>
               </div>

               <h4 className="font-bold text-slate-700 mb-6 border-b border-slate-100 pb-2">Hành trình sản phẩm</h4>
               
               <div className="pl-2">
                 {history.length > 0 ? (
                    history.map((tx, idx) => renderTimelineEvent(tx, idx))
                 ) : (
                    <p className="text-slate-400 italic">Chưa có lịch sử giao dịch.</p>
                 )}
               </div>
              
               <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-sm">
                 <div className="flex items-center gap-2">
                    <Box size={18} className="text-slate-400"/>
                    <span className="text-slate-500">Thông tin Sản phẩm</span>
                 </div>
                 <div className="text-right">
                    {productInfo ? (
                        <>
                            <p className="font-bold text-slate-800 text-base">{productInfo.model}</p>
                            <p className="text-xs text-slate-500">{productInfo.brand}</p>
                        </>
                    ) : (
                        <span className="font-mono font-semibold text-slate-700">{result.productId}</span>
                    )}
                 </div>
              </div>
            </div>
         </div>
       )}
    </div>
  );
};