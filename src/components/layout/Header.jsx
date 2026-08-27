import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, User, LogOut } from 'lucide-react';
import { toggleTheme } from '../../store/slices/themeSlice';
import { auth } from '../../config/firebase'; // 👈 আপনার ফায়ারবেস কনফিগ ফাইল পাথ নিশ্চিত করুন
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

  // ⚡ Dropdown State & Ref
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const breadcrumbs = routeLabels[location.pathname] || ['Dashboard'];

  // ⚡ ড্রপডাউনের বাইরে ক্লিক করলে ড্রপডাউন বন্ধ করার লজিক
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
      navigate('/login');    // Redirect to login page
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
        {/* for later version */}
        {/* <button
          id="dark-mode-toggle"
          onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button> */}

        {/* ⚡ User Profile Section with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 pl-3 border-l border-border-light dark:border-border-dark focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-accent-brand/10 flex items-center justify-center">
              <User size={16} className="text-accent-brand" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark leading-none">
                Titto Admin
              </p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                tittowebsiteadmin@gmail.com
              </p>
            </div>
          </button>

          {/* ⚡ Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-border-light dark:border-border-dark sm:hidden">
                <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                  Admin User
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                  tittowebsiteadmin@gmail.com
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors cursor-pointer"
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