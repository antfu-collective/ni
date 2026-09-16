import { describe, expect, it } from 'vitest'
import { isVerbatimSpec, parsePackageSpec } from '../../src/catalog/spec'

describe('parsePackageSpec', () => {
  it('returns the bare name when no version is given', () => {
    expect(parsePackageSpec('esbuild')).toEqual({ raw: 'esbuild', name: 'esbuild' })
  })

  it('splits name and version', () => {
    expect(parsePackageSpec('esbuild@0.28.1')).toEqual({
      raw: 'esbuild@0.28.1',
      name: 'esbuild',
      spec: '0.28.1',
    })
  })

  it('keeps the scope of a scoped package without a version', () => {
    expect(parsePackageSpec('@vitejs/plugin-vue')).toEqual({
      raw: '@vitejs/plugin-vue',
      name: '@vitejs/plugin-vue',
    })
  })

  it('splits a scoped package with a version', () => {
    expect(parsePackageSpec('@vitejs/plugin-vue@^6.0.0')).toEqual({
      raw: '@vitejs/plugin-vue@^6.0.0',
      name: '@vitejs/plugin-vue',
      spec: '^6.0.0',
    })
  })

  it('keeps the whole alias specifier', () => {
    expect(parsePackageSpec('vue2@npm:vue@2.7.16')).toEqual({
      raw: 'vue2@npm:vue@2.7.16',
      name: 'vue2',
      spec: 'npm:vue@2.7.16',
    })
  })

  it('ignores a trailing separator', () => {
    expect(parsePackageSpec('esbuild@')).toEqual({ raw: 'esbuild@', name: 'esbuild' })
  })
})

describe('isVerbatimSpec', () => {
  const verbatim = ['0.28.1', 'v1.2.3', '^1.2', '~1', '>=1.2.3', '<2', '*', 'x', 'npm:vue@2.7.16', 'workspace:*', 'file:../pkg']
  it.each(verbatim)('keeps %s as typed', (spec) => {
    expect(isVerbatimSpec(spec)).toBe(true)
  })

  it.each(['latest', 'next', 'beta', 'canary'])('resolves the dist-tag %s', (spec) => {
    expect(isVerbatimSpec(spec)).toBe(false)
  })
})
