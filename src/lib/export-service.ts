import JSZip from "jszip";
import { saveAs } from "file-saver";

const PACKAGE_JSON = `{
  "name": "raillovable-export",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1"
  }
}`;

const VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;

const TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}`;

const POSTCSS_CONFIG = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

const INDEX_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;`;

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RailLovable Export</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;

const MAIN_JSX = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

const RAILWAY_JSON = `{
  "$schema": "https://railway.com/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npm run preview -- --host --port $PORT",
    "healthcheckPath": "/"
  }
}`;

export async function exportAsZip(
  projectName: string,
  generatedCode: Record<string, string>
) {
  const zip = new JSZip();
  const src = zip.folder("src")!;

  zip.file("package.json", PACKAGE_JSON);
  zip.file("vite.config.js", VITE_CONFIG);
  zip.file("tailwind.config.js", TAILWIND_CONFIG);
  zip.file("postcss.config.js", POSTCSS_CONFIG);
  zip.file("index.html", INDEX_HTML);
  zip.file("railway.json", RAILWAY_JSON);
  zip.file("README.md", `# ${projectName}\n\nBuilt with RailLovable.\n\n## Deploy\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`);

  src.file("main.jsx", MAIN_JSX);
  src.file("index.css", INDEX_CSS);

  for (const [filename, code] of Object.entries(generatedCode)) {
    const cleanName = filename.startsWith("/") ? filename.slice(1) : filename;
    src.file(cleanName, code);
  }

  // Ensure App.tsx exists
  if (!generatedCode["/App.tsx"] && !generatedCode["App.tsx"]) {
    src.file(
      "App.tsx",
      `export default function App() {\n  return <div className="p-8 text-center">Start chatting to generate your app!</div>\n}\n`
    );
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${projectName.replace(/\s+/g, "-").toLowerCase()}.zip`);
}
