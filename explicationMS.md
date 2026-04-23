# Twin6 Campus — Plateforme Microservices

## Présentation

**Twin6 Campus** est une plateforme de gestion académique basée sur une architecture microservices.  
Le projet centralise la gestion des étudiants, enseignants, classes, matières, salles et notes, avec authentification/autorisation via **Keycloak** et routage API via **Gateway**.

---

## Architecture globale

- **Eureka Server** : registre de services (service discovery)
- **Config Server** : configuration centralisée des microservices
- **API Gateway** : point d’entrée unique des APIs + sécurité JWT
- **Microservices métiers** : étudiants, enseignants, classes, matières, salles, notes
- **Portail Web** : interface utilisateur React/Vite
- **Infrastructure** : MySQL, MongoDB, RabbitMQ, Keycloak

---

## Microservices et rôles

### `MSEtudiant4twin6`
- Gestion des étudiants (CRUD)
- Consultation des informations étudiant
- Endpoints métiers liés au profil étudiant

### `MSEnseignant4twin6`
- Gestion des enseignants (CRUD)
- Données métier enseignant (matricule, rôle, etc.)
- Exposition des informations pour les autres services

### `MSClasse4twin6`
- Gestion des classes (CRUD)
- Consultation classe <-> étudiants
- Données pédagogiques de classe

### `MSMatiere4twin6`
- Gestion des matières (CRUD)
- Affectation matière/enseignant/classe/salle
- Endpoints de détail matière pour scénarios inter-services

### `MSSalle4twin6`
- Gestion des salles (CRUD)
- Salles associées aux matières
- Endpoints de consultation salle <-> matières

### `MSNotes4twin6` (NestJS)
- Gestion des notes
- Historique et consultation des notes
- Intégration MongoDB + RabbitMQ + Eureka

---

## Fonctionnalités principales

- Authentification centralisée via **Keycloak** (`school-realm`)
- Autorisation par rôles :
  - `ROLE_ETUDIANT`
  - `ROLE_ENSEIGNANT`
  - `ROLE_CHEF_ENSEIGNANT`
  - `ROLE_ADMIN`
- Routage unifié via **API Gateway**
- Documentation API (Swagger)
- Communication asynchrone via **RabbitMQ**
- Configuration externalisée via **Config Server**

---

## Technologies utilisées

- **Backend Java** : Spring Boot, Spring Security, Spring Cloud
- **Backend Node** : NestJS (MSNotes)
- **Frontend** : React + Vite
- **Auth** : Keycloak (OAuth2 / JWT)
- **Registry** : Eureka
- **Config** : Spring Cloud Config
- **Message Broker** : RabbitMQ
- **Bases de données** :
  - MySQL (enseignants, matières, salles)
  - H2 fichier (selon services/classes/étudiants en local)
  - MongoDB (notes)

---

## Ports principaux (local)

- Eureka: `8761`
- Config Server: `8888`
- API Gateway: `8087`
- Keycloak: `8180`
- RabbitMQ UI: `15672`
- Frontend: `5173`
- MSNotes: `8089`
- MSEtudiant: `8093`
- MSClasse: `8084`

---

## Lancement rapide (Docker)

```bash
cd MS
docker compose up -d --build
```

---

## URLs utiles

- Eureka : http://localhost:8761
- Gateway : http://localhost:8087
- Keycloak : http://localhost:8180
- RabbitMQ UI : http://localhost:15672
- Portail : http://localhost:5173
