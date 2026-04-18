package tn.esprit.spring.msenseignant4twin6;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.spring.msenseignant4twin6.dto.EnseignantResponseDto;
import tn.esprit.spring.msenseignant4twin6.security.SecurityUtils;

import java.util.List;
import java.util.stream.Collectors;

@RefreshScope
@RestController
@RequestMapping("/enseignants")
public class EnseignantController {

    private final IEnseignantService service;
    private final SecurityUtils securityUtils;

    @Value("${welcome.message}")
    private String welcomeMessage;

    public EnseignantController(IEnseignantService service, SecurityUtils securityUtils) {
        this.service = service;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/welcome")
    public String welcome() {
        return welcomeMessage;
    }

    /**
     * Chef / enseignant : profil unique (claim {@code school_enseignant_id}).
     * Étudiant : liste des enseignants de sa classe (via les matières).
     */
    @GetMapping("/me")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT','ROLE_ETUDIANT')")
    public ResponseEntity<List<EnseignantResponseDto>> getMe() {
        if (securityUtils.hasAuthority("ROLE_ETUDIANT")) {
            List<EnseignantResponseDto> profs = service.findProfesseursPourEtudiantConnecte().stream()
                    .map(EnseignantResponseDto::fromEntity)
                    .toList();
            return ResponseEntity.ok(profs);
        }
        Long id = securityUtils.getSchoolEnseignantId();
        if (id != null) {
            return service.getById(id)
                    .map(e -> ResponseEntity.ok(List.of(EnseignantResponseDto.fromEntity(e))))
                    .orElseGet(() -> ResponseEntity.notFound().build());
        }
        String mat = securityUtils.getPreferredUsername();
        if (mat != null && !mat.isBlank()) {
            return service.findByMatriculeIgnoreCase(mat)
                    .map(e -> ResponseEntity.ok(List.of(EnseignantResponseDto.fromEntity(e))))
                    .orElseGet(() -> ResponseEntity.notFound().build());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT')")
    public ResponseEntity<List<EnseignantResponseDto>> getAll() {
        List<EnseignantResponseDto> data = service.getAll().stream()
                .map(EnseignantResponseDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(data);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT')")
    public ResponseEntity<EnseignantResponseDto> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(EnseignantResponseDto::fromEntity)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<EnseignantResponseDto> create(@RequestBody Enseignant entity) {
        Enseignant created = service.create(entity);
        return ResponseEntity.ok(EnseignantResponseDto.fromEntity(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<EnseignantResponseDto> update(@PathVariable Long id, @RequestBody Enseignant entity) {
        return service.update(id, entity)
                .map(EnseignantResponseDto::fromEntity)
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
