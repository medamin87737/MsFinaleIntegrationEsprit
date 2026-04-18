package tn.esprit.spring.msmatiere4twin6.feign;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Représente le JSON renvoyé par GET /salles/{id} (aligné sur l'entité Salle distante).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class SalleInfo {

    private Long id;
    private String nom;
    private String description;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
