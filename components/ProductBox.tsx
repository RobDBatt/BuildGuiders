'use client';
import React from 'react';

// CONFIG: Your Amazon Tag
const AMAZON_TAG = 'buildguiders-20';

export default function ProductBox({ products }: { products: any[] }) {
    if (!products || products.length === 0) return null;

    return (
        <div className="my-8 border-l-4 border-blue-500 bg-neutral-900/50 p-6 rounded-r-lg shadow-lg">
            <h3 className="mb-4 text-xl font-bold text-blue-400 flex items-center gap-2">
                <span className="text-2xl">🛒</span> Recommended Fix-It Gear
            </h3>
            <div className="space-y-4">
                {products.map((p, i) => {
                    const isPlaceholderAsin = p.url.includes('B0BYP2F7WT');
                    const affUrl = isPlaceholderAsin
                      ? `https://www.amazon.com/s?k=${encodeURIComponent(p.name)}&tag=${AMAZON_TAG}`
                      : `${p.url}${p.url.includes('?') ? '&' : '?'}tag=${AMAZON_TAG}`;
                    return (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-700/50 pb-4 last:border-0">
                            <div>
                                <div className="font-bold text-neutral-100 text-lg">{p.name}</div>
                                {p.note && <div className="text-sm text-neutral-400">{p.note}</div>}
                            </div>
                            <a href={affUrl} target="_blank" rel="noopener noreferrer nofollow"
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded text-center min-w-[140px]">
                                Check Price
                            </a>
                        </div>
                    );
                })}
            </div>
            <div className="mt-4 text-xs text-neutral-500 italic">As an Amazon Associate, we earn from qualifying purchases.</div>
        </div>
    );
}
