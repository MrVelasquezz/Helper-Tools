const axios = require('axios')

module.exports = (uname, pass, domain) => {
    return new Promise(async (res, rej) => {
        try {
            const get_session = await axios.get(`https://ns.server-panel.net:1500/`+
                `dnsmgr?out=json&func=auth&username=${uname?uname:process.env.DNS_UNAME}&password=${pass?pass:process.env.DNS_PASS}`)

            if (get_session.data.doc && !get_session.data.doc.error) {
                const session = get_session.data.doc.auth.$

                const get_dns_list = await axios.get(`https://ns.server-panel.net:1500/dnsmgr?auth=${session}`+
                    `&out=json&func=domain.record&elid=${domain?domain:process.env.DNS_DOMAIN}&plid=`)

                if (get_dns_list.data.doc.elem && Array.isArray(get_dns_list.data.doc.elem)) {

                    let new_arr = await get_dns_list.data.doc.elem.map(item => {
                        dname = item.name.$.split('.')
                        if (dname.length >= 3) {
                            return {name: dname[0],
                                rkey: item.rtype_hidden.$}
                        }
                    })
                    
                    res([session, new_arr])
                }
                else if(get_dns_list.data.doc.error){
                    rej(get_dns_list.data.doc.error.$type)
                }
                else{
                    rej('Checker error. Doc elem not found')
                }
            }
            else{
                rej(get_session.data.doc.error.$type)
            }
        } catch (e) {
            rej(e)
        }
    })
}