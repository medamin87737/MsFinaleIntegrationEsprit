package tn.esprit.spring.msclasse4twin6.pedagogie;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "inscription_pedagogique_suivi")
public class InscriptionPedagogiqueSuivi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long etudiantId;

    private Long matiereId;

    private String inscriptionId;

    private Instant receivedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEtudiantId() {
        return etudiantId;
    }

    public void setEtudiantId(Long etudiantId) {
        this.etudiantId = etudiantId;
    }

    public Long getMatiereId() {
        return matiereId;
    }

    public void setMatiereId(Long matiereId) {
        this.matiereId = matiereId;
    }

    public String getInscriptionId() {
        return inscriptionId;
    }

    public void setInscriptionId(String inscriptionId) {
        this.inscriptionId = inscriptionId;
    }

    public Instant getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(Instant receivedAt) {
        this.receivedAt = receivedAt;
    }
}
