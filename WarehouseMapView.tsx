import React, { useState } from 'react';
import { Part, AppSettings, WarehouseLocation } from './types';
import { storageService } from './storage';
import {
  MapPin,
  Plus,
  Trash2,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  Search,
  FileSpreadsheet,
  Boxes,
  ArrowRight,
  Info,
} from 'lucide-react';

interface WarehouseMapViewProps {
  parts: Part[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenBinCard: (part: Part) => void;
  onRefreshData?: () => void;
}

export const WarehouseMapView: React.FC<WarehouseMapViewProps> = ({
  parts,
  settings,
  onUpdateSettings,
  onOpenBinCard,
  onRefreshData,
}) => {
  const [locations, setLocations] = useState<WarehouseLocation[]>(settings.locations || []);
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(
    locations.length > 0 ? locations[0] : null
  );
  
  // New Location inputs
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationDesc, setNewLocationDesc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'occupied' | 'empty'>('all');

  // Message banner
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter locations based on search and filter mode
  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.description && loc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const partsInLoc = parts.filter((p) => p.location === loc.name);
    const isOccupied = partsInLoc.length > 0;

    if (!matchesSearch) return false;
    if (filterMode === 'occupied') return isOccupied;
    if (filterMode === 'empty') return !isOccupied;
    return true;
  });

  // Add Location Handler
  const handleAddLocation = () => {
    if (!newLocationName.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên vị trí / kệ (ví dụ: Kệ A1)!' });
      return;
    }

    if (locations.some((l) => l.name.toLowerCase() === newLocationName.trim().toLowerCase())) {
      setMessage({ type: 'error', text: 'Vị trí này đã tồn tại trong danh sách!' });
      return;
    }

    const newLoc: WarehouseLocation = {
      id: 'loc-' + Date.now(),
      name: newLocationName.trim(),
      description: newLocationDesc.trim() || undefined,
    };

    const updated = [...locations, newLoc];
    setLocations(updated);

    const updatedSettings: AppSettings = {
      ...settings,
      locations: updated,
    };

    storageService.saveSettings(updatedSettings);
    onUpdateSettings(updatedSettings);

    setNewLocationName('');
    setNewLocationDesc('');
    setSelectedLocation(newLoc);
    setMessage({ type: 'success', text: `Đã thêm vị trí "${newLoc.name}" thành công!` });

    setTimeout(() => setMessage(null), 3000);
  };

  // Delete Location Handler
  const handleDeleteLocation = (id: string, name: string) => {
    const partsInLoc = parts.filter((p) => p.location === name);
    if (partsInLoc.length > 0) {
      if (
        !confirm(
          `Vị trí "${name}" đang chứa ${partsInLoc.length} linh kiện. Bạn có chắc chắn muốn xóa không?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`Bạn có chắc muốn xóa vị trí "${name}" không?`)) return;
    }

    const updated = locations.filter((l) => l.id !== id);
    setLocations(updated);

    const updatedSettings: AppSettings = {
      ...settings,
      locations: updated,
    };

    storageService.saveSettings(updatedSettings);
    onUpdateSettings(updatedSettings);

    if (selectedLocation?.id === id) {
      setSelectedLocation(updated.length > 0 ? updated[0] : null);
    }

    setMessage({ type: 'success', text: `Đã xóa vị trí "${name}"!` });
    setTimeout(() => setMessage(null), 3000);
  };

  // Stats
  const totalLocations = locations.length;
  const occupiedLocationsCount = locations.filter(
    (loc) => parts.some((p) => p.location === loc.name)
  ).length;
  const emptyLocationsCount = totalLocations - occupiedLocationsCount;
  const unassignedPartsCount = parts.filter((p) => !p.location || p.location === 'Chưa phân vị trí' || p.location === 'Kho chính').length;

  // Parts in current selected location
  const partsInSelectedLoc = selectedLocation
    ? parts.filter((p) => p.location === selectedLocation.name)
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-500/20 border border-blue-400/30 rounded-2xl flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">SƠ ĐỒ VỊ TRÍ KHO HÀNG</h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Quản lý danh sách kệ, khoang lưu trữ và tra cứu vị trí các linh kiện trong kho
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="px-3 py-1.5 bg-white/10 rounded-xl font-semibold backdrop-blur-xs border border-white/10">
            Tổng vị trí: <strong className="text-emerald-300 font-bold">{totalLocations}</strong>
          </span>
          <span className="px-3 py-1.5 bg-white/10 rounded-xl font-semibold backdrop-blur-xs border border-white/10">
            Đang chứa: <strong className="text-blue-300 font-bold">{occupiedLocationsCount}</strong>
          </span>
          <span className="px-3 py-1.5 bg-white/10 rounded-xl font-semibold backdrop-blur-xs border border-white/10">
            Trống: <strong className="text-amber-300 font-bold">{emptyLocationsCount}</strong>
          </span>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-3 text-xs font-bold ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid Section: Top Add Form & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Create Location & Rack Layout */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Location Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Thêm Vị Trí / Kệ Mới</span>
              </h3>
              <span className="text-[11px] text-slate-400">VD: Kệ A1, Khoang B2, Tủ C1...</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Tên vị trí (VD: Kệ A1)*"
                className="w-full sm:w-1/3 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
              />
              <input
                type="text"
                value={newLocationDesc}
                onChange={(e) => setNewLocationDesc(e.target.value)}
                placeholder="Mô tả vị trí (VD: Khoang A - Tầng 1)"
                className="w-full sm:w-1/2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
              />
              <button
                type="button"
                onClick={handleAddLocation}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center space-x-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Vị Trí</span>
              </button>
            </div>
          </div>

          {/* Locations Rack Filter & List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Danh Sách Kệ / Khoang Lưu Trữ</h3>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm tên kệ..."
                    className="pl-8 pr-3 py-1.5 bg-slate-100 border-none rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/30 outline-hidden w-36"
                  />
                </div>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      filterMode === 'all'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tất cả ({locations.length})
                  </button>
                  <button
                    onClick={() => setFilterMode('occupied')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      filterMode === 'occupied'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Có hàng ({occupiedLocationsCount})
                  </button>
                  <button
                    onClick={() => setFilterMode('empty')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      filterMode === 'empty'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Còn trống ({emptyLocationsCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Locations Rack Cards Grid */}
            {filteredLocations.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">Chưa tìm thấy vị trí lưu trữ nào.</p>
                <p className="text-[11px] text-slate-400 mt-1">Hãy thêm vị trí mới ở biểu mẫu phía trên.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredLocations.map((loc) => {
                  const partsInLoc = parts.filter((p) => p.location === loc.name);
                  const isSelected = selectedLocation?.id === loc.id;
                  const isOccupied = partsInLoc.length > 0;
                  const totalStockInLoc = partsInLoc.reduce((acc, p) => acc + p.currentStock, 0);

                  return (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedLocation(loc)}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between group ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20'
                          : isOccupied
                          ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-500 hover:bg-emerald-50/80 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isOccupied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isOccupied ? `${partsInLoc.length} LK` : 'Trống'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLocation(loc.id, loc.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Xóa vị trí"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Title & Description */}
                      <div className="my-3 text-center">
                        <div className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                          {loc.name}
                        </div>
                        {loc.description && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5" title={loc.description}>
                            {loc.description}
                          </div>
                        )}
                      </div>

                      {/* Stock summary */}
                      <div className="text-[11px] font-bold text-center border-t border-slate-200/60 pt-2 flex items-center justify-between text-slate-500">
                        <span>Tổng tồn:</span>
                        <span className="font-mono font-black text-slate-800">
                          {totalStockInLoc.toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Location Details & Parts List */}
        <div className="space-y-6">
          {/* Selected Location Detail Box */}
          {selectedLocation ? (
            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    Chi tiết vị trí đang chọn
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{selectedLocation.name}</h3>
                  {selectedLocation.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{selectedLocation.description}</p>
                  )}
                </div>
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>

              {/* Parts inside selected location */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Linh kiện lưu trữ ({partsInSelectedLoc.length}):</span>
                  <span className="text-[11px] text-slate-400">
                    {partsInSelectedLoc.reduce((sum, p) => sum + p.currentStock, 0).toLocaleString('vi-VN')} đơn vị
                  </span>
                </div>

                {partsInSelectedLoc.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    <Info className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    Chưa có linh kiện nào được gán ở vị trí "{selectedLocation.name}".
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {partsInSelectedLoc.map((part) => (
                      <div
                        key={part.id}
                        className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 transition-all flex items-center justify-between text-xs group"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className="font-mono font-bold text-blue-700 text-[11px]">{part.code}</div>
                          <div className="font-semibold text-slate-800 truncate" title={part.name}>
                            {part.name}
                          </div>
                          {part.spec && <div className="text-[10px] text-slate-400">{part.spec}</div>}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono font-black text-emerald-600 text-sm">
                            {part.currentStock.toLocaleString('vi-VN')} {part.unit}
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenBinCard(part)}
                            className="text-[10px] text-blue-600 hover:underline font-bold mt-0.5 inline-flex items-center space-x-0.5 cursor-pointer"
                          >
                            <span>Thẻ kho</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              Vui lòng chọn một vị trí ở danh sách bên trái để xem chi tiết linh kiện.
            </div>
          )}

          {/* Quick Stat: Unassigned Parts */}
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 text-amber-900 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Linh kiện chưa gán vị trí lưu trữ</span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Hiện có <strong className="font-bold text-amber-950">{unassignedPartsCount}</strong> linh kiện trong kho chưa được gán mã kệ cụ thể.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
