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
    <div className="h-screen flex flex-col items-center justify-center bg-base text-text">
      {/* Logo & Title */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-blue/10 flex items-center justify-center mb-4">
          <span className="text-3xl">✦</span>
        </div>
        <h1 className="text-2xl font-bold text-text">cc-devloop</h1>
        <p className="text-sm text-overlay0 mt-1">AI-powered development environment</p>
      </div>

      {/* Open Project Button */}
      <button
        onClick={() => openProject()}
        className="px-6 py-2.5 text-sm bg-blue hover:bg-lavender text-crust rounded-lg font-medium transition-colors mb-8"
      >
        Open Project
      </button>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div className="w-full max-w-md">
          <h2 className="text-xs text-overlay0 mb-3 px-1">Recent Projects</h2>
          <div className="space-y-1">
            {recentProjects.map((path) => {
              const name = path.split("/").pop() || path;
              return (
                <button
                  key={path}
                  onClick={() => openProject(path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface0 hover:bg-surface1 transition-colors text-left group"
                >
                  <span className="text-blue text-sm shrink-0">📁</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-text truncate">{name}</div>
                    <div className="text-[10px] text-overlay0 truncate">{path}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="absolute bottom-4 right-4">
        <SettingsPanel />
      </div>
    </div>
  );
}
