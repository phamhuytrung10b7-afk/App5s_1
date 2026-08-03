import re

with open('BatchPrintQrModal.tsx', 'r') as f:
    content = f.read()

# Add Settings icon to lucide-react imports
if "Settings2" not in content:
    content = content.replace("Eye,", "Eye, Settings2,")

# Add the UI
ui_insertion = """          {/* Quick Print Configs */}
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

content = re.sub(r"          \{/\* Quick Print Configs \*/\}.*?</select>\n            </div>\n          </div>", ui_insertion, content, flags=re.DOTALL)

with open('BatchPrintQrModal.tsx', 'w') as f:
    f.write(content)
