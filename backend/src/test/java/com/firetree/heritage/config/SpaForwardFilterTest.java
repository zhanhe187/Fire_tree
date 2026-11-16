package com.firetree.heritage.config;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * SPA 回退过滤器：只接管浏览器导航的前端路由，后端接口与静态资源必须原样放行。
 */
class SpaForwardFilterTest {

    private final SpaForwardFilter filter = new SpaForwardFilter();

    private FilterChain run(String method, String uri, String accept) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        if (accept != null) {
            request.addHeader("Accept", accept);
        }
        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(request, new MockHttpServletResponse(), chain);
        return chain;
    }

    private boolean forwarded(FilterChain chain) {
        return ((MockFilterChain) chain).getRequest() == null;
    }

    @Test
    void forwardsBrowserNavigationToSpaRoutes() throws Exception {
        assertThat(forwarded(run("GET", "/explore", "text/html,application/xhtml+xml"))).isTrue();
        assertThat(forwarded(run("GET", "/favorites/study/41001", "text/html"))).isTrue();
        assertThat(forwarded(run("GET", "/admin/graph/nodes", "text/html"))).isTrue();
    }

    @Test
    void leavesApiActuatorUploadsAndAssetsAlone() throws Exception {
        assertThat(forwarded(run("GET", "/api/graph/nodes", "text/html"))).isFalse();
        assertThat(forwarded(run("GET", "/actuator/health", "text/html"))).isFalse();
        assertThat(forwarded(run("GET", "/uploads/media/a.png", "text/html"))).isFalse();
        assertThat(forwarded(run("GET", "/assets/main-abc.js", "text/html"))).isFalse();
        assertThat(forwarded(run("GET", "/heritage-intro.html", "text/html"))).isFalse();
    }

    @Test
    void doesNotTouchRootNonGetOrNonHtmlTraffic() throws Exception {
        assertThat(forwarded(run("GET", "/", "text/html"))).isFalse();
        assertThat(forwarded(run("POST", "/explore", "text/html"))).isFalse();
        assertThat(forwarded(run("GET", "/explore", "application/json"))).isFalse();
        assertThat(forwarded(run("GET", "/explore", null))).isFalse();
    }
}
