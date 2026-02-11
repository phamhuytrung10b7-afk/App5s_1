import React, { useState } from 'react';
import { inventoryService } from './inventoryService';
import { Product, Warehouse, Customer } from './types';
import { Plus, Trash2, Save, Settings as SettingsIcon, AlertCircle, Warehouse as WarehouseIcon, MapPin, Users, Store, Box, AlertTriangle, RefreshCw } from 'lucide-react';

export const Settings: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(inventoryService.getProducts());
  const [warehouses, setWarehouses] = useState<Warehouse[]>(inventoryService.getWarehouses());
  const [customers, setCustomers] = useState<Customer[]>(inventoryService.getCustomers());
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    model: '',
    brand: '',
    specs: ''
  });

  const [newWarehouse, setNewWarehouse] = useState({ name: '', address: '' });
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', type: 'DEALER' as 'DEALER' | 'RETAIL' });
  const [error, setError] = useState<string | null>(null);

  // Reset State
  const [resetStep, setResetStep] = useState(0); // 0: Normal, 1: Confirm

  // --- Product Handlers ---
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.model || !newProduct.brand) {
      setError("Vui lòng nhập Tên Model và Thương hiệu");
      return;
    }

    const product: Product = {
      id: `p-${Date.now()}`,
      model: newProduct.model!,
      brand: newProduct.brand!,
      specs: newProduct.specs || ''
    };

    inventoryService.addProduct(product);
    setProducts([...inventoryService.getProducts()]);
    setNewProduct({
      model: '',
      brand: '',
      specs: ''
    });
    setError(null);
  };

  const handleDeleteProduct = (id: string) => {
    try {
      inventoryService.deleteProduct(id);
      setProducts([...inventoryService.getProducts()]);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- Warehouse Handlers ---
  const handleAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouse.name) {
      setError("Vui lòng nhập Tên Kho");
      return;
    }
    const wh: Warehouse = {
      id: `wh-${Date.now()}`,
      name: newWarehouse.name,
      address: newWarehouse.address
    };
    inventoryService.addWarehouse(wh);
    setWarehouses([...inventoryService.getWarehouses()]);
    setNewWarehouse({ name: '', address: '' });
    setError(null);
  }

  const handleDeleteWarehouse = (id: string) => {
    try {
      inventoryService.deleteWarehouse(id);
      setWarehouses([...inventoryService.getWarehouses()]);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  // --- Customer Handlers ---
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) {
      setError("Vui lòng nhập Tên Khách hàng / Đại lý");
      return;
    }
    const cus: Customer = {
      id: `cus-${Date.now()}`,
      name: newCustomer.name,
      phone: newCustomer.phone,
      type: newCustomer.type
    };
    inventoryService.addCustomer(cus);
    setCustomers([...inventoryService.getCustomers()]);
    setNewCustomer({ name: '', phone: '', type: 'DEALER' });
    setError(null);
  }

  const handleDeleteCustomer = (id: string) => {
    inventoryService.deleteCustomer(id);
    setCustomers([...inventoryService.getCustomers()]);
  }

  // --- Reset Handler ---
  const handleReset = () => {
    if (resetStep === 0) {
      setResetStep(1);
    } else {
      inventoryService.resetDatabase();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-3 mb-2">
         <div className="bg-slate-200 p-3 rounded-full text-slate-700">
            <SettingsIcon />
         </div>
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Cấu hình Hệ thống</h2>
            <p className="text-slate-500">Quản lý danh mục Sản phẩm, Kho bãi và Đối tác.</p>
         </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* --- Warehouse Configuration Section --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <WarehouseIcon className="text-blue-600" size={24}/>
            <h3 className="text-xl font-bold text-slate-800">Quản lý Kho hàng</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-slate-50 p-6 rounded-lg border border-slate-200 h-fit">
               <h4 className="font-bold text-slate-700 mb-4">Thêm Kho Mới</h4>
               <form onSubmit={handleAddWarehouse} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Tên Kho *</label>
                    <input 
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                      placeholder="VD: Kho Chi nhánh Đà Nẵng"
                      value={newWarehouse.name}
                      onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Địa chỉ</label>
                    <input 
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-400 outline-none"
                      placeholder="Địa chỉ vật lý..."
                      value={newWarehouse.address}
                      onChange={e => setNewWarehouse({...newWarehouse, address: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 flex justify-center items-center gap-2">
                    <Plus size={18} /> Thêm Kho
                  </button>
               </form>
            </div>

            <div className="md:col-span-2">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {warehouses.map(wh => (
                    <div key={wh.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-start hover:border-blue-300 transition-colors bg-white">
                       <div>
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                             <WarehouseIcon size={16} className="text-blue-500" />
                             {wh.name}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                             <MapPin size={14} />
                             {wh.address || 'Chưa cập nhật địa chỉ'}
                          </div>
                       </div>
                       <button onClick={() => handleDeleteWarehouse(wh.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

       {/* --- Customer/Dealer Configuration Section --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Users className="text-orange-600" size={24}/>
            <h3 className="text-xl font-bold text-slate-800">Quản lý Khách hàng / Đại lý</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-slate-50 p-6 rounded-lg border border-slate-200 h-fit">
               <h4 className="font-bold text-slate-700 mb-4">Thêm Đối tác Mới</h4>
               <form onSubmit={handleAddCustomer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Tên Khách / Đại lý *</label>
                    <input 
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-400 outline-none"
                      placeholder="VD: Đại lý Nguyễn Văn A"
                      value={newCustomer.name}
                      onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Số điện thoại</label>
                    <input 
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-400 outline-none"
                      placeholder="VD: 090xxxxxxx"
                      value={newCustomer.phone}
                      onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Loại hình</label>
                    <select 
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-400 outline-none"
                      value={newCustomer.type}
                      onChange={e => setNewCustomer({...newCustomer, type: e.target.value as any})}
                    >
                      <option value="DEALER">Đại lý phân phối</option>
                      <option value="RETAIL">Khách lẻ</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700 flex justify-center items-center gap-2">
                    <Plus size={18} /> Thêm Đối tác
                  </button>
               </form>
            </div>

            <div className="md:col-span-2">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customers.map(cus => (
                    <div key={cus.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-start hover:border-orange-300 transition-colors bg-white">
                       <div>
                          <div className="flex items-center gap-2 font-bold text-slate-800">
                             {cus.type === 'DEALER' ? <Store size={16} className="text-orange-500" /> : <Users size={16} className="text-green-500" />}
                             {cus.name}
                          </div>
                          <div className="text-sm text-slate-500 mt-1 pl-6">
                             {cus.phone ? `SĐT: ${cus.phone}` : 'Chưa có SĐT'}
                             <span className="block text-xs text-slate-400 mt-0.5">{cus.type === 'DEALER' ? 'Đại lý' : 'Khách lẻ'}</span>
                          </div>
                       </div>
                       <button onClick={() => handleDeleteCustomer(cus.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* --- Product Configuration Section --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <SettingsIcon className="text-water-600" size={24}/>
            <h3 className="text-xl font-bold text-slate-800">Cấu hình Sản phẩm</h3>
         </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Add Product */}
          <div className="lg:col-span-1">
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 h-fit">
              <h4 className="font-bold text-slate-700 mb-4">Thêm Model Mới</h4>
              <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Tên Model *</label>
                    <input 
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-water-400 outline-none"
                      placeholder="VD: RO-Karofi-K9"
                      value={newProduct.model}
                      onChange={e => setNewProduct({...newProduct, model: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Thương hiệu *</label>
                    <input 
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-water-400 outline-none"
                      placeholder="VD: Karofi"
                      value={newProduct.brand}
                      onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Quy cách / Thông số</label>
                    <input 
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-water-400 outline-none"
                      placeholder="VD: 9 Lõi, Tủ đứng"
                      value={newProduct.specs}
                      onChange={e => setNewProduct({...newProduct, specs: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-lg font-medium hover:bg-slate-700 mt-4 flex justify-center items-center gap-2">
                    <Save size={18} /> Lưu Model
                  </button>
              </form>
            </div>
          </div>

          {/* Product List */}
          <div className="lg:col-span-2">
             <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                   <h4 className="font-bold text-slate-700">Danh sách Model Máy ({products.length})</h4>
                </div>
                <div className="divide-y divide-slate-100">
                   {products.map(p => (
                     <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                        <div className="w-10 h-10 bg-water-50 rounded flex items-center justify-center text-water-600">
                           <Box size={20} />
                        </div>
                        <div className="flex-1">
                           <h4 className="font-bold text-slate-800">{p.model}</h4>
                           <p className="text-sm text-slate-500">{p.brand} • {p.specs}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                          title="Xóa Model"
                        >
                          <Trash2 size={18} />
                        </button>
                     </div>
                   ))}
                   {products.length === 0 && (
                     <div className="p-8 text-center text-slate-400">
                       Chưa có model nào. Hãy thêm mới bên trái.
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- DANGER ZONE --- */}
      <div className="bg-red-50 p-6 rounded-xl border border-red-100 mt-12">
        <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-600" size={24}/>
            <h3 className="text-xl font-bold text-red-800">Khu vực nguy hiểm</h3>
        </div>
        <p className="text-red-700 mb-6 text-sm">
          Thao tác dưới đây sẽ xóa toàn bộ dữ liệu (Sản phẩm, Kho, Khách hàng, Lịch sử nhập xuất...) và đưa hệ thống về trạng thái ban đầu. Dữ liệu không thể khôi phục.
        </p>

        <button 
          onClick={handleReset}
          className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm ${
             resetStep === 0 
             ? 'bg-white text-red-600 border border-red-200 hover:bg-red-100' 
             : 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
          }`}
        >
          {resetStep === 0 ? <RefreshCw size={18} /> : <AlertTriangle size={18} />}
          {resetStep === 0 ? 'Khôi phục dữ liệu gốc' : 'BẤM LẦN NỮA ĐỂ XÁC NHẬN XÓA HẾT'}
        </button>
        {resetStep === 1 && (
           <p className="mt-2 text-xs text-red-500 font-bold">Cảnh báo: Hành động này không thể hoàn tác!</p>
        )}
      </div>
    </div>
  );
};