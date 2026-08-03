import re

with open('ContainerImportPrintModal.tsx', 'r') as f:
    content = f.read()

# I will replace the select container with the new UI.
old_ui_pattern = r"          <div className=\"flex items-center space-x-3 text-xs font-semibold text-slate-700\">\n            <div className=\"flex items-center space-x-1\">\n              <span className=\"text-slate-500\">Khổ giấy:</span>\n              <select.*?<\/select>\n            </div>\n          </div>"

ui_insertion = """          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-3 text-xs font-semibold text-slate-700">
              <div className="flex items-center space-x-1">
                <span className="text-slate-500">Khổ giấy:</span>
                <select
                  value={labelLayout}
                  onChange={(e) => setLabelLayout(e.target.value as 'double' | 'single' | 'a7')}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-emerald-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="double">Tem Đôi (73x22mm)</option>
                  <option value="single">Tem Đơn (35x22mm)</option>
                  <option value="a7">Khổ A7 (74x105mm)</option>
                </select>
              </div>
              <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                      showSettings ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                  <Settings2 className="w-4 h-4" />
                  <span>Cài đặt kích thước</span>
              </button>
            </div>
          </div>
          
          {showSettings && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-4">
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

content = re.sub(old_ui_pattern, ui_insertion, content, flags=re.DOTALL)

with open('ContainerImportPrintModal.tsx', 'w') as f:
    f.write(content)

