package tn.esprit.spring.msclasse4twin6;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import tn.esprit.spring.msclasse4twin6.dto.ClasseAvecMatieresDto;
import tn.esprit.spring.msclasse4twin6.dto.ClasseSearchCriteria;
import tn.esprit.spring.msclasse4twin6.dto.ClasseStatsDto;
import tn.esprit.spring.msclasse4twin6.dto.EmploiDuTempsDto;
import tn.esprit.spring.msclasse4twin6.dto.PresenceDto;
import tn.esprit.spring.msclasse4twin6.feign.EtudiantSummary;

import java.util.List;
import java.util.Optional;

public interface IClasseService {
    List<Classe> getAll();

    Optional<Classe> getById(Long id);

    Classe create(Classe entity);

    Optional<Classe> update(Long id, Classe entity);

    void delete(Long id);

    Optional<ClasseAvecMatieresDto> getClasseAvecMatieres(Long classeId);

    /** Classe de l’étudiant connecté (via Feign /etudiants/me). */
    Optional<Classe> findMyClasseForCurrentEtudiant();

    List<ClasseAvecMatieresDto> findAllAvecEmploi();

    List<ClasseAvecMatieresDto> findByEnseignantId(Long enseignantId);

    Page<Classe> searchDynamic(ClasseSearchCriteria criteria, Pageable pageable);

    List<EmploiDuTempsDto> getEmploiDuTemps(Long classeId);

    List<EtudiantSummary> getEtudiants(Long classeId);

    ClasseStatsDto getStats(Long classeId);

    PresenceDto getPresenceSheet(Long classeId);

    boolean classeAppartientEnseignant(Long classeId, Long enseignantId);
}
