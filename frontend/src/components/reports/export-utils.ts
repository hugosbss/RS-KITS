"use client";

export const downloadCSV = (filename: string, headers: string[], rows: (string | undefined)[][]) => {
    const bom = "\uFEFF";
    const csvContent =
        bom +
        [headers.join(";"), ...rows.map((row) => row.map((val) => `"${(val || "").replace(/"/g, '""')}"`).join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
