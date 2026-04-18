import type { ReactNode } from 'react';

type Props = {
  variant: 'readOnlyRef' | 'chefNotesReadOnly' | 'enseignantNotes';
  children?: ReactNode;
};

/** Rappel court des droits selon le rôle (cohérent avec le backend). */
export default function PrivilegeHint({ variant, children }: Props) {
  const copy: Record<Props['variant'], string> = {
    readOnlyRef:
      'Vous consultez les données en lecture. Création, modification et suppression sont réservées au Chef Enseignant.',
    chefNotesReadOnly:
      'En tant que Chef, vous consultez l’historique des notes. La saisie et la modification des notes sont effectuées par les enseignants.',
    enseignantNotes:
      'Vous pouvez inscrire des étudiants aux matières et saisir les notes. Le Chef Enseignant a un accès lecture sur l’historique.',
  };

  return (
    <div
      className="card"
      style={{
        marginBottom: '1.25rem',
        padding: '0.9rem 1.1rem',
        background: 'linear-gradient(135deg, #fffefb 0%, #ffffff 100%)',
        borderColor: 'rgba(215, 38, 61, 0.15)',
      }}
    >
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.45 }}>
        {copy[variant]}
      </p>
      {children}
    </div>
  );
}
