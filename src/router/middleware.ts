import type { Router } from 'vue-router'
import { useAppStore } from '@/stores/app'

export function setupGuards(router: Router) {
  router.beforeEach((to) => {
    const app = useAppStore()

    // meta.requiresAuth が付いてるページはログイン必須
    if (to.meta.requiresAuth && !app.loginUserName) {
      return { path: '/login' }
    }

    return true
  })
}
