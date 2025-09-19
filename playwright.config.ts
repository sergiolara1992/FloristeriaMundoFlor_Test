import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'https://www.floristeriamundoflor.com/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'   
  },
  projects: [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      viewport: null,                          
      deviceScaleFactor: undefined,           
      isMobile: undefined,
      hasTouch: undefined,
      launchOptions: { args: ['--start-maximized'] }, 
     
    },
  },
]
});
