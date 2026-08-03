with open('ContainerImportPrintModal.tsx', 'r') as f:
    content = f.read()

first_portal = content.find('{/* PRINT-ONLY PORTAL */}')
clean_content = content[:first_portal]

print_block = """      {/* PRINT-ONLY PORTAL */}
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

new_content = clean_content + print_block

with open('ContainerImportPrintModal.tsx', 'w') as f:
    f.write(new_content)

