'use client';

import { useEffect } from 'react';
import mermaid from 'mermaid';

export default function MermaidScript() {
    useEffect(() => {
        mermaid.initialize({ startOnLoad: false, theme: 'dark' });

        // We run this after the content is rendered
        const runMermaid = async () => {
            try {
                await mermaid.run({
                    querySelector: '.language-mermaid',
                });
            } catch (e) {
                console.error('Mermaid rendering failed', e);
            }
        };

        runMermaid();
    }, []);

    return null;
}
