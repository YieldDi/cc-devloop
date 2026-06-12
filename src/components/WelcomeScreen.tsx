import { invoke } from "@tauri-apps/api/core";
import { useProjectStore } from "../stores/projectStore";
import SettingsPanel from "./Sidebar/SettingsPanel";

export default function WelcomeScreen({ onProjectOpened }: { onProjectOpened: () => void }) {
  const { recentProjects, setProjectRoot, setTree, addRecentProject } = useProjectStore();

  const openProject = async (path?: string) => {
    const selected = path || await invoke<string | null>("select_directory");
    if (!selected) return;
    setProjectRoot(selected);
    addRecentProject(selected);
    try {
      const tree = await invoke("read_project_tree", { path: selected });
      setTree(tree as []);
    } catch {
      // tree will auto-restore via Layout useEffect
    }
    onProjectOpened();
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-crust text-text relative overflow-hidden scanline-overlay">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(var(--c-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--c-cyan) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Logo & Title */}
      <div className="flex flex-col items-center mb-10 relative z-10">
        <div className="w-18 h-18 rounded-2xl bg-cyan/5 border border-cyan/20 flex items-center justify-center mb-5 glow-cyan-soft relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan/10 to-transparent" />
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-cyan relative z-10">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-text tracking-wide">
          cc-devloop
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-8 h-px bg-gradient-to-r from-transparent to-cyan/40" />
          <p className="text-xs text-cyan/70 tracking-widest uppercase font-medium">AI-Powered Dev Environment</p>
          <span className="w-8 h-px bg-gradient-to-l from-transparent to-cyan/40" />
        </div>
      </div>

      {/* Open Project Button */}
      <button
        onClick={() => openProject()}
        className="btn-neon px-8 py-3 text-sm bg-cyan/10 border border-cyan/30 text-cyan rounded-lg font-medium tracking-wide transition-all hover:bg-cyan/15 hover:border-cyan/50 glow-cyan-soft relative z-10"
      >
        Open Project
      </button>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div className="w-full max-w-md mt-10 relative z-10">
          <h2 className="text-[10px] text-overlay0 mb-3 px-1 uppercase tracking-widest">Recent Projects</h2>
          <div className="space-y-1">
            {recentProjects.map((path) => {
              const name = path.split("/").pop() || path;
              return (
                <button
                  key={path}
                  onClick={() => openProject(path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface0/50 border border-transparent hover:border-cyan/15 hover:bg-surface0 transition-all text-left group"
                >
                  <span className="text-cyan text-sm shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H13.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z"/>
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-text truncate group-hover:text-cyan transition-colors">{name}</div>
                    <div className="text-[10px] text-overlay0 truncate font-mono">{path}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="absolute bottom-4 right-4 z-10">
        <SettingsPanel />
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l border-t border-cyan/10" />
      <div className="absolute top-0 right-0 w-16 h-16 border-r border-t border-cyan/10" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l border-b border-cyan/10" />
    </div>
  );
}
