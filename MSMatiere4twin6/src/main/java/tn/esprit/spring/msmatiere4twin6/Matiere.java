package tn.esprit.spring.msmatiere4twin6;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalTime;

@Entity
@Table(name = "matieres")
public class Matiere {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String description;
    private Long salleId;
    private Long classeId;

    /** Enseignant affecté à cette matière (identifiant métier = table enseignants). */
    private Long enseignantId;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime heureDebutSeance;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime heureFinSeance;

    public Matiere() {
    }

    public Matiere(String nom, String description) {
        this.nom = nom;
        this.description = description;
    }

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

    public Long getClasseId() {
        return classeId;
    }

    public void setClasseId(Long classeId) {
        this.classeId = classeId;
    }

    public Long getEnseignantId() {
        return enseignantId;
    }

    public void setEnseignantId(Long enseignantId) {
        this.enseignantId = enseignantId;
    }

    public LocalTime getHeureDebutSeance() {
        return heureDebutSeance;
    }

    public void setHeureDebutSeance(LocalTime heureDebutSeance) {
        this.heureDebutSeance = heureDebutSeance;
    }

    public LocalTime getHeureFinSeance() {
        return heureFinSeance;
    }

    public void setHeureFinSeance(LocalTime heureFinSeance) {
        this.heureFinSeance = heureFinSeance;
    }
}
