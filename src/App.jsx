import { Outlet } from "react-router-dom";

import "./styles/index.css";

import TopNav from "./components/TopNav";
import SideNav from "./components/SideNav";
import ThemeToggle from "./components/ui/ThemeToggle";
import useTheme from "./hooks/useTheme";
import LogoutButton from "./components/ui/LogoutButton";

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="page">
      <TopNav title="Chibi Repair" />

      <SideNav
        id="appOffcanvas"
        themeSwitcher={<ThemeToggle theme={theme} onToggle={toggleTheme} />}
        logoutButton={<LogoutButton />}
      />

      <Outlet />
    </div>
  );
}
