package tn.esprit.spring.msmatiere4twin6.dto;

/**
 * Réponse agrégée : matière locale + détail enseignant obtenu via Feign.
 */
public class MatiereAvecEnseignantDto {

    private Long matiereId;
    private String matiereNom;
    private String matiereDescription;
    private Long enseignantId;
    private String enseignantNom;
    private String enseignantDescription;
    private String enseignantMatricule;
    private String enseignantRole;

    public Long getMatiereId() {
        return matiereId;
    }

    public void setMatiereId(Long matiereId) {
        this.matiereId = matiereId;
    }

    public String getMatiereNom() {
        return matiereNom;
    }

    public void setMatiereNom(String matiereNom) {
        this.matiereNom = matiereNom;
    }

    public String getMatiereDescription() {
        return matiereDescription;
    }

    public void setMatiereDescription(String matiereDescription) {
        this.matiereDescription = matiereDescription;
    }

    public Long getEnseignantId() {
        return enseignantId;
    }

    public void setEnseignantId(Long enseignantId) {
        this.enseignantId = enseignantId;
    }

    public String getEnseignantNom() {
        return enseignantNom;
    }

    public void setEnseignantNom(String enseignantNom) {
        this.enseignantNom = enseignantNom;
    }

    public String getEnseignantDescription() {
        return enseignantDescription;
    }

    public void setEnseignantDescription(String enseignantDescription) {
        this.enseignantDescription = enseignantDescription;
    }

    public String getEnseignantMatricule() {
        return enseignantMatricule;
    }

    public void setEnseignantMatricule(String enseignantMatricule) {
        this.enseignantMatricule = enseignantMatricule;
    }

    public String getEnseignantRole() {
        return enseignantRole;
    }

    public void setEnseignantRole(String enseignantRole) {
        this.enseignantRole = enseignantRole;
    }
}
