package com.firetree.heritage.features.system.service;

import java.util.LinkedHashMap;
import java.util.Map;
import com.firetree.heritage.features.system.mapper.DatabaseHealthMapper;
import org.springframework.stereotype.Service;

@Service
public class DatabaseHealthService {

    private final DatabaseHealthMapper mapper;

    public DatabaseHealthService(DatabaseHealthMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> health() {
        return mapper.health();
    }
}
