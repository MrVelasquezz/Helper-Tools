const axios = require('axios')

module.exports = (session, data, ip, master, domain) => {
    return new Promise(async (res, rej) => {
        try {
            if (data && session) {
                /*
                    ? Как это работает?
                    * первый и тот что закоментирован сейчас, он добавляет новые записи в днс
                    * второй и на данный момент не закоментированный, удаляет
                    * Как? -> process.env.DNS_DOMAIN - должен быть даменом, от куда удаляем записи
                    *         process.env.DNS_IP - должен быть айпишником домена выше
                    *         elid - содержит в себе сперва название, а именно полное название, после тип - в данном случае это "А"
                    *                и айпишник, по которому идет удаление 
                */
                const write_new_sub = await axios.get(`https://ns.server-panel.net:1500/dnsmgr?auth=${session}`+
                    `&out=json&func=domain.record.edit&sok=ok&ip=${ip?ip:process.env.DNS_IP}&dtype=master&`+
                    `masterip=${master?master:process.env.DNS_MASTER}&plid=${domain?domain:process.env.dns_DOMAIN}&name=${data}`)

                //const write_new_sub = await axios.get(`https://ns.server-panel.net:1500/dnsmgr?auth=${session}&out=json&func=domain.record.edit&sok=ok&ip=
                //                      ${process.env.DNS_IP}&dtype=master&masterip=${process.env.DNS_MASTER}&plid=${process.env.DNS_DOMAIN}&elid=${data}.${process.env.dns_DOMAIN}. A  ${process.env.DNS_IP}`)
                if (write_new_sub && write_new_sub.data.doc.error) {
                    res({
                        error: true,
                        added: false
                    })
                } else if (write_new_sub && write_new_sub.data.doc) {
                    res({
                        error: false,
                        added: true
                    })
                } else {
                    res({
                        error: true,
                        added: false
                    })
                }
            } else {
                rej(null)
            }
        } catch (e) {
            rej(e)
        }
    })
}