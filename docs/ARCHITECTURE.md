## 🎯 Architecture Microservices — Eureka + API Gateway

<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 16px 0">
  <img alt="Eureka" src="https://img.shields.io/badge/Eureka-Registry-4caf50?style=for-the-badge&logo=spring&logoColor=white" />
  <img alt="Spring Cloud Gateway" src="https://img.shields.io/badge/Spring%20Cloud-Gateway-2196f3?style=for-the-badge&logo=spring&logoColor=white" />
  <img alt="Spring Boot" src="https://img.shields.io/badge/Spring%20Boot-3.x-6db33f?style=for-the-badge&logo=springboot&logoColor=white" />
</div>

- **Eureka (Registry)**: `http://localhost:8761`  
- **API Gateway**: `http://localhost:8087`  
- **Front (Next.js via proxy)**: `http://localhost:3000` → proxie vers la Gateway (`/api/*` → `:8087/*`)

---

### 🧩 Rôles des composants

- <span style="color:#4CAF50;font-weight:600">Eureka Server</span> (annuaire): conserve la liste des microservices actifs (instances, adresses), permet la découverte par nom.
- <span style="color:#2196F3;font-weight:600">API Gateway</span> (reverse-proxy intelligent): reçoit toutes les requêtes du front, résout le nom du service via Eureka, applique le routage/filters, et relaie la requête au bon microservice.
- <span style="color:#9C27B0;font-weight:600">Microservices métiers</span>: exposent des APIs REST (CRUD…), se <i>registrent</i> automatiquement dans Eureka et sont appelés via la Gateway.

---

### 🚦 Démarrage — ordre recommandé

1) Démarrer Eureka (8761)  
   - Visible via l’UI: `http://localhost:8761`
2) Démarrer l’API Gateway (8087)  
   - Elle se déclare aussi dans Eureka et attend les services
3) Démarrer les microservices métiers (ports 8082…8086)  
   - À chaque démarrage, le service s’enregistre dans Eureka
4) Lancer le Front (3000)  
   - Il appelle la Gateway via `/api/*` (pas de CORS côté front)

---

### 🛰️ Eureka — configuration et code

- Activation du serveur Eureka (Java):

```1:15:demoEurekaServer/src/main/java/tn/esprit/spring/demoeurekaserver/DemoEurekaServerApplication.java
package tn.esprit.spring.demoeurekaserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class DemoEurekaServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoEurekaServerApplication.class, args);
    }

}
```

- Propriétés serveur Eureka:

```1:6:demoEurekaServer/src/main/resources/application.properties
spring.application.name=eureka
server.port=8761


eureka.client.register-with-eureka=false
eureka.client.fetch-registry=false
```

---

### 🚪 API Gateway — découverte + routage

- Déclaration comme client Eureka et port:

```1:9:demoApiGatewayApplication/src/main/resources/application.properties
spring.application.name=demoApiGateway
server.port=8087
#eureka
eureka.client.register-with-eureka=true
eureka.client.service-url.defaultZone=http://localhost:8761/eureka


logging.level.org.springframework.cloud.gateway=DEBUG
logging.level.reactor.netty.http.client=DEBUG
```

- Routage par chemins → services (load-balanced `lb://SERVICE_NAME`):

```1:35:demoApiGatewayApplication/src/main/java/tn/esprit/spring/demoapigatewayapplication/DemoApiGatewayApplication.java
package tn.esprit.spring.demoapigatewayapplication;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableDiscoveryClient
public class DemoApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApiGatewayApplication.class, args);
    }

    @Bean
    public RouteLocator gatwayroutes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("candidats_example_route", r -> r.path("/candidats/**")
                        .uri("lb://MSCandidat4twin6"))
                .route("etudiants_route", r -> r.path("/etudiants/**")
                        .uri("lb://MSEtudiant4twin6"))
                .route("enseignants_route", r -> r.path("/enseignants/**")
                        .uri("lb://MSEnseignant4twin6"))
                .route("classes_route", r -> r.path("/classes/**")
                        .uri("lb://MSClasse4twin6"))
                .route("matieres_route", r -> r.path("/matieres/**")
                        .uri("lb://MSMatiere4twin6"))
                .route("salles_route", r -> r.path("/salles/**")
                        .uri("lb://MSSalle4twin6"))
        .build();

    }}
```

