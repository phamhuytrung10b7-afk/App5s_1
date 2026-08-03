import re

with open('BatchPrintQrModal.tsx', 'r') as f:
    content = f.read()

# Add imports
imports = """import { QRCodeSVG } from 'qrcode.react';
import { printHtml } from './printHelper';
import { getSavedPrintConfigs, savePrintConfigs, PrintLayout, AllPrintConfigs } from './printConfig';
"""
content = re.sub(r"import \{ QRCodeSVG \} from 'qrcode\.react';", imports, content)

# We need to add state for print configs inside the component:
# const [printConfigs, setPrintConfigs] = useState<AllPrintConfigs>(getSavedPrintConfigs());
# useEffect(() => savePrintConfigs(printConfigs), [printConfigs]);
#
# and a `printRef = useRef<HTMLDivElement>(null);`

state_injection = """  const [labelLayout, setLabelLayout] = useState<'double' | 'single' | 'a7'>('double');
  const [printConfigs, setPrintConfigs] = useState<AllPrintConfigs>(getSavedPrintConfigs());
  const printRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    savePrintConfigs(printConfigs);
  }, [printConfigs]);
"""
content = re.sub(r"  const \[labelLayout, setLabelLayout\] = useState<.*?>\('double'\);", state_injection, content)

# Add `useRef` and `useEffect` to react import if not present
if "useRef" not in content:
    content = content.replace("import React, { useState", "import React, { useState, useRef, useEffect")
elif "useEffect" not in content:
    content = content.replace("useState,", "useState, useEffect,")

# Replace handlePrint
handle_print = """  const handlePrint = () => {
    if (printRef.current) {
      const styles = `
        .label-row {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          page-break-after: always;
          break-after: page;
          overflow: hidden;
          background-color: white;
        }
        .single-label {
          box-sizing: border-box;
          display: flex;
          overflow: hidden;
          background-color: white;
        }
      `;
      printHtml(printRef.current.innerHTML, styles);
    }
  };"""

content = re.sub(r"  const handlePrint = \(\) => \{\n    window\.print\(\);\n  \};", handle_print, content)

# Now, we replace the {createPortal(...)} section with a hidden div using printRef
portal_regex = r"\{/\* PRINT-ONLY PORTAL \*/\}.*?document\.body\n\s*\)\}"
hidden_div = """      {/* HIDDEN PRINT RENDERING */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'hidden', overflow: 'hidden' }}>
        <div ref={printRef}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {labelRows.map((row, rowIndex) => {
              const conf = printConfigs[labelLayout];
              return (
              <div key={rowIndex} className="label-row" style={{ 
                  width: `${conf.pageWidth}mm`, 
                  height: `${conf.pageHeight}mm`,
                  padding: `${conf.padding}mm`,
                  gap: labelLayout === 'double' ? '2mm' : '0'
              }}>
                {row.map((item, colIndex) => (
                  <div key={colIndex} className="single-label" style={{
                      width: labelLayout === 'double' ? '35mm' : (labelLayout === 'single' ? '33mm' : '100%'),
                      height: labelLayout === 'a7' ? '100%' : '20mm',
                      flexDirection: labelLayout === 'a7' ? 'column' : 'row',
                      alignItems: 'center',
                      border: labelLayout === 'a7' ? '1px solid #ccc' : '0.5px solid #ccc',
                      borderRadius: labelLayout === 'a7' ? '4mm' : '2mm',
                      padding: labelLayout === 'a7' ? '4mm' : '1mm'
                  }}>
                    {labelLayout === 'a7' ? (
                        <>
                            <div style={{ textAlign: 'center', width: '100%' }}>
                                {showWarehouseName && (
                                    <div style={{ fontSize: `${conf.metaFontSize}px`, fontWeight: 'bold', color: '#555', marginBottom: '4mm', textTransform: 'uppercase' }}>
                                        {settings.warehouseName || 'KHO LINH KIỆN'}
                                    </div>
                                )}
                                <div style={{ fontSize: `${conf.nameFontSize}px`, fontWeight: '900', color: '#000', marginBottom: '6mm', lineHeight: '1.3', wordBreak: 'break-word', overflow: 'hidden' }}>
                                    {item.name}
                                </div>
                                <div style={{ fontSize: `${conf.codeFontSize}px`, fontWeight: 'bold', fontFamily: 'monospace', color: '#1e40af', padding: '3mm', background: '#f1f5f9', borderRadius: '2mm', display: 'inline-block' }}>
                                    {item.code}
                                </div>
                            </div>
                            <div style={{ width: `${conf.qrSize}mm`, height: `${conf.qrSize}mm`, margin: '4mm 0' }}>
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
                                    <div style={{ fontSize: `${conf.metaFontSize + 2}px`, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #ccc', paddingTop: '3mm' }}>
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
                            <div style={{ width: `${conf.qrSize}mm`, height: `${conf.qrSize}mm`, flexShrink: 0, marginRight: '1mm' }}>
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
                                <div style={{ fontSize: `${conf.metaFontSize}px`, fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {settings.warehouseName || 'KHO LINH KIỆN'}
                                </div>
                              )}
                              <div>
                                <div style={{ fontSize: `${conf.nameFontSize}px`, fontWeight: '900', color: '#000', maxHeight: '11mm', overflow: 'hidden', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                  {item.name}
                                </div>
                                <div style={{ fontSize: `${conf.codeFontSize}px`, fontWeight: 'bold', fontFamily: 'monospace', color: '#1e40af', marginTop: '0.5mm' }}>
                                  {item.code}
                                </div>
                              </div>
                              {showLocation && (
                                <div style={{ fontSize: `${conf.metaFontSize}px`, fontWeight: 'bold', borderTop: '0.5px solid #ccc', paddingTop: '0.5mm' }}>
                                  Kệ: {item.location || 'N/A'}
                                </div>
                              )}
                            </div>
                        </>
                    )}
                  </div>
                ))}
                
                {labelLayout === 'double' && row.length === 1 && (
                  <div className="single-label" style={{ visibility: 'hidden', width: '35mm' }} />
                )}
              </div>
            )})}
          </div>
        </div>
      </div>"""

content = re.sub(portal_regex, hidden_div, content, flags=re.DOTALL)

with open('BatchPrintQrModal.tsx', 'w') as f:
    f.write(content)
