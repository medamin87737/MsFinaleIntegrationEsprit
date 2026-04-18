package tn.esprit.spring.msclasse4twin6.dto;

/** Critères de recherche dynamique (niveau / filière / jour réservés pour extension future). */
public class ClasseSearchCriteria {

    private String nom;
    private String niveau;
    private String filiere;
    private String jour;
    private String matiere;
    private String enseignantUsername;
    private Long enseignantId;

    public ClasseSearchCriteria() {
    }

    public ClasseSearchCriteria(
            String nom,
            String niveau,
            String filiere,
            String jour,
            String matiere) {
        this.nom = nom;
        this.niveau = niveau;
        this.filiere = filiere;
        this.jour = jour;
        this.matiere = matiere;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getNiveau() {
        return niveau;
    }

    public void setNiveau(String niveau) {
        this.niveau = niveau;
    }

    public String getFiliere() {
        return filiere;
    }

    public void setFiliere(String filiere) {
        this.filiere = filiere;
    }

    public String getJour() {
        return jour;
    }

    public void setJour(String jour) {
        this.jour = jour;
    }

    public String getMatiere() {
        return matiere;
    }

    public void setMatiere(String matiere) {
        this.matiere = matiere;
    }

    public String getEnseignantUsername() {
        return enseignantUsername;
    }

    public void setEnseignantUsername(String enseignantUsername) {
        this.enseignantUsername = enseignantUsername;
    }

    public Long getEnseignantId() {
        return enseignantId;
    }

    public void setEnseignantId(Long enseignantId) {
        this.enseignantId = enseignantId;
    }
}
