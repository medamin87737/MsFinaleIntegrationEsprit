// Exécuté uniquement au premier démarrage du volume MongoDB vide.
// Inscription + note de démo : étudiantId=1, matièreId=1 (alignés sur les seeds SQL / Keycloak etudiant.test).
db = db.getSiblingDB('ms_notes');
if (!db.inscriptions.findOne({ etudiantId: 1, matiereId: 1 })) {
  const ins = db.inscriptions.insertOne({
    etudiantId: 1,
    matiereId: 1,
    classeId: 1,
    enseignantUsername: 'enseignant.test',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  db.notes.insertOne({
    inscriptionId: ins.insertedId,
    valeur: 14.5,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
