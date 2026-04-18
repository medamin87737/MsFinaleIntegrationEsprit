package tn.esprit.spring.msclasse4twin6.pedagogie;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class InscriptionPedagogiqueListener {

    private static final Logger log = LoggerFactory.getLogger(InscriptionPedagogiqueListener.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final InscriptionPedagogiqueSuiviRepository repository;

    public InscriptionPedagogiqueListener(InscriptionPedagogiqueSuiviRepository repository) {
        this.repository = repository;
    }

    @RabbitListener(queues = PedagogieRabbitConfig.QUEUE_INSCRIPTION)
    public void onInscriptionCreated(String body) {
        try {
            JsonNode n = objectMapper.readTree(body);
            InscriptionPedagogiqueSuivi row = new InscriptionPedagogiqueSuivi();
            row.setEtudiantId(n.get("etudiantId").asLong());
            row.setMatiereId(n.get("matiereId").asLong());
            if (n.hasNonNull("inscriptionId")) {
                row.setInscriptionId(n.get("inscriptionId").asText());
            }
            row.setReceivedAt(Instant.now());
            repository.save(row);
            log.info(
                    "[RabbitMQ — Scénario 2] Événement 'inscription.created' reçu — suivi enregistré dans inscription_pedagogique_suivi (étudiant={}, matière={}).",
                    row.getEtudiantId(),
                    row.getMatiereId());
        } catch (Exception e) {
            log.error("[RabbitMQ] Échec traitement inscription.created: {}", e.getMessage(), e);
        }
    }
}
