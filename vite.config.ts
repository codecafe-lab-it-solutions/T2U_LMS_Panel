import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            if (id.includes('motion')) return 'motion';
            if (id.includes('@google')) return 'google';
            if (id.includes('@tanstack')) return 'query';
            // Only pulled in via the dynamic import() in utils/downloadPdf.ts — kept in their
            // own chunk (instead of falling into 'vendor') so this ~240KB gzipped payload
            // only loads when someone actually clicks "Download PDF", not on every page load.
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
            return 'vendor';
          },
        },
      },
    },
    server: {
      allowedHosts: true as any,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
