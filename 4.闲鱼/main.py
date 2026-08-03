import requests

headers = {
    "accept": "application/json",
    "accept-language": "zh-CN,zh;q=0.9",
    "content-type": "application/x-www-form-urlencoded",
    "origin": "https://www.goofish.com",
    "priority": "u=1, i",
    "referer": "https://www.goofish.com/",
    "sec-ch-ua": '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
}
cookies = {
    "xlly_s": "1",
    "cookie2": "14c06e7305e48d5cae2d84a028adb626",
    "mtop_partitioned_detect": "1",
    "_m_h5_tk": "7b93924e995aacbb988bd5bfc892cdd7_1785571091282",
    "_m_h5_tk_enc": "dbd8fcf80e6f90b3a9733a878ecb470c",
    "_samesite_flag_": "true",
    "t": "5b63adeb018a3b47cfd8e186aff26bac",
    "_tb_token_": "1d6e86f5a45b",
    "tfstk": "gMSIQZMli_IwHCwLwXyaffFqngKWNRrqVY9RnTnEeHKKwbBv_6ReY8qWw6ANYBWevvbGgtnFYyxrVHxk2SP40okhK3x8KZiDDXm9KLZyepKJxhpJgtn40oWhpvJL3OEVzgMlVLRJ2eL-BVdMp43RweE96CvkeXp-vR69sCpKwDd-BFpWFvndw3e6XCvp2pCJJR69sLKJwfUohLaBt9wPK7EfLA3ldCi-2G9TZI6IF0J1ApiXgOd_M5IsieOApCi8TQeWKCpfX7ceZG6OvLfTbDt5BL1XvNNtA_6do_vA9lGpdwBf3FsuM09GW6YwdNw-WBBv9Hd1q8mk9wWR4UsLMYRdx6S6ogcQ_Q7VQML1M5o1ZU_dkHI7GlIycmRb0muSCEmWCIy_C40utqccdss08LTpIpTaCRGdrepMBMIzC2bkJdvaJRws9af..",
}
url = "https://h5api.m.goofish.com/h5/mtop.taobao.idlehome.home.webpc.feed/1.0/"
params = {
    "jsv": "2.7.2",
    "appKey": "34839810",
    "t": "1785563202595",
    "sign": "f4d12a983cdc48dd30300edeae0f305f",
    "v": "1.0",
    "type": "originaljson",
    "accountSite": "xianyu",
    "dataType": "json",
    "timeout": "20000",
    "api": "mtop.taobao.idlehome.home.webpc.feed",
    "sessionOption": "AutoLoginOnly",
    "spm_cnt": "a21ybx.home.0.0",
}
data = {"data": '{"itemId":"","pageSize":30,"pageNumber":1,"machId":"164111_1"}'}
response = requests.post(
    url, headers=headers, cookies=cookies, params=params, data=data
)

print(response.text)
print(response)
