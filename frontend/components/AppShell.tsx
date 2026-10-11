"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const groups = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Overview" },
      { href: "/approvals", label: "Approvals" },
    ],
  },
  {
    label: "Records",
    items: [
      { href: "/invoices", label: "Invoices" },
      { href: "/customers", label: "Customers" },
      { href: "/appointments", label: "Bookings" },
      { href: "/grants", label: "Grants" },
      { href: "/compliance", label: "Compliance" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/datasets", label: "Datasets" },
      { href: "/settings", label: "Settings" },
      { href: "/about", label: "About Us" },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function moveSpot(event: React.MouseEvent<HTMLDivElement>) {
    document.documentElement.style.setProperty("--spot-x", `${(event.clientX / window.innerWidth) * 100}%`);
    document.documentElement.style.setProperty("--spot-y", `${(event.clientY / window.innerHeight) * 100}%`);
  }

  return (
    <div className="min-h-screen bg-white pl-56" onMouseMove={moveSpot}>
      <div className="fx" aria-hidden>
        <div className="fx-orb fx-orb-a" />
        <div className="fx-orb fx-orb-b" />
        <div className="fx-grid" />
        <div className="fx-spot" />
      </div>
      <aside className="app-sidebar fixed inset-y-0 left-0 z-20 w-56 overflow-y-auto">
        <div className="border-b border-white/25 px-5 py-5">
          <Logo />
        </div>
        <nav className="space-y-5 px-2 py-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">{group.label}</p>
              <ul className="mt-1">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={`nav-link ${pathname === item.href ? "active" : ""}`}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/25 px-5 py-4 text-xs text-white">Asia/Singapore</div>
      </aside>
      <main className="page mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
