/**
 * Type to model asynchronous operations data and the statuses it can be in.
 *
 * ```ts
 * type RemoteData<E, A> = NotAsked | Loading | Success<A> | Failure<E>;
 * ```
 *
 * For examples check
 * [examples/index.ts](https://github.com/gillchristian/remote-data-ts/blob/master/examples/index.ts)
 * in the repository.
 *
 * @since 3.0.0
 */
import { Alt2 } from 'fp-ts/Alt';
import { Applicative2, Applicative as ApplicativeHKT } from 'fp-ts/Applicative';
import {
  Apply2,
  apFirst as apFirst_,
  apSecond as apSecond_,
  apS as apS_,
} from 'fp-ts/Apply';
import { Bifunctor2 } from 'fp-ts/Bifunctor';
import { Chain2, bind as bind_, chainFirst as chainFirst_ } from 'fp-ts/Chain';
import { Eq } from 'fp-ts/Eq';
import { Ord } from 'fp-ts/Ord';
import { Foldable2 } from 'fp-ts/Foldable';
import { Functor2, bindTo as bindTo_, flap as flap_ } from 'fp-ts/Functor';
import { HKT } from 'fp-ts/HKT';
import { Monad2 } from 'fp-ts/Monad';
import { MonadThrow2 } from 'fp-ts/MonadThrow';
import { Monoid } from 'fp-ts/Monoid';
import { PipeableTraverse2, Traversable2 } from 'fp-ts/Traversable';
import {
  pipe,
  flow,
  constNull,
  identity,
  Lazy,
  Predicate,
} from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import {
  filterOrElse as filterOrElse_,
  FromEither2,
  fromOption as fromOption_,
  fromPredicate as fromPredicate_,
} from 'fp-ts/FromEither';

/**
 * @since 3.0.0
 * @category Model
 */
export interface NotAsked {
  readonly tag: 'NotAsked';
}

/**
 * @since 3.0.0
 * @category Model
 */
export interface Loading {
  readonly tag: 'Loading';
}

/**
 * @since 3.0.0
 * @category Model
 */
export interface Success<A = unknown> {
  readonly tag: 'Success';
  readonly data: A;
}

/**
 * @since 3.0.0
 * @category Model
 */
export interface Failure<E = unknown> {
  readonly tag: 'Failure';
  readonly error: E;
}

/**
 * @since 3.0.0
 * @category Model
 */
export type RemoteData<E = unknown, A = unknown> =
  | NotAsked
  | Loading
  | Failure<E>
  | Success<A>;

/**
 * @since 3.0.0
 * @category Constructors
 */
export const notAsked: RemoteData<never, never> = { tag: 'NotAsked' };

/**
 * @since 3.0.0
 * @category Constructors
 */
export const loading: RemoteData<never, never> = { tag: 'Loading' };

/**
 * @since 3.0.0
 * @category Constructors
 */
export const failure = <E = unknown>(error: E): RemoteData<E, never> => ({
  tag: 'Failure',
  error,
});

/**
 * @since 3.0.0
 * @category Constructors
 */
export const success = <D = unknown>(data: D): RemoteData<never, D> => ({
  tag: 'Success',
  data,
});

/**
 * @since 3.0.0
 * @category Constructors
 */
export const of = success;

/**
 * @since 3.0.0
 * @category Refinements
 */
export const isNotAsked = (rd: RemoteData<unknown, unknown>): rd is NotAsked =>
  rd.tag === 'NotAsked';

/**
 * @since 3.0.0
 * @category Refinements
 */
export const isLoading = (rd: RemoteData<unknown, unknown>): rd is Loading =>
  rd.tag === 'Loading';

/**
 * @since 3.0.0
 * @category Refinements
 */
export const isSuccess = (
  rd: RemoteData<unknown, unknown>,
): rd is Success<unknown> => rd.tag === 'Success';

/**
 * @since 3.0.0
 * @category Refinements
 */
export const isFailure = (
  rd: RemoteData<unknown, unknown>,
): rd is Failure<unknown> => rd.tag === 'Failure';

/**
 * @since 3.0.0
 * @category Destructors
 */
