# Démonstration — communication inter microservices (grille d’évaluation)

Ce document liste **au moins trois scénarios OpenFeign (synchrone)** et **au moins trois scénarios RabbitMQ (asynchrone)**, chacun avec **producteur → consommateur → effet observable**.

---

## Partie A — OpenFeign (≥ 3 scénarios)

Les clients Feign résident sous `*/feign/*FeignClient.java` et sont activés avec `@EnableFeignClients`.

### Scénario Feign 1 — Matière → Enseignant (détails agrégés)

- **But** : obtenir les informations enseignant liées à une matière via un appel HTTP déclaré (Feign), sans URL codée en dur côté appelant.
- **Fichiers** : `MSMatiere4twin6/.../feign/EnseignantFeignClient.java` ; orchestration côté service Matière (ex. détail matière + enseignant).
- **Test manuel (via gateway)** : enseignant authentifié — voir page **Scénarios** du portail ou appeler l’endpoint exposé par Matière qui déclenche l’agrégation (cf. contrôleur « détails avec enseignant »).

### Scénario Feign 2 — Classe → Étudiant (liste par classe)

- **But** : le service Classe récupère les étudiants d’une classe via Feign vers `MSEtudiant4twin6`.
- **Fichiers** : `MSClasse4twin6/.../feign/EtudiantFeignClient.java`.
- **Test** : `GET /classes/{id}/...` (chemins étudiants côté classe) via la gateway avec un JWT **Chef** ou **Enseignant** selon les règles de la gateway.

### Scénario Feign 3 — Salle → Matière (cohérence pédagogique)

- **But** : le service Salle interroge le catalogue Matière via Feign.
- **Fichiers** : `MSSalle4twin6/.../feign/MatiereFeignClient.java`.

### Scénario Feign 4 (bonus) — Matière → Salle / Classe / Étudiant

- **Fichiers** : `MSMatiere4twin6/.../feign/SalleFeignClient.java`, `ClasseFeignClient.java`, `EtudiantFeignClient.java`.

### Scénario Feign 5 (bonus) — Enseignant → Matière / Étudiant

- **Fichiers** : `MSEnseignant4twin6/.../feign/MatiereFeignClient.java`, `EtudiantFeignClient.java`.

---

## Partie B — RabbitMQ (≥ 3 scénarios)

Exchange logique : **`school.events`** (cf. MSNotes). Les routings ci‑dessous sont émis par **MSNotes** (`RabbitMqPublisherService`).

### Scénario RabbitMQ 1 — `inscription.created` (Notes → Classe)

- **Producteur** : MSNotes, lors de la création d’une inscription (`inscription.created`).
- **Consommateur** : `MSClasse4twin6` — `InscriptionPedagogiqueListener` (`@RabbitListener` sur la file configurée).
- **Effet** : mise à jour / journalisation pédagogique côté Classe (inscriptions reçues — endpoint de consultation côté API Classe).

### Scénario RabbitMQ 2 — `grade.created` (Notes → audit étudiant)

- **Producteur** : MSNotes, à la création d’une note.
- **Consommateur** : `MSEtudiant4twin6` — `AuditNoteEventListener` sur la file « audit notes ».
- **Effet** : enregistrement d’événements d’audit côté étudiant ; consultable via l’endpoint d’audit prévu (Chef).

### Scénario RabbitMQ 3 — `grade.updated` (Notes → audit / historique)

- **Producteur** : MSNotes, à la mise à jour d’une note (`grade.updated`).
- **Consommateur** : même listener d’audit côté `MSEtudiant4twin6` (traitement d’un second type d’événement).
- **Effet** : chaîne d’audit complémentaire ; côté utilisateur, l’**historique** des notes reste visible via MSNotes / portail.

### Vérification rapide

- Console RabbitMQ : [http://localhost:15672](http://localhost:15672) (`guest` / `guest`) — files et messages.
- Portail enseignant : page **Notes** (inscription, création / modification de note) puis consultation **historique** et **audit** (selon rôles).

---

## Synthèse tableau (pour rapport / soutenance)

| # | Type     | Nom court              | D’où | Vers où        | Routage / client      |
|---|----------|------------------------|------|----------------|------------------------|
| 1 | Feign    | Matière → Enseignant   | MSMatiere | MSEnseignant | `EnseignantFeignClient` |
| 2 | Feign    | Classe → Étudiant      | MSClasse  | MSEtudiant   | `EtudiantFeignClient` (classe) |
| 3 | Feign    | Salle → Matière        | MSSalle   | MSMatiere    | `MatiereFeignClient` (salle) |
| 4 | RabbitMQ | Inscription créée      | MSNotes   | MSClasse     | `inscription.created` |
| 5 | RabbitMQ | Note créée             | MSNotes   | MSEtudiant   | `grade.created` |
| 6 | RabbitMQ | Note mise à jour       | MSNotes   | MSEtudiant   | `grade.updated` |
