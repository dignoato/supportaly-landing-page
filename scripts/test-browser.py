#!/usr/bin/env python3

import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright


def assert_no_horizontal_overflow(page, label: str) -> None:
    overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    assert overflow <= 1, f"{label} has {overflow}px horizontal overflow"


parser = argparse.ArgumentParser(description="Test Supportaly interactions in a browser.")
parser.add_argument("base_url", nargs="?", default="http://127.0.0.1:4173")
args = parser.parse_args()
base_url = args.base_url.rstrip("/")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        executable_path="/usr/bin/chromium",
        headless=True,
        args=["--disable-dev-shm-usage"],
    )
    try:
        # All pages and all interaction contexts share the same request audit.
        context = browser.new_context(viewport={"width":1440,"height":900})
        external_required_requests = []
        failures = []
        expected_origin = urlsplit(base_url).netloc
        context.on("request", lambda r: external_required_requests.append(r.url)
                   if urlsplit(r.url).scheme in ("http", "https")
                   and urlsplit(r.url).netloc != expected_origin else None)
        context.on("requestfailed", lambda r: failures.append({"url": r.url, "error": r.failure}))
        context.on("response", lambda r: failures.append({"url": r.url, "status": r.status})
                   if r.status >= 400 else None)
        page = context.new_page()
        wix_runtime_requests = []
        page.on(
            "request",
            lambda request: wix_runtime_requests.append(request.url)
            if "manage.wix.com" in request.url or "www.wixapis.com" in request.url
            else None,
        )
        page.goto(base_url, wait_until="domcontentloaded")
        page.wait_for_timeout(500)

        assert page.locator("[data-guided-clarity]").is_visible()
        for question in range(5):
            page.locator('[data-gc-answer="yes"]').click()
            page.locator("[data-gc-next]").click()
        assert page.locator("[data-gc-results]").is_visible()
        assert "YOUR PREPARATION SNAPSHOT" in page.locator("[data-gc-progress]").inner_text()
        page.locator("[data-gc-copy]").click()
        page.wait_for_timeout(100)
        assert page.locator("[data-gc-copy-status]").inner_text().strip()

        page.locator("#purchaseButton").click()
        assert page.locator("#checkoutDialog").evaluate("element => element.open")
        page.locator("#checkoutDialog .dialog-close").click()

        first_faq = page.locator("#faq details").first
        first_faq.locator("summary").click()
        assert first_faq.evaluate("element => element.open")
        assert_no_horizontal_overflow(page, "desktop")
        assert not wix_runtime_requests, f"Wix runtime requests were made: {wix_runtime_requests}"
        page.close()

        for width, height, label in ((1024, 900, "tablet-1024"), (768, 1024, "tablet-768"), (390, 844, "mobile")):
            page = context.new_page()
            page.set_viewport_size({"width":width,"height":height})
            page.goto(base_url, wait_until="domcontentloaded")
            page.wait_for_timeout(200)
            assert_no_horizontal_overflow(page, label)
            page.locator(".menu-toggle").click()
            assert page.locator("#menuOverlay").is_visible()
            page.locator("#menuOverlay .menu-close").click()
            page.close()

        for width in (390, 1440):
            for route in ("product-04-decision-card.html", "product-05-message-starters.html"):
                page = context.new_page()
                page.set_viewport_size({"width":width,"height":900})
                page.goto(f"{base_url}/{route}", wait_until="networkidle")
                buttons = page.locator("[data-product-thumb]")
                assert buttons.count() == 3, f"{route} must show all three supplied images"
                for index in range(buttons.count()):
                    button = buttons.nth(index)
                    button.click()
                    expected = button.get_attribute("data-src").split("/")[-1].replace("-1200.webp", "")
                    assert expected == f"{route.split('-')[1]}-{index + 1}", (route, expected)
                    page.wait_for_function("""expected => {
                        const image = document.querySelector('[data-main-image]');
                        return image.complete && image.naturalWidth > 0 && image.currentSrc.includes(expected);
                    }""", arg=expected)
                    # A nonresponsive slide must clear the prior slide's srcset.
                    actual = page.locator("[data-main-image]").get_attribute("srcset") or ""
                    assert actual == (button.get_attribute("data-srcset") or "")
                page.close()

        page = context.new_page()
        page.set_viewport_size({"width":1024,"height":900})
        page.goto(f"{base_url}/login.html", wait_until="domcontentloaded")
        assert page.locator("#authForm input").first.is_disabled()
        assert "unavailable in Migration Step 1" in page.locator("#authMessage").inner_text()
        page.close()

        route_results = []
        routes = json.loads((Path(__file__).resolve().parents[1] / "_wix/pages.json").read_text())
        for route in routes:
            page = context.new_page()
            response = page.goto(base_url + route["path"], wait_until="networkidle")
            assert response.status == 200, route
            # Force every lazy image to load, including below-fold media.
            page.evaluate("""async () => {
                await document.fonts.ready;
                await Promise.all([...document.images].map(async i => {
                    i.loading = 'eager';
                    if (!i.complete) await Promise.race([
                        new Promise(r => {i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});}),
                        new Promise(r => setTimeout(r,10000))]);
                    if (i.naturalWidth) await i.decode().catch(() => {});
                }));
            }""")
            broken = page.locator("img").evaluate_all("images => images.filter(i => (i.currentSrc || i.getAttribute('src') || i.getAttribute('srcset')) && (!i.complete || !i.naturalWidth)).map(i => i.currentSrc)")
            assert not broken, f"{route}: broken images {broken}"
            assert_no_horizontal_overflow(page, route["path"])
            route_results.append({"path":route["path"],"status":response.status,"images":page.locator("img").count(),"brokenImages":broken})
            page.close()
        assert not external_required_requests, external_required_requests
        assert not failures, failures
        output = Path("artifacts/visual-comparison/local")
        output.mkdir(parents=True, exist_ok=True)
        (output / "routes.json").write_text(json.dumps({"routes":route_results,"externalRequests":external_required_requests,"failures":failures},indent=2)+"\n")
        print(f"browser-routes={len(route_results)}; broken-images=0; external-requests=0")
        context.close()
        print("guided-check=ok")
        print("dialogs-and-faq=ok")
        print("responsive-menu=ok")
        print("product-gallery=ok")
        print("login-isolation=ok")
        print("horizontal-overflow=none")
        print("wix-runtime-requests=none")
    finally:
        browser.close()
