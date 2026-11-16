package com.firetree.heritage.features.system.mapper;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class MybatisSqlExecutor {

    private final LegacySqlMapper legacySqlMapper;

    public MybatisSqlExecutor(LegacySqlMapper legacySqlMapper) {
        this.legacySqlMapper = legacySqlMapper;
    }

    public List<Map<String, Object>> queryForList(String sql, Object... args) {
        return legacySqlMapper.selectList(sql, toParams(args));
    }

    public <T> List<T> queryForList(String sql, Class<T> elementType, Object... args) {
        List<Map<String, Object>> rows = queryForList(sql, args);
        List<T> result = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) {
            result.add(convertRow(row, elementType));
        }
        return result;
    }

    public Map<String, Object> queryForMap(String sql, Object... args) {
        Map<String, Object> row = legacySqlMapper.selectMap(sql, toParams(args));
        if (row == null || row.isEmpty()) {
            throw new EmptyResultDataAccessException(1);
        }
        return row;
    }

    public <T> T queryForObject(String sql, Class<T> requiredType, Object... args) {
        List<T> values = queryForList(sql, requiredType, args);
        if (values.isEmpty()) {
            throw new EmptyResultDataAccessException(1);
        }
        return values.get(0);
    }

    public int update(String sql, Object... args) {
        return legacySqlMapper.update(sql, toParams(args));
    }

    public void execute(String sql) {
        update(sql);
    }

    public long insertAndReturnKey(String sql, Object... args) {
        Map<String, Object> parameter = new java.util.HashMap<>();
        parameter.put("sql", sql);
        parameter.put("params", toParams(args));
        legacySqlMapper.insert(parameter);
        Object key = parameter.get("generatedKey");
        if (key == null) {
            throw new IllegalStateException("Unable to fetch generated key for SQL: " + sql);
        }
        if (key instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(key));
    }

    private List<Object> toParams(Object... args) {
        if (args == null || args.length == 0) {
            return List.of();
        }
        List<Object> params = new ArrayList<>(args.length);
        for (Object arg : args) {
            params.add(arg);
        }
        return params;
    }

    @SuppressWarnings("unchecked")
    private <T> T convertRow(Map<String, Object> row, Class<T> requiredType) {
        if (row == null) {
            return null;
        }
        if (requiredType.isAssignableFrom(Map.class)) {
            return (T) row;
        }
        Object value = row.values().stream().findFirst().orElse(null);
        if (value instanceof Map<?, ?> nested && !nested.isEmpty()) {
            value = nested.values().stream().findFirst().orElse(null);
        }
        if (value == null) {
            return null;
        }
        if (requiredType.isInstance(value)) {
            return requiredType.cast(value);
        }
        if (value instanceof Number number && Number.class.isAssignableFrom(requiredType)) {
            return (T) convertNumber(number, requiredType);
        }
        if (requiredType == String.class) {
            return (T) String.valueOf(value);
        }
        if (requiredType == Boolean.class && value instanceof Number number) {
            return (T) Boolean.valueOf(number.intValue() != 0);
        }
        return requiredType.cast(value);
    }

    @SuppressWarnings("unchecked")
    private <T> T convertNumber(Number number, Class<T> requiredType) {
        if (requiredType == Integer.class) {
            return (T) Integer.valueOf(number.intValue());
        }
        if (requiredType == Long.class) {
            return (T) Long.valueOf(number.longValue());
        }
        if (requiredType == Short.class) {
            return (T) Short.valueOf(number.shortValue());
        }
        if (requiredType == Byte.class) {
            return (T) Byte.valueOf(number.byteValue());
        }
        if (requiredType == Double.class) {
            return (T) Double.valueOf(number.doubleValue());
        }
        if (requiredType == Float.class) {
            return (T) Float.valueOf(number.floatValue());
        }
        return (T) number;
    }
}
