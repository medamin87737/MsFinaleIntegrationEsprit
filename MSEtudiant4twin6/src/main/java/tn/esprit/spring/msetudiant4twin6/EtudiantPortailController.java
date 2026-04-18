package tn.esprit.spring.msetudiant4twin6;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.spring.msetudiant4twin6.dto.EtudiantPortailDto;
import tn.esprit.spring.msetudiant4twin6.dto.LoginRequest;

import java.util.Map;
import java.util.Optional;

/**
 * Rafraîchissement du portail (même contrôle d’identité que le login) — hors intercepteur Chef.
 */
@RestController
@RequestMapping("/etudiants/portail")
public class EtudiantPortailController {

    private final EtudiantRepository repository;
    private final EtudiantPortailService portailService;

    public EtudiantPortailController(EtudiantRepository repository, EtudiantPortailService portailService) {
        this.repository = repository;
        this.portailService = portailService;
    }

    @PostMapping
    public ResponseEntity<?> portail(@RequestBody LoginRequest body) {
        if (body.getMatricule() == null || body.getMatricule().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Matricule requis"));
        }
        Optional<Etudiant> opt = repository.findByMatricule(body.getMatricule().trim());
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Identifiants invalides"));
        }
        Etudiant e = opt.get();
        if (!passwordMatches(e.getPassword(), body.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Identifiants invalides"));
        }
        EtudiantPortailDto dto = portailService.buildPortail(e);
        return ResponseEntity.ok(dto);
    }

    private static boolean passwordMatches(String stored, String provided) {
        if (stored == null || stored.isEmpty()) {
            return provided == null || provided.isEmpty();
        }
        return stored.equals(provided);
    }
}
