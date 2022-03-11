---
title: Home
nav_order: 1
---

<h1 align="center">remote-data-ts</h1>

Type to model asynchronous operations data and the statuses it can be in.

Inspired by Elm's
[krisajenkins/remotedata](https://package.elm-lang.org/packages/krisajenkins/remotedata/latest/RemoteData).

## Usage

RemoteData defines the statuses a fetched data can be:

```ts
type RemoteData<E, A> = NotAsked | Loading | Success<A> | Failure<E>;
```

```tsx
import React, { useState, useEffect, SFC } from 'react';
import { render } from 'react-dom';
import { pipe } from 'fp-ts/function';
import * as RD from 'remote-data-ts';

import './styles.css';

interface ArticleProps {
  title: string;
  body: string;
}

const Article: SFC<ArticleProps> = ({ title, body }) => (
  <>
    <h1>{title}</h1>
    <p>{body}</p>
  </>
);

type State = RD.RemoteData<ArticleProps, string>;

const App: SFC = () => {
  const [state, setState] = useState(RD.notAsked);

  useEffect(() => {
    setState(RD.loading);

    fetch('https://jsonplaceholder.typicode.com/posts/1')
      .then((res) =>
        res.ok ? res.json() : new Error(`${res.status} ${res.statusText}`),
      )
      .then((article: ArticleProps) => {
        setState(RD.success(article));
      })
      .catch((err: Error) => {
        setState(RD.failure(err.message));
      });
  }, []);

  return (
    <div className="App">
      {pipe(
        state,
        RD.match({
          notAsked: () => null,
          loading: () => <div>... loading ...</div>,
          success: (article) => <Article {...article} />,
          error: (msg) => (
            <div className="red">Failed to load article: {msg}</div>
          ),
        }),
      )}
    </div>
  );
};

render(<App />, document.getElementById('root'));
```

## License

[MIT](https://github.com/gillchristian/remote-data-ts/blob/master/LICENSE) ©
2022 Christian Gill
