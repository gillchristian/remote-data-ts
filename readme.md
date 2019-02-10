<h1 align="center">remote-data-ts</h1>

[![CircleCI](https://circleci.com/gh/gillchristian/remote-data-ts.svg?style=svg)](https://circleci.com/gh/gillchristian/remote-data-ts)

Represent fetched data and the statuses it can be in.

Inspired by Elm's
[krisajenkins/remotedata](https://package.elm-lang.org/packages/krisajenkins/remotedata/latest/RemoteData).

## Install

```
yarn add remote-data-ts

npm i remote-data-ts
```

## Usage

RemoteData defines the statuses a fetched data can be:

```ts
type RemoteData<Data, Err> = NotAsked | Loading | Success<Data> | Failure<Err>;
```

```tsx
import * as React from 'react';
import { render } from 'react-dom';
import { RemoteData, cata } from 'remote-data-ts';

import './styles.css';

interface ArticleProps {
  title: string;
  body: string;
}

const Article: React.SFC<ArticleProps> = ({ title, body }) => (
  <>
    <h1>{title}</h1>
    <p>{body}</p>
  </>
);

type State = RemoteData<ArticleProps, string>;

class App extends React.Component<void, State> {
  state = RemoteData.notAsked();

  componentDidMount() {
    this.setState(RemoteData.loading());

    fetch('https://jsonplaceholder.typicode.com/posts/1')
      .then((res) =>
        res.ok ? res.json() : new Error(`${res.status} ${res.statusText}`),
      )
      .then((article: ArticleProps) => {
        this.setState(RemoteData.success(article));
      })
      .catch((err: Error) => {
        this.setState(RemoteData.failure(err.message));
      });
  }

  render() {
    return (
      <div className="App">
        {cata<Article, string, React.ReactNode>({
          notAsked: () => null,
          loading: () => <div>... loading ...</div>,
          success: (article) => <Article {...article} />,
          error: (msg) => (
            <div className="red">Failed to load article: {msg}</div>
          ),
        })(this.state)}
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));
```

[![Edit kx6q84nk5o](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/kx6q84nk5o)

## API

Create instances:

```ts
RemoteData.notAsked(); // NotAsked

RemoteData.loading(); // Loading

RemoteData.of('foo'); // Success<string>
RemoteData.success('foo'); // Success<string>

RemoteData.failure(new Error('failed')); // Failure<Error>
```

Check status:

```ts
type ResolvedData<D, E> = Failure<E> | Success<D>;

const is: {
  notAsked: (rd: RemoteData<any, any>) => rd is NotAsked;
  loading: (rd: RemoteData<any, any>) => rd is Loading;
  success: (rd: RemoteData<any, any>) => rd is Success<any>;
  failure: (rd: RemoteData<any, any>) => rd is Failure<any>;
  loaded: (rd: RemoteData<any, any>) => rd is ResolvedData<any, any>;
};
```

Pattern match:

```ts
type Match<D, E, R> = {
  notAsked: () => R;
  loading: () => R;
  failure: (error: E) => R;
  success: (data: D) => R;
};

type cata = <D, E, R = void>(m: Match<D, E, R>) => (rd: RemoteData<D, E>) => R;
```

Transform:

```ts
type map = <D, E, R>(
  fn: (d: D) => R<D, R>,
) => (rd: RemoteData<D, E>) => RemoteData<R, E>;

type chain = <D, E, R>(
  fn: (d: D) => RemoteData<R, E>,
) => (rd: RemoteData<D, E>) => RemoteData<R, E>;

type ap = <D, E, R>(
  rdfn: RemoteData<(d: D) => R, E>,
) => (rd: RemoteData<D, E>) => RemoteData<R, E>;

type lift2 = <A, B, C, E>(
  f: (a: A) => (b: B) => C,
) => (rda: RemoteData<A, E>) => (rdb: RemoteData<B, E>) => RemoteData<C, E>;
```

Extract:

```ts
type fold = <D, E, R>(
  fn: (d: D) => R,
) => (def: R) => (rd: RemoteData<D, E>) => R;
```

## License

[MIT](https://github.com/gillchristian/remote-data-ts/blob/master/LICENSE) ©
2019 Christian Gill
