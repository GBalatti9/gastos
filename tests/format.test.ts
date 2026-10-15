import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseMonto } from '../lib/format'

test('parseMonto lee formato es-AR y decimal con punto', () => {
  assert.equal(parseMonto('460.000'), 460000)
  assert.equal(parseMonto('1.234.567'), 1234567)
  assert.equal(parseMonto('209.478,63'), 209478.63)
  assert.equal(parseMonto('$ 460.000'), 460000)
  assert.equal(parseMonto('1234.56'), 1234.56)
  assert.equal(parseMonto('12.5'), 12.5)
  assert.equal(parseMonto('460000'), 460000)
  assert.equal(parseMonto(''), 0)
})
