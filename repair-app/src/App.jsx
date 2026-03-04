import { Outlet } from "react-router-dom";
import AppNav from "./components/AppNav";

export default function App() {
  return (
    <div style={{ maxWidth: 1100, margin: "20px auto", padding: 12 }}>
      <AppNav title="Chibi Repair" />
      <Outlet />
    </div>
  );
}