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

const data = require('wappalyzer/technologies.json');

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
  Sitefinity: {
    cats: [1],
    icon: 'Sitefinity.svg',
    cpe: 'cpe:/a:progress:sitefinity',
    implies: 'Microsoft ASP.NET',
    js: {
      'Telerik.Sitefinity': ''
    },
    meta: {
      generator: '^Sitefinity (\\S+)\\;version:\\1'
    },
    website: 'https://www.progress.com/sitefinity-cms',
    examples: [
      {
        name: 'with version and suffix',
        html:
          '</script><meta name="Generator" content="Sitefinity 11.0.6700.0 PE" /><link',
        version: '11.0.6700.0'
      },
      {
        name: 'with version and no suffix',
        html:
          '</script><meta name="Generator" content="Sitefinity 11.0.6700.0" /><link',
        version: '11.0.6700.0'
      }
    ]
  },
  'Telerik UI for ASP.NET AJAX': {
    cats: [59],
    cpe: 'telerik:ui_for_asp.net_ajax',
    js: {
      Telerik: ''
    },
    html: [
      '[<link|<script].*?Telerik\\.Web\\.UI\\.WebResource\\.axd',
      '[<link|<script].*?Telerik\\.Web\\.UI\\.WebResource\\.axd\\?.*?Telerik\\.Web\\.UI%2c\\+Version%3d(20.*?)%2c\\;version:\\1',
      '<!-- (\\d{4}\\.\\d\\.\\d{3}\\.\\d{2}) -->\\;version:\\1'
    ],
    website: 'https://www.telerik.com/products/aspnet-ajax.aspx',
    examples: [
      {
        name: 'with version',
        html:
          '<head><link href="/Telerik.Web.UI.WebResource.axd?compress=1&amp;_TSM_CombinedScripts_=%3b%3bTelerik.Web.UI%2c+Version%3d2014.2.724.40%2c+Culture%3dneutral%2c+PublicKeyToken%3d7a3d4%3aen-US%3af-7b88-4e1e-8026-2b8c288%3aed2942d4" type="text/css" rel="stylesheet" /></head>',
        version: '2014.2.724.40'
      },
      {
        name: 'with no version',
        html:
          '<script src="/Telerik.Web.UI.WebResource.axd?_TSM_HiddenField_=ctl02_TSM&amp;compress=0&amp;_TSM_CombinedScripts_=%3b%3bSystem.Web.Extensions%2c+Version%3d4.0.0.0%2c+Culture%3dneutral%2c+PublicKeyToken%3d7a3d4%3aen-US%3af-7b88-4e1e-8026-2b8c288%3aed2942d4" type="text/javascript"></script>',
        version: ''
      },
      {
        name: 'with version in comment',
        html: '\t<!-- 2016.1.113.45 --><ul',
        version: '2016.1.113.45'
      }
    ]
  }
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
