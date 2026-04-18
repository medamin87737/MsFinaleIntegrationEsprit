## 🎓 Gestion Étudiant — Service `MSEtudiant4twin6`

<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 16px 0">
  <img alt="Service" src="https://img.shields.io/badge/Service-MSEtudiant4twin6-6db33f?style=for-the-badge&logo=spring&logoColor=white" />
  <img alt="Port" src="https://img.shields.io/badge/Port-8082-2196f3?style=for-the-badge" />
  <img alt="Base path" src="https://img.shields.io/badge/Base%20path-/etudiants-9c27b0?style=for-the-badge" />
  <img alt="Storage" src="https://img.shields.io/badge/DB-H2%20(file)-8e24aa?style=for-the-badge" />
  <img alt="Discovery" src="https://img.shields.io/badge/Discovery-Eureka-4caf50?style=for-the-badge&logo=spring" />
</div>

- **Responsable (owner)**: Ons Kochtane
- **Accès direct (debug)**: `http://localhost:8082/etudiants/...`
- **Via API Gateway (recommandé)**: `http://localhost:8087/etudiants/...`
- **Via Front (Next.js proxy)**: `http://localhost:3000/api/etudiants/...`

---

### 🧱 Modèle de données

```1:52:MSEtudiant4twin6/src/main/java/tn/esprit/spring/msetudiant4twin6/Etudiant.java
package tn.esprit.spring.msetudiant4twin6;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "etudiants")
public class Etudiant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String description;

    public Etudiant() {
    }

    public Etudiant(String nom, String description) {
        this.nom = nom;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
```

---

### 🧩 Architecture interne

- **Controller**: gère les endpoints REST sous `/etudiants`
- **Service**: logique métier CRUD
- **Repository**: accès JPA/H2

```1:48:MSEtudiant4twin6/src/main/java/tn/esprit/spring/msetudiant4twin6/EtudiantController.java
package tn.esprit.spring.msetudiant4twin6;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/etudiants")
public class EtudiantController {

    private final IEtudiantService service;

    public EtudiantController(IEtudiantService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<Etudiant>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Etudiant> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Etudiant> create(@RequestBody Etudiant entity) {
        return ResponseEntity.ok(service.create(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Etudiant> update(@PathVariable Long id, @RequestBody Etudiant entity) {
        return service.update(id, entity)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

```1:46:MSEtudiant4twin6/src/main/java/tn/esprit/spring/msetudiant4twin6/EtudiantService.java
package tn.esprit.spring.msetudiant4twin6;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EtudiantService implements IEtudiantService {

    private final EtudiantRepository repository;

    public EtudiantService(EtudiantRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Etudiant> getAll() {
        return repository.findAll();
    }

    @Override
    public Optional<Etudiant> getById(Long id) {
        return repository.findById(id);
    }

    @Override
    public Etudiant create(Etudiant entity) {
        entity.setId(null);
        return repository.save(entity);
    }

    @Override
    public Optional<Etudiant> update(Long id, Etudiant entity) {
        return repository.findById(id).map(existing -> {
            existing.setNom(entity.getNom());
            existing.setDescription(entity.getDescription());
            return repository.save(existing);
        });
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
```

```1:13:MSEtudiant4twin6/src/main/java/tn/esprit/spring/msetudiant4twin6/IEtudiantService.java
package tn.esprit.spring.msetudiant4twin6;

import java.util.List;
import java.util.Optional;

public interface IEtudiantService {
    List<Etudiant> getAll();
    Optional<Etudiant> getById(Long id);
    Etudiant create(Etudiant entity);
    Optional<Etudiant> update(Long id, Etudiant entity);
    void delete(Long id);
}
```

```1:7:MSEtudiant4twin6/src/main/java/tn/esprit/spring/msetudiant4twin6/EtudiantRepository.java
package tn.esprit.spring.msetudiant4twin6;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EtudiantRepository extends JpaRepository<Etudiant, Long> {
}
```

---

### 🔌 Configuration & intégration (Eureka, DB, Boot)

```1:16:MSEtudiant4twin6/src/main/resources/application.properties
spring.application.name=MSEtudiant4twin6
server.port=8082

eureka.client.register-with-eureka=true
eureka.client.fetch-registry=true
eureka.client.service-url.defaultZone=http://localhost:8761/eureka

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.datasource.url=jdbc:h2:file:./Database/Data/etudiants_db
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=etudiants_user
spring.datasource.password=
spring.h2.console.enabled=true
spring.h2.console.path=/h2
```

```1:15:MSEtudiant4twin6/src/main/java/tn/esprit/spring/msetudiant4twin6/MSEtudiant4twin6Application.java
package tn.esprit.spring.msetudiant4twin6;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class MSEtudiant4twin6Application {

    public static void main(String[] args) {
        SpringApplication.run(MSEtudiant4twin6Application.class, args);
    }
}
```

---

### 🚦 Endpoints (CRUD)

- **GET `/etudiants`** — lister tous les étudiants
- **GET `/etudiants/{id}`** — détails d’un étudiant
- **POST `/etudiants`** — créer un étudiant
- **PUT `/etudiants/{id}`** — modifier un étudiant
- **DELETE `/etudiants/{id}`** — supprimer un étudiant

Payload type (création/mise à jour):

```json
{
  "nom": "string",
  "description": "string"
}
```

---

### 🔁 Workflow via Gateway

1) Front appelle `GET http://localhost:3000/api/etudiants`
2) Proxy Next.js → Gateway: `http://localhost:8087/etudiants`
3) Gateway matche la route `path("/etudiants/**")` → `lb://MSEtudiant4twin6`
4) Résolution via Eureka → redirection vers l’instance (port 8082)
5) Réponse JSON retournée au front

