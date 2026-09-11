import LoginForm from "./LoginForm";
import { hasSupabase } from "@/lib/theme";

export default function LoginPage() {
  return <LoginForm supabaseEnabled={hasSupabase()} />;
}
