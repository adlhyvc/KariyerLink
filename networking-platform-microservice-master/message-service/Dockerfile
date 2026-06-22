FROM eclipse-temurin:17-jdk-jammy AS build

COPY pom.xml mvnw ./
COPY .mvn .mvn

RUN chmod +x mvnw

RUN ./mvnw dependency:resolve

COPY src src
RUN ./mvnw package

FROM eclipse-temurin:17-jdk-jammy
WORKDIR demo
COPY --from=build target/*.jar demo.jar
ENTRYPOINT ["java", "-jar", "demo.jar"]
