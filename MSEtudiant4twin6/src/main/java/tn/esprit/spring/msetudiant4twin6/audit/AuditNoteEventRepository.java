package tn.esprit.spring.msetudiant4twin6.audit;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditNoteEventRepository extends JpaRepository<AuditNoteEvent, Long> {
}
