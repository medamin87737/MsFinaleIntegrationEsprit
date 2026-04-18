# Stack Docker complète (Twin6 Campus)

Le fichier **`docker-compose.full-stack.yml`** décrit la stack **complète** : Eureka, Config Server, API Gateway, les cinq microservices Spring, MSNotes (NestJS), Keycloak, MongoDB et RabbitMQ.

À la racine `MS/`, **`docker-compose.yml`** inclut ce fichier : un simple `docker compose up -d --build` lance **tout**. Pour **seulement** Keycloak + Mongo + RabbitMQ (MS lancés depuis l’IDE), utilisez **`docker-compose.infra.yml`**.

## Prérequis

- **Docker** + **Docker Compose v2** (plugin `docker compose`).
- **Ressources** : au moins 8 Go de RAM disponibles pour le build et l’exécution.
- **Réseau** : les conteneurs accèdent à Keycloak via **`host.docker.internal:8180`** (JWT / JWK).  
  - Docker Desktop (Windows, Mac) : OK par défaut.  
  - **Linux** : `extra_hosts` est déjà défini dans le compose (`host-gateway`).

## Lancement

```bash
cd MS
docker compose build
docker compose up -d
```

(Équivalent : `docker compose -f docker-compose.full-stack.yml build && docker compose -f docker-compose.full-stack.yml up -d`.)

La première montée peut prendre **plusieurs minutes** (Maven dans les images Spring).

## Ports exposés sur la machine hôte

| Service            | Port |
|--------------------|------|
| Eureka             | 8761 |
| Config Server      | 8888 |
| API Gateway        | 8080 |
| Keycloak           | 8180 |
| MongoDB            | 27017|
| RabbitMQ AMQP      | 5672 |
| RabbitMQ UI        | 15672|
| MSNotes (debug)    | 8088 |

Les autres MS **ne publient pas** de port : ils sont joignables **via la gateway** (découverte Eureka).

## Après le démarrage

1. **Keycloak** : [http://localhost:8180](http://localhost:8180) — realm `school-realm`, thème de login **twin6-campus** (couleurs alignées sur le portail).
2. **Swagger agrégé** : [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) — menu déroulant des OpenAPI des MS Spring (routes `/central-docs/...`).
3. **Front en local** : lancer `school-portal` avec `VITE_*` pointant vers `http://localhost:8080` et Keycloak `http://localhost:8180` (inchangé par rapport au mode IDE).

## Variables importantes (déjà injectées dans le compose)

- `SPRING_CLOUD_CONFIG_URI` → `http://config-server:8888` (les MS utilisent `spring.config.import=optional:configserver:` + `spring.cloud.config.uri` en local)
- `EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE` → `http://eureka:8761/eureka`
- `SPRING_RABBITMQ_HOST` → `rabbitmq`
- `KEYCLOAK_*` → `http://host.docker.internal:8180/...` (cohérent avec les tokens émis pour le navigateur sur `localhost:8180`)

## Observabilité (optionnel)

Voir `docker-compose.monitoring.yml` et `monitoring/README.md` pour **Prometheus + Grafana** (métriques gateway).

## Dépannage

- **`502 Bad Gateway` … `dockerDesktopLinuxEngine` … `containers/create`** (souvent sur Keycloak en premier) : problème **Docker Desktop**, pas le compose. Quitter Docker Desktop complètement, rouvrir, attendre que l’icône soit stable ; puis `docker ps`. Si ça persiste : `wsl --shutdown` (PowerShell admin), relancer Docker Desktop ; en dernier recours augmenter la **RAM / CPU** alloués à Docker (Settings → Resources) ou mettre à jour Docker Desktop.
- **MS en boucle `restart`** : attendre que Config Server et Eureka soient up ; vérifier les logs `docker compose ... logs msetudiant4twin6`.
- **401 sur les MS** : vérifier que Keycloak est healthy et que l’issuer JWT correspond (`host.docker.internal` vs `localhost`).
