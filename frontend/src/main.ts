import { createApp } from 'vue';
import RootApp from './RootApp.vue';
import router from './router';
import './admin/styles.css';

createApp(RootApp).use(router).mount('#app');
