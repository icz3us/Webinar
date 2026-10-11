"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  FileBadge,
  Menu,
  Settings,
  Users,
  X,
  ExternalLink,
} from "lucide-react";
import AdminLogout from "@/components/admin-logout";

type AdminUser = {
  id?: string;
  email?: string;
  role?: string;
};

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/registrations", label: "Registrations", icon: Users },
  { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/admin/surveys", label: "Surveys", icon: ClipboardCheck },
  { href: "/admin/certificates", label: "Certificates", icon: FileBadge },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="admin-shell">
      {/* Mobile-First Sticky App Bar (< 900px) */}
      <header className="admin-mobile-header" aria-label="Mobile admin header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="admin-menu-toggle"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="admin-navigation-drawer"
          >
            {isMobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
          <a className="admin-brand" href="/admin" style={{ padding: "4px 0", fontSize: "17px" }}>
            DDT <span style={{ display: "inline-block", marginLeft: "4px" }}>CONTROL</span>
          </a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-geist-mono, monospace)",
              fontWeight: 700,
              padding: "3px 7px",
              background: "#ffeedd",
              color: "#c03f16",
              border: "1px solid #ffd0b5",
              textTransform: "uppercase",
            }}
          >
            {user.role || "Staff"}
          </span>
          <a
            href="/"
            style={{
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              padding: "0 8px",
              color: "var(--muted, #676860)",
            }}
          >
            Public <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="admin-drawer-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: Desktop fixed, Mobile slide-down drawer */}
      <aside
        id="admin-navigation-drawer"
        className={`admin-sidebar ${isMobileMenuOpen ? "is-open" : ""}`}
        aria-label="Admin navigation"
      >
        <div className="admin-sidebar-header">
          <a className="admin-brand" href="/admin">
            DDT <span>CONTROL</span>
          </a>
          <button
            type="button"
            className="admin-drawer-close"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Admin primary links">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);

            return (
              <a
                key={item.href}
                href={item.href}
                className={isActive ? "active" : ""}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="admin-user">
          <b>{user.role || "Staff"}</b>
          <span title={user.email}>{user.email || "staff@webinar.local"}</span>
          <AdminLogout />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Desktop Header */}
        <header className="admin-desktop-header">
          <div>
            <span>EVENT / 001</span>
            <strong>Deepfakes &amp; Digital Trust</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-geist-mono, monospace)",
                color: "var(--muted, #676860)",
              }}
            >
              {user.email}
            </span>
            <a href="/" className="text-link" style={{ fontSize: "13px" }}>
              Public page &rarr;
            </a>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
