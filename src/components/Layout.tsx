import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

const navItems = [
  { to: '/', label: 'Übersicht', icon: '🏠', end: true },
  { to: '/chat', label: 'KI-Chat', icon: '💬' },
  { to: '/foods', label: 'Lebensmittel', icon: '🍎' },
  { to: '/recipes', label: 'Rezepte', icon: '🍲' },
  { to: '/planning', label: 'Planung', icon: '📅' },
  { to: '/shopping-list', label: 'Einkaufsliste', icon: '🛒' },
  { to: '/profile', label: 'Profil', icon: '👤' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-1.5 text-sm font-medium ${
    isActive ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-gray-100'
  }`
}

function bottomNavLinkClass({ isActive }: { isActive: boolean }) {
  return `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
    isActive ? 'text-green-700' : 'text-gray-500'
  }`
}

export function Layout() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold text-green-700">🥗 Foodtracker</span>

          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={() => void signOut()}
              className="ml-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100"
            >
              Abmelden
            </button>
          </nav>

          <button
            onClick={() => void signOut()}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 sm:hidden"
          >
            Abmelden
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 pb-24 sm:pb-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={bottomNavLinkClass}>
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
