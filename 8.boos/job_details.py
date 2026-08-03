import requests


headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9",
    "priority": "u=1, i",
    "referer": "https://www.zhipin.com/web/geek/jobs?query=python&city=101110100&industry=&position=&_security_check=1_1785600511667",
    "sec-ch-ua": "\"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"150\", \"Google Chrome\";v=\"150\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "traceid": "F-0019fbe1594c1TSYAsdttW",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    "x-requested-with": "XMLHttpRequest"
}
cookies = {
    "lastCity": "101110100",
    "__l": "r=https%3A%2F%2Fwww.google.com.hk%2F&l=%2F&s=1",
    "isOHPC": "1",
    "__g": "-",
    "Hm_lvt_194df3105ad7148dcf2b98a91b5e727a": "1785588734",
    "HMACCOUNT": "89604FC5B1351FAB",
    "__zp_seo_uuid__": "50ec506d-e979-410d-8ddc-e057e71a97de",
    "Hm_lpvt_194df3105ad7148dcf2b98a91b5e727a": "1785600412",
    "ab_guid": "c1aa6fde-f5e1-4856-9920-74defecaba36",
    "__zp_stoken__": "fd1cgw4HCjWYJM1NcCFgNSm1cwrZBwrBNwrrCsMK9QsKjRU1fwrfCsVthXW7CnMK%2BwrJbwoHCvMKCX8KHQcKowrjDuGvCscKxwo9Cw7Jbw7NRwpDEkcOrwpDCtMSKwrbCu8KPNi%2FCt8O7xLfEsMSwxLbDmsO3xLDEsMS2wrrEt8SwxLDDmsO6w4%2FEsMSwxLbEucS3xLDEsMS2Pj42NzEwPjnCoVc%2FI8K2QzfCssK2wrbCqcK%2BwrvCs8OzwrjCt8K%2FKMK4wrHCswM7FhEAA1FXCw4LBlQBUAtSBAlRAA0HBQcNXFoJU1xQCltTAiYiwrbDoyrCscKJIDAPQgXCtisPw4ZfQyjEusKwShQgPDY3OMK2OzAxNjc7PTYTPTwxODYwMzE2IzHCvsKMw4FfRSTEt8K3wqMVND4xMTc7I3c2MDUzNjYwNzExIjA0OCA7wrPDl8KxODYw",
    "__c": "1785588734",
    "__a": "14965481.1785588734..1785588734.6.1.6.6",
    "__zp_sseed__": "iGcohoikqhgqbVTbk8849njHcISjIBYyaigZzmyKUb8=",
    "__zp_sname__": "60fcde2c",
    "__zp_sts__": "1785600513022"
}
url = "https://www.zhipin.com/wapi/zpgeek/job/detail.json"
params = {
    "securityId": "mnCWomgNRO0fK-110qsjZcGdGv5KGE99E004o_EXWO5Y1dtjWAxSbGm2lsH0WboHV6nEeeM7mQHGqJfqXe4kJccnrek58n4S_-siysW_WPBNtE8zuu1OjwXrrua5iqOF2hngjwyD4-8YOrlcSB0oLMhQHp-Ww8Ib7TjM2xVp_S3tqk6Rlg9hCQgmLaoPppQSRKjiT63WzcImdFv820a7ZYSoTdaLtGkTUVqL_I_Y",
    "lid": "6V2bj4JzbhF.search.1",
    "_": "1785600513217"
}
response = requests.get(url, headers=headers, cookies=cookies, params=params)

print(response.text)
print(response)