package tn.esprit.spring.msetudiant4twin6.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Affiche dans la console au démarrage où écouter les logs RabbitMQ (Scénario 1).
 */
@Component
public class RabbitMqConsumerReadyInfo {

    private static final Logger log = LoggerFactory.getLogger(RabbitMqConsumerReadyInfo.class);

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        log.info(
                "RabbitMQ (MSEtudiant) — écoute active sur la file '{}', exchange '{}', clés grade.*. Les lignes [RabbitMQ — Scénario 1] apparaissent ici après chaque message.",
                SchoolEventsRabbitConfig.QUEUE_AUDIT_NOTES,
                SchoolEventsRabbitConfig.EXCHANGE);
    }
}
