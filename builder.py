import re
import os

def build_modals():
    batch_path = 'BatchPrintQrModal.tsx'
    with open(batch_path, 'r') as f:
        content = f.read()
    
    # 1. ensure createPortal is imported
    if 'createPortal' not in content:
        content = content.replace("from 'react';", "from 'react';\nimport { createPortal } from 'react-dom';")

    # 2. fix labelLayout
    content = content.replace("useState<'a7'>('a7')", "useState<'double' | 'single' | 'a7'>('double')")

    # 3. fix print css and html - use createPortal, completely replace the block
    start_str = '{/* PRINT-ONLY CSS CONTAINER'
    start_idx = content.find(start_str)
    
    # We replace everything from start_idx to the end, except the last '  );\n};'
    end_idx = content.rfind('  );\n};')
    
    # But wait, what if we just replace the whole print block.
    # The print block is basically a hidden div. We will replace it with createPortal.
    print_block = """
      {/* PRINT-ONLY PORTAL */}
      {createPortal(
        <div className="hidden print:block print-portal-container">
          <style>{`
            @media print {
              @page {
                margin: 0;
                /* If A7: size: 74mm 105mm; */
                /* If 35x22: size: 73mm 22mm; (for double) */
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
                                {showWarehouseName && (
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#555', marginBottom: '4mm', textTransform: 'uppercase' }}>
                                        {settings.warehouseName || 'KHO LINH KIỆN'}
                                    </div>
                                )}
                                <div style={{ fontSize: '24px', fontWeight: '900', color: '#000', marginBottom: '6mm', lineHeight: '1.3' }}>
                                    {item.name}
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', color: '#1e40af', padding: '3mm', background: '#f1f5f9', borderRadius: '2mm', display: 'inline-block' }}>
                                    {item.code}
                                </div>
                            </div>
                            <div style={{ width: '50mm', height: '50mm', margin: '4mm 0' }}>
                              <QRCodeSVG
                                value={item.qrCode || item.code}
                                size={300}
                                level="Q"
                                marginSize={1}
                                style={{ width: '100%', height: '100%' }}
                              />
                            </div>
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2mm', marginTop: 'auto' }}>
                                {showLocation && (
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #ccc', paddingTop: '3mm' }}>
                                        <span>VỊ TRÍ (KỆ):</span>
                                        <span style={{ fontFamily: 'monospace', fontWeight: '900', background: '#0f172a', color: 'white', padding: '1.5mm 4mm', borderRadius: '2mm' }}>{item.location || 'N/A'}</span>
                                    </div>
                                )}
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
                                value={item.qrCode || item.code}
                                size={128}
                                level="M"
                                marginSize={0}
                                style={{ width: '100%', height: '100%' }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: 'sans-serif', lineHeight: '1.1' }}>
                              {showWarehouseName && (
                                <div style={{ fontSize: '7px', fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {settings.warehouseName || 'KHO LINH KIỆN'}
                                </div>
                              )}
                              <div>
                                <div style={{ fontSize: '9px', fontWeight: '900', color: '#000', maxHeight: '11mm', overflow: 'hidden', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                  {item.name}
                                </div>
                                <div style={{ fontSize: '8px', fontWeight: 'bold', fontFamily: 'monospace', color: '#1e40af', marginTop: '0.5mm' }}>
                                  {item.code}
                                </div>
                              </div>
                              {showLocation && (
                                <div style={{ fontSize: '8px', fontWeight: 'bold', borderTop: '0.5px solid #ccc', paddingTop: '0.5mm', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>KỆ:</span>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold', backgroundColor: '#0f172a', color: 'white', padding: '0 2px', borderRadius: '2px' }}>{item.location}</span>
                                </div>
                              )}
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
    
    # We will replace from start_idx to the end
    content = content[:start_idx] + print_block

    # Fix the preview rendering.
    preview_start = content.find('<div className="flex flex-col items-center space-y-3 pb-8">')
    if preview_start != -1:
        # replace the whole preview container
        pass 
        
    with open(batch_path, 'w') as f:
        f.write(content)

build_modals()
