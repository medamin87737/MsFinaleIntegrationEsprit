package tn.esprit.spring.msmatiere4twin6;

import tn.esprit.spring.msmatiere4twin6.dto.MatiereAvecEnseignantDto;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface IMatiereService {
    List<Matiere> getAll();
    Optional<Matiere> getById(Long id);
    Matiere create(Matiere entity);
    Optional<Matiere> update(Long id, Matiere entity);
    void delete(Long id);

    /** Matière + détail enseignant (OpenFeign vers MSEnseignant4twin6). */
    Optional<MatiereAvecEnseignantDto> getDetailAvecEnseignant(Long matiereId, Long enseignantId);

    /** Liste des matières assignées à une salle. */
    List<Matiere> getBySalleId(Long salleId);

    /** Liste des matières dédiées à une classe. */
    List<Matiere> getByClasseId(Long classeId);

    /** Matières assignées à un enseignant. */
    List<Matiere> getByEnseignantId(Long enseignantId);

    /** Matières de la classe de l'étudiant connecté (JWT). */
    List<Matiere> findMatieresPourEtudiantConnecte();

    /** Matières visibles par l'enseignant connecté, ou toutes pour le chef. */
    List<Matiere> findMatieresPourEnseignantOuChef();

    /** Détail d'une matière si le rôle a le droit de la consulter. */
    Optional<Matiere> getByIdSecured(Long id);

    /** Matières d'une classe selon le rôle (étudiant = sa classe ; enseignant = s'il enseigne dans cette classe). */
    List<Matiere> getByClasseIdSecured(Long classeId);

    /** Matières d'une salle filtrées pour enseignant / étudiant. */
    List<Matiere> getBySalleIdSecured(Long salleId);

    /** Affecter enseignant + classe + salle + créneau horaire à une matière. */
    Optional<Matiere> assignerSalle(Long matiereId, Long enseignantId, Long salleId, Long classeId, LocalTime heureDebutSeance, LocalTime heureFinSeance);
}
