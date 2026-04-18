package tn.esprit.spring.msclasse4twin6.dto;

/**
 * Entrée d’emploi du temps (les jours ne sont pas modélisés en base : valeur indicative ou « — »).
 */
public class EmploiDuTempsDto {

    private String jour;
    private String heureDebut;
    private String heureFin;
    private String matiereNom;
    private Long salleId;
    private String enseignantLabel;

    public String getJour() {
        return jour;
    }

    public void setJour(String jour) {
        this.jour = jour;
    }

    public String getHeureDebut() {
        return heureDebut;
    }

    public void setHeureDebut(String heureDebut) {
        this.heureDebut = heureDebut;
    }

    public String getHeureFin() {
        return heureFin;
    }

    public void setHeureFin(String heureFin) {
        this.heureFin = heureFin;
    }

    public String getMatiereNom() {
        return matiereNom;
    }

    public void setMatiereNom(String matiereNom) {
        this.matiereNom = matiereNom;
    }

    public Long getSalleId() {
        return salleId;
    }

    public void setSalleId(Long salleId) {
        this.salleId = salleId;
    }

    public String getEnseignantLabel() {
        return enseignantLabel;
    }

    public void setEnseignantLabel(String enseignantLabel) {
        this.enseignantLabel = enseignantLabel;
    }
}
