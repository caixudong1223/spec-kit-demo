import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/vue'

// 每个测试后自动清理
afterEach(() => {
  cleanup()
})
