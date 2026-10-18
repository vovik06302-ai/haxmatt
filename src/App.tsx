import { useEffect, useRef, useState } from 'react';
import { initWizardChess } from './wizardChessEngine.js';

const INITIAL_VERSION = 'v1.2.0';
const LATEST_VERSION = 'v1.3.0';

const BOSS_TRIALS = [
  {
    idx: 0,
    title: '1. Страж Паперти',
    desc: 'Классический гарнизон собора (ИИ: Хранитель)',
    badge: 'Разминка'
  },
  {
    idx: 1,
    title: '2. Ковен Архимага',
    desc: 'Маги телепортации и Архиепископы Света',
    badge: 'Средний'
  },
  {
    idx: 2,
    title: '3. Всадники Апокалипсиса',
    desc: 'Штурмовая кавалерия Всадников Демонов на двух линиях',
    badge: 'Сложный'
  },
  {
    idx: 3,
    title: '4. Гнездо Древних Драконов',
    desc: 'Крылатые Драконы и тяжёлые Канцлеры',
    badge: 'Эксперт'
  },
  {
    idx: 4,
    title: '5. Владыка Бездны (Финал)',
    desc: 'Элитный легион Всадников Демонов, Драконов и Магов',
    badge: 'Босс'
  }
];

const LAVA_LOCATIONS = [
  {
    id: 'lava_citadel',
    num: 2,
    icon: '🌋',
    name: 'Огненная Цитадель Лавы',
    badge: '🔥 ЛАВА',
    shortDesc: 'Кипящее озеро магмы, 4 лавовых гейзера, базальтовые скалы и восходящие угли'
  },
  {
    id: 'lava_forge',
    num: 3,
    icon: '🔥',
    name: 'Вулкан Кузницы Демонов',
    badge: '🔥 ЛАВА',
    shortDesc: 'Жерло вулкана, реки жидкого золота и лавы, гигантские цепи Бездны и горны'
  }
];

const OTHER_LOCATIONS = [
  {
    id: 'cathedral',
    num: 1,
    icon: '🏰',
    name: 'Готический Собор',
    badge: 'Классика'
  },
  {
    id: 'ice_throne',
    num: 4,
    icon: '❄️',
    name: 'Ледяной Трон Севера',
    badge: 'Мерзлота'
  },
  {
    id: 'necropolis',
    num: 5,
    icon: '💀',
    name: 'Некрополь Короля Лича',
    badge: 'Некромантия'
  },
  {
    id: 'astral_observatory',
    num: 6,
    icon: '🌌',
    name: 'Астральная Обсерватория',
    badge: 'Космос'
  },
  {
    id: 'emerald_temple',
    num: 7,
    icon: '🌿',
    name: 'Изумрудный Храм Древних',
    badge: 'Древние'
  },
  {
    id: 'blood_arena',
    num: 8,
    icon: '🩸',
    name: 'Кровавая Арена Вальхаллы',
    badge: 'Битва'
  },
  {
    id: 'golden_palace',
    num: 9,
    icon: '👑',
    name: 'Золотой Чертог Императора',
    badge: 'Империя'
  },
  {
    id: 'shadow_abyss',
    num: 10,
    icon: '🔮',
    name: 'Трон Бездны и Теней',
    badge: 'Пустота'
  }
];

