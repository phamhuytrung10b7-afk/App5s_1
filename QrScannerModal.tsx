import React, { useState, useEffect, useRef } from 'react';
import { Part } from './types';
import { storageService } from './storage';
import { QrCode, X, Camera, Zap, CheckCircle2, AlertCircle, Package, Search, ShieldAlert } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPart: (part: Part, autoQty?: number, autoCont?: string, tagId?: string) => void;
  parts: Part[];
  mode?: 'in' | 'out';
}

export function parseScannedQrPayload(raw: string): {
  partCode: string;
  qty?: number;
  contNumber?: string;
  tagId?: string;
  contDate?: string;
} {
  const str = raw.trim();

  // 1. Pipe format CONT_IN|MãVT|SốLượng|MãCont|TagID|NgàyCont
  if (str.startsWith('CONT_IN|')) {
    const parts = str.split('|');
    return {
      partCode: parts[1] || '',
      qty: parts[2] ? parseFloat(parts[2]) : undefined,
      contNumber: parts[3] || '',
      tagId: parts[4] || '',
      contDate: parts[5] || '',
    };
  }

  // 2. JSON format
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const obj = JSON.parse(str);
      if (obj.partCode || obj.code) {
        return {
          partCode: obj.partCode || obj.code,
          qty: obj.qty || obj.quantity,
          contNumber: obj.cont || obj.contNumber,
          tagId: obj.tagId || obj.id,
          contDate: obj.contDate || obj.date,
        };
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback
  return { partCode: str };
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectPart,
  parts,
  mode,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [matchedPart, setMatchedPart] = useState<Part | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  const [scannedQty, setScannedQty] = useState<number | undefined>(undefined);
  const [scannedCont, setScannedCont] = useState<string | undefined>(undefined);
  const [scannedTagId, setScannedTagId] = useState<string | undefined>(undefined);
  const [usedInfo, setUsedInfo] = useState<{ isUsed: boolean; scannedAt?: string; scannedBy?: string } | null>(null);

  // Auto focus text input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        manualInputRef.current?.focus();
      }, 100);
    } else {
      stopCamera();
      setManualCode('');
      setMatchedPart(null);
      setScannedQty(undefined);
      setScannedCont(undefined);
      setScannedTagId(undefined);
      setUsedInfo(null);
      setCameraError(null);
    }
  }, [isOpen]);

  // Match part whenever manualCode changes
  useEffect(() => {
    if (!manualCode.trim()) {
      setMatchedPart(null);
      setScannedQty(undefined);
      setScannedCont(undefined);
      setScannedTagId(undefined);
      setUsedInfo(null);
      return;
    }

    if (mode === 'out' && manualCode.trim().startsWith('CONT_IN|')) {
      setMatchedPart(null);
      setUsedInfo({
        isUsed: true,
        scannedAt: 'MÃ NHẬP KHO CONT_IN',
        scannedBy: '⛔ Không được dùng mã QR Nhập Kho để Xuất Kho!',
      });
      return;
    }

    const parsed = parseScannedQrPayload(manualCode);
    const searchCode = parsed.partCode.toLowerCase();

    setScannedQty(parsed.qty);
    setScannedCont(parsed.contNumber);
    setScannedTagId(parsed.tagId);

    // Check if this QR token or tagId has already been scanned & imported!
    const tokenToCheck = parsed.tagId || manualCode.trim();
    const usedCheck = storageService.isQrTokenUsed(tokenToCheck);
    setUsedInfo(usedCheck.isUsed ? usedCheck : null);

    const found = parts.find(
      (p) =>
        p.code.toLowerCase() === searchCode ||
        p.qrCode?.toLowerCase() === searchCode ||
        p.barcode?.toLowerCase() === searchCode ||
        p.name.toLowerCase().includes(searchCode)
    );
    setMatchedPart(found || null);
  }, [manualCode, parts, mode]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchedPart && !usedInfo?.isUsed) {
      onSelectPart(matchedPart, scannedQty, scannedCont, scannedTagId || manualCode.trim());
      onClose();
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Trình duyệt hoặc môi trường này không hỗ trợ truy cập Camera trực tiếp. Bạn vui lòng sử dụng súng quét mã Barcode USB hoặc gõ mã/tên linh kiện ở ô trên.'
      );
      setIsCameraActive(false);
      return;
    }

    // Small timeout to allow element #qr-reader to mount in DOM
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        html5QrcodeRef.current = html5QrCode;

        const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };
        const onScanSuccess = (decodedText: string) => {
          setManualCode(decodedText);
          stopCamera();
        };

        try {
          // Try environment (back) camera first
          await html5QrCode.start(
            { facingMode: 'environment' },
            qrConfig,
            onScanSuccess,
            () => {}
          );
        } catch (envErr: any) {
          console.warn('Environment camera start attempt failed, trying user camera...', envErr);
          // Fallback to user (front/default) camera
          await html5QrCode.start(
            { facingMode: 'user' },
            qrConfig,
            onScanSuccess,
            () => {}
          );
        }
      } catch (err: any) {
        console.warn('Camera start issue caught:', err);
        const errString = String(err?.message || err || '');
        if (
          errString.includes('NotAllowedError') ||
          errString.includes('Permission denied') ||
          errString.includes('Permission')
        ) {
          setCameraError(
            'Quyền truy cập Camera đã bị hệ thống / trình duyệt từ chối. Bạn có thể mở ứng dụng ở Tab Mới và cấp quyền Camera, hoặc sử dụng súng quét mã Barcode / gõ mã trực tiếp.'
          );
        } else {
          setCameraError(
            'Không thể kết nối Camera thiết bị. Bạn vui lòng dùng súng quét mã hoặc nhập mã linh kiện ở trên.'
          );
        }
        setIsCameraActive(false);
      }
    }, 150);
  };

  const stopCamera = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (err) {
        console.error('Stop camera error', err);
      }
    }
    setIsCameraActive(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">QUÉT MÃ QR / BARCODE LINH KIỆN</h3>
              <p className="text-[11px] text-blue-100">Dùng súng quét barcode hoặc Camera để chọn nhanh linh kiện</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Barcode Gun / Manual Input Box */}
          <form onSubmit={handleCodeSubmit} className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Súng Quét Barcode / Nhập Mã QR nhanh</span>
              <span className="text-[11px] text-blue-600 font-normal">Hỗ trợ tự động điền</span>
            </label>
            <div className="relative">
              <Zap className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2 animate-pulse" />
              <input
                ref={manualInputRef}
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Quét mã bằng máy quét hoặc gõ mã linh kiện..."
                className="w-full pl-9 pr-24 py-3 bg-slate-50 border-2 border-blue-200 rounded-2xl text-sm font-bold font-mono focus:bg-white focus:border-blue-600 outline-hidden transition-all shadow-xs"
              />
              <button
                type="submit"
                disabled={!matchedPart || Boolean(usedInfo?.isUsed)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {usedInfo?.isUsed ? 'Đã Nhập' : 'Chọn'}
              </button>
            </div>
          </form>

          {/* Used QR Code Warning Banner (If scanned twice!) */}
          {usedInfo?.isUsed && (
            <div className="p-4 bg-red-50 border-2 border-red-400 text-red-900 rounded-2xl text-xs space-y-1.5 shadow-sm animate-in zoom-in-95 duration-150">
              <div className="flex items-center space-x-2 text-red-700 font-black">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 animate-bounce" />
                <span className="text-sm uppercase tracking-tight">⚠️ TEM QR NÀY ĐÃ ĐƯỢC NHẬP KHO TRƯỚC ĐÓ!</span>
              </div>
              <p className="text-slate-700 text-xs font-medium pl-7">
                Quét nhập kho lúc: <strong className="text-red-900 font-bold">{usedInfo.scannedAt}</strong>
                {usedInfo.scannedBy && <span> bởi <strong className="text-red-900">{usedInfo.scannedBy}</strong></span>}
              </p>
              <div className="pl-7 text-[11px] text-red-600 font-semibold italic">
                ⛔ QUY ĐỊNH KHO: Mỗi tem Cont chỉ được quét nhập kho ĐÚNG 1 LẦN DUY NHẤT để tránh nhập trùng làm sai lệch tồn kho.
              </div>
            </div>
          )}

          {/* Matched Part Card Preview */}
          {matchedPart ? (
            <div className={`p-4 rounded-2xl flex flex-col space-y-2.5 animate-in zoom-in-95 duration-150 border-2 ${
              usedInfo?.isUsed ? 'bg-slate-100 border-slate-300 opacity-75' : 'bg-emerald-50 border-emerald-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl text-white ${usedInfo?.isUsed ? 'bg-slate-500' : 'bg-emerald-600'}`}>
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-slate-900">{matchedPart.name}</p>
                    <p className="text-[11px] font-mono font-bold text-slate-600">
                      [{matchedPart.code}] • Vị trí: {matchedPart.location}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-600 font-medium">Tồn kho hiện tại:</span>
                  <p className="text-sm font-black text-slate-900">
                    {matchedPart.currentStock} {matchedPart.unit}
                  </p>
                </div>
              </div>

              {(scannedQty !== undefined || scannedCont) && (
                <div className={`pt-2 border-t flex items-center justify-between text-xs font-bold px-3 py-1.5 rounded-xl ${
                  usedInfo?.isUsed ? 'bg-red-100/80 border-red-200 text-red-900' : 'bg-amber-100/80 border-amber-200 text-amber-900'
                }`}>
                  <span>Thông Tin Tem Cont:</span>
                  <span>
                    {scannedCont && `Cont: ${scannedCont} • `}
                    {scannedQty !== undefined && `SL Cont: ${scannedQty} ${matchedPart.unit}`}
                  </span>
                </div>
              )}
            </div>
          ) : manualCode.trim() ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Chưa tìm thấy mã linh kiện khớp với <strong>"{manualCode}"</strong></span>
            </div>
          ) : null}

          {/* Camera Scanner Container */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <button
              type="button"
              onClick={isCameraActive ? stopCamera : startCamera}
              className={`w-full py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer border ${
                isCameraActive
                  ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <Camera className={`w-4 h-4 ${isCameraActive ? 'text-red-600' : 'text-blue-600'}`} />
              <span>{isCameraActive ? 'Tắt Camera Quét' : 'Bật Camera Quét Trực Tiếp'}</span>
            </button>

            <div className={isCameraActive ? 'block space-y-2' : 'hidden'}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                  <span>Camera Đang Hoạt Động</span>
                </span>
              </div>

              <div id="qr-reader" className="w-full rounded-2xl overflow-hidden border-2 border-blue-400 bg-black"></div>
            </div>

            {cameraError && (
              <p className="text-xs text-red-600 mt-2 font-medium">{cameraError}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>* Súng quét mã tự động kích hoạt khi quét.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
