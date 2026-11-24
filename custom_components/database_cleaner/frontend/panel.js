/*
 * Database Cleaner panel (phase 1: read-only analytics).
 *
 * Plain web component, no build step and no external dependencies. Colours
 * come from the active Home Assistant theme (CSS custom properties), so the
 * panel follows dark / light mode automatically.
 */

const VERSION = "0.2.0";
const DOMAIN = "database_cleaner";

const ICON = {
  menu: "M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z",
  refresh:
    "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",
};

const I18N = {
  en: {
    title: "Database Cleaner",
    tab_overview: "Overview",
    tab_statistics: "Statistics",
    tab_states: "States",
    tab_health: "Diagnostics",
    refresh: "Refresh",
    recompute: "Recompute",
    loading: "Loading…",
    error: "Error",
    read_only: "read-only",
    db_size: "Database",
    wal: "WAL",
    disk_free: "Free disk",
    lts: "Long-term statistics",
    states: "States",
    short_term: "5-minute statistics",
    events: "Events",
    meta: "Service tables",
    other: "Other",
    schema: "Schema",
    recorder: "Recorder",
    keep_days: "keep days",
    commit_interval: "commit interval",
    filter: "exclude filter",
    yes: "yes",
    no: "no",
    space: "Where the space goes",
    tables: "Tables",
    table: "Table",
    rows: "Rows",
    data: "Data",
    indexes: "Indexes",
    total: "Total",
    share: "Share",
    data_since: "Data since",
    no_dbstat: "dbstat is not available in this SQLite build: sizes per table are unknown.",
    computed: "computed",
    ago: "ago",
    took: "query",
    lts_scan_note:
      "The first run reads the whole statistics table (about 10–60 s). The result is cached.",
    period: "Period",
    all_time: "All time",
    days: "d",
    group_by: "Group by",
    g_statistic: "Statistic",
    g_entity: "Entity",
    g_device: "Device",
    g_integration: "Integration",
    g_unit: "Unit",
    g_category: "Category",
    g_domain: "Domain",
    g_area: "Area",
    search: "Search…",
    diagnostic_only: "Diagnostic only",
    show_more: "Show more",
    shown: "shown",
    of: "of",
    name: "Name",
    category: "Category",
    statistics_n: "Statistics",
    entities_n: "Entities",
    approx_mib: "≈ MiB",
    first: "First",
    last: "Last",
    no_device: "(no device)",
    unknown: "(unknown)",
    cat_healthy: "Healthy",
    cat_orphan: "Orphans",
    cat_no_registry: "Not in registry",
    cat_disabled: "Disabled",
    cat_no_states: "No states",
    cat_stopped: "Stopped",
    cat_excluded: "Excluded by filter",
    cat_external: "External",
    cat_hint_healthy: "entity exists, statistics are written",
    cat_hint_orphan: "entity is gone: no registry entry, no states",
    cat_hint_no_registry: "has states but no registry entry (YAML without unique_id)",
    cat_hint_disabled: "entity disabled, statistics left behind",
    cat_hint_no_states: "registered and enabled, but nothing in states",
    cat_hint_stopped: "entity alive, but statistics are no longer written",
    cat_hint_excluded: "matches recorder exclude: not recorded any more",
    cat_hint_external: "imported by an integration (not recorder)",
    diagnostic: "Diagnostic entities",
    lts_flat_note:
      "Every statistic gets exactly one row per hour, so live sensors have about the same number of rows. Categories and age matter more than the top.",
    window: "Window",
    per_hour: "per hour",
    distinct: "values",
    unavailable: "unavail.",
    truncated: "The database only has states since {from} ({hours} h): the window is cut.",
    total_rows: "Rows written",
    events_top: "Events by type",
    event_type: "Event type",
    write_load: "Write load",
    states_per_min: "states / min",
    last_1m: "last minute",
    last_5m: "last 5 min (avg)",
    last_60m: "last hour (avg)",
    events_hour: "events / hour",
    freshness: "Data freshness",
    newest_state: "Newest state",
    newest_short: "Newest 5-min statistics",
    newest_lts: "Newest hourly statistics",
    queue: "queue",
    recording: "recording",
    unclean_runs: "unclean shutdowns",
    runs: "Recent recorder runs",
    start: "Start",
    end: "End",
    running: "running",
    file: "File",
    free_pages: "free pages",
    reclaimable: "reclaimable by VACUUM",
    probe: "Probe queries",
    probe_note: "Measured on every sensor update. Watch the trend, not the absolute value.",
    point: "point",
    range: "range",
    fresh: "freshness",
    integrity: "Integrity",
    integrity_note: "PRAGMA quick_check + foreign_key_check on a read-only connection. Reads the whole file.",
    run_check: "Run check",
    check_ok: "No problems found",
    check_fail: "Problems found",
    ok: "OK",
    warn: "check",
    sec: "s",
    min: "min",
    h: "h",
    d: "d",
    mib: "MiB",
    commit_note: "The recorder writes in batches every {s} s, so the most recent seconds are not visible yet.",
    tab_candidates: "Candidates",
    v_safe: "Can be deleted",
    v_unused: "Not used anywhere",
    v_review: "Review",
    v_used: "In use",
    v_protected: "Energy (protected)",
    v_hint_safe: "the entity is gone, disabled, excluded or has no states — and nothing references it",
    v_hint_unused: "the sensor is alive, but no dashboard, automation, script or helper uses it",
    v_hint_review: "statistics stopped, YAML entity without registry entry, or external statistics",
    v_hint_used: "referenced by a dashboard, automation, script, scene, group, person or helper",
    v_hint_protected: "feeds the Energy dashboard — never offered for deletion",
    r_orphan: "entity gone",
    r_disabled: "disabled",
    r_excluded: "excluded",
    r_no_states: "no states",
    r_stopped: "stopped",
    r_no_registry: "not in registry",
    r_external: "external",
    r_diagnostic: "diagnostic",
    r_derived: "derived helper",
    r_cloud_weather: "cloud weather",
    r_low_value_unit: "service unit",
    r_test_name: "looks like a test",
    r_tiny: "almost empty",
    coverage: "Checked for references",
    not_checked: "Not visible here: YAML templates and YAML helpers, Node-RED, AppDaemon, external tools (Grafana, InfluxDB). Check them yourself before deleting “not used” statistics.",
    src_energy: "energy",
    src_dashboards: "dashboards",
    src_automations: "automations",
    src_scripts: "scripts",
    src_scenes: "scenes",
    src_groups: "groups",
    src_persons: "persons",
    src_helpers: "helpers",
    not_scanned: "not scanned",
    scan_errors: "Some sources could not be read",
    all_reasons: "All",
    selected: "Selected",
    select_shown: "Select shown",
    clear_selection: "Clear",
    copy_list: "Copy list",
    exclude_yaml: "YAML for recorder exclude",
    copied: "Copied",
    used_by: "Used by",
    yaml_note: "Add to configuration.yaml and restart: these entities stop being recorded, including their long-term statistics. Entities that no longer exist are left out.",
    yaml_empty: "None of the selected statistics belongs to a live entity, so there is nothing to exclude.",
    delete_later: "Deletion arrives in the next phase (with a database backup and small batches). For now: review, select and save the list.",
    no_usage: "Usage information is not available.",
    tab_maintenance: "Maintenance",
    delete_selected: "Delete selected…",
    dlg_delete_title: "Delete long-term statistics",
    dlg_summary: "{n} statistics · {rows} rows · ≈ {size}",
    dlg_live_warn: "{n} of them belong to live sensors: their statistics will start growing again. Add them to recorder exclude (YAML button) to stop that.",
    dlg_backup: "A verified database backup is made first (unless one is younger than {h} h), and the rows are saved to an undo archive.",
    dlg_repack: "Compact the database afterwards (VACUUM)",
    dlg_repack_note: "Frees the disk space. The recorder pauses writing for the duration (events wait in memory).",
    dlg_type: "Type {word} to confirm",
    confirm_word: "DELETE",
    dlg_start: "Start",
    cancel: "Cancel",
    close: "Close",
    preflight: "Checks before start",
    pf_ha_running: "Home Assistant is running",
    pf_no_migration: "no database migration in progress",
    pf_schema: "recorder schema tested with this version",
    pf_backlog: "recorder queue is normal",
    pf_backup_space: "free space for the backup",
    pf_repack_space: "free space for VACUUM",
    pf_integrity: "database integrity (quick_check)",
    job_running: "Job in progress",
    step_preflight: "Checks",
    step_backup: "Backup",
    step_delete: "Deleting",
    step_repack: "Compacting (VACUUM)",
    step_restore: "Restoring",
    kind_backup: "Backup",
    kind_delete: "Delete statistics",
    kind_repack: "Compact database",
    kind_restore: "Restore",
    st_done: "done",
    st_failed: "failed",
    st_cancelled: "cancelled",
    st_interrupted: "interrupted",
    st_running: "running",
    st_pending: "starting",
    cancel_job: "Cancel after current batch",
    actions: "Actions",
    make_backup: "Make a backup",
    repack_now: "Compact database (VACUUM)…",
    backups: "Database backups",
    no_backups: "No backups yet.",
    verified: "verified",
    delete: "Delete",
    confirm_delete_backup: "Delete backup {name}? This cannot be undone.",
    restore_full: "Full restore of a backup file needs Home Assistant Core to be stopped: ha core stop → rename home-assistant_v2.db (and -wal, -shm) → copy the backup in its place as home-assistant_v2.db → ha core start.",
    archives: "Undo archives",
    no_archives: "No undo archives.",
    restore: "Restore",
    confirm_restore: "Restore {n} statistics from {name} into the database? Existing rows with the same hour are overwritten.",
    incomplete: "incomplete",
    journal: "Journal",
    no_jobs: "No jobs yet.",
    duration: "duration",
    result_delete: "{n} statistics, {rows} rows deleted",
    result_size: "{before} → {after}",
    result_restore: "{n} statistics restored",
    folder: "Folder",
    fresh_backup: "Fresh backup",
    none: "none",
    settings_hint: "Change folder, retention and batch size in the integration options.",
    repack_title: "Compact the database (VACUUM)",
    repack_text: "Rewrites the database file without free pages. Runs inside the recorder via recorder.purge (repack), which also removes states older than purge_keep_days, like the nightly purge.",
    started: "Started — progress is on the Maintenance tab.",
  },
  ru: {
    title: "Database Cleaner",
    tab_overview: "Обзор",
    tab_statistics: "Статистика",
    tab_states: "Состояния",
    tab_health: "Диагностика",
    refresh: "Обновить",
    recompute: "Пересчитать",
    loading: "Загрузка…",
    error: "Ошибка",
    read_only: "только чтение",
    db_size: "База",
    wal: "WAL",
    disk_free: "Свободно на диске",
    lts: "Долговременная статистика",
    states: "Состояния",
    short_term: "5-минутная статистика",
    events: "События",
    meta: "Служебные таблицы",
    other: "Прочее",
    schema: "Схема",
    recorder: "Recorder",
    keep_days: "хранение, дней",
    commit_interval: "интервал записи",
    filter: "фильтр exclude",
    yes: "да",
    no: "нет",
    space: "Куда уходит место",
    tables: "Таблицы",
    table: "Таблица",
    rows: "Строк",
    data: "Данные",
    indexes: "Индексы",
    total: "Всего",
    share: "Доля",
    data_since: "Данные с",
    no_dbstat: "В этой сборке SQLite нет dbstat: размеры по таблицам неизвестны.",
    computed: "посчитано",
    ago: "назад",
    took: "запрос",
    lts_scan_note:
      "Первый запуск читает всю таблицу статистики (примерно 10–60 с). Результат кэшируется.",
    period: "Период",
    all_time: "Всё время",
    days: "д",
    group_by: "Группировка",
    g_statistic: "Статистика",
    g_entity: "Сущность",
    g_device: "Устройство",
    g_integration: "Интеграция",
    g_unit: "Единица",
    g_category: "Категория",
    g_domain: "Домен",
    g_area: "Зона",
    search: "Поиск…",
    diagnostic_only: "Только диагностические",
    show_more: "Показать ещё",
    shown: "показано",
    of: "из",
    name: "Название",
    category: "Категория",
    statistics_n: "Статистик",
    entities_n: "Сущностей",
    approx_mib: "≈ МиБ",
    first: "Первая",
    last: "Последняя",
    no_device: "(без устройства)",
    unknown: "(неизвестно)",
    cat_healthy: "Живые",
    cat_orphan: "Сироты",
    cat_no_registry: "Не в реестре",
    cat_disabled: "Отключены",
    cat_no_states: "Нет состояний",
    cat_stopped: "Запись остановлена",
    cat_excluded: "Исключены фильтром",
    cat_external: "Внешние",
    cat_hint_healthy: "сущность есть, статистика пишется",
    cat_hint_orphan: "сущности больше нет: ни в реестре, ни в состояниях",
    cat_hint_no_registry: "состояния есть, а записи в реестре нет (YAML без unique_id)",
    cat_hint_disabled: "сущность отключена, статистика осталась",
    cat_hint_no_states: "в реестре и включена, но состояний нет",
    cat_hint_stopped: "сущность жива, но статистика больше не пишется",
    cat_hint_excluded: "подпадает под recorder exclude: больше не записывается",
    cat_hint_external: "загружена интеграцией (не recorder)",
    diagnostic: "Диагностические сущности",
    lts_flat_note:
      "Каждая статистика даёт ровно одну строку в час, поэтому у живых сенсоров строк почти поровну. Важнее категория и возраст, чем место в топе.",
    window: "Окно",
    per_hour: "в час",
    distinct: "значений",
    unavailable: "недоступн.",
    truncated: "Состояния в базе есть только с {from} ({hours} ч): окно обрезано.",
    total_rows: "Записано строк",
    events_top: "События по типам",
    event_type: "Тип события",
    write_load: "Нагрузка записи",
    states_per_min: "состояний / мин",
    last_1m: "последняя минута",
    last_5m: "за 5 мин (в среднем)",
    last_60m: "за час (в среднем)",
    events_hour: "событий / час",
    freshness: "Свежесть данных",
    newest_state: "Последнее состояние",
    newest_short: "Последняя 5-минутная статистика",
    newest_lts: "Последняя часовая статистика",
    queue: "очередь",
    recording: "запись идёт",
    unclean_runs: "некорректных остановок",
    runs: "Последние запуски recorder",
    start: "Начало",
    end: "Конец",
    running: "работает",
    file: "Файл",
    free_pages: "свободных страниц",
    reclaimable: "освободит VACUUM",
    probe: "Пробные запросы",
    probe_note: "Замеряются при каждом обновлении сенсоров. Важна динамика, а не абсолютное значение.",
    point: "точечный",
    range: "диапазон",
    fresh: "свежесть",
    integrity: "Целостность",
    integrity_note: "PRAGMA quick_check + foreign_key_check на соединении только для чтения. Читает весь файл.",
    run_check: "Проверить",
    check_ok: "Проблем не найдено",
    check_fail: "Найдены проблемы",
    ok: "норма",
    warn: "проверить",
    sec: "с",
    min: "мин",
    h: "ч",
    d: "д",
    mib: "МиБ",
    commit_note: "Recorder пишет пачками раз в {s} с, поэтому последние секунды ещё не видны.",
    tab_candidates: "Кандидаты",
    v_safe: "Можно удалить",
    v_unused: "Нигде не используются",
    v_review: "Проверить",
    v_used: "Используются",
    v_protected: "Энергия (защищено)",
    v_hint_safe: "сущности нет, она отключена, исключена или без состояний — и ничто на неё не ссылается",
    v_hint_unused: "сенсор жив, но его не использует ни дашборд, ни автоматизация, ни скрипт, ни хелпер",
    v_hint_review: "статистика остановилась, YAML-сущность без записи в реестре или внешняя статистика",
    v_hint_used: "есть ссылка из дашборда, автоматизации, скрипта, сцены, группы, человека или хелпера",
    v_hint_protected: "используется панелью «Энергия» — к удалению не предлагается никогда",
    r_orphan: "сущности нет",
    r_disabled: "отключена",
    r_excluded: "исключена",
    r_no_states: "нет состояний",
    r_stopped: "остановлена",
    r_no_registry: "не в реестре",
    r_external: "внешняя",
    r_diagnostic: "диагностическая",
    r_derived: "производная (хелпер)",
    r_cloud_weather: "облачная погода",
    r_low_value_unit: "служебная единица",
    r_test_name: "похоже на тест",
    r_tiny: "почти пустая",
    coverage: "Где искали ссылки",
    not_checked: "Отсюда не видно: шаблоны и хелперы в YAML, Node-RED, AppDaemon, внешние системы (Grafana, InfluxDB). Проверьте их сами, прежде чем удалять «неиспользуемые».",
    src_energy: "энергия",
    src_dashboards: "дашборды",
    src_automations: "автоматизации",
    src_scripts: "скрипты",
    src_scenes: "сцены",
    src_groups: "группы",
    src_persons: "люди",
    src_helpers: "хелперы",
    not_scanned: "не проверялось",
    scan_errors: "Часть источников прочитать не удалось",
    all_reasons: "Все",
    selected: "Выбрано",
    select_shown: "Выбрать показанные",
    clear_selection: "Снять выбор",
    copy_list: "Скопировать список",
    exclude_yaml: "YAML для recorder exclude",
    copied: "Скопировано",
    used_by: "Где используется",
    yaml_note: "Добавьте в configuration.yaml и перезапустите HA: эти сущности перестанут записываться, включая долговременную статистику. Сущности, которых уже нет, сюда не попадают.",
    yaml_empty: "Среди выбранных нет живых сущностей — исключать нечего.",
    delete_later: "Удаление появится в следующей фазе (с бэкапом базы и порциями). Пока можно просмотреть, отметить и сохранить список.",
    no_usage: "Нет данных об использовании.",
    tab_maintenance: "Обслуживание",
    delete_selected: "Удалить выбранное…",
    dlg_delete_title: "Удаление долговременной статистики",
    dlg_summary: "{n} статистик · {rows} строк · ≈ {size}",
    dlg_live_warn: "{n} из них — живые сенсоры: их статистика начнёт копиться заново. Чтобы этого не было, добавьте их в recorder exclude (кнопка YAML).",
    dlg_backup: "Сначала делается проверенный бэкап базы (если нет свежее {h} ч), а удаляемые строки сохраняются в архив отмены.",
    dlg_repack: "После удаления сжать базу (VACUUM)",
    dlg_repack_note: "Освобождает место на диске. На это время recorder приостанавливает запись (события ждут в памяти).",
    dlg_type: "Для подтверждения введите {word}",
    confirm_word: "УДАЛИТЬ",
    dlg_start: "Запустить",
    cancel: "Отмена",
    close: "Закрыть",
    preflight: "Проверки перед запуском",
    pf_ha_running: "Home Assistant работает",
    pf_no_migration: "миграция базы не идёт",
    pf_schema: "схема recorder проверена с этой версией",
    pf_backlog: "очередь recorder в норме",
    pf_backup_space: "место для бэкапа",
    pf_repack_space: "место для VACUUM",
    pf_integrity: "целостность базы (quick_check)",
    job_running: "Выполняется задание",
    step_preflight: "Проверки",
    step_backup: "Бэкап",
    step_delete: "Удаление",
    step_repack: "Сжатие (VACUUM)",
    step_restore: "Восстановление",
    kind_backup: "Бэкап",
    kind_delete: "Удаление статистики",
    kind_repack: "Сжатие базы",
    kind_restore: "Восстановление",
    st_done: "готово",
    st_failed: "ошибка",
    st_cancelled: "отменено",
    st_interrupted: "прервано",
    st_running: "выполняется",
    st_pending: "запуск",
    cancel_job: "Отменить после текущей порции",
    actions: "Действия",
    make_backup: "Сделать бэкап",
    repack_now: "Сжать базу (VACUUM)…",
    backups: "Бэкапы базы",
    no_backups: "Бэкапов пока нет.",
    verified: "проверен",
    delete: "Удалить",
    confirm_delete_backup: "Удалить бэкап {name}? Это необратимо.",
    restore_full: "Полное восстановление файла требует остановить Core: ha core stop → переименовать home-assistant_v2.db (и -wal, -shm) → положить бэкап на его место под именем home-assistant_v2.db → ha core start.",
    archives: "Архивы отмены",
    no_archives: "Архивов отмены нет.",
    restore: "Восстановить",
    confirm_restore: "Вернуть {n} статистик из {name} в базу? Строки за те же часы будут перезаписаны.",
    incomplete: "неполный",
    journal: "Журнал",
    no_jobs: "Заданий пока не было.",
    duration: "длительность",
    result_delete: "удалено {n} статистик, {rows} строк",
    result_size: "{before} → {after}",
    result_restore: "восстановлено {n} статистик",
    folder: "Папка",
    fresh_backup: "Свежий бэкап",
    none: "нет",
    settings_hint: "Папку, число бэкапов и размер порции можно изменить в настройках интеграции.",
    repack_title: "Сжатие базы (VACUUM)",
    repack_text: "Переписывает файл базы без пустых страниц. Выполняется внутри recorder через recorder.purge (repack); заодно удаляются состояния старше purge_keep_days, как при ночной очистке.",
    started: "Запущено — ход выполнения на вкладке «Обслуживание».",
  },
};

