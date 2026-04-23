-- Démo Docker : alignée sur Keycloak (realm school-realm) — classe id=1 pour les étudiants de test.
MERGE INTO classes (id, nom, description) KEY (id)
VALUES (1, '3A Demonstration', 'Classe de demonstration (seed)');
