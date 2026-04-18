package tn.esprit.spring.msclasse4twin6;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import feign.FeignException;
import tn.esprit.spring.msclasse4twin6.dto.ClasseAvecMatieresDto;
import tn.esprit.spring.msclasse4twin6.dto.ClasseSearchCriteria;
import tn.esprit.spring.msclasse4twin6.dto.ClasseStatsDto;
import tn.esprit.spring.msclasse4twin6.dto.EmploiDuTempsDto;
import tn.esprit.spring.msclasse4twin6.dto.PresenceDto;
import tn.esprit.spring.msclasse4twin6.feign.EtudiantFeignClient;
import tn.esprit.spring.msclasse4twin6.feign.EtudiantSummary;
import tn.esprit.spring.msclasse4twin6.security.SecurityUtils;

import java.util.List;

@RefreshScope
@RestController
@RequestMapping("/classes")
public class ClasseController {

    private final IClasseService service;
    private final SecurityUtils securityUtils;
    private final EtudiantFeignClient etudiantFeignClient;

    @Value("${welcome.message}")
    private String welcomeMessage;

    public ClasseController(IClasseService service, SecurityUtils securityUtils, EtudiantFeignClient etudiantFeignClient) {
        this.service = service;
        this.securityUtils = securityUtils;
        this.etudiantFeignClient = etudiantFeignClient;
    }

    @GetMapping("/welcome")
    public String welcome() {
        return welcomeMessage;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<List<Classe>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('ROLE_ETUDIANT')")
    public ResponseEntity<Classe> getMyClasse() {
        return service.findMyClasseForCurrentEtudiant()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/mes-classes")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT')")
    public ResponseEntity<List<ClasseAvecMatieresDto>> getMesClasses() {
        if (securityUtils.hasAuthority("ROLE_CHEF_ENSEIGNANT")) {
            return ResponseEntity.ok(service.findAllAvecEmploi());
        }
        Long ensId = securityUtils.getSchoolEnseignantId();
        if (ensId == null) {
            throw new AccessDeniedException("Identifiant enseignant (school_enseignant_id) manquant dans le token.");
        }
        return ResponseEntity.ok(service.findByEnseignantId(ensId));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT')")
    public ResponseEntity<Page<Classe>> searchClasses(
            @RequestParam(required = false) String nom,
            @RequestParam(required = false) String niveau,
            @RequestParam(required = false) String filiere,
            @RequestParam(required = false) String jour,
            @RequestParam(required = false) String matiere,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        ClasseSearchCriteria criteria = new ClasseSearchCriteria(nom, niveau, filiere, jour, matiere);
        if (securityUtils.hasAuthority("ROLE_ENSEIGNANT")) {
            criteria.setEnseignantId(securityUtils.getSchoolEnseignantId());
        }
        return ResponseEntity.ok(service.searchDynamic(criteria, PageRequest.of(page, size)));
    }

    @GetMapping("/{id:\\d+}/emploi-du-temps")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT','ROLE_ETUDIANT')")
    public ResponseEntity<List<EmploiDuTempsDto>> getEmploiDuTemps(@PathVariable Long id) {
        assertCanReadClasse(id);
        return ResponseEntity.ok(service.getEmploiDuTemps(id));
    }

    @GetMapping("/{id:\\d+}/etudiants")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT')")
    public ResponseEntity<List<EtudiantSummary>> getEtudiants(@PathVariable Long id) {
        if (securityUtils.hasAuthority("ROLE_ENSEIGNANT")) {
            Long ensId = securityUtils.getSchoolEnseignantId();
            if (ensId == null || !service.classeAppartientEnseignant(id, ensId)) {
                throw new AccessDeniedException("Classe non assignée.");
            }
        }
        return ResponseEntity.ok(service.getEtudiants(id));
    }

    @GetMapping("/{id:\\d+}/stats")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT')")
    public ResponseEntity<ClasseStatsDto> getStats(@PathVariable Long id) {
        if (securityUtils.hasAuthority("ROLE_ENSEIGNANT")) {
            Long ensId = securityUtils.getSchoolEnseignantId();
            if (ensId == null || !service.classeAppartientEnseignant(id, ensId)) {
                throw new AccessDeniedException("Classe non assignée.");
            }
        }
        return ResponseEntity.ok(service.getStats(id));
    }

    @GetMapping("/{id:\\d+}/presence")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT')")
    public ResponseEntity<PresenceDto> getPresence(@PathVariable Long id) {
        if (securityUtils.hasAuthority("ROLE_ENSEIGNANT")) {
            Long ensId = securityUtils.getSchoolEnseignantId();
            if (ensId == null || !service.classeAppartientEnseignant(id, ensId)) {
                throw new AccessDeniedException("Classe non assignée.");
            }
        }
        return ResponseEntity.ok(service.getPresenceSheet(id));
    }

    /**
     * Scénario OpenFeign : classe + matières dédiées (avec horaires) récupérées sur MSMatiere4twin6.
     */
    @GetMapping("/{id:\\d+}/matieres-dediees")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT','ROLE_ETUDIANT')")
    public ResponseEntity<ClasseAvecMatieresDto> getClasseAvecMatieres(@PathVariable Long id) {
        assertCanReadClasse(id);
        return service.getClasseAvecMatieres(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id:\\d+}")
    @PreAuthorize("hasAnyAuthority('ROLE_CHEF_ENSEIGNANT','ROLE_ENSEIGNANT','ROLE_ETUDIANT')")
    public ResponseEntity<Classe> getById(@PathVariable Long id) {
        assertCanReadClasse(id);
        return service.getById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<Classe> create(@RequestBody Classe entity) {
        return ResponseEntity.ok(service.create(entity));
    }

    @PutMapping("/{id:\\d+}")
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<Classe> update(@PathVariable Long id, @RequestBody Classe entity) {
        return service.update(id, entity).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id:\\d+}")
    @PreAuthorize("hasAuthority('ROLE_CHEF_ENSEIGNANT')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    private void assertCanReadClasse(Long classeId) {
        if (!securityUtils.hasAuthority("ROLE_ETUDIANT")) {
            return;
        }
        EtudiantSummary me;
        try {
            me = etudiantFeignClient.getMe();
        } catch (FeignException e) {
            if (e.status() == 404) {
                throw new AccessDeniedException("Profil étudiant introuvable (MSEtudiant).");
            }
            throw e;
        }
        if (me == null || me.getClasseId() == null || !me.getClasseId().equals(classeId)) {
            throw new AccessDeniedException("Accès limité à votre classe.");
        }
    }
}
