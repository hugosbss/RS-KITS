"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Package2,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
const items = [
  { label: "Dashboard", icon: BarChart3, href: "/dashboard" },
  { label: "Entregar Kit", icon: Package2, href: "/delivery", featured: true },
  { label: "Importar Planilha", icon: Package2, href: "/import" },
  { label: "Relatórios", icon: ClipboardList, href: "/reports" },
  { label: "Eventos", icon: CalendarDays, href: "/events" },
//   { label: "Inscritos", icon: Users, href: "#" },
//   { label: "Operadores", icon: ShieldCheck, href: "#" },
];
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Package2 className="h-5 w-5" />
        </div>
        <span className="font-semibold text-slate-950">SportDelivery</span>
      </div>
      <nav className="flex-1 space-y-1 p-3 pt-6">
        {items.map(({ label, icon: Icon, href, featured }) => {
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
      <div className="border-t border-slate-100 p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600">
          <Settings className="h-[18px] w-[18px]" />
          Configurações
        </button>
      </div>
    </aside>
  );
}
