package tn.esprit.spring.common.chef;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Contrôle d’accès minimal (sans JWT) : le client envoie son rôle dans un header.
 * À remplacer par Keycloak plus tard.
 */
public final class ChefEnseignantHeaders {

    public static final String ROLE_HEADER = "X-Enseignant-Role";

    private ChefEnseignantHeaders() {}

    /** Accepte la valeur JSON de l’enum ou son nom Java. */
    public static boolean isChefEnseignant(HttpServletRequest request) {
        String raw = request.getHeader(ROLE_HEADER);
        if (raw == null || raw.isBlank()) {
            return false;
        }
        String v = raw.trim();
        return "CHEF_ENSEIGNANT".equalsIgnoreCase(v) || "Chef Enseignant".equals(v);
    }
}
