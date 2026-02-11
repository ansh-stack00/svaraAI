import { RegisterForm } from "@/components/auth/regsiterForm";
import { Mic } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
            <Mic className="w-7 h-7 text-white" />
          </div>
        </Link>

        <h1 className="text-2xl font-bold mb-6">VoiceAgent Platform</h1>
        <RegisterForm />
      </div>
    </div>
  )
}
