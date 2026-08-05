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

  const playBeepSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // ignore
    }
  };

  const handleProcessScan = (rawText: string) => {
    if (!rawText.trim()) return;

    playBeepSound();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    setErrorMsg(null);
    setUsedInfo(null);

    // Allow scanning CONT_IN QR tags in Stock Out mode to identify the part code!
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

    // STRICT CONTAINER BATCH VALIDATION FOR STOCK IN
    if (mode === 'in') {
      const validCheck = storageService.validateContainerQrTag(rawText, parsed);
      if (!validCheck.isValid) {
        setErrorMsg(`⛔ ${validCheck.reason}`);
        setLastScannedPart(null);
        setLastScannedDetails(null);
        return;
      }

      // Check if already fully imported
      const tokenToCheck = parsed.tagId || rawText.trim();
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
      // For stock out, do not pass quantity from QR tag so user enters real quantity and selects shelf
      qty: mode === 'out' ? undefined : parsed.qty,
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

          const onScanSuccess = (decodedText: string) => {
            setScanInput(decodedText);
            handleProcessScan(decodedText);
            if (html5QrCode.isScanning) {
              html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
              setIsCameraActive(false);
            }
          };

          // Prefer facingMode environment directly for native OS back-camera autofocus selection
          let cameraParam: any = { facingMode: 'environment' };

          const qrConfig = {
            fps: 25, // 25 scans per second for near-instant QR recognition
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              // Expand scan area to 92% of frame so QR code anywhere in video is decoded instantly
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdge * 0.92);
              return { width: Math.max(qrboxSize, 220), height: Math.max(qrboxSize, 220) };
            },
            aspectRatio: 1.0,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true,
            },
          };

          try {
            await html5QrCode.start(cameraParam, qrConfig, onScanSuccess, () => {});
          } catch (firstErr) {
            console.warn('Initial camera launch with environment facingMode failed, retrying with device list...', firstErr);
            const devices = await Html5Qrcode.getCameras().catch(() => []);
            let cameraId: any = { facingMode: 'user' };
            if (devices && devices.length > 0) {
              const backCamera = devices.find((d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('environment') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('sau')
              );
              cameraId = backCamera ? backCamera.id : devices[devices.length - 1].id;
            }
            await html5QrCode.start(cameraId, qrConfig, onScanSuccess, () => {});
          }
        } catch (err: any) {
          console.error('Camera start error:', err);
          setCameraError(
            'Không thể truy cập Camera. Vui lòng kiểm tra và cho phép quyền camera trong trình duyệt hoặc mở Web ở tab mới.'
          );
          setIsCameraActive(false);
        }
      }, 150);
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
    <div className={`p-4 sm:p-5 rounded-2xl shadow-xs space-y-4 border-2 transition-all ${
      mode === 'in' 
        ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
        : 'bg-blue-50/60 border-blue-300 text-slate-900'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl font-bold border border-amber-200 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-600 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-[10px] rounded-md uppercase tracking-wider border border-amber-200">
                QUÉT MÃ TỰ ĐỘNG
              </span>
              <span className="text-[11px] text-slate-600 font-medium">Nhận diện bằng súng quét USB / Bluetooth / Camera</span>
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mt-0.5">
              {mode === 'in' ? 'QUÉT MÃ MẶC ĐỊNH NHẬP KHO' : 'QUÉT MÃ MẶC ĐỊNH XUẤT KHO'}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleCamera}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
              isCameraActive 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
          >
            <Camera className="w-4 h-4 text-white" />
            <span>{isCameraActive ? 'Tắt Camera' : 'Bật Camera Scannner'}</span>
          </button>

          {(scanInput || lastScannedPart || errorMsg) && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Quét lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Scan Input Box - BRIGHT LIGHT STYLING */}
      <div className="space-y-2">
        <label className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
          <QrCode className="w-4 h-4 text-emerald-600" />
          <span>Đặt con trỏ vào ô bên dưới hoặc bắn súng quét Barcode / QR:</span>
        </label>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={scanInput}
            onChange={(e) => {
              setScanInput(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="[Sẵn sàng quét...] Bắn súng quét mã QR / Barcode hoặc gõ mã..."
            className="w-full pl-4 pr-24 py-3 bg-white border-2 border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-slate-900 font-mono font-bold text-sm sm:text-base rounded-xl placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs outline-hidden shadow-2xs"
          />

          <button
            type="button"
            onClick={() => handleProcessScan(scanInput)}
            disabled={!scanInput.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
          >
            Nhận mã
          </button>
        </div>
        <p className="text-[11px] text-slate-500 flex items-center space-x-1 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block mr-1"></span>
          <span>Súng quét USB/Bluetooth tự động điền & ấn Enter. Không cần thao tác chuột.</span>
        </p>
      </div>

      {/* Camera Live View element - BRIGHT LIGHT CONTAINER */}
      <div className={`bg-slate-100 p-3 rounded-2xl border-2 border-slate-300 space-y-2 ${isCameraActive ? 'block' : 'hidden'}`}>
        <div id={qrContainerId} className="w-full rounded-xl overflow-hidden min-h-[280px] bg-white border border-slate-200"></div>
        <p className="text-[11px] text-center text-slate-700 font-bold flex items-center justify-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block mr-1"></span>
          <span>Đưa mã QR / Barcode vào khung hình Camera (Tự động nhận diện)</span>
        </p>
      </div>

      {cameraError && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs rounded-xl flex items-center space-x-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* ERROR MSG */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border-2 border-red-300 text-red-900 text-xs rounded-xl flex items-center justify-between font-bold shadow-2xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={handleReset} className="p-1 hover:bg-red-100 rounded-lg">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      )}

      {/* WARNING IF QR CODE WAS ALREADY USED BEFORE */}
      {usedInfo?.isUsed && (
        <div className="p-4 bg-red-50 border-2 border-red-400 text-red-900 rounded-xl text-xs space-y-1.5 shadow-2xs animate-in zoom-in-95">
          <div className="flex items-center space-x-2 text-red-700 font-black">
            <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 animate-bounce" />
            <span className="text-sm uppercase tracking-tight">⚠️ CẢNH BÁO: TEM QR NÀY ĐÃ ĐƯỢC NHẬP KHO TRƯỚC ĐÓ!</span>
          </div>
          <p className="text-slate-800 text-xs font-medium pl-7">
            Đã nhập kho lúc: <strong className="text-red-950 font-bold">{usedInfo.scannedAt}</strong>
            {usedInfo.scannedBy && <span> bởi <strong className="text-red-950">{usedInfo.scannedBy}</strong></span>}
          </p>
          <div className="pl-7 text-[11px] text-red-700 font-semibold italic">
            ⛔ QUY ĐỊNH KHO: Mỗi tem Cont chỉ được quét nhập kho ĐÚNG 1 LẦN DUY NHẤT. Lần quét này bị khóa để chống trùng lặp.
          </div>
        </div>
      )}

      {/* SUCCESS RESULT CARD PREVIEW - BRIGHT LIGHT CARD */}
      {lastScannedPart && !usedInfo?.isUsed && (
        <div className="p-4 bg-white border-2 border-emerald-300 rounded-xl text-slate-900 space-y-2 shadow-2xs animate-in fade-in-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg font-bold">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">ĐÃ QUÉT THÀNH CÔNG</p>
                  {lastScannedDetails?.qty && lastScannedDetails?.contNumber ? (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[10px] rounded-md">
                      TEM QR CONT HỢP LỆ
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md border border-slate-200">
                      MÃ LINH KIỆN THƯỜNG
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900">{lastScannedPart.name}</h4>
                <p className="text-xs font-mono font-bold text-slate-600">
                  Mã VT: [{lastScannedPart.code}] • Vị trí: {lastScannedPart.location}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500">Tồn kho thực tế:</span>
              <p className="text-sm font-black text-emerald-700">
                {lastScannedPart.currentStock} {lastScannedPart.unit}
              </p>
            </div>
          </div>

          {lastScannedDetails?.qty && lastScannedDetails?.contNumber ? (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/60">
              <span>Nội dung Tem QR Cont tự động:</span>
              <span>
                Cont: {lastScannedDetails.contNumber} • Số lượng tem: {lastScannedDetails.qty} {lastScannedPart.unit}
              </span>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
              ℹ️ Đã chọn linh kiện [{lastScannedPart.code}]. Vui lòng điền số lượng và vị trí kệ để tiếp tục.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
