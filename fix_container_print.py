import re

with open('ContainerImportPrintModal.tsx', 'r') as f:
    content = f.read()

# 1. ensure createPortal is imported
if 'createPortal' not in content:
    content = content.replace("from 'react';", "from 'react';\nimport { createPortal } from 'react-dom';")

# 2. fix labelLayout
content = content.replace("useState<'a7'>('a7')", "useState<'double' | 'single' | 'a7'>('double')")

# 3. Fix the print css and html
start_str = '{/* PRINT-ONLY CSS CONTAINER'
start_idx = content.find(start_str)

end_idx = content.rfind('  );\n};')

print_block = """
      {/* PRINT-ONLY PORTAL */}
      {createPortal(
        <div className="hidden print:block print-portal-container">
          <style>{`
            @media print {
              @page {
                margin: 0;
              }
              body > *:not(.print-portal-container) {
                display: none !important;
              }
              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .print-portal-container {
                display: block !important;
                position: static !important;
                width: 100% !important;
                background: white !important;
              }
              .label-row {
                display: flex !important;
                flex-direction: row !important;
                justify-content: center !important;
                align-items: center !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                break-after: page !important;
                overflow: hidden !important;
                background-color: white !important;
              }
              
              /* Layout: Double 73x22mm */
              .layout-double .label-row {
                width: 73mm !important;
                height: 22mm !important;
                gap: 2mm !important;
                padding: 1mm !important;
              }
              .layout-double .single-label {
                width: 35mm !important;
                height: 20mm !important;
              }

              /* Layout: Single 35x22mm */
              .layout-single .label-row {
                width: 35mm !important;
                height: 22mm !important;
                padding: 1mm !important;
              }
              .layout-single .single-label {
                width: 33mm !important;
                height: 20mm !important;
              }

              /* Layout: A7 74x105mm */
              .layout-a7 .label-row {
                width: 74mm !important;
                height: 105mm !important;
                padding: 4mm !important;
              }
              .layout-a7 .single-label {
                width: 100% !important;
                height: 100% !important;
              }

              .single-label {
                box-sizing: border-box !important;
                display: flex !important;
                overflow: hidden !important;
                background-color: white !important;
              }
              
              /* A7 specifics */
              .layout-a7 .single-label {
                flex-direction: column !important;
                align-items: center !important;
                border: 1px solid #ccc !important;
                border-radius: 4mm !important;
                padding: 4mm !important;
              }
              
              /* Double/Single specifics */
              .layout-double .single-label, .layout-single .single-label {
                flex-direction: row !important;
                align-items: center !important;
                border: 0.5px solid #ccc !important;
                border-radius: 2mm !important;
                padding: 1mm !important;
              }
            }
          `}</style>
          
          <div className={`layout-${labelLayout}`}>
            {labelRows.map((row, rowIndex) => (
              <div key={rowIndex} className="label-row">
                {row.map((item, colIndex) => (
                  <div key={colIndex} className="single-label">
                    
                    {labelLayout === 'a7' ? (
                        <>
                            <div style={{ textAlign: 'center', width: '100%' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#555', marginBottom: '4mm', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>CONT: {item.contNumber || contNumber}</span>
                                    <span>{item.contDate || contDate}</span>
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: '#000', marginBottom: '6mm', lineHeight: '1.3' }}>
                                    {item.name}
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', color: '#065f46', padding: '3mm', background: '#f1f5f9', borderRadius: '2mm', display: 'inline-block' }}>
                                    {item.code}
                                </div>
                            </div>
                            <div style={{ width: '50mm', height: '50mm', margin: '4mm 0' }}>
                              <QRCodeSVG
                                value={item.qrPayload}
                                size={300}
                                level="Q"
                                marginSize={1}
                                style={{ width: '100%', height: '100%' }}
                              />
                            </div>
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2mm', marginTop: 'auto' }}>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #ccc', paddingTop: '3mm' }}>
                                    <span>{item.unit}</span>
                                    <span style={{ fontFamily: 'monospace', fontWeight: '900', background: '#166534', color: 'white', padding: '1.5mm 4mm', borderRadius: '2mm' }}>SL: {item.quantity.toLocaleString('vi-VN')}</span>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b', textAlign: 'right' }}>
                                    Ngày in: {new Date().toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Double or Single layout */}
                            <div style={{ width: '16mm', height: '16mm', flexShrink: 0, marginRight: '1mm' }}>
                              <QRCodeSVG
                                value={item.qrPayload}
                                size={128}
                                level="M"
                                marginSize={0}
                                style={{ width: '100%', height: '100%' }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: 'sans-serif', lineHeight: '1.1' }}>
                              <div style={{ fontSize: '7px', fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', justifyContent: 'space-between' }}>
                                <span>C: {item.contNumber || contNumber}</span>
                                <span>{item.contDate || contDate}</span>
                              </div>
                              <div>
                                <div style={{ fontSize: '9px', fontWeight: '900', color: '#000', maxHeight: '11mm', overflow: 'hidden', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                  {item.name}
                                </div>
                                <div style={{ fontSize: '8px', fontWeight: 'bold', fontFamily: 'monospace', color: '#065f46', marginTop: '0.5mm' }}>
                                  {item.code}
                                </div>
                              </div>
                              <div style={{ fontSize: '8px', fontWeight: 'bold', borderTop: '0.5px solid #ccc', paddingTop: '0.5mm', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{item.unit}</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', backgroundColor: '#f59e0b', color: '#000', padding: '0 2px', borderRadius: '2px' }}>SL: {item.quantity.toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                        </>
                    )}

                  </div>
                ))}
                
                {labelLayout === 'double' && row.length === 1 && (
                  <div className="single-label" style={{ visibility: 'hidden' }} />
                )}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
"""

