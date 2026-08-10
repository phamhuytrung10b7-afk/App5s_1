import React, { useState, useRef, useEffect } from 'react';
import { MasterKittingTag, parseMasterExcel } from './masterExcelParser';
import { PART_GROUP_COLORS, PartGroupColorConfig, getPartGroupConfig } from './partGroupColors';
import { QRCodeSVG } from 'qrcode.react';
import { printHtml } from './printHelper';
import { storageService } from './storage';
import {
  FileSpreadsheet,
  Upload,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Tag,
  Package,
  Layers,
  Search,
  Check,
  Palette,
  RefreshCw,
  Sliders,
  CheckSquare,
  Square,
  Info,
} from 'lucide-react';

interface ContainerTagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTagForKitting?: (tag: MasterKittingTag) => void;
}

export const ContainerTagManagerModal: React.FC<ContainerTagManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectTagForKitting,
}) => {
  const [tags, setTags] = useState<MasterKittingTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'master_data' | 'color_config' | 'print_preview'>('master_data');
  const [addedMsg, setAddedMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const printContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = storageService.getMasterContainerTags();
      setTags(saved);
      // Select all by default
      setSelectedTagIds(new Set(saved.map((t) => t.id)));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const result = parseMasterExcel(buffer);
        if (result.tags.length === 0) {
          alert('Không tìm thấy dữ liệu linh kiện hợp lệ trong file Excel Master Data!');
          return;
        }

        storageService.saveMasterContainerTags(result.tags);
        setTags(result.tags);
        setSelectedTagIds(new Set(result.tags.map((t) => t.id)));
        setAddedMsg(`Đã tải thành công ${result.tags.length} Thẻ Thùng Master từ file Excel!`);
        setActiveTab('master_data');
      } catch (err: any) {
        console.error('Lỗi đọc file Master Excel:', err);
        alert('Lỗi đọc file Excel Master Data: ' + (err.message || 'Sai định dạng'));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleResetSampleData = () => {
    if (confirm('Khôi phục danh sách Master Data Thẻ Thùng mẫu chuẩn SUNHOUSE NMBD (10+ Linh Kiện)?')) {
      const reset = storageService.resetMasterContainerTags();
      setTags(reset);
      setSelectedTagIds(new Set(reset.map((t) => t.id)));
      setAddedMsg('Đã khôi phục Master Data mẫu chuẩn nhà máy SUNHOUSE NMBD!');
    }
  };

  const toggleSelectAll = () => {
    if (selectedTagIds.size === filteredTags.length) {
      setSelectedTagIds(new Set());
    } else {
      setSelectedTagIds(new Set(filteredTags.map((t) => t.id)));
    }
  };

  const toggleSelectTag = (id: string) => {
    const next = new Set(selectedTagIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTagIds(next);
  };

  // Filter tags
  const filteredTags = tags.filter((t) => {
    const matchesSearch =
      t.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ccdcSpec.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.stt.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGroup =
      selectedGroupFilter === 'ALL' || t.groupConfig.id === selectedGroupFilter;

    return matchesSearch && matchesGroup;
  });

  // Selected tags for printing
  const tagsToPrint = tags.filter((t) => selectedTagIds.has(t.id));

  const handlePrint = (mode: 'ALL' | 'SELECTED') => {
    const targetTags = mode === 'ALL' ? tags : tagsToPrint;
    if (targetTags.length === 0) {
      alert('Chưa có Thẻ Thùng nào được chọn để in!');
      return;
    }

    if (printContainerRef.current) {
      const styles = `
        @page {
          size: 100mm 70mm;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0;
            padding: 0;
            width: 100mm;
            height: 70mm;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .tag-card {
            page-break-after: always;
            break-after: page;
          }
        }
        body {
          font-family: Arial, sans-serif;
          color: #000;
        }
      `;
      printHtml(printContainerRef.current.innerHTML, styles);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[94vh] flex flex-col overflow-hidden">
        {/* Header Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-2xl backdrop-blur-md border border-blue-400/20">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg">
                  QUẢN LÝ THẺ THÙNG (CONTAINER TAG) & MÃ MÀU BÓC TÁCH SMART
                </h3>
                <span className="px-2.5 py-0.5 text-[10px] bg-emerald-500 text-white font-black rounded-full uppercase tracking-wider">
                  SUNHOUSE - NMBD
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Import Excel Master Data, Tự động mã hóa QR Standard <code className="bg-blue-950 px-1 py-0.5 rounded text-amber-300 font-mono">[Mã_VT]|[Định_Mức]|[Mã_Nhóm]</code> & In Thẻ Thùng Nhận Dạng Màu Trực Quan
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handlePrint('SELECTED')}
              disabled={tagsToPrint.length === 0}
              className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer ${
                tagsToPrint.length > 0
                  ? 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>In {tagsToPrint.length} Thẻ Đã Chọn</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Filters */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-200 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('master_data')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'master_data'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>1. Danh Sách Master Data ({tags.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('color_config')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'color_config'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-4 h-4 text-emerald-600" />
                <span>2. Bảng Mã Màu 9 Nhóm Linh Kiện</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('print_preview')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'print_preview'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Printer className="w-4 h-4 text-amber-600" />
                <span>3. Xem Mẫu In "PHIẾU THÔNG TIN"</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import Master Data Excel</span>
            </button>

            <button
              type="button"
              onClick={handleResetSampleData}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
              title="Khôi phục dữ liệu mẫu SUNHOUSE NMBD"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Khôi Phục Mẫu</span>
            </button>
          </div>
        </div>

        {addedMsg && (
          <div className="px-4 py-2 bg-emerald-100 border-b border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{addedMsg}</span>
            </div>
            <button
              onClick={() => setAddedMsg(null)}
              className="text-emerald-700 hover:text-emerald-950 font-extrabold cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Content Tabs Body */}
        <div className="flex-1 overflow-hidden p-4 bg-slate-50">
          {activeTab === 'master_data' ? (
            <div className="h-full flex flex-col space-y-3">
              {/* Search & Group Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center space-x-2 flex-1 min-w-[280px]">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo Tên linh kiện, Mã linh kiện, Quy cách CCDC, Số..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500">Lọc Nhóm:</span>
                  <select
                    value={selectedGroupFilter}
                    onChange={(e) => setSelectedGroupFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-800 focus:bg-white outline-hidden cursor-pointer"
                  >
                    <option value="ALL">-- Tất cả 9 nhóm linh kiện --</option>
                    {Object.values(PART_GROUP_COLORS).map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    {selectedTagIds.size === filteredTags.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>
                      {selectedTagIds.size === filteredTags.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Master Data Table */}
              <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedTagIds.size === filteredTags.length && filteredTags.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3 w-16 text-center">STT</th>
                      <th className="p-3">Nhóm Linh Kiện</th>
                      <th className="p-3">Mã Màu Hex</th>
                      <th className="p-3">Tên Linh Kiện</th>
                      <th className="p-3 font-mono">Mã Linh Kiện</th>
                      <th className="p-3">Quy Cách CCDC</th>
                      <th className="p-3 text-center">Định Mức (SL/ĐVT)</th>
                      <th className="p-3">Chuỗi QR Chuẩn (Standard Payload)</th>
                      <th className="p-3 text-center w-28">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTags.map((tag) => {
                      const isSelected = selectedTagIds.has(tag.id);
                      const grp = tag.groupConfig;

                      return (
                        <tr
                          key={tag.id}
                          onClick={() => toggleSelectTag(tag.id)}
                          className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50/70' : ''
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectTag(tag.id)}
                              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-500">{tag.stt || '-'}</td>
                          <td className="p-3">
                            <span
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-black shadow-2xs"
                              style={{
                                backgroundColor: grp.colorHex,
                                color: grp.textColorHex,
                              }}
                            >
                              <span>●</span>
                              <span>{grp.name}</span>
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] font-bold text-slate-500">
                            <span
                              className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle border border-slate-300"
                              style={{ backgroundColor: grp.colorHex }}
                            />
                            {grp.colorHex}
                          </td>
                          <td className="p-3 font-extrabold text-slate-900">{tag.partName || '-'}</td>
                          <td className="p-3 font-mono font-bold text-blue-700">{tag.partCode || '-'}</td>
                          <td className="p-3 font-medium text-slate-700">{tag.ccdcSpec || ''}</td>
                          <td className="p-3 text-center font-black rounded-lg">
                            {tag.standardQty > 0 ? (
                              <span className="text-amber-800 bg-amber-50 px-2 py-1 rounded">
                                {tag.standardQty} {tag.unit}
                              </span>
                            ) : (
                              <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded text-[10px] italic">
                                Trống (Điền khi quét)
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[10px] text-slate-500">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-bold">
                              {tag.qrPayload}
                            </span>
                          </td>
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {onSelectTagForKitting && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectTagForKitting(tag);
                                  onClose();
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs cursor-pointer"
                              >
                                Chọn Kitting
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'color_config' ? (
            /* COLOR MASTER CONFIGURATION TAB */
            <div className="h-full overflow-y-auto space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center space-x-2 text-slate-900">
                  <Palette className="w-5 h-5 text-blue-600" />
                  <h4 className="font-extrabold text-sm">
                    BẢNG CẤU HÌNH MÃ MÀU NHẬN DẠNG TRỰC QUAN 9 NHÓM LINH KIỆN (VISUAL COLOR CODING MASTER)
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  Khai báo quy chuẩn nhận dạng bằng màu sắc theo tiêu chuẩn nhà máy SUNHOUSE. Ô màu tương ứng sẽ tự động in trên góc trên bên phải của từng Thẻ Thùng (Container Tag) giúp nhân viên kho nhận biết chủng loại ngay lập tức.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(PART_GROUP_COLORS).map((grp) => {
                  const grpTags = tags.filter((t) => t.groupConfig.id === grp.id);

                  return (
                    <div
                      key={grp.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 relative overflow-hidden"
                    >
                      {/* Top color bar accent */}
                      <div
                        className="absolute top-0 left-0 right-0 h-2"
                        style={{ backgroundColor: grp.colorHex }}
                      />

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-6 h-6 rounded-lg shadow-inner flex items-center justify-center font-black text-xs"
                            style={{
                              backgroundColor: grp.colorHex,
                              color: grp.textColorHex,
                            }}
                          >
                            ✓
                          </div>
                          <h5 className="font-extrabold text-sm text-slate-900">{grp.name}</h5>
                        </div>
                        <span className="font-mono font-bold text-xs px-2 py-0.5 bg-slate-100 rounded border text-slate-700">
                          {grp.colorHex}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Số linh kiện trong Master Data:</span>
                          <strong className="text-slate-900">{grpTags.length} mã</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Từ khóa khớp tự động:</span>
                          <span className="font-mono text-[11px] text-slate-600">
                            {grp.keywords.slice(0, 3).join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Visual Badge Preview */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400">Hiển thị Badge:</span>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-black shadow-2xs"
                          style={{
                            backgroundColor: grp.colorHex,
                            color: grp.textColorHex,
                          }}
                        >
                          THẺ THÙNG - {grp.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* PRINT PREVIEW TAB (CSS PRINT CONTAINER TAG EXACT LAYOUT FROM IMAGE 1) */
            <div className="h-full flex flex-col space-y-3">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <Printer className="w-5 h-5 text-amber-600" />
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">
                      MẪU IN THẺ THÙNG (CONTAINER TAG) "PHIẾU THÔNG TIN" CHUẨN NHÀ MÁY
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Hiển thị ô màu nhận dạng góc trên bên phải. Kích thước chuẩn nhiệt 100x70mm. Đã chọn {tagsToPrint.length} / {tags.length} thẻ.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handlePrint('SELECTED')}
                    disabled={tagsToPrint.length === 0}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In {tagsToPrint.length} Thẻ Đã Chọn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrint('ALL')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>In TẤT CẢ ({tags.length} Thẻ)</span>
                  </button>
                </div>
              </div>

              {/* Printable Tags Grid / Preview Container */}
              <div className="flex-1 overflow-y-auto bg-slate-200/70 p-6 rounded-2xl border border-slate-300">
                <div
                  ref={printContainerRef}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
                >
                  {tagsToPrint.map((tag, idx) => {
                    const grp = tag.groupConfig;

                    return (
                      <div
                        key={tag.id}
                        className="tag-card bg-white border-2 border-black p-3 text-black font-sans text-xs shadow-md relative w-full max-w-[100mm] min-h-[68mm] mx-auto flex flex-col justify-between"
                        style={{ boxSizing: 'border-box' }}
                      >
                        {/* Header Title */}
                        <div className="border-b-2 border-black pb-1 mb-1 flex items-center justify-between">
                          <div className="font-extrabold text-sm tracking-tight text-black flex items-center space-x-1">
                            <span>[SUNHOUSE - NMBD] PHIẾU THÔNG TIN</span>
                          </div>
                          <div className="font-black text-xs font-mono text-black border border-black px-1.5 py-0.5">
                            {tag.stt}
                          </div>
                        </div>

                        {/* Exact Table Layout from Image 1 */}
                        <table className="w-full border-collapse text-[11px] font-sans border border-black text-black">
                          <tbody>
                            {/* Row 1: Nhóm | Value | NCC | COLOR BOX HEX */}
                            <tr className="border-b border-black">
                              <td className="border-r border-black p-1 font-bold w-20 bg-slate-100">
                                Nhóm
                              </td>
                              <td className="border-r border-black p-1 font-extrabold">
                                {tag.groupName}
                              </td>
                              <td className="border-r border-black p-1 font-bold w-12 bg-slate-100">
                                NCC
                              </td>
                              <td className="p-1 w-24 text-center">
                                {/* VISUAL COLOR CODING BOX EXACT FROM IMAGE 1 */}
                                <div
                                  className="w-full h-7 rounded border border-black flex items-center justify-center font-black text-[10px] text-white shadow-xs"
                                  style={{
                                    backgroundColor: grp.colorHex,
                                    color: grp.textColorHex,
                                  }}
                                >
                                  {grp.name}
                                </div>
                              </td>
                            </tr>

                            {/* Row 2: Tên linh kiện | Value | Quy cách CCDC | Value */}
                            <tr className="border-b border-black">
                              <td className="border-r border-black p-1 font-bold bg-slate-100">
                                Tên linh kiện
                              </td>
                              <td className="border-r border-black p-1 font-black text-xs">
                                {tag.partName}
                              </td>
                              <td className="border-r border-black p-1 font-bold bg-slate-100">
                                Quy cách CCDC
                              </td>
                              <td className="p-1 font-extrabold text-[10px]">
                                {tag.ccdcSpec}
                              </td>
                            </tr>

                            {/* Row 3: Mã linh kiện | Value | empty | Số ...... */}
                            <tr className="border-b border-black">
                              <td className="border-r border-black p-1 font-bold bg-slate-100">
                                Mã linh kiện
                              </td>
                              <td className="border-r border-black p-1 font-mono font-black text-xs">
                                {tag.partCode}
                              </td>
                              <td className="border-r border-black p-1 font-bold bg-slate-100">
                                Ghi chú
                              </td>
                              <td className="p-1 font-mono text-[10px]">Số ......</td>
                            </tr>

                            {/* Row 4: Số lượng | Value | cái/bộ | empty */}
                            <tr className="border-b border-black">
                              <td className="border-r border-black p-1 font-bold bg-slate-100">
                                Số lượng
                              </td>
                              <td className="border-r border-black p-1 font-black text-base text-black">
                                {tag.standardQty > 0 ? tag.standardQty : ''}
                              </td>
                              <td className="border-r border-black p-1 font-bold bg-slate-100">
                                ĐVT
                              </td>
                              <td className="p-1 font-bold">{tag.unit}</td>
                            </tr>

                            {/* Row 5: Khối lượng | - | Tần suất | 1h / 1 lần */}
                            <tr className="border-b border-black">
                              <td className="border-r border-black p-1 font-bold bg-slate-100">
                                Khối lượng
                              </td>
                              <td className="border-r border-black p-1 font-bold">-</td>
                              <td className="border-r border-black p-1 font-bold bg-slate-100">
                                Tần suất
                              </td>
                              <td className="p-1 font-bold">{tag.mfgFrequency || '1h / 1 lần'}</td>
                            </tr>

                            {/* Row 6: Mã vạch | QR CODE | Thời gian cần thực | ......(h) */}
                            <tr>
                              <td className="border-r border-black p-1 font-bold bg-slate-100">
                                Mã vạch QR
                              </td>
                              <td className="border-r border-black p-1 text-center bg-white">
                                <div className="inline-block p-1 bg-white border border-black rounded">
                                  <QRCodeSVG
                                    value={tag.qrPayload}
                                    size={55}
                                    level="M"
                                    includeMargin={false}
                                  />
                                </div>
                              </td>
                              <td className="border-r border-black p-1 font-bold bg-slate-100">
                                Thời gian cần thực
                              </td>
                              <td className="p-1 font-mono text-[10px]">......(h)</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Footer QR Payload String */}
                        <div className="pt-1 text-[9px] font-mono text-slate-600 flex items-center justify-between">
                          <span>Payload: {tag.qrPayload}</span>
                          <span>NMBD - SUNHOUSE</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
