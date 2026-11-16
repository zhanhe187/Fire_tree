package com.firetree.heritage;

import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class PersistenceLayerMigrationTest {

    private static final Pattern INLINE_SQL = Pattern.compile(
        "\\b(select|insert\\s+into|update|delete\\s+from|alter\\s+table)\\b",
        Pattern.CASE_INSENSITIVE
    );

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void serviceLayerShouldNotDependOnJdbcTemplateAnymore() {
        Map<String, Object> serviceBeans = applicationContext.getBeansWithAnnotation(Service.class);

        for (Object bean : serviceBeans.values()) {
            boolean hasJdbcTemplateField = Arrays.stream(bean.getClass().getDeclaredFields())
                .map(Field::getType)
                .anyMatch(JdbcTemplate.class::isAssignableFrom);
            assertThat(hasJdbcTemplateField)
                .as("service %s still depends on JdbcTemplate", bean.getClass().getName())
                .isFalse();
        }
    }

    @Test
    void serviceLayerShouldNotDependOnGenericSqlExecutorAnymore() {
        Map<String, Object> serviceBeans = applicationContext.getBeansWithAnnotation(Service.class);

        for (Object bean : serviceBeans.values()) {
            boolean hasSqlExecutorField = Arrays.stream(bean.getClass().getDeclaredFields())
                .map(Field::getType)
                .anyMatch(MybatisSqlExecutor.class::isAssignableFrom);
            assertThat(hasSqlExecutorField)
                .as("service %s still depends on the generic SQL executor", bean.getClass().getName())
                .isFalse();
        }
    }

    @Test
    void serviceSourceShouldNotContainInlineBusinessSql() throws Exception {
        Path serviceRoot = Path.of("src/main/java/com/firetree/heritage/service");
        if (!Files.exists(serviceRoot)) {
            // The legacy service package has been fully migrated into feature services and mappers.
            return;
        }
        try (Stream<Path> files = Files.walk(serviceRoot)) {
            assertThat(files
                    .filter(path -> path.toString().endsWith(".java"))
                    .filter(path -> containsInlineSql(path) || containsSqlExecutorCall(path))
                    .map(serviceRoot::relativize)
                    .map(Path::toString)
                    .toList())
                .as("business SQL must live in mapper classes or XML, not service classes")
                .isEmpty();
        }
    }

    private boolean containsInlineSql(Path path) {
        try {
            return INLINE_SQL.matcher(Files.readString(path)).find();
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to read " + path, exception);
        }
    }

    private boolean containsSqlExecutorCall(Path path) {
        try {
            return Files.readString(path).contains("sqlExecutor.");
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to read " + path, exception);
        }
    }
}
