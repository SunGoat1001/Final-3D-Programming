
import { defineConfig } from 'vite';

export default defineConfig({
    base: process.env.VITE_BASE_PATH || '/Final-3D-Programming/',
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
            }
        }
    }
});
