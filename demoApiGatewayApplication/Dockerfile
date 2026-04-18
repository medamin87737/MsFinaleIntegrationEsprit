FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
COPY .mvn .mvn
COPY mvnw mvnw.cmd ./
RUN chmod +x mvnw && ./mvnw -q -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /build/target/ /tmp/target/
RUN JAR="$(find /tmp/target -maxdepth 1 -type f -name '*.jar' ! -name '*-plain.jar' | head -n1)" && \
    test -n "$JAR" && mv "$JAR" /app/app.jar && rm -rf /tmp/target
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
