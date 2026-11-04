#!/usr/bin/env python3

import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright


VIEWPORTS = (
    ("desktop-1440", 1440, 1000),
    ("tablet-1024", 1024, 900),
    ("tablet-768", 768, 1024),
    ("mobile-390", 390, 844),
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Capture Supportaly responsive visual baselines.")
    parser.add_argument("base_url", help="Site origin, for example http://127.0.0.1:4173")
    parser.add_argument("label", help="Output label, for example local or live")
    parser.add_argument("--output", default="artifacts/visual-comparison")
    parser.add_argument("--chromium", default="/usr/bin/chromium")
    args = parser.parse_args()

    output_directory = Path(args.output) / args.label
    output_directory.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=args.chromium,
            headless=True,
            args=["--disable-dev-shm-usage"],
        )
        try:
            for name, width, height in VIEWPORTS:
                page = browser.new_page(viewport={"width": width, "height": height})
                page.goto(args.base_url, wait_until="domcontentloaded", timeout=30_000)
                page.wait_for_timeout(1_200)
                target = output_directory / f"home-{name}.png"
                page.screenshot(path=str(target), full_page=True, animations="disabled")
                print(target)
                page.close()
        finally:
            browser.close()


if __name__ == "__main__":
    main()
