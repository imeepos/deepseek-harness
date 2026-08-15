import { describe, expect, it } from 'vitest'

import { decodeInspectInput } from '../src/index.ts'

/**
 * The `cordis_inspect_query` `input` parameter accepts the provider-schema
 * query either as the JSON value itself or as the JSON-encoded string that
 * untyped-property models emit for it.
 */
describe('decodeInspectInput', () => {
  it('passes an object input through unchanged', () => {
    const input = { service: 'tokenMeter' }
    expect(decodeInspectInput(input)).toBe(input)
  })

  it('passes undefined through so catalog queries stay input-less', () => {
    expect(decodeInspectInput(undefined)).toBeUndefined()
  })

  it('decodes a JSON-encoded object string to the object it carries', () => {
    expect(decodeInspectInput('{"service": "tokenMeter"}')).toEqual({ service: 'tokenMeter' })
  })

  it('decodes a JSON-encoded scalar string to that scalar', () => {
    expect(decodeInspectInput('42')).toBe(42)
  })

  it('rejects a malformed string with the parser reason', () => {
    expect(() => decodeInspectInput('{"service": ')).toThrow(/input must be a JSON value or a JSON-encoded string/)
  })
})
