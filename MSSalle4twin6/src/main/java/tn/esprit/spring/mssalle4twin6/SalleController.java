package tn.esprit.spring.mssalle4twin6;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tn.esprit.spring.mssalle4twin6.dto.SalleAvecClasseDto;
import tn.esprit.spring.mssalle4twin6.dto.SalleAvecMatieresDto;

import java.util.List;

@RefreshScope
@RestController
@RequestMapping("/salles")
public class SalleController {

    private final ISalleService service;

    @Value("${welcome.message}")
    private String welcomeMessage;

    public SalleController(ISalleService service) {
        this.service = service;
    }

    @GetMapping("/welcome")
    public String welcome() {
        return welcomeMessage;
    }

    @GetMapping
    public ResponseEntity<List<Salle>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    /** Salles où l'enseignant a au moins une matière assignée (chef : toutes les salles). */
    @GetMapping("/mes-salles")
    @PreAuthorize("hasAnyAuthority('ROLE_ENSEIGNANT','ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<List<Salle>> getMesSalles() {
        return ResponseEntity.ok(service.findMesSallesPourUtilisateurConnecte());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Salle> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Scénario OpenFeign : salle + libellé classe récupéré sur MSClasse4twin6.
     */
    @GetMapping("/{id}/avec-libelle-classe")
    public ResponseEntity<SalleAvecClasseDto> getAvecLibelleClasse(
            @PathVariable Long id,
            @RequestParam Long classeId) {
        return service.getAvecLibelleClasse(id, classeId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Scénario OpenFeign : salle + matières dédiées avec les horaires de séance.
     */
    @GetMapping("/{id}/matieres-dediees")
    public ResponseEntity<SalleAvecMatieresDto> getSalleAvecMatieres(@PathVariable Long id) {
        return service.getSalleAvecMatieres(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<Salle> create(@RequestBody Salle entity) {
        return ResponseEntity.ok(service.create(entity));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<Salle> update(@PathVariable Long id, @RequestBody Salle entity) {
        return service.update(id, entity)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
