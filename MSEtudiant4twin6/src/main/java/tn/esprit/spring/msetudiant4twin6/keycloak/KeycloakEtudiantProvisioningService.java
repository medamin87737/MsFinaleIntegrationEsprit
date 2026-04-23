package tn.esprit.spring.msetudiant4twin6.keycloak;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Comptes Keycloak pour les étudiants (claim {@code school_etudiant_id} + rôle {@code ROLE_ETUDIANT}).
 */
@Service
@ConditionalOnProperty(name = "app.keycloak.provisioning.enabled", havingValue = "true", matchIfMissing = true)
public class KeycloakEtudiantProvisioningService {

    private static final Logger log = LoggerFactory.getLogger(KeycloakEtudiantProvisioningService.class);
    private static final String PRIMARY_ROLE = "ROLE_ETUDIANT";
    private static final String[] MANAGED_ROLES = {
        "ROLE_ENSEIGNANT", "ROLE_CHEF_ENSEIGNANT", "ROLE_ETUDIANT"
    };

    private final RestTemplate restTemplate;

    @Value("${app.keycloak.admin.server-url:http://keycloak:8080}")
    private String serverUrl;

    @Value("${app.keycloak.admin.realm:school-realm}")
    private String schoolRealm;

    @Value("${app.keycloak.admin.username:admin}")
    private String adminUsername;

    @Value("${app.keycloak.admin.password:admin}")
    private String adminPassword;

    public KeycloakEtudiantProvisioningService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /** @return identifiant utilisateur Keycloak (UUID) si connu */
    public Optional<String> syncEtudiant(
            String matricule, String password, Long schoolEtudiantId, boolean creating) {
        if (matricule == null || matricule.isBlank()) {
            throw new IllegalArgumentException("Matricule requis pour Keycloak.");
        }
        if (creating && (password == null || password.isBlank())) {
            throw new IllegalArgumentException("Mot de passe requis pour créer le compte Keycloak.");
        }
        if (schoolEtudiantId == null) {
            throw new IllegalArgumentException("Identifiant étudiant manquant.");
        }
        String token = getAdminAccessToken();
        Optional<String> userIdOpt = findUserIdByUsername(token, matricule.trim());

        Map<String, Object> body = new HashMap<>();
        body.put("username", matricule.trim());
        body.put("enabled", true);
        body.put("emailVerified", true);
        Map<String, List<String>> attrs = new HashMap<>();
        attrs.put("schoolEtudiantId", List.of(String.valueOf(schoolEtudiantId)));
        body.put("attributes", attrs);

        HttpHeaders jsonHeaders = authJsonHeaders(token);
        if (userIdOpt.isEmpty()) {
            body.put(
                    "credentials",
                    List.of(Map.of("type", "password", "value", password, "temporary", false)));
            HttpEntity<Map<String, Object>> post = new HttpEntity<>(body, jsonHeaders);
            ResponseEntity<Void> created =
                    restTemplate.postForEntity(usersUrl(), post, Void.class);
            String loc = created.getHeaders().getFirst(HttpHeaders.LOCATION);
            if (loc == null) {
                throw new IllegalStateException("Keycloak: pas d’en-tête Location après création utilisateur.");
            }
            String userId = loc.substring(loc.lastIndexOf('/') + 1);
            replaceRealmRoles(token, userId);
            log.info("Keycloak: utilisateur étudiant créé (username={})", matricule);
            return Optional.of(userId);
        }
        String userId = userIdOpt.get();
        HttpEntity<Map<String, Object>> put = new HttpEntity<>(body, jsonHeaders);
        restTemplate.exchange(userUrl(userId), HttpMethod.PUT, put, Void.class);
        if (password != null && !password.isBlank()) {
            HttpEntity<Map<String, Object>> pwdPut =
                    new HttpEntity<>(Map.of("type", "password", "value", password, "temporary", false), jsonHeaders);
            restTemplate.exchange(userUrl(userId) + "/reset-password", HttpMethod.PUT, pwdPut, Void.class);
        }
        replaceRealmRoles(token, userId);
        log.info("Keycloak: utilisateur étudiant mis à jour (username={})", matricule);
        return Optional.of(userId);
    }

