import { ConfigProvider, useConfig } from "./context/ConfigContext";
import { Dashboard } from "./components/Dashboard";
import { PermissionBanner } from "./components/PermissionBanner";
import { ToastContainer } from "./components/Toast";
import "./App.css";

function AppContent() {
  const { loading } = useConfig();

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <>
      <PermissionBanner />
      <Dashboard />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <AppContent />
    </ConfigProvider>
  );
}
