package tn.esprit.spring.msetudiant4twin6.dto;

/** Réponse login — sans mot de passe (pour le front / futur Keycloak). */
public class EtudiantSessionDto {

    private Long id;
    private String nom;
    private String description;
    private String matricule;
    /** Classe, matières et notes (agrégation via la gateway). */
    private EtudiantPortailDto portail;

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

    public EtudiantPortailDto getPortail() {
        return portail;
    }

    public void setPortail(EtudiantPortailDto portail) {
        this.portail = portail;
    }
}