> Principe: Le front appelle `GET /etudiants`, la Gateway matche `path("/etudiants/**")`, résout le nom `MSEtudiant4twin6` via Eureka, choisit une instance et relaie l’appel.

---

### 🧾 Microservices — enregistrement Eureka

Chaque MS inclut `spring-cloud-starter-netflix-eureka-client` et déclare l’URL d’Eureka.

Exemple (Candidats — pattern identique pour les autres):

```1:20:MSCandidat4twin6/src/main/resources/application.properties
spring.application.name=MSCandidat4twin6
spring.cloud.config.import-check.enabled=false
spring.cloud.config.enabled=false
server.port=8081

#h2
spring.h2.console.enabled=true
spring.h2.console.path=/h2


# Datasource
spring.datasource.username=etudiants_user
spring.datasource.password=
#spring.datasource.url=jdbc:h2:file:./Database/Data/Etudiants
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto = create

#eureka
eureka.client.register-with-eureka=true
eureka.client.service-url.defauktZone=http://localhost:8761/eureka
```

Note: l’attribut `defaultZone` doit être bien orthographié (ici `defauktZone` semble une coquille dans l’exemple — à corriger en `defaultZone` si besoin).

---

### 🔁 Workflow complet (requête utilisateur → réponse)

1) Le navigateur appelle le front `http://localhost:3000/api/etudiants`  
   - Next.js proxie vers la Gateway: `http://localhost:8087/etudiants`
2) La Gateway reçoit `GET /etudiants`  
   - Route `path("/etudiants/**")` → `lb://MSEtudiant4twin6`
3) La Gateway interroge Eureka pour les instances de `MSEtudiant4twin6`  
   - Sélectionne une instance (round-robin, etc.)
4) La Gateway relaie l’appel au microservice cible (port direct 8082)  
   - Le MS traite et retourne la réponse JSON
5) La Gateway renvoie la réponse au front → au navigateur

Bénéfices: aucune adresse/port codé en dur côté front, tolérance aux changements d’instances, point d’entrée unique, possibilité d’ajouter des filtres (auth, rate limit, logs…).

---

### 📚 Récap des endpoints (via Gateway)

Extraits de `ENDPOINTS.md` (préférer la Gateway depuis le front):

- Étudiants → `http://localhost:8087/etudiants/...`
- Enseignants → `http://localhost:8087/enseignants/...`
- Classes → `http://localhost:8087/classes/...`
- Matières → `http://localhost:8087/matieres/...`
- Salles → `http://localhost:8087/salles/...`

---

### 🗂️ Par gestion (owners)

- **Gestion Étudiant** — Ons Kochtane  
  - Service: `MSEtudiant4twin6` (port 8082) — base path: `/etudiants`
  - Via Gateway: `/etudiants/**`

- **Gestion Enseignant** — Sahar Ouji Boughanmi  
  - Service: `MSEnseignant4twin6` (port 8083) — base path: `/enseignants`
  - Via Gateway: `/enseignants/**`

- **Gestion Classe** — Chniti Med Amin  
  - Service: `MSClasse4twin6` (port 8084) — base path: `/classes`
  - Via Gateway: `/classes/**`

- **Gestion Matière** — Mahmoud Ghada  
  - Service: `MSMatiere4twin6` (port 8085) — base path: `/matieres`
  - Via Gateway: `/matieres/**`

- **Gestion Salle** — Marwa Laabidi  
  - Service: `MSSalle4twin6` (port 8086) — base path: `/salles`
  - Via Gateway: `/salles/**`

---

### ✅ Bonnes pratiques

- Appeler toujours via la Gateway depuis le front (CORS, découvertes, filtres).
- Démarrer Eureka avant tout, puis Gateway, puis les microservices.
- Surveiller `http://localhost:8761` pour vérifier l’enregistrement des services.
- Garder `spring.application.name` unique par microservice (clé dans Eureka).
- Centraliser le routage dans la Gateway (Java DSL ou `application.yml`).

---

### 🧪 Test rapide (exemples)

- Lister les étudiants (via Gateway):
  - `GET http://localhost:8087/etudiants`
- Détail d’un enseignant `id=1` (via Front → Gateway):
  - `GET http://localhost:3000/api/enseignants/1`

Si vous avez des questions sur un point précis (routage dynamique, filtres, timeouts, load-balancing, etc.), donnez-moi le cas d’usage et j’entre dans le détail.

