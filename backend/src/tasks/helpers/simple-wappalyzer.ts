// Based on https://github.com/Kikobeats/simple-wappalyzer. This is a forked
// version of this library so that it uses additional, custom technologies.
// The original library is based on the following license:

// The MIT License (MIT)

// Copyright © 2020 Kiko Beats <josefrancisco.verdu@gmail.com> (kikobeats.com)

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import {
  setTechnologies,
  setCategories,
  analyze,
  resolve
} from 'wappalyzer-core';
import { chain, mapValues } from 'lodash';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Cookie } from 'tough-cookie';
import * as categories from 'wappalyzer/categories.json';
import * as _ from 'wappalyzer/technologies/_.json';
import * as a from 'wappalyzer/technologies/a.json';
import * as b from 'wappalyzer/technologies/b.json';
import * as c from 'wappalyzer/technologies/c.json';
import * as d from 'wappalyzer/technologies/d.json';
import * as e from 'wappalyzer/technologies/e.json';
import * as f from 'wappalyzer/technologies/f.json';
import * as g from 'wappalyzer/technologies/g.json';
import * as h from 'wappalyzer/technologies/h.json';
import * as i from 'wappalyzer/technologies/i.json';
import * as j from 'wappalyzer/technologies/j.json';
import * as k from 'wappalyzer/technologies/k.json';
import * as l from 'wappalyzer/technologies/l.json';
import * as m from 'wappalyzer/technologies/m.json';
import * as n from 'wappalyzer/technologies/n.json';
import * as o from 'wappalyzer/technologies/o.json';
import * as p from 'wappalyzer/technologies/p.json';
import * as q from 'wappalyzer/technologies/q.json';
import * as r from 'wappalyzer/technologies/r.json';
import * as s from 'wappalyzer/technologies/s.json';
import * as t from 'wappalyzer/technologies/t.json';
import * as u from 'wappalyzer/technologies/u.json';
import * as v from 'wappalyzer/technologies/v.json';
import * as w from 'wappalyzer/technologies/w.json';
import * as x from 'wappalyzer/technologies/x.json';
import * as y from 'wappalyzer/technologies/y.json';
import * as z from 'wappalyzer/technologies/z.json';
import * as customTechnologies from './technologies.json';

const fs = require('fs');
const path = require('path');

const outOfTheBoxTechnologies = {
  ..._,
  ...a,
  ...b,
  ...c,
  ...d,
  ...e,
  ...f,
  ...g,
  ...h,
  ...i,
  ...j,
  ...k,
  ...l,
  ...m,
  ...n,
  ...o,
  ...p,
  ...q,
  ...r,
  ...s,
  ...t,
  ...u,
  ...v,
  ...w,
  ...x,
  ...y,
  ...z
};

const parseCookie = (str) => {
  if (str) {
    const parsed = Cookie.parse(str);
    if (parsed) {
      return parsed.toJSON();
    }
  }
  return JSON.stringify('');
};

const getCookies = (str) =>
  chain(str)
    .castArray()
    .compact()
    .map(parseCookie)
    .map(({ key: name, ...props }) => ({ name, ...props }))
    .value();

const getHeaders = (headers) => mapValues(headers, (value) => [value]);

const getScripts = (scripts) =>
  chain(scripts).map('src').compact().uniq().value();

const getMeta = (document) =>
  Array.from(document.querySelectorAll('meta')).reduce(
    (acc: any, meta: any) => {
      const key = meta.getAttribute('name') || meta.getAttribute('property');
      if (key) acc[key.toLowerCase()] = [meta.getAttribute('content')];
      return acc;
    },
    {}
  );

export const technologies = {
  ...customTechnologies,
  ...outOfTheBoxTechnologies
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

for (const technology of Object.values(technologies)) {
  // Handles various regex errors with wappalyzer -- we get errors such as the following:
  // SyntaxError: Invalid regular expression: /link[href*='\/wp-content\/plugins\/amp\/']/: Range out of order in character class
  if ((technology as any).dom && typeof (technology as any).dom === 'string') {
    (technology as any).dom = escapeRegExp((technology as any).dom);
  }
  if ((technology as any).dom && Array.isArray((technology as any).dom)) {
    (technology as any).dom = (technology as any).dom.map(escapeRegExp);
  }
}

setTechnologies(technologies);
setCategories(categories);

export const wappalyzer = ({ data = '', url = '', headers = {} }) => {
  const dom = new JSDOM(data, {
    url: url,
    virtualConsole: new VirtualConsole()
  });

  return analyze({
    url: url,
    meta: getMeta(dom.window.document),
    headers: getHeaders(headers),
    scripts: getScripts(dom.window.document.scripts),
    cookies: getCookies(headers['set-cookie']),
    html: dom.serialize()
  });
};
