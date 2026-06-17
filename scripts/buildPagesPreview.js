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
const pagesBasePath = getPagesBasePath();
const pagesRouteBase = pagesBasePath.replace(/^\/+|\/+$/g, "");

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

rewriteExpoAssetPaths(outDir, pagesBasePath);
rewriteExpoRouterBasePath(outDir, pagesRouteBase);
injectPhonePreviewShell(join(outDir, "index.html"));
writeFileSync(join(outDir, ".nojekyll"), "");
cpSync(join(outDir, "index.html"), join(outDir, "404.html"));

function getPagesBasePath() {
  if (process.env.PAGES_BASE_PATH !== undefined) {
    return normalizePagesBasePath(process.env.PAGES_BASE_PATH);
  }

  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(-1);

  return normalizePagesBasePath(repositoryName || "powertrainingcoach");
}

function normalizePagesBasePath(basePath) {
  const trimmed = String(basePath || "").trim().replace(/^\/+|\/+$/g, "");

  return trimmed ? `/${trimmed}` : "";
}

function rewriteExpoAssetPaths(dir, basePath) {
  const textExtensions = new Set([".html", ".js", ".json"]);
  const expoAssetPath = `${basePath}/_expo/`;
  const assetPath = `${basePath}/assets/`;

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      rewriteExpoAssetPaths(fullPath, basePath);
      continue;
    }

    if (!textExtensions.has(fullPath.slice(fullPath.lastIndexOf(".")))) {
      continue;
    }

    const contents = readFileSync(fullPath, "utf8");
    const rewritten = contents
      .replaceAll('"/_expo/', `"${expoAssetPath}`)
      .replaceAll("'/_expo/", `'${expoAssetPath}`)
      .replaceAll("`/_expo/", `\`${expoAssetPath}`)
      .replaceAll('"/assets/', `"${assetPath}`)
      .replaceAll("'/assets/", `'${assetPath}`)
      .replaceAll("`/assets/", `\`${assetPath}`);

    if (rewritten !== contents) {
      writeFileSync(fullPath, rewritten);
    }
  }
}

