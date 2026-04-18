package tn.esprit.spring.msclasse4twin6.dto;

import tn.esprit.spring.msclasse4twin6.feign.MatiereClasseInfo;

import java.util.ArrayList;
import java.util.List;

/**
 * Réponse agrégée : classe locale + matières dédiées obtenues via Feign.
 */
public class ClasseAvecMatieresDto {

    private Long classeId;
    private String classeNom;
    private String classeDescription;
    private List<MatiereClasseInfo> matieres = new ArrayList<>();

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

    public List<MatiereClasseInfo> getMatieres() {
        return matieres;
    }

    public void setMatieres(List<MatiereClasseInfo> matieres) {
        this.matieres = matieres;
    }
}