export default function App() {
  const initializedRef = useRef(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [piecesDrawerOpen, setPiecesDrawerOpen] = useState(false);
  const [locationsDrawerOpen, setLocationsDrawerOpen] = useState(false);
  const [bossModalOpen, setBossModalOpen] = useState(false);
  const [appVersion, setAppVersion] = useState(INITIAL_VERSION);
  const [updateAvailable, setUpdateAvailable] = useState(true);

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
        setLocationsDrawerOpen(false);
        setBossModalOpen(false);
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

  const handleApplyUpdate = () => {
    setAppVersion(LATEST_VERSION);
    setUpdateAvailable(false);
    setMobileSheetOpen(false);
  };

  const togglePiecesDrawer = () => {
    setPiecesDrawerOpen((prev) => {
      const next = !prev;
      if (next) setLocationsDrawerOpen(false);
      return next;
    });
  };

  const toggleLocationsDrawer = () => {
    setLocationsDrawerOpen((prev) => {
      const next = !prev;
      if (next) setPiecesDrawerOpen(false);
      return next;
    });
  };

  return (
    <>
      <div id="loading-overlay">
        <div className="loader-title">Волшебные Шахматы 3D</div>
        <div className="loader-bar-wrap">
          <div className="loader-bar" id="loader-bar"></div>
        </div>
        <div id="loader-text">Загрузка 10 локаций и скульптурных фигур...</div>
      </div>

      <div id="canvas-container"></div>

      <div id="update-status-toast" className="update-toast" role="status" aria-live="polite">
        ✔ Обновление установлено ({LATEST_VERSION}): 10 локаций (включая 2 огненные с лавой) и Всадники Демонов готовы!
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
            className="hud-btn online-top-btn"
            id="btn-online-quick"
            title="Играть с противником через интернет онлайн (Быстрый поиск соперника, создание комнаты по коду или ссылке)"
          >
            <span className="online-dot offline" id="online-status-dot"></span>
            <span id="online-status-label">🌐 Играть онлайн</span>
          </button>
          <button
            type="button"
            className={`hud-btn ${piecesDrawerOpen ? 'active' : ''}`}
            id="btn-pieces-drawer-top"
            onClick={togglePiecesDrawer}
            aria-expanded={piecesDrawerOpen}
            aria-controls="new-pieces-dock"
            title="Открыть или скрыть выдвижное меню выбора фигур и конструктора строя"
          >
            ♟ Выбор фигур {piecesDrawerOpen ? '▴' : '▾'}
          </button>
          <button
            type="button"
            className={`hud-btn location-top-btn ${locationsDrawerOpen ? 'active' : ''}`}
            id="btn-locations-drawer-top"
            onClick={toggleLocationsDrawer}
            aria-expanded={locationsDrawerOpen}
            aria-controls="locations-slide-drawer"
            title="Открыть выдвижное меню выбора помещения (10 захватывающих локаций, включая 2 огненные с лавой)"
          >
            <span id="top-location-btn-label">🏰 Локация: Готический Собор</span>
            <span>{locationsDrawerOpen ? '▴' : '▾'}</span>
          </button>
          <button
            type="button"
            className={`hud-btn ${bossModalOpen ? 'active' : ''}`}
            id="btn-campaign-bosses"
            onClick={() => setBossModalOpen((prev) => !prev)}
            title="Открыть режим кампании «Испытания и Боссы»"
          >
            ⚔ Боссы (5)
          </button>
          <button
            type="button"
            className="hud-btn"
            id="btn-ability-cast"
            title="Применить активную способность выбранной фигуры (Огненный след Демона, Дыхание Дракона, Магический щит)"
          >
            ⚡ Способность фигуры
          </button>
          <button
            type="button"
            className="hud-btn"
            id="btn-undo-move"
            title="Отменить последний ход"
          >
            ↶ Отменить ход
          </button>
          <button
            type="button"
            className="hud-btn"
            id="btn-hint-move"
            title="Подсказать лучший тактический ход"
          >
            💡 Подсказка
          </button>
          <button
            type="button"
            className={`hud-btn update-version-btn ${updateAvailable ? 'blue-flame-active' : ''}`}
            id="btn-update-top"
            onClick={handleApplyUpdate}
            title={
              updateAvailable
                ? `Доступно обновление ${LATEST_VERSION}! Нажмите для обновления`
                : `Установлена актуальная версия ${appVersion}`
            }
          >
            {updateAvailable && <span className="blue-flame-icon" aria-hidden="true">🔥</span>}
            <span>↻ Обновить</span>
            <span className="version-badge" id="app-version-badge">
              {updateAvailable ? `${appVersion} → ${LATEST_VERSION}` : appVersion}
            </span>
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

          <div className="mobile-sheet-section-label">Партия, ИИ и армии</div>

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
            id="btn-ai-persona"
            title="Переключить характер и стиль игры ИИ (Гроссмейстер / Агрессивный Демон / Хранитель Собора)"
            onClick={() => setMobileSheetOpen(false)}
          >
            ИИ: Гроссмейстер (Тактика)
          </button>
          <button
            className="hud-btn"
            id="btn-sound-toggle"
            title="Включить или выключить объёмный звук и атмосферу локации"
          >
            🔊 Звук: Вкл
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
            title="Панорамный вид помещения (нажмите ещё раз для смены Север / Юг)"
          >
            Панорама зала
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

      {/* Модальное окно Онлайн-игры через интернет и выбора режима (#online-match-modal) */}
      <div id="online-match-modal" className="online-modal-backdrop" role="dialog" aria-modal="true" aria-label="Онлайн-игра через интернет">
        <div className="online-modal-card">
          <div className="online-modal-header">
            <span className="online-modal-title">🌐 Играть онлайн через интернет</span>
            <button type="button" className="pieces-drawer-close" id="btn-close-online-modal">
              Закрыть ✕
            </button>
          </div>

          <div className="lobby-tabs">
            <button type="button" className="lobby-tab active" id="tab-multi">
              🌐 Онлайн с противником
            </button>
            <button type="button" className="lobby-tab" id="tab-single">
              🤖 Одиночная игра (ИИ)
            </button>
            <button type="button" className="lobby-tab" id="tab-script" style={{ display: 'none' }}>
              Запись
            </button>
          </div>

          {/* Панель Онлайн-мультиплеера */}
          <div id="panel-multi" className="lobby-panel" style={{ display: 'block' }}>
            <div className="online-quick-match-box">
              <div className="online-box-title">⚡ Быстрый матч через интернет</div>
              <div className="online-box-sub">
                Автоматический поиск свободного соперника онлайн. Если комната уже ждёт игрока — вы мгновенно подключитесь к ней!
              </div>
              <button type="button" className="online-primary-btn" id="btn-quick-match">
                🔍 Найти соперника онлайн
              </button>
            </div>

            <div className="online-split-grid">
              <div className="online-card">
                <div className="online-box-title">➕ Создать приватную комнату</div>
                <div className="online-box-sub">Выберите ваш цвет фигур и отправьте 4-значный код или ссылку другу:</div>
                <div className="color-pick-row">
                  <button type="button" className="color-pick-btn selected" id="pick-mp-white">
                    ♔ За Белых
                  </button>
                  <button type="button" className="color-pick-btn" id="pick-mp-black">
                    ♚ За Чёрных
                  </button>
                </div>
                <button type="button" className="online-action-btn" id="btn-create-room">
                  Создать комнату
                </button>
              </div>

              <div className="online-card">
                <div className="online-box-title">🔑 Войти по коду комнаты</div>
                <div className="online-box-sub">Введите 4-значный код комнаты, который вам прислал соперник:</div>
                <div className="join-code-row">
                  <input
                    type="text"
                    id="input-room-code"
                    className="room-code-input"
                    placeholder="КОД (напр. A7K9)"
                    maxLength={6}
                  />
                  <button type="button" className="online-action-btn" id="btn-join-room">
                    Войти
                  </button>
                </div>
              </div>
            </div>

            <div id="created-room-box" className="created-room-banner" style={{ display: 'none' }}>
              <div className="created-room-top">
                <span>Код вашей онлайн-комнаты:</span>
                <strong id="created-room-code" className="created-room-code-badge">----</strong>
              </div>
              <div className="created-room-actions">
                <button type="button" className="hud-btn" id="btn-copy-code">
                  📋 Скопировать код
                </button>
                <button type="button" className="hud-btn" id="btn-copy-link">
                  🔗 Скопировать ссылку другу
                </button>
                <button type="button" className="hud-btn active" id="btn-enter-created-room">
                  ▶ Перейти к доске
                </button>
              </div>
            </div>

            <div id="mp-status-msg" className="online-status-message">
              Выберите «Найти соперника онлайн», создайте комнату или введите код комнаты друга.
            </div>
          </div>

          <div id="panel-single" className="lobby-panel" style={{ display: 'none' }}>
            <div className="online-card">
              <div className="online-box-title">🤖 Игра против компьютерного ИИ</div>
              <div className="online-box-sub">Выберите сторону для одиночной партии:</div>
              <div className="color-pick-row">
                <button type="button" className="color-pick-btn selected" id="pick-sp-white">
                  ♔ Играть за Белых
                </button>
                <button type="button" className="color-pick-btn" id="pick-sp-black">
                  ♚ Играть за Чёрных
                </button>
              </div>
              <button type="button" className="online-primary-btn" id="btn-start-single">
                ⚔ Начать одиночную партию
              </button>
            </div>
          </div>

          <div id="panel-script" className="lobby-panel" style={{ display: 'none' }}></div>
        </div>
      </div>

      {/* Модальное окно Боссов и Кампании «Испытания Святилища» */}
      <div
        className={`boss-modal-backdrop ${bossModalOpen ? 'open' : ''}`}
        onClick={() => setBossModalOpen(false)}
      >
        <div className="boss-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="boss-modal-header">
            <div>
              <div className="boss-modal-kicker">Кампания Святилища • 5 Уровней</div>
              <h2 className="boss-modal-title">⚔ Испытания и Боссы</h2>
            </div>
            <button
              type="button"
              className="hud-btn"
              onClick={() => setBossModalOpen(false)}
            >
              Закрыть ✕
            </button>
          </div>
          <div className="boss-list-grid">
            {BOSS_TRIALS.map((b) => (
              <button
                key={b.idx}
                type="button"
                id={`btn-boss-${b.idx}`}
                className="boss-card-btn"
                onClick={() => setBossModalOpen(false)}
              >
                <div className="boss-card-top">
                  <span className="boss-card-title">{b.title}</span>
                  <span className="boss-card-badge">{b.badge}</span>
                </div>
                <div className="boss-card-desc">{b.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Нижняя панель выдвижных меню: Выбор фигур + Выбор помещения (10 локаций) */}
      <div
        id="new-pieces-dock"
        className={`pieces-slide-drawer ${piecesDrawerOpen || locationsDrawerOpen ? 'open' : ''}`}
        aria-label="Выдвижное меню выбора фигур и локаций"
      >
        <div className="drawer-handles-bar">
          <button
            type="button"
            className={`pieces-drawer-handle ${piecesDrawerOpen ? 'active-tab' : ''}`}
            id="btn-drawer-tab"
            onClick={togglePiecesDrawer}
            aria-expanded={piecesDrawerOpen}
            title={piecesDrawerOpen ? 'Свернуть меню выбора фигур' : 'Открыть выдвижное меню выбора фигур'}
          >
            <span className="pieces-drawer-handle-title">♟ Выбор фигур</span>
            <span className="pieces-drawer-active-badge" id="drawer-active-piece-badge">
              🔥🐎 Всадник Демона
            </span>
            <span className="pieces-drawer-chevron">{piecesDrawerOpen ? '▼' : '▲'}</span>
          </button>

          <button
            type="button"
            className={`pieces-drawer-handle location-drawer-handle ${locationsDrawerOpen ? 'active-tab' : ''}`}
            id="btn-locations-drawer-tab"
            onClick={toggleLocationsDrawer}
            aria-expanded={locationsDrawerOpen}
            title={
              locationsDrawerOpen
                ? 'Свернуть выдвижное меню локаций'
                : 'Открыть выдвижное меню выбора помещения (10 локаций, 2 с лавой)'
            }
          >
            <span className="pieces-drawer-handle-title">🌋 Помещения (10)</span>
            <span className="pieces-drawer-active-badge lava-accent-badge" id="drawer-active-location-badge">
              🏰 Готический Собор Святилища
            </span>
            <span className="pieces-drawer-chevron">{locationsDrawerOpen ? '▼' : '▲'}</span>
          </button>
        </div>

        {/* Тело выдвижного меню #1: Выбор фигур и Конструктор строя */}
        <div
          className={`pieces-drawer-body ${piecesDrawerOpen ? 'drawer-panel-active' : ''}`}
          id="pieces-slide-panel"
        >
          <div className="pieces-drawer-header">
            <span className="pieces-drawer-title">Выбор фигур и Конструктор собственной армии</span>
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

          <div className="pieces-drawer-section">
            <span className="new-pieces-label">Конструктор строя (нажмите клетку a–h, чтобы поставить туда выбранную фигуру):</span>
            <div className="new-pieces-row">
              {['a', 'b', 'c', 'd', 'e (♔)', 'f', 'g', 'h'].map((lbl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="piece-chip slot-chip"
                  id={`btn-army-slot-${idx}`}
                  disabled={idx === 4}
                  title={idx === 4 ? 'Клетка Короля' : `Поставить выбранную фигуру на вертикаль ${lbl}`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="new-piece-rule-hint" id="new-piece-rule-hint">
            Всадник Демона (Кавалерия Бездны): прыгает буквой «Г» как Конь И совершает огненный прорыв на 1–3 клетки в любом из 8 направлений.
          </div>
        </div>

        {/* Тело выдвижного меню #2: Выбор помещения (10 захватывающих локаций, 2 огненные с лавой) */}
        <div
          className={`pieces-drawer-body locations-drawer-body ${locationsDrawerOpen ? 'drawer-panel-active' : ''}`}
          id="locations-slide-drawer"
        >
          <div className="pieces-drawer-header">
            <span className="pieces-drawer-title">
              🌋 Выбор помещения и арены боя (10 локаций • 2 огненные с лавой)
            </span>
            <div className="drawer-header-actions">
              <button
                type="button"
                className="pieces-drawer-close panorama-btn"
                id="btn-location-panorama"
                title="Показать панорамный обзор выбранного помещения"
              >
                🎥 Обзор зала
              </button>
              <button
                type="button"
                className="pieces-drawer-close"
                onClick={() => setLocationsDrawerOpen(false)}
                title="Свернуть выдвижное меню локаций"
              >
                Свернуть ✕
              </button>
            </div>
          </div>

          <div className="pieces-drawer-section">
            <span className="new-pieces-label lava-section-label">
              🔥 Огненные локации с бурлящей лавой (захватывающая стихия огня):
            </span>
            <div className="lava-locations-grid">
              {LAVA_LOCATIONS.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  className="location-card-btn lava-location-card"
                  id={`btn-location-${loc.id}`}
                  title={loc.shortDesc}
                >
                  <div className="location-card-top">
                    <span className="location-card-name">
                      {loc.icon} {loc.num}. {loc.name}
                    </span>
                    <span className="location-lava-badge">{loc.badge}</span>
                  </div>
                  <div className="location-card-sub">{loc.shortDesc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pieces-drawer-section">
            <span className="new-pieces-label">🏰 Залы, Храмы и Магические Измерения (8 локаций):</span>
            <div className="locations-chips-grid">
              {OTHER_LOCATIONS.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  className={`piece-chip location-chip ${loc.id === 'cathedral' ? 'active' : ''}`}
                  id={`btn-location-${loc.id}`}
                  title={`${loc.num}. ${loc.name} (${loc.badge})`}
                >
                  <span className="piece-chip-icon">{loc.icon}</span>
                  <span>
                    {loc.num}. {loc.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="new-piece-rule-hint" id="location-desc-hint">
            🏰 Готический Собор Святилища — Древний готический собор с высокими каменными сводами, витражами, парными огненными жаровнями и обсидиановым алтарём.
          </div>
        </div>
      </div>

      <div id="hud-bottom">
        <div className="power-balance-pill" title="Соотношение боевой мощи армий на доске">
          <span className="power-score-label" id="power-score-text">Сила армий — Белые: 49 | Чёрные: 49</span>
          <div className="power-bar-track">
            <div className="power-bar-white" id="power-bar-white-fill"></div>
          </div>
        </div>
        <div className="hint-pill" id="controls-hint">
          <strong>Управление:</strong> Клик — ход &nbsp;•&nbsp; 🌋 Помещения (10) — смена локации &nbsp;•&nbsp; ⚡ Способность — магия фигуры
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


