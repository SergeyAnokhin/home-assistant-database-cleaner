/*
 * Guided tour of the Database Cleaner panel.
 *
 * ✏️  HOW TO EDIT
 *   • Every step is one object in TOUR_STEPS (order = order of the tour).
 *   • tab      which panel tab to open first (overview, candidates, issues,
 *              statistics, states, health, maintenance).
 *   • target   value of the data-tour="…" attribute in panel.js markup that gets
 *              highlighted. Omit it for a centred "no highlight" step.
 *   • prepare  optional: asks the panel to reset its filters (see tourPrepare()).
 *   • ru / en  title + body (HTML). Allowed: <p>, <ul><li>, <ol><li>, <b>, <code>,
 *              <div class="tip">💡 …</div> and <div class="warn">⚠️ …</div>.
 *   • icons    write an icon as <i data-mdi="KEY"></i>: KEY must be a key of
 *              the MDI dictionary in panel.js (the panel hands its icons to the tour). Use the
 *              same icon as the panel shows for that element, so the tour looks like the UI.
 *   When the UI changes (new tab, new card, renamed button) update the matching
 *   step here — and add data-tour="…" to the new element in panel.js.
 *
 * The tour never advances on its own: only "Next" / → / Enter move forward.
 * It blocks clicks on the panel behind it and changes no data.
 */

