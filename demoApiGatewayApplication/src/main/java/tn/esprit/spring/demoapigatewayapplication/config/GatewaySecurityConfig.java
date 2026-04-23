package tn.esprit.spring.demoapigatewayapplication.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Gateway : filtrage JWT par rôle sur les chemins exposés (sans préfixe /api — le proxy Vite le retire).
 * Le contrôle fin des données reste dans chaque microservice.
 */
@Configuration
@EnableWebFluxSecurity
@Profile("!test")
public class GatewaySecurityConfig {

    @Bean
    SecurityWebFilterChain springSecurityFilterChain(
            ServerHttpSecurity http, KeycloakJwtAuthenticationConverter keycloakJwtAuthenticationConverter) {
        http.csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(Customizer.withDefaults())
                .authorizeExchange(ex -> ex
                        .pathMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .pathMatchers(
                                "/swagger-gateway.html",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/webjars/**")
                        .permitAll()
                        .pathMatchers(HttpMethod.GET, "/central-docs/**")
                        .permitAll()
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/etudiants/welcome").permitAll()
                        .pathMatchers(HttpMethod.GET, "/classes/welcome").permitAll()
                        .pathMatchers(HttpMethod.GET, "/matieres/welcome").permitAll()
                        .pathMatchers(HttpMethod.GET, "/salles/welcome").permitAll()
                        .pathMatchers(HttpMethod.GET, "/enseignants/welcome").permitAll()
                        .pathMatchers("/etudiants/auth/**", "/etudiants/portail").permitAll()
                        .pathMatchers("/enseignants/auth/**").permitAll()

                        // ── Étudiants ─────────────────────────────────────────────
                        .pathMatchers(HttpMethod.GET, "/etudiants/me")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ETUDIANT")
                        .pathMatchers(HttpMethod.GET, "/etudiants/classe", "/etudiants/classe/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")
                        .pathMatchers(HttpMethod.GET, "/etudiants")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")
                        .pathMatchers(HttpMethod.GET, "/etudiants/*")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT", "ROLE_ETUDIANT")
                        .pathMatchers(HttpMethod.POST, "/etudiants/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")
                        .pathMatchers(HttpMethod.PUT, "/etudiants/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")
                        .pathMatchers(HttpMethod.DELETE, "/etudiants/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")

                        // ── Classes ───────────────────────────────────────────────
                        .pathMatchers(HttpMethod.GET, "/classes/search", "/classes/search/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")
                        .pathMatchers(HttpMethod.GET, "/classes/mes-classes", "/classes/mes-classes/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")
                        .pathMatchers(HttpMethod.GET, "/classes/me", "/classes/me/**")
                        .hasAuthority("ROLE_ETUDIANT")
                        .pathMatchers(HttpMethod.GET, "/classes/*/etudiants", "/classes/*/etudiants/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")
                        .pathMatchers(HttpMethod.GET, "/classes/*/emploi-du-temps", "/classes/*/emploi-du-temps/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT", "ROLE_ETUDIANT")
                        .pathMatchers(HttpMethod.GET, "/classes/*/matieres-dediees", "/classes/*/matieres-dediees/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT", "ROLE_ETUDIANT")
                        .pathMatchers(HttpMethod.GET, "/classes/*")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT", "ROLE_ETUDIANT")
                        .pathMatchers(HttpMethod.GET, "/classes")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")
                        .pathMatchers(HttpMethod.POST, "/classes/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")
                        .pathMatchers(HttpMethod.PUT, "/classes/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")
                        .pathMatchers(HttpMethod.DELETE, "/classes/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")

                        // ── Salles ────────────────────────────────────────────────
                        .pathMatchers(HttpMethod.GET, "/salles/mes-salles", "/salles/mes-salles/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")
                        .pathMatchers(HttpMethod.GET, "/salles/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT", "ROLE_ETUDIANT")
                        .pathMatchers(HttpMethod.POST, "/salles/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")
                        .pathMatchers(HttpMethod.PUT, "/salles/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")
                        .pathMatchers(HttpMethod.DELETE, "/salles/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")

                        // ── Matières ──────────────────────────────────────────────
                        .pathMatchers(HttpMethod.GET, "/matieres/mes-matieres", "/matieres/mes-matieres/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")
                        .pathMatchers(HttpMethod.GET, "/matieres/me", "/matieres/me/**")
                        .hasAuthority("ROLE_ETUDIANT")
                        .pathMatchers(HttpMethod.GET, "/matieres/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT", "ROLE_ETUDIANT")
                        .pathMatchers(HttpMethod.POST, "/matieres/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")
                        .pathMatchers(HttpMethod.PUT, "/matieres/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")
                        .pathMatchers(HttpMethod.DELETE, "/matieres/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")

                        // ── Enseignants ───────────────────────────────────────────
                        .pathMatchers(HttpMethod.GET, "/enseignants/me", "/enseignants/me/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT", "ROLE_ETUDIANT")
                        .pathMatchers(HttpMethod.GET, "/enseignants/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")
                        .pathMatchers(HttpMethod.POST, "/enseignants/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")
                        .pathMatchers(HttpMethod.PUT, "/enseignants/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")
                        .pathMatchers(HttpMethod.DELETE, "/enseignants/**")
                        .hasAuthority("ROLE_CHEF_ENSEIGNANT")

                        // ── Notes (NestJS) ───────────────────────────────────────
                        .pathMatchers(HttpMethod.GET, "/notes/me", "/notes/me/**")
                        .hasAuthority("ROLE_ETUDIANT")
                        .pathMatchers(HttpMethod.GET, "/notes/classe/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")
                        .pathMatchers(HttpMethod.GET, "/notes/stats/**", "/notes/search", "/notes/search/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")
                        .pathMatchers(HttpMethod.GET, "/notes/export/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")
                        .pathMatchers(HttpMethod.GET, "/notes/classement/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")
                        /* /notes seul (POST création note, GET liste chef…) : /notes/** ne matche pas toujours l’absence de segment après /notes/ */
                        .pathMatchers(HttpMethod.GET, "/notes", "/notes/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT", "ROLE_ETUDIANT")
                        .pathMatchers(HttpMethod.POST, "/notes", "/notes/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")
                        .pathMatchers(HttpMethod.PUT, "/notes", "/notes/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")
                        .pathMatchers(HttpMethod.DELETE, "/notes", "/notes/**")
                        .hasAnyAuthority("ROLE_CHEF_ENSEIGNANT", "ROLE_ENSEIGNANT")

                        .anyExchange()
                        .authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(
                        jwt -> jwt.jwtAuthenticationConverter(
                                j -> Mono.just(keycloakJwtAuthenticationConverter.convert(j)))));
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(
                List.of("http://localhost:5173", "http://localhost:8180", "http://localhost:8087"));
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        c.setAllowedHeaders(List.of("*"));
        c.setAllowCredentials(true);
        c.setExposedHeaders(List.of("X-Enseignant-Role"));
        c.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", c);
        return source;
    }
}
