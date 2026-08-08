import React, { useState } from 'react';
import { UserAccount } from './types';
import { storageService } from './storage';
import {
  Boxes,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  Scissors,
  BellRing,
  Package,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserAccount) => void;
  warehouseName?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, warehouseName }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập!');
      return;
    }
    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu!');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = storageService.login(username, password);
      setIsLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'Đăng nhập không thành công');
      }
    }, 300);
  };

  const handleQuickLogin = (usr: string, pass: string) => {
    setUsername(usr);
    setPassword(pass);
    setErrorMsg(null);
    setIsLoading(true);
    setTimeout(() => {
      const res = storageService.login(usr, pass);
      setIsLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.error || 'Đăng nhập thất bại');
      }
    }, 200);
  };

  const demoAccounts = [
    {
      username: 'admin',
      pass: '123',
      name: 'Nguyễn Văn Quản Trị',
      role: 'Quản Trị Viên (Admin)',
      desc: 'Toàn quyền tất cả 12 chức năng hệ thống',
      badge: 'Full Quyền',
      badgeBg: 'bg-red-500 text-white',
      icon: ShieldCheck,
      tabsCount: 12,
    },
    {
      username: 'thukho',
      pass: '123',
      name: 'Trần Văn Bình',
      role: 'Thủ Kho Trung Tâm',
      desc: 'Nhập/Xuất kho, Danh mục linh kiện, Thẻ kho, Sơ đồ kho, Báo cáo',
      badge: '7 Chức năng',
      badgeBg: 'bg-blue-600 text-white',
      icon: Package,
      tabsCount: 7,
    },
    {
      username: 'kitting',
      pass: '123',
      name: 'Lê Thị Hoa',
      role: 'Nhân Viên Bóc Tách Kitting',
      desc: 'Chỉ truy cập: Khu Bóc Tách Kitting & Sơ đồ Kệ OutBuffer',
      badge: '2 Chức năng',
      badgeBg: 'bg-purple-600 text-white',
      icon: Scissors,
      tabsCount: 2,
    },
    {
      username: 'daychuyen',
      pass: '123',
      name: 'Phạm Văn Mạnh',
      role: 'Công Nhân Dây Chuyền Lắp Ráp',
      desc: 'Chỉ truy cập: Gọi & Giao Hàng (Andon) & Sơ đồ Kệ OutBuffer',
      badge: '2 Chức năng',
      badgeBg: 'bg-amber-600 text-white',
      icon: BellRing,
      tabsCount: 2,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-500/20 ring-4 ring-blue-400/20 mb-2">
            <Boxes className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
            {warehouseName || 'HỆ THỐNG KHO LINH KIỆN TRUNG TÂM'}
          </h1>
          <p className="text-sm text-slate-300 max-w-lg mx-auto font-medium">
            Đăng nhập tài khoản để làm việc theo phân công nhiệm vụ và quyền hạn được cấp
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form Box */}
          <div className="lg:col-span-5 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <span>Đăng Nhập Tài Khoản</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Nhập tài khoản & mật khẩu của bạn để tiếp tục</p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl text-rose-800 text-xs font-bold animate-in fade-in">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên Đăng Nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: admin, thukho, kitting..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
                    autoCapitalize="none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Mật Khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold rounded-xl text-sm tracking-wide shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2 mt-2"
              >
                {isLoading ? (
                  <span>Đang xác thực...</span>
                ) : (
                  <>
                    <span>ĐĂNG NHẬP HỆ THỐNG</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-slate-400 text-xs">
              Mật khẩu mặc định các tài khoản mẫu: <strong className="text-slate-700 font-mono">123</strong>
            </div>
          </div>

          {/* Right Demo Account Quick Picker */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Tài Khoản Mẫu Phân Công Công Việc (Đăng nhập 1-Click)</span>
              </h3>
              <span className="text-xs text-slate-400">Bấm để đăng nhập ngay</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickLogin(acc.username, acc.pass)}
                    className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/80 rounded-2xl text-left transition-all group cursor-pointer space-y-2.5 relative overflow-hidden shadow-lg hover:shadow-blue-500/10"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 bg-slate-700/60 group-hover:bg-blue-600 group-hover:text-white rounded-xl text-slate-300 transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-sm group-hover:text-blue-300 transition-colors">
                            {acc.name}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-400 block">
                            user: <strong className="text-amber-300">{acc.username}</strong> | pass: <strong className="text-amber-300">123</strong>
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${acc.badgeBg}`}>
                        {acc.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">
                      {acc.desc}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-blue-400 font-bold pt-1">
                      <span>Được phép dùng {acc.tabsCount} chức năng</span>
                      <span className="group-hover:translate-x-1 transition-transform flex items-center space-x-1">
                        <span>Đăng nhập</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-xs text-slate-300 space-y-1.5">
              <p className="font-bold text-white flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Phân quyền chi tiết (RBAC) linh hoạt:</span>
              </p>
              <p className="text-slate-400">
                Tài khoản <strong className="text-slate-200">Admin</strong> có thể tạo thêm tài khoản mới và tích chọn chính xác từng chức năng (ví dụ: chỉ cho phép 1 hoặc 2 tab chức năng) tùy theo nhiệm vụ cụ thể của từng nhân viên trong kho.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
