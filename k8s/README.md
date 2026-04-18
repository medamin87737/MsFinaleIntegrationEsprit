# Kubernetes — exemple de passage en orchestration

Ce dossier documente le **passage du compose Docker vers Kubernetes** (critère grille : orchestration, load balancing, tolérance aux pannes).

## Principes

- **Images** : construire et pousser les images générées par les `Dockerfile` (Eureka, Config Server, Gateway, MS Spring, MSNotes) vers un registre (`ghcr.io`, Docker Hub, ECR, etc.).
- **Service discovery** : en cluster K8s, on remplace souvent Eureka par le **Service DNS** natif (`ClusterIP` / `Headless`) ; pour un projet pédagogique, on peut **garder Eureka** en déployant un replica unique + les MS qui s’y enregistrent (comme en Docker).
- **Load balancing** : le **Service** Kubernetes de type `ClusterIP` répartit déjà le trafic entre pods d’une même application ; la **gateway** peut pointer vers des noms de service internes au lieu de `lb://` si vous retirez Eureka.
- **Tolérance aux pannes** : utiliser `replicas: 2` (ou plus) sur la gateway et les MS stateless ; ajouter **PodDisruptionBudget**, **liveness/readiness** (déjà exposés via Spring Boot Actuator sur la gateway).

## Fichiers d’exemple

- `gateway-deployment.yaml` : modèle minimal **Deployment + Service** pour la gateway (à adapter : image, variables `KEYCLOAK_*`, lien vers Config/Eureka).

## Ordre de déploiement suggéré

1. Namespace + secrets (Keycloak client secret, etc.).
2. Eureka (1 pod) + Config Server (1 pod).
3. MongoDB / RabbitMQ (Helm charts officiels recommandés plutôt que des manifests artisanaux).
4. Keycloak (chart officiel ou déploiement dédié).
5. Microservices Spring puis MSNotes.
6. Gateway en **Ingress** (TLS) vers l’extérieur.

## Cloud de test

- **KillerCoda**, **Play with Kubernetes**, **minikube**, **kind**, **k3d** : suffisent pour une démo de soutenance avec `kubectl apply` et captures d’écran.
