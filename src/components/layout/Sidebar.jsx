import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  List,
  ChevronDown,
  X,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  MonitorCheck,
} from "lucide-react";
import logo from "../../assets/titto.logo.png";


// 🛍️ Order Sub Links
const orderSubLinks = [
  { to: "/orders", label: "All Orders", icon: List },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  // Route Trackers
  const isOrderRoute = location.pathname.startsWith("/orders");

  // Accordion Expand States
  const [ordersExpanded, setOrdersExpanded] = useState(isOrderRoute);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 flex flex-col
          bg-surface-light dark:bg-surface-dark
          border-r border-border-light dark:border-border-dark
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo / Brand */}
        <div className="flex cursor-pointer items-center justify-between h-16 px-5 border-b border-border-light dark:border-border-dark shrink-0">
          <div className="mx-auto">
            <div className="z-50 shrink-0">
              <img src={logo} width="100px" alt="Titto Logo" />
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-background-light dark:hover:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* Dashboard link */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
            onClick={onClose}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          {/* 💻 POS link */}
          <NavLink
            to="/pos"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
            onClick={onClose}
          >
            <MonitorCheck size={20} />
            <span>POS System</span>
          </NavLink>

          {/* 🛒 Orders accordion */}
          <div>
            <button
              onClick={() => setOrdersExpanded(!ordersExpanded)}
              className={`sidebar-link w-full justify-between ${isOrderRoute ? "active" : ""}`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} />
                <span>Orders</span>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${ordersExpanded ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                ordersExpanded ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="ml-4 pl-3 border-l border-border-light dark:border-border-dark space-y-0.5 mt-1">
                {orderSubLinks.map((link) => {
                  const Icon = link.icon;
                  const currentFullUrl = location.pathname + location.search;
                  const isLinkActive = currentFullUrl === link.to;

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`sidebar-link text-[0.8125rem] py-2 ${
                        isLinkActive ? "active" : ""
                      }`}
                      onClick={onClose}
                    >
                      <Icon size={16} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border-light dark:border-border-dark shrink-0">
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            © 2026 TITTO CRM
          </p>
        </div>
      </aside>
    </>
  );
}