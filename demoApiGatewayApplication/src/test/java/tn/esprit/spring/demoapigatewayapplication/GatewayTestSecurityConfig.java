package tn.esprit.spring.demoapigatewayapplication;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Profil test : pas de Keycloak — toutes les routes sont ouvertes pour le chargement du contexte.
 */
@TestConfiguration
@EnableWebFluxSecurity
@Profile("test")
public class GatewayTestSecurityConfig {

    @Bean
    SecurityWebFilterChain testSecurity(ServerHttpSecurity http) {
        return http.csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(ex -> ex.anyExchange().permitAll())
                .build();
    }
}
