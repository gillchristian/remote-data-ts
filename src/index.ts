import { Alt2 } from 'fp-ts/Alt';
import { Applicative2, Applicative as ApplicativeHKT } from 'fp-ts/Applicative';
import { Apply2 } from 'fp-ts/Apply';
import { Bifunctor2 } from 'fp-ts/Bifunctor';
import { Chain2 } from 'fp-ts/Chain';
import { Eq } from 'fp-ts/Eq';
import { Ord } from 'fp-ts/Ord';
import { Foldable2 } from 'fp-ts/Foldable';
import { Functor2 } from 'fp-ts/Functor';
import { HKT } from 'fp-ts/HKT';
import { Monad2 } from 'fp-ts/Monad';
import { MonadThrow2 } from 'fp-ts/MonadThrow';
import { Monoid } from 'fp-ts/Monoid';
import { PipeableTraverse2, Traversable2 } from 'fp-ts/Traversable';
import { pipeable } from 'fp-ts/pipeable';
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

/** @since 3.0.0 */
export interface NotAsked {
  readonly tag: 'NotAsked';
}

/** @since 3.0.0 */
export interface Loading {
  readonly tag: 'Loading';
}

/** @since 3.0.0 */
export interface Success<A = unknown> {
  readonly tag: 'Success';
  readonly data: A;
}

/** @since 3.0.0 */
export interface Failure<E = unknown> {
  readonly tag: 'Failure';
  readonly error: E;
}

/** @since 3.0.0 */
export type RemoteData<E = unknown, A = unknown> =
  | NotAsked
  | Loading
  | Failure<E>
  | Success<A>;

/** @since 3.0.0 */
export const notAsked: RemoteData<never, never> = { tag: 'NotAsked' };

/** @since 3.0.0 */
export const loading: RemoteData<never, never> = { tag: 'Loading' };

/** @since 3.0.0 */
export const failure = <E = unknown>(error: E): RemoteData<E, never> => ({
  tag: 'Failure',
  error,
});

/** @since 3.0.0 */
export const success = <D = unknown>(data: D): RemoteData<never, D> => ({
  tag: 'Success',
  data,
});

/** @since 3.0.0 */
export const of = success;

/** @since 3.0.0 */
export const isNotAsked = (rd: RemoteData<unknown, unknown>): rd is NotAsked =>
  rd.tag === 'NotAsked';

/** @since 3.0.0 */
export const isLoading = (rd: RemoteData<unknown, unknown>): rd is Loading =>
  rd.tag === 'Loading';

/** @since 3.0.0 */
export const isSuccess = (
  rd: RemoteData<unknown, unknown>,
): rd is Success<unknown> => rd.tag === 'Success';

/** @since 3.0.0 */
export const isFailure = (
  rd: RemoteData<unknown, unknown>,
): rd is Failure<unknown> => rd.tag === 'Failure';

/** @since 3.0.0 */
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

// TypeClasses

/** @since 3.0.0 */
export const URI = 'RemoteData';

/** @since 3.0.0 */
export type URI = typeof URI;

declare module 'fp-ts/lib/HKT' {
  interface URItoKind2<E, A> {
    readonly RemoteData: RemoteData<E, A>;
  }
}

/** @since 3.0.0 */
export const Functor: Functor2<URI> = {
  URI,
  map: <E, A, B>(rda: RemoteData<E, A>, f: (a: A) => B): RemoteData<E, B> =>
    match<E, A, RemoteData<E, B>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure,
      success: (data) => success(f(data)),
    })(rda),
};

/** @since 3.0.0 */
export const Apply: Apply2<URI> = {
  ...Functor,
  ap: <E, A, B>(
    rdf: RemoteData<E, (a: A) => B>,
    rda: RemoteData<E, A>,
  ): RemoteData<E, B> =>
    match<E, (a: A) => B, RemoteData<E, B>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure,
      success: (f) => Functor.map(rda, f),
    })(rdf),
};

/** @since 3.0.0 */
export const Applicative: Applicative2<URI> = { ...Apply, of };

/** @since 3.0.0 */
export const Chain: Chain2<URI> = {
  ...Apply,
  chain: <E, A, B>(
    rda: RemoteData<E, A>,
    f: (a: A) => RemoteData<E, B>,
  ): RemoteData<E, B> =>
    match<E, A, RemoteData<E, B>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure,
      success: (a) => f(a),
    })(rda),
};

/** @since 3.0.0 */
export const Monad: Monad2<URI> = { ...Chain, ...Applicative };

/** @since 3.0.0 */
export const MonadThrow: MonadThrow2<URI> = { ...Monad, throwError: failure };

/** @since 3.0.0 */
export const Bifunctor: Bifunctor2<URI> = {
  URI,
  bimap: <E, A, G, B>(
    rdea: RemoteData<E, A>,
    f: (e: E) => G,
    g: (a: A) => B,
  ): RemoteData<G, B> =>
    match<E, A, RemoteData<G, B>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure: (error) => failure(f(error)),
      success: (data) => success(g(data)),
    })(rdea),
  mapLeft: <E, A, G>(rda: RemoteData<E, A>, f: (a: E) => G): RemoteData<G, A> =>
    match<E, A, RemoteData<G, A>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure: (error) => failure(f(error)),
      success,
    })(rda),
};

