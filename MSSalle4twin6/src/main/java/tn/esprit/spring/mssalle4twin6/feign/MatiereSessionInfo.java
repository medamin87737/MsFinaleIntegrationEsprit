package tn.esprit.spring.mssalle4twin6.feign;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Représente le JSON d'une matière assignée à une salle (incluant le créneau de séance).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class MatiereSessionInfo {

    private Long id;
    private String nom;
    private String description;
    private Long salleId;
    private String heureDebutSeance;
    private String heureFinSeance;

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

    public Long getSalleId() {
        return salleId;
    }

    public void setSalleId(Long salleId) {
        this.salleId = salleId;
    }

    public String getHeureDebutSeance() {
        return heureDebutSeance;
    }

    public void setHeureDebutSeance(String heureDebutSeance) {
        this.heureDebutSeance = heureDebutSeance;
    }

    public String getHeureFinSeance() {
        return heureFinSeance;
    }

    public void setHeureFinSeance(String heureFinSeance) {
        this.heureFinSeance = heureFinSeance;
    }
}
