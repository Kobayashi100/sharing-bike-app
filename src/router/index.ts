import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import TopPage from '@/views/TopPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 最初に開くURLを /login にしたいので、/ は /login にリダイレクト
    { path: '/', redirect: '/login' },

    { path: '/login', name: 'login', component: LoginView },
    { path: '/top', name: 'top', component: TopPage },
  ],
})

export default router
