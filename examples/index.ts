import { pipe } from 'fp-ts/function';
import { sequenceS } from 'fp-ts/Apply';

import * as RD from '../src/index';

const putStrLn = (msg: string) => console.log(msg);

interface User {
  name: string;
}

const jane: User = { name: 'Jane' };
const mark: User = { name: 'Mark' };

/**
 * **Patterm matching**
 *
 * Consume `RemoteData` value by handling all the potential cases.
 */
const showMessage = RD.match<Error, string, string>({
  notAsked: () => 'notAsked',
  loading: () => 'loading',
  success: (msg) => 'success: ' + msg,
  failure: ({ message }) => 'failure: ' + message,
});

pipe(RD.of('Some message'), showMessage, putStrLn);

/**
 * **Functor**
 *
 * Functions that work on some regulars types (say `T`) can be "lifted" to work
 * on `RemoteData<E, T>` by using Functor's `map`
 */

const getName = ({ name }: User) => name;
const getErrorMessage = ({ message }: Error) => message;

// User -> string
getName(jane);

// Error -> string
getErrorMessage(new Error('Something went wrong'));

/**
 * **Functor**
 *
 * Functions that work on some regulars types (say `T`) can be "lifted" to work
 * on `RemoteData<E, T>` by using Functor's `map`
 */

const fetchedUser = RD.success(jane);

// RemoteData<Error, User> => RemoteData<Error, string>
pipe(fetchedUser, RD.map(getName));

/**
 * Note that `map` is only able to apply the mapping function when the
 * `RemoteData` is on `Success` state, otherwise the transformation is ignored.
 *
 * This behaviour is maintained in the functions from the other typeclasses. And
 * it is exactly what makes working with them great, one doesn't have to
 * imperatively check on every step if the value is there or not, we can apply
 * all the necessary transformations and combinations and then at the end do a
 * declaraty `match` to handle all the potential cases.
 */
pipe(RD.notAsked, RD.map(getName));
pipe(RD.loading, RD.map(getName));
pipe(RD.failure(new Error('Some error')), RD.map(getName));

/**
 * **Bifunctor**
 *
 * Since `RemoteData` takes to type arguments we can not only map on the
 * success, as we saw already, but also on the failure (ie. "the value on the left").
 */

// RemoteData<string, User> -> RemoteData<string, User>
pipe(fetchedUser, RD.mapLeft(getErrorMessage));

// RemoteData<Error, User> -> RemoteData<string, string>
pipe(fetchedUser, RD.bimap(getErrorMessage, getName));

/**
 * **Apply** / **Applicative**
 *
 * Sometimes applying a single argument function inside a `RemoteData` isn't
 * enough. We might have functions with several arguments we want to apply. We
 * can lift those as well by using `ap`.
 */

const loves = (a: User) => (b: User) => `${a.name} loves ${b.name}`;

pipe(loves(jane)(mark), (msg) => `Unlifted: ${msg}`, putStrLn);

// Apply one argument at a time
const apResult = pipe(
  // RemoteData<never, (user: User) => (user: User) => string>
  RD.of(loves),
  // RemoteData<never, (user: User) => string>
  RD.ap(RD.of(mark)),
  // RemoteData<never, string>
  RD.ap(RD.of(jane)),
);

pipe(
  apResult,
  RD.mapLeft(() => new Error('xD')),
  showMessage,
  putStrLn,
);

/**
 * `ap` is quite cumbersome to use. The `Apply` module provides `sequenceS` and
 * `sequenceT` (S as in struct, T as in tuple), they behave similarly to `Promise.all`.
 */

const sequenceRD = sequenceS(RD.Apply);

pipe(
  // { a: RemoteData<E, A>, b: RemoteData<E, B> } => RemoteData<E, { a: A, b: B }>
  //
  // { jane: RemoteData<E, User>, mark: RemoteData<E, User> }
  //   => RemoteData<E, { jane: User, mark: User }>
  sequenceRD({ jane: RD.of(jane), mark: RD.of(mark) }),
  RD.map(({ jane, mark }) => loves(jane)(mark)),
  showMessage,
  putStrLn,
);

/**
 * **Chain** / **Monad**
 *
 * Chain operations that return another `RemoteData`.
 *
 * When apply a function that goes from `A` to `RemoteData<E, B>`, using `map`
 * would result in nested `RemoteData`s.
 *
 * `chain` chandles that for us.
 */
const exclaim = ({ name }: User): RD.RemoteData<Error, User> =>
  RD.success({ name: name + '!' });

pipe(
  fetchedUser,
  // RemoteData<E, User> => RemoteData<E, RemoteData<E, User>>
  RD.map(exclaim),
);

const chainResult = pipe(
  fetchedUser,
  // RemoteData<E, User> => RemoteData<E, User>
  RD.chain(exclaim),
);

pipe(
  chainResult,
  RD.map((u) => u.name),
  showMessage,
  putStrLn,
);
