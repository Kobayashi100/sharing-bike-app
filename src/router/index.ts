import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import TopView from '@/views/TopPage.vue'
import { setupGuards } from './middleware'
import HistoryView from '@/views/HistoryView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView },
    {
      path: '/top',
      component: TopView,
      meta: { requiresAuth: true },
    },
    {
      path: '/history',
      component: HistoryView,
      meta: { requiresAuth: true },
    },
  ],
})

setupGuards(router)

export default router
