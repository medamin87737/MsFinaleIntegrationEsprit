package tn.esprit.spring.msetudiant4twin6.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.time.Instant;

import static org.springframework.amqp.support.AmqpHeaders.RECEIVED_ROUTING_KEY;

@Component
public class AuditNoteEventListener {

    private static final Logger log = LoggerFactory.getLogger(AuditNoteEventListener.class);

    private final AuditNoteEventRepository repository;

    public AuditNoteEventListener(AuditNoteEventRepository repository) {
        this.repository = repository;
    }

    @RabbitListener(queues = SchoolEventsRabbitConfig.QUEUE_AUDIT_NOTES)
    public void onGradeEvent(String body, @Header(RECEIVED_ROUTING_KEY) String routingKey) {
        try {
            AuditNoteEvent row = new AuditNoteEvent();
            row.setRoutingKey(routingKey);
            row.setPayload(body);
            row.setReceivedAt(Instant.now());
            repository.save(row);
            if ("grade.created".equals(routingKey)) {
                log.info("[RabbitMQ — Scénario 1] Événement 'grade.created' reçu et enregistré dans audit_notes_events (audit des notes).");
            } else if ("grade.updated".equals(routingKey)) {
                log.info("[RabbitMQ — Scénario 1] Événement 'grade.updated' reçu et enregistré dans audit_notes_events.");
            } else {
                log.info("[RabbitMQ] Événement grade reçu (clé={}) — ligne d'audit enregistrée.", routingKey);
            }
        } catch (Exception e) {
            log.error("[RabbitMQ] Échec enregistrement audit (clé={}): {}", routingKey, e.getMessage(), e);
            throw e;
        }
    }
}
