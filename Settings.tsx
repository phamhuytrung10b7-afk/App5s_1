
import React, { useState } from 'react';
import { inventoryService } from './inventoryService';
import { exportFullDatabase } from './reportService';
import { Product, Warehouse, Customer } from './types';
import { Settings as SettingsIcon, Box, Warehouse as WarehouseIcon, Users, Plus, Trash2, Database, Download, RefreshCw, AlertTriangle } from 'lucide-react';

export const Settings: React.FC = () => {
  const [products, setProducts] = useState(inventoryService.getProducts());
  const [warehouses, setWarehouses] = useState(inventoryService.getWarehouses());
  const [customers, setCustomers] = useState(inventoryService.getCustomers());
  
  const [newP, setNewP] = useState({ model: '', brand: '', specs: '' });
  const [newW, setNewW] = useState({ name: '', address: '' });
  const [newC, setNewC] = useState({ name: '', phone: '', type: 'DEALER' as 'DEALER' | 'RETAIL' });

  const refresh = () => { setProducts([...inventoryService.getProducts()]); setWarehouses([...inventoryService.getWarehouses()]); setCustomers([...inventoryService.getCustomers()]); };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-3">
         <SettingsIcon />
         <h2 className="text-2xl font-bold">Cấu hình Hệ thống</h2>
      </div>

      <div className="bg-white p-6 rounded-xl border flex justify-between items-center">
         <div><h3 className="font-bold">Sao lưu & Báo cáo</h3><p className="text-sm text-slate-500">Tải toàn bộ dữ liệu máy chủ về máy tính (.xlsx).</p></div>
         <button onClick={exportFullDatabase} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"><Download size={20}/> Tải FULL Excel</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Model Section */}
         <div className="bg-white p-6 rounded-xl border space-y-4">
            <h4 className="font-bold border-b pb-2 flex items-center gap-2"><Box size={18}/> Thêm Model</h4>
            <input className="w-full p-2 border rounded" placeholder="Tên Model" value={newP.model} onChange={e => setNewP({...newP, model: e.target.value})} />
            <input className="w-full p-2 border rounded" placeholder="Thương hiệu" value={newP.brand} onChange={e => setNewP({...newP, brand: e.target.value})} />
            <button onClick={() => { inventoryService.addProduct({ id: `p-${Date.now()}`, ...newP }); refresh(); setNewP({model:'', brand:'', specs:''}); }} className="w-full bg-slate-800 text-white py-2 rounded">+ Thêm</button>
            <div className="space-y-1 mt-4">
               {products.map(p => (<div key={p.id} className="flex justify-between text-sm p-2 bg-slate-50 rounded"><span>{p.model}</span><button onClick={() => { inventoryService.deleteProduct(p.id); refresh(); }}><Trash2 size={14}/></button></div>))}
            </div>
         </div>

         {/* Warehouse Section */}
         <div className="bg-white p-6 rounded-xl border space-y-4">
            <h4 className="font-bold border-b pb-2 flex items-center gap-2"><WarehouseIcon size={18}/> Thêm Kho</h4>
            <input className="w-full p-2 border rounded" placeholder="Tên Kho" value={newW.name} onChange={e => setNewW({...newW, name: e.target.value})} />
            <button onClick={() => { inventoryService.addWarehouse({ id: `w-${Date.now()}`, ...newW }); refresh(); setNewW({name:'', address:''}); }} className="w-full bg-blue-600 text-white py-2">+ Thêm</button>
            <div className="space-y-1 mt-4">
               {warehouses.map(w => (<div key={w.id} className="flex justify-between text-sm p-2 bg-slate-50 rounded"><span>{w.name}</span><button onClick={() => { inventoryService.deleteWarehouse(w.id); refresh(); }}><Trash2 size={14}/></button></div>))}
            </div>
         </div>

         {/* Customer Section */}
         <div className="bg-white p-6 rounded-xl border space-y-4">
            <h4 className="font-bold border-b pb-2 flex items-center gap-2"><Users size={18}/> Thêm Đối tác</h4>
            <input className="w-full p-2 border rounded" placeholder="Tên Đại lý" value={newC.name} onChange={e => setNewC({...newC, name: e.target.value})} />
            <select className="w-full p-2 border rounded" value={newC.type} onChange={e => setNewC({...newC, type: e.target.value as any})}><option value="DEALER">Đại lý</option><option value="RETAIL">Khách lẻ</option></select>
            <button onClick={() => { inventoryService.addCustomer({ id: `c-${Date.now()}`, ...newC }); refresh(); setNewC({name:'', phone:'', type:'DEALER'}); }} className="w-full bg-orange-600 text-white py-2">+ Thêm</button>
            <div className="space-y-1 mt-4">
               {customers.map(c => (<div key={c.id} className="flex justify-between text-sm p-2 bg-slate-50 rounded"><span>{c.name}</span><button onClick={() => { inventoryService.deleteCustomer(c.id); refresh(); }}><Trash2 size={14}/></button></div>))}
            </div>
         </div>
      </div>

      <div className="bg-red-50 p-6 rounded-xl border border-red-200">
         <h3 className="font-bold text-red-800 flex items-center gap-2"><AlertTriangle/> Khu vực nguy hiểm</h3>
         <p className="text-sm text-red-600 mb-4">Xóa toàn bộ dữ liệu và reset hệ thống về ban đầu.</p>
         <button onClick={() => { if(confirm('Bấm OK để xóa sạch dữ liệu?')) inventoryService.resetDatabase(); }} className="bg-red-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2"><RefreshCw size={18}/> Reset Database</button>
      </div>
    </div>
  );
};
