/** Fond animé discret : halos + formes floues (respecte prefers-reduced-motion). */
export function AmbientBackdrop() {
  return (
    <div className="ambient" aria-hidden>
      <div className="ambient__orb ambient__orb--1" />
      <div className="ambient__orb ambient__orb--2" />
      <div className="ambient__orb ambient__orb--3" />
    </div>
  );
}
