package tn.esprit.spring.demoapigatewayapplication.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Convertit un JWT Keycloak en {@link JwtAuthenticationToken} avec les autorités realm exactes
 * (ex. ROLE_CHEF_ENSEIGNANT). {@code ROLE_ADMIN} est complété par {@code ROLE_CHEF_ENSEIGNANT} pour les contrôles d’accès.
 */
@Component
public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractRealmRoles(jwt);
        String name = jwt.getClaimAsString("preferred_username");
        if (name == null || name.isBlank()) {
            name = jwt.getSubject();
        }
        return new JwtAuthenticationToken(jwt, authorities, name);
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
        List<String> roles = new ArrayList<>();
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null) {
            roles.addAll((List<String>) realmAccess.getOrDefault("roles", List.of()));
        }

        Map<String, Object> resourceAccess = jwt.getClaimAsMap("resource_access");
        if (resourceAccess != null) {
            for (Object clientVal : resourceAccess.values()) {
                if (!(clientVal instanceof Map<?, ?> clientMap)) {
                    continue;
                }
                Object clientRoles = clientMap.get("roles");
                if (clientRoles instanceof List<?> list) {
                    for (Object role : list) {
                        if (role instanceof String s) {
                            roles.add(s);
                        }
                    }
                }
            }
        }

        if (roles.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> uniqueRoles = roles.stream().distinct().toList();
        List<GrantedAuthority> authorities = uniqueRoles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toCollection(ArrayList::new));
        if (uniqueRoles.contains("ROLE_ADMIN") && !uniqueRoles.contains("ROLE_CHEF_ENSEIGNANT")) {
            authorities.add(new SimpleGrantedAuthority("ROLE_CHEF_ENSEIGNANT"));
        }
        return authorities;
    }
}
