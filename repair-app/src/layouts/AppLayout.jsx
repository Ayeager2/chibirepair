import { Outlet } from "react-router-dom";
import AppNav from "../components/AppNav";
import { useAuth } from "../auth/useAuth";

export default function AppLayout() {
  const { signOut } = useAuth();

  return (
    <div style={{ maxWidth: 1100, margin: "20px auto", padding: 12 }}>
        <AppNav
            title="Chibi Repair"
            rightSlot={<button onClick={signOut}>Sign out</button>}
        />
      <Outlet />
    </div>
  );
}