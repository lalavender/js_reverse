import requests


headers = {
    "accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "referer": "https://s.taobao.com/search?boxFilterList=&clientPreloadId=preload_1785580435484&commend=all&ie=utf8&initiative_id=tbindexz_20170306&page=1&preLoadOrigin=https%3A%2F%2Fwww.taobao.com&q=%E7%B4%AB%E7%A0%82%E5%A3%B6&search_type=item&sourceId=tb.index&spm=a21bo.jianhua%2Fa.search_hover.0&ssid=s5-e&tab=all",
    "sec-ch-ua": "\"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"150\", \"Google Chrome\";v=\"150\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "script",
    "sec-fetch-mode": "no-cors",
    "sec-fetch-site": "same-site",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
}
cookies = {
    "mtop_partitioned_detect": "1",
    "_m_h5_tk": "b35a76001f78e1b57a72e693b8943407_1785590612129",
    "_m_h5_tk_enc": "eed745087bef0983b92ebdb55de47045",
    "xlly_s": "1",
    "cookie2": "16492abd8577cf245dcf3cc24a89f14a",
    "t": "98ad71ff0711fdace99506bc0cd166ac",
    "_tb_token_": "73e58333b0468",
    "thw": "cn",
    "sca": "55835ca7",
    "_samesite_flag_": "true",
    "3PcFlag": "1785580304249",
    "wk_cookie2": "1fb726d59b2e9e027dc62f94703be216",
    "wk_unb": "UUtO8RVAffu19Q%3D%3D",
    "sgcookie": "E100z0KWMQ21wSH4HF241kK4JM%2Bg3hpi4ckS9OnqvWtPpYknZ9PrHqhRJWKOwnSP%2FuBxYGOwsIxMBtpXQ3CN9SxyQOKVI6Shm8nmGBzo4%2BtTtXqdbmp8rzcKiKdukvNcluxf",
    "_hvn_lgc_": "0",
    "havana_lgc2_0": "eyJoaWQiOjIzNTk1NjkxOTIsInNnIjoiOWQ3NmYyZDcxZWM5MTY4ZDlkODM5YTRlNzZlMWU1NWYiLCJzaXRlIjowLCJ0b2tlbiI6IjFrRzZCbE83R0dGYjhDSkp3SVdTTEVnIn0",
    "unb": "2359569192",
    "csg": "a07c5148",
    "lgc": "xxqyhqg%5Cu9B54%5Cu9B42",
    "cancelledSubSites": "empty",
    "cookie17": "UUtO8RVAffu19Q%3D%3D",
    "dnk": "zimo4831",
    "skt": "b786cfb4020175a0",
    "tracknick": "xxqyhqg%5Cu9B54%5Cu9B42",
    "_l_g_": "Ug%3D%3D",
    "sg": "%E9%AD%8229",
    "_nk_": "xxqyhqg%5Cu9B54%5Cu9B42",
    "cookie1": "W8gxYKR2hNWvhFvGFH1icEV30f0lCAIANOSRSGynJG0%3D",
    "uc1": "cookie16=UIHiLt3xCS3yM2h4eKHS9lpEOw%3D%3D&pas=0&cookie15=Vq8l%2BKCLz3%2F65A%3D%3D&existShop=false&cookie14=UoYWONoVdtLH2A%3D%3D&cookie21=U%2BGCWk%2F7p4mBoUyS4E9C",
    "sn": "",
    "uc3": "lg2=VFC%2FuZ9ayeYq2g%3D%3D&nk2=G5hsyZbgohOsUsI%3D&id2=UUtO8RVAffu19Q%3D%3D&vt3=F8dD1NjJ2V9a8X57iek%3D",
    "existShop": "MTc4NTU4MDM5Mg%3D%3D",
    "uc4": "id4=0%40U2l0tMT1kj8%2BbUqQRdhaIJ6aCG25&nk4=0%40GSsMoXB%2BjkCcWNt80ETkTcx56uddtw%3D%3D",
    "_cc_": "WqG3DMC9EA%3D%3D",
    "havana_sdkSilent": "1785609195096",
    "aui": "2359569192",
    "ultraCookieBase": "1k6S5%2BcxkgQpZDoYFhQYZMBQdpyyXeKO3bebvromwgHVWPSbBJcf7GuYQ01kMKNIw48WXBozKegAjnf3hBCUnEN5BS8Hr00dL2Kth2eW%2FZSgyTtGI%2BxaW4dRcEYcXmJY4S5iZQThnBG%2B3uJ%2Bo52Fgfp%2Bs8UY5kd2tGXrrEihSME9OoMiVOhR1PT3acY7e1Iqka6jmsEfD4sh%2F105vnifI6NFsaQDIaunFKzZczkikysBIHEeFdvfhfOheQKcI%2BoT53%2BgciiafHQZU1erfnOzzyMKkzwyhpyfCWUeCUaIku6TOwSofqGtddqbNLWRYbpMngRw%3D",
    "havana_lgc_exp": "1816684961943",
    "sdkSilent": "1785609761943",
    "tfstk": "heUj640TUnQSIq0Nqweed_30ZVuOlRkZQ5HtGYDvu5HZ5Rw_CxoOnqz_F5eCifW07qVmSwWHqGaj2Lh_wjKxWKNxoI3OL97e4Qnc3-oqxADTw_GZsfKTBcn-2Xk-6n3TBYn-9XJxWVeTw_GZ_fKtWFpJwfhtWAetW_N-EfgtMR3ON7Ho6ab8y9WByppY9Erv8pkLMxF4gYTE0vPxF9B7PFmbzD9ngfuTDSySYo6BloNYxRcLHKBjNrNQ5keRzEg_wkUsyHlB7nUZ7sf3GSEz1HsR-PH884epvgfhefqbzWp5oM4thrEYfBIzRs2zekzw3NacnYZEoRY5erbaiSF0BhS_kOUbRlnwRaEMjtxHKSNSkCpoDbcj4_1WHlmxZbUY7_t0jmhoaiC5NKEG.",
    "isg": "BHt7OPxjle-3Talbl-SGFEVtClnl0I_SOgyJ2W04kHrlzJ-u9aUoIsBK5myCbOfK"
}
url = "https://h5api.m.taobao.com/h5/mtop.relationrecommend.wirelessrecommend.recommend/2.0/"
params = {
    "jsv": "2.7.4",
    "appKey": "12574478",
    "t": "1785581145188",
    "sign": "00e62203ab93d07f7dde90d184cc1d56",
    "api": "mtop.relationrecommend.wirelessrecommend.recommend",
    "v": "2.0",
    "timeout": "10000",
    "type": "jsonp",
    "dataType": "jsonp",
    "callback": "mtopjsonp23",
    "data": "{\"appId\":\"34385\",\"params\":\"{\\\"device\\\":\\\"HMA-AL00\\\",\\\"isBeta\\\":\\\"false\\\",\\\"grayHair\\\":\\\"false\\\",\\\"from\\\":\\\"nt_history\\\",\\\"brand\\\":\\\"HUAWEI\\\",\\\"info\\\":\\\"wifi\\\",\\\"index\\\":\\\"4\\\",\\\"rainbow\\\":\\\"\\\",\\\"schemaType\\\":\\\"auction\\\",\\\"elderHome\\\":\\\"false\\\",\\\"isEnterSrpSearch\\\":\\\"true\\\",\\\"newSearch\\\":\\\"false\\\",\\\"network\\\":\\\"wifi\\\",\\\"subtype\\\":\\\"\\\",\\\"hasPreposeFilter\\\":\\\"false\\\",\\\"prepositionVersion\\\":\\\"v2\\\",\\\"client_os\\\":\\\"Android\\\",\\\"gpsEnabled\\\":\\\"false\\\",\\\"searchDoorFrom\\\":\\\"srp\\\",\\\"debug_rerankNewOpenCard\\\":\\\"false\\\",\\\"homePageVersion\\\":\\\"v7\\\",\\\"searchElderHomeOpen\\\":\\\"false\\\",\\\"search_action\\\":\\\"initiative\\\",\\\"sugg\\\":\\\"_4_1\\\",\\\"sversion\\\":\\\"13.6\\\",\\\"style\\\":\\\"list\\\",\\\"ttid\\\":\\\"600000@taobao_pc_10.7.0\\\",\\\"needTabs\\\":\\\"true\\\",\\\"areaCode\\\":\\\"CN\\\",\\\"vm\\\":\\\"nw\\\",\\\"countryNum\\\":\\\"156\\\",\\\"m\\\":\\\"pc\\\",\\\"page\\\":1,\\\"n\\\":48,\\\"q\\\":\\\"%E7%B4%AB%E7%A0%82%E5%A3%B6\\\",\\\"qSource\\\":\\\"url\\\",\\\"pageSource\\\":\\\"a21bo.jianhua/a.search_hover.0\\\",\\\"channelSrp\\\":\\\"\\\",\\\"tab\\\":\\\"all\\\",\\\"pageSize\\\":\\\"49\\\",\\\"totalPage\\\":\\\"100\\\",\\\"totalResults\\\":\\\"207057\\\",\\\"sourceS\\\":\\\"0\\\",\\\"sort\\\":\\\"_coefp\\\",\\\"bcoffset\\\":\\\"\\\",\\\"ntoffset\\\":\\\"\\\",\\\"filterTag\\\":\\\"\\\",\\\"service\\\":\\\"\\\",\\\"prop\\\":\\\"\\\",\\\"loc\\\":\\\"\\\",\\\"start_price\\\":null,\\\"end_price\\\":null,\\\"startPrice\\\":null,\\\"endPrice\\\":null,\\\"itemIds\\\":null,\\\"p4pIds\\\":null,\\\"p4pS\\\":null,\\\"categoryp\\\":\\\"\\\",\\\"ha3Kvpairs\\\":null,\\\"myCNA\\\":\\\"\\\",\\\"screenResolution\\\":\\\"1920x1080\\\",\\\"viewResolution\\\":\\\"1905x3264\\\",\\\"userAgent\\\":\\\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36\\\",\\\"couponUnikey\\\":\\\"\\\",\\\"subTabId\\\":\\\"\\\",\\\"np\\\":\\\"\\\",\\\"clientType\\\":\\\"h5\\\",\\\"isNewDomainAb\\\":\\\"false\\\",\\\"forceOldDomain\\\":\\\"false\\\"}\"}",
    # "bx-ua": "234\\u0021gfJeKVTbeePWOjmdO18YnpJwzIAqwKzkWPV1mcGLuiqGP6O5LcyVETgw8FllmCj16T1xv2Ko+UGTLSUBOIt23KMgAKg69cHeU1xOYnzmH6UhfFVw1vQBuY6wU9u4q4dukXKTaSQpMr0OXnafTNRxc2iGyJsqsDF1sApBwhLlHI6+fw2Zn3UH9AJdhwF+ObcOCd+/BtJdOC6NirLZZ3wH9idThpoZnkp/cAjenL5cQCyN02cZn3UH9gdSdvnZnks/c24HVIoHOQ4NhstZZ3wd9iJTCvlZQkksgsJH+nodOQPNhscVZYEd9iyZCvv+/kk5cs4HAeWLQCyNhsrtZ3wd9ibaCPX+v3k+c257nZodQCymhxuZekUd9AdJhLoZQ8DbTO08Z3oHQQVmhskZVPYQoaEZhL6TQpP3czaelY/dQQymP4+ueEHTToOTaVkMOtM/c247n3odQQVNiyIZj4UWzjEX//OuwykDc247ZZoHQmS2AdBhZ3wT9U6HhLZZQks/vVNHukeRyZuagPjCUP4+EwnpkTy+VEmMJFv8PTwxiJvft8rGaSmEDFrVtreagJI9+jZSkw/DS7ubgwXWfta+6jlSK4CCOBWxJ14RPjVcizB75iDpwCajdjlNzHD9A+LI3z1YSPObd+evvqfjRaXwYNX/b5iye2BB/BFBP1mDprKTamJvM26wu9FUAptrU2PAh7Gq/bAZh5LFV1N/o9dC/RGWsdBY2vyI3qvQgB6BnWS5KiIwpEKPiJVyN8GsTgdNl6ISjoD43tLNAdBCU0pKj87gxXXcPxppxt5CvCBYBuYo4VUOE/YnqoVKu9IlVk0AFErkZyzg+MTP5ye2xbdZofCqmHeSAnb1fJi2Zj7fd+HbQummc8qKPm7/zYCtPuUrnUCqrPVkP1dA/+pZ0l3MYsUkF288WKizlJ1+NW5LVQ80r+SY07xDCLM9YKsyZlmZ2ASTqBhIzjmOr9A+7Mr75/pr7Qb96eM4n5QAD7HGLl+ghrc8Q64y49osdxD/pBXTkeQPkTcLPRPdjHU/Ftjwm/iHBxycRYgsHgVXXcfPQWCNKqEHpMKrQxmXLoEaGvtH85e3gQtWJ8hKLsx/jDDlt1I8B5ZhQgkIl5fRsUo+0DLNdJSVIiXJOYfc5S1AKF1lTda5aDlyplSSm7P6+JLPUGQIIszbxWTUdBNMvVdsibS6jOTbjSe3s38nM8cmhO9AIY6dZNSCF3di0WL/OOG6CDXMT227jIzyzYag+JVuFy79c4gk5cTCVQyZiFZ3MR9LBXzZ+iC9bGtZYr3FkQAGnE/boAuGqdPAENkPwF6lO7doqFeFRDIZmjik/5aa4OwmIXQKPeDBatQ8ZywQr+rmO54+UocSM9dTAt4/jKQGzS60LNcLmAYD0uyh/x60uf8m+PrjwwgmSxF23L6vsiCPaQwCWqkoLjCfLwOzgXkXABTOIyjSWT9EeUkjIrUauvNh4TyVVIpwVB08eVtUFtcNXF5E0VSOyBg4B/QfoQjdjBX9urzDcnlp7VfEuakO25Kr8cONlGHwV1kL2TN7vH0tbWr3snL56nihHFT1RttbcO0lruEpdDV7sjxGBSzc7B5LTwM2k+ao4gV5oUJlxci7V+KQjIFp46Rp4WZ/Z0xtBT+etraFx7P4nZaG77Zh+5SG2AJFgHYNH5FOEd8B9sYkLrNzjD62RFEKyAkJkVG8PaJVHe0Uq2SALXNDUqgqQZEsNSJ67JKttFh3DYWhn/BEsqroRbv7erOZeV8ZvTeJme1FYiXmR9BZs0AS0KSH9xbgH0nN0h2xKEhmNg2jGLwEzXw4aZsAfnW7XzhZFWSdLcXvaHWuMxb/BamuiJbU+VdQb425w7aBONXH+/XLryd=",
    # "bx-umidtoken": "T2gAhtuJyZZvQwGK982a59oKvNNwzAw7aoHDaw5x3QYgUIZxbSPf2GxzRMfPFpmvd-I=",
    # "bx_et": "hnLE1f6THdqZdc_pFfenuhnsxwddxp47Pa6IjdWMwg4SvwsPzdX6R9OC-T4yFQTBFcgX9ue80bJFx9XgSCC3t2usfXAdyaDb1zmju0J_5WUhrLbGI_5cr6qhtfSGG_bu-g43jRXOZaXkEMjGjs5uEJ4lKCcNwOXlr6vlSf55ITblrLAGzIayf7rru8zLNoWIN6SFUz6NkZG5_C62tez_5bCewel7Dy0VIHtkRNYnIXbMMh9h_Zuza1-2swfeeqUd-IAMqH-LHzzWh-urNvApKnJt8-gvA9RwmdrEVVYepdJwrWojPHAw-IYgWmKEnQKpdFrqbqTCCBTwkoymivx6T394AmkWbI7pudCN_Z4LPLVw2YM_2uIGk1WjO6Z82M-zPk84uuERv45NhX1C."
}
response = requests.get(url, headers=headers, cookies=cookies, params=params)

print(response.text)
print(response)