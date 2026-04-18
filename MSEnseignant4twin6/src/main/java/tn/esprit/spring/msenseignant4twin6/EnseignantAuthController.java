package tn.esprit.spring.msenseignant4twin6;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.spring.msenseignant4twin6.dto.EnseignantSessionDto;
import tn.esprit.spring.msenseignant4twin6.dto.LoginRequest;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/enseignants/auth")
public class EnseignantAuthController {

    private final EnseignantRepository repository;

    public EnseignantAuthController(EnseignantRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest body) {
        if (body.getMatricule() == null || body.getMatricule().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Matricule requis"));
        }
        Optional<Enseignant> opt = repository.findByMatricule(body.getMatricule().trim());
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Identifiants invalides"));
        }
        Enseignant e = opt.get();
        if (!passwordMatches(e.getPassword(), body.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Identifiants invalides"));
        }
        EnseignantSessionDto dto = new EnseignantSessionDto();
        dto.setId(e.getId());
        dto.setNom(e.getNom());
        dto.setDescription(e.getDescription());
        dto.setMatricule(e.getMatricule());
        dto.setRole(e.getRole() != null ? e.getRole().getJsonLabel() : "Enseignant");
        return ResponseEntity.ok(dto);
    }

    private static boolean passwordMatches(String stored, String provided) {
        if (stored == null || stored.isEmpty()) {
            return provided == null || provided.isEmpty();
        }
        return stored.equals(provided);
    }
}
