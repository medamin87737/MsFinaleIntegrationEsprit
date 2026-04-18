# Build un microservice Spring du réacteur (MS/) — contexte = répertoire MS/
FROM maven:3.9.8-eclipse-temurin-17 AS build
ARG MS_MODULE
WORKDIR /build
COPY pom.xml .
COPY ms-common-chef-web ms-common-chef-web
COPY ${MS_MODULE} ${MS_MODULE}
RUN mvn -q -pl ${MS_MODULE} -am -DskipTests package

FROM eclipse-temurin:17-jre-alpine
ARG MS_MODULE
WORKDIR /app
COPY --from=build /build/${MS_MODULE}/target/*.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
