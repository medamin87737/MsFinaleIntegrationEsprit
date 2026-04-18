package tn.esprit.spring.mssalle4twin6.dto;

/**
 * Réponse agrégée : salle locale + libellé classe obtenu via Feign.
 */
public class SalleAvecClasseDto {

    private Long salleId;
    private String salleNom;
    private String salleDescription;
    private Long classeId;
    private String classeNom;
    private String classeDescription;

    public Long getSalleId() {
        return salleId;
    }

    public void setSalleId(Long salleId) {
        this.salleId = salleId;
    }

    public String getSalleNom() {
        return salleNom;
    }

    public void setSalleNom(String salleNom) {
        this.salleNom = salleNom;
    }

    public String getSalleDescription() {
        return salleDescription;
    }

    public void setSalleDescription(String salleDescription) {
        this.salleDescription = salleDescription;
    }

    public Long getClasseId() {
        return classeId;
    }

    public void setClasseId(Long classeId) {
        this.classeId = classeId;
    }

    public String getClasseNom() {
        return classeNom;
    }

    public void setClasseNom(String classeNom) {
        this.classeNom = classeNom;
    }

    public String getClasseDescription() {
        return classeDescription;
    }

    public void setClasseDescription(String classeDescription) {
        this.classeDescription = classeDescription;
    }
}
