package tn.esprit.spring.msetudiant4twin6.security;

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
 * Même logique que la gateway : autorités = rôles realm Keycloak (hasAuthority côté Spring).
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
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess == null) {
            return Collections.emptyList();
        }
        List<String> roles = (List<String>) realmAccess.getOrDefault("roles", List.of());
        List<GrantedAuthority> authorities = roles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toCollection(ArrayList::new));
        if (roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_CHEF_ENSEIGNANT")) {
            authorities.add(new SimpleGrantedAuthority("ROLE_CHEF_ENSEIGNANT"));
        }
        return authorities;
    }
}
