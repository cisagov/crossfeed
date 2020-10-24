const whois = require('whois');
const Papa = require('papaparse');
const {default: PQueue} = require('p-queue');
const { differenceInDays } = require('date-fns');
const ORG_EXPORT_PATH = "/Users/ramaswania/Downloads/organizations-2020-10-23T14_12_49.057Z.csv";
const fs = require('fs');
const cache = require('node-file-cache').create();

(async () => {

const organizations = Papa.parse(fs.readFileSync(ORG_EXPORT_PATH, 'utf8'), { header: true }).data;
const rootDomains = organizations.map(e => e.rootDomains.split(",")).flat().filter(e => !e.endsWith(".gov") && !e.match(/state\...\.us$/));
const results = [];
const expirationDates = [];
const queue = new PQueue({ concurrency: 10 });
["hindscountyms.com"].forEach((domain, i) => queue.add(async () => {
    console.log(domain, i, rootDomains.length);
    let result;
    if (cache.get(domain) && cache.get(domain).indexOf("Rate Limit") === -1) {
        result = cache.get(domain);
    }
    else {
        if (cache.get(domain)?.indexOf("Rate Limit") === -1) { return; }
        console.warn('no cache');
        result = await new Promise((resolve, reject) => whois.lookup(domain, (err, data) => err ? reject(err) : resolve(data)));
        await new Promise(e => setTimeout(e, 10000));
        cache.set(domain, result, {life: 99999999999999});
    }
    results.push({domain, result});
    const match = result.match(/Registrar Registration Expiration Date: (.*)/);
    if (!match) {
        return;
    }
    const date = match[1];
    if (differenceInDays(new Date(date), new Date(Date.now())) <= 31) {
        console.log(domain, date);
        expirationDates.push({domain, date, soon: "Y"});
    } else {
        expirationDates.push({domain, date, soon: "N"});
    }
    
}));
await queue.onIdle();
fs.writeFileSync("results.json", JSON.stringify(results, null, 2));
fs.writeFileSync("expirationDates.csv", Papa.unparse(expirationDates.sort((a, b) => new Date(a.date) - new Date(b.date)), {columns: ['domain', 'date', 'soon']}));
})();
