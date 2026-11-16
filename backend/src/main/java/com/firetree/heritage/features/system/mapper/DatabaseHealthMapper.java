package com.firetree.heritage.features.system.mapper;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class DatabaseHealthMapper {

    private final MybatisSqlExecutor sqlExecutor;

    public DatabaseHealthMapper(MybatisSqlExecutor sqlExecutor) {
        this.sqlExecutor = sqlExecutor;
    }

    public Map<String, Object> health() {
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "UP");
        health.put("database", sqlExecutor.queryForObject("select database()", String.class));
        health.put("mysqlVersion", sqlExecutor.queryForObject("select version()", String.class));
        return health;
    }
}