export const TOUR_STEPS = [
  // ───────────────────────────────────────────────────────────── start
  {
    id: "welcome",
    tab: "overview",
    chip: "👋",
    ru: {
      title: "Добро пожаловать в Database Cleaner",
      body: `<p>Панель показывает, <b>что раздувает базу</b> Home Assistant, находит <b>ненужную долговременную статистику</b> и помогает безопасно её удалить.</p>
        <ul>
          <li><i data-mdi="search"></i> Анализ только <b>читает</b> базу — ничего не меняет</li>
          <li><i data-mdi="shield_ok"></i> Удаление идёт только через recorder, после <b>бэкапа</b> и проверок</li>
          <li><i data-mdi="energy"></i> Статистику панели «Энергия» удалить нельзя</li>
          <li><i data-mdi="chart"></i> Везде, где можно, — <b>иконки и графики</b> вместо таблиц: наводите курсор на цветной сегмент, чтобы увидеть точное число</li>
        </ul>
        <div class="tip">💡 Шаги меняются <b>только по кнопке «Далее»</b> (или клавише →). Esc — выйти. Читайте не торопясь.</div>`,
    },
    en: {
      title: "Welcome to Database Cleaner",
      body: `<p>This panel shows <b>what makes your Home Assistant database grow</b>, finds <b>unneeded long-term statistics</b> and helps you remove them safely.</p>
        <ul>
          <li><i data-mdi="search"></i> Analysis only <b>reads</b> the database — nothing is changed</li>
          <li><i data-mdi="shield_ok"></i> Deletion goes through the recorder only, after a <b>backup</b> and checks</li>
          <li><i data-mdi="energy"></i> Statistics used by the Energy dashboard can never be deleted</li>
          <li><i data-mdi="chart"></i> Wherever possible there are <b>icons and charts</b> instead of tables: hover a coloured segment to see the exact number</li>
        </ul>
        <div class="tip">💡 Steps change <b>only when you press “Next”</b> (or the → key). Esc closes the tour. Take your time.</div>`,
    },
  },
  {
    id: "tabs",
    tab: "overview",
    target: "tabs",
    ru: {
      title: "Семь вкладок — от общего к частному",
      body: `<p>Идите слева направо, как по воронке:</p>
        <ul>
          <li><i data-mdi="overview"></i> <b>Обзор</b> — сколько места занято и чем</li>
          <li><i data-mdi="candidates"></i> <b>Кандидаты</b> — что можно удалить</li>
          <li><i data-mdi="issues"></i> <b>Проблемы</b> — что не так со статистикой (в значке — их число)</li>
          <li><i data-mdi="statistics"></i> <b>Статистика</b> и <i data-mdi="states"></i> <b>Состояния</b> — кто сколько пишет</li>
          <li><i data-mdi="health"></i> <b>Диагностика</b> — здоровье recorder</li>
          <li><i data-mdi="maintenance"></i> <b>Обслуживание</b> — бэкап, сжатие, отмена</li>
        </ul>
        <div class="tip">💡 Не знаете, с чего начать? «Обзор» → «Кандидаты» → «Обслуживание».</div>`,
    },
    en: {
      title: "Seven tabs — from general to specific",
      body: `<p>Go left to right, like a funnel:</p>
        <ul>
          <li><i data-mdi="overview"></i> <b>Overview</b> — how much space is used and by what</li>
          <li><i data-mdi="candidates"></i> <b>Candidates</b> — what can be deleted</li>
          <li><i data-mdi="issues"></i> <b>Problems</b> — what is wrong with statistics (the badge shows how many)</li>
          <li><i data-mdi="statistics"></i> <b>Statistics</b> and <i data-mdi="states"></i> <b>States</b> — who writes how much</li>
          <li><i data-mdi="health"></i> <b>Diagnostics</b> — recorder health</li>
          <li><i data-mdi="maintenance"></i> <b>Maintenance</b> — backup, compaction, undo</li>
        </ul>
        <div class="tip">💡 Not sure where to start? Overview → Candidates → Maintenance.</div>`,
    },
  },
  {
    id: "help",
    tab: "overview",
    target: "help",
    ru: {
      title: "Кнопка «?» — эта экскурсия",
      body: `<p>Запустить экскурсию заново можно в любой момент этой кнопкой <i data-mdi="help"></i>. Пока вы её не нажимали, она слегка мигает.</p>
        <div class="tip">💡 Экскурсия ничего не меняет в базе и не нажимает кнопки за вас — она только показывает и объясняет.</div>`,
    },
    en: {
      title: "The “?” button — this tour",
      body: `<p>Use this button <i data-mdi="help"></i> to restart the tour at any time. Until you open it for the first time it pulses slightly.</p>
        <div class="tip">💡 The tour never changes the database and never presses buttons for you — it only shows and explains.</div>`,
    },
  },
  {
    id: "refresh",
    tab: "overview",
    target: "refresh",
    ru: {
      title: "Обновить данные",
      body: `<p>Тяжёлые запросы к базе <b>кэшируются</b> на сервере — в шапке карточек видно «посчитано N с назад». Эта кнопка <i data-mdi="refresh"></i> пересчитывает данные <b>текущей вкладки</b>.</p>
        <p>Слева от неё в заголовке указаны версия панели и путь к файлу базы.</p>
        <div class="tip">💡 Первый расчёт на большой базе занимает 10–60 секунд. Это нормально, повторные открытия мгновенные.</div>`,
    },
    en: {
      title: "Refresh the data",
      body: `<p>Heavy database queries are <b>cached</b> on the server — card headers show “computed N s ago”. This button <i data-mdi="refresh"></i> recomputes the data of the <b>current tab</b>.</p>
        <p>To its left the title shows the panel version and the path of the database file.</p>
        <div class="tip">💡 The first calculation on a big database takes 10–60 seconds. That is normal; later visits are instant.</div>`,
    },
  },

  {
    id: "prefs",
    tab: "overview",
    target: "prefs",
    ru: {
      title: "Язык и тема",
      body: `<ul>
          <li><i data-mdi="translate"></i> <b>RU / EN</b> — один клик переключает язык панели и экскурсии</li>
          <li><i data-mdi="sun"></i> <i data-mdi="moon"></i> <b>Тема</b> — тёмная (по умолчанию) или светлая</li>
        </ul>
        <div class="tip">💡 Выбор запоминается в этом браузере. Кнопка показывает, на что вы переключитесь.</div>`,
    },
    en: {
      title: "Language and theme",
      body: `<ul>
          <li><i data-mdi="translate"></i> <b>RU / EN</b> — one click switches the language of the panel and of the tour</li>
          <li><i data-mdi="sun"></i> <i data-mdi="moon"></i> <b>Theme</b> — dark (the default) or light</li>
        </ul>
        <div class="tip">💡 Your choice is remembered in this browser. The button shows what you will switch to.</div>`,
    },
  },

  // ───────────────────────────────────────────────────────────── overview
  {
    id: "overview-kpis",
    tab: "overview",
    target: "overview-kpis",
    ru: {
      title: "Обзор: ключевые цифры",
      body: `<ul>
          <li><i data-mdi="database"></i> <b>База</b> и <b>WAL</b> — размер файла и журнала записи</li>
          <li><i data-mdi="disk"></i> <b>Свободно на диске</b> — кольцо показывает долю свободного места: зелёное — спокойно, оранжевое — мало, красное — критично</li>
          <li><i data-mdi="chart_line"></i> <b>Долговременная статистика</b> и <i data-mdi="states"></i> <b>Состояния</b> — их доля в базе и число строк</li>
          <li><i data-mdi="recorder"></i> <b>Recorder</b> — срок хранения, интервал записи, есть ли фильтр exclude</li>
          <li><i data-mdi="schema"></i> <b>Схема</b> — версия схемы базы (панель проверена до 53)</li>
        </ul>
        <div class="tip">💡 Если «Долговременная статистика» занимает 70–90 % — чистить нужно именно её (вкладка «Кандидаты»). Если «Состояния» — смотрите вкладку «Состояния».</div>`,
    },
    en: {
      title: "Overview: key numbers",
      body: `<ul>
          <li><i data-mdi="database"></i> <b>Database</b> and <b>WAL</b> — size of the file and its write-ahead log</li>
          <li><i data-mdi="disk"></i> <b>Free disk</b> — the ring shows the free share: green is fine, orange is low, red is critical</li>
          <li><i data-mdi="chart_line"></i> <b>Long-term statistics</b> and <i data-mdi="states"></i> <b>States</b> — their share of the database and row counts</li>
          <li><i data-mdi="recorder"></i> <b>Recorder</b> — retention, commit interval, whether an exclude filter exists</li>
          <li><i data-mdi="schema"></i> <b>Schema</b> — database schema version (the panel is verified up to 53)</li>
        </ul>
        <div class="tip">💡 If “Long-term statistics” takes 70–90 % — that is what to clean (Candidates tab). If it is “States” — look at the States tab.</div>`,
    },
  },
  {
    id: "overview-next",
    tab: "overview",
    target: "overview-next",
    ru: {
      title: "Что делать дальше",
      body: `<p>Панель сама смотрит на ваши цифры и предлагает следующий шаг. Каждая строка — кнопка с переходом.</p>
        <ul>
          <li><i data-mdi="candidates"></i> Самая большая часть базы → куда идти: «Кандидаты» или «Состояния»</li>
          <li><i data-mdi="disk"></i> Красный значок — места на диске может не хватить на бэкап</li>
          <li><i data-mdi="vacuum"></i> Много пустых страниц в файле → пора сжать базу</li>
          <li><i data-mdi="issues"></i> <i data-mdi="backup"></i> Проверить проблемы и сделать бэкап</li>
        </ul>
        <div class="tip">💡 Не знаете, с чего начать, — нажмите верхнюю строку.</div>`,
    },
    en: {
      title: "What to do next",
      body: `<p>The panel looks at your numbers and suggests the next step. Every line is a button that takes you there.</p>
        <ul>
          <li><i data-mdi="candidates"></i> The biggest part of the database → where to go: Candidates or States</li>
          <li><i data-mdi="disk"></i> A red badge — there may not be enough disk space for a backup</li>
          <li><i data-mdi="vacuum"></i> Lots of empty pages in the file → time to compact it</li>
          <li><i data-mdi="issues"></i> <i data-mdi="backup"></i> Check problems and make a backup</li>
        </ul>
        <div class="tip">💡 Not sure where to start? Press the top line.</div>`,
    },
  },
  {
    id: "overview-space",
    tab: "overview",
    target: "overview-space",
    ru: {
      title: "Куда уходит место",
      body: `<p>Кольцевая диаграмма — доля каждой группы таблиц: долговременная статистика, состояния, 5-минутная статистика, события, служебные. В центре — общий размер.</p>
        <p>Справа — те же группы списком с размером и процентом. Наведите курсор на сегмент кольца — увидите точное число.</p>
        <div class="tip">💡 Долговременная статистика хранится бессрочно и сама не очищается — поэтому обычно именно она самая большая. Состояния и события чистятся автоматически по сроку хранения.</div>`,
    },
    en: {
      title: "Where the space goes",
      body: `<p>The donut shows the share of each table group: long-term statistics, states, 5-minute statistics, events, service tables. The total size is in the middle.</p>
        <p>On the right, the same groups as a list with size and percentage. Hover a segment of the ring to see the exact number.</p>
        <div class="tip">💡 Long-term statistics are kept forever and never purged automatically — so they are usually the biggest part. States and events are purged automatically after the retention period.</div>`,
    },
  },
  {
    id: "overview-flow",
    tab: "overview",
    target: "overview-flow",
    ru: {
      title: "Куда идут данные",
      body: `<p>Схема со стрелками: <b>сенсоры → recorder → таблицы</b>. Справа видно судьбу каждой группы:</p>
        <ul>
          <li><i data-mdi="trash_can"></i> Состояния, 5-минутная статистика и события — recorder <b>сам удаляет</b> через заданное число дней</li>
          <li><i data-mdi="candidates"></i> Долговременная статистика хранится <b>бессрочно</b> — чистите её только вы</li>
        </ul>
        <div class="tip">💡 Полоска в блоке — доля группы в базе. После экскурсии блоки кликабельны: «Долговременная статистика» ведёт в «Кандидаты», «Состояния» — на вкладку «Состояния».</div>`,
    },
    en: {
      title: "Where the data goes",
      body: `<p>A scheme with arrows: <b>sensors → recorder → tables</b>. On the right you see the fate of each group:</p>
        <ul>
          <li><i data-mdi="trash_can"></i> States, 5-minute statistics and events — the recorder <b>deletes them itself</b> after the configured number of days</li>
          <li><i data-mdi="candidates"></i> Long-term statistics are kept <b>forever</b> — only you clean them</li>
        </ul>
        <div class="tip">💡 The thin bar in a block is the group's share of the database. After the tour the blocks are clickable: “Long-term statistics” leads to Candidates, “States” to the States tab.</div>`,
    },
  },
  {
    id: "overview-since",
    tab: "overview",
    target: "overview-since",
    ru: {
      title: "Данные с…",
      body: `<p>Цветные полосы на общей оси времени: с какой даты и по какую в базе есть состояния, долговременная и 5-минутная статистика, события. Чем длиннее полоса, тем больше история.</p>
        <div class="tip">💡 5-минутная статистика хранится около 10 дней, состояния — столько, сколько задано в recorder, а долговременная может тянуться годами. Это нормально.</div>`,
    },
    en: {
      title: "Data since…",
      body: `<p>Coloured bars on a shared time axis: the date range present in the database for states, long-term and 5-minute statistics, events. The longer the bar, the longer the history.</p>
        <div class="tip">💡 5-minute statistics are kept for about 10 days, states for as long as the recorder is configured, and long-term statistics may span years. That is normal.</div>`,
    },
  },
  {
    id: "overview-tables",
    tab: "overview",
    target: "overview-tables",
    ru: {
      title: "Таблицы базы",
      body: `<p>Размер каждой таблицы SQLite: строки, данные, индексы, итого и доля. Сверху — самые тяжёлые; цветная заливка в последней колонке — сравнение таблиц между собой.</p>
        <div class="warn">⚠️ После удаления строк файл базы <b>сам не уменьшается</b>: пустые страницы остаются внутри. Вернуть место на диск может только «Сжать базу (VACUUM)» на вкладке «Обслуживание».</div>`,
    },
    en: {
      title: "Database tables",
      body: `<p>The size of every SQLite table: rows, data, indexes, total and share. The heaviest are on top; the coloured fill in the last column compares the tables with each other.</p>
        <div class="warn">⚠️ After rows are deleted the database file <b>does not shrink by itself</b>: empty pages stay inside. Only “Compact database (VACUUM)” on the Maintenance tab gives disk space back.</div>`,
    },
  },

  // ───────────────────────────────────────────────────────────── candidates
  {
    id: "cand-summary",
    tab: "candidates",
    prepare: "cand-safe",
    target: "cand-summary",
    ru: {
      title: "Кандидаты: сколько можно освободить",
      body: `<p>Крупное число — сколько места можно освободить <b>прямо сейчас</b>: это статистика с вердиктом «Можно удалить».</p>
        <p>Цветная полоса — как вся долговременная статистика делится по пяти вердиктам. Иконки в легенде те же, что на карточках ниже.</p>
        <div class="tip">💡 Красный сегмент — безопасная зона. Фиолетовый («Нигде не используются») требует вашего взгляда перед удалением.</div>`,
    },
    en: {
      title: "Candidates: how much can be freed",
      body: `<p>The big number is how much space can be freed <b>right now</b>: the statistics with the “Safe to delete” verdict.</p>
        <p>The coloured bar shows how all long-term statistics split into the five verdicts. The legend icons are the same as on the cards below.</p>
        <div class="tip">💡 The red segment is the safe zone. The purple one (“Not used anywhere”) needs your eyes before deleting.</div>`,
    },
  },
  {
    id: "cand-verdicts",
    tab: "candidates",
    prepare: "cand-safe",
    target: "cand-verdicts",
    ru: {
      title: "Пять вердиктов",
      body: `<ul>
          <li><i data-mdi="safe"></i> <b>Можно удалить</b> — сущности нет, она отключена или исключена, и ничто на неё не ссылается</li>
          <li><i data-mdi="unused"></i> <b>Нигде не используются</b> — сенсор жив, но им не пользуется ни дашборд, ни автоматизация</li>
          <li><i data-mdi="review"></i> <b>Проверить</b> — статистика остановилась или источник непонятен</li>
          <li><i data-mdi="used"></i> <b>Используются</b> — есть ссылка из дашборда, автоматизации, скрипта…</li>
          <li><i data-mdi="protected"></i> <b>Энергия</b> — защищено, к удалению не предлагается</li>
        </ul>
        <div class="tip">💡 Тонкая полоска в карточке — её доля по весу. Клик по карточке переключает список ниже. Начинайте с «Можно удалить».</div>`,
    },
    en: {
      title: "Five verdicts",
      body: `<ul>
          <li><i data-mdi="safe"></i> <b>Safe to delete</b> — the entity is gone, disabled or excluded, and nothing references it</li>
          <li><i data-mdi="unused"></i> <b>Not used anywhere</b> — the sensor is alive, but no dashboard or automation uses it</li>
          <li><i data-mdi="review"></i> <b>Review</b> — statistics stopped or the source is unclear</li>
          <li><i data-mdi="used"></i> <b>In use</b> — referenced by a dashboard, automation, script…</li>
          <li><i data-mdi="protected"></i> <b>Energy</b> — protected, never offered for deletion</li>
        </ul>
        <div class="tip">💡 The thin bar in a card is its share by weight. Click a card to switch the list below. Start with “Safe to delete”.</div>`,
    },
  },
  {
    id: "cand-coverage",
    tab: "candidates",
    prepare: "cand-safe",
    target: "cand-coverage",
    ru: {
      title: "Где искали ссылки",
      body: `<p>Прежде чем вынести вердикт, панель ищет сущность в: <i data-mdi="energy"></i> <b>«Энергии»</b>, <i data-mdi="dashboards"></i> <b>дашбордах</b>, <i data-mdi="automations"></i> <b>автоматизациях</b>, <i data-mdi="scripts"></i> <b>скриптах</b>, <i data-mdi="scenes"></i> <b>сценах</b>, <i data-mdi="groups"></i> <b>группах</b>, <i data-mdi="persons"></i> <b>людях</b>, <i data-mdi="helpers"></i> <b>хелперах</b> и <i data-mdi="yaml"></i> в тексте всех YAML-файлов конфигурации.</p>
        <p>Зелёная галочка и число — сколько ссылок найдено. Серый чип «не проверялось» — источник прочитать не удалось.</p>
        <div class="warn">⚠️ Не видны Node-RED, AppDaemon, Grafana, InfluxDB и пакеты вне папки конфига. Если что-то из этого читает ваши сенсоры — проверьте вручную.</div>`,
    },
    en: {
      title: "Where we looked for references",
      body: `<p>Before giving a verdict, the panel searches for the entity in: <i data-mdi="energy"></i> <b>Energy</b>, <i data-mdi="dashboards"></i> <b>dashboards</b>, <i data-mdi="automations"></i> <b>automations</b>, <i data-mdi="scripts"></i> <b>scripts</b>, <i data-mdi="scenes"></i> <b>scenes</b>, <i data-mdi="groups"></i> <b>groups</b>, <i data-mdi="persons"></i> <b>people</b>, <i data-mdi="helpers"></i> <b>helpers</b> and <i data-mdi="yaml"></i> the text of all YAML files in the config folder.</p>
        <p>A green tick and a number — how many references were found. A grey “not scanned” chip means that source could not be read.</p>
        <div class="warn">⚠️ Node-RED, AppDaemon, Grafana, InfluxDB and packages outside the config folder are invisible. If any of them reads your sensors — check by hand.</div>`,
    },
  },
  {
    id: "cand-reasons",
    tab: "candidates",
    prepare: "cand-safe",
    target: "cand-reasons",
    ru: {
      title: "Причины — чипы-фильтры",
      body: `<p>Внутри вердикта кандидаты делятся по причине, у каждой своя иконка: <i data-mdi="orphan"></i> <b>сущности нет</b>, <i data-mdi="disabled"></i> <b>отключена</b>, <i data-mdi="excluded"></i> <b>исключена</b>, <i data-mdi="ruler"></i> <b>служебная единица</b>, <i data-mdi="sensor"></i> <b>облачная погода</b>, <i data-mdi="flag"></i> <b>похоже на тест</b>, <i data-mdi="free"></i> <b>почти пустая</b>…</p>
        <p>Рядом с каждой — число статистик и сколько места они занимают. Клик по чипу оставляет в списке только эту причину.</p>
        <div class="tip">💡 Удаляйте по одной причине за раз — так проще проверить список глазами и понять, что именно уходит.</div>`,
    },
    en: {
      title: "Reasons — filter chips",
      body: `<p>Within a verdict, candidates are split by reason, each with its own icon: <i data-mdi="orphan"></i> <b>entity missing</b>, <i data-mdi="disabled"></i> <b>disabled</b>, <i data-mdi="excluded"></i> <b>excluded</b>, <i data-mdi="ruler"></i> <b>service unit</b>, <i data-mdi="sensor"></i> <b>cloud weather</b>, <i data-mdi="flag"></i> <b>looks like a test</b>, <i data-mdi="free"></i> <b>almost empty</b>…</p>
        <p>Next to each one: the number of statistics and the space they take. Click a chip to keep only that reason in the list.</p>
        <div class="tip">💡 Delete one reason at a time — it is easier to review the list by eye and see exactly what goes.</div>`,
    },
  },
  {
    id: "cand-table",
    tab: "candidates",
    prepare: "cand-safe",
    target: "cand-table",
    ru: {
      title: "Список статистик",
      body: `<p>Для каждой статистики: идентификатор, значки <i data-mdi="dashboards"></i><i data-mdi="automations"></i> — где она используется, название · устройство · интеграция · единица, метки причин, число строк (цветная заливка — доля), вес в MB и дата последней записи.</p>
        <p>Над списком — поиск по части имени и счётчики: сколько статистик, строк и места в текущем фильтре. Первые 10 строк, остальные — «Показать ещё».</p>
        <div class="tip">💡 Дата «Последняя» давно в прошлом — сенсор мёртв. Узнали свой нужный датчик? Просто не отмечайте его.</div>`,
    },
    en: {
      title: "The list of statistics",
      body: `<p>For each statistic: the id, small icons <i data-mdi="dashboards"></i><i data-mdi="automations"></i> showing where it is used, name · device · integration · unit, reason labels, number of rows (the coloured fill is its share), size in MB and the date of the last record.</p>
        <p>Above the list: a search box and counters — how many statistics, rows and how much space the current filter covers. The first 10 rows are shown, the rest via “Show more”.</p>
        <div class="tip">💡 A “Last” date far in the past means the sensor is dead. Recognise a sensor you need? Just don't tick it.</div>`,
    },
  },
  {
    id: "cand-selbar",
    tab: "candidates",
    prepare: "cand-safe",
    target: "cand-selbar",
    ru: {
      title: "Выбор и экспорт",
      body: `<ul>
          <li><i data-mdi="select"></i> Отмечайте флажками слева в списке или жмите <b>«Выбрать показанные»</b></li>
          <li><i data-mdi="copy"></i> <b>«Скопировать список»</b> — идентификаторы в буфер обмена</li>
          <li><i data-mdi="yaml"></i> <b>«YAML для recorder exclude»</b> — готовый фрагмент для configuration.yaml, чтобы живой сенсор перестал записываться</li>
        </ul>
        <div class="tip">💡 Счётчик «Выбрано» показывает, сколько строк и места освободится.</div>`,
    },
    en: {
      title: "Selecting and exporting",
      body: `<ul>
          <li><i data-mdi="select"></i> Tick the checkboxes in the list or press <b>“Select shown”</b></li>
          <li><i data-mdi="copy"></i> <b>“Copy list”</b> — copies the ids to the clipboard</li>
          <li><i data-mdi="yaml"></i> <b>“YAML for recorder exclude”</b> — a ready snippet for configuration.yaml so a live sensor stops being recorded</li>
        </ul>
        <div class="tip">💡 The “Selected” counter shows how many rows and how much space will be freed.</div>`,
    },
  },
  {
    id: "cand-delete",
    tab: "candidates",
    prepare: "cand-safe",
    target: "cand-delete",
    ru: {
      title: "Удаление — безопасный конвейер",
      body: `<p>Кнопка <i data-mdi="delete"></i> оживает, когда что-то выбрано. Что произойдёт после нажатия (то же покажет окно подтверждения):</p>
        <ul>
          <li><i data-mdi="shield_ok"></i> <b>Проверки</b>: HA работает, нет миграции, очередь recorder в норме, хватает места</li>
          <li><i data-mdi="backup"></i> <b>Бэкап</b> базы, если нет свежего (24 ч)</li>
          <li><i data-mdi="delete"></i> Удаление <b>порциями</b> до 50 000 строк; строки сначала уходят в <b>архив отмены</b></li>
          <li><i data-mdi="vacuum"></i> По желанию — сжатие VACUUM</li>
        </ul>
        <p>Для подтверждения нужно ввести слово <b>УДАЛИТЬ</b>.</p>
        <div class="warn">⚠️ Удаление статистики живого сенсора не мешает ему копить её заново. Чтобы он перестал писаться — добавьте его в recorder exclude (кнопка YAML).</div>`,
    },
    en: {
      title: "Deletion — a safe pipeline",
      body: `<p>The <i data-mdi="delete"></i> button comes alive once something is selected. What happens after you press it (the confirmation window shows the same steps):</p>
        <ul>
          <li><i data-mdi="shield_ok"></i> <b>Checks</b>: HA is running, no migration, recorder queue is fine, enough free space</li>
          <li><i data-mdi="backup"></i> A <b>backup</b> of the database, unless a fresh one (24 h) exists</li>
          <li><i data-mdi="delete"></i> Deletion in <b>batches</b> of up to 50,000 rows; rows go to an <b>undo archive</b> first</li>
          <li><i data-mdi="vacuum"></i> Optionally, VACUUM compaction</li>
        </ul>
        <p>To confirm you must type the word <b>DELETE</b>.</p>
        <div class="warn">⚠️ Deleting the statistics of a live sensor does not stop it from collecting them again. To stop it, add it to recorder exclude (the YAML button).</div>`,
    },
  },

  // ───────────────────────────────────────────────────────────── issues
  {
    id: "issues-intro",
    tab: "issues",
    target: "issues-intro",
    ru: {
      title: "Проблемы: что не так со статистикой",
      body: `<p>Здесь собрано то, что сам Home Assistant считает неправильным (как в «Инструменты разработчика → Статистика»), плюс наши проверки.</p>
        <p>Крупное число — сколько всего проблем и сколько из них важных <i data-mdi="bolt"></i>. Цветная полоса делит их по тяжести: <i data-mdi="error"></i> ошибки, <i data-mdi="warning"></i> предупреждения, <i data-mdi="info"></i> сведения.</p>
        <div class="tip">💡 Вкладка <b>только показывает</b> проблемы и подсказывает, что делать. Отсюда ничего не меняется.</div>`,
    },
    en: {
      title: "Problems: what is wrong with statistics",
      body: `<p>This gathers what Home Assistant itself considers wrong (as in “Developer tools → Statistics”) plus our own checks.</p>
        <p>The big number is how many problems there are and how many of them are important <i data-mdi="bolt"></i>. The coloured bar splits them by severity: <i data-mdi="error"></i> errors, <i data-mdi="warning"></i> warnings, <i data-mdi="info"></i> information.</p>
        <div class="tip">💡 The tab <b>only shows</b> problems and suggests what to do. Nothing is changed from here.</div>`,
    },
  },
  {
    id: "issues-tiles",
    tab: "issues",
    target: "issues-tiles",
    ru: {
      title: "Типы проблем",
      body: `<p>Плитки группируют проблемы по типу; цвет значка — тяжесть, тонкая полоска — доля, а <i data-mdi="bolt"></i> с числом — сколько из них <b>важных</b>. Например:</p>
        <ul>
          <li><i data-mdi="chart_line"></i> <b>Накопленная сумма уменьшается</b> — в «Энергии» появляется отрицательное потребление</li>
          <li><i data-mdi="orphan"></i> <b>Статистика без сущности</b> — сенсора больше нет</li>
          <li><i data-mdi="ruler"></i> <b>Изменилась единица измерения</b> — HA просит исправить или удалить</li>
          <li><i data-mdi="stopped"></i> <b>Статистика перестала писаться</b></li>
        </ul>
        <div class="tip">💡 Клик по плитке оставляет в списке только этот тип.</div>`,
    },
    en: {
      title: "Types of problems",
      body: `<p>The tiles group problems by type; the badge colour is the severity, the thin bar is the share, and <i data-mdi="bolt"></i> with a number is how many are <b>important</b>. For example:</p>
        <ul>
          <li><i data-mdi="chart_line"></i> <b>Accumulated sum decreases</b> — negative consumption appears in Energy</li>
          <li><i data-mdi="orphan"></i> <b>Statistics without an entity</b> — the sensor no longer exists</li>
          <li><i data-mdi="ruler"></i> <b>Unit of measurement changed</b> — HA asks to fix or delete</li>
          <li><i data-mdi="stopped"></i> <b>Statistics stopped being written</b></li>
        </ul>
        <div class="tip">💡 Click a tile to keep only that type in the list.</div>`,
    },
  },
  {
    id: "issues-filters",
    tab: "issues",
    target: "issues-filters",
    ru: {
      title: "Фильтры списка проблем",
      body: `<ul>
          <li><i data-mdi="bolt"></i> <b>только важные</b> — сущности из «Энергии», дашбордов, автоматизаций, скриптов, YAML</li>
          <li><i data-mdi="filter"></i> <b>источник</b>: все · Home Assistant · Database Cleaner</li>
          <li><i data-mdi="search"></i> поиск по имени ниже</li>
        </ul>
        <p>В списке под каждой проблемой есть подсказка <i data-mdi="tip"></i> что делать, и кнопки <i data-mdi="chart"></i> «Статистика HA», <i data-mdi="open"></i> «Сущность», <i data-mdi="candidates"></i> «В Кандидатах».</p>
        <div class="tip">💡 Начните с «только важные»: именно такие сбои ломают «Энергию», дашборды и автоматизации.</div>`,
    },
    en: {
      title: "Problem list filters",
      body: `<ul>
          <li><i data-mdi="bolt"></i> <b>only important</b> — entities from Energy, dashboards, automations, scripts, YAML</li>
          <li><i data-mdi="filter"></i> <b>source</b>: all · Home Assistant · Database Cleaner</li>
          <li><i data-mdi="search"></i> search by name below</li>
        </ul>
        <p>Under each problem there is a hint <i data-mdi="tip"></i> on what to do, and buttons <i data-mdi="chart"></i> “HA statistics”, <i data-mdi="open"></i> “Entity”, <i data-mdi="candidates"></i> “In Candidates”.</p>
        <div class="tip">💡 Start with “only important”: those are the failures that break Energy, dashboards and automations.</div>`,
    },
  },

  // ───────────────────────────────────────────────────────────── statistics
  {
    id: "lts-cats",
    tab: "statistics",
    target: "lts-cats",
    ru: {
      title: "Статистика: категории",
      body: `<p>Вся долговременная статистика, разложенная по состоянию сущности. Тонкая полоска в плитке — доля категории по весу:</p>
        <ul>
          <li><i data-mdi="orphan"></i> <b>Сироты</b> — сущности больше нет</li>
          <li><i data-mdi="disabled"></i> <b>Отключены</b> — сущность отключена, статистика осталась</li>
          <li><i data-mdi="excluded"></i> <b>Исключены фильтром</b> — подпадают под recorder exclude</li>
          <li><i data-mdi="stopped"></i> <b>Запись остановлена</b> — сущность жива, но не пишется</li>
          <li><i data-mdi="healthy"></i> <b>Живые</b> и остальные категории</li>
        </ul>
        <div class="tip">💡 Здесь — «сырой» взгляд на всё. Вердикты «можно ли удалить» — на вкладке «Кандидаты».</div>`,
    },
    en: {
      title: "Statistics: categories",
      body: `<p>All long-term statistics, grouped by the state of the entity. The thin bar in a tile is the category's share by weight:</p>
        <ul>
          <li><i data-mdi="orphan"></i> <b>Orphans</b> — the entity no longer exists</li>
          <li><i data-mdi="disabled"></i> <b>Disabled</b> — the entity is disabled, statistics remain</li>
          <li><i data-mdi="excluded"></i> <b>Excluded by filter</b> — covered by recorder exclude</li>
          <li><i data-mdi="stopped"></i> <b>Recording stopped</b> — the entity is alive but not recorded</li>
          <li><i data-mdi="healthy"></i> <b>Healthy</b> and the other categories</li>
        </ul>
        <div class="tip">💡 This is the “raw” view of everything. The “can it be deleted” verdicts live on the Candidates tab.</div>`,
    },
  },
  {
    id: "lts-age",
    tab: "statistics",
    target: "lts-age",
    ru: {
      title: "Когда статистика писалась в последний раз",
      body: `<p>Столбики показывают, <b>сколько строк</b> у статистик, которые писались: сегодня, за неделю, за месяц, за год или давно. Цвет идёт от зелёного (свежая) к красному (старая).</p>
        <p>Под столбиком — число статистик. <b>Клик по столбику</b> оставляет в списке ниже только эту возрастную группу.</p>
        <div class="tip">💡 Высокие красные и оранжевые столбики — мёртвые сенсоры, которые зря занимают место. Сверьтесь с вкладкой «Кандидаты», прежде чем удалять.</div>`,
    },
    en: {
      title: "When the statistic was last written",
      body: `<p>The columns show <b>how many rows</b> belong to statistics last written: today, within a week, a month, a year, or long ago. Colours go from green (fresh) to red (old).</p>
        <p>Under each column: the number of statistics. <b>Click a column</b> to keep only that age group in the list below.</p>
        <div class="tip">💡 Tall red and orange columns are dead sensors that waste space. Check the Candidates tab before deleting.</div>`,
    },
  },
  {
    id: "lts-controls",
    tab: "statistics",
    target: "lts-controls",
    ru: {
      title: "Период, группировка, поиск",
      body: `<ul>
          <li><i data-mdi="calendar"></i> <b>Период</b> — считать строки за всё время или за последние 365 / 90 / 30 дней</li>
          <li><i data-mdi="shape"></i> <b>Группировка</b> — по статистике, устройству, интеграции, единице или категории</li>
          <li><i data-mdi="search"></i> <b>Поиск</b> по части имени</li>
        </ul>
        <div class="tip">💡 Каждая статистика даёт ровно одну строку в час, поэтому у живых сенсоров строк почти поровну. Группировка «по интеграции» быстро показывает, чья она.</div>`,
    },
    en: {
      title: "Period, grouping, search",
      body: `<ul>
          <li><i data-mdi="calendar"></i> <b>Period</b> — count rows for all time or the last 365 / 90 / 30 days</li>
          <li><i data-mdi="shape"></i> <b>Group by</b> — statistic, device, integration, unit or category</li>
          <li><i data-mdi="search"></i> <b>Search</b> by part of a name</li>
        </ul>
        <div class="tip">💡 Every statistic writes exactly one row per hour, so live sensors have almost the same row count. Grouping “by integration” quickly shows whose they are.</div>`,
    },
  },

  // ───────────────────────────────────────────────────────────── states
  {
    id: "states-controls",
    tab: "states",
    target: "states-controls",
    ru: {
      title: "Состояния: кто пишет больше всех",
      body: `<p>Сколько строк каждая сущность записала в таблицу <b>states</b>.</p>
        <ul>
          <li><i data-mdi="clock"></i> <b>Окно</b>: 1 час, 1 день или 7 дней</li>
          <li><i data-mdi="shape"></i> <b>Группировка</b>: сущность, устройство, интеграция, домен, зона</li>
        </ul>
        <div class="tip">💡 «Болтливые» сущности (датчики мощности с шагом в секунды, uptime, RSSI) раздувают базу сильнее всего. Их разумно добавить в recorder exclude.</div>`,
    },
    en: {
      title: "States: who writes the most",
      body: `<p>How many rows each entity wrote into the <b>states</b> table.</p>
        <ul>
          <li><i data-mdi="clock"></i> <b>Window</b>: 1 hour, 1 day or 7 days</li>
          <li><i data-mdi="shape"></i> <b>Group by</b>: entity, device, integration, domain, area</li>
        </ul>
        <div class="tip">💡 “Chatty” entities (power sensors updating every second, uptime, RSSI) grow the database the most. Consider adding them to recorder exclude.</div>`,
    },
  },
  {
    id: "states-top",
    tab: "states",
    target: "states-top",
    ru: {
      title: "Рейтинг «болтунов»",
      body: `<p>Горизонтальные столбики — десять самых активных сущностей (или групп, если выбрана группировка). Чем длиннее столбик, тем больше строк записано; справа — число и доля от всех записей.</p>
        <div class="tip">💡 Если пара сущностей занимает половину рейтинга — это первые кандидаты на recorder exclude. Полная таблица — ниже, с сортировкой по заголовкам.</div>`,
    },
    en: {
      title: "The “chatterbox” ranking",
      body: `<p>Horizontal bars show the ten most active entities (or groups, when a grouping is chosen). The longer the bar, the more rows were written; on the right — the count and the share of all records.</p>
        <div class="tip">💡 If a couple of entities take half of the ranking, they are the first candidates for recorder exclude. The full table is below, sortable by its headers.</div>`,
    },
  },
  {
    id: "states-events",
    tab: "states",
    target: "states-events",
    ru: {
      title: "События по типам",
      body: `<p>Столбики: какие типы событий чаще всего пишутся в таблицу <b>events</b>, сколько их и какая доля.</p>
        <div class="tip">💡 Если в топе сообщения об обновлении реестров или частые вызовы служб — это повод проверить автоматизации и интеграции, которые их порождают.</div>`,
    },
    en: {
      title: "Events by type",
      body: `<p>Bars: which event types are written to the <b>events</b> table most often, how many and what share.</p>
        <div class="tip">💡 If the top is registry updates or frequent service calls, check the automations and integrations that produce them.</div>`,
    },
  },

  // ───────────────────────────────────────────────────────────── diagnostics
  {
    id: "health-strip",
    tab: "health",
    target: "health-strip",
    ru: {
      title: "Здоровье с первого взгляда",
      body: `<p>Светофор из семи значков: идёт ли запись, очередь recorder, свежесть состояний, 5-минутной и часовой статистики, некорректные остановки и целостность базы.</p>
        <ul>
          <li><i data-mdi="check"></i> <b>Зелёный</b> — всё в норме</li>
          <li><i data-mdi="warning"></i> <b>Оранжевый</b> — стоит проверить</li>
          <li><i data-mdi="fail"></i> <b>Красный</b> — проблема</li>
          <li><i data-mdi="pending"></i> <b>Серый</b> — данных нет (например, проверка целостности ещё не запускалась)</li>
        </ul>
        <div class="tip">💡 Если все значки зелёные, остальную диагностику можно не читать.</div>`,
    },
    en: {
      title: "Health at a glance",
      body: `<p>A traffic light of seven badges: is recording on, the recorder queue, freshness of states, 5-minute and hourly statistics, unclean stops and database integrity.</p>
        <ul>
          <li><i data-mdi="check"></i> <b>Green</b> — all fine</li>
          <li><i data-mdi="warning"></i> <b>Orange</b> — worth checking</li>
          <li><i data-mdi="fail"></i> <b>Red</b> — a problem</li>
          <li><i data-mdi="pending"></i> <b>Grey</b> — no data (e.g. the integrity check has not been run yet)</li>
        </ul>
        <div class="tip">💡 If every badge is green you can skip the rest of the diagnostics.</div>`,
    },
  },
  {
    id: "health-grid",
    tab: "health",
    target: "health-grid",
    ru: {
      title: "Диагностика: подробности",
      body: `<ul>
          <li><i data-mdi="speed"></i> <b>Нагрузка записи</b> — столбики: состояний в минуту за 5 минут и за час; ниже — событий в час</li>
          <li><i data-mdi="clock"></i> <b>Свежесть данных</b> — когда была последняя запись; галочка или предупреждение</li>
          <li><i data-mdi="pulse"></i> <b>Пробные запросы</b> — время отклика базы и график динамики с мин/макс</li>
          <li><i data-mdi="database"></i> <b>Файл</b> — кольца «свободно на диске» и «пустые страницы», размер, WAL, сколько освободит VACUUM</li>
          <li><i data-mdi="recorder"></i> <b>Recorder</b> — очередь, хранение, интервал, а ниже — запуски на оси времени: разрыв между полосами = HA был выключен</li>
        </ul>
        <div class="tip">💡 Растущая очередь или предупреждение у свежести — повод заглянуть в журнал Home Assistant. У пробных запросов важна динамика, а не одно число.</div>`,
    },
    en: {
      title: "Diagnostics: details",
      body: `<ul>
          <li><i data-mdi="speed"></i> <b>Write load</b> — bars: states per minute over 5 minutes and over an hour; below, events per hour</li>
          <li><i data-mdi="clock"></i> <b>Data freshness</b> — when the last record was written; a tick or a warning</li>
          <li><i data-mdi="pulse"></i> <b>Probe queries</b> — database response time and a trend graph with min/max</li>
          <li><i data-mdi="database"></i> <b>File</b> — “free disk” and “empty pages” rings, size, WAL, how much VACUUM would free</li>
          <li><i data-mdi="recorder"></i> <b>Recorder</b> — queue, retention, interval, and below the runs on a time axis: a gap between bars = HA was off</li>
        </ul>
        <div class="tip">💡 A growing queue or a warning in freshness is a reason to look at the Home Assistant log. For probe queries the trend matters, not a single number.</div>`,
    },
  },
  {
    id: "health-integrity",
    tab: "health",
    target: "health-integrity",
    ru: {
      title: "Проверка целостности",
      body: `<p>Кнопка <i data-mdi="play"></i> «Проверить» запускает <code>PRAGMA quick_check</code> и <code>foreign_key_check</code> на соединении <b>только для чтения</b>. Результат — крупный щит: <i data-mdi="shield_ok"></i> зелёный или <i data-mdi="shield_bad"></i> красный.</p>
        <div class="tip">💡 Проверка читает весь файл, на большой базе это заметно по времени. Запускайте перед удалением или после аварийного отключения питания.</div>`,
    },
    en: {
      title: "Integrity check",
      body: `<p>The <i data-mdi="play"></i> “Check” button runs <code>PRAGMA quick_check</code> and <code>foreign_key_check</code> on a <b>read-only</b> connection. The result is a big shield: <i data-mdi="shield_ok"></i> green or <i data-mdi="shield_bad"></i> red.</p>
        <div class="tip">💡 The check reads the whole file, so on a big database it takes noticeable time. Run it before a deletion or after an unexpected power loss.</div>`,
    },
  },

  // ───────────────────────────────────────────────────────────── maintenance
  {
    id: "maint-flow",
    tab: "maintenance",
    target: "maint-flow",
    ru: {
      title: "Как удаление остаётся безопасным",
      body: `<p>Схема со стрелками — путь любого удаления:</p>
        <ul>
          <li><i data-mdi="shield_ok"></i> <b>Проверки</b> → <i data-mdi="backup"></i> <b>Бэкап</b> → <i data-mdi="delete"></i> <b>Удаление</b> порциями → <i data-mdi="vacuum"></i> <b>Сжатие</b> (по желанию)</li>
          <li><i data-mdi="restore"></i> Пунктирный блок — <b>отмена</b>: строки можно вернуть из архива</li>
        </ul>
        <div class="tip">💡 Во время задания тот же ряд значков показывается вверху: пройденные шаги зеленеют, текущий пульсирует.</div>`,
    },
    en: {
      title: "How deletion stays safe",
      body: `<p>A scheme with arrows — the path of any deletion:</p>
        <ul>
          <li><i data-mdi="shield_ok"></i> <b>Checks</b> → <i data-mdi="backup"></i> <b>Backup</b> → <i data-mdi="delete"></i> <b>Deletion</b> in batches → <i data-mdi="vacuum"></i> <b>Compaction</b> (optional)</li>
          <li><i data-mdi="restore"></i> The dashed block is the <b>undo</b>: rows can be brought back from the archive</li>
        </ul>
        <div class="tip">💡 While a job runs, the same row of badges appears on top: finished steps turn green and the current one pulses.</div>`,
    },
  },
  {
    id: "maint-actions",
    tab: "maintenance",
    target: "maint-actions",
    ru: {
      title: "Обслуживание: действия",
      body: `<ul>
          <li><i data-mdi="backup"></i> <b>Сделать бэкап</b> — копия базы без остановки HA (SQLite Online Backup) с проверкой целостности</li>
          <li><i data-mdi="vacuum"></i> <b>Сжать базу (VACUUM)</b> — переписывает файл без пустых страниц и возвращает место на диск</li>
        </ul>
        <p>Ниже — кольцо «пустые страницы», размер, место на диске, папка бэкапов и свежий бэкап.</p>
        <div class="warn">⚠️ Во время VACUUM recorder приостанавливает запись (события ждут в памяти), поэтому делайте его в спокойное время. Ход любого задания виден вверху, его можно отменить после текущей порции.</div>`,
    },
    en: {
      title: "Maintenance: actions",
      body: `<ul>
          <li><i data-mdi="backup"></i> <b>Make a backup</b> — a copy of the database without stopping HA (SQLite Online Backup), with an integrity check</li>
          <li><i data-mdi="vacuum"></i> <b>Compact database (VACUUM)</b> — rewrites the file without empty pages and gives disk space back</li>
        </ul>
        <p>Below: the “empty pages” ring, size, free disk space, backup folder and the latest backup.</p>
        <div class="warn">⚠️ During VACUUM the recorder pauses writing (events wait in memory), so do it at a quiet time. The progress of any job is shown on top, and it can be cancelled after the current batch.</div>`,
    },
  },
  {
    id: "maint-backups",
    tab: "maintenance",
    target: "maint-backups",
    ru: {
      title: "Бэкапы базы",
      body: `<p>Хранятся два последних бэкапа (по умолчанию в <code>/share/database_cleaner/backups</code>), каждый с зелёной отметкой <i data-mdi="verified"></i> «проверен».</p>
        <div class="warn">⚠️ Полное восстановление файла требует остановить Core: <code>ha core stop</code> → переименовать <code>home-assistant_v2.db</code> (и -wal, -shm) → положить бэкап под этим именем → <code>ha core start</code>.</div>
        <div class="tip">💡 Папку, число бэкапов и размер порции можно изменить в настройках интеграции.</div>`,
    },
    en: {
      title: "Database backups",
      body: `<p>The two latest backups are kept (by default in <code>/share/database_cleaner/backups</code>), each with a green <i data-mdi="verified"></i> “verified” mark.</p>
        <div class="warn">⚠️ Restoring the whole file requires stopping Core: <code>ha core stop</code> → rename <code>home-assistant_v2.db</code> (and -wal, -shm) → put the backup in its place under that name → <code>ha core start</code>.</div>
        <div class="tip">💡 The folder, the number of backups and the batch size can be changed in the integration settings.</div>`,
    },
  },
  {
    id: "maint-archives",
    tab: "maintenance",
    target: "maint-archives",
    ru: {
      title: "Архивы отмены",
      body: `<p>Перед каждым удалением строки статистики сохраняются в архив. Кнопка <i data-mdi="restore"></i> <b>«Восстановить»</b> возвращает их через официальный импорт статистики — <b>без остановки HA</b>.</p>
        <div class="tip">💡 Архивы хранятся 30 дней. Передумали — вернуть удалённое можно в пару кликов. Рядом, в «Журнале», история всех заданий: значок показывает итог, а две полоски «до → после» — сколько места удалось вернуть.</div>`,
    },
    en: {
      title: "Undo archives",
      body: `<p>Before every deletion the statistics rows are saved to an archive. The <i data-mdi="restore"></i> <b>“Restore”</b> button brings them back through the official statistics import — <b>without stopping HA</b>.</p>
        <div class="tip">💡 Archives are kept for 30 days. Changed your mind? Restoring takes a couple of clicks. Next to it, the “Journal” shows the history of all jobs: the badge shows the outcome and the two “before → after” bars show how much space was won back.</div>`,
    },
  },

  // ───────────────────────────────────────────────────────────── finish
  {
    id: "finish",
    tab: "overview",
    chip: "🏁",
    ru: {
      title: "Готово — порядок работы",
      body: `<ol>
          <li><i data-mdi="overview"></i> <b>Обзор</b> — понять, что занимает место</li>
          <li><i data-mdi="candidates"></i> <b>Кандидаты</b> — «Можно удалить», по одной причине за раз</li>
          <li><i data-mdi="yaml"></i> <b>YAML для exclude</b> — для живых сенсоров, чтобы не копили заново</li>
          <li><i data-mdi="delete"></i> <b>Удалить выбранное</b> — бэкап и проверки сделаются сами</li>
          <li><i data-mdi="maintenance"></i> <b>Обслуживание</b> — при желании сжать базу (VACUUM)</li>
          <li><i data-mdi="issues"></i> <b>Проблемы</b> — заглядывать после обновлений HA</li>
        </ol>
        <div class="tip">💡 Экскурсия всегда под рукой — кнопка «?» в заголовке.</div>`,
    },
    en: {
      title: "Done — the workflow",
      body: `<ol>
          <li><i data-mdi="overview"></i> <b>Overview</b> — see what takes the space</li>
          <li><i data-mdi="candidates"></i> <b>Candidates</b> — “Safe to delete”, one reason at a time</li>
          <li><i data-mdi="yaml"></i> <b>YAML for exclude</b> — for live sensors, so they do not collect again</li>
          <li><i data-mdi="delete"></i> <b>Delete selected</b> — the backup and checks happen automatically</li>
          <li><i data-mdi="maintenance"></i> <b>Maintenance</b> — optionally compact the database (VACUUM)</li>
          <li><i data-mdi="issues"></i> <b>Problems</b> — check it after Home Assistant updates</li>
        </ol>
        <div class="tip">💡 The tour is always at hand — the “?” button in the header.</div>`,
    },
  },
];

