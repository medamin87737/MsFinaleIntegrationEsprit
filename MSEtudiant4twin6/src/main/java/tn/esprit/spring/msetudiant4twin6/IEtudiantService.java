package tn.esprit.spring.msetudiant4twin6;

import java.util.List;
import java.util.Optional;

public interface IEtudiantService {
    List<Etudiant> getAll();

    Optional<Etudiant> getById(Long id);

    Etudiant create(Etudiant entity);

    Optional<Etudiant> update(Long id, Etudiant entity);

    void delete(Long id);

    Optional<Etudiant> findByKeycloakId(String keycloakId);

    Optional<Etudiant> findByMatricule(String matricule);

    List<Etudiant> findByClasseId(Long classeId);

    /** Vérifie que l’enseignant (id métier) a au moins une matière sur la classe (via la gateway). */
    boolean classeAppartientEnseignant(Long classeId, Long enseignantId);
}
