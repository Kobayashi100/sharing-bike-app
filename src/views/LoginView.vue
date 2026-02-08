<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h1 class="title">LOGIN</h1>

      <img :src="BikeIcon" class="bike-icon" />

      <p class="description">ユーザーを選択してください</p>

      <div class="button-group">
        <button @click="login('ひなた')">ひなた</button>
        <button @click="login('まなみ')">まなみ</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import BikeIcon from '@/assets/bike_icon.svg'

const router = useRouter()
const app = useAppStore()

const login = (user: 'ひなた' | 'まなみ') => {
  app.setLoginUser(user)
  router.push('/top')
}
</script>

<style scoped>
/* 画面全体 */
.login-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: linear-gradient(#ffffff, #eeeeee);
}

/* 中央カード */
.login-card {
  width: 100%;
  max-width: 420px;
  padding: 48px 24px;
  text-align: center;
}

/* タイトル */
.title {
  letter-spacing: 4px;
  font-weight: bold;
  color: #444;

  margin-top: 45px;
  margin-bottom: 32px;
}

/* 自転車アイコン */
.bike-icon {
  width: 120px;
  margin: 24px 0;

  /* やさしめオレンジ */
  filter: invert(62%) sepia(90%) saturate(600%) hue-rotate(350deg) brightness(150%) saturate(60%);
}

/* 説明文 */
.description {
  color: #666;
  margin-bottom: 32px;
}

/* ボタン */
.button-group {
  display: flex;
  gap: 16px;
  justify-content: center;
}

button {
  /* flex: 1;
  padding: 12px 0; */
  width: 120px;
  padding: 12px 0;
  border: none;
  background: #ddd;
  font-size: 16px;
  border-radius: 6px;
  margin-top: 20px;
}

button:hover {
  background: #ccc;
}
</style>
