"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Package2,
  PieChart,
  Settings,
} from "lucide-react";
import { useAppState } from "@/components/providers/app-context";

const items = [
  { label: "Dashboard", icon: BarChart3, href: "/dashboard" },
  { label: "Entregar Kit", icon: Package2, href: "/delivery", featured: true },
  { label: "Importar Planilha", icon: Package2, href: "/import" },
  { label: "Relatórios", icon: ClipboardList, href: "/reports" },
  { label: "Filtros", icon: PieChart, href: "/filters" },
  { label: "Eventos", icon: CalendarDays, href: "/events" },
  // { label: "Utilitários", icon: }
//   { label: "Inscritos", icon: Users, href: "#" },
//   { label: "Operadores", icon: ShieldCheck, href: "#" },
];
export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, users, setCurrentUserId, selectedEvent } = useAppState();
  const visibleItems = items.filter((item) => {
    if (item.href === "/events" || item.href === "/import") return currentUser.role === "ADMIN";
    return true;
  });
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Package2 className="h-5 w-5" />
        </div>
        <span className="font-semibold text-slate-950">RS KITS</span>
      </div>
      <nav className="flex-1 space-y-1 p-3 pt-6">
        {visibleItems.map(({ label, icon: Icon, href, featured }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-blue-50 text-blue-600" : featured ? "text-blue-600 hover:bg-blue-50" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
              {featured && <span className="ml-auto text-xs">★</span>}
            </Link>
          );
        })}
      </nav>
      <div className="mx-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        {/* <p className="truncate text-xs font-bold text-slate-800">{currentUser.name}</p> */}
        {/* <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-600">{currentUser.role}</p> */}
        <select value={currentUser.id} onChange={(event) => setCurrentUserId(event.target.value)} className="mt-2 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-600">
          {users.map((user) => <option key={user.id} value={user.id}>{user.role}: {user.name}</option>)}
        </select>
      </div>
      {currentUser.role !== "OPERADOR" && <div className="border-t border-slate-100 p-3">
        <Link href="/settings" className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${pathname === "/settings" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}>
          <Settings className="h-[18px] w-[18px]" />
          Configurações
        </Link>
      </div>}
    </aside>
  );
}
