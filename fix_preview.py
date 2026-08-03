import re

with open('BatchPrintQrModal.tsx', 'r') as f:
    content = f.read()

# Fix the preview loop block
start_str = '<div className="flex flex-col items-center space-y-3 pb-8">'
start_idx = content.find(start_str)
end_idx = content.find('{/* PRINT-ONLY PORTAL */}')

new_preview = """<div className="flex flex-col items-center space-y-3 pb-8">
                  {labelRows.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className={`bg-white border-2 border-dashed border-slate-400 p-1.5 rounded-lg shadow-md flex bg-amber-50/20 mx-auto ${
                        labelLayout === 'a7' ? 'flex-col items-center justify-center' : 'flex-row items-center space-x-1.5'
                      }`}
                      style={{
                        width: labelLayout === 'double' ? '420px' : (labelLayout === 'a7' ? '280px' : '210px'),
                        height: labelLayout === 'a7' ? '400px' : '125px', 
                      }}
                    >
                      {row.map((item, colIndex) => (
                        <div
                          key={colIndex}
                          className={`flex-1 w-full h-full bg-white border border-slate-300 rounded-md overflow-hidden shadow-2xs relative flex ${
                             labelLayout === 'a7' ? 'flex-col items-center p-6' : 'flex-row items-center p-2'
                          }`}
                        >
                          {labelLayout === 'a7' ? (
                             <>
                                <div className="w-full text-center">
                                    {showWarehouseName && (
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 line-clamp-1">
                                            {settings.warehouseName || 'KHO LINH KIỆN'}
                                        </p>
                                    )}
                                    <p className="text-xl font-black text-slate-900 leading-tight mb-3 line-clamp-4">
                                        {item.name}
                                    </p>
                                    <p className="text-base font-mono font-bold text-blue-800 bg-blue-50 py-1.5 px-3 rounded-md inline-block">
                                        {item.code}
                                    </p>
                                </div>
                                <div className="shrink-0 my-4">
                                    <QRCodeSVG value={item.qrCode || item.code} size={160} level="Q" marginSize={1} />
                                </div>
                                <div className="w-full flex flex-col gap-3 mt-auto">
                                    {showLocation && (
                                        <div className="flex items-center justify-between text-sm font-bold border-t-2 border-slate-200 pt-3">
                                            <span className="text-slate-500">KỆ:</span>
                                            <span className="bg-slate-900 text-white px-3 py-1 rounded-md font-mono">{item.location || 'N/A'}</span>
                                        </div>
                                    )}
                                    <p className="text-[11px] text-slate-400 text-right mt-1 font-medium">
                                        Ngày in: {new Date().toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                                <span className="absolute top-2 right-2 text-[9px] font-mono text-slate-300">74x105mm</span>
                             </>
                          ) : (
                             <>
                                <div className="shrink-0 pr-2">
                                  <QRCodeSVG value={item.qrCode || item.code} size={75} level="M" marginSize={0} />
                                </div>
                                <div className="flex-1 min-w-0 h-full flex flex-col justify-between py-0.5">
                                  {showWarehouseName && (
                                    <p className="text-[9px] font-bold text-slate-500 truncate uppercase tracking-tighter">
                                      {settings.warehouseName || 'KHO LINH KIỆN'}
                                    </p>
                                  )}
                                  <div>
                                    <p className="text-[11px] font-black text-slate-900 leading-tight line-clamp-3">
                                      {item.name}
                                    </p>
                                    <p className="text-[11px] font-mono font-bold text-blue-700 mt-0.5">
                                      {item.code}
                                    </p>
                                  </div>
                                  {showLocation && (
                                    <div className="flex items-center justify-between text-[10px] font-bold border-t border-slate-200 pt-0.5">
                                      <span className="text-slate-500">KỆ:</span>
                                      <span className="bg-slate-900 text-white px-1 rounded-xs font-mono">{item.location}</span>
                                    </div>
                                  )}
                                </div>
                                <span className="absolute top-0.5 right-1 text-[8px] font-mono text-slate-300">35x22mm</span>
                             </>
                          )}
                        </div>
                      ))}
                      
                      {labelLayout === 'double' && row.length === 1 && (
                        <div className="flex-1 h-full bg-slate-100 border border-dashed border-slate-300 rounded-md p-2 flex items-center justify-center text-[10px] text-slate-400 italic">
                          (Tem trống)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span>* Hỗ trợ cài đặt lề máy in nhiệt: Lề (Margins) = None (Không có), Tỉ lệ (Scale) = 100%</span>
          <div className="flex items-center space-x-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors">Đóng</button>
            <button onClick={handlePrint} disabled={totalSelectedLabels === 0} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md cursor-pointer transition-colors flex items-center space-x-1.5">
              <Printer className="w-4 h-4" />
              <span>In Ngay ({totalSelectedLabels} tem)</span>
            </button>
          </div>
        </div>
      </div>
"""

content = content[:start_idx] + new_preview + content[end_idx:]
with open('BatchPrintQrModal.tsx', 'w') as f:
    f.write(content)

