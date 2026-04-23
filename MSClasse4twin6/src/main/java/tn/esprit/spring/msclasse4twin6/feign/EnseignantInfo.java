package tn.esprit.spring.msclasse4twin6.feign;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Réponse minimale de {@code GET /enseignants/me} (MSEnseignant4twin6). */
@JsonIgnoreProperties(ignoreUnknown = true)
public class EnseignantInfo {

    private Long id;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
}
