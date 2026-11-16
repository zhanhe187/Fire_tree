package com.firetree.heritage.features.auth.mapper;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class UserLookupMapper {

    private final MybatisSqlExecutor sqlExecutor;

    public UserLookupMapper(MybatisSqlExecutor sqlExecutor) {
        this.sqlExecutor = sqlExecutor;
    }

    public long resolveUserId(Long userId, String username, String fieldName) {
        if (username != null && !username.isBlank()) {
            try {
                return sqlExecutor.queryForObject("""
                    select id
                    from sys_users
                    where username = ?
                      and deleted = 0
                      and status = 1
                    """, Long.class, username.trim());
            } catch (EmptyResultDataAccessException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is invalid");
            }
        }
        if (userId != null) {
            ensureUserExists(userId, fieldName + " is invalid");
            return userId;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required");
    }

    public long defaultActiveUserId() {
        try {
            return sqlExecutor.queryForObject("""
                select id
                from sys_users
                where deleted = 0
                  and status = 1
                order by case when user_type = 'SUPER_ADMIN' then 0 else 1 end, id
                limit 1
                """, Long.class);
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "active user is required");
        }
    }

    public void ensureUserExists(long userId, String message) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from sys_users where id = ? and deleted = 0 and status = 1",
            Integer.class,
            userId
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }
}
