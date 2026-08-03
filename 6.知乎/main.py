import requests


headers = {
    "accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "priority": "u=1, i",
    "referer": "https://www.zhihu.com/search?type=content&q=python",
    "sec-ch-ua": "\"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"150\", \"Google Chrome\";v=\"150\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    "x-api-version": "3.0.91",
    "x-app-za": "OS=Web",
    "x-requested-with": "fetch",
    "x-zse-93": "101_3_3.0",
    "x-zse-96": "2.0_ss8H+zmiWp5tbwDB1zfRKRCpbFC602LmsJqD9wCPZlVIJCOXo9QhjQQybdbUvK0X",
    "x-zst-81": "3_2.0aR_sn77yn6O92wOB8hPZnQr0EMYxc4f18wNBUgpTQ6nxERFZ1LY0-4Lm-h3_tufIwJS8gcxTgJS_AuPZNcXCTwxI78YxEM20s4PGDwN8gGcYAupMWufIoLVqr4gxrRPOI0cY7HL8qun9g93mFukyigcmebS_FwOYPRP0E4rZUrN9DDom3hnynAUMnAVPF_PhaueTFLX9tGFKf9S0lqXyEBLBxrxMAhxKmgVmevL00UpYOuY9m7NCTcxMVwxM09eTVXcY3BOKoTVfDqHBPqS_bRCfLCCpwbXKghSV1h3YyCVxnUg8EJxGquC1eDoVfGL0G0x1ScUMkBC_c8O_7wFmQJp1AGL8bqVChvg8JQLCurO8rLH_vwXmOg_zW9FXaC3m4hH_3bgCBq3x2eOy19gM3gHYzbeufUVmkJXKDrLLxcnKyUF10goG2Te1gUx18qoGDUpGUBLffUtKEG2BECxOOrVGbXFsw9xKYqg1Q7SLe8Xs"
}
cookies = {
    "_xsrf": "Xdeq44TkYuBEtt3CIYZmgYS2ob3hFuOm",
    "__zse_ck": "005_KA7jwk5ZsGy7uAKpt=EEE=ORFVoXXzKmCl1ya/vEY59BRes4lLhMWFlyfKEV43=f2NdbhI5KfbJoE4MQCF=Szmp/LQyCQnOqn=qWbS6OkZEC47wo=faCEgCYV=i9y7Ho-RnHLsKKLLWcyNcnSt+tJ3xpRQG60IAjRDbr5xLEVnIgBDrmZc6sqMRz36DcobWdkCO/7gTFrXQV4F1aJ3Cg28fW4xJRkaey7y/e0BL7HvP8voRteV0pYiD/avlX1lJfs",
    "_zap": "2d93ff97-184e-4e31-9803-b8dc92fd0244",
    "d_c0": "hLLZtlnarByPTv2c9QhJjIUIko86A0ykQ0Q=|1785416301",
    "Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49": "1785416302",
    "HMACCOUNT": "4AF752A624E379E1",
    "captcha_session_v2": "2|1:0|10:1785567379|18:captcha_session_v2|88:YS9tM1hEd25DcmVNQmVneERiQzF3Y1VNeWJPWmk1MjVrTklLOG5IRGZ3eW0yUm9DME9MZm1oWU42TVUwMHROcw==|64019451973cc17f6bb86f2435c659a52e7a4baccac3104c4a4da7fee03063ae",
    "SESSIONID": "GaeHAHiAsLju6eckcljVbLdFoNdp51GxcbAVhHn93wh",
    "DATE": "1785567380356",
    "JOID": "UFESB0pMlQEc_rndVs-NHFlUpXpPAPpnUbz6uhQ80mVqzd-1M90AanD2vNBQYffKx9Y9UDYw8yEgeCubqb2Pg-M=",
    "osd": "VlAWBE1KlAUf-b_cUsyKGlhQpn1JAf5kVrr7vhc71GRuztizMtkDbXb3uNNXZ_bOxNE7UTIz9CchfCicr7yLgOQ=",
    "assva6": "U2FsdGVkX1+Q9pwL0e2RnywOcibAcUdXm89Z31/ZAj8=",
    "assva5": "U2FsdGVkX1+cF7QERkk900N5zFVIw2uZvWbOjy2H+GzkyzNXpCvZnWx3uy3i+i2f6cOkcOfXGlg2uvUIwL49Xg==",
    "crystal": "U2FsdGVkX19FATuZvBQRUDy6UxgU+5EYYPD50/OIGimo1SRw4HvgxiB9GeUSJB1YS3HAExjHd+QmIfZO6m9+8acm4+iw07CRCo755YJjk4hvwDO+qDLfjBlK3u+Cgrmot3yxYFCkp4XNfgt5RysWLmFvUVOiz4ueuP77aSl2ZI2yRxfwB+E0XUItdRh/JLyZfp58G44rQ5oiluotC2Z1YBDjN1Ih7gy9AdXJ6e9WHPiNTUENwCeGhKkkVZcvgvDw",
    "__snaker__id": "3QT9Kgxab3bShejP",
    "cmci9xde": "U2FsdGVkX1+QZ+xLwU7twlopSLkRp89pKgJLopC9gXDKiGaskNzupPs3Huk+9mwNyxxn7PK24oGS1j1JbQgX3w==",
    "pmck9xge": "U2FsdGVkX1/FDQJmUcTfLAtz/XEn95hlM5wFk3MQuAw=",
    "vmce9xdq": "U2FsdGVkX1/D3tCsN7EEzRVrkMPsxTLsiugulV9Gb0jywx6bXEH04N8En6yd1CgfXNXCRwt02AdvyS4cs80BrT7KBEtsjnCcohKTYrpagxRAsDvgN1bqLIXn5WIjot/zlkwLiYo6eXjNIEikvar6BAewkaJhBsil7IfWevhvUp8=",
    "gdxidpyhxdE": "SJ4hHyrcKSS%2BmhYblTl%2B6U0nTOJbK2zDqr2SH4c0IGygNVxy6YcoiO6z%2FVVwNvoRxR74oe0qwEajKNRN7ad8%5CQssNc9rVokRjr9BNp9V%2BPxRUM%2F2P%2B7pW9ceM0gLDJQ3dP6jqMAa%2BcHflolLndStL5WdwuUh9M4hrABfLJhuOOKRKz%5Cq%3A1785568281171",
    "q_c1": "d831053538574105b2eb5f73c52215b7|1785567512000|1785567512000",
    "z_c0": "2|1:0|10:1785567513|4:z_c0|92:Mi4xRW53MkJ3QUFBQUNFc3RtMldkcXNIQ1lBQUFCZ0FsVk5HT2RhYXdBX3d4QkxMZS1HRC1KcVo2Zks5M2ZJOXBPUnV3|e38dd5dfef24cc9a41c4b307f433a24d4ddb55928488ffc2664d3bae16a3694d",
    "Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49": "1785567671",
    "BEC": "b7b0f394f3fd074c6bdd2ebbdd598b4e"
}
url = "https://www.zhihu.com/api/v4/search_v3"
params = {
    "gk_version": "gz-gaokao",
    "t": "general",
    "q": "python",
    "correction": "1",
    "offset": "0",
    "limit": "20",
    "filter_fields": "",
    "lc_idx": "0",
    "show_all_topics": "0",
    "search_source": "Normal",
    "zhida_source": "ai_search_general"
}
response = requests.get(url, headers=headers, cookies=cookies, params=params)

print(response.text)
print(response)