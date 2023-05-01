require('dotenv').config()

const sub_geter = require('./dns/dns_subdomain_getter')
const sub_writer = require('./dns/dns_subdomain_writer')

async function main() {
    const from_ = {
        login: process.env.DNS_UNAME,
        pass: process.env.DNS_PASS,
        domain: 'DOMAIN FROM WHICH TO COPY',
        ip: 'DOMAIN IP',
        master: process.env.DNS_MASTER 
    }
    const to_ = {
        login: process.env.DNS_UNAME,   // if domains are in the same account
        pass: process.env.DNS_PASS,     // else just add some new variables in env
        domain: 'DOMAIN TO WHICH TO COPY',
        ip: 'DOMAIN IP',    // ip, where to redirrect trafic
        master: process.env.DNS_MASTER 
    }

    const sub_domain_data = await sub_geter(from_.login, from_.pass, from_.domain)
    sub_domain_data[1] = sub_domain_data[1].map(item => {
        if(item.rkey == 'A'){
            return item.name
        }
    }).filter(r => r != undefined)
    
    for(const item of sub_domain_data[1]){
        const writed = await sub_writer(sub_domain_data[0], item, to_.ip, to_.master, to_.domain)
        console.log(`Added: ${writed.added} Error: ${writed.error} Sname: ${item}`)
    }
};

main()