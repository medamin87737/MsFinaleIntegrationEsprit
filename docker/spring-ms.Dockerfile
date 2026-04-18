# Build un microservice Spring du réacteur (MS/) — contexte = répertoire MS/
# Le pom racine liste tous les modules : Maven exige que chaque dossier existe,
# même si seul ${MS_MODULE} est compilé (-pl … -am).
FROM maven:3.9.8-eclipse-temurin-17 AS build
ARG MS_MODULE
WORKDIR /build
COPY pom.xml .
COPY ms-common-chef-web ms-common-chef-web
COPY MSEnseignant4twin6 MSEnseignant4twin6
COPY MSEtudiant4twin6 MSEtudiant4twin6
COPY MSClasse4twin6 MSClasse4twin6
COPY MSMatiere4twin6 MSMatiere4twin6
COPY MSSalle4twin6 MSSalle4twin6
RUN mvn -q -B -pl "${MS_MODULE}" -am -DskipTests package

FROM eclipse-temurin:17-jre-alpine
ARG MS_MODULE
WORKDIR /app
COPY --from=build /build/${MS_MODULE}/target/*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
