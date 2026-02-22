import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 animate-pulse h-96" />}>
      <LoginForm />
    </Suspense>
  );
}
