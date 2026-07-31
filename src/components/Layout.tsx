import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'

const navItems = [
  { to: '/', label: 'Übersicht', end: true },
  { to: '/diary', label: 'Tagebuch' },
  { to: '/foods', label: 'Lebensmittel' },
  { to: '/weight', label: 'Gewicht' },
  { to: '/planning', label: 'Planung' },
  { to: '/shopping-list', label: 'Einkaufsliste' },
  { to: '/profile', label: 'Profil' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-1.5 text-sm font-medium ${
    isActive ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-gray-100'
  }`
}

export function Layout() {
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

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
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 sm:hidden"
            aria-label="Menü"
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-gray-100 px-4 py-3 sm:hidden">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass} onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false)
                void signOut()
              }}
              className="rounded-md px-3 py-1.5 text-left text-sm font-medium text-gray-500 hover:bg-gray-100"
            >
              Abmelden
            </button>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