function rewriteExpoRouterBasePath(dir, routeBase) {
  if (!routeBase) {
    return;
  }

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      rewriteExpoRouterBasePath(fullPath, routeBase);
      continue;
    }

    if (!fullPath.endsWith(".js")) {
      continue;
    }

    const contents = readFileSync(fullPath, "utf8");
    const encodedRouteBase = JSON.stringify(routeBase);
    const rewritten = contents
      .replace(
        /getUrlWithReactNavigationConcessions=function\(([^,]+),([^=]+)=""\)/,
        `getUrlWithReactNavigationConcessions=function($1,$2=${encodedRouteBase})`
      )
      .replace(
        /appendBaseUrl=function\(([^,]+),([^=]+)=""\)/,
        `appendBaseUrl=function($1,$2=${encodedRouteBase})`
      );

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
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: 30px;
        background: #000;
        isolation: isolate;
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

      .pages-modal-root {
        position: fixed;
        top: var(--pages-phone-screen-top, 0);
        left: var(--pages-phone-screen-left, 0);
        width: var(--pages-phone-screen-width, 100vw);
        height: var(--pages-phone-screen-height, 100vh);
        overflow: hidden;
        border-radius: 30px;
        transform: translateZ(0);
        z-index: 9999;
        pointer-events: none;
      }

      .pages-modal-root > * {
        pointer-events: auto;
      }

      .pages-test-menu {
        position: fixed;
        top: var(--pages-phone-screen-top, 28px);
        left: calc(var(--pages-phone-screen-left, 50vw) + var(--pages-phone-screen-width, 393px) + 22px);
        display: none;
        width: 220px;
        max-width: calc(100vw - var(--pages-phone-screen-left, 0px) - var(--pages-phone-screen-width, 393px) - 44px);
        padding: 14px;
        border: 1px solid #3a3a3a;
        border-radius: 16px;
        background: rgba(15, 15, 15, 0.94);
        box-shadow: 0 18px 60px rgba(0, 0, 0, 0.42);
        color: #f5f5f5;
        font: 13px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        z-index: 10000;
      }

      .pages-test-menu.has-actions {
        display: grid;
        gap: 10px;
      }

      .pages-test-menu-title {
        color: #a3a3a3;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .pages-test-menu-section {
        display: grid;
        gap: 8px;
      }

      .pages-test-menu-section-title {
        color: #ffffff;
        font-size: 15px;
        font-weight: 800;
      }

      .pages-test-menu-button {
        min-height: 38px;
        width: 100%;
        border: 0;
        border-radius: 999px;
        background: #ffffff;
        color: #000000;
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        padding: 9px 12px;
        text-align: center;
      }

      .pages-test-menu-button:active {
        transform: translateY(1px);
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

        .pages-modal-root {
          border-radius: 0;
        }

        .pages-preview-toolbar {
          display: none;
        }

        .pages-test-menu {
          display: none !important;
        }
      }
    </style>`;
  const previewScript = `
    <script id="pages-phone-preview-runtime">
      (() => {
        window.__PAGES_PHONE_PREVIEW__ = true;

        const screen = document.querySelector(".pages-phone-screen");

        if (!screen) {
          return;
        }

        const testActionSources = new Map();
        const testMenu = document.createElement("aside");
        testMenu.className = "pages-test-menu";
        testMenu.setAttribute("aria-label", "Web test actions");
        document.body.appendChild(testMenu);

        function renderTestMenu() {
          const sources = Array.from(testActionSources.values()).filter(
            (source) => Array.isArray(source.actions) && source.actions.length > 0
          );

          testMenu.innerHTML = "";
          testMenu.classList.toggle("has-actions", sources.length > 0);

          if (!sources.length) {
            return;
          }

          const title = document.createElement("div");
          title.className = "pages-test-menu-title";
          title.textContent = "Web test";
          testMenu.appendChild(title);

          sources.forEach((source) => {
            const section = document.createElement("section");
            section.className = "pages-test-menu-section";

            if (source.title) {
              const sectionTitle = document.createElement("div");
              sectionTitle.className = "pages-test-menu-section-title";
              sectionTitle.textContent = source.title;
              section.appendChild(sectionTitle);
            }

            source.actions.forEach((action) => {
              const button = document.createElement("button");
              button.className = "pages-test-menu-button";
              button.type = "button";
              button.textContent = action.label;
              button.addEventListener("click", () => action.onPress?.());
              section.appendChild(button);
            });

            testMenu.appendChild(section);
          });
        }

        window.addEventListener("pages-preview-test-actions", (event) => {
          const sourceId = event.detail?.sourceId;

          if (!sourceId) {
            return;
          }

          const actions = Array.isArray(event.detail?.actions)
            ? event.detail.actions
            : [];

          if (!actions.length) {
            testActionSources.delete(sourceId);
          } else {
            testActionSources.set(sourceId, {
              title: event.detail?.title || "",
              actions,
            });
          }

          renderTestMenu();
        });

        function updatePhoneScreenBounds() {
          const rect = screen.getBoundingClientRect();
          document.documentElement.style.setProperty("--pages-phone-screen-top", rect.top + "px");
          document.documentElement.style.setProperty("--pages-phone-screen-left", rect.left + "px");
          document.documentElement.style.setProperty("--pages-phone-screen-width", rect.width + "px");
          document.documentElement.style.setProperty("--pages-phone-screen-height", rect.height + "px");
        }

        function isReactNativeModalPortal(node) {
          return (
            node instanceof HTMLDivElement &&
            node.parentElement === document.body &&
            !node.id &&
            !node.classList.length
          );
        }

        function constrainModalPortals() {
          updatePhoneScreenBounds();
          Array.from(document.body.children).forEach((child) => {
            if (isReactNativeModalPortal(child)) {
              child.classList.add("pages-modal-root");
            }
          });
        }

        constrainModalPortals();
        window.addEventListener("resize", updatePhoneScreenBounds);
        window.addEventListener("orientationchange", updatePhoneScreenBounds);
        new ResizeObserver(updatePhoneScreenBounds).observe(screen);
        new MutationObserver(constrainModalPortals).observe(document.body, {
          childList: true,
        });

        if (!window.PointerEvent) {
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
