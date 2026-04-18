package tn.esprit.spring.msclasse4twin6.pedagogie;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Affiche dans la console au démarrage où écouter les logs RabbitMQ (Scénario 2).
 */
@Component
public class RabbitMqConsumerReadyInfo {

    private static final Logger log = LoggerFactory.getLogger(RabbitMqConsumerReadyInfo.class);

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        log.info(
                "RabbitMQ (MSClasse) — écoute active sur la file '{}', exchange '{}', clé inscription.created. Les lignes [RabbitMQ — Scénario 2] apparaissent ici.",
                PedagogieRabbitConfig.QUEUE_INSCRIPTION,
                PedagogieRabbitConfig.EXCHANGE);
    }
}
