import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Welcome{ user?.email ? `, ${user.email}` : ""}</h2>     
    </div>
  );
}