import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const lobeIconsDirectory = fileURLToPath(
  new URL("./node_modules/@lobehub/icons/es", import.meta.url)
);

export default defineConfig({
  devToolbar: {
    enabled: false,
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@lobehub-icons": lobeIconsDirectory,
      },
    },
  },
});
