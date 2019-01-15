import { RemoteData, cata, map, fold, chain, isLoaded } from './';

const identity = <A>(a: A) => a;
const compose = <A, B, C>(f: (b: B) => C, g: (a: A) => B) => (x: A): C =>
  f(g(x));

describe('remote-data-ts', () => {
  describe('cata', () => {
    it('transforms the remote data according to the corresponding type', () => {
      const toString = cata({
        notAsked: () => 'notAsked',
        loading: () => 'loading',
        failure: () => 'failure',
        success: () => 'success',
      });

      expect(toString(RemoteData.notAsked())).toBe('notAsked');
      expect(toString(RemoteData.loading())).toBe('loading');
      expect(toString(RemoteData.success('foo'))).toBe('success');
      expect(toString(RemoteData.failure('bar'))).toBe('failure');
    });
  });

  // Functor laws (http://hackage.haskell.org/package/base-4.12.0.0/docs/Data-Functor.html)
  describe('functor', () => {
    // fmap id  ==  id
    it('identity morphism', () => {
      const mapID = map(identity);

      const s = RemoteData.success('foo');
      const f = RemoteData.failure(new Error('bar'));
      const n = RemoteData.notAsked();
      const l = RemoteData.loading();

      expect(mapID(s)).toEqual(s);
      expect(mapID(f)).toEqual(f);
      expect(mapID(n)).toEqual(n);
      expect(mapID(l)).toEqual(l);
    });

    // fmap (f . g)  ==  fmap f . fmap g
    it('composition of morphisms', () => {
      const toUpper = (a: string) => a.toUpperCase();
      const chars = (a: string) => a.split('');

      const upperChars = compose(
        chars,
        toUpper,
      );

      const mapUpper = map(toUpper);
      const mapChars = map(chars);
      const mapUpperChars = compose(
        mapChars,
        mapUpper,
      );

      const s = RemoteData.success('foo');
      const f = RemoteData.failure(new Error('bar'));
      const n = RemoteData.notAsked();
      const l = RemoteData.loading();

      expect(map(upperChars)(s)).toEqual(mapUpperChars(s));
      expect(map(upperChars)(f)).toEqual(mapUpperChars(f));
      expect(map(upperChars)(n)).toEqual(mapUpperChars(n));
      expect(map(upperChars)(l)).toEqual(mapUpperChars(l));
    });
  });

  describe('fold', () => {
    it('returns default value for not successful cases', () => {
      const withDef = fold(() => 'success')('def');

      const notAsked = RemoteData.notAsked();
      const loading = RemoteData.loading();
      const success = RemoteData.success('foo');
      const failure = RemoteData.failure('bar');

      expect(withDef(notAsked)).toEqual('def');
      expect(withDef(loading)).toEqual('def');
      expect(withDef(failure)).toEqual('def');

      expect(withDef(success)).toEqual('success');
    });
  });

  describe('chain', () => {
    it('returns default value for not successful cases', () => {
      const concatYay = chain((data) => RemoteData.success(`${data} yay`));

      const notAsked = RemoteData.notAsked();
      const loading = RemoteData.loading();
      const success = RemoteData.success('foo');
      const failure = RemoteData.failure('bar');

      expect(concatYay(notAsked)).toEqual(notAsked);
      expect(concatYay(loading)).toEqual(loading);
      expect(concatYay(failure)).toEqual(failure);

      expect(concatYay(success)).toEqual(RemoteData.success('foo yay'));
    });
  });

  describe('isLoaded', () => {
    it('returns true for cases that finished loading', () => {
      expect(isLoaded(RemoteData.notAsked())).toBe(false);
      expect(isLoaded(RemoteData.loading())).toBe(false);

      expect(isLoaded(RemoteData.success('foo'))).toBe(true);
      expect(isLoaded(RemoteData.failure('foo'))).toBe(true);
    });
  });
});