const CATEGORY_ORDER = [
  "orphan",
  "disabled",
  "excluded",
  "stopped",
  "no_states",
  "no_registry",
  "external",
  "healthy",
];
const CATEGORY_COLOR = {
  healthy: "var(--success-color, #43a047)",
  orphan: "var(--error-color, #db4437)",
  disabled: "#8d8d8d",
  no_registry: "#ab47bc",
  no_states: "#ffb300",
  stopped: "#ff7043",
  excluded: "#42a5f5",
  external: "#26a69a",
};
const VERDICT_ORDER = ["safe", "unused", "review", "used", "protected"];
const VERDICT_COLOR = {
  safe: "var(--error-color, #db4437)",
  unused: "#7e57c2",
  review: "#ffb300",
  used: "var(--success-color, #43a047)",
  protected: "#fdd835",
};
const VERDICT_ICON = { safe: "🗑️", unused: "💤", review: "🔍", used: "✅", protected: "⚡" };
const REF_ICON = {
  energy: "⚡",
  dashboard: "📊",
  automation: "🤖",
  script: "📜",
  scene: "🎬",
  group: "👥",
  person: "🧑",
  helper: "🧩",
};
// Entities that still exist and are recorded: excluding them in YAML makes sense.
const LIVE_CATEGORIES = new Set(["healthy", "stopped", "no_registry", "no_states"]);
const GROUP_COLOR = {
  lts: "var(--primary-color, #03a9f4)",
  states: "#66bb6a",
  short_term: "#ffa726",
  events: "#ab47bc",
  meta: "#78909c",
  other: "#9e9e9e",
};

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

class DatabaseCleanerPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._s = {
      tab: "overview",
      info: null,
      overview: null,
      statistics: null,
      states: null,
      events: null,
      health: null,
      check: null,
      loading: {},
      errors: {},
      lts: { period: "all", groupBy: "statistic", category: null, diagnostic: false, search: "", limit: 0, sort: "rows" },
      st: { window: null, groupBy: "entity", limit: 0, sort: "rows" },
      cand: { verdict: "safe", reason: null, search: "", limit: 0, selected: new Set(), yaml: false, toast: "" },
      maintenance: null,
      jobs: null,
      dialog: null,
      notice: "",
    };
    this._started = false;
    this.shadowRoot.addEventListener("click", (e) => this._onClick(e));
    this.shadowRoot.addEventListener("change", (e) => this._onChange(e));
    this.shadowRoot.addEventListener("input", (e) => this._onInput(e));
  }

  // ---------------------------------------------------------------- HA properties
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) {
      this._lang = (hass.language || "en").toLowerCase().startsWith("ru") ? "ru" : "en";
      this._nf = new Intl.NumberFormat(hass.locale?.language || hass.language || undefined);
      this._render();
      this._start();
    }
  }
  get hass() {
    return this._hass;
  }
  set narrow(v) {
    const changed = this._narrow !== v;
    this._narrow = v;
    if (changed && this._hass) this._render();
  }
  set panel(p) {
    this._panel = p;
  }
  set route(r) {
    this._route = r;
  }

  // ---------------------------------------------------------------- data
  t(key, vars) {
    let s = I18N[this._lang]?.[key] ?? I18N.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
    return s;
  }

  async _ws(type, extra = {}) {
    return this._hass.callWS({ type: `${DOMAIN}/${type}`, ...extra });
  }

  async _load(key, type, extra) {
    this._s.loading[key] = Date.now();
    delete this._s.errors[key];
    this._render();
    const tick = setInterval(() => this._s.loading[key] && this._renderContent(), 1000);
    try {
      this._s[key] = await this._ws(type, extra);
    } catch (err) {
      this._s.errors[key] = err?.message || err?.code || String(err);
    } finally {
      clearInterval(tick);
      delete this._s.loading[key];
      this._render();
    }
  }

  async _start() {
    if (this._started) return;
    this._started = true;
    await this._load("info", "info");
    const windows = this._s.info?.options?.state_windows || [1, 24, 168];
    this._s.st.window = windows.includes(24) ? 24 : windows[0];
    this._ensureTab();
    try {
      this._s.jobs = await this._ws("job/status");
      if (this._s.jobs.current) this._startPolling();
    } catch (_err) {
      /* older backend without jobs */
    }
  }

  disconnectedCallback() {
    clearInterval(this._poll);
    this._poll = null;
  }

  _startPolling() {
    if (this._poll) return;
    this._poll = setInterval(async () => {
      try {
        const st = await this._ws("job/status");
        this._s.jobs = st;
        if (!st.current) {
          clearInterval(this._poll);
          this._poll = null;
          this._afterJob();
        }
      } catch (_err) {
        /* keep polling */
      }
      this._render();
    }, 1500);
  }

  _afterJob() {
    // data changed on the server: reload lazily
    const s = this._s;
    s.statistics = null;
    s.overview = null;
    s.health = null;
    s.cand.selected.clear();
    s.cand.yaml = false;
    this._load("maintenance", "maintenance");
  }

  async _preflight() {
    const d = this._s.dialog;
    if (!d) return;
    d.pre = null;
    d.error = "";
    this._renderContent();
    try {
      const pre = await this._ws("preflight", { kind: d.kind, repack: d.kind === "delete" ? d.repack : false });
      if (this._s.dialog === d) d.pre = pre;
    } catch (err) {
      if (this._s.dialog === d) d.error = err?.message || String(err);
    }
    this._renderContent();
  }

  async _startJob(payload) {
    try {
      await this._ws("job/start", payload);
    } catch (err) {
      const msg = err?.message || String(err);
      if (this._s.dialog) {
        this._s.dialog.error = msg;
        this._renderContent();
      } else {
        this._s.notice = `⚠️ ${msg}`;
        this._render();
      }
      return false;
    }
    this._s.dialog = null;
    this._s.notice = `🚀 ${this.t("started")}`;
    this._s.jobs = await this._ws("job/status");
    this._startPolling();
    this._render();
    return true;
  }

  _ensureTab(force = false) {
    const s = this._s;
    switch (s.tab) {
      case "overview":
        if (force || (!s.overview && !s.loading.overview)) this._load("overview", "overview", { refresh: force });
        break;
      case "statistics":
      case "candidates":
        if (force || (!s.statistics && !s.loading.statistics))
          this._load("statistics", "statistics", { refresh: force });
        break;
      case "states":
        if (force || (!s.states && !s.loading.states)) this._loadStates();
        break;
      case "health":
        if (force || (!s.health && !s.loading.health)) this._load("health", "health", { probe: true });
        break;
      case "maintenance":
        if (force || (!s.maintenance && !s.loading.maintenance))
          this._load("maintenance", "maintenance").then(() => {
            if (s.maintenance?.jobs) s.jobs = s.maintenance.jobs;
            if (s.jobs?.current) this._startPolling();
          });
        break;
    }
  }

  _loadStates() {
    const w = this._s.st.window;
    this._load("states", "states", { window_hours: w });
    this._load("events", "events", { window_hours: w });
  }

  // ---------------------------------------------------------------- events
  _onClick(e) {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const { action, value } = el.dataset;
    const s = this._s;
    switch (action) {
      case "menu":
        this.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true }));
        break;
      case "tab":
        s.tab = value;
        this._render();
        this._ensureTab();
        break;
      case "refresh":
        this._ensureTab(true);
        break;
      case "category":
        s.lts.category = s.lts.category === value ? null : value;
        s.lts.limit = 0;
        this._renderContent();
        break;
      case "diagnostic":
        s.lts.diagnostic = !s.lts.diagnostic;
        s.lts.limit = 0;
        this._renderContent();
        break;
      case "window":
        s.st.window = Number(value);
        s.st.limit = 0;
        this._loadStates();
        break;
      case "more-lts":
        s.lts.limit += this._topN();
        this._renderContent();
        break;
      case "more-st":
        s.st.limit += this._topN();
        this._renderContent();
        break;
      case "sort-lts":
        s.lts.sort = value;
        this._renderContent();
        break;
      case "sort-st":
        s.st.sort = value;
        this._renderContent();
        break;
      case "check":
        this._load("check", "quick_check");
        break;
      case "verdict":
        s.cand.verdict = value;
        s.cand.reason = null;
        s.cand.limit = 0;
        this._renderContent();
        break;
      case "reason":
        s.cand.reason = s.cand.reason === value ? null : value;
        s.cand.limit = 0;
        this._renderContent();
        break;
      case "more-cand":
        s.cand.limit += this._topN();
        this._renderContent();
        break;
      case "select-shown":
        for (const i of this._candItems()) s.cand.selected.add(i.statistic_id);
        this._renderContent();
        break;
      case "clear-selection":
        s.cand.selected.clear();
        s.cand.yaml = false;
        this._renderContent();
        break;
      case "copy-list":
        this._copy([...s.cand.selected].sort().join("\n"));
        break;
      case "toggle-yaml":
        s.cand.yaml = !s.cand.yaml;
        this._renderContent();
        break;
      case "copy-yaml":
        this._copy(this._excludeYaml().text);
        break;
      case "open-delete":
        s.dialog = { kind: "delete", ids: [...s.cand.selected].sort(), repack: true, pre: null, text: "", error: "" };
        this._preflight();
        break;
      case "open-repack":
        s.dialog = { kind: "repack", pre: null, text: "", error: "" };
        this._preflight();
        break;
      case "dlg-close":
        s.dialog = null;
        this._renderContent();
        break;
      case "dlg-start": {
        const d = s.dialog;
        if (!d) break;
        if (d.kind === "delete")
          this._startJob({ kind: "delete", statistic_ids: d.ids, repack: d.repack, confirm: true });
        else this._startJob({ kind: "repack", confirm: true });
        break;
      }
      case "backup-now":
        this._startJob({ kind: "backup" });
        break;
      case "cancel-job":
        this._ws("job/cancel");
        break;
      case "dismiss-notice":
        s.notice = "";
        this._renderContent();
        break;
      case "delete-backup":
        if (window.confirm(this.t("confirm_delete_backup", { name: value })))
          this._ws("backup/delete", { name: value, confirm: true })
            .catch((err) => (s.notice = `⚠️ ${err?.message || err}`))
            .finally(() => this._load("maintenance", "maintenance"));
        break;
      case "restore-archive": {
        const a = (s.maintenance?.archives || []).find((x) => x.name === value);
        const n = a ? a.statistics.length : 0;
        if (window.confirm(this.t("confirm_restore", { n, name: value })))
          this._startJob({ kind: "restore", archive: value, confirm: true });
        break;
      }
    }
  }

  async _copy(text) {
    let ok = false;
    try {
      // Not available on plain-http (non-secure) HA URLs: fall back to a hidden textarea.
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (_err) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      this.shadowRoot.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch (_e) {
        ok = false;
      }
      ta.remove();
    }
    this._s.cand.toast = ok ? `✅ ${this.t("copied")}` : "⚠️";
    this._renderContent();
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._s.cand.toast = "";
      this._renderContent();
    }, 2000);
  }

  _onChange(e) {
    const el = e.target;
    const s = this._s;
    if (el.dataset.field === "cand-select") {
      if (el.checked) s.cand.selected.add(el.value);
      else s.cand.selected.delete(el.value);
      this._renderContent();
      return;
    }
    if (el.dataset.field === "dlg-repack" && s.dialog) {
      s.dialog.repack = el.checked;
      this._preflight();
      return;
    }
    if (el.dataset.field === "lts-period") s.lts.period = el.value;
    else if (el.dataset.field === "lts-group") s.lts.groupBy = el.value;
    else if (el.dataset.field === "st-group") s.st.groupBy = el.value;
    else return;
    s.lts.limit = 0;
    s.st.limit = 0;
    this._renderContent();
  }

  _onInput(e) {
    const field = e.target.dataset.field;
    if (field === "confirm-text" && this._s.dialog) {
      // no re-render: keep the caret, just toggle the button
      this._s.dialog.text = e.target.value;
      const btn = this.shadowRoot.querySelector('[data-action="dlg-start"]');
      if (btn) btn.disabled = !this._dialogReady();
      return;
    }
    if (field !== "lts-search" && field !== "cand-search") return;
    const target = field === "lts-search" ? this._s.lts : this._s.cand;
    target.search = e.target.value;
    target.limit = 0;
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this._renderContent();
      const input = this.shadowRoot.querySelector(`[data-field="${field}"]`);
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 200);
  }

  // ---------------------------------------------------------------- formatting
  _topN() {
    return this._s.info?.options?.top_n || 10;
  }
  n(v) {
    return v == null ? "—" : this._nf.format(v);
  }
  mib(bytes, digits = 1) {
    if (bytes == null) return "—";
    return (bytes / 1048576).toLocaleString(this._nf.resolvedOptions().locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }
  size(bytes) {
    if (bytes == null) return "—";
    const units = this._lang === "ru" ? ["Б", "КиБ", "МиБ", "ГиБ", "ТиБ"] : ["B", "KiB", "MiB", "GiB", "TiB"];
    let i = 0;
    let v = bytes;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toLocaleString(this._nf.resolvedOptions().locale, { maximumFractionDigits: i ? 1 : 0 })} ${units[i]}`;
  }
  dec(v, digits = 1) {
    if (v == null) return "—";
    return v.toLocaleString(this._nf.resolvedOptions().locale, { maximumFractionDigits: digits });
  }
  pct(part, whole, digits = 1) {
    if (!whole) return "—";
    return `${((100 * part) / whole).toLocaleString(this._nf.resolvedOptions().locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })} %`;
  }
  date(ts, withTime = false) {
    if (ts == null) return "—";
    const d = new Date(ts * 1000);
    const opts = withTime
      ? { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }
      : { year: "numeric", month: "2-digit", day: "2-digit" };
    return d.toLocaleString(this._nf.resolvedOptions().locale, opts);
  }
  dur(seconds) {
    if (seconds == null) return "—";
    const s = Math.abs(seconds);
    if (s < 90) return `${Math.round(s)} ${this.t("sec")}`;
    if (s < 5400) return `${Math.round(s / 60)} ${this.t("min")}`;
    if (s < 172800) return `${this.dec(s / 3600)} ${this.t("h")}`;
    return `${Math.round(s / 86400)} ${this.t("d")}`;
  }
  windowLabel(h) {
    return h < 24 ? `${h} ${this.t("h")}` : h % 24 === 0 ? `${h / 24} ${this.t("d")}` : `${h} ${this.t("h")}`;
  }

  // ---------------------------------------------------------------- rendering
  _render() {
    if (!this._hass) return;
    const s = this._s;
    const tabs = ["overview", "candidates", "statistics", "states", "health", "maintenance"];
    const running = !!s.jobs?.current;
    const dbPath = s.info?.db_path ? ` · ${esc(s.info.db_path)}` : "";
    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <div class="toolbar">
        ${this._narrow ? `<button class="icon" data-action="menu" title="Menu">${svg(ICON.menu)}</button>` : ""}
        <div class="title">${this.t("title")}<span class="sub">v${VERSION}${dbPath}</span></div>
        <button class="icon" data-action="refresh" title="${this.t("refresh")}">${svg(ICON.refresh)}</button>
      </div>
      <nav class="tabs">
        ${tabs
          .map(
            (tab) =>
              `<button class="tab ${s.tab === tab ? "active" : ""}" data-action="tab" data-value="${tab}">${this.t(
                `tab_${tab}`
              )}${tab === "maintenance" && running ? ' <span class="pulse"></span>' : ""}</button>`
          )
          .join("")}
      </nav>
      <main id="content"></main>`;
    this._renderContent();
  }

  _renderContent() {
    const main = this.shadowRoot.getElementById("content");
    if (!main) return;
    const s = this._s;
    let html = "";
    if (s.errors.info) html = this._error(s.errors.info);
    else if (!s.info) html = this._spinner("info");
    else
      html = {
        overview: () => this._overview(),
        candidates: () => this._candidates(),
        statistics: () => this._statistics(),
        states: () => this._states(),
        health: () => this._health(),
        maintenance: () => this._maintenance(),
      }[s.tab]();
    const notice = s.notice
      ? `<div class="card notice"><span>${esc(s.notice)}</span><button class="icon small" data-action="dismiss-notice">✕</button></div>`
      : "";
    main.innerHTML = notice + html + (s.dialog ? this._dialog() : "");
  }

  _spinner(key, note = "") {
    const started = this._s.loading[key];
    const secs = started ? Math.round((Date.now() - started) / 1000) : 0;
    return `<div class="card loading"><div class="spinner"></div><div>${this.t("loading")}${
      secs > 1 ? ` ${secs} ${this.t("sec")}` : ""
    }</div>${note ? `<div class="muted small">${note}</div>` : ""}</div>`;
  }

  _error(msg) {
    return `<div class="card error">⚠️ ${this.t("error")}: ${esc(msg)}</div>`;
  }

  _meta(res) {
    if (!res) return "";
    const parts = [];
    if (res.age_s != null) parts.push(`${this.t("computed")} ${this.dur(res.age_s)} ${this.t("ago")}`);
    if (res.took_ms != null) parts.push(`${this.t("took")} ${this.n(Math.round(res.took_ms))} ms`);
    return `<span class="muted small">${parts.join(" · ")}</span>`;
  }

  _kpi(label, value, sub = "") {
    return `<div class="card kpi"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div>${
      sub ? `<div class="kpi-sub">${sub}</div>` : ""
    }</div>`;
  }

  // ---------------------------------------------------------------- overview
  _overview() {
    const s = this._s;
    if (s.errors.overview) return this._error(s.errors.overview);
    if (!s.overview) return this._spinner("overview");
    const o = s.overview;
    const rec = s.info.recorder || {};
    const groups = o.groups || [];
    const totalBytes = groups.reduce((a, g) => a + (g.bytes || 0), 0);
    const g = Object.fromEntries(groups.map((x) => [x.key, x]));
    const statesDays =
      o.ranges?.states?.min != null ? (o.ranges.states.max - o.ranges.states.min) / 86400 : null;
    const tableRows = (name) => o.tables.find((t) => t.name === name)?.rows;

    const kpis = [
      this._kpi(this.t("db_size"), this.size(o.file.size), `${this.t("wal")}: ${this.size(o.file.wal_size)}`),
      this._kpi(
        this.t("disk_free"),
        this.size(o.file.disk?.free),
        o.file.disk ? `${this.pct(o.file.disk.free, o.file.disk.total, 0)} ${this.t("of")} ${this.size(o.file.disk.total)}` : ""
      ),
      this._kpi(
        this.t("lts"),
        g.lts?.bytes != null ? this.pct(g.lts.bytes, totalBytes, 0) : this.n(tableRows("statistics")),
        `${this.n(tableRows("statistics"))} ${this.t("rows").toLowerCase()} · ${this.t(
          "data_since"
        ).toLowerCase()} ${this.date(o.ranges?.statistics?.min)}`
      ),
      this._kpi(
        this.t("states"),
        g.states?.bytes != null ? this.pct(g.states.bytes, totalBytes, 0) : this.n(tableRows("states")),
        `${this.n(tableRows("states"))} ${this.t("rows").toLowerCase()} · ${
          statesDays != null ? this.dur(statesDays * 86400) : "—"
        }`
      ),
      this._kpi(
        this.t("recorder"),
        `${rec.keep_days ?? "—"} <span class="unit">${this.t("keep_days")}</span>`,
        `${this.t("commit_interval")} ${rec.commit_interval ?? "—"} ${this.t("sec")} · ${this.t("filter")}: ${
          rec.filter_active ? this.t("yes") : this.t("no")
        }`
      ),
      this._kpi(
        this.t("schema"),
        o.schema_version ?? "—",
        `SQLite ${esc(o.sqlite.version)} · ${esc(o.sqlite.journal_mode || "")}`
      ),
    ].join("");

    const bar = totalBytes
      ? `<div class="stack">${groups
          .filter((x) => x.bytes)
          .map(
            (x) =>
              `<span style="width:${(100 * x.bytes) / totalBytes}%;background:${GROUP_COLOR[x.key]}" title="${esc(
                this.t(x.key)
              )}: ${this.size(x.bytes)}"></span>`
          )
          .join("")}</div>
        <div class="legend">${groups
          .map(
            (x) =>
              `<span><i style="background:${GROUP_COLOR[x.key]}"></i>${this.t(x.key)} <b>${
                x.bytes != null ? this.size(x.bytes) : "—"
              }</b> <span class="muted">${x.bytes != null ? this.pct(x.bytes, totalBytes) : ""}</span></span>`
          )
          .join("")}</div>`
      : `<div class="muted">${this.t("no_dbstat")}</div>`;

    const tableHtml = o.tables
      .map((t) => {
        const total = (t.bytes || 0) + (t.index_bytes || 0);
        return `<tr><td><i class="dot" style="background:${GROUP_COLOR[t.group]}"></i>${esc(t.name)}</td>
          <td class="num">${this.n(t.rows)}</td>
          <td class="num hide-narrow">${this.mib(t.bytes)}</td>
          <td class="num hide-narrow">${this.mib(t.index_bytes)}</td>
          <td class="num">${o.dbstat ? this.mib(total) : "—"}</td>
          <td class="num">${o.dbstat ? this.pct(total, totalBytes) : "—"}</td></tr>`;
      })
      .join("");

    const ranges = Object.entries(o.ranges || {})
      .map(
        ([k, r]) =>
          `<div class="range"><span>${esc(
            { states: this.t("states"), statistics: this.t("lts"), statistics_short_term: this.t("short_term"), events: this.t("events") }[k] || k
          )}</span><b>${this.date(r.min, true)}</b><span class="muted">→ ${this.date(r.max, true)}</span></div>`
      )
      .join("");

    const mib = this.t("mib");
    return `
      <div class="kpis">${kpis}</div>
      <div class="card"><div class="card-head"><h2>${this.t("space")}</h2>${this._meta(o)}</div>${bar}</div>
      <div class="card"><h2>${this.t("data_since")}</h2>${ranges}</div>
      <div class="card"><h2>${this.t("tables")}</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>${this.t("table")}</th><th class="num">${this.t("rows")}</th>
            <th class="num hide-narrow">${this.t("data")}, ${mib}</th><th class="num hide-narrow">${this.t(
      "indexes"
    )}, ${mib}</th>
            <th class="num">${this.t("total")}, ${mib}</th><th class="num">${this.t("share")}</th></tr></thead>
          <tbody>${tableHtml}</tbody></table></div></div>`;
  }

  // ---------------------------------------------------------------- candidates
  _candItems() {
    const res = this._s.statistics;
    const f = this._s.cand;
    const q = f.search.trim().toLowerCase();
    return res.items.filter(
      (i) =>
        i.verdict === f.verdict &&
        (!f.reason || i.reasons.includes(f.reason)) &&
        (!q ||
          [i.statistic_id, i.name, i.device, i.integration, i.area]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)))
    );
  }

  _refsBadge(refs) {
    if (!refs?.length) return "";
    const counts = {};
    for (const r of refs) {
      const kind = r.split(":", 1)[0];
      counts[kind] = (counts[kind] || 0) + 1;
    }
    const label = Object.entries(counts)
      .map(([k, n]) => `${REF_ICON[k] || "🔗"}${n > 1 ? n : ""}`)
      .join(" ");
    const title = refs.map((r) => r.replace(":", ": ")).join("\n");
    return `<span class="refs" title="${esc(title)}">${label}</span>`;
  }

  _excludeYaml() {
    const res = this._s.statistics;
    const byId = new Map(res.items.map((i) => [i.statistic_id, i]));
    const ids = [...this._s.cand.selected]
      .map((sid) => byId.get(sid))
      .filter((i) => i && i.source === "recorder" && LIVE_CATEGORIES.has(i.category) && i.verdict !== "protected")
      .map((i) => i.statistic_id)
      .sort();
    const text = ids.length
      ? `recorder:\n  exclude:\n    entities:\n${ids.map((sid) => `      - ${sid}`).join("\n")}\n`
      : "";
    return { ids, text };
  }

  _candidates() {
    const s = this._s;
    if (s.errors.statistics) return this._error(s.errors.statistics);
    if (!s.statistics) return this._spinner("statistics", this.t("lts_scan_note"));
    const res = s.statistics;
    if (!res.cleanup) return `<div class="card muted">${this.t("no_usage")}</div>`;
    const f = s.cand;
    const rb = res.row_bytes;

    // coverage
    const src = res.cleanup.sources || {};
    const srcKeys = ["energy", "dashboards", "automations", "scripts", "scenes", "groups", "persons", "helpers"];
    const coverage = srcKeys
      .map((k) => {
        const v = src[k];
        return `<span class="src ${v == null ? "off" : ""}">${v == null ? "—" : "✓"} ${this.t(`src_${k}`)}${
          v == null ? ` <span class="muted">(${this.t("not_scanned")})</span>` : ` <b>${this.n(v)}</b>`
        }</span>`;
      })
      .join("");
    const errors = (src.errors || []).length
      ? `<div class="note warn">⚠️ ${this.t("scan_errors")}: ${esc(src.errors.join("; "))}</div>`
      : "";

    // verdict cards
    const verdicts = Object.fromEntries(res.cleanup.verdicts.map((v) => [v.key, v]));
    const cards = VERDICT_ORDER.map((k) => {
      const v = verdicts[k] || { count: 0, rows: 0, bytes: 0 };
      return `<button class="card cat ${f.verdict === k ? "selected" : ""} ${v.count ? "" : "empty"}"
          data-action="verdict" data-value="${k}" title="${esc(this.t(`v_hint_${k}`))}">
        <div class="cat-head"><i class="dot" style="background:${VERDICT_COLOR[k]}"></i>${VERDICT_ICON[k]} ${this.t(`v_${k}`)}</div>
        <div class="cat-value">${this.n(v.count)}</div>
        <div class="kpi-sub">${this.n(v.rows)} · ≈ ${this.size(v.bytes)}</div>
      </button>`;
    }).join("");

    // reasons present in the current verdict
    const inVerdict = res.items.filter((i) => i.verdict === f.verdict);
    const reasonCounts = new Map();
    for (const i of inVerdict)
      for (const r of i.reasons) {
        const agg = reasonCounts.get(r) || { count: 0, rows: 0 };
        agg.count += 1;
        agg.rows += i.rows;
        reasonCounts.set(r, agg);
      }
    const reasonChips = [...reasonCounts.entries()]
      .sort((a, b) => b[1].rows - a[1].rows)
      .map(
        ([r, a]) =>
          `<button class="pill ${f.reason === r ? "active" : ""}" data-action="reason" data-value="${r}">${this.t(
            `r_${r}`
          )} <span class="muted">${this.n(a.count)} · ${this.size(a.rows * rb)}</span></button>`
      )
      .join("");

    const items = this._candItems().sort((a, b) => b.rows - a.rows);
    const shownRows = items.reduce((a, i) => a + i.rows, 0);
    const limit = this._topN() + f.limit;
    const max = Math.max(1, ...items.slice(0, limit).map((i) => i.rows));
    const byId = new Map(res.items.map((i) => [i.statistic_id, i]));
    const selRows = [...f.selected].reduce((a, sid) => a + (byId.get(sid)?.rows || 0), 0);
    const selectable = f.verdict !== "protected";

    const rows = items
      .slice(0, limit)
      .map((i) => {
        const sub = [i.name && i.name !== i.statistic_id ? i.name : null, i.device, i.integration, i.unit]
          .filter(Boolean)
          .map(esc)
          .join(" · ");
        const reasons = i.reasons
          .map((r) => `<span class="tag">${this.t(`r_${r}`)}</span>`)
          .join(" ");
        return `<tr>
          ${
            selectable
              ? `<td class="check-cell"><input type="checkbox" data-field="cand-select" value="${esc(i.statistic_id)}" ${
                  f.selected.has(i.statistic_id) ? "checked" : ""
                }></td>`
              : ""
          }
          <td class="name"><div class="eid">${esc(i.statistic_id)} ${this._refsBadge(i.refs)}</div>
            <div class="muted small">${sub}</div><div class="tags">${reasons}</div></td>
          <td class="num barcell"><div class="bar"><span style="width:${(100 * i.rows) / max}%"></span></div>${this.n(i.rows)}</td>
          <td class="num hide-narrow">${this.mib(i.rows * rb, 2)}</td>
          <td class="num">${this.date(i.last_ts)}</td>
        </tr>`;
      })
      .join("");

    const selectionBar = selectable
      ? `<div class="selbar">
          <span><b>${this.t("selected")}: ${this.n(f.selected.size)}</b> <span class="muted">· ≈ ${this.size(selRows * rb)}</span></span>
          <button class="btn small" data-action="select-shown">${this.t("select_shown")}</button>
          <button class="btn small" data-action="clear-selection" ${f.selected.size ? "" : "disabled"}>${this.t(
          "clear_selection"
        )}</button>
          <button class="btn small" data-action="copy-list" ${f.selected.size ? "" : "disabled"}>${this.t("copy_list")}</button>
          <button class="btn small" data-action="toggle-yaml" ${f.selected.size ? "" : "disabled"}>${this.t(
          "exclude_yaml"
        )}</button>
          <button class="btn small danger" data-action="open-delete" ${
            f.selected.size && !s.jobs?.current ? "" : "disabled"
          }>🗑️ ${this.t("delete_selected")}</button>
          <span class="toast">${esc(f.toast)}</span>
        </div>`
      : "";

    let yaml = "";
    if (f.yaml && f.selected.size) {
      const y = this._excludeYaml();
      yaml = y.ids.length
        ? `<div class="yaml"><div class="muted small">${this.t("yaml_note")}</div>
            <pre>${esc(y.text)}</pre><button class="btn small" data-action="copy-yaml">${this.t("copy_list")} (YAML)</button></div>`
        : `<div class="note">${this.t("yaml_empty")}</div>`;
    }

    return `
      <div class="card"><h2>${this.t("coverage")}</h2><div class="sources">${coverage}</div>
        <div class="note">ℹ️ ${this.t("not_checked")}</div>${errors}</div>
      <div class="cats">${cards}</div>
      <div class="card">
        <div class="note">${VERDICT_ICON[f.verdict]} ${this.t(`v_hint_${f.verdict}`)}</div>
        ${reasonChips ? `<div class="controls">${reasonChips}</div>` : ""}
        <div class="controls">
          <input type="search" data-field="cand-search" placeholder="${this.t("search")}" value="${esc(f.search)}">
          <span class="muted small grow">${this.t("statistics_n")}: ${this.n(items.length)} · ${this.t("rows")}: ${this.n(
      shownRows
    )} · ≈ ${this.size(shownRows * rb)}</span>${this._meta(res)}
        </div>
        ${selectionBar}${yaml}
        <div class="table-wrap"><table>
          <thead><tr>${selectable ? "<th></th>" : ""}<th>${this.t("g_statistic")}</th><th class="num">${this.t(
      "rows"
    )}</th>
            <th class="num hide-narrow">${this.t("approx_mib")}</th><th class="num">${this.t("last")}</th></tr></thead>
          <tbody>${rows}</tbody></table></div>
        ${this._more(items.length, limit, "more-cand")}
      </div>`;
  }

  // ---------------------------------------------------------------- dialogs
  _confirmWord() {
    return this._s.dialog?.kind === "repack" ? "VACUUM" : this.t("confirm_word");
  }

  _dialogReady() {
    const d = this._s.dialog;
    return !!d && !!d.pre?.ok && d.text.trim().toUpperCase() === this._confirmWord().toUpperCase();
  }

  _checks(pre) {
    if (!pre) return `<div class="checks">${this._spinner("preflight")}</div>`;
    return `<ul class="checks">${pre.checks
      .map((c) => {
        let extra = "";
        if (c.value && typeof c.value === "object" && "free" in c.value)
          extra = ` <span class="muted small">(${this.size(c.value.free)} / ${this.size(c.value.required)})</span>`;
        else if (c.value != null && typeof c.value !== "object")
          extra = ` <span class="muted small">(${esc(c.value)})</span>`;
        return `<li>${c.ok ? "✅" : "❌"} ${this.t(`pf_${c.key}`)}${extra}</li>`;
      })
      .join("")}</ul>${
      pre.fresh_backup ? `<div class="muted small">💾 ${this.t("fresh_backup")}: ${esc(pre.fresh_backup)}</div>` : ""
    }`;
  }

  _dialog() {
    const d = this._s.dialog;
    let body = "";
    if (d.kind === "delete") {
      const byId = new Map((this._s.statistics?.items || []).map((i) => [i.statistic_id, i]));
      const items = d.ids.map((sid) => byId.get(sid)).filter(Boolean);
      const rows = items.reduce((a, i) => a + i.rows, 0);
      const rb = this._s.statistics?.row_bytes || 78;
      const live = items.filter((i) => i.source === "recorder" && LIVE_CATEGORIES.has(i.category)).length;
      const hours = this._s.maintenance?.settings?.max_age_hours ?? 24;
      body = `
        <h2>🗑️ ${this.t("dlg_delete_title")}</h2>
        <p><b>${this.t("dlg_summary", { n: this.n(d.ids.length), rows: this.n(rows), size: this.size(rows * rb) })}</b></p>
        ${live ? `<p class="warn-text">⚠️ ${this.t("dlg_live_warn", { n: this.n(live) })}</p>` : ""}
        <p class="muted">💾 ${this.t("dlg_backup", { h: this.n(hours) })}</p>
        <label class="check-line"><input type="checkbox" data-field="dlg-repack" ${d.repack ? "checked" : ""}>
          ${this.t("dlg_repack")}</label>
        <div class="muted small">${this.t("dlg_repack_note")}</div>`;
    } else {
      body = `<h2>🗜️ ${this.t("repack_title")}</h2><p class="muted">${this.t("repack_text")}</p>
        <p class="muted">💾 ${this.t("dlg_backup", { h: this.n(this._s.maintenance?.settings?.max_age_hours ?? 24) })}</p>`;
    }
    return `<div class="overlay"><div class="dialog card" role="dialog" aria-modal="true">
      ${body}
      <h3>${this.t("preflight")}</h3>${this._checks(d.pre)}
      ${d.error ? `<div class="error">⚠️ ${esc(d.error)}</div>` : ""}
      <label class="confirm"><span>${this.t("dlg_type", { word: `<b>${esc(this._confirmWord())}</b>` })}</span>
        <input type="text" data-field="confirm-text" value="${esc(d.text)}" autocomplete="off" spellcheck="false"></label>
      <div class="dialog-actions">
        <button class="btn" data-action="dlg-close">${this.t("cancel")}</button>
        <button class="btn danger solid" data-action="dlg-start" ${this._dialogReady() ? "" : "disabled"}>${this.t(
      "dlg_start"
    )}</button>
      </div></div></div>`;
  }

  // ---------------------------------------------------------------- maintenance
  _jobSummary(j) {
    const r = j.result || {};
    if (j.status !== "done") return esc(j.error || "");
    if (j.kind === "delete") {
      const size = r.size_after != null ? ` · ${this.t("result_size", { before: this.size(r.size_before), after: this.size(r.size_after) })}` : "";
      return this.t("result_delete", { n: this.n(r.deleted), rows: this.n(r.deleted_rows) }) + size;
    }
    if (j.kind === "repack") return this.t("result_size", { before: this.size(r.size_before), after: this.size(r.size_after) });
    if (j.kind === "backup") return `${esc(r.backup)} · ${this.size(r.size)}`;
    if (j.kind === "restore") return this.t("result_restore", { n: this.n(r.restored) });
    return "";
  }

  _currentJob(job) {
    const pct = job.total ? Math.round((100 * job.done) / job.total) : null;
    const log = (job.log || []).slice(-6).map(esc).join("\n");
    return `<div class="card job">
      <div class="card-head"><h2>⏳ ${this.t("job_running")}: ${this.t(`kind_${job.kind}`)}</h2>
        <button class="btn small" data-action="cancel-job">${this.t("cancel_job")}</button></div>
      <div>${job.step ? this.t(`step_${job.step}`) : this.t(`st_${job.status}`)}${
      job.total ? ` · ${this.n(job.done)} / ${this.n(job.total)}` : ""
    }</div>
      <div class="progress ${pct == null ? "indeterminate" : ""}"><span style="width:${pct ?? 30}%"></span></div>
      ${log ? `<pre class="log">${log}</pre>` : ""}
    </div>`;
  }

  _maintenance() {
    const s = this._s;
    if (s.errors.maintenance) return this._error(s.errors.maintenance);
    if (!s.maintenance) return this._spinner("maintenance");
    const m = s.maintenance;
    const jobs = s.jobs || m.jobs || { current: null, history: [] };
    const busy = !!jobs.current;

    const actions = `<div class="card"><h2>${this.t("actions")}</h2>
      <div class="action-row">
        <button class="btn" data-action="backup-now" ${busy ? "disabled" : ""}>💾 ${this.t("make_backup")}</button>
        <button class="btn" data-action="open-repack" ${busy ? "disabled" : ""}>🗜️ ${this.t("repack_now")}</button>
      </div>
      <div class="rows">
        <div><span>${this.t("db_size")}</span><b>${this.size(m.db.size)}${m.db.wal_size ? ` + WAL ${this.size(m.db.wal_size)}` : ""}</b></div>
        <div><span>${this.t("free_pages")}</span><b>${this.pct(m.db.free_pages_ratio, 1)}</b></div>
        <div><span>${this.t("disk_free")}</span><b>${this.size(m.db.free_db_dir)}</b></div>
        <div><span>${this.t("folder")}</span><b class="path">${esc(m.settings.backup_dir)}</b></div>
        <div><span>${this.t("fresh_backup")}</span><b>${m.fresh_backup ? esc(m.fresh_backup) : this.t("none")}</b></div>
      </div>
      <div class="muted small">⚙️ ${this.t("settings_hint")}</div></div>`;

    const backups = m.backups.length
      ? `<div class="table-wrap"><table><tbody>${m.backups
          .map(
            (b) => `<tr><td class="name"><div class="eid">${esc(b.name)}</div>
            <div class="muted small">${this.date(b.created_ts, true)} · ${this.size(b.size)} · ${
              b.verified ? "✅ " + this.t("verified") : "⚠️"
            } · schema ${esc(b.schema_version)}</div></td>
            <td class="num"><button class="btn small" data-action="delete-backup" data-value="${esc(b.name)}" ${
              busy ? "disabled" : ""
            }>${this.t("delete")}</button></td></tr>`
          )
          .join("")}</tbody></table></div>`
      : `<div class="muted">${this.t("no_backups")}</div>`;

    const archives = m.archives.length
      ? `<div class="table-wrap"><table><tbody>${m.archives
          .map(
            (a) => `<tr><td class="name"><div class="eid">${esc(a.name)}</div>
            <div class="muted small">${this.date(a.created_ts, true)} · ${this.t("statistics_n")}: ${this.n(
              a.statistics.length
            )} · ${this.t("rows")}: ${this.n(a.rows)}${a.complete ? "" : ` · ⚠️ ${this.t("incomplete")}`}</div></td>
            <td class="num"><button class="btn small" data-action="restore-archive" data-value="${esc(a.name)}" ${
              busy || !a.statistics.length ? "disabled" : ""
            }>↩️ ${this.t("restore")}</button></td></tr>`
          )
          .join("")}</tbody></table></div>`
      : `<div class="muted">${this.t("no_archives")}</div>`;

    const journal = jobs.history.length
      ? `<div class="table-wrap"><table><tbody>${jobs.history
          .map((j) => {
            const dur = j.started && j.finished ? this.dur(j.finished - j.started) : "—";
            const icon = { done: "✅", failed: "❌", cancelled: "⏹️", interrupted: "⚠️" }[j.status] || "⏳";
            return `<tr><td class="name"><div>${icon} ${this.t(`kind_${j.kind}`)} <span class="muted small">· ${this.t(
              `st_${j.status}`
            )}</span></div><div class="muted small">${this._jobSummary(j)}</div></td>
            <td class="num small">${this.date(j.started || j.created, true)}<div class="muted">${dur}</div></td></tr>`;
          })
          .join("")}</tbody></table></div>`
      : `<div class="muted">${this.t("no_jobs")}</div>`;

    return `${busy ? this._currentJob(jobs.current) : ""}
      <div class="grid2">
        ${actions}
        <div class="card"><h2>📜 ${this.t("journal")}</h2>${journal}</div>
        <div class="card"><h2>💾 ${this.t("backups")}</h2>${backups}<div class="note">ℹ️ ${this.t("restore_full")}</div></div>
        <div class="card"><h2>↩️ ${this.t("archives")}</h2>${archives}</div>
      </div>`;
  }

  // ---------------------------------------------------------------- statistics (LTS)
  _ltsRows(item) {
    const p = this._s.lts.period;
    return p === "all" ? item.rows : item.rows_by_period?.[p] ?? 0;
  }

  _statistics() {
    const s = this._s;
    if (s.errors.statistics) return this._error(s.errors.statistics);
    if (!s.statistics) return this._spinner("statistics", this.t("lts_scan_note"));
    const res = s.statistics;
    const f = s.lts;
    const rb = res.row_bytes;

    const cats = Object.fromEntries(res.categories.map((c) => [c.key, c]));
    const catCards = CATEGORY_ORDER.filter((k) => cats[k])
      .map((k) => {
        const c = cats[k];
        return `<button class="card cat ${f.category === k ? "selected" : ""} ${c.count ? "" : "empty"}"
            data-action="category" data-value="${k}" title="${esc(this.t(`cat_hint_${k}`))}">
          <div class="cat-head"><i class="dot" style="background:${CATEGORY_COLOR[k]}"></i>${this.t(`cat_${k}`)}</div>
          <div class="cat-value">${this.n(c.count)}</div>
          <div class="kpi-sub">${this.n(c.rows)} · ≈ ${this.size(c.bytes)}</div>
        </button>`;
      })
      .join("");
    const diag = res.diagnostic;
    const diagCard = `<button class="card cat ${f.diagnostic ? "selected" : ""}" data-action="diagnostic">
        <div class="cat-head"><i class="dot" style="background:var(--secondary-text-color)"></i>${this.t("diagnostic")}</div>
        <div class="cat-value">${this.n(diag.count)}</div>
        <div class="kpi-sub">${this.n(diag.rows)} · ≈ ${this.size(diag.bytes)}</div></button>`;

    // filter
    const q = f.search.trim().toLowerCase();
    let items = res.items.filter(
      (i) =>
        (!f.category || i.category === f.category) &&
        (!f.diagnostic || i.diagnostic) &&
        (!q ||
          [i.statistic_id, i.name, i.device, i.integration, i.area]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)))
    );
    const filteredRows = items.reduce((a, i) => a + this._ltsRows(i), 0);

    const periods = ["all", ...res.periods.slice().sort((a, b) => Number(b) - Number(a))];
    const controls = `<div class="controls">
      <label>${this.t("period")} <select data-field="lts-period">${periods
        .map(
          (p) =>
            `<option value="${p}" ${f.period === p ? "selected" : ""}>${
              p === "all" ? this.t("all_time") : `${p} ${this.t("days")}`
            }</option>`
        )
        .join("")}</select></label>
      <label>${this.t("group_by")} <select data-field="lts-group">${["statistic", "device", "integration", "unit", "category"]
        .map((g) => `<option value="${g}" ${f.groupBy === g ? "selected" : ""}>${this.t(`g_${g}`)}</option>`)
        .join("")}</select></label>
      <input type="search" data-field="lts-search" placeholder="${this.t("search")}" value="${esc(f.search)}">
      <span class="muted small grow">${this.t("statistics_n")}: ${this.n(items.length)} · ${this.t(
      "rows"
    )}: ${this.n(filteredRows)} · ≈ ${this.size(filteredRows * rb)}</span>
      ${this._meta(res)}
    </div>`;

    const table = f.groupBy === "statistic" ? this._ltsTable(items, rb, filteredRows) : this._ltsGroups(items, rb, filteredRows);
    return `
      <div class="cats">${catCards}${diagCard}</div>
      <div class="card">
        ${controls}
        <div class="note">ℹ️ ${this.t("lts_flat_note")}</div>
        ${table}
      </div>`;
  }

  _sortHead(key, label, current, action, cls = "num") {
    return `<th class="${cls} sortable ${current === key ? "sorted" : ""}" data-action="${action}" data-value="${key}">${label}${
      current === key ? " ▾" : ""
    }</th>`;
  }

  _ltsTable(items, rb, total) {
    const f = this._s.lts;
    const sorters = {
      rows: (a, b) => this._ltsRows(b) - this._ltsRows(a),
      last: (a, b) => (a.last_ts ?? 0) - (b.last_ts ?? 0),
      first: (a, b) => (a.first_ts ?? 0) - (b.first_ts ?? 0),
      name: (a, b) => a.statistic_id.localeCompare(b.statistic_id),
    };
    const sorted = items.slice().sort(sorters[f.sort] || sorters.rows);
    const limit = this._topN() + f.limit;
    const max = Math.max(1, ...sorted.slice(0, limit).map((i) => this._ltsRows(i)));
    const rows = sorted
      .slice(0, limit)
      .map((i) => {
        const r = this._ltsRows(i);
        const sub = [
          i.name && i.name !== i.statistic_id ? i.name : null,
          i.device,
          i.integration || (i.source !== "recorder" ? i.source : null),
          i.unit,
        ]
          .filter(Boolean)
          .map(esc)
          .join(" · ");
        return `<tr>
          <td class="name"><div class="eid">${esc(i.statistic_id)}${i.diagnostic ? ' <span class="tag">diag</span>' : ""} ${this._refsBadge(
          i.refs
        )}</div>
            <div class="muted small">${sub}</div></td>
          <td><span class="chip" style="--c:${CATEGORY_COLOR[i.category]}" title="${esc(
          this.t(`cat_hint_${i.category}`)
        )}">${this.t(`cat_${i.category}`)}</span></td>
          <td class="num barcell"><div class="bar"><span style="width:${(100 * r) / max}%"></span></div>${this.n(r)}</td>
          <td class="num hide-narrow">${this.mib(r * rb, 2)}</td>
          <td class="num hide-narrow">${this.date(i.first_ts)}</td>
          <td class="num">${this.date(i.last_ts)}</td>
        </tr>`;
      })
      .join("");
    return `<div class="table-wrap"><table>
      <thead><tr>${this._sortHead("name", this.t("g_statistic"), f.sort, "sort-lts", "")}<th>${this.t("category")}</th>
        ${this._sortHead("rows", this.t("rows"), f.sort, "sort-lts")}<th class="num hide-narrow">${this.t("approx_mib")}</th>
        ${this._sortHead("first", this.t("first"), f.sort, "sort-lts", "num hide-narrow")}${this._sortHead(
      "last",
      this.t("last"),
      f.sort,
      "sort-lts"
    )}</tr></thead>
      <tbody>${rows}</tbody></table></div>${this._more(sorted.length, limit, "more-lts")}`;
  }

  _ltsGroups(items, rb, total) {
    const f = this._s.lts;
    const key = {
      device: (i) => i.device || this.t("no_device"),
      integration: (i) => i.integration || (i.source !== "recorder" ? i.source : this.t("unknown")),
      unit: (i) => i.unit || "—",
      category: (i) => this.t(`cat_${i.category}`),
    }[f.groupBy];
    const groups = new Map();
    for (const i of items) {
      const k = key(i);
      const g = groups.get(k) || { key: k, count: 0, rows: 0 };
      g.count += 1;
      g.rows += this._ltsRows(i);
      groups.set(k, g);
    }
    const sorted = [...groups.values()].sort((a, b) => b.rows - a.rows);
    const limit = this._topN() + f.limit;
    const max = Math.max(1, ...sorted.slice(0, limit).map((g) => g.rows));
    const rows = sorted
      .slice(0, limit)
      .map(
        (g) => `<tr><td class="name">${esc(g.key)}</td><td class="num">${this.n(g.count)}</td>
        <td class="num barcell"><div class="bar"><span style="width:${(100 * g.rows) / max}%"></span></div>${this.n(g.rows)}</td>
        <td class="num">${this.mib(g.rows * rb)}</td><td class="num">${this.pct(g.rows, total)}</td></tr>`
      )
      .join("");
    return `<div class="table-wrap"><table>
      <thead><tr><th>${this.t(`g_${f.groupBy}`)}</th><th class="num">${this.t("statistics_n")}</th>
        <th class="num">${this.t("rows")}</th><th class="num">${this.t("approx_mib")}</th><th class="num">${this.t(
      "share"
    )}</th></tr></thead>
      <tbody>${rows}</tbody></table></div>${this._more(sorted.length, limit, "more-lts")}`;
  }

  _more(total, limit, action) {
    if (total <= limit) return `<div class="muted small foot">${this.t("shown")} ${this.n(total)}</div>`;
    return `<div class="foot"><span class="muted small">${this.t("shown")} ${this.n(limit)} ${this.t("of")} ${this.n(
      total
    )}</span><button class="btn" data-action="${action}">${this.t("show_more")}</button></div>`;
  }

  // ---------------------------------------------------------------- states
  _states() {
    const s = this._s;
    const windows = s.info.options.state_windows;
    const chips = windows
      .map(
        (w) =>
          `<button class="pill ${s.st.window === w ? "active" : ""}" data-action="window" data-value="${w}">${this.windowLabel(
            w
          )}</button>`
      )
      .join("");
    const controls = `<div class="controls">
      <span class="muted">${this.t("window")}</span>${chips}
      <label>${this.t("group_by")} <select data-field="st-group">${["entity", "device", "integration", "domain", "area"]
        .map((g) => `<option value="${g}" ${s.st.groupBy === g ? "selected" : ""}>${this.t(`g_${g}`)}</option>`)
        .join("")}</select></label>
      <span class="grow"></span>${s.states ? this._meta(s.states) : ""}
    </div>`;

    let body;
    if (s.errors.states) body = this._error(s.errors.states);
    else if (!s.states || s.loading.states) body = this._spinner("states");
    else body = this._statesBody(s.states);

    let events = "";
    if (s.errors.events) events = this._error(s.errors.events);
    else if (s.events && !s.loading.events) events = this._eventsCard(s.events);

    return `<div class="card">${controls}${body}</div>${events}`;
  }

  _statesBody(res) {
    const f = this._s.st;
    const banner = res.truncated
      ? `<div class="note warn">⏳ ${this.t("truncated", {
          from: this.date(res.data_from, true),
          hours: this.n(Math.round(res.effective_hours)),
        })}</div>`
      : "";
    const kpis = `<div class="kpis inline">
      ${this._kpi(this.t("total_rows"), this.n(res.total_rows))}
      ${this._kpi(this.t("per_hour"), this.n(Math.round(res.total_rows / Math.max(res.effective_hours, 0.01))))}
      ${this._kpi(this.t("entities_n"), this.n(res.items.length))}
    </div>`;

    let table;
    if (f.groupBy === "entity") {
      const sorters = {
        rows: (a, b) => b.rows - a.rows,
        distinct: (a, b) => a.distinct_states - b.distinct_states || b.rows - a.rows,
        unavailable: (a, b) => b.unavailable - a.unavailable,
        name: (a, b) => a.entity_id.localeCompare(b.entity_id),
      };
      const sorted = res.items.slice().sort(sorters[f.sort] || sorters.rows);
      const limit = this._topN() + f.limit;
      const max = Math.max(1, ...sorted.slice(0, limit).map((i) => i.rows));
      const rows = sorted
        .slice(0, limit)
        .map((i) => {
          const sub = [i.name && i.name !== i.entity_id ? i.name : null, i.device, i.integration]
            .filter(Boolean)
            .map(esc)
            .join(" · ");
          return `<tr><td class="name"><div class="eid">${esc(i.entity_id)}${
            i.diagnostic ? ' <span class="tag">diag</span>' : ""
          }</div><div class="muted small">${sub}</div></td>
            <td class="num barcell"><div class="bar"><span style="width:${(100 * i.rows) / max}%"></span></div>${this.n(i.rows)}</td>
            <td class="num">${this.dec(i.per_hour, i.per_hour >= 10 ? 0 : 1)}</td>
            <td class="num hide-narrow">${this.n(i.distinct_states)}</td>
            <td class="num hide-narrow">${i.unavailable ? this.n(i.unavailable) : "—"}</td>
            <td class="num">${this.pct(i.rows, res.total_rows)}</td></tr>`;
        })
        .join("");
      table = `<div class="table-wrap"><table><thead><tr>
        ${this._sortHead("name", this.t("g_entity"), f.sort, "sort-st", "")}
        ${this._sortHead("rows", this.t("rows"), f.sort, "sort-st")}<th class="num">${this.t("per_hour")}</th>
        ${this._sortHead("distinct", this.t("distinct"), f.sort, "sort-st", "num hide-narrow")}
        ${this._sortHead("unavailable", this.t("unavailable"), f.sort, "sort-st", "num hide-narrow")}
        <th class="num">${this.t("share")}</th></tr></thead><tbody>${rows}</tbody></table></div>${this._more(
        sorted.length,
        limit,
        "more-st"
      )}`;
    } else {
      const key = {
        device: (i) => i.device || this.t("no_device"),
        integration: (i) => i.integration || this.t("unknown"),
        domain: (i) => i.domain || "—",
        area: (i) => i.area || this.t("unknown"),
      }[f.groupBy];
      const groups = new Map();
      for (const i of res.items) {
        const k = key(i);
        const g = groups.get(k) || { key: k, count: 0, rows: 0 };
        g.count += 1;
        g.rows += i.rows;
        groups.set(k, g);
      }
      const sorted = [...groups.values()].sort((a, b) => b.rows - a.rows);
      const limit = this._topN() + f.limit;
      const max = Math.max(1, ...sorted.slice(0, limit).map((g) => g.rows));
      const rows = sorted
        .slice(0, limit)
        .map(
          (g) => `<tr><td class="name">${esc(g.key)}</td><td class="num">${this.n(g.count)}</td>
          <td class="num barcell"><div class="bar"><span style="width:${(100 * g.rows) / max}%"></span></div>${this.n(g.rows)}</td>
          <td class="num">${this.n(Math.round(g.rows / Math.max(res.effective_hours, 0.01)))}</td>
          <td class="num">${this.pct(g.rows, res.total_rows)}</td></tr>`
        )
        .join("");
      table = `<div class="table-wrap"><table><thead><tr><th>${this.t(`g_${f.groupBy}`)}</th>
        <th class="num">${this.t("entities_n")}</th><th class="num">${this.t("rows")}</th>
        <th class="num">${this.t("per_hour")}</th><th class="num">${this.t("share")}</th></tr></thead>
        <tbody>${rows}</tbody></table></div>${this._more(sorted.length, limit, "more-st")}`;
    }
    return banner + kpis + table;
  }

  _eventsCard(res) {
    if (!res.items.length) return "";
    const max = Math.max(1, ...res.items.map((i) => i.rows));
    const rows = res.items
      .slice(0, this._topN())
      .map(
        (i) => `<tr><td class="name">${esc(i.event_type)}</td>
        <td class="num barcell"><div class="bar"><span style="width:${(100 * i.rows) / max}%"></span></div>${this.n(i.rows)}</td>
        <td class="num">${this.pct(i.rows, res.total_rows)}</td></tr>`
      )
      .join("");
    return `<div class="card"><h2>${this.t("events_top")}</h2><div class="table-wrap"><table>
      <thead><tr><th>${this.t("event_type")}</th><th class="num">${this.t("rows")}</th><th class="num">${this.t(
      "share"
    )}</th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
  }

  // ---------------------------------------------------------------- health
  _health() {
    const s = this._s;
    if (s.errors.health) return this._error(s.errors.health);
    if (!s.health) return this._spinner("health");
    const h = s.health;
    const c = h.current || {};
    const rec = h.recorder || {};
    const status = (ok) => `<span class="status ${ok ? "ok" : "warn"}">${ok ? "✅ " + this.t("ok") : "⚠️ " + this.t("warn")}</span>`;

    const load = `<div class="card"><h2>${this.t("write_load")}</h2>
      <div class="rows">
        <div><span>${this.t("states_per_min")}, ${this.t("last_5m")}</span><b>${this.n(Math.round((c.states_5m || 0) / 5))}</b></div>
        <div><span>${this.t("states_per_min")}, ${this.t("last_60m")}</span><b>${this.n(Math.round((c.states_60m || 0) / 60))}</b></div>
        <div><span>${this.t("events_hour")}</span><b>${this.n(c.events_60m)}</b></div>
      </div>
      <div class="muted small">${this.t("commit_note", { s: this.n(rec.commit_interval) })}</div></div>`;

    const fresh =`<div class="card"><h2>${this.t("freshness")}</h2>
      <div class="rows">
        <div><span>${this.t("newest_state")}</span><b>${this.dur(c.states_age_s)} ${status(c.states_age_s != null && c.states_age_s < 1800)}</b></div>
        <div><span>${this.t("newest_short")}</span><b>${this.dur(c.short_term_age_s)} ${status(
      c.short_term_age_s != null && c.short_term_age_s < 900
    )}</b></div>
        <div><span>${this.t("newest_lts")}</span><b>${this.dur(c.lts_age_s)} ${status(c.lts_age_s != null && c.lts_age_s < 9000)}</b></div>
      </div></div>`;

    const runs = (h.recorder_runs?.runs || [])
      .map(
        (r) =>
          `<tr><td>${esc(r.start?.slice(0, 19).replace("T", " "))}</td><td>${
            r.end ? esc(r.end.slice(0, 19).replace("T", " ")) : `<b>${this.t("running")}</b>`
          }</td><td>${r.closed_incorrect ? "⚠️" : ""}</td></tr>`
      )
      .join("");
    const recorder = `<div class="card"><h2>${this.t("recorder")}</h2>
      <div class="rows">
        <div><span>${this.t("queue")}</span><b>${this.n(rec.backlog)}</b></div>
        <div><span>${this.t("recording")}</span><b>${rec.recording ? this.t("yes") : this.t("no")}</b></div>
        <div><span>${this.t("keep_days")}</span><b>${this.n(rec.keep_days)}</b></div>
        <div><span>${this.t("commit_interval")}</span><b>${this.n(rec.commit_interval)} ${this.t("sec")}</b></div>
        <div><span>${this.t("unclean_runs")}</span><b>${this.n(h.recorder_runs?.closed_incorrect)}</b></div>
      </div>
      <h3>${this.t("runs")}</h3>
      <div class="table-wrap"><table><thead><tr><th>${this.t("start")}</th><th>${this.t("end")}</th><th></th></tr></thead>
      <tbody>${runs}</tbody></table></div></div>`;

    const file = `<div class="card"><h2>${this.t("file")}</h2>
      <div class="rows">
        <div><span>${this.t("db_size")}</span><b>${this.size(h.file.size)}</b></div>
        <div><span>${this.t("wal")}</span><b>${this.size(h.file.wal_size)}</b></div>
        <div><span>${this.t("disk_free")}</span><b>${this.size(h.file.disk?.free)}</b></div>
        <div><span>${this.t("free_pages")}</span><b>${h.free_pages_pct != null ? h.free_pages_pct + " %" : "—"}</b></div>
        <div><span>${this.t("reclaimable")}</span><b>${this.size(h.reclaimable_bytes)}</b></div>
      </div></div>`;

    const hist = h.history || [];
    const probe = `<div class="card"><h2>${this.t("probe")}</h2>
      <div class="rows">
        <div><span>${this.t("point")}</span><b>${this.n(c.point_ms)} ms</b></div>
        <div><span>${this.t("range")}</span><b>${this.n(c.range_ms)} ms</b></div>
        <div><span>${this.t("fresh")}</span><b>${this.n(c.fresh_ms)} ms</b></div>
      </div>
      ${sparkline(hist.map((p) => p.total_ms))}
      <div class="muted small">${this.t("probe_note")} (${this.n(hist.length)})</div></div>`;

    const chk = s.check;
    let checkBody = `<div class="muted small">${this.t("integrity_note")}</div>`;
    if (s.loading.check) checkBody += this._spinner("check");
    else if (s.errors.check) checkBody += this._error(s.errors.check);
    else if (chk)
      checkBody += `<div class="check ${chk.ok ? "ok" : "bad"}">${chk.ok ? "✅ " + this.t("check_ok") : "❌ " + this.t("check_fail")}
        <span class="muted small">· ${this.n(Math.round(chk.took_ms))} ms</span></div>${
        chk.ok ? "" : `<pre>${esc(JSON.stringify(chk, null, 2))}</pre>`
      }`;
    const integrity = `<div class="card"><div class="card-head"><h2>${this.t("integrity")}</h2>
      <button class="btn" data-action="check" ${s.loading.check ? "disabled" : ""}>${this.t("run_check")}</button></div>${checkBody}</div>`;

    return `<div class="grid2">${load}${fresh}${probe}${file}${recorder}${integrity}</div>`;
  }
}

