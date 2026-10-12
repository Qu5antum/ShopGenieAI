import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { localAiApi } from './server/localAiApi.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), localAiApi(env)],
  }
})
