package tn.esprit.spring.msclasse4twin6.dto;

/** Statistiques synthétiques d’une classe. */
public class ClasseStatsDto {

    private long nbEtudiants;
    private long nbMatieres;
    private double nbHeuresParSemaine;
    private Double moyenneGenerale;

    public long getNbEtudiants() {
        return nbEtudiants;
    }

    public void setNbEtudiants(long nbEtudiants) {
        this.nbEtudiants = nbEtudiants;
    }

    public long getNbMatieres() {
        return nbMatieres;
    }

    public void setNbMatieres(long nbMatieres) {
        this.nbMatieres = nbMatieres;
    }

    public double getNbHeuresParSemaine() {
        return nbHeuresParSemaine;
    }

    public void setNbHeuresParSemaine(double nbHeuresParSemaine) {
        this.nbHeuresParSemaine = nbHeuresParSemaine;
    }

    public Double getMoyenneGenerale() {
        return moyenneGenerale;
    }

    public void setMoyenneGenerale(Double moyenneGenerale) {
        this.moyenneGenerale = moyenneGenerale;
    }
}
