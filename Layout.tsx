import React, { useState } from 'react';
import { NAV_ITEMS } from './constants';
import { 
  LayoutDashboard, 
  Download, 
  Upload, 
  Package, 
  Search, 
  Settings,
  Menu,
  X,
  Droplets,
  ClipboardCheck
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const IconMap: Record<string, React.FC<any>> = {
  LayoutDashboard,
  Download,
  Upload,
  Package,
  Search,
  Settings,
  ClipboardCheck
};

export const Layout: React.FC<LayoutProps> = ({ children, currentPath, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-water-900 text-white p-4 flex justify-between items-center shadow-md z-20 sticky top-0">
        <div className="flex items-center gap-2">
           <Droplets className="h-6 w-6 text-water-400" />
           <span className="font-bold text-lg">RO-Master</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:sticky md:top-0 h-screen w-64 bg-water-900 text-white shadow-xl z-10 transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
      >
        <div className="p-6 border-b border-water-800 flex items-center gap-3">
          <div className="bg-water-500 p-2 rounded-lg">
             <Droplets className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl">RO-Master</h1>
            <p className="text-water-300 text-xs">Giải pháp WMS</p>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = IconMap[item.icon];
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-water-700 text-white shadow-inner border-l-4 border-water-400' 
                    : 'text-water-100 hover:bg-water-800 hover:text-white'
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-water-800 bg-water-900">
           <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-water-500 flex items-center justify-center text-xs font-bold">
               QT
             </div>
             <div className="text-sm">
               <p className="font-semibold">Quản trị viên</p>
               <p className="text-water-400 text-xs">Quản lý kho</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};