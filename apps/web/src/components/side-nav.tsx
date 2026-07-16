'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gamepad2, Clock, User, Dices } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/play', label: 'Play', icon: Gamepad2 },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden sm:flex flex-col w-52 shrink-0 h-dvh bg-surface border-r border-surface-border z-40">
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-border shrink-0">
        <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Dices className="w-4 h-4 text-primary" strokeWidth={1.5} />
        </div>
        <span className="font-bold text-sm">
          Ludo <span className="text-primary">Stakes</span>
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
