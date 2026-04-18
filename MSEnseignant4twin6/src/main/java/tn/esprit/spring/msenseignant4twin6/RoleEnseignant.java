package tn.esprit.spring.msenseignant4twin6;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Rôle métier d'un enseignant.
 * <p>JSON : {@code "Enseignant"} et {@code "Chef Enseignant"} (via {@link JsonValue}). Base JPA : noms enum
 * {@code ENSEIGNANT}, {@code CHEF_ENSEIGNANT}.
 */
public enum RoleEnseignant {
    ENSEIGNANT("Enseignant"),
    CHEF_ENSEIGNANT("Chef Enseignant");

    private final String jsonLabel;

    RoleEnseignant(String jsonLabel) {
        this.jsonLabel = jsonLabel;
    }

    /** Valeur exposée dans les réponses JSON (et acceptée dans les requêtes). */
    @JsonValue
    public String getJsonLabel() {
        return jsonLabel;
    }

    @JsonCreator
    public static RoleEnseignant fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String v = value.trim();
        for (RoleEnseignant r : values()) {
            if (r.jsonLabel.equals(v) || r.name().equalsIgnoreCase(v)) {
                return r;
            }
        }
        throw new IllegalArgumentException("Unknown role: " + value);
    }
}
