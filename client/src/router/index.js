import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../components/AppLayout.vue'),
    children: [
      { path: '', component: () => import('../pages/HomePage.vue') },
      { path: 'login', component: () => import('../pages/LoginPage.vue') },
      { path: 'books', component: () => import('../pages/SearchBooksPage.vue') },
      { path: 'book/:id', component: () => import('../pages/BookDetailPage.vue') },
      { path: 'favorites', component: () => import('../pages/FavoritesPage.vue') },
      { path: 'publish', component: () => import('../pages/PublishPage.vue') },
      { path: 'messages', component: () => import('../pages/MessagesPage.vue') },
      { path: 'notifications', component: () => import('../pages/MessagesPage.vue') },
      { path: 'orders', component: () => import('../pages/OrdersPage.vue') },
      { path: 'evaluate/:id', component: () => import('../pages/EvaluatePage.vue') },
      { path: 'profile', component: () => import('../pages/ProfilePage.vue') },
      { path: 'profile/:id', component: () => import('../pages/ProfilePage.vue') },
      { path: 'schedule', component: () => import('../pages/SchedulePage.vue') },
      { path: 'ai-analysis', component: () => import('../pages/AiAnalysisPage.vue') },
      { path: 'community', component: () => import('../pages/CommunityPage.vue') },
      { path: 'community/note/:id', component: () => import('../pages/CommunityNotePage.vue') },
      { path: 'achievements', component: () => import('../pages/AchievementsPage.vue') },
      { path: 'admin', component: () => import('../pages/AdminPage.vue') },
      { path: 'wish-square', component: () => import('../pages/WishSquarePage.vue') },
      { path: 'chat', component: () => import('../pages/ChatPage.vue') },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
