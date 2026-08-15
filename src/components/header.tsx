"use client";

import Link from "next/link";
import { BookOpen, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand"><BookOpen aria-hidden="true" size={20} /> BookGloss</Link>
        <nav aria-label="Main navigation">
          <Link href="/" className={pathname === "/" ? "active" : ""}>Books</Link>
          <Link href="/settings" className={pathname === "/settings" ? "active" : ""}>
            <Settings aria-hidden="true" size={17} /> Settings
          </Link>
        </nav>
      </div>
    </header>
  );
}
