FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN mvn -B package -DskipTests -q \
    && JAR=$(ls target/*.jar | grep -v original | head -n1) \
    && cp "$JAR" /workspace/target/app.jar

FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=build /workspace/target/app.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
