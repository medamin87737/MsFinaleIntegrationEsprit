package tn.esprit.spring.msenseignant4twin6.dto;

import tn.esprit.spring.msenseignant4twin6.Enseignant;

/**
 * DTO de réponse pour les lectures (GET) afin d'exposer explicitement le champ role.
 */
public class EnseignantResponseDto {

    private Long id;
    private String nom;
    private String description;
    private String matricule;
    private String role;

    public static EnseignantResponseDto fromEntity(Enseignant e) {
        EnseignantResponseDto dto = new EnseignantResponseDto();
        dto.setId(e.getId());
        dto.setNom(e.getNom());
        dto.setDescription(e.getDescription());
        dto.setMatricule(e.getMatricule());
        dto.setRole(e.getRole() != null ? e.getRole().getJsonLabel() : "Enseignant");
        return dto;
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getMatricule() {
        return matricule;
    }

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }
}
