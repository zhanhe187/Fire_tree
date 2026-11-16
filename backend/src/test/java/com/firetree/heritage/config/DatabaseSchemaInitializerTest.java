package com.firetree.heritage.config;

import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DatabaseSchemaInitializerTest {

    @Test
    void startupInitializerCreatesContentPersistenceTablesBeforeDynamicColumns() throws Exception {
        MybatisSqlExecutor sqlExecutor = mock(MybatisSqlExecutor.class);
        when(sqlExecutor.queryForObject(anyString(), eq(Integer.class), any(), any())).thenReturn(1);

        new DatabaseSchemaInitializer()
            .ensureDynamicSchemaColumns(sqlExecutor)
            .run(null);

        InOrder inOrder = inOrder(sqlExecutor);
        inOrder.verify(sqlExecutor).execute(sqlContains("create table if not exists media_files"));
        inOrder.verify(sqlExecutor).execute(sqlContains("create table if not exists graph_node_media"));
        inOrder.verify(sqlExecutor).execute(sqlContains("create table if not exists creative_products"));
        inOrder.verify(sqlExecutor).execute(sqlContains("create table if not exists product_reviews"));
        inOrder.verify(sqlExecutor).execute(sqlContains("create table if not exists article_products"));
        inOrder.verify(sqlExecutor).execute(sqlContains("create table if not exists exhibition_products"));
    }

    private String sqlContains(String expected) {
        return org.mockito.ArgumentMatchers.argThat(sql ->
            sql != null && sql.toLowerCase().contains(expected)
        );
    }
}
