import { useEffect, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useIsCompactNav } from '../../hooks/useBreakpoint';
import { useSidebarCollapsed } from '../../hooks/useSidebarCollapsed';
import type { NavIconName } from '../ui/NavIcons';
import { IconMenu, IconPanelLeft, IconX, NavIcon } from '../ui/NavIcons';
import { AmbientBackdrop } from './AmbientBackdrop';
import { AnimatedOutlet } from './AnimatedOutlet';

export type WorkspaceNavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: NavIconName;
  /** Si false, l’entrée n’est pas affichée. */
  when?: boolean;
};

type Props = {
  brandMark: string;
  brandTitle: string;
  brandSubtitle: string;
  navSectionLabel: string;
  items: WorkspaceNavItem[];
  headerActions: ReactNode;
};

export function AppWorkspaceShell({
  brandMark,
  brandTitle,
  brandSubtitle,
  navSectionLabel,
  items,
  headerActions,
}: Props) {
  const { collapsed, toggle } = useSidebarCollapsed();
  const compact = useIsCompactNav(960);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const visible = items.filter((i) => i.when !== false);
  const showCollapsed = collapsed && !compact;

  useEffect(() => {
    if (!compact) setDrawerOpen(false);
  }, [compact]);

  useEffect(() => {
    if (!compact || !drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [compact, drawerOpen]);

  return (
    <div className={['shell', showCollapsed ? 'shell--collapsed' : '', compact ? 'shell--compact' : ''].filter(Boolean).join(' ')}>
      <AmbientBackdrop />
      <div className="shell__grid" aria-hidden />

      <header className="shell__topbar">
        <div className="shell__brand">
          {compact ? (
            <button
              type="button"
              className="shell__icon-btn shell__icon-btn--ghost"
              aria-label="Ouvrir le menu"
              onClick={() => setDrawerOpen(true)}
            >
              <IconMenu size={22} />
            </button>
          ) : null}
          <div className="brand-mark">{brandMark}</div>
          <div>
            <div className="brand-title">{brandTitle}</div>
            <div className="brand-sub">{brandSubtitle}</div>
          </div>
        </div>
        <div className="shell__topbar-actions">{headerActions}</div>
      </header>

      {compact && drawerOpen ? (
        <button
          type="button"
          className="shell__backdrop"
          aria-label="Fermer le menu"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={['shell__sidebar', compact ? 'shell__sidebar--floating' : '', compact && drawerOpen ? 'shell__sidebar--open' : '']
          .filter(Boolean)
          .join(' ')}
        aria-label="Navigation principale"
      >
        <div className="shell__sidebar-head">
          <span className="shell__nav-section">{navSectionLabel}</span>
          {!compact ? (
            <button
              type="button"
              className="shell__icon-btn"
              onClick={toggle}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
              title={collapsed ? 'Développer' : 'Réduire'}
            >
              <IconPanelLeft size={20} />
            </button>
          ) : (
            <button
              type="button"
              className="shell__icon-btn"
              aria-label="Fermer le menu"
              onClick={() => setDrawerOpen(false)}
            >
              <IconX size={20} />
            </button>
          )}
        </div>

        <nav className="shell__nav">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={showCollapsed ? item.label : undefined}
              onClick={() => compact && setDrawerOpen(false)}
              className={({ isActive }) =>
                ['shell__nav-link', isActive ? 'shell__nav-link--active' : ''].filter(Boolean).join(' ')
              }
            >
              <span className="shell__nav-ico" aria-hidden>
                <NavIcon name={item.icon} size={20} />
              </span>
              <span className="shell__nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="shell__main">
        <div className="shell__main-inner">
          <AnimatedOutlet />
        </div>
      </main>
    </div>
  );
}
