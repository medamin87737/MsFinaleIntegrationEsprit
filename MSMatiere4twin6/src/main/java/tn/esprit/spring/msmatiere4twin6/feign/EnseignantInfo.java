package tn.esprit.spring.msmatiere4twin6.feign;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Représente le JSON renvoyé par GET /enseignants/{id} (champs alignés sur l'entité Enseignant distante).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class EnseignantInfo {

    private Long id;
    private String nom;
    private String description;
    private String matricule;
    /** Valeurs possibles : ENSEIGNANT, CHEF_ENSEIGNANT (aligné sur MSEnseignant4twin6). */
    private String role;

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

    public String getMatricule() {
        return matricule;
    }

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
