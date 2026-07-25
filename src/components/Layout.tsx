'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store';
import {
  Home,
  Users,
  GraduationCap,
  DollarSign,
  Calendar,
  ClipboardList,
  BookOpen,
  MessageSquare,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Bell,
  Moon,
  Sun,
  Database,
  FileText,
  UserCheck,
  CreditCard,
  PieChart,
  Award,
  Briefcase,
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Academic Sessions', href: '/sessions', icon: Calendar },
  {
    name: 'Students',
    icon: Users,
    children: [
      { name: 'All Students', href: '/students' },
      { name: 'Add Student', href: '/students/add' },
      { name: 'Families', href: '/students/families' },
      { name: 'Promotion', href: '/students/promotion' },
      { name: 'ID Cards', href: '/students/id-cards' },
    ],
  },
  {
    name: 'Fee Management',
    icon: DollarSign,
    children: [
      { name: 'Fee Collection', href: '/fees/collection' },
      { name: 'Fee Records', href: '/fees/records' },
      { name: 'Fee Reports', href: '/fees/reports' },
      { name: 'Fee Settings', href: '/fees/settings' },
    ],
  },
  {
    name: 'Attendance',
    icon: ClipboardList,
    children: [
      { name: 'Mark Attendance', href: '/attendance/mark' },
      { name: 'Attendance Reports', href: '/attendance/reports' },
      { name: 'Leave Management', href: '/attendance/leave' },
    ],
  },
  {
    name: 'Staff',
    icon: Briefcase,
    children: [
      { name: 'All Staff', href: '/staff' },
      { name: 'Add Staff', href: '/staff/add' },
      { name: 'Staff Attendance', href: '/staff/attendance' },
      { name: 'Payroll', href: '/staff/payroll' },
    ],
  },
  {
    name: 'Expenses',
    icon: CreditCard,
    children: [
      { name: 'Daily Expenses', href: '/expenses' },
      { name: 'Categories', href: '/expenses/categories' },
      { name: 'Reports', href: '/expenses/reports' },
    ],
  },
  {
    name: 'Exams & Results',
    icon: Award,
    children: [
      { name: 'Exam Types', href: '/exams' },
      { name: 'Enter Marks', href: '/exams/marks' },
      { name: 'Generate DMC', href: '/exams/dmc' },
      { name: 'Grade Settings', href: '/exams/grades' },
    ],
  },
  {
    name: 'Classes & Subjects',
    icon: BookOpen,
    children: [
      { name: 'Classes', href: '/classes' },
      { name: 'Subjects', href: '/subjects' },
      { name: 'Timetable', href: '/timetable' },
    ],
  },
  {
    name: 'SMS & WhatsApp',
    icon: MessageSquare,
    children: [
      { name: 'Send Messages', href: '/sms' },
      { name: 'Bulk Messages', href: '/sms/bulk' },
      { name: 'Message Templates', href: '/sms/templates' },
      { name: 'Message Logs', href: '/sms/logs' },
    ],
  },
  {
    name: 'Settings',
    icon: Settings,
    children: [
      { name: 'School Settings', href: '/settings' },
      { name: 'Theme', href: '/settings/theme' },
      { name: 'Backup & Restore', href: '/settings/backup' },
    ],
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings, updateSettings, sidebarOpen, setSidebarOpen, currentUser, setCurrentUser } = useStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!currentUser && pathname !== '/login') {
      router.push('/login');
    }
    // Auto-expand active menu
    menuItems.forEach((item) => {
      if (item.children) {
        const isActive = item.children.some((child) => pathname === child.href);
        if (isActive && !expandedMenus.includes(item.name)) {
          setExpandedMenus((prev) => [...prev, item.name]);
        }
      }
    });
  }, [pathname, currentUser, router]);

  const toggleMenu = (name: string) => {
    setExpandedMenus((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    );
  };

  const toggleTheme = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" data-theme={settings.theme}>
      {/* Sidebar */}
      <aside
        className={`gradient-sidebar fixed lg:sticky top-0 h-screen z-40 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0 lg:w-20'
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'lg:hidden'}`}>
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-lg">EduPro</h1>
                <p className="text-xs text-white/60">Management System</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedMenus.includes(item.name);
              const hasChildren = item.children && item.children.length > 0;
              const isActive = hasChildren
                ? item.children.some((child) => pathname === child.href)
                : pathname === item.href;

              return (
                <div key={item.name}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={`sidebar-link w-full justify-between ${
                          isActive ? 'active' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <span className={!sidebarOpen ? 'lg:hidden' : ''}>{item.name}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          } ${!sidebarOpen ? 'lg:hidden' : ''}`}
                        />
                      </button>
                      {isExpanded && sidebarOpen && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`sidebar-link pl-8 text-sm ${
                                pathname === child.href ? 'active' : ''
                              }`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href!}
                      className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className={!sidebarOpen ? 'lg:hidden' : ''}>{item.name}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-white/10">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'lg:justify-center'}`}>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
                {currentUser?.name.charAt(0) || 'A'}
              </div>
              <div className={!sidebarOpen ? 'lg:hidden' : ''}>
                <p className="text-white font-medium text-sm">{currentUser?.name || 'Admin'}</p>
                <p className="text-white/60 text-xs capitalize">{currentUser?.role || 'admin'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h2 className="font-semibold text-gray-800">{settings.schoolName || 'EduPro School System'}</h2>
                {settings.schoolSlogan && <p className="text-xs text-gray-500">{settings.schoolSlogan}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {settings.darkMode ? (
                  <Sun className="w-5 h-5 text-gray-600" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="h-8 w-px bg-gray-200"></div>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  router.push('/login');
                }}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-red-600"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 bg-gray-50">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>© 2025 EduPro School Management System</p>
            <p>Version 1.0.0</p>
          </div>
        </footer>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