    public void deleteByMatricule(String matricule) {
        if (matricule == null || matricule.isBlank()) {
            return;
        }
        try {
            String token = getAdminAccessToken();
            Optional<String> id = findUserIdByUsername(token, matricule.trim());
            if (id.isEmpty()) {
                return;
            }
            HttpHeaders h = new HttpHeaders();
            h.setBearerAuth(token);
            restTemplate.exchange(userUrl(id.get()), HttpMethod.DELETE, new HttpEntity<>(h), Void.class);
            log.info("Keycloak: utilisateur étudiant {} supprimé", matricule);
        } catch (Exception e) {
            log.warn("Keycloak: suppression impossible pour {} — {}", matricule, e.getMessage());
        }
    }

    private void replaceRealmRoles(String token, String userId) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        HttpEntity<Void> getReq = new HttpEntity<>(h);
        ResponseEntity<JsonNode> mappings =
                restTemplate.exchange(
                        userUrl(userId) + "/role-mappings/realm", HttpMethod.GET, getReq, JsonNode.class);
        List<Map<String, String>> toRemove = new ArrayList<>();
        JsonNode arr = mappings.getBody();
        if (arr != null && arr.isArray()) {
            for (JsonNode n : arr) {
                String name = n.has("name") ? n.get("name").asText() : "";
                for (String m : MANAGED_ROLES) {
                    if (m.equals(name)) {
                        toRemove.add(Map.of("id", n.get("id").asText(), "name", name));
                    }
                }
            }
        }
        if (!toRemove.isEmpty()) {
            HttpEntity<List<Map<String, String>>> del =
                    new HttpEntity<>(toRemove, authJsonHeaders(token));
            restTemplate.exchange(
                    userUrl(userId) + "/role-mappings/realm", HttpMethod.DELETE, del, Void.class);
        }
        JsonNode roleNode = getRealmRole(token, PRIMARY_ROLE);
        if (roleNode == null || !roleNode.has("id")) {
            throw new IllegalStateException("Rôle realm introuvable: " + PRIMARY_ROLE);
        }
        List<Map<String, String>> toAdd =
                List.of(
                        Map.of(
                                "id",
                                roleNode.get("id").asText(),
                                "name",
                                PRIMARY_ROLE));
        HttpEntity<List<Map<String, String>>> add =
                new HttpEntity<>(toAdd, authJsonHeaders(token));
        restTemplate.postForEntity(userUrl(userId) + "/role-mappings/realm", add, Void.class);
    }

    private JsonNode getRealmRole(String token, String roleName) {
        HttpEntity<Void> req = new HttpEntity<>(authJsonHeaders(token));
        try {
            ResponseEntity<JsonNode> r =
                    restTemplate.exchange(rolesUrl() + "/" + roleName, HttpMethod.GET, req, JsonNode.class);
            return r.getBody();
        } catch (HttpClientErrorException.NotFound e) {
            return null;
        }
    }

    private Optional<String> findUserIdByUsername(String token, String username) {
        HttpEntity<Void> req = new HttpEntity<>(authJsonHeaders(token));
        String url = usersUrl() + "?username=" + urlEncode(username) + "&exact=true";
        ResponseEntity<JsonNode> res = restTemplate.exchange(url, HttpMethod.GET, req, JsonNode.class);
        JsonNode body = res.getBody();
        if (body == null || !body.isArray() || body.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(body.get(0).get("id").asText());
    }

    private String getAdminAccessToken() {
        String tokenUrl = serverUrl.replaceAll("/$", "") + "/realms/master/protocol/openid-connect/token";
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", "admin-cli");
        form.add("username", adminUsername);
        form.add("password", adminPassword);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<MultiValueMap<String, String>> req = new HttpEntity<>(form, headers);
        ResponseEntity<JsonNode> res = restTemplate.postForEntity(tokenUrl, req, JsonNode.class);
        JsonNode root = res.getBody();
        if (root == null || !root.has("access_token")) {
            throw new IllegalStateException("Keycloak: jeton admin introuvable.");
        }
        return root.get("access_token").asText();
    }

    private HttpHeaders authJsonHeaders(String token) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token);
        h.setContentType(MediaType.APPLICATION_JSON);
        return h;
    }

    private String usersUrl() {
        return serverUrl.replaceAll("/$", "") + "/admin/realms/" + schoolRealm + "/users";
    }

    private String userUrl(String userId) {
        return usersUrl() + "/" + userId;
    }

    private String rolesUrl() {
        return serverUrl.replaceAll("/$", "") + "/admin/realms/" + schoolRealm + "/roles";
    }

    private static String urlEncode(String s) {
        return java.net.URLEncoder.encode(s, java.nio.charset.StandardCharsets.UTF_8);
    }
}
