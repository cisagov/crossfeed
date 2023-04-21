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

import { setTechnologies, setCategories, analyze } from 'wappalyzer-core';
import { chain, mapValues } from 'lodash';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Cookie } from 'tough-cookie';

const data = {categories: {}, technologies: require('./technologies.json')};
const extraTechnologies = require('./technologies.json');

const parseCookie = (str) => Cookie!.parse(str)!.toJSON();

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
  ...data.technologies,
  ...extraTechnologies
};

setTechnologies(technologies);
setCategories(data.categories);

export const wappalyzer = ({ data = '', url = '', headers = {} }) => {
  const dom = new JSDOM(data, { url, virtualConsole: new VirtualConsole() });
  return analyze({
    url: url,
    meta: getMeta(dom.window.document),
    headers: getHeaders(headers),
    scripts: getScripts(dom.window.document.scripts),
    cookies: getCookies(headers['set-cookie']),
    html: dom.serialize()
  });
};
