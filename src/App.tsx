import { useState } from "react";
import Layout from "./components/Layout";
import WelcomeScreen from "./components/WelcomeScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import { useThemeEffect } from "./hooks/useThemeEffect";

function App() {
  useThemeEffect();
  const [projectOpen, setProjectOpen] = useState(false);

  if (!projectOpen) {
    return <WelcomeScreen onProjectOpened={() => setProjectOpen(true)} />;
  }
  return (
    <ErrorBoundary>
      <Layout onBackToWelcome={() => setProjectOpen(false)} />
    </ErrorBoundary>
  );
}

export default App;
