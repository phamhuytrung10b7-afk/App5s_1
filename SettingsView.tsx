import React, { useState } from 'react';
import { AppSettings } from './types';
import { storageService } from './storage';
import {
  Settings,
  Building2,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Users,
  FileText,
  FileCode,
  Plus,
  Trash2,
  Database,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onRefreshAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onRefreshAll,
}) => {
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [warehouseName, setWarehouseName] = useState(settings.warehouseName);
  const [address, setAddress] = useState(settings.address);
  const [managerName, setManagerName] = useState(settings.managerName);
  const [phone, setPhone] = useState(settings.phone);

  // Preset lists
  const [staffList, setStaffList] = useState<string[]>(settings.staffList || []);
  const [newStaff, setNewStaff] = useState('');

  const [stockInReasons, setStockInReasons] = useState<string[]>(settings.stockInReasons || []);
  const [newInReason, setNewInReason] = useState('');

  const [stockOutPurposes, setStockOutPurposes] = useState<string[]>(settings.stockOutPurposes || []);
  const [newOutPurpose, setNewOutPurpose] = useState('');

  const [productionOrders, setProductionOrders] = useState<string[]>(settings.productionOrders || []);
  const [newLSX, setNewLSX] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [pendingRestoreContent, setPendingRestoreContent] = useState<string | null>(null);
  const [pendingRestoreFileName, setPendingRestoreFileName] = useState<string>('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      companyName: companyName.trim(),
      warehouseName: warehouseName.trim(),
      address: address.trim(),
      managerName: managerName.trim(),
      phone: phone.trim(),
      staffList,
      stockInReasons,
      stockOutPurposes,
      productionOrders,
    };
    storageService.saveSettings(updated);
    onUpdateSettings(updated);
    setMessage({ type: 'success', text: 'Đã lưu tất cả thông tin cài đặt thành công!' });
  };

  // Staff helpers
  const handleAddStaff = () => {
    if (!newStaff.trim()) return;
    if (staffList.includes(newStaff.trim())) {
      setMessage({ type: 'error', text: 'Tên người thực hiện này đã tồn tại trong danh sách!' });
      return;
    }
    setStaffList([...staffList, newStaff.trim()]);
    setNewStaff('');
  };
  const handleDeleteStaff = (idx: number) => {
    setStaffList(staffList.filter((_, i) => i !== idx));
  };

  // Stock In Reason helpers
  const handleAddInReason = () => {
    if (!newInReason.trim()) return;
    setStockInReasons([...stockInReasons, newInReason.trim()]);
    setNewInReason('');
  };
  const handleDeleteInReason = (idx: number) => {
    setStockInReasons(stockInReasons.filter((_, i) => i !== idx));
  };

  // Stock Out Purpose helpers
  const handleAddOutPurpose = () => {
    if (!newOutPurpose.trim()) return;
    setStockOutPurposes([...stockOutPurposes, newOutPurpose.trim()]);
    setNewOutPurpose('');
  };
  const handleDeleteOutPurpose = (idx: number) => {
    setStockOutPurposes(stockOutPurposes.filter((_, i) => i !== idx));
  };

  // Production Order helpers
  const handleAddLSX = () => {
    if (!newLSX.trim()) return;
    setProductionOrders([...productionOrders, newLSX.trim()]);
    setNewLSX('');
  };
  const handleDeleteLSX = (idx: number) => {
    setProductionOrders(productionOrders.filter((_, i) => i !== idx));
  };

  const handleBackup = () => {
    const jsonStr = storageService.backupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_kho_linh_kien_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Đã tải xuống tệp sao lưu dữ liệu JSON thành công!' });
  };

  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingRestoreFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setPendingRestoreContent(content);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const confirmRestoreFile = () => {
    if (!pendingRestoreContent) return;
    const success = storageService.restoreData(pendingRestoreContent);
    if (success) {
      setMessage({ type: 'success', text: 'Khôi phục dữ liệu từ tệp JSON thành công!' });
      onRefreshAll();
    } else {
      setMessage({ type: 'error', text: 'Tệp sao lưu không hợp lệ hoặc bị hỏng!' });
    }
    setPendingRestoreContent(null);
    setPendingRestoreFileName('');
  };

  const confirmResetSample = () => {
    storageService.resetToSampleData();
    setMessage({ type: 'success', text: 'Đã khôi phục dữ liệu mẫu ban đầu thành công!' });
    setIsResetModalOpen(false);
    onRefreshAll();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">CÀI ĐẶT HỆ THỐNG & DANH MỤC LỌC NHANH</h2>
          <p className="text-xs text-slate-500">
            Cấu hình nhân sự, lý do nhập/xuất kho, mã LSX và tiêu đề in thẻ kho.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Warehouse Header Config Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="font-bold text-slate-800 text-sm flex items-center">
            <Building2 className="w-4 h-4 text-blue-600 mr-2" />
            Thông Tin Doanh Nghiệp & Nhà Kho (In trên Thẻ Kho)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Công Ty / Doanh Nghiệp</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Nhà Kho / Phân Xưởng</label>
              <input
                type="text"
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Địa Chỉ Nhà Kho</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Họ Tên Thủ Kho / Quản Lý Kho</label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* CÀI ĐẶT NGƯỜI THỰC HIỆN / THỦ KHO */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center">
              <Users className="w-4 h-4 text-emerald-600 mr-2" />
              Cài Đặt Danh Sách Người Thực Hiện (Người Nhập / Người Xuất Kho)
            </h3>
            <span className="text-xs text-slate-400 font-medium">{staffList.length} nhân sự</span>
          </div>
          <p className="text-xs text-slate-500">
            Giúp chọn nhanh trong phiếu Nhập / Xuất kho mà không cần gõ lại. Dễ dàng thêm 1 hoặc 2 thủ kho mặc định.
          </p>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newStaff}
              onChange={(e) => setNewStaff(e.target.value)}
              placeholder="Thêm tên nhân sự (VD: Nguyễn Văn A (Thủ kho)...)"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
            <button
              type="button"
              onClick={handleAddStaff}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center space-x-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Nhân Sự</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {staffList.map((st, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <span>{st}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteStaff(idx)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                  title="Xóa khỏi danh sách"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CÀI ĐẶT LÝ DO NHẬP KHO & MỤC ĐÍCH XUẤT KHO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stock In Reasons */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center">
              <FileText className="w-4 h-4 text-emerald-600 mr-2" />
              Cài Đặt Lý Do Nhập Kho
            </h3>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newInReason}
                onChange={(e) => setNewInReason(e.target.value)}
                placeholder="Thêm lý do nhập kho mới..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddInReason}
                className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                + Thêm
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {stockInReasons.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                >
                  <span className="truncate pr-2">{r}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteInReason(idx)}
                    className="p-1 text-slate-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Out Purposes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center">
              <FileText className="w-4 h-4 text-blue-600 mr-2" />
              Cài Đặt Mục Đích Xuất Kho
            </h3>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newOutPurpose}
                onChange={(e) => setNewOutPurpose(e.target.value)}
                placeholder="Thêm mục đích xuất kho..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddOutPurpose}
                className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                + Thêm
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {stockOutPurposes.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                >
                  <span className="truncate pr-2">{p}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteOutPurpose(idx)}
                    className="p-1 text-slate-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CÀI ĐẶT MÃ LỆNH SẢN XUẤT (LSX) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center">
              <FileCode className="w-4 h-4 text-purple-600 mr-2" />
              Cài Đặt Mã Lệnh Sản Xuất (LSX Mặc Định Để Chọn Trực Tiếp)
            </h3>
            <span className="text-xs text-slate-400 font-medium">{productionOrders.length} mã LSX</span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newLSX}
              onChange={(e) => setNewLSX(e.target.value)}
              placeholder="Thêm mã LSX mới (VD: LSX-2026-HL300)..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-700 focus:ring-2 focus:ring-purple-500 outline-hidden"
            />
            <button
              type="button"
              onClick={handleAddLSX}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
            >
              + Thêm LSX
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {productionOrders.map((lsx, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs font-mono font-bold"
              >
                <span>{lsx}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteLSX(idx)}
                  className="text-purple-400 hover:text-red-600"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* QUẢN LÝ ĐỊNH MỨC MODEL (BOM) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center">
              <FileCode className="w-4 h-4 text-pink-600 mr-2" />
              Quản Lý Định Mức Model (BOM)
            </h3>
            <span className="text-xs text-slate-400 font-medium">{storageService.getModelBOMs().length} Models</span>
          </div>
          <p className="text-xs text-slate-500">
            Tải lên file Excel định mức linh kiện cho từng Model (Lệnh sản xuất).
            Hệ thống sẽ dựa vào định mức này để xuất kho tự động hàng loạt.
          </p>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              id="modelBOMName"
              placeholder="Tên Model (VD: APB3551)..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-pink-700 focus:ring-2 focus:ring-pink-500 outline-hidden"
            />
            <label className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center space-x-1">
              <Upload className="w-4 h-4" />
              <span>Nhập Từ Excel</span>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => {
                const nameInput = document.getElementById('modelBOMName') as HTMLInputElement;
                const name = nameInput.value.trim();
                if (!name) {
                  setMessage({ type: 'error', text: 'Vui lòng nhập tên Model trước khi tải lên Excel!' });
                  e.target.value = '';
                  return;
                }
                const file = e.target.files?.[0];
                if (!file) return;

                import('xlsx').then(XLSX => {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const rawRows = XLSX.utils.sheet_to_json(worksheet);

                    const result = storageService.importModelBOMFromRows(rawRows, name);
                    if (result.added > 0) {
                      setMessage({ type: 'success', text: `Đã lưu định mức cho Model ${result.name} với ${result.added} linh kiện!` });
                      nameInput.value = '';
                      onRefreshAll(); // Refresh to update count
                    } else {
                      setMessage({ type: 'error', text: 'Không tìm thấy dữ liệu hợp lệ trong file Excel!' });
                    }
                  };
                  reader.readAsArrayBuffer(file);
                });
                e.target.value = '';
              }} />
            </label>
          </div>

          <div className="flex flex-col gap-2 pt-1 max-h-60 overflow-y-auto">
            {storageService.getModelBOMs().map((bom, idx) => (
              <div
                key={bom.id}
                className="flex items-center justify-between p-3 bg-pink-50 border border-pink-200 text-pink-900 rounded-xl text-xs font-mono"
              >
                <div>
                  <strong className="text-sm">{bom.name}</strong>
                  <p className="text-[10px] text-pink-600 font-sans mt-0.5">{bom.items.length} linh kiện trong định mức</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    storageService.deleteModelBOM(bom.id);
                    onRefreshAll();
                    setMessage({ type: 'success', text: `Đã xóa Model BOM ${bom.name}` });
                  }}
                  className="p-1.5 bg-white text-pink-400 hover:text-red-600 rounded-lg shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-lg transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Tất Cả Cài Đặt Hệ Thống</span>
          </button>
        </div>
      </form>

      {/* BACKUP & RESTORE SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center">
          <Database className="w-4 h-4 text-emerald-600 mr-2" />
          Sao Lưu & Khôi Phục Dữ Liệu An Toàn
        </h3>
        <p className="text-xs text-slate-500">
          Toàn bộ dữ liệu linh kiện, lịch sử thẻ kho và phiếu kiểm kê có thể sao lưu thành tệp JSON để cất giữ hoặc chuyển đổi máy tính.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Export Backup */}
          <button
            onClick={handleBackup}
            className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer group"
          >
            <Download className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Sao Lưu Dữ Liệu (Backup)</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Tải tệp .JSON về máy</span>
          </button>

          {/* Import Restore */}
          <label className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer group">
            <Upload className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Khôi Phục (Restore)</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Chọn tệp .JSON từ máy</span>
            <input type="file" accept=".json" onChange={handleRestoreFileSelected} className="hidden" />
          </label>

          {/* Reset to sample */}
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer group"
          >
            <RotateCcw className="w-8 h-8 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800">Khôi Phục Dữ Liệu Mẫu</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Reset về linh kiện mặc định</span>
          </button>
        </div>
      </div>

      {/* Custom Reset Sample Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="p-3 bg-amber-100 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Xác Nhận Khôi Phục Dữ Liệu Mẫu</h3>
                <p className="text-xs text-slate-500">Đặt lại toàn bộ dữ liệu hệ thống</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 leading-relaxed space-y-1">
              <p className="font-bold text-amber-900">⚠️ Bạn có chắc chắn muốn làm mới lại dữ liệu?</p>
              <p>
                Toàn bộ dữ liệu linh kiện hiện tại, lịch sử nhập xuất, phiếu kiểm kê và lô mốc Cont sẽ bị xóa sạch và reset về danh sách linh kiện điện tử mẫu ban đầu.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmResetSample}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-colors flex items-center space-x-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Đồng Ý Khôi Phục Dữ Liệu Mẫu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Restore File Confirmation Modal */}
      {pendingRestoreContent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 text-blue-600">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Xác Nhận Khôi Phục Tệp Sao Lưu</h3>
                <p className="text-xs text-slate-500 font-mono">{pendingRestoreFileName}</p>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 leading-relaxed">
              Dữ liệu từ tệp JSON này sẽ ghi đè lên kho dữ liệu hiện tại. Bạn có muốn tiếp tục không?
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPendingRestoreContent(null);
                  setPendingRestoreFileName('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmRestoreFile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-colors"
              >
                Xác Nhận Khôi Phục File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