---

### 🧪 Exemples d’appels

- Via Gateway (recommandé):

```bash
curl -s http://localhost:8087/etudiants
```

```bash
curl -s -X POST http://localhost:8087/etudiants \
  -H "Content-Type: application/json" \
  -d '{ "nom": "Alice", "description": "Licence 3" }'
```

- Via Front (proxy → Gateway):

```bash
curl -s http://localhost:3000/api/etudiants/1
```

- Accès direct (debug uniquement):

```bash
curl -s http://localhost:8082/etudiants
```

---

### ✅ Règles de validation et erreurs

- `404 Not Found` si l’`id` n’existe pas (GET/PUT)
- `204 No Content` sur suppression réussie
- Ajoutez des validations (ex: `nom` requis) si nécessaire côté service/controller

---

### 🛠️ Conseils d’exploitation

- Démarrer d’abord Eureka (8761), puis la Gateway (8087), puis `MSEtudiant4twin6` (8082).
- Vérifier l’inscription du service dans l’UI Eureka (`http://localhost:8761`).
- Utiliser la Gateway depuis le front pour éviter CORS et bénéficier du load balancing.

---

### 🧭 Workflow de bout en bout (début → fin, avec phase de test)

1) Pré-requis installés
   - Java 17+, Maven, Node.js (pour le front).
   - Ports libres: 8761 (Eureka), 8087 (Gateway), 8082 (Étudiant), 3000 (Front).

2) Démarrer Eureka (annuaire)
   - Lancer l’app serveur Eureka.
   - Vérifier l’UI: `http://localhost:8761` (aucun service n’apparaît encore).

3) Démarrer la Gateway
   - Lancer l’app `demoApiGatewayApplication` (port 8087).
   - Elle se déclare dans Eureka (visible dans l’UI après quelques secondes).

4) Démarrer le service Étudiant
   - Lancer `MSEtudiant4twin6` (port 8082).
   - Vérifier dans `http://localhost:8761` que `MSEtudiant4twin6` est bien enregistré.
   - H2 est configuré en file mode: `./Database/Data/etudiants_db` (créé au besoin).

5) (Optionnel) Démarrer le Front
   - Lancer le front sur `http://localhost:3000` (proxy `/api/*` → Gateway).

6) Smoke tests rapides (Gateway)
   - Lister (peut être vide au début):

```bash
curl -s http://localhost:8087/etudiants
```

   - Créer un étudiant:

```bash
curl -s -X POST http://localhost:8087/etudiants \
  -H "Content-Type: application/json" \
  -d '{ "nom": "Alice", "description": "Licence 3" }'
```

   - Récupérer par id (ex: 1):

```bash
curl -s http://localhost:8087/etudiants/1
```

   - Mettre à jour:

```bash
curl -s -X PUT http://localhost:8087/etudiants/1 \
  -H "Content-Type: application/json" \
  -d '{ "nom": "Alice Updated", "description": "M1" }'
```

   - Supprimer:

```bash
curl -s -X DELETE http://localhost:8087/etudiants/1 -i
```

7) Tests via le Front (proxy Next.js)
   - Lister:

```bash
curl -s http://localhost:3000/api/etudiants
```

   - Détails:

```bash
curl -s http://localhost:3000/api/etudiants/1
```

8) Vérifications & erreurs attendues
   - `200 OK` sur succès (GET/POST/PUT), `204 No Content` sur DELETE.
   - `404 Not Found` si l’id n’existe pas (GET/PUT/DELETE).
   - Si la Gateway répond `503`, vérifier que `MSEtudiant4twin6` est enregistré dans Eureka.

9) Débogage
   - Vérifier les logs du service (`spring.jpa.show-sql=true` affiche les requêtes).
   - Accéder à la console H2: `http://localhost:8082/h2` (Driver: `org.h2.Driver`, URL: `jdbc:h2:file:./Database/Data/etudiants_db`, User: `etudiants_user`).
   - Confirmer les routes côté Gateway et la présence du service dans `http://localhost:8761`.

10) Clôture
   - Arrêter d’abord le front, puis le service Étudiant, puis la Gateway, puis Eureka.
   - Nettoyage H2 si nécessaire: supprimer le dossier `./Database/Data/etudiants_db*` (à faire à froid).
