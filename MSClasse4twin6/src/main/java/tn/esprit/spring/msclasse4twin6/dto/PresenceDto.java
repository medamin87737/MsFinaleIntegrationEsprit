package tn.esprit.spring.msclasse4twin6.dto;

import tn.esprit.spring.msclasse4twin6.feign.EtudiantSummary;

import java.util.List;

/** Liste de présence (JSON prêt à impression côté client). */
public class PresenceDto {

    private Long classeId;
    private String classeNom;
    private List<EtudiantSummary> etudiants;

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

    public List<EtudiantSummary> getEtudiants() {
        return etudiants;
    }

    public void setEtudiants(List<EtudiantSummary> etudiants) {
        this.etudiants = etudiants;
    }
}
