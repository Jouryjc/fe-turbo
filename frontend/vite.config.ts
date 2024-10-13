import { defineConfig } from 'vite';
// vite.config.ts
import { viteStaticCopy } from "vite-plugin-static-copy";
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: "./node_modules/@idux/components/icon/assets/*.svg",
          dest: "idux-icons",
        },
      ],
    }),
  ],
});