export const match =
  <E = unknown, D = unknown, R = unknown>(matcher: {
    notAsked: () => R;
    loading: () => R;
    success: (data: D) => R;
    failure: (error: E) => R;
  }) =>
  (rd: RemoteData<E, D>): R => {
    if (rd.tag === 'NotAsked') {
      return matcher.notAsked();
    }
    if (rd.tag === 'Loading') {
      return matcher.loading();
    }
    if (rd.tag === 'Failure') {
      return matcher.failure(rd.error);
    }
    return matcher.success(rd.data);
  };

/**
 * @since 3.0.0
 * @category Instances
 */
export const URI = 'RemoteData';

/**
 * @since 3.0.0
 * @category Instances
 */
export type URI = typeof URI;

declare module 'fp-ts/lib/HKT' {
  interface URItoKind2<E, A> {
    readonly RemoteData: RemoteData<E, A>;
  }
}

/**
 * @since 3.0.0
 * @category Instance operations
 */
export const map =
  <A, B>(f: (a: A) => B) =>
  <E>(rda: RemoteData<E, A>): RemoteData<E, B> =>
    match<E, A, RemoteData<E, B>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure,
      success: (data) => success(f(data)),
    })(rda);

/**
 * @since 3.0.0
 * @category Instances
 */
export const Functor: Functor2<URI> = {
  URI,
  map: (fa, f) => pipe(fa, map(f)),
};

/**
 * @since 3.0.0
 * @category Instance operations
 */
export const ap =
  <E, A>(rda: RemoteData<E, A>) =>
  <B>(rdfab: RemoteData<E, (a: A) => B>): RemoteData<E, B> =>
    match<E, (a: A) => B, RemoteData<E, B>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure,
      success: (f) => Functor.map(rda, f),
    })(rdfab);

/**
 * @since 3.0.0
 * @category Instances
 */
export const Apply: Apply2<URI> = {
  ...Functor,
  ap: (fab, fa) => pipe(fab, ap(fa)),
};

/**
 * @since 3.0.0
 * @category Instances
 */
export const Applicative: Applicative2<URI> = { ...Apply, of };

/**
 * @since 3.0.0
 * @category Instance operations
 */
export const chain =
  <E, A, B>(f: (a: A) => RemoteData<E, B>) =>
  (rda: RemoteData<E, A>): RemoteData<E, B> =>
    match<E, A, RemoteData<E, B>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure,
      success: (a) => f(a),
    })(rda);

/**
 * @since 3.0.0
 * @category Instances
 */
export const Chain: Chain2<URI> = {
  ...Apply,
  chain: (fa, f) => pipe(fa, chain(f)),
};

/**
 * @since 3.0.0
 * @category Instances
 */
export const Monad: Monad2<URI> = { ...Chain, ...Applicative };

/**
 * @since 3.0.0
 * @category Instances
 */
export const MonadThrow: MonadThrow2<URI> = { ...Monad, throwError: failure };

/**
 * @since 3.0.0
 * @category Instance operations
 */
export const bimap =
  <E, A, G, B>(f: (e: E) => G, g: (a: A) => B) =>
  (rdea: RemoteData<E, A>): RemoteData<G, B> =>
    match<E, A, RemoteData<G, B>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure: (error) => failure(f(error)),
      success: (data) => success(g(data)),
    })(rdea);

/**
 * @since 3.0.0
 * @category Instance operations
 */
export const mapLeft =
  <E, G>(f: (a: E) => G) =>
  <A>(rda: RemoteData<E, A>): RemoteData<G, A> =>
    match<E, A, RemoteData<G, A>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure: (error) => failure(f(error)),
      success,
    })(rda);

/**
 * @since 3.0.0
 * @category Instances
 */
export const Bifunctor: Bifunctor2<URI> = {
  URI,
  bimap: (fea, f, g) => pipe(fea, bimap(f, g)),
  mapLeft: (fea, f) => pipe(fea, mapLeft(f)),
};

/**
 * @since 3.0.0
 * @category Instance operations
 */
export const reduce =
  <E, A, B>(b: B, f: (b: B, a: A) => B) =>
  (rda: RemoteData<E, A>): B =>
    match<E, A, B>({
      notAsked: () => b,
      loading: () => b,
      failure: () => b,
      success: (data) => f(b, data),
    })(rda);

/**
 * @since 3.0.0
 * @category Instance operations
 */
export const reduceRight =
  <E, A, B>(b: B, f: (a: A, b: B) => B) =>
  (rda: RemoteData<E, A>): B =>
    pipe(
      rda,
      reduce(b, (b_, a_) => f(a_, b_)),
    );