function svg(path) {
  return `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg>`;
}

function sparkline(values) {
  const v = values.filter((x) => x != null);
  if (v.length < 2) return "";
  const w = 300;
  const h = 48;
  const max = Math.max(...v);
  const min = Math.min(...v);
  const span = max - min || 1;
  const pts = v.map((y, i) => `${((i / (v.length - 1)) * w).toFixed(1)},${(h - 4 - ((y - min) / span) * (h - 8)).toFixed(1)}`);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img">
    <polyline points="${pts.join(" ")}" fill="none" stroke="var(--primary-color, #03a9f4)" stroke-width="2" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

const STYLE = `
  :host {
    display: block;
    min-height: 100vh;
    background: var(--primary-background-color, #111);
    color: var(--primary-text-color, #e1e1e1);
    font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, Roboto, system-ui, sans-serif));
    --dc-card: var(--ha-card-background, var(--card-background-color, #1c1c1c));
    --dc-border: var(--ha-card-border-color, var(--divider-color, rgba(255,255,255,0.12)));
    --dc-radius: var(--ha-card-border-radius, 12px);
    --dc-muted: var(--secondary-text-color, #9b9b9b);
    --dc-accent: var(--primary-color, #03a9f4);
  }
  * { box-sizing: border-box; }
  .toolbar {
    position: sticky; top: 0; z-index: 2;
    display: flex; align-items: center; gap: 8px;
    height: var(--header-height, 56px); padding: 0 12px 0 16px;
    background: var(--app-header-background-color, var(--primary-background-color, #111));
    color: var(--app-header-text-color, var(--primary-text-color));
    border-bottom: var(--app-header-border-bottom, 1px solid var(--dc-border));
  }
  .title { flex: 1; font-size: 20px; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .title .sub { margin-left: 12px; font-size: 13px; color: var(--dc-muted); }
  button { font: inherit; color: inherit; }
  .icon { background: none; border: 0; padding: 8px; border-radius: 50%; cursor: pointer; display: flex; color: inherit; }
  .icon:hover { background: rgba(127,127,127,0.15); }
  .tabs { display: flex; gap: 4px; padding: 0 12px; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid var(--dc-border);
    background: var(--app-header-background-color, var(--primary-background-color)); }
  .tab { background: none; border: 0; border-bottom: 2px solid transparent; padding: 12px 14px; cursor: pointer;
    color: var(--dc-muted); white-space: nowrap; }
  .tab.active { color: var(--dc-accent); border-bottom-color: var(--dc-accent); }
  main { padding: 16px; max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
  .card { background: var(--dc-card); border: 1px solid var(--dc-border); border-radius: var(--dc-radius);
    padding: 16px; box-shadow: var(--ha-card-box-shadow, none); min-width: 0; }
  h2 { font-size: 16px; font-weight: 500; margin: 0 0 12px; }
  h3 { font-size: 14px; font-weight: 500; margin: 16px 0 8px; color: var(--dc-muted); }
  .card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .card-head h2 { margin-bottom: 12px; }
  .muted { color: var(--dc-muted); }
  .small { font-size: 12px; }
  .grow { flex: 1; }
  .kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
  .kpis.inline { margin: 12px 0; }
  .kpis.inline .card { padding: 10px 14px; }
  .kpi-label { font-size: 13px; color: var(--dc-muted); }
  .kpi-value { font-size: 26px; margin-top: 4px; font-variant-numeric: tabular-nums; }
  .kpi-value .unit { font-size: 13px; color: var(--dc-muted); }
  .kpi-sub { font-size: 12px; color: var(--dc-muted); margin-top: 4px; }
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; align-items: start; }
  .stack { display: flex; height: 18px; border-radius: 9px; overflow: hidden; background: rgba(127,127,127,0.15); }
  .stack span { height: 100%; }
  .stack span + span { border-left: 2px solid var(--dc-card); }
  .legend { display: flex; flex-wrap: wrap; gap: 8px 20px; margin-top: 12px; font-size: 13px; }
  .legend i, .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
  .range { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; padding: 6px 0; border-bottom: 1px solid var(--dc-border); font-size: 14px; }
  .range:last-child { border-bottom: 0; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; font-weight: 500; color: var(--dc-muted); font-size: 12px; padding: 8px; border-bottom: 1px solid var(--dc-border); white-space: nowrap; }
  td { padding: 8px; border-bottom: 1px solid var(--dc-border); vertical-align: middle; }
  tr:last-child td { border-bottom: 0; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  th.sortable { cursor: pointer; user-select: none; }
  th.sorted { color: var(--dc-accent); }
  td.name { max-width: 420px; }
  .eid { overflow-wrap: anywhere; }
  .barcell { position: relative; min-width: 120px; }
  .bar { position: absolute; left: 8px; right: 8px; bottom: 3px; height: 3px; border-radius: 2px; background: rgba(127,127,127,0.12); }
  .bar span { display: block; height: 100%; border-radius: 2px; background: var(--dc-accent); opacity: 0.8; }
  .chip { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; white-space: nowrap;
    color: var(--c); background: color-mix(in srgb, var(--c) 16%, transparent); border: 1px solid color-mix(in srgb, var(--c) 40%, transparent); }
  .tag { font-size: 10px; padding: 1px 5px; border-radius: 6px; border: 1px solid var(--dc-border); color: var(--dc-muted); }
  .cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .cat { text-align: left; cursor: pointer; padding: 12px 14px; }
  .cat:hover { border-color: var(--dc-muted); }
  .cat.selected { border-color: var(--dc-accent); box-shadow: 0 0 0 1px var(--dc-accent) inset; }
  .cat.empty { opacity: 0.55; }
  .cat-head { font-size: 13px; color: var(--dc-muted); }
  .cat-value { font-size: 22px; margin-top: 4px; font-variant-numeric: tabular-nums; }
  .controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-bottom: 12px; }
  .controls label { display: flex; align-items: center; gap: 6px; color: var(--dc-muted); font-size: 13px; }
  select, input[type=search] {
    font: inherit; font-size: 14px; color: var(--primary-text-color);
    background: var(--input-fill-color, rgba(127,127,127,0.12)); border: 1px solid var(--dc-border);
    border-radius: 8px; padding: 6px 10px; }
  input[type=search] { min-width: 200px; }
  option { background: var(--dc-card); color: var(--primary-text-color); }
  .pill { border: 1px solid var(--dc-border); background: none; border-radius: 16px; padding: 4px 12px; cursor: pointer; font-size: 13px; }
  .pill.active { border-color: var(--dc-accent); color: var(--dc-accent); background: color-mix(in srgb, var(--dc-accent) 12%, transparent); }
  .btn { border: 1px solid var(--dc-accent); color: var(--dc-accent); background: none; border-radius: 18px; padding: 6px 16px; cursor: pointer; font-size: 14px; }
  .btn:disabled { opacity: 0.5; cursor: default; }
  .foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; }
  .note { font-size: 13px; color: var(--dc-muted); margin: 4px 0 12px; }
  .note.warn { color: var(--warning-color, #ffa600); }
  .rows > div { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px solid var(--dc-border); font-size: 14px; }
  .rows > div:last-child { border-bottom: 0; }
  .rows b { font-weight: 500; font-variant-numeric: tabular-nums; text-align: right; }
  .status { font-size: 12px; font-weight: 400; margin-left: 6px; }
  .status.warn { color: var(--warning-color, #ffa600); }
  .spark { width: 100%; height: 48px; margin: 8px 0 4px; }
  .check { margin-top: 12px; font-size: 15px; }
  pre { font-size: 12px; overflow-x: auto; }
  .loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 16px; color: var(--dc-muted); }
  .spinner { width: 32px; height: 32px; border: 3px solid rgba(127,127,127,0.25); border-top-color: var(--dc-accent);
    border-radius: 50%; animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error { color: var(--error-color, #db4437); }
  .sources { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 14px; }
  .src.off { color: var(--dc-muted); }
  .tags { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; }
  .refs { font-size: 12px; margin-left: 6px; cursor: help; white-space: nowrap; }
  .check-cell { width: 28px; }
  .check-cell input { width: 16px; height: 16px; accent-color: var(--dc-accent); cursor: pointer; }
  .selbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 10px 12px; margin-bottom: 12px;
    border: 1px dashed var(--dc-border); border-radius: 10px; }
  .btn.small { padding: 4px 12px; font-size: 13px; }
  .toast { font-size: 13px; color: var(--success-color, #43a047); }
  .yaml { margin-bottom: 12px; }
  .yaml pre { background: rgba(127,127,127,0.10); border: 1px solid var(--dc-border); border-radius: 8px; padding: 10px 12px;
    max-height: 320px; overflow: auto; }
  .btn.danger { border-color: var(--error-color, #db4437); color: var(--error-color, #db4437); }
  .btn.danger.solid { background: var(--error-color, #db4437); color: #fff; }
  .btn.danger.solid:disabled { background: none; color: var(--error-color, #db4437); }
  .overlay { position: fixed; inset: 0; z-index: 10; background: rgba(0,0,0,0.55); display: flex; align-items: center;
    justify-content: center; padding: 16px; }
  .dialog { width: min(560px, 100%); max-height: calc(100vh - 32px); overflow: auto; }
  .dialog p { margin: 8px 0; font-size: 14px; }
  .warn-text { color: var(--warning-color, #ffa600); }
  .check-line { display: flex; gap: 8px; align-items: center; margin-top: 12px; cursor: pointer; }
  .check-line input { width: 16px; height: 16px; accent-color: var(--dc-accent); }
  .checks { list-style: none; padding: 0; margin: 0 0 8px; font-size: 14px; }
  .checks li { padding: 3px 0; }
  .checks .loading { padding: 12px; }
  .confirm { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; font-size: 14px; }
  .confirm input { font: inherit; color: var(--primary-text-color); background: var(--input-fill-color, rgba(127,127,127,0.12));
    border: 1px solid var(--dc-border); border-radius: 8px; padding: 8px 10px; letter-spacing: 0.08em; }
  .dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
  .notice { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 16px; }
  .icon.small { padding: 4px 8px; font-size: 14px; }
  .action-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
  .path { overflow-wrap: anywhere; font-weight: 400; }
  .progress { height: 8px; border-radius: 4px; background: rgba(127,127,127,0.18); overflow: hidden; margin: 10px 0; }
  .progress span { display: block; height: 100%; background: var(--dc-accent); transition: width 0.4s; }
  .progress.indeterminate span { animation: slide 1.4s ease-in-out infinite; }
  @keyframes slide { 0% { margin-left: -30%; } 100% { margin-left: 100%; } }
  .log { font-size: 12px; color: var(--dc-muted); white-space: pre-wrap; margin: 6px 0 0; }
  .job { border-color: var(--dc-accent); }
  .pulse { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--dc-accent);
    animation: pulse 1.2s ease-in-out infinite; vertical-align: middle; }
  @keyframes pulse { 50% { opacity: 0.25; } }
  @media (max-width: 700px) {
    main { padding: 12px; gap: 12px; }
    .hide-narrow { display: none; }
    .title .sub { display: none; }
    .grid2 { grid-template-columns: 1fr; }
    input[type=search] { min-width: 0; width: 100%; }
    .kpis, .cats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .card { padding: 12px; }
    .kpi-value { font-size: 20px; }
    .kpi-sub { overflow-wrap: anywhere; }
  }
`;

customElements.define("database-cleaner-panel", DatabaseCleanerPanel);
