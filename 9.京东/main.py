#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
京东 PC 首页 jsfbox_feed_tab 接口 —— Python 请求端

动态值（t / uuid / body / h5st）由 main.js 本地生成：
    node main.js --json   ->   stdout 输出 {h5st, t, uuid, bodyRaw, url, cookie}
本脚本通过 subprocess 调用 main.js 获取签名后，用 requests 发起请求。

用法：
    python3 main.py
依赖：
    pip install requests
    npm i（项目内：jsdom、@napi-rs/canvas、canvas->@napi-rs/canvas shim）
"""

import json
import os
import subprocess
import sys

import requests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COOKIE_FILE = os.path.join(BASE_DIR, "config", "cookies.txt")

HEADERS = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9",
    "origin": "https://www.jd.com",
    "priority": "u=1, i",
    "referer": "https://www.jd.com/",
    "sec-ch-ua": '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    "x-referer-page": "https://www.jd.com/",
    "x-rp-client": "h5_2.2.0",
}


def load_cookies() -> dict:
    """从 config/cookies.txt 读取 cookie（与 main.js 同源，避免硬编码过期）。"""
    if not os.path.exists(COOKIE_FILE):
        return {}
    cookies = {}
    raw = open(COOKIE_FILE, "r", encoding="utf-8").read().strip()
    for item in raw.split(";"):
        item = item.strip()
        if not item:
            continue
        if "=" in item:
            k, v = item.split("=", 1)
            cookies[k.strip()] = v.strip()
    return cookies


def gen_signed() -> dict:
    """调用 main.js --json 获取本地生成的签名参数。"""
    proc = subprocess.run(
        ["node", "main.js", "--json"],
        cwd=BASE_DIR,
        capture_output=True,
        text=True,
        timeout=60,
    )
    if proc.returncode != 0:
        raise RuntimeError("main.js 执行失败: %s" % proc.stderr[-500:])
    try:
        return json.loads(proc.stdout.strip())
    except json.JSONDecodeError as e:
        raise RuntimeError("main.js 输出非 JSON: %s\n%s" % (e, proc.stdout[:500]))


def main():
    print("[1/2] 调用 main.js 本地生成 h5st ...")
    data = gen_signed()
    print("      h5st:", data["h5st"][:60] + "...")
    print("      t   :", data["t"])

    print("[2/2] requests 请求 api.m.jd.com ...")
    cookies = load_cookies()
    if not cookies:
        print("      ⚠️  config/cookies.txt 为空，请求可能 403/605")
    resp = requests.get(data["url"], headers=HEADERS, cookies=cookies, timeout=15)
    print("HTTP", resp.status_code)
    print(resp.text)
    return resp


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("FAIL:", e)
        sys.exit(1)