// ─────────────────────────────────────────────────────────────────── UI strings
const UI = {
  ru: {
    back: "← Назад",
    next: "Далее →",
    done: "Готово ✓",
    close: "Закрыть (Esc)",
    step: "Шаг {n} из {m}",
    loading: "Загружаю данные вкладки…",
    keys: "← → переход · Esc выход",
    sections: {
      overview: "Обзор",
      candidates: "Кандидаты",
      issues: "Проблемы",
      statistics: "Статистика",
      states: "Состояния",
      health: "Диагностика",
      maintenance: "Обслуживание",
    },
  },
  en: {
    back: "← Back",
    next: "Next →",
    done: "Done ✓",
    close: "Close (Esc)",
    step: "Step {n} of {m}",
    loading: "Loading the tab data…",
    keys: "← → navigate · Esc close",
    sections: {
      overview: "Overview",
      candidates: "Candidates",
      issues: "Problems",
      statistics: "Statistics",
      states: "States",
      health: "Diagnostics",
      maintenance: "Maintenance",
    },
  },
};

// ─────────────────────────────────────────────────────────────────── styles
// Colours come from the active Home Assistant theme, like the panel itself.
const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  .blocker { position: fixed; inset: 0; background: transparent; transition: background .3s; touch-action: none; }
  .blocker.dim { background: rgba(0,0,0,.62); }
  .hole {
    position: fixed; border-radius: 12px; pointer-events: none; opacity: 0;
    box-shadow: 0 0 0 3px var(--primary-color, #03a9f4), 0 0 24px 4px rgba(3,169,244,.5), 0 0 0 100vmax rgba(0,0,0,.62);
    transition: left .3s ease, top .3s ease, width .3s ease, height .3s ease, opacity .2s;
  }
  .bubble {
    position: fixed; width: min(540px, calc(100vw - 24px)); max-height: calc(100vh - 24px);
    display: flex; flex-direction: column;
    background: var(--card-background-color, #fff); color: var(--primary-text-color, #212121);
    border: 1px solid var(--divider-color, rgba(127,127,127,.35)); border-radius: 16px;
    box-shadow: 0 14px 48px rgba(0,0,0,.55); padding: 18px 22px 14px;
    font-family: var(--ha-font-family-body, Roboto, system-ui, sans-serif);
    font-size: 17px; line-height: 1.5;
    transition: left .3s ease, top .3s ease;
  }
  .arrow {
    position: absolute; width: 18px; height: 18px; transform: rotate(45deg);
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color, rgba(127,127,127,.35));
  }
  header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .chip {
    font-size: 14px; font-weight: 500; padding: 3px 12px; border-radius: 999px;
    color: var(--primary-color, #03a9f4); background: rgba(3,169,244,.14);
  }
  .x { border: 0; background: none; color: var(--secondary-text-color, #727272); font-size: 20px; cursor: pointer;
       border-radius: 50%; width: 34px; height: 34px; }
  .x:hover { background: rgba(127,127,127,.18); }
  .scroll { overflow-y: auto; min-height: 0; padding-right: 4px; }
  h2 { margin: 4px 0 10px; font-size: 22px; font-weight: 600; line-height: 1.25; color: var(--primary-color, #03a9f4); }
  p { margin: 0 0 10px; }
  ul, ol { margin: 0 0 10px; padding-left: 22px; font-size: 16.5px; }
  li { margin: 4px 0; }
  i[data-mdi] { display: inline-block; width: 1.2em; height: 1.2em; vertical-align: -0.22em; color: var(--primary-color, #03a9f4); }
  i[data-mdi] svg { display: block; width: 100%; height: 100%; }
  .chip i[data-mdi] { margin-right: 5px; vertical-align: -0.2em; }
  code { font-family: ui-monospace, Consolas, monospace; font-size: 14.5px; padding: 1px 5px; border-radius: 5px; background: rgba(127,127,127,.2); }
  .tip, .warn { margin: 12px 0 4px; padding: 10px 14px; border-radius: 10px; font-size: 16px; border-left: 4px solid; }
  .tip  { background: rgba(3,169,244,.13);  border-color: var(--primary-color, #03a9f4); }
  .warn { background: rgba(255,166,0,.15);  border-color: var(--warning-color, #ffa600); }
  .waiting { display: none; align-items: center; gap: 10px; margin: 6px 0 2px; color: var(--secondary-text-color, #727272); font-size: 15px; }
  .waiting.on { display: flex; }
  .spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(127,127,127,.35); border-top-color: var(--primary-color, #03a9f4); animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .bar { height: 5px; border-radius: 3px; background: rgba(127,127,127,.22); margin: 12px 0 10px; overflow: hidden; flex: none; }
  .bar i { display: block; height: 100%; width: 0; background: var(--primary-color, #03a9f4); transition: width .3s ease; }
  footer { display: flex; align-items: center; gap: 10px; flex: none; }
  .count { font-size: 14px; color: var(--secondary-text-color, #727272); }
  .keys { font-size: 12.5px; color: var(--secondary-text-color, #727272); opacity: .8; }
  .spacer { flex: 1; }
  button.btn {
    font: inherit; font-size: 16px; border: 0; border-radius: 10px; padding: 9px 18px; cursor: pointer;
    background: rgba(127,127,127,.2); color: var(--primary-text-color, #212121);
  }
  button.btn:hover { background: rgba(127,127,127,.32); }
  button.btn:disabled { opacity: .4; cursor: default; }
  button.pri { background: var(--primary-color, #03a9f4); color: #fff; font-weight: 500; }
  button.pri:hover { filter: brightness(1.1); background: var(--primary-color, #03a9f4); }
  button:focus-visible { outline: 3px solid rgba(3,169,244,.6); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
  @media (max-width: 600px) {
    .bubble { font-size: 16px; padding: 14px 16px 12px; max-height: 62vh; }
    h2 { font-size: 20px; } ul, ol, .tip, .warn { font-size: 15.5px; } .keys { display: none; }
  }
`;

// ─────────────────────────────────────────────────────────────────── helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Nearest scrollable ancestor, crossing shadow-DOM boundaries. */
function scrollParent(start) {
  let n = start;
  while (n) {
    if (n instanceof Element) {
      const oy = getComputedStyle(n).overflowY;
      if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 1) return n;
    }
    n = n.parentElement || n.getRootNode?.().host || null;
  }
  return document.scrollingElement || document.documentElement;
}

/**
 * Start the tour. `panel` is the <database-cleaner-panel> element and must provide
 * shadowRoot, tourTab, tourGoTo(tab), tourPrepare(key) and tourBusy().
 * Returns { close() }.
 */
export function startTour(panel, { lang = "en", onClose, icons = {}, theme = {} } = {}) {
  const ui = UI[lang] || UI.en;
  const steps = TOUR_STEPS;
  const startTab = panel.tourTab;

  const host = document.createElement("div");
  host.setAttribute("data-database-cleaner-tour", "");
  host.style.cssText = "position:fixed;inset:0;z-index:2147483000;";
  for (const [name, value] of Object.entries(theme)) host.style.setProperty(name, value); // same palette as the panel
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>${CSS}</style>
    <div class="blocker dim"></div>
    <div class="hole"></div>
    <section class="bubble" role="dialog" aria-modal="true" aria-live="polite">
      <div class="arrow"></div>
      <header><span class="chip"></span><button class="x" aria-label="${ui.close}" title="${ui.close}">✕</button></header>
      <div class="scroll"><h2></h2><div class="body"></div>
        <div class="waiting"><span class="spin"></span><span>${ui.loading}</span></div></div>
      <div class="bar"><i></i></div>
      <footer>
        <span class="count"></span><span class="keys">${ui.keys}</span><span class="spacer"></span>
        <button class="btn back"></button><button class="btn pri next"></button>
      </footer>
    </section>`;
  document.body.appendChild(host);

  const $ = (s) => root.querySelector(s);
  const blocker = $(".blocker");
  const hole = $(".hole");
  const bubble = $(".bubble");
  const arrow = $(".arrow");
  const chip = $(".chip");
  const title = $("h2");
  const body = $(".body");
  const waiting = $(".waiting");
  const bar = $(".bar i");
  const count = $(".count");
  const back = $(".back");
  const next = $(".next");

  /** Fill the <i data-mdi> placeholders with the panel's own MDI icons. */
  const paint = (el) => {
    el.querySelectorAll("i[data-mdi]").forEach((n) => {
      const path = icons[n.dataset.mdi];
      n.innerHTML = path ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg>` : "";
    });
  };

  let idx = -1;
  let token = 0;
  let target = null;
  let open = true;
  let raf = 0;
  let lastKey = "";

  const find = (name) => panel.shadowRoot.querySelector(`[data-tour="${name}"]`);
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  async function waitFor(name, mine) {
    const t0 = Date.now();
    let idle = 0;
    while (open && mine === token && Date.now() - t0 < 90000) {
      const el = find(name);
      if (el && visible(el)) return el;
      idle = panel.tourBusy() ? 0 : idle + 1;
      if (idle > 10) return null; // data is loaded but this element is not on the page
      if (Date.now() - t0 > 400) waiting.classList.add("on");
      await sleep(120);
    }
    return null;
  }

  async function show(n) {
    if (!open) return;
    idx = Math.max(0, Math.min(steps.length - 1, n));
    const mine = ++token;
    const step = steps[idx];
    const txt = step[lang] || step.en;

    chip.textContent = [step.chip, step.tab && ui.sections[step.tab]].filter(Boolean).join(" ");
    if (step.tab) {
      const tabIcon = document.createElement("i");
      tabIcon.dataset.mdi = step.tab;
      chip.prepend(tabIcon);
      paint(chip);
    }
    title.textContent = txt.title;
    body.innerHTML = txt.body;
    paint(body);
    waiting.classList.remove("on");
    count.textContent = ui.step.replace("{n}", idx + 1).replace("{m}", steps.length);
    bar.style.width = `${((idx + 1) / steps.length) * 100}%`;
    back.textContent = ui.back;
    back.disabled = idx === 0;
    next.textContent = idx === steps.length - 1 ? ui.done : ui.next;
    $(".scroll").scrollTop = 0;
    next.focus({ preventScroll: true });

    if (step.tab) panel.tourGoTo(step.tab);
    if (step.prepare) panel.tourPrepare(step.prepare);

    target = null;
    if (step.target) {
      target = await waitFor(step.target, mine);
      if (!open || mine !== token) return;
    }
    waiting.classList.remove("on");
    if (target) alignTarget(target);
    lastKey = "";
    layout();
  }

  /** Bring the target into the upper part of the visible area, below sticky headers. */
  function alignTarget(el) {
    if (el.closest(".toolbar, .tabs")) return; // sticky, always visible
    const tabs = panel.shadowRoot.querySelector(".tabs");
    const headerBottom = tabs ? Math.max(tabs.getBoundingClientRect().bottom, 0) : 0;
    // Keep the target high (just under the sticky header) so the bubble fits below it;
    // for targets taller than the screen this shows their top part.
    const delta = el.getBoundingClientRect().top - (headerBottom + 16);
    if (Math.abs(delta) > 2) scrollParent(el).scrollBy({ top: delta, behavior: "smooth" });
  }

  function layout() {
    if (!open) return;
    const step = steps[idx];
    if (!step) return;
    let el = null;
    if (step.target) {
      el = find(step.target); // re-query: the panel re-renders while data loads
      if (el && !visible(el)) el = null;
    }
    target = el;
    const vw = innerWidth;
    const vh = innerHeight;
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const r = el ? el.getBoundingClientRect() : null;
    const key = [vw, vh, bw, bh, r && [r.left, r.top, r.width, r.height].map(Math.round).join(","), idx].join("|");
    if (key === lastKey) return;
    lastKey = key;

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    if (!r) {
      hole.style.opacity = "0";
      blocker.classList.add("dim");
      arrow.style.display = "none";
      bubble.style.left = `${(vw - bw) / 2}px`;
      bubble.style.top = `${Math.max(12, (vh - bh) / 2)}px`;
      return;
    }
    blocker.classList.remove("dim");
    const pad = 6;
    const top = Math.max(r.top, 0);
    const bottom = Math.min(r.bottom, vh);
    const left = Math.max(r.left, 0);
    const right = Math.min(r.right, vw);
    hole.style.opacity = bottom > top ? "1" : "0";
    hole.style.left = `${left - pad}px`;
    hole.style.top = `${top - pad}px`;
    hole.style.width = `${right - left + pad * 2}px`;
    hole.style.height = `${bottom - top + pad * 2}px`;

    const gap = 20;
    const fit = {
      bottom: vh - bottom >= bh + gap + 10,
      top: top >= bh + gap + 10,
      right: vw - right >= bw + gap + 10,
      left: left >= bw + gap + 10,
    };
    const order = ["bottom", "top", "right", "left"];
    if (step.place && fit[step.place]) order.unshift(step.place);
    const place = order.find((p) => fit[p]) || "float";

    let bx;
    let by;
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    if (place === "bottom") [bx, by] = [cx - bw / 2, bottom + pad + gap];
    else if (place === "top") [bx, by] = [cx - bw / 2, top - pad - gap - bh];
    else if (place === "right") [bx, by] = [right + pad + gap, cy - bh / 2];
    else if (place === "left") [bx, by] = [left - pad - gap - bw, cy - bh / 2];
    else {
      // Nothing fits beside the target: float at the top or bottom edge, wherever it covers less.
      const overlap = (y) => Math.max(0, Math.min(y + bh, bottom) - Math.max(y, top));
      const [lowY, highY] = [vh - bh - 14, 12];
      [bx, by] = [(vw - bw) / 2, overlap(highY) < overlap(lowY) ? highY : lowY];
    }
    bx = clamp(bx, 12, Math.max(12, vw - bw - 12));
    by = clamp(by, 12, Math.max(12, vh - bh - 12));
    bubble.style.left = `${bx}px`;
    bubble.style.top = `${by}px`;

    arrow.style.display = place === "float" ? "none" : "block";
    if (place === "bottom" || place === "top") {
      arrow.style.left = `${clamp(cx - bx - 9, 22, bw - 40)}px`;
      arrow.style.top = place === "bottom" ? "-10px" : `${bh - 8}px`;
      arrow.style.borderWidth = place === "bottom" ? "1px 0 0 1px" : "0 1px 1px 0";
    } else {
      arrow.style.top = `${clamp(cy - by - 9, 22, bh - 40)}px`;
      arrow.style.left = place === "right" ? "-10px" : `${bw - 8}px`;
      arrow.style.borderWidth = place === "right" ? "0 0 1px 1px" : "1px 1px 0 0";
    }
  }

  function tick() {
    if (!open) return;
    layout();
    raf = requestAnimationFrame(tick);
  }

  function close() {
    if (!open) return;
    open = false;
    token++;
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey, true);
    host.remove();
    try {
      if (startTab) panel.tourGoTo(startTab); // put the user back where they were
    } catch (_err) {
      /* panel already gone */
    }
    onClose?.();
  }

  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (idx < steps.length - 1) show(idx + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (idx > 0) show(idx - 1);
    }
  }

  // The page behind is locked, but wheel / touch still scroll it so tall targets stay reachable.
  blocker.addEventListener("wheel", (e) => {
    e.preventDefault();
    scrollParent(target || panel).scrollBy({ top: e.deltaY });
  }, { passive: false });
  let touchY = null;
  blocker.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  blocker.addEventListener("touchmove", (e) => {
    const y = e.touches[0].clientY;
    if (touchY != null) scrollParent(target || panel).scrollBy({ top: touchY - y });
    touchY = y;
  }, { passive: true });

  $(".x").addEventListener("click", close);
  back.addEventListener("click", () => idx > 0 && show(idx - 1));
  next.addEventListener("click", () => (idx >= steps.length - 1 ? close() : show(idx + 1)));
  window.addEventListener("keydown", onKey, true);

  show(0);
  raf = requestAnimationFrame(tick);
  return { close };
}
