package tn.esprit.spring.msmatiere4twin6;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import tn.esprit.spring.msmatiere4twin6.dto.AssignationSalleRequest;
import tn.esprit.spring.msmatiere4twin6.dto.MatiereAvecEnseignantDto;

import java.util.List;

/**
 * Ordre des mappings : chemins littéraux (/me, /mes-matieres, /classe/...) avant {@code /{id}}
 * pour éviter que « me » soit capturé comme identifiant numérique.
 */
@RefreshScope
@RestController
@RequestMapping("/matieres")
public class MatiereController {

    private final IMatiereService service;

    @Value("${welcome.message}")
    private String welcomeMessage;

    public MatiereController(IMatiereService service) {
        this.service = service;
    }

    @GetMapping("/welcome")
    public String welcome() {
        return welcomeMessage;
    }

    /** Étudiant : matières de sa classe (le chef utilise {@code GET /matieres}). */
    @GetMapping("/me")
    @PreAuthorize("hasAuthority('ROLE_ETUDIANT')")
    public ResponseEntity<List<Matiere>> getMesMatieresEtudiant() {
        return ResponseEntity.ok(service.findMatieresPourEtudiantConnecte());
    }

    /** Enseignant ou chef : matières enseignées (ou toutes pour le chef). */
    @GetMapping("/mes-matieres")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT')")
    public ResponseEntity<List<Matiere>> getMesMatieresEnseignant() {
        return ResponseEntity.ok(service.findMatieresPourEnseignantOuChef());
    }

    /** Liste complète — chef uniquement (aligné matrice « accès total »). */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<List<Matiere>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/salle/{salleId}")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT','ROLE_ETUDIANT')")
    public ResponseEntity<List<Matiere>> getBySalleId(@PathVariable Long salleId) {
        return ResponseEntity.ok(service.getBySalleIdSecured(salleId));
    }

    @GetMapping("/classe/{classeId}")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT','ROLE_ETUDIANT')")
    public ResponseEntity<List<Matiere>> getByClasseId(@PathVariable Long classeId) {
        return ResponseEntity.ok(service.getByClasseIdSecured(classeId));
    }

    @GetMapping("/enseignant/{enseignantId}")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT')")
    public ResponseEntity<List<Matiere>> getByEnseignantId(@PathVariable Long enseignantId) {
        return ResponseEntity.ok(service.getByEnseignantId(enseignantId));
    }

    @GetMapping("/{id:\\d+}/details-avec-enseignant/{enseignantId:\\d+}")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT','ROLE_ETUDIANT')")
    public ResponseEntity<MatiereAvecEnseignantDto> getDetailsAvecEnseignant(
            @PathVariable Long id,
            @PathVariable Long enseignantId) {
        return service.getByIdSecured(id)
                .flatMap(ignored -> service.getDetailAvecEnseignant(id, enseignantId))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT','ROLE_ETUDIANT')")
    public ResponseEntity<Matiere> getById(@PathVariable Long id) {
        return service.getByIdSecured(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<Matiere> create(@RequestBody Matiere entity) {
        return ResponseEntity.ok(service.create(entity));
    }

    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<Matiere> update(@PathVariable Long id, @RequestBody Matiere entity) {
        return service.update(id, entity)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id:\\d+}/assignation-salle")
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<Matiere> assignerSalle(
            @PathVariable Long id,
            @RequestBody AssignationSalleRequest request
    ) {
        return service.assignerSalle(
                        id,
                        request.getSalleId(),
                        request.getClasseId(),
                        request.getHeureDebutSeance(),
                        request.getHeureFinSeance()
                )
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
