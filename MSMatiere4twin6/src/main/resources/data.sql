-- Démo Docker : matière pour la classe id=1 (H2 MSClasse) et l’enseignant id=1.
INSERT INTO matieres (id, nom, description, salle_id, classe_id, enseignant_id, heure_debut_seance, heure_fin_seance)
VALUES (1, 'Mathematiques', 'Cours de demonstration', 1, 1, 1, '08:00:00', '10:00:00')
ON DUPLICATE KEY UPDATE
  nom = VALUES(nom),
  description = VALUES(description),
  salle_id = VALUES(salle_id),
  classe_id = VALUES(classe_id),
  enseignant_id = VALUES(enseignant_id);
