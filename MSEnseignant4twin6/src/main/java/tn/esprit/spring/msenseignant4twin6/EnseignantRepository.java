package tn.esprit.spring.msenseignant4twin6;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EnseignantRepository extends JpaRepository<Enseignant, Long> {

    Optional<Enseignant> findByMatricule(String matricule);

    Optional<Enseignant> findByMatriculeIgnoreCase(String matricule);
}
