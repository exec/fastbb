/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Module declarations for JavaScript files
declare module '*.js' {
  const content: Record<string, unknown>;
  export default content;
  export function apiRequest(endpoint: string, options?: RequestInit): Promise<Response>;
  export const api: Record<string, unknown>;
}

declare module '*.d.ts' {
  // Type definition files are already handled by TypeScript
}
