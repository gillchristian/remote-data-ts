---
title: index.ts
nav_order: 1
parent: Modules
---

## index overview

Type to model asynchronous operations data and the statuses it can be in.

```ts
type RemoteData<E, A> = NotAsked | Loading | Success<A> | Failure<E>;
```

Added in v3.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [Combinators](#combinators)
  - [apFirst](#apfirst)
  - [apS](#aps)
  - [apSecond](#apsecond)
  - [bind](#bind)
  - [bindTo](#bindto)
  - [chainFirst](#chainfirst)
  - [filterOrElse](#filterorelse)
  - [flap](#flap)
  - [flatten](#flatten)
  - [mapFailure](#mapfailure)
  - [swap](#swap)
- [Constructors](#constructors)
  - [failure](#failure)
  - [fromPredicate](#frompredicate)
  - [loading](#loading)
  - [notAsked](#notasked)
  - [of](#of)
  - [success](#success)
- [Destructors](#destructors)
  - [getOrElse](#getorelse)
  - [match](#match)
  - [toNullable](#tonullable)
- [Instance operations](#instance-operations)
  - [alt](#alt)
  - [ap](#ap)
  - [bimap](#bimap)
  - [chain](#chain)
  - [foldMap](#foldmap)
  - [map](#map)
  - [mapLeft](#mapleft)
  - [reduce](#reduce)
  - [reduceRight](#reduceright)
  - [sequence](#sequence)
  - [traverse](#traverse)
- [Instances](#instances)
  - [Alt](#alt)
  - [Applicative](#applicative)
  - [Apply](#apply)
  - [Bifunctor](#bifunctor)
  - [Chain](#chain)
  - [Foldable](#foldable)
  - [FromEither](#fromeither)
  - [Functor](#functor)
  - [Monad](#monad)
  - [MonadThrow](#monadthrow)
  - [Traversable](#traversable)
  - [URI](#uri)
  - [URI (type alias)](#uri-type-alias)
  - [getEq](#geteq)
  - [getOrd](#getord)
- [Model](#model)
  - [Failure (interface)](#failure-interface)
  - [Loading (interface)](#loading-interface)
  - [NotAsked (interface)](#notasked-interface)
  - [RemoteData (type alias)](#remotedata-type-alias)
  - [Success (interface)](#success-interface)
- [Natural transformations](#natural-transformations)
  - [fromOption](#fromoption)
  - [toEither](#toeither)
  - [toOption](#tooption)
- [Refinements](#refinements)
  - [isFailure](#isfailure)
  - [isLoading](#isloading)
  - [isNotAsked](#isnotasked)
  - [isSuccess](#issuccess)
- [Utils](#utils)
  - [elem](#elem)
  - [exists](#exists)

---

# Combinators

## apFirst

**Signature**

```ts
export declare const apFirst: <E, B>(
  second: RemoteData<E, B>,
) => <A>(first: RemoteData<E, A>) => RemoteData<E, A>;
```

Added in v3.0.0

## apS

**Signature**

```ts
export declare const apS: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  fb: RemoteData<E, B>,
) => (
  fa: RemoteData<E, A>,
) => RemoteData<
  E,
  { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }
>;
```

Added in v3.0.0

## apSecond

**Signature**

```ts
export declare const apSecond: <E, B>(
  second: RemoteData<E, B>,
) => <A>(first: RemoteData<E, A>) => RemoteData<E, B>;
```

Added in v3.0.0

## bind

**Signature**

```ts
export declare const bind: <N, A, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => RemoteData<E, B>,
) => (
  ma: RemoteData<E, A>,
) => RemoteData<
  E,
  { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }
>;
```

Added in v3.0.0

## bindTo

**Signature**

```ts
export declare const bindTo: <N>(
  name: N,
) => <E, A>(fa: RemoteData<E, A>) => RemoteData<E, { readonly [K in N]: A }>;
```

Added in v3.0.0

## chainFirst

**Signature**

```ts
export declare const chainFirst: <A, E, B>(
  f: (a: A) => RemoteData<E, B>,
) => (first: RemoteData<E, A>) => RemoteData<E, A>;
```

Added in v3.0.0

## filterOrElse

**Signature**

```ts
export declare const filterOrElse: {
  <A, B, E>(refinement: Refinement<A, B>, onFalse: (a: A) => E): (
    ma: RemoteData<E, A>,
  ) => RemoteData<E, B>;
  <A, E>(predicate: Predicate<A>, onFalse: (a: A) => E): <B>(
    mb: RemoteData<E, B>,
  ) => RemoteData<E, B>;
  <A, E>(predicate: Predicate<A>, onFalse: (a: A) => E): (
    ma: RemoteData<E, A>,
  ) => RemoteData<E, A>;
};
```

Added in v3.0.0

## flap

**Signature**

```ts
export declare const flap: <A>(
  a: A,
) => <E, B>(fab: RemoteData<E, (a: A) => B>) => RemoteData<E, B>;
```

Added in v3.0.0

## flatten

**Signature**

```ts
export declare const flatten: <E, A>(
  mma: RemoteData<E, RemoteData<E, A>>,
) => RemoteData<E, A>;
```

Added in v3.0.0

## mapFailure

**Signature**

```ts
export declare const mapFailure: <E, G>(
  f: (a: E) => G,
) => <A>(rda: RemoteData<E, A>) => RemoteData<G, A>;
```

Added in v3.0.0

## swap

**Signature**

```ts
export declare const swap: <E = unknown, A = unknown>(
  rda: RemoteData<E, A>,
) => RemoteData<A, E>;
```

Added in v3.0.0

# Constructors

## failure

**Signature**

```ts
export declare const failure: <E = unknown>(error: E) => RemoteData<E, never>;
```

Added in v3.0.0

## fromPredicate

**Signature**

```ts
export declare const fromPredicate: {
  <A, B, E>(refinement: Refinement<A, B>, onFalse: (a: A) => E): (
    a: A,
  ) => RemoteData<E, B>;
  <A, E>(predicate: Predicate<A>, onFalse: (a: A) => E): <B>(
    b: B,
  ) => RemoteData<E, B>;
  <A, E>(predicate: Predicate<A>, onFalse: (a: A) => E): (
    a: A,
  ) => RemoteData<E, A>;
};
```

Added in v3.0.0

## loading

**Signature**

```ts
export declare const loading: RemoteData<never, never>;
```

Added in v3.0.0

## notAsked

**Signature**

```ts
export declare const notAsked: RemoteData<never, never>;
```

Added in v3.0.0

## of

**Signature**

```ts
export declare const of: <D = unknown>(data: D) => RemoteData<never, D>;
```

Added in v3.0.0

## success

**Signature**

```ts
export declare const success: <D = unknown>(data: D) => RemoteData<never, D>;
```

Added in v3.0.0

# Destructors

## getOrElse

**Signature**

```ts
export declare const getOrElse: <E = unknown, A = unknown>(
  onNotAsked: () => A,
  onLoading: () => A,
  onFailure: (err: E) => A,
) => (rda: RemoteData<E, A>) => A;
```

Added in v3.0.0

## match

**Signature**

```ts
export declare const match: <E = unknown, D = unknown, R = unknown>(matcher: {
  notAsked: () => R;
  loading: () => R;
  success: (data: D) => R;
  failure: (error: E) => R;
}) => (rd: RemoteData<E, D>) => R;
```

Added in v3.0.0

## toNullable

**Signature**

```ts
export declare const toNullable: <E = unknown, A = unknown>(
  rda: RemoteData<E, A>,
) => A | null;
```

Added in v3.0.0

# Instance operations

## alt

**Signature**

```ts
export declare const alt: <E, A>(
  that: Lazy<RemoteData<E, A>>,
) => (fa: RemoteData<E, A>) => RemoteData<E, A>;
```

Added in v3.0.0

## ap

**Signature**

```ts
export declare const ap: <E, A>(
  rda: RemoteData<E, A>,
) => <B>(rdfab: RemoteData<E, (a: A) => B>) => RemoteData<E, B>;
```

Added in v3.0.0

## bimap

**Signature**

```ts
export declare const bimap: <E, A, G, B>(
  f: (e: E) => G,
  g: (a: A) => B,
) => (rdea: RemoteData<E, A>) => RemoteData<G, B>;
```

Added in v3.0.0

## chain

**Signature**

```ts
export declare const chain: <E, A, B>(
  f: (a: A) => RemoteData<E, B>,
) => (rda: RemoteData<E, A>) => RemoteData<E, B>;
```

Added in v3.0.0

## foldMap

**Signature**

```ts
export declare const foldMap: <M>(
  M: Monoid<M>,
) => <A>(f: (a: A) => M) => <E>(rda: RemoteData<E, A>) => M;
```

Added in v3.0.0

## map

**Signature**

```ts
export declare const map: <A, B>(
  f: (a: A) => B,
) => <E>(rda: RemoteData<E, A>) => RemoteData<E, B>;
```

Added in v3.0.0

## mapLeft

**Signature**

```ts
export declare const mapLeft: <E, G>(
  f: (a: E) => G,
) => <A>(rda: RemoteData<E, A>) => RemoteData<G, A>;
```

Added in v3.0.0

## reduce

**Signature**

```ts
export declare const reduce: <E, A, B>(
  b: B,
  f: (b: B, a: A) => B,
) => (rda: RemoteData<E, A>) => B;
```

Added in v3.0.0

## reduceRight

**Signature**

```ts
export declare const reduceRight: <E, A, B>(
  b: B,
  f: (a: A, b: B) => B,
) => (rda: RemoteData<E, A>) => B;
```

Added in v3.0.0

## sequence

**Signature**

```ts
export declare const sequence: Sequence2<'RemoteData'>;
```

Added in v3.0.0

## traverse

**Signature**

```ts
export declare const traverse: PipeableTraverse2<'RemoteData'>;
```

Added in v3.0.0

# Instances

## Alt

**Signature**

```ts
export declare const Alt: Alt2<'RemoteData'>;
```

Added in v3.0.0

## Applicative

**Signature**

```ts
export declare const Applicative: Applicative2<'RemoteData'>;
```

Added in v3.0.0

## Apply

**Signature**

```ts
export declare const Apply: Apply2<'RemoteData'>;
```

Added in v3.0.0

## Bifunctor

**Signature**

```ts
export declare const Bifunctor: Bifunctor2<'RemoteData'>;
```

Added in v3.0.0

## Chain

**Signature**

```ts
export declare const Chain: Chain2<'RemoteData'>;
```

Added in v3.0.0

## Foldable

**Signature**

```ts
export declare const Foldable: Foldable2<'RemoteData'>;
```

Added in v3.0.0

## FromEither

**Signature**

```ts
export declare const FromEither: FromEither2<'RemoteData'>;
```

Added in v3.0.0

## Functor

**Signature**

```ts
export declare const Functor: Functor2<'RemoteData'>;
```

Added in v3.0.0

## Monad

**Signature**

```ts
export declare const Monad: Monad2<'RemoteData'>;
```

Added in v3.0.0

## MonadThrow

**Signature**

```ts
export declare const MonadThrow: MonadThrow2<'RemoteData'>;
```

Added in v3.0.0

## Traversable

**Signature**

```ts
export declare const Traversable: Traversable2<'RemoteData'>;
```

Added in v3.0.0

## URI

**Signature**

```ts
export declare const URI: 'RemoteData';
```

Added in v3.0.0

## URI (type alias)

**Signature**

```ts
export type URI = typeof URI;
```

Added in v3.0.0

## getEq

**Signature**

```ts
export declare function getEq<E, A>(
  eqErr: Eq<E>,
  eqA: Eq<A>,
): Eq<RemoteData<E, A>>;
```

Added in v3.0.0

## getOrd

**Signature**

```ts
export declare function getOrd<E, A>(
  ordErr: Ord<E>,
  ordA: Ord<A>,
): Ord<RemoteData<E, A>>;
```

Added in v3.0.0

# Model

## Failure (interface)

**Signature**

```ts
export interface Failure<E = unknown> {
  readonly tag: 'Failure';
  readonly error: E;
}
```

Added in v3.0.0

## Loading (interface)

**Signature**

```ts
export interface Loading {
  readonly tag: 'Loading';
}
```

Added in v3.0.0

## NotAsked (interface)

**Signature**

```ts
export interface NotAsked {
  readonly tag: 'NotAsked';
}
```

Added in v3.0.0

## RemoteData (type alias)

**Signature**

```ts
export type RemoteData<E = unknown, A = unknown> =
  | NotAsked
  | Loading
  | Failure<E>
  | Success<A>;
```

Added in v3.0.0

## Success (interface)

**Signature**

```ts
export interface Success<A = unknown> {
  readonly tag: 'Success';
  readonly data: A;
}
```

Added in v3.0.0

# Natural transformations

## fromOption

**Signature**

```ts
export declare const fromOption: <E>(
  onNone: Lazy<E>,
) => NaturalTransformation12C<'Option', 'RemoteData', E>;
```

Added in v3.0.0

## toEither

**Signature**

```ts
export declare const toEither: <E = unknown, L = unknown>(
  onNotAsked: () => L,
  onLoading: () => L,
  onFailure: (err: E) => L,
) => <A = unknown>(rda: RemoteData<E, A>) => E.Either<L, A>;
```

Added in v3.0.0

## toOption

**Signature**

```ts
export declare const toOption: <E = unknown, A = unknown>(
  rda: RemoteData<E, A>,
) => O.Option<NonNullable<A>>;
```

Added in v3.0.0

# Refinements

## isFailure

**Signature**

```ts
export declare const isFailure: (
  rd: RemoteData<unknown, unknown>,
) => rd is Failure<unknown>;
```

Added in v3.0.0

## isLoading

**Signature**

```ts
export declare const isLoading: (
  rd: RemoteData<unknown, unknown>,
) => rd is Loading;
```

Added in v3.0.0

## isNotAsked

**Signature**

```ts
export declare const isNotAsked: (
  rd: RemoteData<unknown, unknown>,
) => rd is NotAsked;
```

Added in v3.0.0

## isSuccess

**Signature**

```ts
export declare const isSuccess: (
  rd: RemoteData<unknown, unknown>,
) => rd is Success<unknown>;
```

Added in v3.0.0

# Utils

## elem

**Signature**

```ts
export declare const elem: <A = unknown>(
  E: Eq<A>,
) => <E = unknown>(a: A, rda: RemoteData<E, A>) => boolean;
```

Added in v3.0.0

## exists

**Signature**

```ts
export declare const exists: <A = unknown>(
  predicate: Predicate<A>,
) => <E = unknown>(rda: RemoteData<E, A>) => boolean;
```

Added in v3.0.0
