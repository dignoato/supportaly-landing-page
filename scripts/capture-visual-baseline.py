#!/usr/bin/env python3
"""Capture fully scrolled pages and evidence of media/network readiness."""
import argparse
import base64
import hashlib
import os
import subprocess
import json
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

VIEWPORTS = (("desktop-1440", 1440, 900), ("mobile-390", 390, 844))


def prepare_page(page):
    print("waiting for fonts", flush=True)
    page.evaluate("document.fonts.ready.then(() => true)")
    # Bound scrolling so infinite/continuously growing pages cannot hang capture.
    for _ in range(160):
        at_bottom = page.evaluate("""() => {
            window.scrollBy({top:Math.max(300, innerHeight * .75), behavior:'instant'});
            return scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
        }""")
        page.wait_for_timeout(180)
        if at_bottom:
            break
    print("scroll complete; decoding images", flush=True)
    page.evaluate("""async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(async image => {
            if (!image.getAttribute("src") && !image.getAttribute("srcset")) return;
            image.loading = "eager";
            if (!image.complete) await Promise.race([
                new Promise(resolve => {
                    image.addEventListener('load', resolve, {once:true});
                    image.addEventListener('error', resolve, {once:true});
                }), new Promise(resolve => setTimeout(resolve, 10000))]);
            if (image.naturalWidth) try { await Promise.race([image.decode(), new Promise(r => setTimeout(r, 5000))]); } catch {}
        }));
    }""")
    print("images ready", flush=True)
    page.evaluate("window.scrollTo({top:0, behavior:'instant'})")
    page.wait_for_timeout(800)


def inspect_page(page):
    return page.evaluate("""() => ({
        title: document.title, finalUrl: location.href,
        height: document.documentElement.scrollHeight,
        horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
        fonts: {status: document.fonts.status, faces: [...document.fonts].map(f =>
            ({family:f.family, status:f.status, weight:f.weight}))},
        images: [...document.images].map(i => ({src:i.getAttribute('src'),
            currentSrc:i.currentSrc, alt:i.alt, complete:i.complete,
            width:i.naturalWidth, height:i.naturalHeight,
            visible:!!(i.getBoundingClientRect().width && i.getBoundingClientRect().height)})),
        sections: [...document.querySelectorAll('main section, footer')].map(s => ({
            id:s.id, text:s.innerText.slice(0,300), top:s.getBoundingClientRect().top + scrollY,
            height:s.getBoundingClientRect().height}))
    })""")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_url")
    parser.add_argument("label")
    parser.add_argument("--output", default="artifacts/visual-comparison")
    parser.add_argument("--chromium", default="/usr/bin/chromium")
    args = parser.parse_args()
    output = Path(args.output) / args.label
    output.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        launch_args = ["--disable-dev-shm-usage"]
        # Chromium does not consume NODE_EXTRA_CA_CERTS. Pin only the supplied
        # environment CA key, never disable certificate validation globally.
        ca_path = os.environ.get("NODE_EXTRA_CA_CERTS")
        if ca_path:
            public_key = subprocess.check_output(["openssl", "x509", "-in", ca_path, "-pubkey", "-noout"])
            der = subprocess.run(["openssl", "pkey", "-pubin", "-outform", "DER"],
                                 input=public_key, capture_output=True, check=True).stdout
            pin = base64.b64encode(hashlib.sha256(der).digest()).decode()
            launch_args.append("--ignore-certificate-errors-spki-list=" + pin)
        browser = playwright.chromium.launch(executable_path=args.chromium, headless=True,
                                             args=launch_args)
        try:
            for name, width, height in VIEWPORTS:
                page = browser.new_page(viewport={"width":width, "height":height})
                report = {"url":args.base_url, "viewport":{"width":width,"height":height},
                          "capturedAt":datetime.now(timezone.utc).isoformat(),
                          "failedRequests":[], "httpFailures":[], "externalRequests":[]}
                page.on("requestfailed", lambda r: report["failedRequests"].append(
                    {"url":r.url, "error":r.failure, "type":r.resource_type}))
                page.on("response", lambda r: report["httpFailures"].append(
                    {"url":r.url, "status":r.status}) if r.status >= 400 else None)
                page.on("request", lambda r: report["externalRequests"].append(
                    {"url":r.url,"type":r.resource_type}) if not r.url.startswith(args.base_url.rstrip('/')) else None)
                try:
                    response = page.goto(args.base_url, wait_until="domcontentloaded", timeout=60000)
                    report["status"] = response.status if response else None
                    prepare_page(page)
                    report.update(inspect_page(page))
                    report["brokenImages"] = [i for i in report["images"] if (i["src"] or i["currentSrc"]) and (not i["complete"] or not i["width"])]
                    page.screenshot(path=str(output / f"home-{name}.png"), full_page=True, animations="disabled")
                except Exception as error:
                    report["captureError"] = str(error)
                finally:
                    (output / f"home-{name}.json").write_text(json.dumps(report, indent=2)+"\n")
                    print(f"{args.label}/{name}: status={report.get('status')} broken={len(report.get('brokenImages', []))} error={report.get('captureError')}", flush=True)
                    page.close()
        finally:
            browser.close()


if __name__ == "__main__":
    main()
