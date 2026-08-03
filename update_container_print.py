import re

with open('ContainerImportPrintModal.tsx', 'r') as f:
    content = f.read()

# Add imports
imports = """import { QRCodeSVG } from 'qrcode.react';
import { printHtml } from './printHelper';
import { getSavedPrintConfigs, savePrintConfigs, PrintLayout, AllPrintConfigs } from './printConfig';
"""
content = re.sub(r"import \{ QRCodeSVG \} from 'qrcode\.react';", imports, content)

# Inject State
state_injection = """  const [labelLayout, setLabelLayout] = useState<'double' | 'single' | 'a7'>('double');
  const [printConfigs, setPrintConfigs] = useState<AllPrintConfigs>(getSavedPrintConfigs());
  const printRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    savePrintConfigs(printConfigs);
  }, [printConfigs]);
"""
content = re.sub(r"  const \[labelLayout, setLabelLayout\] = useState<.*?>\('double'\);", state_injection, content)

# Add Settings icon to lucide-react imports
if "Settings2" not in content:
    content = content.replace("Eye,", "Eye, Settings2,")
    content = content.replace("Check,", "Check, Settings2,")

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

# Add UI for settings
ui_insertion = """          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between w-full mb-4">
                <div className="flex items-center space-x-3 text-xs font-semibold text-slate-700">
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-500">Khổ tem:</span>
                    <select
                      value={labelLayout}
                      onChange={(e) => setLabelLayout(e.target.value as 'double' | 'single' | 'a7')}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-blue-700 focus:outline-none cursor-pointer"
                    >
                      <option value="double">Tem Đôi (73x22mm)</option>
                      <option value="single">Tem Đơn (35x22mm)</option>
                      <option value="a7">Tem A7 (74x105mm)</option>
                    </select>
                  </div>
                  <button
                      onClick={() => setShowSettings(!showSettings)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                          showSettings ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                      <Settings2 className="w-4 h-4" />
                      <span>Cài đặt kích thước</span>
                  </button>
                </div>
            </div>
            
            {showSettings && (
                <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cỡ chữ Tên (px)</label>
                        <input type="number" value={printConfigs[labelLayout].nameFontSize} onChange={(e) => setPrintConfigs({...printConfigs, [labelLayout]: {...printConfigs[labelLayout], nameFontSize: Number(e.target.value)}})} className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cỡ chữ Mã (px)</label>
                        <input type="number" value={printConfigs[labelLayout].codeFontSize} onChange={(e) => setPrintConfigs({...printConfigs, [labelLayout]: {...printConfigs[labelLayout], codeFontSize: Number(e.target.value)}})} className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kích thước QR (mm)</label>
                        <input type="number" value={printConfigs[labelLayout].qrSize} onChange={(e) => setPrintConfigs({...printConfigs, [labelLayout]: {...printConfigs[labelLayout], qrSize: Number(e.target.value)}})} className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono" />
                    </div>
                </div>
            )}
"""
content = re.sub(r"          <div className=\"p-4 border-b border-slate-200 bg-white\">\n            <div className=\"flex items-center space-x-3 text-xs font-semibold text-slate-700\">\n              <div className=\"flex items-center space-x-1\">\n                <span className=\"text-slate-500\">Khổ tem:</span>\n                <select\n                  value=\{labelLayout\}\n                  onChange=\{\(e\) => setLabelLayout\(e\.target\.value as 'double' \| 'single' \| 'a7'\)\}\n                  className=\"px-2\.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-blue-700 focus:outline-hidden cursor-pointer\"\n                >\n                  <option value=\"double\">Tem Đôi \(73x22mm - 2 Tem/Hàng\)</option>\n                  <option value=\"single\">Tem Đơn \(35x22mm - 1 Tem/Hàng\)</option>\n                  <option value=\"a7\">Tem A7 \(74x105mm\)</option>\n                </select>\n              </div>\n            </div>\n", ui_insertion, content, flags=re.DOTALL)

# Replace portal
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
                                <div style={{ fontSize: `${conf.metaFontSize}px`, fontWeight: 'bold', color: '#555', marginBottom: '4mm', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>CONT: {item.contNumber || contNumber}</span>
                                    <span>{item.contDate || contDate}</span>
                                </div>
                                <div style={{ fontSize: `${conf.nameFontSize}px`, fontWeight: '900', color: '#000', marginBottom: '6mm', lineHeight: '1.3', wordBreak: 'break-word', overflow: 'hidden' }}>
                                    {item.name}
                                </div>
                                <div style={{ fontSize: `${conf.codeFontSize}px`, fontWeight: 'bold', fontFamily: 'monospace', color: '#065f46', padding: '3mm', background: '#f1f5f9', borderRadius: '2mm', display: 'inline-block' }}>
                                    {item.code}
                                </div>
                            </div>
                            <div style={{ width: `${conf.qrSize}mm`, height: `${conf.qrSize}mm`, margin: '4mm 0' }}>
                              <QRCodeSVG
                                value={item.qrPayload}
                                size={300}
                                level="Q"
                                marginSize={1}
                                style={{ width: '100%', height: '100%' }}
                              />
                            </div>
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2mm', marginTop: 'auto' }}>
                                <div style={{ fontSize: `${conf.metaFontSize + 4}px`, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #ccc', paddingTop: '3mm' }}>
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
                            <div style={{ width: `${conf.qrSize}mm`, height: `${conf.qrSize}mm`, flexShrink: 0, marginRight: '1mm' }}>
                              <QRCodeSVG
                                value={item.qrPayload}
                                size={128}
                                level="M"
                                marginSize={0}
                                style={{ width: '100%', height: '100%' }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: 'sans-serif', lineHeight: '1.1' }}>
                              <div style={{ fontSize: `${conf.metaFontSize}px`, fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', justifyContent: 'space-between' }}>
                                <span>C: {item.contNumber || contNumber}</span>
                                <span>{item.contDate || contDate}</span>
                              </div>
                              <div>
                                <div style={{ fontSize: `${conf.nameFontSize}px`, fontWeight: '900', color: '#000', maxHeight: '11mm', overflow: 'hidden', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                  {item.name}
                                </div>
                                <div style={{ fontSize: `${conf.codeFontSize}px`, fontWeight: 'bold', fontFamily: 'monospace', color: '#065f46', marginTop: '0.5mm' }}>
                                  {item.code}
                                </div>
                              </div>
                              <div style={{ fontSize: `${conf.metaFontSize}px`, fontWeight: 'bold', borderTop: '0.5px solid #ccc', paddingTop: '0.5mm', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{item.unit}</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', backgroundColor: '#f59e0b', color: '#000', padding: '0 2px', borderRadius: '2px' }}>SL: {item.quantity.toLocaleString('vi-VN')}</span>
                              </div>
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

with open('ContainerImportPrintModal.tsx', 'w') as f:
    f.write(content)

