import re

with open('SettingsView.tsx', 'r') as f:
    content = f.read()

# Add states for tabs
state_injection = """  const [activeTab, setActiveTab] = useState<'general' | 'warehouse_map'>('general');
  const [locations, setLocations] = useState<{id: string; name: string; description?: string;}[]>(settings.locations || []);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationDesc, setNewLocationDesc] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{id: string; name: string; description?: string;} | null>(null);

  // Computed: get parts currently in the selected location
  const partsInLocation = selectedLocation ? storageService.getParts().filter(p => p.location === selectedLocation.name) : [];

  const handleAddLocation = () => {
    if (!newLocationName.trim()) return;
    const newLoc = { id: `loc-${Date.now()}`, name: newLocationName.trim(), description: newLocationDesc.trim() };
    const updated = [...locations, newLoc];
    setLocations(updated);
    storageService.saveSettings({ ...settings, locations: updated });
    setNewLocationName('');
    setNewLocationDesc('');
  };

  const handleDeleteLocation = (id: string) => {
    const updated = locations.filter(loc => loc.id !== id);
    setLocations(updated);
    storageService.saveSettings({ ...settings, locations: updated });
    if (selectedLocation?.id === id) setSelectedLocation(null);
  };
"""

content = re.sub(r'const \[message, setMessage\] = useState<.*?null>\(null\);', r'const [message, setMessage] = useState<{ type: string; text: string } | null>(null);\n' + state_injection, content, flags=re.DOTALL)

# Add tabs UI
tabs_ui = """
      {/* Settings Tabs */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'general' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Cài Đặt Chung
        </button>
        <button
          onClick={() => setActiveTab('warehouse_map')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'warehouse_map' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sơ Đồ Kho (Vị Trí)
        </button>
      </div>

      {activeTab === 'general' && (
"""

content = content.replace("{/* General Form */}", tabs_ui + "\n      {/* General Form */}")

# End general tab and add warehouse map tab
warehouse_map_ui = """
      )}

      {activeTab === 'warehouse_map' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Sơ Đồ Vị Trí Lưu Trữ</h3>
            <p className="text-xs text-slate-500">Tạo các khoang, kệ (VD: A1, B2) như sơ đồ ghế máy bay để quản lý vị trí nhập linh kiện.</p>
            
            <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Tên vị trí (VD: Kệ A1)"
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
              />
              <input
                type="text"
                value={newLocationDesc}
                onChange={(e) => setNewLocationDesc(e.target.value)}
                placeholder="Mô tả (Không bắt buộc)"
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
              />
              <button
                type="button"
                onClick={handleAddLocation}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Thêm Vị Trí
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-4">
              {locations.map(loc => (
                <div 
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center ${selectedLocation?.id === loc.id ? 'border-emerald-500 bg-emerald-50 shadow-md transform scale-105' : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'}`}
                >
                  <div className="text-lg font-black text-slate-800 mb-1">{loc.name}</div>
                  {loc.description && <div className="text-[10px] text-slate-500">{loc.description}</div>}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteLocation(loc.id); }}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-100 hover:bg-red-500 text-red-600 hover:text-white rounded-full transition-colors opacity-0 hover:opacity-100"
                    style={{ opacity: selectedLocation?.id === loc.id ? 1 : undefined }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Details for selected location */}
          {selectedLocation && (
             <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
               <h3 className="font-bold text-emerald-800 text-sm">Đang chứa tại: {selectedLocation.name}</h3>
               {partsInLocation.length === 0 ? (
                 <p className="text-xs text-slate-500 italic">Chưa có linh kiện nào ở vị trí này.</p>
               ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                         <th className="p-3 font-semibold rounded-tl-xl">Mã LK</th>
                         <th className="p-3 font-semibold">Tên Linh Kiện</th>
                         <th className="p-3 font-semibold">Số Lượng Tồn</th>
                         <th className="p-3 font-semibold rounded-tr-xl">Đơn Vị</th>
                       </tr>
                     </thead>
                     <tbody className="text-xs divide-y divide-slate-100">
                       {partsInLocation.map(p => (
                         <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                           <td className="p-3 font-mono font-bold text-slate-700">{p.code}</td>
                           <td className="p-3 text-slate-900 font-semibold">{p.name}</td>
                           <td className="p-3 font-black text-emerald-600">{p.currentStock.toLocaleString('vi-VN')}</td>
                           <td className="p-3 text-slate-500">{p.unit}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
          )}
        </div>
      )}
"""

content = content.replace("    </div>\n  );\n}", warehouse_map_ui + "\n    </div>\n  );\n}")

with open('SettingsView.tsx', 'w') as f:
    f.write(content)

