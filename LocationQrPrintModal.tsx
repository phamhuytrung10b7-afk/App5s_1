import React, { useState, useEffect } from 'react';
import { WarehouseLocation, AppSettings } from './types';
import { X, Printer, CheckSquare, Square, QrCode, Sliders } from 'lucide-react';
import QRCode from 'qrcode';

interface LocationQrPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: WarehouseLocation[];
  settings: AppSettings;
  initialSelectedId?: string;
}

export const LocationQrPrintModal: React.FC<LocationQrPrintModalProps> = ({
  isOpen,
  onClose,
  locations,
  settings,
  initialSelectedId,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tagCopies, setTagCopies] = useState<number>(1);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showCompanyHeader, setShowCompanyHeader] = useState<boolean>(true);

  // Initialize selected IDs when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedId) {
        setSelectedIds([initialSelectedId]);
      } else {
        setSelectedIds(locations.map((l) => l.id));
      }
    }
  }, [isOpen, initialSelectedId, locations]);

  // Generate QR code data URLs for selected locations
  useEffect(() => {
    if (!isOpen || selectedIds.length === 0) return;

    let isMounted = true;
    setIsGenerating(true);

    const generateQrs = async () => {
      const urls: Record<string, string> = {};
      for (const id of selectedIds) {
        const loc = locations.find((l) => l.id === id);
        if (loc) {
          try {
            // QR Payload: "LOC|A01" or "A01"
            const payload = loc.name;
            const dataUrl = await QRCode.toDataURL(payload, {
              errorCorrectionLevel: 'M',
              margin: 1,
              width: 180,
              color: {
                dark: '#000000',
                light: '#FFFFFF',
              },
            });
            urls[id] = dataUrl;
          } catch (err) {
            console.error('Error generating location QR code:', err);
          }
        }
      }

      if (isMounted) {
        setQrDataUrls(urls);
        setIsGenerating(false);
      }
    };

    generateQrs();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedIds, locations]);

  if (!isOpen) return null;

  const handleToggleSelectAll = () => {
    if (selectedIds.length === locations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(locations.map((l) => l.id));
    }
  };

  const handleToggleId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const selectedLocations = locations.filter((loc) => selectedIds.includes(loc.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      {/* CSS Print Styles targeting 35mm x 22mm Thermal Sticker Labels */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-location-qr-area, #print-location-qr-area * {
            visibility: visible;
          }
          #print-location-qr-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }
          @page {
            size: 35mm 22mm;
            margin: 0;
          }
          .tag-35x22-print {
            width: 35mm !important;
            height: 22mm !important;
            box-sizing: border-box !important;
            padding: 1.2mm 1.5mm !important;
            margin: 0 !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            break-inside: avoid !important;
            border: none !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500 text-white rounded-2xl font-black shadow-lg">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-emerald-400 text-slate-950 text-[10px] font-black rounded-md uppercase tracking-wider">
                  TEM NHÃN 35x22mm
                </span>
                <span className="text-xs text-blue-200">Chuẩn máy in nhiệt</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                In Mã QR Tem Kệ Vị Trí Kho hàng
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTriggerPrint}
              disabled={selectedLocations.length === 0 || isGenerating}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In {selectedLocations.length * tagCopies} Tem</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-slate-700 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              {selectedIds.length === locations.length ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedIds.length === locations.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'} (
                {locations.length})
              </span>
            </button>

            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 border border-slate-300 rounded-xl">
              <span className="font-bold text-slate-700">Số lượng tem mỗi vị trí:</span>
              <input
                type="number"
                min="1"
                max="50"
                value={tagCopies}
                onChange={(e) => setTagCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-lg text-center font-bold text-slate-800 outline-hidden"
              />
            </div>

            <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 border border-slate-300 rounded-xl font-bold text-slate-700">
              <input
                type="checkbox"
                checked={showCompanyHeader}
                onChange={(e) => setShowCompanyHeader(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>In tên kho trên tem</span>
            </label>
          </div>

          <div className="text-slate-500 font-medium">
            Đã chọn: <strong className="text-blue-600 font-black">{selectedLocations.length}</strong> / {locations.length} vị trí
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Location Selection Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>DANH SÁCH VỊ TRÍ CẦN IN TEM:</span>
              <span className="text-[11px] text-slate-400 font-normal">Click vào ô vị trí để bật/tắt</span>
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
              {locations.map((loc) => {
                const isSelected = selectedIds.includes(loc.id);
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleToggleId(loc.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{loc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Tag Preview Section */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Xem Trước Mẫu Tem Kệ Kho (Tỷ lệ chuẩn Kích Thước Tem 35mm x 22mm)</span>
              </h3>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-bold">
                ✓ Thiết kế tối ưu cho máy in mã vạch nhiệt (Xprinter, TSC, Gprinter...)
              </span>
            </div>

            {selectedLocations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
                Vui lòng chọn ít nhất 1 vị trí để xem trước và in tem QR code.
              </div>
            ) : (
              <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300">
                <p className="text-[11px] text-slate-500 mb-3 italic">
                  * Bên dưới là bản xem trước hiển thị trên màn hình. Khi chọn nút "In Tem", hệ thống sẽ tự động xuất định dạng từng con tem chuẩn 35x22mm ra máy in.
                </p>

                {/* Printable Area on screen preview */}
                <div
                  id="print-location-qr-area"
                  className="flex flex-wrap gap-4 items-center justify-start"
                >
                  {selectedLocations.flatMap((loc) =>
                    Array.from({ length: tagCopies }).map((_, copyIndex) => (
                      <div
                        key={`${loc.id}-${copyIndex}`}
                        className="tag-35x22-print bg-white border-2 border-slate-900 rounded-lg p-2 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow shrink-0 relative overflow-hidden"
                        style={{
                          width: '185px',
                          height: '116px',
                          padding: '6px 8px',
                          boxSizing: 'border-box',
                        }}
                      >
                        {/* Company / Warehouse Header */}
                        {showCompanyHeader && (
                          <div className="text-[9px] font-black uppercase text-slate-800 border-b border-slate-300 pb-0.5 tracking-tight truncate w-full flex items-center justify-between">
                            <span className="truncate">{settings.warehouseName || 'KHO HÀNG'}</span>
                            <span className="text-[7px] bg-slate-200 px-1 rounded font-bold">KỆ</span>
                          </div>
                        )}

                        {/* Center QR Code + Name Layout */}
                        <div className="flex items-center space-x-2 my-auto">
                          {/* QR Code */}
                          <div className="w-14 h-14 bg-white shrink-0 flex items-center justify-center">
                            {qrDataUrls[loc.id] ? (
                              <img
                                src={qrDataUrls[loc.id]}
                                alt={loc.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
                            )}
                          </div>

                          {/* Location Code & Desc */}
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="text-[7px] uppercase font-bold text-slate-500 tracking-wider">
                              VỊ TRÍ / KỆ
                            </div>
                            <div className="text-base font-black text-slate-950 leading-tight tracking-tight font-mono truncate">
                              {loc.name}
                            </div>
                            {loc.description && (
                              <div className="text-[8px] font-semibold text-slate-700 leading-tight line-clamp-2 mt-0.5">
                                {loc.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Tag Footer */}
                        <div className="text-[7px] text-slate-500 border-t border-slate-200 pt-0.5 flex items-center justify-between font-mono">
                          <span>TEM KỆ 35x22mm</span>
                          <span>SCAN TO INPUT</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 font-medium">
            💡 Mẹo: Dán tem 35x22mm lên vị trí kệ. Khi Xuất/Nhập kho, bắn súng quét vào tem QR này để chọn vị trí tự động!
          </span>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleTriggerPrint}
              disabled={selectedLocations.length === 0 || isGenerating}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Bắt Đầu In ({selectedLocations.length * tagCopies} Tem)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
