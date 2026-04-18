package tn.esprit.spring.msetudiant4twin6;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EtudiantRepository extends JpaRepository<Etudiant, Long> {

    Optional<Etudiant> findByMatricule(String matricule);

    Optional<Etudiant> findByKeycloakId(String keycloakId);

    List<Etudiant> findByClasseId(Long classeId);
}
