package com.firetree.heritage.features.system.mapper;

import java.util.List;
import java.util.Map;

public class LegacySqlProvider {

    public String select(Map<String, Object> params) {
        return rewrite((String) params.get("sql"), (List<Object>) params.get("params"));
    }

    public String update(Map<String, Object> params) {
        return rewrite((String) params.get("sql"), (List<Object>) params.get("params"));
    }

    private String rewrite(String sql, List<Object> params) {
        if (sql == null) {
            throw new IllegalArgumentException("sql is required");
        }
        List<Object> arguments = params == null ? List.of() : params;
        StringBuilder builder = new StringBuilder(sql.length() + arguments.size() * 8);
        boolean inSingleQuote = false;
        int index = 0;
        for (int i = 0; i < sql.length(); i++) {
            char ch = sql.charAt(i);
            if (ch == '\'') {
                builder.append(ch);
                if (inSingleQuote && i + 1 < sql.length() && sql.charAt(i + 1) == '\'') {
                    builder.append(sql.charAt(++i));
                } else {
                    inSingleQuote = !inSingleQuote;
                }
                continue;
            }
            if (ch == '?' && !inSingleQuote) {
                if (index >= arguments.size()) {
                    throw new IllegalArgumentException("Not enough SQL parameters for: " + sql);
                }
                builder.append("#{params[").append(index++).append("]}");
                continue;
            }
            builder.append(ch);
        }
        return builder.toString();
    }
}
