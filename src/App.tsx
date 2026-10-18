import { useEffect, useRef, useState } from 'react';
import { initWizardChess } from './wizardChessEngine.js';

const GITHUB_WORKFLOW_YAML = `name: Build Windows .EXE Installer

on:
  push:
    branches: [ main, master ]
    tags: [ 'v*' ]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-windows-exe:
    runs-on: windows-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Prepare package.json for Windows Public NPM & Electron
        shell: bash
        run: |
          node -e '
            const fs = require("fs");
            const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
            pkg.description = pkg.description || "Wizard Chess 3D — Gothic Cathedral & Demon Riders";
            pkg.author = pkg.author || "Wizard Chess 3D";
            pkg.main = "electron/main.cjs";
            delete pkg.scripts.predev;
            delete pkg.scripts.prebuild;
            delete pkg.scripts.prelint;
            if (pkg.dependencies) {
              delete pkg.dependencies["@google/genai"];
              pkg.dependencies["vite"] = "^6.2.0";
              pkg.dependencies["@vitejs/plugin-react"] = "^4.3.4";
              pkg.dependencies["react"] = "^19.0.0";
              pkg.dependencies["react-dom"] = "^19.0.0";
              pkg.dependencies["three"] = "^0.170.0";
            }
            if (pkg.devDependencies) {
              pkg.devDependencies["typescript"] = "^5.8.2";
              pkg.devDependencies["@types/react"] = "^19.0.10";
              pkg.devDependencies["@types/react-dom"] = "^19.0.4";
              pkg.devDependencies["electron"] = "^33.2.0";
              pkg.devDependencies["electron-builder"] = "^25.1.8";
            }
            fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
          '

      - name: Install Dependencies & Electron Builder
        run: npm install --legacy-peer-deps --no-audit --no-fund

      - name: Build 3D Web Application Bundle
        run: npx vite build

      - name: Package Windows .EXE Installer (NSIS + Portable)
        run: npx electron-builder --win --x64 --config electron-builder.yml --publish never

      - name: Upload .EXE Installer to GitHub Actions Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: Wizard-Chess-3D-Windows-Installer
          path: |
            release/*.exe
          if-no-files-found: error`;

