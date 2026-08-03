import re

with open('ContainerImportPrintModal.tsx', 'r') as f:
    content = f.read()

# Replace the inner map for preview
# The original code looks like:
# <div className="flex flex-col items-center space-y-3 pb-8">
# {labelRows.map((row, rowIndex) => (
# <div key={`label-row-${rowIndex}-${row[0]?.id || row[0]?.tagId || ''}`}

start_str = '<div className="flex flex-col items-center space-y-3 pb-8">'
end_str = '</div>\n              )}\n            </div>\n          )}\n        </div>\n        {/* Footer */}'

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_preview = """<div className="flex flex-col items-center space-y-4 pb-8 overflow-y-auto max-h-[60vh]">
                  {labelRows.map((row, rowIndex) => (
                    <div
                      key={`label-row-${rowIndex}-${row[0]?.id || row[0]?.tagId || ''}`}
                      className={`bg-white border-2 border-dashed border-slate-400 p-1.5 rounded-lg shadow-md flex bg-amber-50/20 mx-auto ${
                        labelLayout === 'a7' ? 'flex-col items-center justify-center' : 'flex-row items-center space-x-1.5'
                      }`}
                      style={{
                        width: labelLayout === 'double' ? '420px' : (labelLayout === 'a7' ? '280px' : '210px'),
                        height: labelLayout === 'a7' ? '400px' : '125px', 
                      }}
                    >
                      {row.map((item, colIndex) => {
                        const scanState = checkScanStatus(item.tagId || item.id, item.qrPayload);
                        const isScanned = scanState.isScanned;
                        return (
                          <div
                            key={item.tagId || item.id || `col-${rowIndex}-${colIndex}`}
                            className={`flex-1 w-full h-full bg-white border border-slate-300 rounded-md overflow-hidden shadow-2xs relative flex transition-all ${
                               isScanned ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/80 shadow-emerald-100' : 'bg-white border-slate-300'
                            } ${
                               labelLayout === 'a7' ? 'flex-col items-center p-6' : 'flex-row items-center p-2'
                            }`}
                          >
                            <div className="absolute top-0.5 right-1 z-10 flex items-center space-x-1">
                              {isScanned ? (
                                <span className="px-1.5 py-0.5 bg-emerald-600 text-white font-black text-[8px] rounded-xs shadow-xs flex items-center space-x-0.5 uppercase tracking-wider">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  <span>ĐÃ SCAN</span>
                                </span>
                              ) : (
                                <span className="text-[8px] font-mono font-bold text-slate-400 bg-slate-100 px-1 rounded-xs border border-slate-200">
                                  CHƯA QUÉT
                                </span>
                              )}
                            </div>

                          {labelLayout === 'a7' ? (
                             <>
                                <div className="w-full text-center mt-4">
                                    <div className="flex items-center justify-between text-sm font-bold text-slate-600 truncate tracking-tighter mb-3">
                                       <span>CONT: {item.contNumber || contNumber}</span>
                                       <span className="text-amber-700">{item.contDate || contDate}</span>
                                    </div>
                                    <p className="text-xl font-black text-slate-900 leading-tight mb-3 line-clamp-4">
                                        {item.name}
                                    </p>
                                    <p className={`text-base font-mono font-bold py-1.5 px-3 rounded-md inline-block ${isScanned ? 'text-emerald-900 bg-emerald-200 font-black' : 'text-emerald-800 bg-emerald-50'}`}>
                                        {item.code}
                                    </p>
                                </div>
                                <div className="shrink-0 my-4">
                                    <QRCodeSVG value={item.qrPayload} size={160} level="Q" marginSize={1} />
                                </div>
                                <div className="w-full flex flex-col gap-3 mt-auto">
                                    <div className="flex items-center justify-between text-sm font-bold border-t-2 border-slate-200 pt-3">
                                      <span className="text-slate-500">{item.unit}</span>
                                      <span className={`px-3 py-1 rounded-md font-mono ${isScanned ? 'bg-emerald-700 text-white font-black' : 'bg-emerald-600 text-white'}`}>
                                        SL: {item.quantity.toLocaleString('vi-VN')}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 text-right mt-1 font-medium">
                                        Ngày in: {new Date().toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                                <span className="absolute top-2 right-2 text-[9px] font-mono text-slate-300">74x105mm</span>
                             </>
                          ) : (
                             <>
                                <div className="shrink-0 pr-2">
                                  <QRCodeSVG value={item.qrPayload} size={72} level="M" marginSize={0} />
                                </div>
                                <div className="flex-1 min-w-0 h-full flex flex-col justify-between py-0.5">
                                  <div className="text-[9px] font-bold text-slate-500 truncate uppercase tracking-tighter flex items-center justify-between pr-14">
                                    <span>C: {item.contNumber || contNumber}</span>
                                    <span className="text-amber-700 font-bold">{item.contDate || contDate}</span>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black text-slate-900 leading-tight line-clamp-2">
                                      {item.name}
                                    </p>
                                    <p className={`text-[10px] font-mono font-bold mt-0.5 ${isScanned ? 'text-emerald-900 font-black' : 'text-emerald-800'}`}>
                                      {item.code}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] font-extrabold border-t border-slate-200 pt-0.5">
                                    <span className="text-slate-500">{item.unit}</span>
                                    <span className={`px-1 rounded-xs font-mono ${isScanned ? 'bg-emerald-600 text-white font-black' : 'bg-amber-400 text-slate-950'}`}>
                                      SL: {item.quantity.toLocaleString('vi-VN')}
                                    </span>
                                  </div>
                                </div>
                                <span className="absolute top-0.5 right-1 text-[8px] font-mono text-slate-300">35x22mm</span>
                             </>
                          )}
                          </div>
                        );
                      })}
                      
                      {labelLayout === 'double' && row.length === 1 && (
                        <div className="flex-1 h-full bg-slate-100 border border-dashed border-slate-300 rounded-md p-2 flex items-center justify-center text-[10px] text-slate-400 italic">
                          (Tem trống)
                        </div>
                      )}
                    </div>
                  ))}
"""
    
    content = content[:start_idx] + new_preview + content[end_idx:]
    with open('ContainerImportPrintModal.tsx', 'w') as f:
        f.write(content)

