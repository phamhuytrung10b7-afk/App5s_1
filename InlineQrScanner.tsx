import React, { useState, useEffect, useRef } from 'react';
import { Part } from './types';
import { storageService } from './storage';
import { parseScannedQrPayload } from './QrScannerModal';
import { QrCode, Zap, Camera, ShieldAlert, CheckCircle2, AlertCircle, X, RotateCcw, Package } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface InlineQrScannerProps {
  mode: 'in' | 'out';
  parts: Part[];
  onScanSuccess: (data: {
    part: Part;
    qty?: number;
    contNumber?: string;
    tagId?: string;
    contDate?: string;
  }) => void;
  onClear?: () => void;
}

export const InlineQrScanner: React.FC<InlineQrScannerProps> = ({
  mode,
  parts,
  onScanSuccess,
  onClear,
}) => {
  const [scanInput, setScanInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedPart, setLastScannedPart] = useState<Part | null>(null);
  const [lastScannedDetails, setLastScannedDetails] = useState<{
    qty?: number;
    contNumber?: string;
    tagId?: string;
    contDate?: string;
  } | null>(null);
  const [usedInfo, setUsedInfo] = useState<{
    isUsed: boolean;
    scannedAt?: string;
    scannedBy?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const qrContainerId = `inline-qr-reader-${mode}`;

  // Auto focus input on mount and keep focus ready
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleProcessScan = (rawText: string) => {
    if (!rawText.trim()) return;

    setErrorMsg(null);
    setUsedInfo(null);

    // REJECT CONT_IN QR codes when in Stock Out mode!
    if (mode === 'out' && rawText.trim().startsWith('CONT_IN|')) {
      setErrorMsg('⛔ MÃ QR TEM CONT NÀY LÀ MÃ NHẬP KHO (CONT_IN)! KHÔNG THỂ DÙNG ĐỂ XUẤT KHO!');
      setLastScannedPart(null);
      setLastScannedDetails(null);
      return;
    }

    const parsed = parseScannedQrPayload(rawText);
    const foundPart = parts.find(
      (p) =>
        p.code.trim().toLowerCase() === parsed.partCode.trim().toLowerCase() ||
        p.id === parsed.partCode
    );

    if (!foundPart) {
      setErrorMsg(`Không tìm thấy linh kiện có mã: "${parsed.partCode}" trong kho!`);
      setLastScannedPart(null);
      setLastScannedDetails(null);
      return;
    }

    // Check duplicate scan for Stock In
    const tokenToCheck = parsed.tagId || rawText.trim();
    if (mode === 'in') {
      const usedCheck = storageService.isQrTokenUsed(tokenToCheck);
      if (usedCheck.isUsed) {
        setUsedInfo(usedCheck);
        setLastScannedPart(foundPart);
        setLastScannedDetails(parsed);
        return;
      }
    }

    setLastScannedPart(foundPart);
    setLastScannedDetails(parsed);

    // Clear scan input for next scan readiness
    setScanInput('');

    onScanSuccess({
      part: foundPart,
      qty: parsed.qty,
      contNumber: parsed.contNumber,
      tagId: parsed.tagId || rawText.trim(),
      contDate: parsed.contDate,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleProcessScan(scanInput);
    }
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (e) {
          console.warn('Error stopping scanner:', e);
        }
      }
      setIsCameraActive(false);
    } else {
      setIsCameraActive(true);
      setCameraError(null);

      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode(qrContainerId);
          html5QrCodeRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
            },
            (decodedText) => {
              setScanInput(decodedText);
              handleProcessScan(decodedText);
              // Pause camera after successful scan to conserve battery & focus
              if (html5QrCode.isScanning) {
                html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
                setIsCameraActive(false);
              }
            },
            () => {}
          );
        } catch (err: any) {
          console.error('Camera start error:', err);
          setCameraError('Không thể mở Camera. Vui lòng cấp quyền camera hoặc dùng súng quét USB.');
          setIsCameraActive(false);
        }
      }, 100);
    }
  };

  const handleReset = () => {
    setScanInput('');
    setLastScannedPart(null);
    setLastScannedDetails(null);
    setUsedInfo(null);
    setErrorMsg(null);
    if (onClear) onClear();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div className={`p-5 rounded-2xl shadow-md space-y-4 border-2 transition-all ${
      mode === 'in' 
        ? 'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 border-emerald-500 text-white'
        : 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 border-cyan-500 text-white'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-black shadow-md flex items-center justify-center">
            <Zap className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-md uppercase tracking-wider">
                QUY TRÌNH QUÉT ƯU TIÊN SỐ 1
              </span>
              <span className="text-[11px] text-emerald-200 font-semibold">Sẵn sàng nhận tín hiệu súng quét USB/Camera</span>
            </div>
            <h3 className="font-black text-sm sm:text-base text-white mt-0.5">
              {mode === 'in' ? 'QUÉT MÃ MẶC ĐỊNH NHẬP KHO' : 'QUÉT MÃ MẶC ĐỊNH XUẤT KHO'}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleCamera}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
              isCameraActive 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-300" />
            <span>{isCameraActive ? 'Tắt Camera' : 'Bật Camera Device'}</span>
          </button>

          {(scanInput || lastScannedPart || errorMsg) && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Quét lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Scan Input Box */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
          <QrCode className="w-4 h-4" />
          <span>Bấm con trỏ vào ô bên dưới hoặc bắn súng quét Barcode / QR:</span>
        </label>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={scanInput}
            onChange={(e) => {
              setScanInput(e.target.value);
              // Auto process if user pastes or fast scanner pastes full string
              if (e.target.value.includes('CONT_IN|') || e.target.value.length >= 10) {
                handleProcessScan(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="[Sẵn sàng quét...] Đặt con trỏ tại đây & bắn súng quét mã QR / Barcode..."
            className="w-full pl-4 pr-24 py-3.5 bg-slate-950/90 border-2 border-amber-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-400/20 text-amber-300 font-mono font-bold text-sm sm:text-base rounded-xl placeholder:text-slate-500 placeholder:font-normal placeholder:text-xs outline-hidden shadow-inner"
          />

          <button
            type="button"
            onClick={() => handleProcessScan(scanInput)}
            disabled={!scanInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 text-xs font-black rounded-lg transition-all cursor-pointer"
          >
            Nhận mã
          </button>
        </div>
        <p className="text-[11px] text-slate-300 flex items-center space-x-1 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1"></span>
          <span>Súng quét USB/Bluetooth tự động điền & ấn Enter. Không cần thao tác chuột.</span>
        </p>
      </div>

      {/* Camera Live View element */}
      <div className={`bg-slate-950 p-3 rounded-xl border border-amber-400/50 space-y-2 ${isCameraActive ? 'block' : 'hidden'}`}>
        <div id={qrContainerId} className="w-full rounded-lg overflow-hidden max-h-60"></div>
        <p className="text-[11px] text-center text-amber-200 font-medium">
          Đưa mã QR / Barcode vào ô hình vuông trên khung hình Camera
        </p>
      </div>

      {cameraError && (
        <div className="p-3 bg-red-950/80 border border-red-500/50 text-red-200 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* ERROR MSG */}
      {errorMsg && (
        <div className="p-3.5 bg-red-950/90 border-2 border-red-500 text-red-200 text-xs rounded-xl flex items-center justify-between font-bold shadow-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={handleReset} className="p-1 hover:bg-red-800 rounded-lg">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* WARNING IF QR CODE WAS ALREADY USED BEFORE */}
      {usedInfo?.isUsed && (
        <div className="p-4 bg-red-950 border-2 border-red-500 text-red-100 rounded-xl text-xs space-y-1.5 shadow-lg animate-in zoom-in-95">
          <div className="flex items-center space-x-2 text-red-400 font-black">
            <ShieldAlert className="w-5 h-5 shrink-0 text-red-400 animate-bounce" />
            <span className="text-sm uppercase tracking-tight">⚠️ CẢNH BÁO: TEM QR NÀY ĐÃ ĐƯỢC NHẬP KHO TRƯỚC ĐÓ!</span>
          </div>
          <p className="text-slate-200 text-xs font-medium pl-7">
            Đã nhập kho lúc: <strong className="text-amber-300 font-bold">{usedInfo.scannedAt}</strong>
            {usedInfo.scannedBy && <span> bởi <strong className="text-amber-300">{usedInfo.scannedBy}</strong></span>}
          </p>
          <div className="pl-7 text-[11px] text-red-300 font-semibold italic">
            ⛔ QUY ĐỊNH KHO: Mỗi tem Cont chỉ được quét nhập kho ĐÚNG 1 LẦN DUY NHẤT. Lần quét này bị khóa để chống trùng lặp.
          </div>
        </div>
      )}

      {/* SUCCESS RESULT CARD PREVIEW */}
      {lastScannedPart && !usedInfo?.isUsed && (
        <div className="p-4 bg-emerald-950/90 border-2 border-emerald-400 rounded-xl text-white space-y-2 animate-in fade-in-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-lg font-black">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-bold text-emerald-300 uppercase tracking-wide">ĐÃ QUÉT THÀNH CÔNG</p>
                  {lastScannedDetails?.qty && lastScannedDetails?.contNumber ? (
                    <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-md">
                      TEM QR CONT HỢP LỆ (TỰ ĐỘNG CỘNG TỒN)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-200 font-bold text-[10px] rounded-md">
                      MÃ LINH KIỆN THƯỜNG (CẦN NHẬP SỐ LƯỢNG)
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black text-white">{lastScannedPart.name}</h4>
                <p className="text-xs font-mono font-bold text-emerald-200">
                  Mã VT: [{lastScannedPart.code}] • Vị trí: {lastScannedPart.location}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-emerald-300">Tồn kho thực tế:</span>
              <p className="text-sm font-black text-amber-300">
                {lastScannedPart.currentStock} {lastScannedPart.unit}
              </p>
            </div>
          </div>

          {lastScannedDetails?.qty && lastScannedDetails?.contNumber ? (
            <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-xs font-bold text-amber-300 bg-emerald-900/60 px-3 py-1.5 rounded-lg">
              <span>Nội dung Tem QR Cont tự động:</span>
              <span>
                Cont: {lastScannedDetails.contNumber} • Số lượng tem: {lastScannedDetails.qty} {lastScannedPart.unit}
              </span>
            </div>
          ) : (
            <div className="pt-2 border-t border-emerald-800/80 text-xs font-semibold text-emerald-200 bg-emerald-900/40 px-3 py-1.5 rounded-lg">
              ℹ️ Đây là mã linh kiện đơn thuần. Hệ thống đã chọn linh kiện này giúp bạn, vui lòng nhập số lượng cần thực hiện.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
