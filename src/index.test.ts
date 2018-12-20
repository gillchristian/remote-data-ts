import { RemoteData, cata, map, fold, chain, isLoaded } from './';

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

  describe('map', () => {
    it('maps only the success case', () => {
      const toSuccessStr = map(() => 'success');

      const notAsked = RemoteData.notAsked();
      const loading = RemoteData.loading();
      const success = RemoteData.success('foo');
      const failure = RemoteData.failure('bar');

      expect(toSuccessStr(notAsked)).toEqual(notAsked);
      expect(toSuccessStr(loading)).toEqual(loading);
      expect(toSuccessStr(failure)).toEqual(failure);

      expect(toSuccessStr(success)).toEqual(RemoteData.success('success'));
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
