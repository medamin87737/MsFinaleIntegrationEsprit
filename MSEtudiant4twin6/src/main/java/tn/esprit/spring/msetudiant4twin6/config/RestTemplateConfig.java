package tn.esprit.spring.msetudiant4twin6.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate(
            RestTemplateBuilder builder,
            OAuth2AuthorizedClientManager authorizedClientManager,
            @Value("${app.gateway.base-url:http://api-gateway:8080}") String gatewayBase) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(20))
                .additionalInterceptors(new GatewayBearerTokenInterceptor(authorizedClientManager, gatewayBase))
                .build();
    }
}
