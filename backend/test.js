var whois = require('whois')
whois.lookup('cisa.gov', function(err, data) {
    console.log(data)
})