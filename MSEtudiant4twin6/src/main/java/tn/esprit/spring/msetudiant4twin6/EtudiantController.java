package tn.esprit.spring.msetudiant4twin6;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.spring.msetudiant4twin6.security.EnseignantIdResolver;
import tn.esprit.spring.msetudiant4twin6.security.SecurityUtils;

import java.util.List;

@RefreshScope
@RestController
@RequestMapping("/etudiants")
public class EtudiantController {

    private final IEtudiantService service;
    private final SecurityUtils securityUtils;
    private final EnseignantIdResolver enseignantIdResolver;

    @Value("${welcome.message}")
    private String welcomeMessage;

    public EtudiantController(IEtudiantService service, SecurityUtils securityUtils, EnseignantIdResolver enseignantIdResolver) {
        this.service = service;
        this.securityUtils = securityUtils;
        this.enseignantIdResolver = enseignantIdResolver;
    }

    @GetMapping("/welcome")
    public String welcome() {
        return welcomeMessage;
    }

    /** Liste complète — réservé au chef enseignant. */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<List<Etudiant>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    /** Profil de l’utilisateur connecté (sub Keycloak ou matricule = preferred_username). */
    @GetMapping("/me")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ETUDIANT')")
    public ResponseEntity<Etudiant> getMyProfile() {
        if (securityUtils.hasAuthority("ROLE_CHEF_ENSEIGNANT")) {
            return ResponseEntity.notFound().build();
        }
        String sub = securityUtils.getCurrentSubject();
        String username = securityUtils.getCurrentUsername();
        Etudiant e = service.findByKeycloakId(sub)
                .or(() -> username != null ? service.findByMatricule(username) : java.util.Optional.empty())
                .orElse(null);
        if (e == null) {
            return ResponseEntity.notFound().build();
        }
        boolean okBySub = e.getKeycloakId() != null && sub != null && sub.equals(e.getKeycloakId());
        boolean okByMatricule = username != null && username.equalsIgnoreCase(e.getMatricule());
        if (!okBySub && !okByMatricule) {
            throw new AccessDeniedException("Profil non associé à ce compte Keycloak.");
        }
        return ResponseEntity.ok(e);
    }

    /** Étudiants d’une classe — enseignant uniquement sur ses classes (vérification via matières). */
    @GetMapping("/classe/{classeId}")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT')")
    public ResponseEntity<List<Etudiant>> getEtudiantsByClasse(@PathVariable Long classeId) {
        if (securityUtils.hasAuthority("ROLE_ENSEIGNANT")) {
            Long ensId = enseignantIdResolver.resolveOrNull();
            if (ensId == null || !service.classeAppartientEnseignant(classeId, ensId)) {
                throw new AccessDeniedException("Cette classe ne vous est pas assignée.");
            }
        }
        return ResponseEntity.ok(service.findByClasseId(classeId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Etudiant> getById(@PathVariable Long id) {
        if (securityUtils.hasAuthority("ROLE_ETUDIANT")) {
            String sub = securityUtils.getCurrentSubject();
            String username = securityUtils.getCurrentUsername();
            Etudiant self = service.findByKeycloakId(sub)
                    .or(() -> username != null ? service.findByMatricule(username) : java.util.Optional.empty())
                    .orElse(null);
            if (self == null || !self.getId().equals(id)) {
                throw new AccessDeniedException("Accès limité à votre propre fiche.");
            }
        } else if (securityUtils.hasAuthority("ROLE_ENSEIGNANT")) {
            Long ensId = enseignantIdResolver.resolveOrNull();
            Etudiant target = service.getById(id).orElse(null);
            if (target == null || target.getClasseId() == null || ensId == null) {
                throw new AccessDeniedException("Étudiant introuvable.");
            }
            if (!service.classeAppartientEnseignant(target.getClasseId(), ensId)) {
                throw new AccessDeniedException("Étudiant hors de vos classes.");
            }
        } else if (!securityUtils.hasAuthority("ROLE_CHEF_ENSEIGNANT")) {
            throw new AccessDeniedException("Accès refusé.");
        }
        return service.getById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<Etudiant> create(@RequestBody Etudiant entity) {
        return ResponseEntity.ok(service.create(entity));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<Etudiant> update(@PathVariable Long id, @RequestBody Etudiant entity) {
        return service.update(id, entity).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
