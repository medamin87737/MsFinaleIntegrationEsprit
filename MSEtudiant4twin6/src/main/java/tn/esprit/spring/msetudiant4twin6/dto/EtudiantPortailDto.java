package tn.esprit.spring.msetudiant4twin6.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;

/**
 * Données agrégées pour l’espace étudiant (classe, matières, parcours notes / inscriptions).
 */
public class EtudiantPortailDto {

    private ClassePortailDto classe;
    private List<MatierePortailDto> matieres = new ArrayList<>();
    /** Réponse brute MSNotes {@code GET /notes/etudiants/{id}} (tableau JSON). */
    private JsonNode notesInscriptions;

    public ClassePortailDto getClasse() {
        return classe;
    }

    public void setClasse(ClassePortailDto classe) {
        this.classe = classe;
    }

    public List<MatierePortailDto> getMatieres() {
        return matieres;
    }

    public void setMatieres(List<MatierePortailDto> matieres) {
        this.matieres = matieres != null ? matieres : new ArrayList<>();
    }

    public JsonNode getNotesInscriptions() {
        return notesInscriptions;
    }

    public void setNotesInscriptions(JsonNode notesInscriptions) {
        this.notesInscriptions = notesInscriptions;
    }
}
