package tn.esprit.spring.mssalle4twin6.dto;

import tn.esprit.spring.mssalle4twin6.feign.MatiereSessionInfo;

import java.util.ArrayList;
import java.util.List;

/**
 * Réponse agrégée : salle locale + matières dédiées obtenues via Feign.
 */
public class SalleAvecMatieresDto {

    private Long salleId;
    private String salleNom;
    private String salleDescription;
    private List<MatiereSessionInfo> matieres = new ArrayList<>();

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

    public List<MatiereSessionInfo> getMatieres() {
        return matieres;
    }

    public void setMatieres(List<MatiereSessionInfo> matieres) {
        this.matieres = matieres;
    }
}
