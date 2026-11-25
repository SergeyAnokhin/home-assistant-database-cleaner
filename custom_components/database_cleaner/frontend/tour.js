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
 *   • ru / en  title + body (HTML). Allowed: <p>, <ul><li>, <b>, <code>,
 *              <div class="tip">💡 …</div> and <div class="warn">⚠️ …</div>.
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
          <li>🔍 Анализ только <b>читает</b> базу — ничего не меняет</li>
          <li>🔒 Удаление идёт только через recorder, после <b>бэкапа</b> и проверок</li>
          <li>⚡ Статистику панели «Энергия» удалить нельзя</li>
        </ul>
        <div class="tip">💡 Шаги меняются <b>только по кнопке «Далее»</b> (или клавише →). Esc — выйти. Читайте не торопясь.</div>`,
    },
    en: {
      title: "Welcome to Database Cleaner",
      body: `<p>This panel shows <b>what makes your Home Assistant database grow</b>, finds <b>unneeded long-term statistics</b> and helps you remove them safely.</p>
        <ul>
          <li>🔍 Analysis only <b>reads</b> the database — nothing is changed</li>
          <li>🔒 Deletion goes through the recorder only, after a <b>backup</b> and checks</li>
          <li>⚡ Statistics used by the Energy dashboard can never be deleted</li>
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
          <li>📊 <b>Обзор</b> — сколько места занято и чем</li>
          <li>🗑️ <b>Кандидаты</b> — что можно удалить</li>
          <li>🩺 <b>Проблемы</b> — что не так со статистикой</li>
          <li>📈 <b>Статистика</b> и 📝 <b>Состояния</b> — кто сколько пишет</li>
          <li>🔧 <b>Диагностика</b> — здоровье recorder</li>
          <li>🛠️ <b>Обслуживание</b> — бэкап, сжатие, отмена</li>
        </ul>
        <div class="tip">💡 Не знаете, с чего начать? «Обзор» → «Кандидаты» → «Обслуживание».</div>`,
    },
    en: {
      title: "Seven tabs — from general to specific",
      body: `<p>Go left to right, like a funnel:</p>
        <ul>
          <li>📊 <b>Overview</b> — how much space is used and by what</li>
          <li>🗑️ <b>Candidates</b> — what can be deleted</li>
          <li>🩺 <b>Problems</b> — what is wrong with statistics</li>
          <li>📈 <b>Statistics</b> and 📝 <b>States</b> — who writes how much</li>
          <li>🔧 <b>Diagnostics</b> — recorder health</li>
          <li>🛠️ <b>Maintenance</b> — backup, compaction, undo</li>
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
      body: `<p>Запустить экскурсию заново можно в любой момент этой кнопкой. Пока вы её не нажимали, она слегка мигает.</p>
        <div class="tip">💡 Экскурсия ничего не меняет в базе и не нажимает кнопки за вас — она только показывает и объясняет.</div>`,
    },
    en: {
      title: "The “?” button — this tour",
      body: `<p>Use this button to restart the tour at any time. Until you open it for the first time it pulses slightly.</p>
        <div class="tip">💡 The tour never changes the database and never presses buttons for you — it only shows and explains.</div>`,
    },
  },
  {
    id: "refresh",
    tab: "overview",
    target: "refresh",
    ru: {
      title: "Обновить данные",
      body: `<p>Тяжёлые запросы к базе <b>кэшируются</b> на сервере — в шапке карточек видно «посчитано N с назад». Эта кнопка пересчитывает данные <b>текущей вкладки</b>.</p>
        <p>Слева от неё в заголовке указаны версия панели и путь к файлу базы.</p>
        <div class="tip">💡 Первый расчёт на большой базе занимает 10–60 секунд. Это нормально, повторные открытия мгновенные.</div>`,
    },
    en: {
      title: "Refresh the data",
      body: `<p>Heavy database queries are <b>cached</b> on the server — card headers show “computed N s ago”. This button recomputes the data of the <b>current tab</b>.</p>
        <p>To its left the title shows the panel version and the path of the database file.</p>
        <div class="tip">💡 The first calculation on a big database takes 10–60 seconds. That is normal; later visits are instant.</div>`,
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
          <li>💾 <b>База</b> и <b>WAL</b> — размер файла и журнала записи</li>
          <li>🖴 <b>Свободно на диске</b> — места для бэкапа и VACUUM должно хватать</li>
          <li>📈 <b>Долговременная статистика</b> и 📝 <b>Состояния</b> — их доля в базе и число строк</li>
          <li>⚙️ <b>Recorder</b> — срок хранения, интервал записи, есть ли фильтр exclude</li>
          <li>🧬 <b>Схема</b> — версия схемы базы (панель проверена до 53)</li>
        </ul>
        <div class="tip">💡 Если «Долговременная статистика» занимает 70–90 % — чистить нужно именно её (вкладка «Кандидаты»). Если «Состояния» — смотрите вкладку «Состояния».</div>`,
    },
    en: {
      title: "Overview: key numbers",
      body: `<ul>
          <li>💾 <b>Database</b> and <b>WAL</b> — size of the file and its write-ahead log</li>
          <li>🖴 <b>Free disk</b> — there must be room for a backup and VACUUM</li>
          <li>📈 <b>Long-term statistics</b> and 📝 <b>States</b> — their share of the database and row counts</li>
          <li>⚙️ <b>Recorder</b> — retention, commit interval, whether an exclude filter exists</li>
          <li>🧬 <b>Schema</b> — database schema version (the panel is verified up to 53)</li>
        </ul>
        <div class="tip">💡 If “Long-term statistics” takes 70–90 % — that is what to clean (Candidates tab). If it is “States” — look at the States tab.</div>`,
    },
  },
  {
    id: "overview-space",
    tab: "overview",
    target: "overview-space",
    ru: {
      title: "Куда уходит место",
      body: `<p>Цветная полоса — доля каждой группы таблиц: долговременная статистика, состояния, 5-минутная статистика, события, служебные.</p>
        <div class="tip">💡 Долговременная статистика хранится бессрочно и сама не очищается — поэтому обычно именно она самая большая. Состояния и события чистятся автоматически по сроку хранения.</div>`,
    },
    en: {
      title: "Where the space goes",
      body: `<p>The coloured bar shows the share of each table group: long-term statistics, states, 5-minute statistics, events, service tables.</p>
        <div class="tip">💡 Long-term statistics are kept forever and never purged automatically — so they are usually the biggest part. States and events are purged automatically after the retention period.</div>`,
    },
  },
  {
    id: "overview-since",
    tab: "overview",
    target: "overview-since",
    ru: {
      title: "Данные с…",
      body: `<p>С какой даты и по какую в базе есть данные: состояния, долговременная и 5-минутная статистика, события.</p>
        <div class="tip">💡 5-минутная статистика хранится около 10 дней, состояния — столько, сколько задано в recorder, а долговременная может тянуться годами. Это нормально.</div>`,
    },
    en: {
      title: "Data since…",
      body: `<p>The date range present in the database: states, long-term and 5-minute statistics, events.</p>
        <div class="tip">💡 5-minute statistics are kept for about 10 days, states for as long as the recorder is configured, and long-term statistics may span years. That is normal.</div>`,
    },
  },
  {
    id: "overview-tables",
    tab: "overview",
    target: "overview-tables",
    ru: {
      title: "Таблицы базы",
      body: `<p>Размер каждой таблицы SQLite: строки, данные, индексы, итого и доля. Сверху — самые тяжёлые.</p>
        <div class="warn">⚠️ После удаления строк файл базы <b>сам не уменьшается</b>: пустые страницы остаются внутри. Вернуть место на диск может только «Сжать базу (VACUUM)» на вкладке «Обслуживание».</div>`,
    },
    en: {
      title: "Database tables",
      body: `<p>The size of every SQLite table: rows, data, indexes, total and share. The heaviest are on top.</p>
        <div class="warn">⚠️ After rows are deleted the database file <b>does not shrink by itself</b>: empty pages stay inside. Only “Compact database (VACUUM)” on the Maintenance tab gives disk space back.</div>`,
    },
  },

  // ───────────────────────────────────────────────────────────── candidates
  {
    id: "cand-coverage",
    tab: "candidates",
    prepare: "cand-safe",
    target: "cand-coverage",
    ru: {
      title: "Кандидаты: где искали ссылки",
      body: `<p>Прежде чем вынести вердикт, панель ищет сущность в: <b>«Энергии», дашбордах, автоматизациях, скриптах, сценах, группах, людях, хелперах</b> и в тексте всех YAML-файлов конфигурации.</p>
        <p>Число рядом — сколько ссылок найдено. Пометка «не проверялось» — источник прочитать не удалось.</p>
        <div class="warn">⚠️ Не видны Node-RED, AppDaemon, Grafana, InfluxDB и пакеты вне папки конфига. Если что-то из этого читает ваши сенсоры — проверьте вручную.</div>`,
    },
    en: {
      title: "Candidates: where we looked for references",
      body: `<p>Before giving a verdict, the panel searches for the entity in: <b>Energy, dashboards, automations, scripts, scenes, groups, people, helpers</b> and the text of all YAML files in the config folder.</p>
        <p>The number is how many references were found. “not scanned” means that source could not be read.</p>
        <div class="warn">⚠️ Node-RED, AppDaemon, Grafana, InfluxDB and packages outside the config folder are invisible. If any of them reads your sensors — check by hand.</div>`,
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
          <li>🗑️ <b>Можно удалить</b> — сущности нет, она отключена или исключена, и ничто на неё не ссылается</li>
          <li>💤 <b>Нигде не используются</b> — сенсор жив, но им не пользуется ни дашборд, ни автоматизация</li>
          <li>🔍 <b>Проверить</b> — статистика остановилась или источник непонятен</li>
          <li>✅ <b>Используются</b> — есть ссылка из дашборда, автоматизации, скрипта…</li>
          <li>⚡ <b>Энергия</b> — защищено, к удалению не предлагается</li>
        </ul>
        <div class="tip">💡 Клик по карточке переключает список ниже. Начинайте с «Можно удалить».</div>`,
    },
    en: {
      title: "Five verdicts",
      body: `<ul>
          <li>🗑️ <b>Safe to delete</b> — the entity is gone, disabled or excluded, and nothing references it</li>
          <li>💤 <b>Not used anywhere</b> — the sensor is alive, but no dashboard or automation uses it</li>
          <li>🔍 <b>Review</b> — statistics stopped or the source is unclear</li>
          <li>✅ <b>In use</b> — referenced by a dashboard, automation, script…</li>
          <li>⚡ <b>Energy</b> — protected, never offered for deletion</li>
        </ul>
        <div class="tip">💡 Click a card to switch the list below. Start with “Safe to delete”.</div>`,
    },
  },
  {
    id: "cand-reasons",
    tab: "candidates",
    prepare: "cand-safe",
    target: "cand-reasons",
    ru: {
      title: "Причины — чипы-фильтры",
      body: `<p>Внутри вердикта кандидаты делятся по причине: <b>сущности нет</b>, <b>отключена</b>, <b>исключена</b>, <b>служебная единица</b>, <b>облачная погода</b>, <b>похоже на тест</b>, <b>почти пустая</b>…</p>
        <p>Рядом с каждой — число статистик и сколько места они занимают. Клик по чипу оставляет в списке только эту причину.</p>
        <div class="tip">💡 Удаляйте по одной причине за раз — так проще проверить список глазами и понять, что именно уходит.</div>`,
    },
    en: {
      title: "Reasons — filter chips",
      body: `<p>Within a verdict, candidates are split by reason: <b>entity missing</b>, <b>disabled</b>, <b>excluded</b>, <b>service unit</b>, <b>cloud weather</b>, <b>looks like a test</b>, <b>almost empty</b>…</p>
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
      body: `<p>Для каждой статистики: идентификатор, название · устройство · интеграция · единица, цветные метки причин, число строк, вес в МиБ (полоска — доля) и дата последней записи.</p>
        <p>Над списком — поиск по части имени и счётчики: сколько статистик, строк и места в текущем фильтре. Первые 10 строк, остальные — «Показать ещё».</p>
        <div class="tip">💡 Дата «Последняя» давно в прошлом — сенсор мёртв. Узнали свой нужный датчик? Просто не отмечайте его.</div>`,
    },
    en: {
      title: "The list of statistics",
      body: `<p>For each statistic: the id, name · device · integration · unit, coloured reason labels, number of rows, size in MiB (the bar shows the share) and the date of the last record.</p>
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
          <li>☑️ Отмечайте флажками слева в списке или жмите <b>«Выбрать показанные»</b></li>
          <li>📋 <b>«Скопировать список»</b> — идентификаторы в буфер обмена</li>
          <li>📝 <b>«YAML для recorder exclude»</b> — готовый фрагмент для configuration.yaml, чтобы живой сенсор перестал записываться</li>
        </ul>
        <div class="tip">💡 Счётчик «Выбрано» показывает, сколько строк и места освободится.</div>`,
    },
    en: {
      title: "Selecting and exporting",
      body: `<ul>
          <li>☑️ Tick the checkboxes in the list or press <b>“Select shown”</b></li>
          <li>📋 <b>“Copy list”</b> — copies the ids to the clipboard</li>
          <li>📝 <b>“YAML for recorder exclude”</b> — a ready snippet for configuration.yaml so a live sensor stops being recorded</li>
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
      body: `<p>Кнопка оживает, когда что-то выбрано. Что произойдёт после нажатия:</p>
        <ul>
          <li>1️⃣ <b>Проверки</b>: HA работает, нет миграции, очередь recorder в норме, хватает места</li>
          <li>2️⃣ <b>Бэкап</b> базы, если нет свежего (24 ч)</li>
          <li>3️⃣ Удаление <b>порциями</b> до 50 000 строк; строки сначала уходят в <b>архив отмены</b></li>
          <li>4️⃣ По желанию — сжатие VACUUM</li>
        </ul>
        <p>Для подтверждения нужно ввести слово <b>УДАЛИТЬ</b>.</p>
        <div class="warn">⚠️ Удаление статистики живого сенсора не мешает ему копить её заново. Чтобы он перестал писаться — добавьте его в recorder exclude (кнопка YAML).</div>`,
    },
    en: {
      title: "Deletion — a safe pipeline",
      body: `<p>The button comes alive once something is selected. What happens after you press it:</p>
        <ul>
          <li>1️⃣ <b>Checks</b>: HA is running, no migration, recorder queue is fine, enough free space</li>
          <li>2️⃣ A <b>backup</b> of the database, unless a fresh one (24 h) exists</li>
          <li>3️⃣ Deletion in <b>batches</b> of up to 50,000 rows; rows go to an <b>undo archive</b> first</li>
          <li>4️⃣ Optionally, VACUUM compaction</li>
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
        <div class="tip">💡 Вкладка <b>только показывает</b> проблемы и подсказывает, что делать. Отсюда ничего не меняется.</div>`,
    },
    en: {
      title: "Problems: what is wrong with statistics",
      body: `<p>This gathers what Home Assistant itself considers wrong (as in “Developer tools → Statistics”) plus our own checks.</p>
        <div class="tip">💡 The tab <b>only shows</b> problems and suggests what to do. Nothing is changed from here.</div>`,
    },
  },
  {
    id: "issues-tiles",
    tab: "issues",
    target: "issues-tiles",
    ru: {
      title: "Типы проблем",
      body: `<p>Плитки группируют проблемы по типу и показывают, сколько из них <b>важных</b> (⚡). Например:</p>
        <ul>
          <li>📉 <b>Накопленная сумма уменьшается</b> — в «Энергии» появляется отрицательное потребление</li>
          <li>👻 <b>Статистика без сущности</b> — сенсора больше нет</li>
          <li>🔁 <b>Изменилась единица измерения</b> — HA просит исправить или удалить</li>
          <li>⏸️ <b>Статистика перестала писаться</b></li>
        </ul>
        <div class="tip">💡 Клик по плитке оставляет в списке только этот тип.</div>`,
    },
    en: {
      title: "Types of problems",
      body: `<p>The tiles group problems by type and show how many of them are <b>important</b> (⚡). For example:</p>
        <ul>
          <li>📉 <b>Accumulated sum decreases</b> — negative consumption appears in Energy</li>
          <li>👻 <b>Statistics without an entity</b> — the sensor no longer exists</li>
          <li>🔁 <b>Unit of measurement changed</b> — HA asks to fix or delete</li>
          <li>⏸️ <b>Statistics stopped being written</b></li>
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
          <li>⚡ <b>только важные</b> — сущности из «Энергии», дашбордов, автоматизаций, скриптов, YAML</li>
          <li>🔎 <b>источник</b>: все · Home Assistant · Database Cleaner</li>
          <li>🔍 поиск по имени ниже</li>
        </ul>
        <p>В списке под каждой проблемой есть подсказка 💡, что делать, и кнопки «Статистика HA», «Сущность», «В Кандидатах».</p>
        <div class="tip">💡 Начните с «⚡ только важные»: именно такие сбои ломают «Энергию», дашборды и автоматизации.</div>`,
    },
    en: {
      title: "Problem list filters",
      body: `<ul>
          <li>⚡ <b>only important</b> — entities from Energy, dashboards, automations, scripts, YAML</li>
          <li>🔎 <b>source</b>: all · Home Assistant · Database Cleaner</li>
          <li>🔍 search by name below</li>
        </ul>
        <p>Under each problem there is a 💡 hint on what to do, and buttons “HA statistics”, “Entity”, “In Candidates”.</p>
        <div class="tip">💡 Start with “⚡ only important”: those are the failures that break Energy, dashboards and automations.</div>`,
    },
  },

  // ───────────────────────────────────────────────────────────── statistics
  {
    id: "lts-cats",
    tab: "statistics",
    target: "lts-cats",
    ru: {
      title: "Статистика: категории",
      body: `<p>Вся долговременная статистика, разложенная по состоянию сущности:</p>
        <ul>
          <li>👻 <b>Сироты</b> — сущности больше нет</li>
          <li>🚫 <b>Отключены</b> — сущность отключена, статистика осталась</li>
          <li>🧹 <b>Исключены фильтром</b> — подпадают под recorder exclude</li>
          <li>⏹️ <b>Запись остановлена</b> — сущность жива, но не пишется</li>
          <li>💚 <b>Живые</b> и остальные категории</li>
        </ul>
        <div class="tip">💡 Здесь — «сырой» взгляд на всё. Вердикты «можно ли удалить» — на вкладке «Кандидаты».</div>`,
    },
    en: {
      title: "Statistics: categories",
      body: `<p>All long-term statistics, grouped by the state of the entity:</p>
        <ul>
          <li>👻 <b>Orphans</b> — the entity no longer exists</li>
          <li>🚫 <b>Disabled</b> — the entity is disabled, statistics remain</li>
          <li>🧹 <b>Excluded by filter</b> — covered by recorder exclude</li>
          <li>⏹️ <b>Recording stopped</b> — the entity is alive but not recorded</li>
          <li>💚 <b>Healthy</b> and the other categories</li>
        </ul>
        <div class="tip">💡 This is the “raw” view of everything. The “can it be deleted” verdicts live on the Candidates tab.</div>`,
    },
  },
  {
    id: "lts-controls",
    tab: "statistics",
    target: "lts-controls",
    ru: {
      title: "Период, группировка, поиск",
      body: `<ul>
          <li>📅 <b>Период</b> — считать строки за всё время или за последние 365 / 90 / 30 дней</li>
          <li>🗂️ <b>Группировка</b> — по статистике, устройству, интеграции, единице или категории</li>
          <li>🔍 <b>Поиск</b> по части имени</li>
        </ul>
        <div class="tip">💡 Каждая статистика даёт ровно одну строку в час, поэтому у живых сенсоров строк почти поровну. Группировка «по интеграции» быстро показывает, чья она.</div>`,
    },
    en: {
      title: "Period, grouping, search",
      body: `<ul>
          <li>📅 <b>Period</b> — count rows for all time or the last 365 / 90 / 30 days</li>
          <li>🗂️ <b>Group by</b> — statistic, device, integration, unit or category</li>
          <li>🔍 <b>Search</b> by part of a name</li>
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
          <li>🕐 <b>Окно</b>: 1 час, 1 день или 7 дней</li>
          <li>🗂️ <b>Группировка</b>: сущность, устройство, интеграция, домен, зона</li>
        </ul>
        <div class="tip">💡 «Болтливые» сущности (датчики мощности с шагом в секунды, uptime, RSSI) раздувают базу сильнее всего. Их разумно добавить в recorder exclude.</div>`,
    },
    en: {
      title: "States: who writes the most",
      body: `<p>How many rows each entity wrote into the <b>states</b> table.</p>
        <ul>
          <li>🕐 <b>Window</b>: 1 hour, 1 day or 7 days</li>
          <li>🗂️ <b>Group by</b>: entity, device, integration, domain, area</li>
        </ul>
        <div class="tip">💡 “Chatty” entities (power sensors updating every second, uptime, RSSI) grow the database the most. Consider adding them to recorder exclude.</div>`,
    },
  },
  {
    id: "states-events",
    tab: "states",
    target: "states-events",
    ru: {
      title: "События по типам",
      body: `<p>Какие типы событий чаще всего пишутся в таблицу <b>events</b>, сколько их и какая доля.</p>
        <div class="tip">💡 Если в топе сообщения об обновлении реестров или частые вызовы служб — это повод проверить автоматизации и интеграции, которые их порождают.</div>`,
    },
    en: {
      title: "Events by type",
      body: `<p>Which event types are written to the <b>events</b> table most often, how many and what share.</p>
        <div class="tip">💡 If the top is registry updates or frequent service calls, check the automations and integrations that produce them.</div>`,
    },
  },

  // ───────────────────────────────────────────────────────────── diagnostics
  {
    id: "health-grid",
    tab: "health",
    target: "health-grid",
    ru: {
      title: "Диагностика: здоровье recorder",
      body: `<ul>
          <li>✍️ <b>Нагрузка записи</b> — состояний в минуту и событий в час</li>
          <li>⏱️ <b>Свежесть данных</b> — когда была последняя запись; «норма» или «проверить»</li>
          <li>🧪 <b>Пробные запросы</b> — время отклика базы и график динамики</li>
          <li>📁 <b>Файл</b> — размер, WAL, место, сколько освободит VACUUM</li>
          <li>🎙️ <b>Recorder</b> — очередь, хранение, интервал, некорректные остановки</li>
        </ul>
        <div class="tip">💡 Растущая очередь или «проверить» у свежести — повод заглянуть в журнал Home Assistant. У пробных запросов важна динамика, а не одно число.</div>`,
    },
    en: {
      title: "Diagnostics: recorder health",
      body: `<ul>
          <li>✍️ <b>Write load</b> — states per minute and events per hour</li>
          <li>⏱️ <b>Data freshness</b> — when the last record was written; “OK” or “check”</li>
          <li>🧪 <b>Probe queries</b> — database response time and its trend</li>
          <li>📁 <b>File</b> — size, WAL, free space, how much VACUUM would free</li>
          <li>🎙️ <b>Recorder</b> — queue, retention, interval, unclean shutdowns</li>
        </ul>
        <div class="tip">💡 A growing queue or a “check” in freshness is a reason to look at the Home Assistant log. For probe queries the trend matters, not a single number.</div>`,
    },
  },
  {
    id: "health-integrity",
    tab: "health",
    target: "health-integrity",
    ru: {
      title: "Проверка целостности",
      body: `<p>Кнопка «Проверить» запускает <code>PRAGMA quick_check</code> и <code>foreign_key_check</code> на соединении <b>только для чтения</b>.</p>
        <div class="tip">💡 Проверка читает весь файл, на большой базе это заметно по времени. Запускайте перед удалением или после аварийного отключения питания.</div>`,
    },
    en: {
      title: "Integrity check",
      body: `<p>The “Check” button runs <code>PRAGMA quick_check</code> and <code>foreign_key_check</code> on a <b>read-only</b> connection.</p>
        <div class="tip">💡 The check reads the whole file, so on a big database it takes noticeable time. Run it before a deletion or after an unexpected power loss.</div>`,
    },
  },

  // ───────────────────────────────────────────────────────────── maintenance
  {
    id: "maint-actions",
    tab: "maintenance",
    target: "maint-actions",
    ru: {
      title: "Обслуживание: действия",
      body: `<ul>
          <li>💾 <b>Сделать бэкап</b> — копия базы без остановки HA (SQLite Online Backup) с проверкой целостности</li>
          <li>🗜️ <b>Сжать базу (VACUUM)</b> — переписывает файл без пустых страниц и возвращает место на диск</li>
        </ul>
        <p>Ниже — размер, доля свободных страниц, место на диске, папка бэкапов и свежий бэкап.</p>
        <div class="warn">⚠️ Во время VACUUM recorder приостанавливает запись (события ждут в памяти), поэтому делайте его в спокойное время. Ход любого задания виден вверху, его можно отменить после текущей порции.</div>`,
    },
    en: {
      title: "Maintenance: actions",
      body: `<ul>
          <li>💾 <b>Make a backup</b> — a copy of the database without stopping HA (SQLite Online Backup), with an integrity check</li>
          <li>🗜️ <b>Compact database (VACUUM)</b> — rewrites the file without empty pages and gives disk space back</li>
        </ul>
        <p>Below: size, share of free pages, free disk space, backup folder and the latest backup.</p>
        <div class="warn">⚠️ During VACUUM the recorder pauses writing (events wait in memory), so do it at a quiet time. The progress of any job is shown on top, and it can be cancelled after the current batch.</div>`,
    },
  },
  {
    id: "maint-backups",
    tab: "maintenance",
    target: "maint-backups",
    ru: {
      title: "Бэкапы базы",
      body: `<p>Хранятся два последних бэкапа (по умолчанию в <code>/share/database_cleaner/backups</code>), каждый с отметкой «проверен».</p>
        <div class="warn">⚠️ Полное восстановление файла требует остановить Core: <code>ha core stop</code> → переименовать <code>home-assistant_v2.db</code> (и -wal, -shm) → положить бэкап под этим именем → <code>ha core start</code>.</div>
        <div class="tip">💡 Папку, число бэкапов и размер порции можно изменить в настройках интеграции.</div>`,
    },
    en: {
      title: "Database backups",
      body: `<p>The two latest backups are kept (by default in <code>/share/database_cleaner/backups</code>), each marked as “verified”.</p>
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
      body: `<p>Перед каждым удалением строки статистики сохраняются в архив. Кнопка <b>«Восстановить»</b> возвращает их через официальный импорт статистики — <b>без остановки HA</b>.</p>
        <div class="tip">💡 Архивы хранятся 30 дней. Передумали — вернуть удалённое можно в пару кликов. Рядом, в «Журнале», видна история всех заданий.</div>`,
    },
    en: {
      title: "Undo archives",
      body: `<p>Before every deletion the statistics rows are saved to an archive. The <b>“Restore”</b> button brings them back through the official statistics import — <b>without stopping HA</b>.</p>
        <div class="tip">💡 Archives are kept for 30 days. Changed your mind? Restoring takes a couple of clicks. Next to it, the “Journal” shows the history of all jobs.</div>`,
    },
  },

  // ───────────────────────────────────────────────────────────── finish
  {
    id: "finish",
    tab: "overview",
    chip: "🏁",
    ru: {
      title: "Готово — порядок работы",
      body: `<ul>
          <li>1️⃣ <b>Обзор</b> — понять, что занимает место</li>
          <li>2️⃣ <b>Кандидаты</b> — «Можно удалить», по одной причине за раз</li>
          <li>3️⃣ <b>YAML для exclude</b> — для живых сенсоров, чтобы не копили заново</li>
          <li>4️⃣ <b>Удалить выбранное</b> — бэкап и проверки сделаются сами</li>
          <li>5️⃣ <b>Обслуживание</b> — при желании сжать базу (VACUUM)</li>
          <li>6️⃣ <b>Проблемы</b> — заглядывать после обновлений HA</li>
        </ul>
        <div class="tip">💡 Экскурсия всегда под рукой — кнопка «?» в заголовке.</div>`,
    },
    en: {
      title: "Done — the workflow",
      body: `<ul>
          <li>1️⃣ <b>Overview</b> — see what takes the space</li>
          <li>2️⃣ <b>Candidates</b> — “Safe to delete”, one reason at a time</li>
          <li>3️⃣ <b>YAML for exclude</b> — for live sensors, so they do not collect again</li>
          <li>4️⃣ <b>Delete selected</b> — the backup and checks happen automatically</li>
          <li>5️⃣ <b>Maintenance</b> — optionally compact the database (VACUUM)</li>
          <li>6️⃣ <b>Problems</b> — check it after Home Assistant updates</li>
        </ul>
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
      overview: "📊 Обзор",
      candidates: "🗑️ Кандидаты",
      issues: "🩺 Проблемы",
      statistics: "📈 Статистика",
      states: "📝 Состояния",
      health: "🔧 Диагностика",
      maintenance: "🛠️ Обслуживание",
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
      overview: "📊 Overview",
      candidates: "🗑️ Candidates",
      issues: "🩺 Problems",
      statistics: "📈 Statistics",
      states: "📝 States",
      health: "🔧 Diagnostics",
      maintenance: "🛠️ Maintenance",
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
  ul { margin: 0 0 10px; padding-left: 22px; font-size: 16.5px; }
  li { margin: 4px 0; }
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
    h2 { font-size: 20px; } ul, .tip, .warn { font-size: 15.5px; } .keys { display: none; }
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
export function startTour(panel, { lang = "en", onClose } = {}) {
  const ui = UI[lang] || UI.en;
  const steps = TOUR_STEPS;
  const startTab = panel.tourTab;

  const host = document.createElement("div");
  host.setAttribute("data-database-cleaner-tour", "");
  host.style.cssText = "position:fixed;inset:0;z-index:2147483000;";
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
    title.textContent = txt.title;
    body.innerHTML = txt.body;
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