content = content[:start_idx] + print_block

# Now fix preview
start_str = '<div className="flex flex-col items-center space-y-4 pb-8 overflow-y-auto max-h-[60vh]">'
start_idx = content.find(start_str)
end_idx = content.find('{/* PRINT-ONLY PORTAL */}')

new_preview = """<div className="flex flex-col items-center space-y-4 pb-8 overflow-y-auto max-h-[60vh]">
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
                                    <div className="flex items-center justify-between text-sm font-bold text-slate-600 truncate tracking-tighter mb-3">
                                       <span>CONT: {item.contNumber || contNumber}</span>
                                       <span className="text-amber-700">{item.contDate || contDate}</span>
                                    </div>
                                    <p className="text-xl font-black text-slate-900 leading-tight mb-3 line-clamp-4">
                                        {item.name}
                                    </p>
                                    <p className="text-base font-mono font-bold text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-md inline-block">
                                        {item.code}
                                    </p>
                                </div>
                                <div className="shrink-0 my-4">
                                    <QRCodeSVG value={item.qrPayload} size={160} level="Q" marginSize={1} />
                                </div>
                                <div className="w-full flex flex-col gap-3 mt-auto">
                                    <div className="flex items-center justify-between text-sm font-bold border-t-2 border-slate-200 pt-3">
                                      <span className="text-slate-500">{item.unit}</span>
                                      <span className="bg-emerald-700 text-white px-3 py-1 rounded-md font-mono">
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
                                  <QRCodeSVG value={item.qrPayload} size={75} level="M" marginSize={0} />
                                </div>
                                <div className="flex-1 min-w-0 h-full flex flex-col justify-between py-0.5">
                                  <div className="text-[9px] font-bold text-slate-500 truncate uppercase tracking-tighter flex justify-between">
                                    <span>C: {item.contNumber || contNumber}</span>
                                    <span>{item.contDate || contDate}</span>
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black text-slate-900 leading-tight line-clamp-3">
                                      {item.name}
                                    </p>
                                    <p className="text-[11px] font-mono font-bold text-emerald-700 mt-0.5">
                                      {item.code}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] font-bold border-t border-slate-200 pt-0.5">
                                    <span className="text-slate-500">{item.unit}</span>
                                    <span className="bg-amber-400 text-black px-1 rounded-xs font-mono">SL: {item.quantity.toLocaleString('vi-VN')}</span>
                                  </div>
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
            <button onClick={handlePrint} disabled={totalSelectedLabels === 0} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md cursor-pointer transition-colors flex items-center space-x-1.5">
              <Printer className="w-4 h-4" />
              <span>In Ngay ({totalSelectedLabels} tem)</span>
            </button>
          </div>
        </div>
      </div>
"""

content = content[:start_idx] + new_preview + content[end_idx:]
with open('ContainerImportPrintModal.tsx', 'w') as f:
    f.write(content)

