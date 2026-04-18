import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: Props) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        <h1 className="page-title">{title}</h1>
        {description ? (
          <p className="page-desc" style={{ marginBottom: actions ? '0.75rem' : undefined }}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
