package com.firetree.heritage;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@MapperScan("com.firetree.heritage.features.*.mapper")
@SpringBootApplication
public class HeritageGraphApplication {

    public static void main(String[] args) {
        SpringApplication.run(HeritageGraphApplication.class, args);
    }
}
