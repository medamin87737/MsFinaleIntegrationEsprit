package tn.esprit.spring.msetudiant4twin6.security;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * ID métier enseignant : claim {@code school_enseignant_id}, sinon {@code GET /enseignants/me} sur la gateway
 * (aligné sur MSEnseignant4twin6 / matricule).
 */
@Component
public class EnseignantIdResolver {

    private final SecurityUtils securityUtils;
    private final RestTemplate restTemplate;

    @Value("${app.gateway.base-url:http://api-gateway:8080}")
    private String gatewayBase;

    public EnseignantIdResolver(SecurityUtils securityUtils, RestTemplate restTemplate) {
        this.securityUtils = securityUtils;
        this.restTemplate = restTemplate;
    }

    public Long resolveOrNull() {
        Long id = securityUtils.getSchoolEnseignantId();
        if (id != null) {
            return id;
        }
        String base = gatewayBase.endsWith("/") ? gatewayBase.substring(0, gatewayBase.length() - 1) : gatewayBase;
        try {
            ResponseEntity<JsonNode> res = restTemplate.exchange(
                    base + "/enseignants/me",
                    HttpMethod.GET,
                    new HttpEntity<>(new HttpHeaders()),
                    JsonNode.class);
            JsonNode body = res.getBody();
            if (body != null && body.isArray() && !body.isEmpty()) {
                JsonNode first = body.get(0);
                if (first.hasNonNull("id")) {
                    return first.get("id").asLong();
                }
            }
        } catch (RestClientException | IllegalArgumentException ignored) {
            /* 401/403 ou JSON inattendu */
        }
        return null;
    }
}
