import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';

// import { createRoot } from 'react-dom/client';

// // …

// const container = document.getElementById('root');
// if (!container) throw new Error('container not found!');

// const root = createRoot(container);

// root.render(<StrictMode> … </StrictMode>);

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
