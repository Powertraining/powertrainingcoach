import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const outDir = "pages-dist";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const exportResult = spawnSync(
  "npx",
  ["expo", "export", "-p", "web", "--output-dir", outDir],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
  }
);

if (exportResult.status !== 0) {
  if (exportResult.error) {
    console.error(exportResult.error);
  }
  process.exit(exportResult.status ?? 1);
}

rewriteExpoAssetPaths(outDir);
injectPhonePreviewShell(join(outDir, "index.html"));
writeFileSync(join(outDir, ".nojekyll"), "");
cpSync(join(outDir, "index.html"), join(outDir, "404.html"));

function rewriteExpoAssetPaths(dir) {
  const textExtensions = new Set([".html", ".js", ".json"]);

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      rewriteExpoAssetPaths(fullPath);
      continue;
    }

    if (!textExtensions.has(fullPath.slice(fullPath.lastIndexOf(".")))) {
      continue;
    }

    const contents = readFileSync(fullPath, "utf8");
    const rewritten = contents
      .replaceAll('"/_expo/', '"./_expo/')
      .replaceAll("'/_expo/", "'./_expo/")
      .replaceAll("`/_expo/", "`./_expo/");

    if (rewritten !== contents) {
      writeFileSync(fullPath, rewritten);
    }
  }
}

function injectPhonePreviewShell(indexPath) {
  const contents = readFileSync(indexPath, "utf8");
  const previewCss = `
    <style id="pages-phone-preview">
      * {
        box-sizing: border-box;
      }

      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 28px;
        background:
          radial-gradient(circle at top left, rgba(255, 255, 255, 0.12), transparent 28rem),
          linear-gradient(135deg, #090909 0%, #202020 100%);
      }

      .pages-preview-shell {
        display: grid;
        gap: 18px;
        justify-items: center;
      }

      .pages-phone-frame {
        width: min(393px, calc(100vw - 32px));
        height: min(852px, calc(100vh - 112px));
        min-height: 620px;
        padding: 14px;
        border: 1px solid #2f2f2f;
        border-radius: 42px;
        background: #050505;
        box-shadow: 0 28px 80px rgba(0, 0, 0, 0.5);
      }

      .pages-phone-screen {
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: 30px;
        background: #000;
      }

      .pages-phone-screen * {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .pages-phone-screen *::-webkit-scrollbar {
        display: none;
      }

      .pages-phone-screen.is-drag-scrolling,
      .pages-phone-screen.is-drag-scrolling * {
        cursor: grabbing;
        user-select: none;
      }

      #root {
        width: 100%;
        height: 100%;
      }

      .pages-preview-toolbar {
        color: #cfcfcf;
        font: 14px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      @media (max-width: 520px) {
        body {
          padding: 0;
          background: #000;
        }

        .pages-preview-shell {
          width: 100vw;
          height: 100vh;
          gap: 0;
        }

        .pages-phone-frame {
          width: 100vw;
          height: 100vh;
          min-height: 100vh;
          padding: 0;
          border: 0;
          border-radius: 0;
          box-shadow: none;
        }

        .pages-phone-screen {
          border-radius: 0;
        }

        .pages-preview-toolbar {
          display: none;
        }
      }
    </style>`;
  const previewScript = `
    <script id="pages-phone-drag-scroll">
      (() => {
        const screen = document.querySelector(".pages-phone-screen");

        if (!screen || !window.PointerEvent) {
          return;
        }

        const dragThreshold = 4;
        let dragState = null;
        let suppressNextClick = false;
        let suppressClickTimeout = 0;

        function isEditableTarget(target) {
          return Boolean(
            target?.closest?.("input, textarea, select, [contenteditable='true']")
          );
        }

        function canScroll(element, axis) {
          if (!(element instanceof HTMLElement)) {
            return false;
          }

          const styles = window.getComputedStyle(element);
          const overflow = axis === "x" ? styles.overflowX : styles.overflowY;

          if (overflow === "hidden" || overflow === "visible" || overflow === "clip") {
            return false;
          }

          return axis === "x"
            ? element.scrollWidth > element.clientWidth + 1
            : element.scrollHeight > element.clientHeight + 1;
        }

        function getScrollTarget(target) {
          for (
            let element = target;
            element && element !== screen.parentElement;
            element = element.parentElement
          ) {
            const canScrollX = canScroll(element, "x");
            const canScrollY = canScroll(element, "y");

            if (canScrollX || canScrollY) {
              return {
                element,
                x: canScrollX,
                y: canScrollY,
              };
            }

            if (element === screen) {
              break;
            }
          }

          return null;
        }

        function markDragged() {
          suppressNextClick = true;
          window.clearTimeout(suppressClickTimeout);
          suppressClickTimeout = window.setTimeout(() => {
            suppressNextClick = false;
          }, 350);
        }

        function onPointerDown(event) {
          if (
            event.button !== 0 ||
            event.pointerType !== "mouse" ||
            isEditableTarget(event.target)
          ) {
            return;
          }

          const target = getScrollTarget(event.target);

          if (!target) {
            return;
          }

          dragState = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            scrollLeft: target.element.scrollLeft,
            scrollTop: target.element.scrollTop,
            target,
            dragging: false,
            captured: false,
          };
        }

        function onPointerMove(event) {
          if (!dragState || event.pointerId !== dragState.pointerId) {
            return;
          }

          const deltaX = event.clientX - dragState.startX;
          const deltaY = event.clientY - dragState.startY;

          if (!dragState.dragging && Math.hypot(deltaX, deltaY) < dragThreshold) {
            return;
          }

          if (!dragState.dragging) {
            dragState.dragging = true;
            dragState.captured = true;
            screen.setPointerCapture?.(event.pointerId);
          }

          markDragged();

          if (dragState.target.x) {
            dragState.target.element.scrollLeft = dragState.scrollLeft - deltaX;
          }

          if (dragState.target.y) {
            dragState.target.element.scrollTop = dragState.scrollTop - deltaY;
          }

          screen.classList.add("is-drag-scrolling");
          event.preventDefault();
        }

        function endDrag(event) {
          if (!dragState || event.pointerId !== dragState.pointerId) {
            return;
          }

          if (dragState.captured) {
            screen.releasePointerCapture?.(dragState.pointerId);
          }

          screen.classList.remove("is-drag-scrolling");
          dragState = null;
        }

        screen.addEventListener("pointerdown", onPointerDown);
        screen.addEventListener("pointermove", onPointerMove, { passive: false });
        screen.addEventListener("pointerup", endDrag);
        screen.addEventListener("pointercancel", endDrag);
        window.addEventListener("pointerup", endDrag);
        window.addEventListener("pointercancel", endDrag);
        screen.addEventListener(
          "click",
          (event) => {
            if (!suppressNextClick) {
              return;
            }

            suppressNextClick = false;
            window.clearTimeout(suppressClickTimeout);
            event.preventDefault();
            event.stopPropagation();
          },
          true
        );
      })();
    </script>`;

  const rewritten = contents
    .replace("</head>", `${previewCss}\n  </head>`)
    .replace("</body>", `${previewScript}\n  </body>`)
    .replace(
      '<div id="root"></div>',
      '<main class="pages-preview-shell"><div class="pages-phone-frame" aria-label="Phone preview"><div class="pages-phone-screen"><div id="root"></div></div></div><div class="pages-preview-toolbar">Phone preview: 393 x 852</div></main>'
    );

  writeFileSync(indexPath, rewritten);
}
