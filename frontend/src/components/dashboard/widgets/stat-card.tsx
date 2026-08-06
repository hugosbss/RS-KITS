import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
};

export function StatCard({
    title,
    value,
    detail,
    icon: Icon,
    color,
}: {
    title: string;
    value: string;
    detail: string;
    icon: LucideIcon;
    color: keyof typeof colors;
}) {
    return (
        <Card className="border-slate-200 p-5 shadow-none">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                        {value}
                    </p>
                </div>
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">{detail}</p>
        </Card>
    );
}
