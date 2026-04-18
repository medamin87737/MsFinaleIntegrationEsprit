# Tests Keycloak et JWT (Twin6)

> **Déploiement Docker complet** : voir [`DOCKER-FULLSTACK.md`](./DOCKER-FULLSTACK.md) et `docker-compose.full-stack.yml`.  
> **Scénarios Feign / RabbitMQ (grille)** : [`EVALUATION-SCENARIOS.md`](./EVALUATION-SCENARIOS.md).  
> **Prometheus / Grafana** : [`monitoring/README.md`](./monitoring/README.md).  
> **Kubernetes (exemple)** : [`k8s/README.md`](./k8s/README.md).

---

Ce document décrit comment valider l’intégration Keycloak de bout en bout avec la gateway (port **8080**), le front Vite (port **5173**) et les microservices.

## 1. Lancer Keycloak avec Docker

Depuis le dossier `MS` :

```bash
docker compose -f docker-compose.infra.yml up -d keycloak
```

Attendre que le conteneur soit prêt (premier démarrage + import du realm peut prendre 1 à 2 minutes).

## 2. Vérifier l’import du realm

Ouvrir dans le navigateur :

- [http://localhost:8180/realms/school-realm/.well-known/openid-configuration](http://localhost:8180/realms/school-realm/.well-known/openid-configuration)

Si la page JSON s’affiche, le realm **school-realm** est bien chargé.

Console d’administration Keycloak : [http://localhost:8180](http://localhost:8180) (utilisateur admin Keycloak : `admin` / `admin`, défini dans `docker-compose.infra.yml` et la stack complète).

## 3. Tester le login frontend (flux PKCE)

1. Démarrer Eureka, le Config Server, la gateway (**8080**), puis chaque microservice (ports dans le Config Server).
2. Démarrer le front : `cd school-portal && npm run dev`.
3. Ouvrir [http://localhost:5173](http://localhost:5173) : Keycloak doit rediriger vers la page de login (mode `login-required`).
4. Se connecter avec un utilisateur du realm, par exemple :
   - **chef@school.com** / **chef123** (ROLE_CHEF_ENSEIGNANT)
   - **ens@school.com** / **ens123** (ROLE_ENSEIGNANT)
   - **etu@school.com** / **etu123** (ROLE_ETUDIANT)

   Comptes de test (usernames) : **chef.test**, **enseignant.test**, **etudiant.test** (mêmes e-mails et mots de passe que ci-dessus selon `realm-export.json`).

Le navigateur revient sur l’app avec un fragment ou une URL sans mot de passe ; le token est conservé par `keycloak-js`.

## 4. Vérifier `realm_access.roles` dans le JWT

Après connexion, dans la console développeur du navigateur (onglet Réseau), inspecter une requête vers la gateway : l’en-tête `Authorization: Bearer …` doit être présent.

Copier le JWT (partie entre `Bearer ` et le premier point pour la partie utile, ou le token entier) et le coller sur [https://jwt.io](https://jwt.io) : dans le payload JSON, la clé `realm_access` doit contenir un tableau `roles` avec `ROLE_CHEF_ENSEIGNANT`, `ROLE_ENSEIGNANT` ou `ROLE_ETUDIANT` selon l’utilisateur.

## 5. Tester un microservice avec curl

Obtenir un access token (exemple client credentials pour le client confidentiel **school-gateway**) :

```bash
curl -s -X POST "http://localhost:8180/realms/school-realm/protocol/openid-connect/token" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "grant_type=client_credentials" ^
  -d "client_id=school-gateway" ^
  -d "client_secret=schoolGatewaySecretDev2024"
```

Copier `access_token` de la réponse JSON, puis :

```bash
curl -s -H "Authorization: Bearer ACCESS_TOKEN_ICI" http://localhost:8080/classes
```

Remplacer `/classes` par `/etudiants`, `/matieres`, `/salles`, `/enseignants`, `/notes/etudiants/1`, etc. Les réponses **401** indiquent un token manquant ou invalide ; **403** indiquent un rôle ou une règle métier (en-tête enseignant, etc.) insuffisant.

## 6. Comptes et attributs métier

Le fichier `keycloak/realm-export.json` définit des attributs utilisateur :

- `schoolEnseignantId` : identifiant enseignant côté base H2/MySQL (ex. **1** pour les comptes chef / enseignant démo).
- `schoolEtudiantId` : identifiant étudiant (ex. **1** pour le compte étudiant démo).

Le front lit ces claims (`school_enseignant_id`, `school_etudiant_id`) pour charger les fiches via la gateway. Adaptez les attributs si vos IDs en base diffèrent.

## 7. JWT côté Nest (MS Notes)

Le service lit `KEYCLOAK_ISSUER` et `KEYCLOAK_JWT_AUDIENCE` après chargement depuis le Config Server (`keycloak.issuer-uri`, `keycloak.jwt-audience` dans `MSNotes4twin6.properties`). Sans Config Server, définir ces variables d’environnement avant `npm run start:dev`.

Audience par défaut : **account** (comportement Keycloak classique pour les tokens realm).
