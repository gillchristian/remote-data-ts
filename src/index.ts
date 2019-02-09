const enum Types {
  success = '__rd_success__',
  failure = '__rd_failure__',
  notAsked = '__rd_notAsked__',
  loading = '__rd_loading__',
}
interface Success<Data> {
  readonly _type: Types.success;
  readonly data: Data;
}
interface Failure<E> {
  readonly _type: Types.failure;
  readonly error: E;
}
interface NotAsked {
  readonly _type: Types.notAsked;
}
interface Loading {
  readonly _type: Types.loading;
}

export type RemoteData<D, E> = NotAsked | Loading | ResolvedData<D, E>;

// promises/tasks should resolve to ResolvedData
export type ResolvedData<D, E> = Failure<E> | Success<D>;

export const RemoteData = {
  of: <D, E>(data: D): Success<D> => ({ _type: Types.success, data }),
  notAsked: (): NotAsked => ({ _type: Types.notAsked }),
  loading: (): Loading => ({ _type: Types.loading }),
  failure: <D, E>(error: E): Failure<E> => ({ _type: Types.failure, error }),
  success: <D, E>(data: D): Success<D> => ({ _type: Types.success, data }),
};

const isNotAsked = (rd: RemoteData<any, any>): rd is NotAsked =>
  rd._type === Types.notAsked;
const isLoading = (rd: RemoteData<any, any>): rd is Loading =>
  rd._type === Types.loading;
const isSuccess = (rd: RemoteData<any, any>): rd is Success<any> =>
  rd._type === Types.success;
const isFailure = (rd: RemoteData<any, any>): rd is Failure<any> =>
  rd._type === Types.failure;

const isLoaded = (rd: RemoteData<any, any>): rd is ResolvedData<any, any> =>
  isSuccess(rd) || isFailure(rd);

export const is = {
  notAsked: isNotAsked,
  loading: isLoading,
  success: isSuccess,
  failure: isFailure,
  loaded: isLoaded,
};

interface Catafn<D, E, R> {
  notAsked: () => R;
  loading: () => R;
  failure: (error: E) => R;
  success: (data: D) => R;
}
export const cata = <D, E, R = void>(m: Catafn<D, E, R>) => (
  rd: RemoteData<D, E>,
): R => {
  if (isNotAsked(rd)) {
    return m.notAsked();
  }
  if (isLoading(rd)) {
    return m.loading();
  }
  if (isFailure(rd)) {
    return m.failure(rd.error);
  }
  return m.success(rd.data);
};

// map :: (a -> b) -> RemoteData E a -> RemoteData E b
type Mapfn<D, R> = (d: D) => R;
export const map = <D, E, R>(fn: Mapfn<D, R>) =>
  cata<D, E, RemoteData<R, E>>({
    notAsked: RemoteData.notAsked,
    loading: RemoteData.loading,
    failure: RemoteData.failure,
    success: (data) => RemoteData.of(fn(data)),
  });

// chain :: (a -> RemoteData E b) -> RemoteData E a -> RemoteData E b
type Chainfn<D, E, R> = (d: D) => RemoteData<R, E>;
export const chain = <D, E, R>(fn: Chainfn<D, E, R>) =>
  cata<D, E, RemoteData<R, E>>({
    notAsked: RemoteData.notAsked,
    loading: RemoteData.loading,
    failure: RemoteData.failure,
    success: (data) => fn(data),
  });

// fold :: (a -> b) -> b -> RemoteData E a -> b
type Foldfn<D, R> = (d: D) => R;
export const fold = <D, E, R>(fn: Foldfn<D, R>) => (def: R) =>
  cata<D, E, R>({
    notAsked: () => def,
    loading: () => def,
    failure: () => def,
    success: (data) => fn(data),
  });
