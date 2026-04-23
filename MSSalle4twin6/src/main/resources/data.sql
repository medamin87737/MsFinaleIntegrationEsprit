-- Démo Docker : salle id=1 pour les matières de test.
INSERT INTO salles (id, nom, description)
VALUES (1, 'Salle A', 'Salle de demonstration')
ON DUPLICATE KEY UPDATE nom = VALUES(nom), description = VALUES(description);
