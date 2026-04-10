import RegisterClient from "./register-client";
import { getGoogleOAuthCredentials } from "@/lib/auth/google-oauth";

export default function RegisterPage() {
  const googleOAuthConfigured = getGoogleOAuthCredentials() !== null;
  return <RegisterClient googleOAuthConfigured={googleOAuthConfigured} />;
}
