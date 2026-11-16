import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './styles.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: App },
    { path: '/explore', component: App },
    { path: '/graph', component: App },
    { path: '/graph/board', component: App },
    { path: '/community', component: App },
    { path: '/favorites', component: App },
    { path: '/favorites/space', redirect: '/favorites' },
    { path: '/favorites/study/:nodeId', component: App },
    { path: '/favorites/checkin', component: App },
    { path: '/login', component: App },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

createApp(App).use(router).mount('#heritage-intro-app');
