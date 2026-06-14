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

  const rewritten = contents
    .replace("</head>", `${previewCss}\n  </head>`)
    .replace(
      '<div id="root"></div>',
      '<main class="pages-preview-shell"><div class="pages-phone-frame" aria-label="Phone preview"><div class="pages-phone-screen"><div id="root"></div></div></div><div class="pages-preview-toolbar">Phone preview: 393 x 852</div></main>'
    );

  writeFileSync(indexPath, rewritten);
}
