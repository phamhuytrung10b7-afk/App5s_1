
import React, { useState, useEffect } from 'react';
import { inventoryService } from './inventoryService';
import { exportFullDatabase } from './services/reportService';
import { Product, Warehouse, Customer } from './types';
import { 
  Plus, 
  Trash2, 
  Settings as SettingsIcon, 
  AlertCircle, 
  Warehouse as WarehouseIcon, 
  Users, 
  Store, 
  Box, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Download,
  CheckCircle,
  X,
  Edit,
  Save
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ model: '', brand: '', specs: '' });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductData, setEditProductData] = useState<Partial<Product>>({});

  const [newWarehouse, setNewWarehouse] = useState({ name: '', address: '' });
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [editWarehouseData, setEditWarehouseData] = useState<Partial<Warehouse>>({});

  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', type: 'DEALER' as 'DEALER' | 'RETAIL' });
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editCustomerData, setEditCustomerData] = useState<Partial<Customer>>({});
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState(0);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setProducts([...inventoryService.getProducts()]);
    setWarehouses([...inventoryService.getWarehouses()]);
    setCustomers([...inventoryService.getCustomers()]);
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 3000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setSuccess(null);
    setTimeout(() => setError(null), 5000);
  };

  // --- MODEL ACTIONS ---
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.model || !newProduct.brand) { showError("Vui lòng nhập Model và Thương hiệu"); return; }
    inventoryService.addProduct({ id: `p-${Date.now()}`, model: newProduct.model!, brand: newProduct.brand!, specs: newProduct.specs || '' });
    refreshData();
    setNewProduct({ model: '', brand: '', specs: '' });
    showSuccess("Đã thêm Model sản phẩm thành công.");
  };

  const handleStartEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setEditProductData({ ...p });
  };

  const handleSaveEditProduct = () => {
    if (!editingProductId) return;
    inventoryService.updateProduct(editingProductId, editProductData);
    setEditingProductId(null);
    refreshData();
    showSuccess("Đã cập nhật thông tin Model.");
  };

  const handleDeleteProduct = (id: string) => {
    try {
      if (window.confirm("Bạn có chắc muốn xóa Model này?")) {
        inventoryService.deleteProduct(id);
        refreshData();
        showSuccess("Đã xóa Model thành công.");
      }
    } catch (err: any) {
      showError(err.message || "Không thể xóa Model này.");
    }
  };

  // --- WAREHOUSE ACTIONS ---
  const handleAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouse.name) { showError("Vui lòng nhập Tên Kho"); return; }
    inventoryService.addWarehouse({ id: `wh-${Date.now()}`, name: newWarehouse.name, address: newWarehouse.address });
    refreshData();
    setNewWarehouse({ name: '', address: '' });
    showSuccess("Đã thêm Kho hàng mới.");
  };

  const handleStartEditWarehouse = (wh: Warehouse) => {
    setEditingWarehouseId(wh.id);
    setEditWarehouseData({ ...wh });
  };

  const handleSaveEditWarehouse = () => {
    if (!editingWarehouseId) return;
    inventoryService.updateWarehouse(editingWarehouseId, editWarehouseData);
    setEditingWarehouseId(null);
    refreshData();
    showSuccess("Đã cập nhật thông tin Kho.");
  };

  const handleDeleteWarehouse = (id: string) => {
    try {
      if (window.confirm("Xác nhận xóa kho này?")) {
        inventoryService.deleteWarehouse(id);
        refreshData();
        showSuccess("Đã xóa kho hàng.");
      }
    } catch (err: any) {
      showError(err.message || "Lỗi khi xóa kho.");
    }
  };

  // --- CUSTOMER ACTIONS ---
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) { showError("Vui lòng nhập tên đối tác"); return; }
    inventoryService.addCustomer({ id: `cus-${Date.now()}`, name: newCustomer.name, phone: newCustomer.phone, type: newCustomer.type });
    refreshData();
    setNewCustomer({ name: '', phone: '', type: 'DEALER' });
    showSuccess("Đã thêm đối tác mới.");
  };

  const handleStartEditCustomer = (cus: Customer) => {
    setEditingCustomerId(cus.id);
    setEditCustomerData({ ...cus });
  };

  const handleSaveEditCustomer = () => {
    if (!editingCustomerId) return;
    inventoryService.updateCustomer(editingCustomerId, editCustomerData);
    setEditingCustomerId(null);
    refreshData();
    showSuccess("Đã cập nhật thông tin Đối tác.");
  };

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm("Xác nhận xóa đối tác này?")) {
      inventoryService.deleteCustomer(id);
      refreshData();
      showSuccess("Đã xóa đối tác.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 relative">
      <div className="flex items-center gap-3">
         <div className="bg-slate-200 p-3 rounded-full text-slate-700"><SettingsIcon /></div>
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Cấu hình Hệ thống</h2>
            <p className="text-slate-500 text-sm">Quản lý danh mục Model, Kho bãi và Đối tác của bạn.</p>
         </div>
      </div>

      {(success || error) && (
        <div className={`p-4 rounded-lg flex items-center gap-2 shadow-sm border animate-fade-in ${success ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{success || error}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <Database className="text-purple-600" size={32}/>
            <div><h3 className="text-lg font-bold text-slate-800">Dữ liệu & Báo cáo</h3><p className="text-sm text-slate-500">Sao lưu toàn bộ dữ liệu hệ thống ra file Excel.</p></div>
         </div>
         <button onClick={exportFullDatabase} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 flex items-center gap-2 shadow-md active:scale-95 transition-all"><Download size={20} /> Tải dữ liệu FULL (.xlsx)</button>
      </div>

      {/* MODEL SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6 border-b pb-4"><Box className="text-water-600" size={24}/><h3 className="text-xl font-bold text-slate-800">Danh mục Sản phẩm (Model)</h3></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
            <h4 className="font-bold mb-4 text-slate-700 text-sm uppercase">Thêm Model RO</h4>
            <form onSubmit={handleAddProduct} className="space-y-4">
               <input className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-water-400" placeholder="Tên Model *" value={newProduct.model} onChange={e => setNewProduct({...newProduct, model: e.target.value})} />
               <input className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-water-400" placeholder="Thương hiệu *" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} />
               <input className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-water-400" placeholder="Thông số" value={newProduct.specs} onChange={e => setNewProduct({...newProduct, specs: e.target.value})} />
               <button type="submit" className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-bold hover:bg-slate-700 flex justify-center items-center gap-2 transition-colors"><Plus size={18}/> Lưu Model</button>
            </form>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
             {products.map(p => (
               <div key={p.id} className={`p-4 bg-white border rounded-xl flex items-center justify-between shadow-sm transition-all ${editingProductId === p.id ? 'ring-2 ring-water-400 border-water-300 bg-water-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  {editingProductId === p.id ? (
                    <div className="w-full space-y-2 pr-4">
                       <input className="w-full p-1 text-sm border rounded outline-none focus:border-water-500" value={editProductData.model} onChange={e => setEditProductData({...editProductData, model: e.target.value})} />
                       <input className="w-full p-1 text-xs border rounded outline-none focus:border-water-500" value={editProductData.brand} onChange={e => setEditProductData({...editProductData, brand: e.target.value})} />
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-slate-800">{p.model}</div>
                      <div className="text-[11px] text-slate-500">{p.brand} • {p.specs}</div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    {editingProductId === p.id ? (
                      <button onClick={handleSaveEditProduct} className="p-2 text-green-600 hover:bg-green-100 rounded-lg" title="Lưu"><Save size={18}/></button>
                    ) : (
                      <button onClick={() => handleStartEditProduct(p)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Sửa"><Edit size={16}/></button>
                    )}
                    <button 
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Xóa Model"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
               </div>
             ))}
             {products.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 border border-dashed rounded-xl">Chưa có sản phẩm nào.</div>}
          </div>
        </div>
      </div>

      {/* WAREHOUSE SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-2 mb-6 border-b pb-4"><WarehouseIcon className="text-blue-600" size={24}/><h3 className="text-xl font-bold text-slate-800">Quản lý Kho hàng</h3></div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
               <h4 className="font-bold mb-4 text-slate-700 text-sm uppercase">Thêm Kho</h4>
               <form onSubmit={handleAddWarehouse} className="space-y-4">
                  <input className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Tên Kho *" value={newWarehouse.name} onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})} />
                  <input className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Địa chỉ" value={newWarehouse.address} onChange={e => setNewWarehouse({...newWarehouse, address: e.target.value})} />
                  <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"><Plus size={18}/> Thêm Kho</button>
               </form>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
               {warehouses.map(wh => (
                 <div key={wh.id} className={`p-4 border rounded-xl flex justify-between items-center shadow-sm transition-all ${editingWarehouseId === wh.id ? 'ring-2 ring-blue-400 border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><WarehouseIcon size={20}/></div>
                      {editingWarehouseId === wh.id ? (
                        <div className="space-y-1">
                          <input className="w-full p-1 text-sm border rounded outline-none focus:border-blue-500" value={editWarehouseData.name} onChange={e => setEditWarehouseData({...editWarehouseData, name: e.target.value})} />
                          <input className="w-full p-1 text-xs border rounded outline-none focus:border-blue-500" value={editWarehouseData.address} onChange={e => setEditWarehouseData({...editWarehouseData, address: e.target.value})} />
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-800">{wh.name}</div>
                          <div className="text-[10px] text-slate-500">{wh.address || 'N/A'}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {editingWarehouseId === wh.id ? (
                        <button onClick={handleSaveEditWarehouse} className="p-2 text-green-600 hover:bg-green-100 rounded-lg" title="Lưu"><Save size={18}/></button>
                      ) : (
                        <button onClick={() => handleStartEditWarehouse(wh)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Sửa"><Edit size={16}/></button>
                      )}
                      <button 
                        onClick={() => handleDeleteWarehouse(wh.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Xóa Kho"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                 </div>
               ))}
               {warehouses.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 border border-dashed rounded-xl">Hệ thống chưa có kho hàng nào.</div>}
            </div>
         </div>
      </div>

      {/* CUSTOMER SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-2 mb-6 border-b pb-4"><Users className="text-orange-600" size={24}/><h3 className="text-xl font-bold text-slate-800">Quản lý Đối tác (Đại lý)</h3></div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
               <h4 className="font-bold mb-4 text-slate-700 text-sm uppercase">Thêm Đại lý/Khách</h4>
               <form onSubmit={handleAddCustomer} className="space-y-4">
                  <input className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none" placeholder="Tên đối tác *" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                  <input className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none" placeholder="Số điện thoại" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                  <select className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none bg-white" value={newCustomer.type} onChange={e => setNewCustomer({...newCustomer, type: e.target.value as any})}>
                     <option value="DEALER">Đại lý</option>
                     <option value="RETAIL">Khách lẻ</option>
                  </select>
                  <button type="submit" className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-bold hover:bg-orange-700 flex items-center justify-center gap-2 transition-colors"><Plus size={18}/> Thêm Đối tác</button>
               </form>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
               {customers.map(cus => (
                 <div key={cus.id} className={`p-4 border rounded-xl flex justify-between items-center shadow-sm transition-all ${editingCustomerId === cus.id ? 'ring-2 ring-orange-400 border-orange-300 bg-orange-50' : 'bg-white border-slate-200 hover:border-orange-200 group'}`}>
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-lg ${cus.type === 'DEALER' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                          {cus.type === 'DEALER' ? <Store size={20}/> : <Users size={20}/>}
                       </div>
                       {editingCustomerId === cus.id ? (
                        <div className="space-y-1">
                          <input className="w-full p-1 text-sm border rounded outline-none focus:border-orange-500" value={editCustomerData.name} onChange={e => setEditCustomerData({...editCustomerData, name: e.target.value})} />
                          <input className="w-full p-1 text-xs border rounded outline-none focus:border-orange-500" value={editCustomerData.phone} onChange={e => setEditCustomerData({...editCustomerData, phone: e.target.value})} />
                        </div>
                       ) : (
                        <div>
                          <div className="font-bold text-slate-800">{cus.name}</div>
                          <div className="text-[10px] text-slate-500">{cus.phone || 'N/A'} • {cus.type === 'DEALER' ? 'Đại lý' : 'Khách lẻ'}</div>
                        </div>
                       )}
                    </div>
                    <div className="flex items-center gap-1">
                      {editingCustomerId === cus.id ? (
                        <button onClick={handleSaveEditCustomer} className="p-2 text-green-600 hover:bg-green-100 rounded-lg" title="Lưu"><Save size={18}/></button>
                      ) : (
                        <button onClick={() => handleStartEditCustomer(cus)} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg" title="Sửa"><Edit size={16}/></button>
                      )}
                      <button onClick={() => handleDeleteCustomer(cus.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all p-2">
                         <Trash2 size={16}/>
                      </button>
                    </div>
                 </div>
               ))}
               {customers.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 border border-dashed rounded-xl">Chưa có đối tác nào.</div>}
            </div>
         </div>
      </div>

      <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm">
         <div className="flex items-center gap-2 mb-4"><AlertTriangle className="text-red-600" size={24}/><h3 className="text-xl font-bold text-red-800">Khu vực nguy hiểm</h3></div>
         <p className="text-red-700 text-sm mb-6">Reset toàn bộ hệ thống về trạng thái ban đầu (Xóa sạch mọi thứ). Chỉ dùng khi muốn bắt đầu lại từ đầu.</p>
         <button onClick={() => { if(resetStep === 0) setResetStep(1); else inventoryService.resetDatabase(); }} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 ${resetStep === 0 ? 'bg-white text-red-600 border border-red-200 hover:bg-red-100' : 'bg-red-600 text-white animate-pulse'}`}>
            {resetStep === 0 ? <RefreshCw size={18}/> : <AlertTriangle size={18}/>}
            {resetStep === 0 ? 'Xóa sạch & Reset Hệ thống' : 'BẤM LẦN NỮA ĐỂ XÁC NHẬN XÓA TẤT CẢ'}
         </button>
      </div>
    </div>
  );
};
