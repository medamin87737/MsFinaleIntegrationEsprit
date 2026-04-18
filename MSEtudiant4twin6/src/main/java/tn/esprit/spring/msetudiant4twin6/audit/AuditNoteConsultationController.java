package tn.esprit.spring.msetudiant4twin6.audit;

import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Consultation du journal d'audit des événements de notes (scénario RabbitMQ — consommateur).
 */
@RestController
@RequestMapping("/etudiants/audit")
public class AuditNoteConsultationController {

    private final AuditNoteEventRepository repository;

    public AuditNoteConsultationController(AuditNoteEventRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/notes-events")
    public ResponseEntity<List<AuditNoteEvent>> listAuditNotesEvents() {
        return ResponseEntity.ok(
                repository.findAll(Sort.by(Sort.Direction.DESC, "receivedAt")));
    }
}
