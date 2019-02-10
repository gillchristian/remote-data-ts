import { RemoteData, cata, map, fold, chain, ap, lift2, is } from './';

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

  // Applicative laws
  // - http://www.tomharding.me/2017/04/10/fantas-eel-and-specification-8/
  // - http://www.tomharding.me/2017/04/17/fantas-eel-and-specification-9/
  // - http://hackage.haskell.org/package/base-4.12.0.0/docs/Control-Applicative.html#g:1
  //
  // (<$>) :: Functor f     =>   (a -> b) -> f a -> f b
  // (<*>) :: Applicative f => f (a -> b) -> f a -> f b
  describe('applicative', () => {
    // pure id <*> v == v
    it('identity', () => {
      const id = ap(RemoteData.of(identity));

      expect(id(n)).toEqual(n);
      expect(id(l)).toEqual(l);
      expect(id(f)).toEqual(f);
      expect(id(s)).toEqual(s);
    });

    // pure f <*> pure x == pure (f x)
    it('homomorphism', () => {
      const f = (s: string) => s.toUpperCase();
      const x = 'foo';

      const left = ap(RemoteData.of(f))(RemoteData.of(x));
      const right = RemoteData.of(f(x));

      expect(left).toEqual(right);
    });

    // u <*> pure y = pure ($ y) <*> u
    it('interchange', () => {
      const x = 'foo';
      const fa = RemoteData.of((s: string) => s.toUpperCase());
      const l = (f: (s: string) => string) => f(x);

      const left = ap(fa)(RemoteData.of(x));
      const right = ap(RemoteData.of(l))(fa);

      expect(left).toEqual(right);
    });

    // pure (.) <*> u <*> v <*> w == u <*> (v <*> w)
    it('composition', () => {
      const composeS = (f: (b: string) => string) => (
        g: (a: string) => string,
      ) => (a: string) => f(g(a));
      const f = RemoteData.of((s: string) => s.toUpperCase());
      const g = RemoteData.of((s: string) => s + '!!!');
      const rdc = RemoteData.of(composeS);

      const left = ap(ap(ap(rdc)(f))(g))(s);

      const right = ap(f)(ap(g)(s));

      expect(left).toEqual(right);
    });

    // liftA2 :: Applicative f => (a -> b -> c) -> f a -> f b -> f c
    // liftA2 f x y = f <$> x <*> y
    it('lift2', () => {
      const add = (a: number) => (b: number) => a + b;

      const rda = RemoteData.of(1);
      const rdb = RemoteData.of(2);

      const left = lift2(add)(rda)(rdb);

      const right = ap(map(add)(rda))(rdb);

      expect(left).toEqual(right);
    });
  });

  describe('is', () => {
    describe('loaded', () => {
      it('rd is in "loaded" status', () => {
        expect(is.loaded(n)).toBe(false);
        expect(is.loaded(l)).toBe(false);

        expect(is.loaded(s)).toBe(true);
        expect(is.loaded(f)).toBe(true);
      });
    });

    describe('notAsked', () => {
      it('rd is NotAsked', () => {
        expect(is.notAsked(n)).toBe(true);

        expect(is.notAsked(l)).toBe(false);
        expect(is.notAsked(s)).toBe(false);
        expect(is.notAsked(f)).toBe(false);
      });
    });

    describe('loading', () => {
      it('rd is Loading', () => {
        expect(is.loading(n)).toBe(false);

        expect(is.loading(l)).toBe(true);

        expect(is.loading(s)).toBe(false);
        expect(is.loading(f)).toBe(false);
      });
    });

    describe('success', () => {
      it('rd is Success', () => {
        expect(is.success(n)).toBe(false);
        expect(is.success(l)).toBe(false);

        expect(is.success(s)).toBe(true);

        expect(is.success(f)).toBe(false);
      });
    });

    describe('failure', () => {
      it('rd is Failure', () => {
        expect(is.failure(n)).toBe(false);
        expect(is.failure(l)).toBe(false);
        expect(is.failure(s)).toBe(false);

        expect(is.failure(f)).toBe(true);
      });
    });
  });
});
