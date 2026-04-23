package tn.esprit.spring.mssalle4twin6;

import tn.esprit.spring.mssalle4twin6.dto.SalleAvecClasseDto;
import tn.esprit.spring.mssalle4twin6.dto.SalleAvecMatieresDto;

import java.util.List;
import java.util.Optional;

public interface ISalleService {
    /**
     * Salles liées aux matières de l'enseignant connecté. Chef : toutes les salles (même comportement que {@link #getAll()}).
     */
    List<Salle> findMesSallesPourUtilisateurConnecte();

    List<Salle> getAll();
    Optional<Salle> getById(Long id);
    Salle create(Salle entity);
    Optional<Salle> update(Long id, Salle entity);
    void delete(Long id);

    /** Salle + libellé classe (OpenFeign vers MSClasse4twin6). */
    Optional<SalleAvecClasseDto> getAvecLibelleClasse(Long salleId, Long classeId);

    /** Salle + matières dédiées (OpenFeign vers MSMatiere4twin6). */
    Optional<SalleAvecMatieresDto> getSalleAvecMatieres(Long salleId);
}
