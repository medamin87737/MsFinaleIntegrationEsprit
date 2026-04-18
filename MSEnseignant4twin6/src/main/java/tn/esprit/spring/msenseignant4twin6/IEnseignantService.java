package tn.esprit.spring.msenseignant4twin6;

import java.util.List;
import java.util.Optional;

public interface IEnseignantService {
    List<Enseignant> getAll();

    /** Enseignants qui enseignent dans la classe de l'étudiant connecté (via matières). */
    List<Enseignant> findProfesseursPourEtudiantConnecte();

    Optional<Enseignant> getById(Long id);

    Optional<Enseignant> findByMatriculeIgnoreCase(String matricule);
    Enseignant create(Enseignant entity);
    Optional<Enseignant> update(Long id, Enseignant entity);
    void delete(Long id);
}
