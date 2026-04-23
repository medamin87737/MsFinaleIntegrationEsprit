-- Démo Docker : matricule = username Keycloak (admin.test, chef.test, enseignant.test).
-- GET /enseignants/me cherche d'abord par matricule.
INSERT INTO enseignants (id, nom, description, matricule, password, role) VALUES
(1, 'Prof Demonstration', NULL, 'enseignant.test', NULL, 'ENSEIGNANT'),
(2, 'Chef Demonstration', NULL, 'chef.test', NULL, 'CHEF_ENSEIGNANT'),
(3, 'Admin Demonstration', NULL, 'admin.test', NULL, 'CHEF_ENSEIGNANT')
ON DUPLICATE KEY UPDATE
  nom = VALUES(nom),
  matricule = VALUES(matricule),
  role = VALUES(role);
