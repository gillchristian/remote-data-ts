import { RemoteData, cata, map, fold, chain, isLoaded } from './';

const identity = <A>(a: A) => a;
const compose = <A, B, C>(f: (b: B) => C, g: (a: A) => B) => (x: A): C =>
  f(g(x));

const s = RemoteData.success('foo');
const f = RemoteData.failure(new Error('bar'));
const n = RemoteData.notAsked();
const l = RemoteData.loading();

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

  // Functor laws
  // - https://wiki.haskell.org/Functor
  // - http://hackage.haskell.org/package/base-4.12.0.0/docs/Data-Functor.html
  describe('functor', () => {
    // fmap id  ==  id
    it('identity morphism', () => {
      const mapID = map(identity);

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

  // Monad laws
  // - https://wiki.haskell.org/Monad_laws
  // - http://hackage.haskell.org/package/base-4.12.0.0/docs/Control-Monad.html)
  describe('monad', () => {
    const g = (s: string) => RemoteData.of(s + ' yay');
    const h = (s: string) => RemoteData.of(s + '!');

    // return a >>= g == g a
    it('left identity', () => {
      const a = 'foo';

      expect(chain(g)(RemoteData.of(a))).toEqual(g(a));
    });

    // m >>= return == m
    it('right identity', () => {
      expect(chain(RemoteData.of)(s)).toEqual(s);
      expect(chain(RemoteData.of)(f)).toEqual(f);
      expect(chain(RemoteData.of)(l)).toEqual(l);
      expect(chain(RemoteData.of)(n)).toEqual(n);
    });

    // (m >>= g) >>= h == m >>= (\x -> g x >>= h)
    it('associativity', () => {
      const leftS = chain(h)(chain(g)(s));
      const rightS = chain((x: string) => chain(h)(g(x)))(s);

      const leftF = chain(h)(chain(g)(f));
      const rightF = chain((x: string) => chain(h)(g(x)))(f);

      const leftL = chain(h)(chain(g)(l));
      const rightL = chain((x: string) => chain(h)(g(x)))(l);

      const leftN = chain(h)(chain(g)(n));
      const rightN = chain((x: string) => chain(h)(g(x)))(n);

      expect(leftS).toEqual(rightS);
      expect(leftF).toEqual(rightF);
      expect(leftL).toEqual(rightL);
      expect(leftN).toEqual(rightN);
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
