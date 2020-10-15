import { Functor2 } from 'fp-ts/lib/Functor';
import { Apply2 } from 'fp-ts/lib/Apply';
import { Applicative2 } from 'fp-ts/lib/Applicative';
import { Chain2 } from 'fp-ts/lib/Chain';
import { Monad2 } from 'fp-ts/lib/Monad';
import { MonadThrow2 } from 'fp-ts/lib/MonadThrow';
import { Bifunctor2 } from 'fp-ts/lib/Bifunctor';
import { pipeable } from 'fp-ts/lib/pipeable';
import { Monoid } from 'fp-ts/lib/Monoid';
import { Semigroup } from 'fp-ts/lib/Semigroup';

interface NotAsked {
  readonly tag: 'NotAsked';
}

interface Loading {
  readonly tag: 'Loading';
}

interface Success<D> {
  readonly tag: 'Success';
  readonly data: D;
}

interface Failure<E> {
  readonly tag: 'Failure';
  readonly error: E;
}

type RemoteData<E, D> = NotAsked | Loading | Failure<E> | Success<D>;

interface User {
  name: string;
}

const notAsked: RemoteData<never, never> = { tag: 'NotAsked' };

const loading: RemoteData<never, never> = { tag: 'Loading' };

const failure = <E = unknown>(error: E): RemoteData<E, never> => ({
  tag: 'Failure',
  error,
});

const success = <D = unknown>(data: D): RemoteData<never, D> => ({
  tag: 'Success',
  data,
});

const fold = <E = unknown, D = unknown, R = unknown>(matcher: {
  notAsked: () => R;
  loading: () => R;
  success: (data: D) => R;
  failure: (error: E) => R;
}) => (rd: RemoteData<E, D>): R => {
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

export const URI = 'RemoteData';

export type URI = typeof URI;

declare module 'fp-ts/lib/HKT' {
  interface URItoKind2<E, A> {
    readonly RemoteData: RemoteData<E, A>;
  }
}

const functor: Functor2<URI> = {
  URI,
  map: <E, A, B>(rda: RemoteData<E, A>, f: (a: A) => B): RemoteData<E, B> =>
    fold<E, A, RemoteData<E, B>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure,
      success: (data) => success(f(data)),
    })(rda),
};

// <E, A, B>(fab: RemoteData<F, E, (a: A) => B>, fa: RemoteData<F, E, A>) => RemoteData<F, E, B>

const apply: Apply2<URI> = {
  ...functor,
  ap: <E, A, B>(
    rdf: RemoteData<E, (a: A) => B>,
    rda: RemoteData<E, A>,
  ): RemoteData<E, B> =>
    fold<E, (a: A) => B, RemoteData<E, B>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure,
      success: (f) => functor.map(rda, f),
    })(rdf),
};

const applicative: Applicative2<URI> = {
  ...apply,
  of: success,
};

// <E, A, B>(fa: RemoteData<E, A>, f: (a: A) => RemoteData<E, B>) => RemoteData<E, B>

const chain: Chain2<URI> = {
  ...apply,
  chain: <E, A, B>(
    rda: RemoteData<E, A>,
    f: (a: A) => RemoteData<E, B>,
  ): RemoteData<E, B> =>
    fold<E, A, RemoteData<E, B>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure,
      success: (a) => f(a),
    })(rda),
};

const monad: Monad2<URI> = {
  ...chain,
  ...applicative,
};

const monadThrow: MonadThrow2<URI> = {
  ...monad,
  throwError: failure,
};

// bimap: <E, A, G, B>(fea: Kind2<F, E, A>, f: (e: E) => G, g: (a: A) => B) => Kind2<F, G, B>
// mapLeft: <E, A, G>(fea: Kind2<F, E, A>, f: (e: E) => G) => Kind2<F, G, A>

const bifunctor: Bifunctor2<URI> = {
  URI,
  bimap: <E, A, G, B>(
    rdea: RemoteData<E, A>,
    f: (e: E) => G,
    g: (a: A) => B,
  ): RemoteData<G, B> =>
    fold<E, A, RemoteData<G, B>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure: (error) => failure(f(error)),
      success: (data) => success(g(data)),
    })(rdea),
  mapLeft: <E, A, G>(rda: RemoteData<E, A>, f: (a: E) => G): RemoteData<G, A> =>
    fold<E, A, RemoteData<G, A>>({
      notAsked: () => notAsked,
      loading: () => loading,
      failure: (error) => failure(f(error)),
      success,
    })(rda),
};

export const remoteData = pipeable({
  ...monadThrow,
  ...bifunctor,
});

const getSemigroupFirst = <E, A>(): Semigroup<RemoteData<E, A>> => ({
  concat: (a: RemoteData<E, A>, b: RemoteData<E, A>) =>
    fold<E, A, RemoteData<E, A>>({
      notAsked: () => (b.tag === 'Success' ? b : a),
      loading: () => (b.tag === 'Success' ? b : a),
      failure: () => (b.tag === 'Success' ? b : a),
      success: (data) => success(data),
    })(a),
});

const getMonoidFirst = <E, A>(): Monoid<RemoteData<E, A>> => ({
  empty: notAsked,
  concat: getSemigroupFirst<E, A>().concat,
});

// Identity:    F.map(fa, a => a) <-> fa
//
// functor.map(rd, a => a) === rd
//
// Composition: F.map(fa, a => bc(ab(a))) <-> F.map(F.map(fa, ab), bc)
//
// functor.map(rd, a => bc(ab(a))) === functor.map(functor.map(rd, ab), bc)

// -----------------------------------------------------------------------------

interface User {
  name: string;
}

const jane = { name: 'Jane Doe' };
const mark = { name: 'Mark Twain' };

const fetchedUser = success<User>(jane);

const showMessage = fold<Error, User, string>({
  notAsked: () => 'notAsked',
  loading: () => 'loading',
  success: ({ name }) => 'success: ' + name,
  failure: ({ message }) => 'failure: ' + message,
});

showMessage(fetchedUser);

const getName = ({ name }: User) => name;
const getErrorMessage = ({ message }: Error) => message;

getName(jane); // string

getErrorMessage(new Error('Something went wrong'));

functor.map(fetchedUser, getName); // RemoteData<Error, string>

bifunctor.mapLeft(fetchedUser, getErrorMessage); // RemoteData<string, User>

bifunctor.bimap(fetchedUser, getErrorMessage, getName); // RemoteData<string, string>

const kill = (a: User) => (b: User) => `${a.name} kills ${b.name}`;

kill(jane)(mark); // 'Jane kills Mark'

// kill(success(jane))(success(mark));

apply.ap(
  apply.ap(applicative.of(kill), applicative.of(jane)),
  applicative.of(mark),
); // RemoteData<Error, string>

// { tag: 'Success', data: 'Jane kills Mark' }

const exclaim = ({ name }: User): RemoteData<Error, User> =>
  success({ name: name + '!' });

chain.chain(fetchedUser, exclaim); // RemoteData<Error, User>

const monoidFirstNumber = getMonoidFirst<Error, User>();

monoidFirstNumber.concat(success(jane), loading); // success(jane)
monoidFirstNumber.concat(loading, success(mark)); // success(mark)
monoidFirstNumber.concat(success(jane), success(mark)); // success(jane)