/**
 * @since 3.0.0
 * @category Instance operations
 */
export const foldMap =
  <M>(M: Monoid<M>) =>
  <A>(f: (a: A) => M) =>
  <E>(rda: RemoteData<E, A>): M =>
    match<E, A, M>({
      notAsked: () => M.empty,
      loading: () => M.empty,
      failure: () => M.empty,
      success: (data) => f(data),
    })(rda);

/**
 * @since 3.0.0
 * @category Instances
 */
export const Foldable: Foldable2<URI> = {
  URI,
  reduce: (fa, b, f) => pipe(fa, reduce(b, f)),
  reduceRight: (fa, b, f) => pipe(fa, reduceRight(b, f)),
  foldMap: (M) => (fa, f) => pipe(fa, foldMap(M)(f)),
};

/**
 * @since 3.0.0
 * @category Instance operations
 */
export const sequence: Traversable2<URI>['sequence'] =
  <F>(F: ApplicativeHKT<F>) =>
  <E, A>(ma: RemoteData<E, HKT<F, A>>): HKT<F, RemoteData<E, A>> =>
    match<E, HKT<F, A>, HKT<F, RemoteData<E, A>>>({
      notAsked: () => F.of(notAsked),
      loading: () => F.of(loading),
      success: (t) => F.map(t, success),
      failure: flow(failure, F.of),
    })(ma);

/**
 * @since 3.0.0
 * @category Instance operations
 */
export const traverse: PipeableTraverse2<URI> =
  <F>(F: ApplicativeHKT<F>) =>
  <A, B>(f: (a: A) => HKT<F, B>) =>
  <E>(ta: RemoteData<E, A>): HKT<F, RemoteData<E, B>> =>
    match<E, A, HKT<F, RemoteData<E, B>>>({
      notAsked: () => F.of(notAsked),
      loading: () => F.of(loading),
      success: (ta) => F.map<B, RemoteData<E, B>>(f(ta), success),
      failure: flow(failure, F.of),
    })(ta);

/**
 * @since 3.0.0
 * @category Instances
 */
export const Traversable: Traversable2<URI> = {
  ...Functor,
  ...Foldable,
  sequence,
  traverse:
    <F>(F: ApplicativeHKT<F>) =>
    <E, A, B>(ta: RemoteData<E, A>, f: (a: A) => HKT<F, B>) =>
      pipe(ta, traverse(F)(f)),
};

/**
 * @since 3.0.0
 * @category Instance operations
 */
export const alt =
  <E, A>(that: Lazy<RemoteData<E, A>>) =>
  (fa: RemoteData<E, A>): RemoteData<E, A> =>
    isSuccess(fa) ? fa : that();

/**
 * @since 3.0.0
 * @category Instances
 */
export const Alt: Alt2<URI> = {
  ...Functor,
  alt: (fa, that) => pipe(fa, alt(that)),
};

/**
 * @since 3.0.0
 * @category Instance operations
 */
const fromEither = <E, A>(e: E.Either<E, A>): RemoteData<E, A> =>
  pipe(e, E.match<E, A, RemoteData<E, A>>(failure, success));

/**
 * @since 3.0.0
 * @category Instances
 */
export const FromEither: FromEither2<URI> = {
  URI,
  fromEither,
};

/**
 * @since 3.0.0
 * @category Combinators
 */
export const apFirst = apFirst_(Apply);

/**
 * @since 3.0.0
 * @category Combinators
 */
export const apSecond = apSecond_(Apply);

/**
 * @since 3.0.0
 * @category Combinators
 */
export const apS = apS_(Apply);

/**
 * @since 3.0.0
 * @category Combinators
 */
export const chainFirst = chainFirst_(Chain);

/**
 * @since 3.0.0
 * @category Combinators
 */
export const bind = bind_(Chain);

/**
 * @since 3.0.0
 * @category Combinators
 */
export const filterOrElse = filterOrElse_(FromEither, Chain);

/**
 * @since 3.0.0
 * @category Natural transformations
 */
export const fromOption = fromOption_(FromEither);

/**
 * @since 3.0.0
 * @category Constructors
 */
export const fromPredicate = fromPredicate_(FromEither);

