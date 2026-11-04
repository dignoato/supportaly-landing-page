#!/usr/bin/env python3

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:4173"


def assert_no_horizontal_overflow(page, label: str) -> None:
    overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    assert overflow <= 1, f"{label} has {overflow}px horizontal overflow"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        executable_path="/usr/bin/chromium",
        headless=True,
        args=["--disable-dev-shm-usage"],
    )
    try:
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        wix_runtime_requests = []
        page.on(
            "request",
            lambda request: wix_runtime_requests.append(request.url)
            if "manage.wix.com" in request.url or "www.wixapis.com" in request.url
            else None,
        )
        page.goto(BASE_URL, wait_until="domcontentloaded")
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
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto(BASE_URL, wait_until="domcontentloaded")
            page.wait_for_timeout(200)
            assert_no_horizontal_overflow(page, label)
            page.locator(".menu-toggle").click()
            assert page.locator("#menuOverlay").is_visible()
            page.locator("#menuOverlay .menu-close").click()
            page.close()

        page = browser.new_page(viewport={"width": 1024, "height": 900})
        page.goto(f"{BASE_URL}/product-04-decision-card.html", wait_until="domcontentloaded")
        main_image = page.locator("[data-main-image]")
        original_source = main_image.get_attribute("src")
        page.locator("[data-product-thumb]").nth(1).click()
        assert main_image.get_attribute("src") != original_source
        page.close()

        page = browser.new_page(viewport={"width": 1024, "height": 900})
        page.goto(f"{BASE_URL}/login.html", wait_until="domcontentloaded")
        assert page.locator("#authForm input").first.is_disabled()
        assert "unavailable in Migration Step 1" in page.locator("#authMessage").inner_text()
        page.close()

        print("guided-check=ok")
        print("dialogs-and-faq=ok")
        print("responsive-menu=ok")
        print("product-gallery=ok")
        print("login-isolation=ok")
        print("horizontal-overflow=none")
        print("wix-runtime-requests=none")
    finally:
        browser.close()
