package tn.esprit.spring.mssalle4twin6;

import tn.esprit.spring.mssalle4twin6.dto.SalleAvecClasseDto;
import tn.esprit.spring.mssalle4twin6.dto.SalleAvecMatieresDto;

import java.util.List;
import java.util.Optional;

public interface ISalleService {
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
