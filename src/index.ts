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
  _type: Types.notAsked;
}
interface Loading {
  _type: Types.loading;
}

export type RemoteData<D, E> = NotAsked | Loading | ResolvedData<D, E>;

// promises/tasks should resolve to ResolvedData
export type ResolvedData<D, E> = Failure<E> | Success<D>;

export const RemoteData = {
  notAsked: (): NotAsked => ({ _type: Types.notAsked }),
  loading: (): Loading => ({ _type: Types.loading }),
  failure: <D, E>(error: E): Failure<E> => ({ _type: Types.failure, error }),
  success: <D, E>(data: D): Success<D> => ({ _type: Types.success, data }),
};

export const isNotAsked = (rd: RemoteData<any, any>): rd is NotAsked =>
  rd._type === Types.notAsked;
export const isLoading = (rd: RemoteData<any, any>): rd is Loading =>
  rd._type === Types.loading;
export const isSuccess = (rd: RemoteData<any, any>): rd is Success<any> =>
  rd._type === Types.success;
export const isFailure = (rd: RemoteData<any, any>): rd is Failure<any> =>
  rd._type === Types.failure;

export const isLoaded = (rd: RemoteData<any, any>) =>
  isSuccess(rd) || isFailure(rd);

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

type Mapfn<D, R> = (d: D) => R;
export const map = <D, E, R>(fn: Mapfn<D, R>) =>
  cata<D, E, RemoteData<R, E>>({
    notAsked: RemoteData.notAsked,
    loading: RemoteData.loading,
    failure: RemoteData.failure,
    success: (data) => RemoteData.success(fn(data)),
  });

type Chainfn<D, E, R> = (d: D) => RemoteData<R, E>;
export const chain = <D, E, R>(fn: Chainfn<D, E, R>) =>
  cata<D, E, RemoteData<R, E>>({
    notAsked: RemoteData.notAsked,
    loading: RemoteData.loading,
    failure: RemoteData.failure,
    success: (data) => fn(data),
  });

type Foldfn<D, R> = (acc: R, d: D) => R;
export const fold = <D, E, R>(fn: Foldfn<D, R>) => (def: R) =>
  cata<D, E, R>({
    notAsked: () => def,
    loading: () => def,
    failure: () => def,
    success: (data) => fn(def, data),
  });
