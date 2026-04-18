# Grille d’évaluation — correspondance avec le projet Twin6 Campus

Ce document relie **chaque critère** de la grille « Applications Web Distribuées » aux **éléments concrets** du dépôt (code, config, doc, CI). À utiliser pour la **soutenance** et la **remise**.

| Critère (grille) | Points (réf.) | Où c’est dans le projet | Comment le montrer |
|------------------|---------------|-------------------------|---------------------|
| **Micro-service techno avancée + BD** | 2 | **`MSNotes4twin6`** (NestJS) + **MongoDB** (`docker-compose.yml`, config `MSNotes4twin6.properties`) | Expliquer choix Nest + Mongoose ; montrer `package.json` et URI Mongo. |
| **Eureka** | 1 | **`demoEurekaServer`** ; clients Eureka sur gateway et MS (`spring-cloud-starter-netflix-eureka-client`) | Console Eureka `8761` ; instances enregistrées. |
| **Config Server** | 1 | **`demoConfigServer`** + `classpath:/config/*.properties` | `8888` ; montrer un fichier de config servi (ex. ports, JWT). |
| **Gateway** | 1 | **`demoApiGatewayApplication`** (Spring Cloud Gateway, `8080`) | Routes `lb://…` ; sécurité reactive. |
| **Sécurité** (Keycloak + rôles gateway + thème) | 2,5 | **`GatewaySecurityConfig`** ; **Keycloak** `docker-compose` + **`keycloak/realm-export.json`** ; thème **`twin6-campus`** (`keycloak/themes/`) | Login thémé ; JWT ; matrice des chemins / rôles dans la gateway. |
| **Git + documentation** | 1 | **Git** initialisé dans `MS/` ; **`.gitignore`** ; docs **`README.md`**, **`TESTING.md`**, **`DOCKER-FULLSTACK.md`**, **`EVALUATION-SCENARIOS.md`**, ce fichier ; **commits réguliers** à poursuivre | Historique Git ; liens dans `README.md`. |
| **Docker Compose** | 2 | **`docker-compose.yml`** (infra) + **`docker-compose.full-stack.yml`** + **Dockerfiles** | `docker compose -f docker-compose.full-stack.yml up --build`. |
| **Partie front** | 1,5 | **`school-portal`** (Vite/React, Keycloak JS) | Démo navigateur `5173` + gateway `8080`. |
| **Communication inter-MS** | 2 | **Feign** : `*/feign/*FeignClient.java` ; **RabbitMQ** : MSNotes publish + listeners Spring (`EVALUATION-SCENARIOS.md`) | ≥ 3 scénarios Feign + ≥ 3 RabbitMQ comme dans la doc. |
| **Valeurs ajoutées** | 2 | **CI/CD** : **`.github/workflows/ci.yml`** ; **Prometheus/Grafana** : **`docker-compose.monitoring.yml`**, **`monitoring/`** ; **K8s** : **`k8s/`** | Captures GitHub Actions vertes ; Grafana + dashboard ; README K8s / démo kind/minikube. |
| **Swagger centralisé (grille « au niveau gateway »)** | (souvent rangé avec doc / gateway) | **Swagger UI** : `http://localhost:8080/swagger-ui.html` ; routes **`/central-docs/{app}/…`** | Ouvrir l’UI ; montrer les definitions agrégées. |

## Checklist rapide avant passage avec le validateur

- [ ] `git log` montre des **commits** clairs et récents.
- [ ] **CI** verte sur la branche `main` (GitHub → Actions).
- [ ] **Docker** : au moins `docker compose up` (infra) ou full stack selon ta machine.
- [ ] **Keycloak** : realm importé, **thème** visible sur l’écran de login.
- [ ] **Swagger** : accessible via la **gateway**.
- [ ] **Scénarios** : par cœur les 3+ Feign et 3+ RabbitMQ (`EVALUATION-SCENARIOS.md`).
- [ ] **Grafana** (optionnel mais + pour « valeurs ajoutées ») : `docker-compose.monitoring.yml` + datasource Prometheus.

## Si le dépôt GitHub n’est pas à la racine `MS/`

Le workflow CI suppose que **la racine du repo = contenu du dossier `MS/`** (tel qu’initialisé ici). Si tu clones tout un dossier parent, adapte les chemins dans `.github/workflows/ci.yml` ou déplace le `.git` à la bonne racine.
