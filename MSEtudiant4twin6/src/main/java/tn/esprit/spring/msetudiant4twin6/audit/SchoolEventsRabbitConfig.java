package tn.esprit.spring.msetudiant4twin6.audit;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SchoolEventsRabbitConfig {

    public static final String EXCHANGE = "school.events";
    public static final String QUEUE_AUDIT_NOTES = "audit-notes-queue";

    @Bean
    public TopicExchange schoolEventsExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue auditNotesQueue() {
        return new Queue(QUEUE_AUDIT_NOTES, true);
    }

    /** grade.created, grade.updated */
    @Bean
    public Binding auditNotesBinding(Queue auditNotesQueue, TopicExchange schoolEventsExchange) {
        return BindingBuilder.bind(auditNotesQueue).to(schoolEventsExchange).with("grade.#");
    }
}
