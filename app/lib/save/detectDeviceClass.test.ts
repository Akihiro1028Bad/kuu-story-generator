/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { detectDeviceClass } from './detectDeviceClass'

describe('detectDeviceClass', () => {
  it('UT-035: navigator がない場合は desktop を返す', () => {
    const originalNavigator = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', { value: undefined, configurable: true })

    expect(detectDeviceClass()).toBe('desktop')

    Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true })
  })

  it('UT-036: モバイルUAの場合は mobile を返す', () => {
    const originalNavigator = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'iPhone' },
      configurable: true,
    })

    expect(detectDeviceClass()).toBe('mobile')

    Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true })
  })

  it('UT-037: モバイルUA以外は desktop を返す', () => {
    const originalNavigator = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' },
      configurable: true,
    })

    expect(detectDeviceClass()).toBe('desktop')

    Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true })
  })
})
