package tn.esprit.spring.msenseignant4twin6;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "enseignants")
public class Enseignant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String description;

    @Column(unique = true)
    private String matricule;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @Enumerated(EnumType.STRING)
    private RoleEnseignant role = RoleEnseignant.ENSEIGNANT;

    public Enseignant() {
    }

    public Enseignant(String nom, String description) {
        this.nom = nom;
        this.description = description;
    }

    public Enseignant(String nom, String description, RoleEnseignant role) {
        this.nom = nom;
        this.description = description;
        this.role = role != null ? role : RoleEnseignant.ENSEIGNANT;
    }

    @PrePersist
    @PreUpdate
    public void applyDefaultRole() {
        if (role == null) {
            role = RoleEnseignant.ENSEIGNANT;
        }
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

    public RoleEnseignant getRole() {
        return role != null ? role : RoleEnseignant.ENSEIGNANT;
    }

    public void setRole(RoleEnseignant role) {
        this.role = role;
    }

    public String getMatricule() {
        return matricule;
    }

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
