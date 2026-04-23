-- Démo Docker : le compte Keycloak etudiant.test (preferred_username) doit matcher le matricule.
-- GET /etudiants/me résout par sub Keycloak ou par matricule = preferred_username.
MERGE INTO etudiants (id, nom, description, matricule, password, classe_id, keycloak_id) KEY (id)
VALUES (1, 'Etudiant Demo', NULL, 'etudiant.test', NULL, 1, NULL);