const reduce = <E, A, B>(
  rda: RemoteData<E, A>,
  b: B,
  f: (b: B, a: A) => B,
): B =>
  match<E, A, B>({
    notAsked: () => b,
    loading: () => b,
    failure: () => b,
    success: (data) => f(b, data),
  })(rda);

/** @since 3.0.0 */
export const Foldable: Foldable2<URI> = {
  URI,
  reduce,
  reduceRight: <E, A, B>(rda: RemoteData<E, A>, b: B, f: (a: A, b: B) => B) =>
    reduce(rda, b, (b_, a_) => f(a_, b_)),
  foldMap:
    <M>(M: Monoid<M>) =>
    <E, A>(rda: RemoteData<E, A>, f: (a: A) => M): M =>
      match<E, A, M>({
        notAsked: () => M.empty,
        loading: () => M.empty,
        failure: () => M.empty,
        success: (data) => f(data),
      })(rda),
};

/** @since 3.0.0 */
export const sequence: Traversable2<URI>['sequence'] =
  <F>(F: ApplicativeHKT<F>) =>
  <E, A>(ma: RemoteData<E, HKT<F, A>>): HKT<F, RemoteData<E, A>> =>
    match<E, HKT<F, A>, HKT<F, RemoteData<E, A>>>({
      notAsked: () => F.of(notAsked),
      loading: () => F.of(loading),
      success: (t) => F.map(t, success),
      failure: flow(failure, F.of),
    })(ma);

/** @since 3.0.0 */
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

/** @since 3.0.0 */
export const Traversable: Traversable2<URI> = {
  ...Functor,
  ...Foldable,
  sequence,
  traverse:
    <F>(F: ApplicativeHKT<F>) =>
    <E, A, B>(
      ta: RemoteData<E, A>,
      f: (a: A) => HKT<F, B>,
    ): HKT<F, RemoteData<E, B>> =>
      traverse(F)(f)(ta),
};

/** @since 3.0.0 */
export const alt =
  <E, A>(that: Lazy<RemoteData<E, A>>) =>
  (fa: RemoteData<E, A>): RemoteData<E, A> =>
    isSuccess(fa) ? fa : that();

/** @since 3.0.0 */
export const Alt: Alt2<URI> = {
  ...Functor,
  alt: (fa, that) => pipe(fa, alt(that)),
};

/** @since 3.0.0 */
export const remoteData = {
  ...MonadThrow,
  ...Bifunctor,
  ...Foldable,
  ...Traversable,
};

/** @since 3.0.0 */
export const {
  ap,
  apFirst,
  apSecond,
  bimap,
  chain,
  chainFirst,
  filterOrElse,
  flatten,
  fromEither,
  fromOption,
  fromPredicate,
  map,
  mapLeft,
} = pipeable(remoteData);

/** @since 3.0.0 */
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

/** @since 3.0.0 */
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

/** @since 3.0.0 */
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

/** @since 3.0.0 */
export const toNullable = <E = unknown, A = unknown>(
  rda: RemoteData<E, A>,
): A | null =>
  match<E, A, A | null>({
    notAsked: constNull,
    loading: constNull,
    success: identity,
    failure: constNull,
  })(rda);

/** @since 3.0.0 */
export const toOption = flow(toNullable, O.fromNullable);

/** @since 3.0.0 */
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

/** @since 3.0.0 */
export const swap = <E = unknown, A = unknown>(
  rda: RemoteData<E, A>,
): RemoteData<A, E> =>
  match<E, A, RemoteData<A, E>>({
    notAsked: () => notAsked,
    loading: () => loading,
    success: failure,
    failure: success,
  })(rda);

/** @since 3.0.0 */
export const mapFailure =
  <E = unknown, G = unknown, A = unknown>(f: (error: E) => G) =>
  (rda: RemoteData<E, A>): RemoteData<G, A> =>
    match<E, A, RemoteData<G, A>>({
      notAsked: () => notAsked,
      loading: () => loading,
      success,
      failure: (error) => failure(f(error)),
    })(rda);

/** @since 3.0.0 */
export const exists =
  <A = unknown>(predicate: Predicate<A>) =>
  <E = unknown>(rda: RemoteData<E, A>): boolean =>
    match<E, A, boolean>({
      notAsked: () => false,
      loading: () => false,
      failure: () => false,
      success: predicate,
    })(rda);

/** @since 3.0.0 */
export const elem =
  <A = unknown>(E: Eq<A>) =>
  <E = unknown>(a: A, rda: RemoteData<E, A>): boolean =>
    match<E, A, boolean>({
      notAsked: () => false,
      loading: () => false,
      failure: () => false,
      success: (b) => E.equals(a, b),
    })(rda);
