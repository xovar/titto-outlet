import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, User, LogOut, Store } from 'lucide-react';
import { toggleTheme } from '../../store/slices/themeSlice';
import { auth } from '../../config/firebase'; 
import { signOut } from 'firebase/auth';

const routeLabels = {
  '/': ['Dashboard'],
  '/products': ['Products', 'Product List'],
  '/products/add': ['Products', 'Add New'],
  '/products/categories': ['Products', 'Categories'],
  '/products/colors': ['Products', 'Colors'],
  '/products/brands': ['Products', 'Brands'],
};

export default function Header({ onMenuToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { darkMode } = useSelector((state) => state.theme);
  const location = useLocation();

  // ⚡ LocalStorage থেকে ইউজার ডাটা রিড করা
  const [user, setUser] = useState(() => {
    const savedUser =
      localStorage.getItem('admin_user') ||
      localStorage.getItem('pos_manager_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ⚡ Dropdown State & Ref
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const breadcrumbs = routeLabels[location.pathname] || ['Dashboard'];

  // ⚡ ড্রপডাউনের বাইরে ক্লিক করলে বন্ধ করার লজিক
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ⚡ Logout Handler Function
  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase Logout
      localStorage.clear();  // Local storage clear
      sessionStorage.clear();
      setIsDropdownOpen(false);
      navigate('/login', { replace: true }); // Redirect to login page
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky print:hidden top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
      {/* Left: hamburger + breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          id="menu-toggle"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors"
        >
          <Menu size={20} />
        </button>

        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-text-secondary-light dark:text-text-secondary-dark">/</span>
              )}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? 'font-medium text-text-primary-light dark:text-text-primary-dark'
                    : 'text-text-secondary-light dark:text-text-secondary-dark'
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: dark mode + user profile dropdown */}
      <div className="flex items-center gap-3">
        {/* ⚡ Dynamic User Profile Section */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 pl-3 border-l border-border-light dark:border-border-dark focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-accent-brand/10 flex items-center justify-center">
              <User size={16} className="text-accent-brand" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark leading-none capitalize">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                {user?.email || 'user@titto.com.bd'}
              </p>
            </div>
          </button>

          {/* ⚡ Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* User Info inside Dropdown */}
              <div className="px-4 py-2.5 border-b border-border-light dark:border-border-dark">
                <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark capitalize">
                  {user?.name || 'User Name'}
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate mt-0.5">
                  {user?.email || 'email@example.com'}
                </p>

                {/* Outlet Name (If Available) */}
                {user?.outletName && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                    <Store size={12} />
                    <span>{user.outletName}</span>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors cursor-pointer mt-1"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}