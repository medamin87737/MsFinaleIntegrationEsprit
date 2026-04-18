# Observabilité — Prometheus & Grafana

## Objectif

Répondre au critère « **Monitoring : Prometheus + Grafana** » de la grille : collecter les métriques **Micrometer** de la **gateway** (`/actuator/prometheus`) et les visualiser dans Grafana.

## Prérequis

- La **gateway** tourne sur la machine hôte (IDE ou Docker) sur le port **8080** avec l’endpoint Prometheus activé.

## Démarrage

```bash
cd MS
docker compose -f docker-compose.monitoring.yml up -d
```

- **Prometheus** : [http://localhost:9090](http://localhost:9090) — cible `host.docker.internal:8080`.
- **Grafana** : [http://localhost:3000](http://localhost:3000) — utilisateur / mot de passe : **admin** / **admin**.

## Configurer Grafana (2 minutes)

1. Connexion → **Connections** → **Data sources** → **Add data source** → **Prometheus**.
2. URL : `http://prometheus:9090` (nom du service Docker sur le réseau compose par défaut).
3. **Save & test**.
4. **Explore** : requête `up` ou `http_server_requests_seconds_count`.

Vous pouvez importer un dashboard communautaire **JVM / Spring Boot** (ID Grafana typique **4701** ou **12900** selon la version) puis l’adapter à la datasource Prometheus.

## Note Linux

Si `host.docker.internal` n’est pas disponible, ajoutez dans `docker-compose.monitoring.yml` sous `prometheus` :

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

(c’est déjà présent dans le fichier fourni).
