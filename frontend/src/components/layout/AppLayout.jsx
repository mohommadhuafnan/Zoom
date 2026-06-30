import {
  Home as HomeIcon,
  Video,
  MessageSquare,
  Calendar,
  Layout,
  MoreHorizontal,
  Settings,
  Search,
  Plus,
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: HomeIcon, label: 'Home' },
  { to: '/history', icon: Video, label: 'Meetings' },
  { to: '/join', icon: MessageSquare, label: 'Join' },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left sidebar — Zoom-style */}
      <aside className="w-[72px] bg-white border-r border-gray-200 flex flex-col items-center py-4 shrink-0">
        <div className="mb-6">
          <div className="w-10 h-10 bg-zoom-blue rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col items-center gap-1 w-full">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 w-full py-3 text-xs transition-colors ${
                  isActive ? 'text-zoom-blue' : 'text-gray-500 hover:text-gray-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-zoom-blue rounded-r" />
                  )}
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => navigate('/profile')}
          className="flex flex-col items-center gap-0.5 py-3 text-xs text-gray-500 hover:text-gray-800"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0">
          <div className="flex items-center gap-2 text-gray-400">
            <button className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4" /></button>
            <button className="p-1 hover:bg-gray-100 rounded"><Clock className="w-4 h-4" /></button>
          </div>

          <h1 className="text-lg font-semibold text-gray-800 mr-4">UniMeet Workplace</h1>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search meetings"
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-zoom-blue/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="p-2 hover:bg-gray-100 rounded-full"><Plus className="w-5 h-5 text-gray-600" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-full"><Bell className="w-5 h-5 text-gray-600" /></button>
            <button className="p-2 hover:bg-gray-100 rounded-full"><Calendar className="w-5 h-5 text-gray-600" /></button>
            <button
              onClick={() => navigate('/profile')}
              className="relative w-9 h-9 rounded-full bg-zoom-blue text-white text-sm font-medium flex items-center justify-center"
            >
              {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
            </button>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
