import { wappalyzer, technologies } from '../../helpers/simple-wappalyzer';

Object.keys(technologies).forEach((technology) => {
  if (technologies[technology].examples?.length) {
    describe(technology, () => {
      technologies[technology].examples.forEach((example, i) => {
        test(`example: ${example.name || i + 1}`, () => {
          const {
            headers = {},
            url = 'https://www.cisa.gov',
            html = ''
          } = example;
          const results = wappalyzer({
            url: url,
            data: html,
            headers: headers
          });
          let version = undefined;
          for (const result of results) {
            if (version === undefined) {
              version = result.version;
            }
            version = result.version || version;
          }
          expect(version).toEqual(example.version);
        });
      });
    });
  }
});
