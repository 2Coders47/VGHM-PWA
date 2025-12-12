// @ts-check
import { defineConfig } from "astro/config"

import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import AstroPWA from "@vite-pwa/astro"

// https://astro.build/config
export default defineConfig({
  integrations: [react(), AstroPWA()],

  vite: {
    plugins: [tailwindcss()],
  },
})
