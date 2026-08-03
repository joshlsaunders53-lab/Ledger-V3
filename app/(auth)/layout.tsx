import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-16">
      <Link href="/" className="mb-10 font-serif text-3xl italic tracking-tight">
        Ledger<span className="text-brass">.</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