export default function App() {
  const initializedRef = useRef(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [piecesDrawerOpen, setPiecesDrawerOpen] = useState(false);
  const [exeModalOpen, setExeModalOpen] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState('');

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initWizardChess();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false);
        setPiecesDrawerOpen(false);
        setExeModalOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileSheetOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleRestoreUI = () => {
    const win = window as unknown as { wizardChess?: { toggleUI?: (force?: boolean) => void } };
    if (win.wizardChess?.toggleUI) {
      win.wizardChess.toggleUI(false);
    } else {
      document.body.classList.remove('cinematic-ui-hidden');
      const btnHide = document.getElementById('btn-hide-ui');
      if (btnHide) btnHide.textContent = 'Скрыть интерфейс [H]';
    }
  };

  const handleDownloadWorkflow = () => {
    const blob = new Blob([GITHUB_WORKFLOW_YAML], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'build-exe.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(''), 2200);
  };

  return (
    <>
      <div id="loading-overlay">
        <div className="loader-title">Волшебные Шахматы 3D</div>
        <div className="loader-bar-wrap">
          <div className="loader-bar" id="loader-bar"></div>
        </div>
        <div id="loader-text">Загрузка архитектуры собора и скульптурных фигур...</div>
      </div>

      <div id="canvas-container"></div>

      <div id="update-status-toast" className="update-toast" role="status" aria-live="polite">
        ✔ Обновление выполнено (v1.2.0): обычные фигуры, Всадники Демонов и 3D-сцена синхронизированы!
      </div>

      <button
        type="button"
        className="hud-btn mobile-only-restore-ui"
        id="btn-mobile-show-ui"
        onClick={handleRestoreUI}
        title="Показать панель управления"
      >
        Показать интерфейс
      </button>

      <div id="hud-top">
        <div className="hud-group" id="hud-left">
          <div className="brand-pill">
            <span className="brand-title">Волшебные Шахматы</span>
          </div>
          <div className="status-pill" id="status-pill">
            <span className="turn-dot" id="turn-dot"></span>
            <span id="turn-text">Ход Белых</span>
            <span className="mode-badge" id="mode-badge">За Белых</span>
          </div>
          <button
            type="button"
            className={`hud-btn ${piecesDrawerOpen ? 'active' : ''}`}
            id="btn-pieces-drawer-top"
            onClick={() => setPiecesDrawerOpen((prev) => !prev)}
            aria-expanded={piecesDrawerOpen}
            aria-controls="new-pieces-dock"
            title="Открыть или скрыть выдвижное меню выбора фигур"
          >
            ♟ Выбор фигур {piecesDrawerOpen ? '▴' : '▾'}
          </button>
          <button
            type="button"
            className="hud-btn primary"
            id="btn-update-top"
            title="Обновить 3D-фигуры, шейдеры и состояние доски"
          >
            ↻ Обновить
          </button>
          <button
            type="button"
            className="hud-btn"
            id="btn-exe-top"
            onClick={() => setExeModalOpen(true)}
            title="Сборка установочного файла .EXE через GitHub Actions"
          >
            ⬇ Установщик .EXE (GitHub)
          </button>
        </div>

        <button
          type="button"
          className={`hud-btn mobile-controls-trigger ${mobileSheetOpen ? 'active' : ''}`}
          id="btn-mobile-controls"
          aria-expanded={mobileSheetOpen}
          aria-controls="hud-right"
          onClick={() => setMobileSheetOpen((prev) => !prev)}
        >
          {mobileSheetOpen ? 'Закрыть' : 'Меню'}
        </button>

        <div
          className={`mobile-sheet-backdrop ${mobileSheetOpen ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setMobileSheetOpen(false);
          }}
          aria-hidden="true"
        ></div>

        <div
          className={`hud-group ${mobileSheetOpen ? 'mobile-sheet-open' : ''}`}
          id="hud-right"
        >
          <div
            className="mobile-sheet-handle-wrap"
            onClick={(e) => {
              e.stopPropagation();
              setMobileSheetOpen(false);
            }}
            aria-hidden="true"
          >
            <div className="mobile-sheet-handle"></div>
          </div>

          <div className="mobile-sheet-header">
            <span className="mobile-sheet-title">Управление</span>
            <button
              type="button"
              className="mobile-sheet-close"
              id="btn-mobile-sheet-close"
              onClick={(e) => {
                e.stopPropagation();
                setMobileSheetOpen(false);
              }}
              aria-label="Закрыть меню управления"
            >
              Закрыть ✕
            </button>
          </div>

          <div className="mobile-sheet-section-label">Партия и армии</div>

          <button
            className="hud-btn active"
            id="btn-army-mode"
            title="Переключить состав армии (Всадники Демонов + Легенды / Легион Демонов / Обычные шахматы / Орден Магов)"
            onClick={() => setMobileSheetOpen(false)}
          >
            Армия: Всадники Демонов + Легенды
          </button>
          <button
            className="hud-btn"
            id="btn-style-mode"
            title="Переключить 3D-вид фигур (Скульптуры и Демоны / Обычные шахматы 3D / Все Всадники Демонов)"
            onClick={() => setMobileSheetOpen(false)}
          >
            Вид: Скульптуры и Демоны
          </button>
          <button
            className="hud-btn"
            id="btn-update-app"
            title="Обновить состояние фигур и сцены"
            onClick={() => setMobileSheetOpen(false)}
          >
            ↻ Обновить
          </button>
          <button
            className="hud-btn"
            id="btn-side-toggle"
            title="Переключить сторону (Играть за Белых / Играть за Чёрных)"
            onClick={() => setMobileSheetOpen(false)}
          >
            Играть за Чёрных
          </button>
          <button
            className="hud-btn"
            id="btn-ai-move"
            title="Сделать ход ИИ прямо сейчас"
            onClick={() => setMobileSheetOpen(false)}
          >
            Ход ИИ
          </button>
          <button
            className="hud-btn"
            id="btn-reset"
            title="Начать новую партию"
            onClick={() => setMobileSheetOpen(false)}
          >
            Новая игра
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">
            <span>Ракурсы камеры</span>
            <span className="mobile-sheet-section-sub">Повторное нажатие меняет сторону</span>
          </div>

          <button
            className="hud-btn active"
            id="btn-cam-player"
            title="Камера игрока (нажмите ещё раз для смены стороны Белые / Чёрные)"
          >
            Камера игрока
          </button>
          <button
            className="hud-btn"
            id="btn-cam-top"
            title="Вид сверху на доску (нажмите ещё раз для переворота)"
          >
            Сверху
          </button>
          <button
            className="hud-btn"
            id="btn-cam-side"
            title="Вид сбоку (нажмите ещё раз для смены стороны Восток / Запад)"
          >
            Сбоку
          </button>
          <button
            className="hud-btn"
            id="btn-cam-wide"
            title="Панорамный вид собора (нажмите ещё раз для смены Север / Юг)"
          >
            Собор
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">Интерфейс и жесты</div>

          <button
            className="hud-btn"
            id="btn-hide-ui"
            title="Скрыть или показать интерфейс (клавиша H)"
            onClick={() => setMobileSheetOpen(false)}
          >
            Скрыть интерфейс [H]
          </button>

          <div className="mobile-sheet-hint">
            <strong>Касания:</strong> Нажатие на фигуру — ход &nbsp;•&nbsp; 1 палец — вращение &nbsp;•&nbsp; 2 пальца — сдвиг &nbsp;•&nbsp; Щипок — масштаб
          </div>
        </div>
      </div>

      {/* Выдвижное меню выбора фигур (Slide-Out Drawer) */}
      <div
        id="new-pieces-dock"
        className={`pieces-slide-drawer ${piecesDrawerOpen ? 'open' : ''}`}
        aria-label="Выдвижное меню выбора и превращения фигур"
      >
        <button
          type="button"
          className="pieces-drawer-handle"
          id="btn-drawer-tab"
          onClick={() => setPiecesDrawerOpen((prev) => !prev)}
          aria-expanded={piecesDrawerOpen}
          title={piecesDrawerOpen ? 'Свернуть меню выбора фигур' : 'Открыть выдвижное меню выбора фигур'}
        >
          <span className="pieces-drawer-handle-title">♟ Выбор фигур</span>
          <span className="pieces-drawer-active-badge" id="drawer-active-piece-badge">
            🔥🐎 Всадник Демона
          </span>
          <span className="pieces-drawer-chevron">{piecesDrawerOpen ? '▼ Свернуть' : '▲ Открыть'}</span>
        </button>

        <div className="pieces-drawer-body">
          <div className="pieces-drawer-header">
            <span className="pieces-drawer-title">Выбор фигур (превращение пешки или выбранной фигуры)</span>
            <button
              type="button"
              className="pieces-drawer-close"
              onClick={() => setPiecesDrawerOpen(false)}
              title="Свернуть выдвижное меню"
            >
              Свернуть ✕
            </button>
          </div>

          <div className="pieces-drawer-section">
            <span className="new-pieces-label">Всадники Демонов и Новые фигуры:</span>
            <div className="new-pieces-row">
              <button
                type="button"
                className="piece-chip demon-chip active"
                id="btn-piece-demon_rider"
                title="Всадник Демона: прыжок Конём (2×1) + прорыв на 1–3 клетки в любом направлении"
              >
                <span className="piece-chip-icon">🔥🐎</span>
                <span>Всадник Демона</span>
              </button>
              <button
                type="button"
                className="piece-chip"
                id="btn-piece-archbishop"
                title="Архиепископ (Слон + Конь): Диагональ + прыжок буквой Г"
              >
                <span className="piece-chip-icon">♗+♘</span>
                <span>Архиепископ</span>
              </button>
              <button
                type="button"
                className="piece-chip"
                id="btn-piece-chancellor"
                title="Канцлер (Ладья + Конь): Прямые линии + прыжок буквой Г"
              >
                <span className="piece-chip-icon">♖+♘</span>
                <span>Канцлер</span>
              </button>
              <button
                type="button"
                className="piece-chip"
                id="btn-piece-wizard"
                title="Маг (Телепорт): Прыжки (3,1)/(1,3) и на 2 клетки + шаг по диагонали"
              >
                <span className="piece-chip-icon">✦</span>
                <span>Маг</span>
              </button>
              <button
                type="button"
                className="piece-chip"
                id="btn-piece-dragon"
                title="Дракон: Ладья + Король + прыжок на 2 клетки по диагонали"
              >
                <span className="piece-chip-icon">🐉</span>
                <span>Дракон</span>
              </button>
            </div>
          </div>

          <div className="pieces-drawer-section">
            <span className="new-pieces-label">Обычные фигуры шахмат:</span>
            <div className="new-pieces-row">
              <button
                type="button"
                className="piece-chip"
                id="btn-piece-queen"
                title="Обычный Ферзь"
              >
                <span className="piece-chip-icon">♕</span>
                <span>Ферзь</span>
              </button>
              <button
                type="button"
                className="piece-chip"
                id="btn-piece-knight"
                title="Обычный Конь"
              >
                <span className="piece-chip-icon">♘</span>
                <span>Конь</span>
              </button>
              <button
                type="button"
                className="piece-chip"
                id="btn-piece-rook"
                title="Обычная Ладья"
              >
                <span className="piece-chip-icon">♖</span>
                <span>Ладья</span>
              </button>
              <button
                type="button"
                className="piece-chip"
                id="btn-piece-bishop"
                title="Обычный Слон"
              >
                <span className="piece-chip-icon">♗</span>
                <span>Слон</span>
              </button>
              <button
                type="button"
                className="piece-chip"
                id="btn-piece-pawn"
                title="Обычная Пешка"
              >
                <span className="piece-chip-icon">♙</span>
                <span>Пешка</span>
              </button>
            </div>
          </div>

          <div className="new-piece-rule-hint" id="new-piece-rule-hint">
            Всадник Демона (Кавалерия Бездны): прыгает буквой «Г» как Конь И совершает огненный прорыв на 1–3 клетки в любом из 8 направлений.
          </div>
        </div>
      </div>

      {exeModalOpen && (
        <div className="exe-modal-backdrop" onClick={() => setExeModalOpen(false)}>
          <div className="exe-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="exe-modal-header">
              <div>
                <div className="exe-modal-badge">GitHub Actions + Electron Builder</div>
                <h2 className="exe-modal-title">Установочный файл .EXE для Windows</h2>
              </div>
              <button
                type="button"
                className="hud-btn"
                onClick={() => setExeModalOpen(false)}
              >
                Закрыть ✕
              </button>
            </div>

            <p className="exe-modal-desc">
              В проект уже встроены конфигурация <code>electron-builder.yml</code>, десктопное окно{' '}
              <code>electron/main.cjs</code> и автоматический пайплайн{' '}
              <code>.github/workflows/build-exe.yml</code>.
            </p>

            <div className="exe-steps-grid">
              <div className="exe-step-box">
                <div className="exe-step-num">Способ 1 — Автосборка через GitHub Actions (без установки средств на ПК)</div>
                <ol className="exe-step-list">
                  <li>Загрузите или синхронизируйте этот проект в свой репозиторий на <strong>GitHub</strong>.</li>
                  <li>
                    Перейдите во вкладку <strong>Actions → Build Windows .EXE Installer</strong> и нажмите{' '}
                    <strong>Run workflow</strong> (или просто сделайте <code>git push</code>).
                  </li>
                  <li>
                    Через ~2 минуты скачайте готовые файлы <code>Wizard-Chess-3D-Setup-1.2.0.exe</code> (установщик) и{' '}
                    <code>Wizard-Chess-3D-Portable-1.2.0.exe</code> в разделе <strong>Artifacts</strong> или <strong>Releases</strong>.
                  </li>
                </ol>
              </div>

              <div className="exe-step-box">
                <div className="exe-step-num">Способ 2 — Локальная сборка .EXE одной командой</div>
                <div className="exe-code-line">
                  <code>npm install --no-save electron electron-builder &amp;&amp; npm run dist:exe</code>
                  <button
                    type="button"
                    className="hud-btn"
                    onClick={() =>
                      handleCopyText(
                        'npm install --no-save electron electron-builder && npm run dist:exe',
                        'local'
                      )
                    }
                  >
                    {copiedCmd === 'local' ? 'Скопировано ✔' : 'Копировать'}
                  </button>
                </div>
              </div>
            </div>

            <div className="exe-modal-actions">
              <button type="button" className="hud-btn primary" onClick={handleDownloadWorkflow}>
                ⬇ Скачать .github/workflows/build-exe.yml
              </button>
              <button
                type="button"
                className="hud-btn"
                onClick={() => handleCopyText(GITHUB_WORKFLOW_YAML, 'yaml')}
              >
                {copiedCmd === 'yaml' ? 'YAML скопирован ✔' : 'Скопировать YAML пайплайна'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="hud-bottom">
        <div className="hint-pill" id="controls-hint">
          <strong>Управление:</strong> Клик по фигуре — ход &nbsp;•&nbsp; Откройте «Выбор фигур» для превращения &nbsp;•&nbsp; H: Скрыть интерфейс
        </div>
        <div className="captured-pill" id="captured-tray"></div>
      </div>

      <div id="checkmate-overlay" role="status" aria-live="polite">
        <div className="checkmate-banner">
          <div className="checkmate-ornament">✦ &nbsp; Приговор Святилища &nbsp; ✦</div>
          <div className="checkmate-crown" id="checkmate-crown">♔</div>
          <div className="checkmate-title" id="checkmate-title">Шах и Мат</div>
          <div className="checkmate-rule"></div>
          <div className="checkmate-subtitle" id="checkmate-subtitle">
            Белые победили • Чёрный Король пал
          </div>
          <div className="checkmate-actions">
            <button className="checkmate-btn" id="btn-checkmate-replay">
              Повтор падения Короля
            </button>
            <button className="checkmate-btn" id="btn-checkmate-newgame">
              Новая игра
            </button>
            <button className="checkmate-btn secondary" id="btn-checkmate-dismiss">
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

