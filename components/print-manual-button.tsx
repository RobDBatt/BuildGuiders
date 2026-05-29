'use client';

import { Printer } from 'lucide-react';

export default function PrintManualButton() {
    return (
        <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] hover:bg-[#10b981] text-white text-xs font-bold uppercase tracking-widest rounded border border-slate-700 transition-all duration-300 group"
        >
            <Printer size={16} className="group-hover:scale-110 transition-transform" />
            Print Technical Manual (PDF)
        </button>
    );
}
