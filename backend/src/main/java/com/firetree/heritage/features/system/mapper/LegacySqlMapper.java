package com.firetree.heritage.features.system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.SelectProvider;
import org.apache.ibatis.annotations.UpdateProvider;

import java.util.List;
import java.util.Map;

@Mapper
public interface LegacySqlMapper {

    @SelectProvider(type = LegacySqlProvider.class, method = "select")
    List<Map<String, Object>> selectList(@Param("sql") String sql, @Param("params") List<Object> params);

    @SelectProvider(type = LegacySqlProvider.class, method = "select")
    Map<String, Object> selectMap(@Param("sql") String sql, @Param("params") List<Object> params);

    @UpdateProvider(type = LegacySqlProvider.class, method = "update")
    int update(@Param("sql") String sql, @Param("params") List<Object> params);

    @Options(useGeneratedKeys = true, keyProperty = "generatedKey")
    @UpdateProvider(type = LegacySqlProvider.class, method = "update")
    int insert(Map<String, Object> params);
}