/**
 * @since 3.0.0
 * @category Combinators
 */
export const bindTo = bindTo_(Functor);

/**
 * @since 3.0.0
 * @category Combinators
 */
export const flap = flap_(Functor);

/**
 * @since 3.0.0
 * @category Combinators
 */
export const flatten: <E, A>(
  mma: RemoteData<E, RemoteData<E, A>>,
) => RemoteData<E, A> = chain(identity);

/**
 * @since 3.0.0
 * @category Instances
 */
export function getEq<E, A>(eqErr: Eq<E>, eqA: Eq<A>): Eq<RemoteData<E, A>> {
  return {
    equals: (x, y) =>
      x === y
        ? true
        : isNotAsked(x)
        ? isNotAsked(y)
        : isLoading(x)
        ? isLoading(y)
        : isFailure(x)
        ? isFailure(y) && eqErr.equals(x.error, y.error)
        : isSuccess(y) && eqA.equals(x.data, y.data),
  };
}

/**
 * @since 3.0.0
 * @category Instances
 */
export function getOrd<E, A>(
  ordErr: Ord<E>,
  ordA: Ord<A>,
): Ord<RemoteData<E, A>> {
  return {
    equals: getEq(ordErr, ordA).equals,
    compare: (x, y) => {
      if (isNotAsked(x)) {
        return isNotAsked(y) ? 0 : 1;
      }

      if (isLoading(x)) {
        return isNotAsked(y) ? -1 : isLoading(y) ? 0 : 1;
      }

      if (isFailure(x)) {
        return isSuccess(y)
          ? 1
          : isFailure(y)
          ? ordErr.compare(x.error, y.error)
          : -1;
      }

      return isSuccess(y) ? ordA.compare(x.data, y.data) : -1;
    },
  };
}

/**
 * @since 3.0.0
 * @category Destructors
 */
export const getOrElse =
  <E = unknown, A = unknown>(
    onNotAsked: () => A,
    onLoading: () => A,
    onFailure: (err: E) => A,
  ) =>
  (rda: RemoteData<E, A>): A =>
    match<E, A, A>({
      notAsked: onNotAsked,
      loading: onLoading,
      success: identity,
      failure: onFailure,
    })(rda);

/**
 * @since 3.0.0
 * @category Destructors
 */
export const toNullable = <E = unknown, A = unknown>(
  rda: RemoteData<E, A>,
): A | null =>
  match<E, A, A | null>({
    notAsked: constNull,
    loading: constNull,
    success: identity,
    failure: constNull,
  })(rda);

/**
 * @since 3.0.0
 * @category Natural transformations
 */
export const toOption = flow(toNullable, O.fromNullable);

/**
 * @since 3.0.0
 * @category Natural transformations
 */
export const toEither =
  <E = unknown, L = unknown>(
    onNotAsked: () => L,
    onLoading: () => L,
    onFailure: (err: E) => L,
  ) =>
  <A = unknown>(rda: RemoteData<E, A>): E.Either<L, A> =>
    match<E, A, E.Either<L, A>>({
      notAsked: () => E.left(onNotAsked()),
      loading: () => E.left(onLoading()),
      success: E.right,
      failure: flow(E.left, E.mapLeft(onFailure)),
    })(rda);

/**
 * @since 3.0.0
 * @category Combinators
 */
export const swap = <E = unknown, A = unknown>(
  rda: RemoteData<E, A>,
): RemoteData<A, E> =>
  match<E, A, RemoteData<A, E>>({
    notAsked: () => notAsked,
    loading: () => loading,
    success: failure,
    failure: success,
  })(rda);

/**
 * @since 3.0.0
 * @category Combinators
 */
export const mapFailure = mapLeft;

/**
 * @since 3.0.0
 * @category Utils
 */
export const exists =
  <A = unknown>(predicate: Predicate<A>) =>
  <E = unknown>(rda: RemoteData<E, A>): boolean =>
    match<E, A, boolean>({
      notAsked: () => false,
      loading: () => false,
      failure: () => false,
      success: predicate,
    })(rda);

/**
 * @since 3.0.0
 * @category Utils
 */
export const elem =
  <A = unknown>(E: Eq<A>) =>
  <E = unknown>(a: A, rda: RemoteData<E, A>): boolean =>
    pipe(
      rda,
      exists((b) => E.equals(a, b)),
    );
