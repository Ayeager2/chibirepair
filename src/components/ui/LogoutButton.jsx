import { useAuth } from "@/auth/useAuth";

export default function LogoutButton() {
  const { signOut, loading } = useAuth();

  return (
    <button type="button" className="button-danger w-100" onClick={signOut} disabled={loading}>
      Log Out
    </button>
  );
}
