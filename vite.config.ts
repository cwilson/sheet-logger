import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    base: process.env.GITHUB_ACTIONS ? "/sheet-logger/" : "/",
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            // This maps '@' to the 'src' directory
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
