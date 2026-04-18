# Twin6 Campus — microservices & portail

## Grille d’évaluation & CI

- **Tableau critères ↔ projet** : [`GRILLE_EVALUATION.md`](./GRILLE_EVALUATION.md)  
- **Intégration continue** : [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) (branches `main` / `master`)

## Démarrage rapide

| Besoin | Fichier / commande |
|--------|--------------------|
| **Stack complète** (Eureka, Config, Gateway, tous les MS, MSNotes, Keycloak, Mongo, RabbitMQ) | Dans `MS/` : `docker compose up -d --build` — détail [`DOCKER-FULLSTACK.md`](./DOCKER-FULLSTACK.md) |
| Infra seule (Keycloak, Mongo, Rabbit — MS depuis l’IDE) | `docker compose -f docker-compose.infra.yml up -d` |
| Déploiement AWS (grille + BDs managées) | [`aws/DEPLOY-AWS.md`](./aws/DEPLOY-AWS.md) |
| Tests JWT / Keycloak | [`TESTING.md`](./TESTING.md) |
| **Swagger agrégé** (gateway) | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) (gateway locale) |
| Scénarios grille (Feign + RabbitMQ) | [`EVALUATION-SCENARIOS.md`](./EVALUATION-SCENARIOS.md) |
| Prometheus + Grafana | [`monitoring/README.md`](./monitoring/README.md) |
| Exemple Kubernetes | [`k8s/README.md`](./k8s/README.md) |

## Modules principaux

- `demoEurekaServer` — annuaire Eureka  
- `demoConfigServer` — configuration centralisée (`classpath:/config`)  
- `demoApiGatewayApplication` — Spring Cloud Gateway + sécurité JWT + Swagger UI  
- `MSEtudiant4twin6`, `MSClasse4twin6`, `MSMatiere4twin6`, `MSSalle4twin6`, `MSEnseignant4twin6` — Spring Boot  
- `MSNotes4twin6` — NestJS + MongoDB + RabbitMQ + Eureka  
- `school-portal` — frontend Vite/React  

## Thème Keycloak

Thème **`twin6-campus`** (couleurs proches du portail) : `keycloak/themes/twin6-campus/`, monté dans les fichiers `docker-compose*.yml`.
