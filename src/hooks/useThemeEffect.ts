import { useEffect } from "react";
import { useThemeStore } from "../stores/themeStore";

export function useThemeEffect() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
}
