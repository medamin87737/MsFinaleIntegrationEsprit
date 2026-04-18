package tn.esprit.spring.msclasse4twin6.pedagogie;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PedagogieRabbitConfig {

    public static final String EXCHANGE = "school.events";
    public static final String QUEUE_INSCRIPTION = "inscription-pedagogique-queue";

    @Bean
    public TopicExchange schoolEventsExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue inscriptionPedagogiqueQueue() {
        return new Queue(QUEUE_INSCRIPTION, true);
    }

    @Bean
    public Binding inscriptionPedagogiqueBinding(
            Queue inscriptionPedagogiqueQueue,
            TopicExchange schoolEventsExchange) {
        return BindingBuilder.bind(inscriptionPedagogiqueQueue).to(schoolEventsExchange).with("inscription.created");
    }
}
