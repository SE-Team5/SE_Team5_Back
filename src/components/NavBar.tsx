import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { Home, Book, User, Gamepad2, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function NavBar() {
  const { user, isAdmin, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/', label: '메인화면', icon: Home },
    { path: '/mypage', label: '마이페이지', icon: User },
    { path: '/game', label: '게임', icon: Gamepad2 },
    ...(isAdmin ? [{ path: '/admin', label: '관리자페이지', icon: Settings }] : [])
  ]

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Book className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline font-bold text-lg text-foreground">TOEIC Word Master</span>
          </Link>

          {/* App Name Center (Mobile) */}
          <span className="sm:hidden font-bold text-lg text-foreground">TOEIC Word Master</span>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* User Info & Logout (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{user?.nickname || user?.username}</span> 님
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
              <div className="border-t border-border my-2" />
              <div className="px-4 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{user?.nickname || user?.username}</span> 님으로 로그인됨
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                로그아웃
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
