package tn.esprit.spring.msclasse4twin6.pedagogie;

import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Suivi des inscriptions étudiant–matière reçues via RabbitMQ depuis MSNotes.
 */
@RestController
@RequestMapping("/classes/pedagogie")
public class PedagogieSuiviController {

    private final InscriptionPedagogiqueSuiviRepository repository;

    public PedagogieSuiviController(InscriptionPedagogiqueSuiviRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/inscriptions-recues")
    public ResponseEntity<List<InscriptionPedagogiqueSuivi>> listInscriptionsRecues() {
        return ResponseEntity.ok(
                repository.findAll(Sort.by(Sort.Direction.DESC, "receivedAt")));
    }
}
