import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { currentMember } from "@/lib/auth";
import { logout } from "./actions";

export const metadata = { title: "Movie Night" };
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const me = await currentMember();
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-zinc-800">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
            <Link href="/" className="text-lg font-semibold text-amber-400">🍿 Movie Night</Link>
            {me && (
              <>
                <Link href="/">Tonight</Link>
                <Link href="/wishlist">Wishlist</Link>
                <Link href="/suggestions">Suggestions</Link>
                <Link href="/history">History</Link>
                {me.isAdmin && <Link href="/admin">Admin</Link>}
                <form action={logout} className="ml-auto flex items-center gap-2">
                  <span>{me.avatar} {me.name}</span>
                  <button className="btn-ghost">Switch</button>
                </form>
              </>
            )}
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
