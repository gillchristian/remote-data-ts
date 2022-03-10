import * as laws from 'fp-ts-laws'
import * as fc from 'fast-check'
import {eqString, eqNumber} from 'fp-ts/Eq'
import {ordString, ordNumber} from 'fp-ts/lib/Ord'

import * as RD from '../src/index'

const getNotAsked = <E, A>(): fc.Arbitrary<RD.RemoteData<E, A>> =>
  fc.constant(RD.notAsked)

const getLoading = <E, A>(): fc.Arbitrary<RD.RemoteData<E, A>> =>
  fc.constant(RD.loading)

const getSuccess = <E, A>(
  arb: fc.Arbitrary<A>,
): fc.Arbitrary<RD.RemoteData<E, A>> => arb.map(RD.success)

const getFailure = <E, A>(
  arb: fc.Arbitrary<E>,
): fc.Arbitrary<RD.RemoteData<E, A>> => arb.map(RD.failure)

export function getRemoteData<E, A>(
  arbE: fc.Arbitrary<E>,
  arbA: fc.Arbitrary<A>,
): fc.Arbitrary<RD.RemoteData<E, A>> {
  return fc.oneof(
    getNotAsked<E, A>(),
    getLoading<E, A>(),
    getFailure<E, A>(arbE),
    getSuccess<E, A>(arbA),
  )
}

describe('Functor', () => {
  it('satisfies the Functor laws', () =>
    laws.functor(RD.remoteData)(
      (arb) => getRemoteData(fc.string(), arb),
      (S) => RD.getEq(eqString, S),
    ))
})

describe('Apply', () => {
  it('satisfies the Apply laws', () =>
    laws.apply(RD.remoteData)(
      (arb) => getRemoteData(fc.string(), arb),
      (S) => RD.getEq(eqString, S),
    ))
})

describe('Applicative', () => {
  it('satisfies the Applicative laws', () =>
    laws.applicative(RD.remoteData)(
      (arb) => getRemoteData(fc.string(), arb),
      (S) => RD.getEq(eqString, S),
    ))
})

describe('Monad', () => {
  it('satisfies the Monad laws', () =>
    laws.monad(RD.remoteData)((S) => RD.getEq(eqString, S)))
})

describe('Eq', () => {
  it('satisfies the Eq laws', () =>
    laws.eq(
      RD.getEq(eqString, eqNumber),
      getRemoteData(fc.string(), fc.integer()),
    ))
})

describe('Ord', () => {
  it('satisfies the Ord laws', () =>
    laws.ord(
      RD.getOrd(ordString, ordNumber),
      getRemoteData(fc.string(), fc.integer()),
    ))
})
