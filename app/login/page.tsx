import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";
import { getGoogleOAuthCredentials } from "@/lib/auth/google-oauth";

export default function LoginPage() {
  const googleOAuthConfigured = getGoogleOAuthCredentials() !== null;
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <LoginForm googleOAuthConfigured={googleOAuthConfigured} />
    </Suspense>
  );
}
