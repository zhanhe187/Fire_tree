package com.firetree.heritage.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Configuration
public class DatabaseSchemaInitializer {

    @Bean
    ApplicationRunner ensureDynamicSchemaColumns(MybatisSqlExecutor sqlExecutor) {
        return args -> {
            ensureContentPersistenceTables(sqlExecutor);
            ensureExhibitionGraphTypes(sqlExecutor);

            if (!columnExists(sqlExecutor, "community_questions", "image_url")) {
                sqlExecutor.execute("""
                    alter table community_questions
                    add column image_url LONGTEXT default null comment '帖子图片URL'
                    after content
                    """);
            }

            if (!columnExists(sqlExecutor, "exhibitions", "cover_file_id")) {
                sqlExecutor.execute("""
                    alter table exhibitions
                    add column cover_file_id BIGINT UNSIGNED default null comment '封面文件'
                    after description
                    """);
                sqlExecutor.execute("alter table exhibitions add key idx_exhibitions_cover (cover_file_id)");
                sqlExecutor.execute("""
                    alter table exhibitions
                    add constraint fk_exhibitions_cover
                    foreign key (cover_file_id) references media_files(id) on delete set null
                    """);
            }

            if (!columnExists(sqlExecutor, "risk_reports", "resolver_note")) {
                sqlExecutor.execute("""
                    alter table risk_reports
                    add column resolver_note VARCHAR(1000) default null comment '澶勭悊璇存槑'
                    after resolver_id
                    """);
            }

            if (!tableExists(sqlExecutor, "article_nodes")) {
                sqlExecutor.execute("""
                    create table if not exists article_nodes (
                      id bigint unsigned not null auto_increment comment 'article node link id',
                      article_id bigint unsigned not null comment 'article id',
                      node_id bigint unsigned not null comment 'graph node id',
                      created_at datetime not null default current_timestamp comment 'created time',
                      primary key (id),
                      unique key uk_article_nodes_article_node (article_id, node_id),
                      key idx_article_nodes_node (node_id),
                      constraint fk_article_nodes_article foreign key (article_id) references news_articles (id) on delete cascade,
                      constraint fk_article_nodes_node foreign key (node_id) references graph_nodes (id) on delete cascade
                    ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci comment='article node links'
                    """);
            }

            if (!columnExists(sqlExecutor, "creative_products", "stock")) {
                sqlExecutor.execute("""
                    alter table creative_products
                    add column stock int unsigned not null default 0 comment '库存数量'
                    after price
                    """);
            }
        };
    }

    private void ensureExhibitionGraphTypes(MybatisSqlExecutor sqlExecutor) {
        // Canonical node types referenced across the app and tests.
        ensureGraphType(sqlExecutor, "graph_node_types", "heritage_project", "\u975e\u9057\u9879\u76ee");
        ensureGraphType(sqlExecutor, "graph_node_types", "inheritor", "\u4f20\u627f\u4eba");
        ensureGraphType(sqlExecutor, "graph_node_types", "region", "\u533a\u57df");
        ensureGraphType(sqlExecutor, "graph_node_types", "unesco_element", "\u8054\u5408\u56fd\u6559\u79d1\u6587\u7ec4\u7ec7\u540d\u5f55\u9879\u76ee");
        ensureGraphType(sqlExecutor, "graph_node_types", "craft_technique", "\u624b\u5de5\u6280\u827a");
        ensureGraphType(sqlExecutor, "graph_node_types", "craft_tool", "\u624b\u5de5\u5de5\u5177");
        ensureGraphType(sqlExecutor, "graph_node_types", "exhibition_market", "\u5c55\u89c8\u5e02\u96c6");
        // Canonical edge types referenced across the app and tests.
        ensureGraphType(sqlExecutor, "graph_edge_types", "originated_in", "\u53d1\u6e90\u4e8e");
        ensureGraphType(sqlExecutor, "graph_edge_types", "has_inheritor", "\u62e5\u6709\u4f20\u627f\u4eba");
        ensureGraphType(sqlExecutor, "graph_edge_types", "listed_by", "\u5217\u5165\u540d\u5f55");
        ensureGraphType(sqlExecutor, "graph_edge_types", "uses_technique", "\u4f7f\u7528\u6280\u827a");
        ensureGraphType(sqlExecutor, "graph_edge_types", "masters_technique", "\u7cbe\u901a\u6280\u827a");
        ensureGraphType(sqlExecutor, "graph_edge_types", "uses_tool", "\u4f7f\u7528\u5de5\u5177");
        ensureGraphType(sqlExecutor, "graph_edge_types", "inherited_from", "\u5e08\u627f");
        ensureGraphType(sqlExecutor, "graph_edge_types", "displayed_at", "\u5c55\u51fa\u4e8e");
    }

