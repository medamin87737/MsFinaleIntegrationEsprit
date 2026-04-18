package tn.esprit.spring.msmatiere4twin6;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatiereRepository extends JpaRepository<Matiere, Long> {
    List<Matiere> findBySalleId(Long salleId);

    List<Matiere> findByClasseId(Long classeId);

    List<Matiere> findByEnseignantId(Long enseignantId);
}
