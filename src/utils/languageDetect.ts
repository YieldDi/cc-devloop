const LANGUAGE_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  java: "java",
  py: "python",
  go: "go",
  rs: "rust",
  cs: "csharp",
  php: "php",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  less: "less",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  md: "markdown",
  sql: "sql",
  sh: "shell",
  bash: "shell",
  xml: "xml",
  dockerfile: "dockerfile",
  vue: "html",
  svelte: "html",
};

export function detectLanguage(filePath: string): string {
  const fileName = filePath.split("/").pop()?.toLowerCase() || "";
  if (fileName === "dockerfile") return "dockerfile";
  if (fileName === "makefile") return "makefile";
  if (fileName.endsWith(".config.js")) return "javascript";
  const ext = fileName.split(".").pop() || "";
  return LANGUAGE_MAP[ext] || "plaintext";
}