    private void ensureGraphType(MybatisSqlExecutor sqlExecutor, String tableName, String typeCode, String typeName) {
        sqlExecutor.update(
            "insert into " + tableName + " (type_code, type_name, status, deleted) values (?, ?, 1, 0) "
                + "on duplicate key update status = 1, deleted = 0",
            typeCode,
            typeName
        );
    }

    private boolean tableExists(MybatisSqlExecutor sqlExecutor, String tableName) {
        Integer count = sqlExecutor.queryForObject("""
            select count(*)
            from information_schema.tables
            where table_schema = database()
              and table_name = ?
            """, Integer.class, tableName);
        return count != null && count > 0;
    }

    private void ensureContentPersistenceTables(MybatisSqlExecutor sqlExecutor) {
        sqlExecutor.execute("""
            create table if not exists media_files (
              id bigint unsigned not null auto_increment comment 'media file id',
              bucket_name varchar(64) not null comment 'object bucket',
              object_key varchar(512) not null comment 'object key',
              original_name varchar(255) not null comment 'original file name',
              file_type varchar(32) not null comment 'IMAGE/VIDEO/AUDIO/DOCUMENT/OTHER',
              content_type varchar(128) default null comment 'mime type',
              file_size bigint unsigned not null default 0 comment 'file size',
              checksum varchar(128) default null comment 'checksum',
              preview_url varchar(512) default null comment 'preview url',
              uploader_id bigint unsigned default null comment 'uploader user id',
              visibility varchar(16) not null default 'PUBLIC' comment 'PUBLIC/PRIVATE',
              audit_status varchar(16) not null default 'PENDING' comment 'PENDING/APPROVED/REJECTED',
              created_at datetime not null default current_timestamp comment 'created time',
              updated_at datetime not null default current_timestamp on update current_timestamp comment 'updated time',
              deleted tinyint not null default 0 comment 'logical delete',
              primary key (id),
              unique key uk_media_files_object (bucket_name, object_key),
              key idx_media_files_uploader (uploader_id),
              key idx_media_files_type_status (file_type, audit_status),
              constraint fk_media_files_uploader foreign key (uploader_id) references sys_users (id) on delete set null,
              constraint chk_media_files_type check (file_type in ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER')),
              constraint chk_media_files_visibility check (visibility in ('PUBLIC', 'PRIVATE')),
              constraint chk_media_files_audit_status check (audit_status in ('PENDING', 'APPROVED', 'REJECTED'))
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci comment='media file metadata'
            """);

        sqlExecutor.execute("""
            create table if not exists graph_node_media (
              id bigint unsigned not null auto_increment comment 'link id',
              node_id bigint unsigned not null comment 'graph node id',
              file_id bigint unsigned not null comment 'media file id',
              caption varchar(255) default null comment 'caption',
              sort_order int not null default 0 comment 'sort order',
              created_at datetime not null default current_timestamp comment 'created time',
              primary key (id),
              unique key uk_graph_node_media_node_file (node_id, file_id),
              key idx_graph_node_media_file (file_id),
              constraint fk_graph_node_media_node foreign key (node_id) references graph_nodes (id) on delete cascade,
              constraint fk_graph_node_media_file foreign key (file_id) references media_files (id) on delete cascade
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci comment='graph node media links'
            """);

        sqlExecutor.execute("""
            create table if not exists creative_products (
              id bigint unsigned not null auto_increment comment 'creative product id',
              product_code varchar(96) not null comment 'product code',
              name varchar(128) not null comment 'product name',
              description text default null comment 'product description',
              cover_file_id bigint unsigned default null comment 'cover media file id',
              related_node_id bigint unsigned default null comment 'related graph node id',
              owner_user_id bigint unsigned default null comment 'owner user id',
              external_url varchar(512) default null comment 'external url',
              price decimal(10,2) default null comment 'price',
              average_rating decimal(3,2) not null default 0.00 comment 'average rating',
              rating_count int unsigned not null default 0 comment 'rating count',
              status varchar(16) not null default 'DRAFT' comment 'DRAFT/PENDING/APPROVED/OFFLINE',
              created_at datetime not null default current_timestamp comment 'created time',
              updated_at datetime not null default current_timestamp on update current_timestamp comment 'updated time',
              deleted tinyint not null default 0 comment 'logical delete',
              primary key (id),
              unique key uk_creative_products_code (product_code),
              key idx_creative_products_node (related_node_id),
              key idx_creative_products_owner (owner_user_id),
              key idx_creative_products_rating (average_rating, rating_count),
              constraint fk_creative_products_cover foreign key (cover_file_id) references media_files (id) on delete set null,
              constraint fk_creative_products_node foreign key (related_node_id) references graph_nodes (id) on delete set null,
              constraint fk_creative_products_owner foreign key (owner_user_id) references sys_users (id) on delete set null,
              constraint chk_creative_products_status check (status in ('DRAFT', 'PENDING', 'APPROVED', 'OFFLINE'))
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci comment='creative product records'
            """);

        sqlExecutor.execute("""
            create table if not exists product_reviews (
              id bigint unsigned not null auto_increment comment 'product review id',
              product_id bigint unsigned not null comment 'product id',
              user_id bigint unsigned not null comment 'review user id',
              rating tinyint unsigned not null comment '1-5 rating',
              content text default null comment 'review content',
              reply_content text default null comment 'reply content',
              status varchar(16) not null default 'PUBLISHED' comment 'PENDING/PUBLISHED/HIDDEN',
              created_at datetime not null default current_timestamp comment 'created time',
              updated_at datetime not null default current_timestamp on update current_timestamp comment 'updated time',
              deleted tinyint not null default 0 comment 'logical delete',
              primary key (id),
              unique key uk_product_reviews_product_user (product_id, user_id),
              key idx_product_reviews_user (user_id),
              key idx_product_reviews_status (status, deleted),
              constraint fk_product_reviews_product foreign key (product_id) references creative_products (id) on delete cascade,
              constraint fk_product_reviews_user foreign key (user_id) references sys_users (id) on delete cascade,
              constraint chk_product_reviews_rating check (rating between 1 and 5),
              constraint chk_product_reviews_status check (status in ('PENDING', 'PUBLISHED', 'HIDDEN'))
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci comment='creative product reviews'
            """);

        sqlExecutor.execute("""
            create table if not exists article_products (
              id bigint unsigned not null auto_increment comment 'article product link id',
              article_id bigint unsigned not null comment 'article id',
              product_id bigint unsigned not null comment 'creative product id',
              created_at datetime not null default current_timestamp comment 'created time',
              primary key (id),
              unique key uk_article_products_article_product (article_id, product_id),
              key idx_article_products_product (product_id),
              constraint fk_article_products_article foreign key (article_id) references news_articles (id) on delete cascade,
              constraint fk_article_products_product foreign key (product_id) references creative_products (id) on delete cascade
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci comment='article product links'
            """);

        sqlExecutor.execute("""
            create table if not exists exhibition_products (
              id bigint unsigned not null auto_increment comment 'exhibition product link id',
              exhibition_id bigint unsigned not null comment 'exhibition id',
              product_id bigint unsigned not null comment 'creative product id',
              created_at datetime not null default current_timestamp comment 'created time',
              primary key (id),
              unique key uk_exhibition_products_exhibition_product (exhibition_id, product_id),
              key idx_exhibition_products_product (product_id),
              constraint fk_exhibition_products_exhibition foreign key (exhibition_id) references exhibitions (id) on delete cascade,
              constraint fk_exhibition_products_product foreign key (product_id) references creative_products (id) on delete cascade
            ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci comment='exhibition product links'
            """);
    }

    private boolean columnExists(MybatisSqlExecutor sqlExecutor, String tableName, String columnName) {
        Integer count = sqlExecutor.queryForObject("""
            select count(*)
            from information_schema.columns
            where table_schema = database()
              and table_name = ?
              and column_name = ?
            """, Integer.class, tableName, columnName);
        return count != null && count > 0;
    }
}
