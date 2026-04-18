import type { ReactElement, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function I({ size = 20, ...p }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p} />;
}

export function IconHome(props: IconProps) {
  return (
    <I {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v10h14V10" />
    </I>
  );
}

export function IconLayers(props: IconProps) {
  return (
    <I {...props}>
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="m2 13 10 5 10-5M2 18l10 5 10-5" />
    </I>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <I {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </I>
  );
}

export function IconBook(props: IconProps) {
  return (
    <I {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </I>
  );
}

export function IconDoor(props: IconProps) {
  return (
    <I {...props}>
      <path d="M13 4h3a2 2 0 0 1 2 2v14" />
      <path d="M2 20h12V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14Z" />
      <path d="M6 12h.01" />
    </I>
  );
}

export function IconChart(props: IconProps) {
  return (
    <I {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 12v5M12 8v9M17 5v12" />
    </I>
  );
}

export function IconSpark(props: IconProps) {
  return (
    <I {...props}>
      <path d="m12 3-1.9 5.8H4l4.8 3.5-1.9 5.7L12 15.3l5.1 3.7-1.9-5.7 4.8-3.5H13.9L12 3Z" />
    </I>
  );
}

export function IconGraduation(props: IconProps) {
  return (
    <I {...props}>
      <path d="M22 10v6M6 12H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2" />
      <path d="M18 12h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
      <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
    </I>
  );
}

export function IconPanelLeft(props: IconProps) {
  return (
    <I {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
    </I>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <I {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </I>
  );
}

export function IconX(props: IconProps) {
  return (
    <I {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </I>
  );
}

export type NavIconName =
  | 'home'
  | 'layers'
  | 'users'
  | 'book'
  | 'door'
  | 'chart'
  | 'spark'
  | 'graduation';

const MAP: Record<NavIconName, (p: IconProps) => ReactElement> = {
  home: IconHome,
  layers: IconLayers,
  users: IconUsers,
  book: IconBook,
  door: IconDoor,
  chart: IconChart,
  spark: IconSpark,
  graduation: IconGraduation,
};

export function NavIcon({ name, ...props }: { name: NavIconName } & IconProps) {
  const Cmp = MAP[name];
  return <Cmp {...props} />;
}
