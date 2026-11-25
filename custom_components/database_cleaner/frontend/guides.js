/*
 * "How to fix it" guides for the Problems tab.
 *
 * buildGuide(issue, lang) -> { intro, options[], deletable }
 *   option = { title, where?, steps?[], codes?[{label, text}], links?[{nav|more|doc, icon, label}] }
 * Texts may use `code` (backticks). Everything is written for ONE concrete entity: the entity id, the
 * unit / state_class the sensor reports now, and the values the checks expect are filled in, so the
 * YAML can be pasted as it is.
 *
 * ✏️  Adding a problem code: add a builder to BUILDERS (both languages through t(ru, en)). The test
 * tests/engine/test_guides.py checks that every code of engine/issues.py has a guide.
 */

const DOCS = {
  customize: "https://www.home-assistant.io/docs/configuration/customizing-devices/",
  sensor: "https://www.home-assistant.io/integrations/sensor/#long-term-statistics",
  recorder: "https://www.home-assistant.io/integrations/recorder/",
  template: "https://www.home-assistant.io/integrations/template/",
  mqtt: "https://www.home-assistant.io/integrations/sensor.mqtt/",
  esphome: "https://esphome.io/components/sensor/",
  devtools: "https://www.home-assistant.io/docs/tools/dev-tools/#statistics-tab",
};

const YAML_PLATFORMS = new Set(["command_line", "rest", "modbus", "sql", "scrape", "snmp", "file", "bash"]);
const COUNTERS = new Set(["energy", "gas", "water", "monetary", "volume", "precipitation"]);

// The most common unit first: "MWh" is allowed for energy, but nobody wants it filled in.
const PREFERRED_UNITS = ["kWh", "W", "°C", "%", "V", "A", "m³", "L", "hPa", "lx", "dBm", "Hz", "VA", "kW", "ppm", "µg/m³", "km/h", "m/s", "mm", "m", "kg", "s", "min", "h", "d", "B", "MB", "GB"];
const pickUnit = (allowed) => PREFERRED_UNITS.find((u) => allowed.includes(u)) ?? allowed[0];

const q = (v) => (/^[A-Za-z0-9_.-]+$/.test(String(v)) ? String(v) : JSON.stringify(String(v)));
const attrLines = (attrs, indent) =>
  Object.entries(attrs)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${" ".repeat(indent)}${k}: ${q(v)}`)
    .join("\n");

const link = {
  statistics: (t) => ({ nav: "/developer-tools/statistics", icon: "chart", label: t("Инструменты разработчика → Статистика", "Developer tools → Statistics") }),
  repairs: (t) => ({ nav: "/config/repairs", icon: "issues", label: t("Настройки → Система → Исправления", "Settings → System → Repairs") }),
  yaml: (t) => ({ nav: "/developer-tools/yaml", icon: "yaml", label: t("Инструменты разработчика → YAML", "Developer tools → YAML") }),
  helpers: (t) => ({ nav: "/config/helpers", icon: "helpers", label: t("Настройки → Устройства и службы → Помощники", "Settings → Devices & services → Helpers") }),
  integrations: (t) => ({ nav: "/config/integrations", icon: "puzzle", label: t("Настройки → Устройства и службы", "Settings → Devices & services") }),
  integration: (t, domain) => ({ nav: `/config/integrations/integration/${domain}`, icon: "puzzle", label: t(`Интеграция «${domain}»`, `Integration “${domain}”`) }),
  logs: (t) => ({ nav: "/config/logs", icon: "journal", label: t("Настройки → Система → Журналы", "Settings → System → Logs") }),
  entity: (t, id) => ({ more: id, icon: "open", label: t("Открыть карточку сущности", "Open the entity card") }),
  doc: (url, label) => ({ doc: url, icon: "open", label }),
};

function makeContext(issue, lang) {
  const t = (ru, en) => (lang === "ru" ? ru : en);
  const e = issue.statistic_id;
  const c = {
    t,
    issue,
    e,
    d: issue.data || {},
    ent: issue.entity || {},
    integ: issue.integration || null,
    isEntity: /^[a-z0-9_]+\.[a-z0-9_]+$/.test(e || ""),
    name: issue.name && issue.name !== e ? issue.name : (e || "").split(".").pop().replaceAll("_", " "),
  };

  /** customize: works for ANY entity, whoever creates it. */
  c.custom = (attrs, title) => ({
    title: title || t("Универсальный способ: customize (подходит любой сущности)", "Universal way: customize (works for any entity)"),
    where: t("Файл `configuration.yaml` (или `customize.yaml`, если он подключён)", "File `configuration.yaml` (or `customize.yaml` if it is included)"),
    steps: [
      t("Откройте файл через дополнение File editor / Studio Code Server (или в папке `/config`).", "Open the file with the File editor / Studio Code Server add-on (or in the `/config` folder)."),
      t(
        "Вставьте первый вариант в `configuration.yaml`. Если раздел `homeassistant:` там уже есть — добавьте `customize:` внутрь него: второго раздела с тем же именем быть не может.",
        "Paste the first variant into `configuration.yaml`. If a `homeassistant:` section already exists, add `customize:` inside it: there cannot be two sections with the same name."
      ),
      t(
        "Если в `configuration.yaml` уже есть `customize: !include customize.yaml`, вставьте второй вариант в `customize.yaml`.",
        "If `configuration.yaml` already has `customize: !include customize.yaml`, paste the second variant into `customize.yaml`."
      ),
      t(
        "Проверьте конфигурацию и перезагрузите её: «Инструменты разработчика → YAML» → «Проверить конфигурацию» → «Перезагрузить основную конфигурацию». Новые значения появятся при следующем обновлении сенсора.",
        "Check and reload: “Developer tools → YAML” → “Check configuration” → “Reload core configuration”. The new values appear at the next update of the sensor."
      ),
    ],
    codes: [
      { label: "configuration.yaml", text: `homeassistant:\n  customize:\n    ${e}:\n${attrLines(attrs, 6)}` },
      { label: "customize.yaml", text: `${e}:\n${attrLines(attrs, 2)}` },
    ],
    links: [link.yaml(t), link.doc(DOCS.customize, t("Документация: customize", "Docs: customize"))],
  });

  /** The right way for the integration that creates the sensor, when it is configured by the user. */
  c.source = (attrs) => {
    const kind = c.integ;
    if (kind === "template") {
      return {
        title: t("Если сенсор — шаблонный (template)", "If the sensor is a template sensor"),
        where: t(
          "YAML: `template.yaml` или `configuration.yaml`, раздел `template:`. Если это помощник из интерфейса: «Настройки → Устройства и службы → Помощники» → ваш сенсор → «Параметры шаблона».",
          "YAML: `template.yaml` or `configuration.yaml`, the `template:` section. If it is a helper made in the UI: “Settings → Devices & services → Helpers” → your sensor → “Template options”."
        ),
        codes: [
          {
            label: t("добавьте/исправьте эти ключи у вашего сенсора", "add / correct these keys on your sensor"),
            text: `template:\n  - sensor:\n      - name: ${q(c.name)}\n        ${t("# unique_id и state оставьте как есть", "# keep your unique_id and state")}\n${attrLines(attrs, 8)}`,
          },
        ],
        links: [link.helpers(t), link.doc(DOCS.template, t("Документация: template", "Docs: template"))],
      };
    }
    if (kind === "mqtt") {
      return {
        title: t("Если сенсор создан вручную через MQTT", "If the sensor is a hand-made MQTT sensor"),
        where: t(
          "YAML: `mqtt.yaml` или `configuration.yaml`, раздел `mqtt:` → `sensor:`. Для устройств с автообнаружением (Zigbee2MQTT, Tasmota и т. п.) эти поля приходят из источника — тогда используйте customize.",
          "YAML: `mqtt.yaml` or `configuration.yaml`, the `mqtt:` → `sensor:` section. For auto-discovered devices (Zigbee2MQTT, Tasmota …) these fields come from the source — use customize then."
        ),
        codes: [{ label: t("ключи в описании сенсора", "keys in the sensor definition"), text: `mqtt:\n  sensor:\n    - name: ${q(c.name)}\n      ${t("# state_topic и остальное оставьте как есть", "# keep state_topic and the rest")}\n${attrLines(attrs, 6)}` }],
        links: [link.doc(DOCS.mqtt, t("Документация: MQTT sensor", "Docs: MQTT sensor"))],
      };
    }
    if (kind === "esphome") {
      return {
        title: t("Если сенсор — устройство ESPHome", "If the sensor is an ESPHome device"),
        where: t(
          "YAML самого устройства в ESPHome Dashboard (не в Home Assistant). После правки перепрошейте устройство («Install»).",
          "The device's own YAML in the ESPHome Dashboard (not in Home Assistant). After editing, flash the device again (“Install”)."
        ),
        codes: [{ label: t("ключи внутри описания датчика", "keys inside the sensor definition"), text: `sensor:\n  - platform: ...   ${t("# ваш датчик", "# your sensor")}\n    name: ${q(c.name)}\n${attrLines(attrs, 4)}` }],
        links: [link.doc(DOCS.esphome, t("Документация: ESPHome sensor", "Docs: ESPHome sensor"))],
      };
    }
    if (YAML_PLATFORMS.has(kind)) {
      return {
        title: t(`Если сенсор описан в YAML (${kind})`, `If the sensor is defined in YAML (${kind})`),
        where: t("Там, где вы описали сенсор: `configuration.yaml` или подключённый из него файл.", "Where you defined the sensor: `configuration.yaml` or a file included from it."),
        codes: [{ label: t("ключи внутри описания сенсора", "keys inside the sensor definition"), text: attrLines(attrs, 0) }],
        links: [],
      };
    }
    return null;
  };

  /** The entity settings dialog (only entities that have a unique_id can be edited there). */
  c.ui = (what) =>
    issue.registered
      ? {
          title: t("Через интерфейс (если поле доступно)", "Through the UI (if the field is available)"),
          where: t(
            `Нажмите «Открыть карточку», затем шестерёнка → «Настройки»: ${what}. Если нужного поля нет — используйте варианты выше или customize.`,
            `Press “Open the entity card”, then the gear → “Settings”: ${what}. If there is no such field, use the options above or customize.`
          ),
          links: [link.entity(t, e)],
        }
      : null;

  return c;
}

const compact = (list) => list.filter(Boolean);

const BUILDERS = {
  units_changed(c) {
    const { t, d, e } = c;
    const oldUnit = d.metadata_unit;
    const newUnit = d.state_unit;
    return {
      deletable: true,
      intro: t(
        `Единица измерения сенсора изменилась${oldUnit || newUnit ? `: в статистике «${oldUnit ?? "?"}», сейчас сенсор отдаёт «${newUnit ?? "?"}»` : ""}. Home Assistant не смешивает разные единицы, поэтому пока это не исправлено, статистика сенсора не пополняется.`,
        `The sensor's unit changed${oldUnit || newUnit ? `: statistics use “${oldUnit ?? "?"}”, the sensor now reports “${newUnit ?? "?"}”` : ""}. Home Assistant does not mix units, so until this is fixed the sensor's statistics do not grow.`
      ),
      options: compact([
        {
          title: t("Исправить в самом Home Assistant (проще всего)", "Fix it in Home Assistant itself (easiest)"),
          where: t("«Инструменты разработчика → Статистика» (то же предлагает «Настройки → Система → Исправления»)", "“Developer tools → Statistics” (Repairs offers the same)"),
          steps: [
            t(`Найдите в списке \`${e}\` и нажмите «Исправить проблему».`, `Find \`${e}\` in the list and press “Fix issue”.`),
            t(
              "«Обновить единицу измерения» — если новая единица правильная: старые значения будут пересчитаны. «Удалить» — если старая история не нужна.",
              "“Update the unit” — if the new unit is the right one: old values are converted. “Delete” — if the old history is not needed."
            ),
          ],
          links: [link.statistics(t), link.repairs(t), link.doc(DOCS.devtools, t("Документация", "Docs"))],
        },
        oldUnit ? c.custom({ unit_of_measurement: oldUnit }, t(`Или верните прежнюю единицу «${oldUnit}»`, `Or put the previous unit “${oldUnit}” back`)) : null,
        oldUnit && c.isEntity ? c.source({ unit_of_measurement: oldUnit }) : null,
      ]),
    };
  },

  state_class_removed(c) {
    const { t, e, ent } = c;
    const guess = COUNTERS.has(ent.device_class) ? "total_increasing" : "measurement";
    return {
      deletable: true,
      intro: t(
        "У сенсора пропал `state_class`. Старая статистика лежит в базе, но новые значения не пишутся.",
        "The sensor lost its `state_class`. The old statistics are in the database, but new values are no longer written."
      ),
      options: compact([
        c.custom({ state_class: guess }, t(`Верните state_class (подставлено «${guess}»)`, `Put the state_class back (“${guess}” is filled in)`)),
        c.source({ state_class: guess }),
        {
          title: t("Какой state_class выбрать", "Which state_class to choose"),
          steps: [
            t("`measurement` — мгновенные значения (температура, мощность, влажность).", "`measurement` — instantaneous values (temperature, power, humidity)."),
            t("`total_increasing` — счётчики, которые только растут (электроэнергия, вода, газ).", "`total_increasing` — counters that only grow (energy, water, gas)."),
            t("`total` — накопительные значения, которые могут и уменьшаться.", "`total` — cumulative values that may also go down."),
          ],
          links: [link.doc(DOCS.sensor, t("Документация: статистика сенсоров", "Docs: sensor statistics"))],
        },
        { title: t("Или не возвращать", "Or leave it"), where: t(`Если долговременная статистика \`${e}\` не нужна — удалите её здесь (отметьте строку и нажмите «Удалить выбранное»).`, `If you do not need long-term statistics for \`${e}\`, delete them here (tick the row and press “Delete selected”).`) },
        c.ui(t("в настройках нет state_class — это поле задаётся только в YAML", "state_class is not editable there — it is set in YAML only")),
      ]),
    };
  },

  mean_type_changed(c) {
    const { t, e, ent } = c;
    return {
      deletable: true,
      intro: t(
        "Тип усреднения статистики изменился (например, обычное среднее ↔ круговое для углов, или «без среднего»). Старые и новые значения несовместимы.",
        "The averaging type of the statistics changed (e.g. plain mean ↔ circular mean for angles, or “no mean”). Old and new values are not compatible."
      ),
      options: compact([
        {
          title: t("Исправить в Home Assistant", "Fix it in Home Assistant"),
          where: t("«Инструменты разработчика → Статистика» → «Исправить проблему» → «Удалить» (старая история будет потеряна, новая начнётся с чистого листа).", "“Developer tools → Statistics” → “Fix issue” → “Delete” (the old history is lost, a new one starts clean)."),
          links: [link.statistics(t), link.repairs(t)],
        },
        c.custom(
          { state_class: ent.state_class || "measurement" },
          t("Или верните прежний state_class / device_class", "Or put the previous state_class / device_class back")
        ),
        {
          title: t("Подсказка", "Hint"),
          steps: [
            t("Тип усреднения зависит от `state_class`: `measurement` — арифметическое среднее, `measurement_angle` — круговое.", "The averaging type depends on `state_class`: `measurement` — arithmetic mean, `measurement_angle` — circular mean."),
            t(`Если вы это изменили сознательно — просто удалите статистику (\`${e}\`) здесь или в Инструментах разработчика.`, `If you changed it on purpose, just delete the statistics (\`${e}\`) here or in Developer tools.`),
          ],
        },
      ]),
    };
  },

  entity_no_longer_recorded(c) {
    const { t, e } = c;
    return {
      deletable: true,
      intro: t(
        "Сущность исключена из recorder (фильтр include/exclude), но её старая долговременная статистика осталась в базе.",
        "The entity is excluded from the recorder (include/exclude filter), but its old long-term statistics remain in the database."
      ),
      options: [
        {
          title: t("Если исключили по ошибке — уберите её из exclude", "If it was excluded by mistake — remove it from exclude"),
          where: t("Файл `configuration.yaml`, раздел `recorder:` (через интерфейс он не настраивается).", "File `configuration.yaml`, the `recorder:` section (it cannot be set in the UI)."),
          steps: [
            t(`Найдите в разделе \`recorder:\` строку с \`${e}\` — в \`entities:\`, а также совпадающие \`entity_globs:\` и \`domains:\`.`, `Find the line with \`${e}\` in the \`recorder:\` section — in \`entities:\`, and also matching \`entity_globs:\` and \`domains:\`.`),
            t("Удалите её, проверьте конфигурацию и перезапустите Home Assistant (recorder перезагружается только перезапуском).", "Delete it, check the configuration and restart Home Assistant (the recorder only reloads on restart)."),
          ],
          codes: [{ label: "configuration.yaml", text: `recorder:\n  exclude:\n    entities:\n      - ${e}      # ← ${c.t("удалить эту строку", "delete this line")}` }],
          links: [link.yaml(c.t), link.doc(DOCS.recorder, t("Документация: recorder", "Docs: recorder"))],
        },
        {
          title: t("Если исключение намеренное", "If the exclusion is intentional"),
          where: t("Старая статистика больше не нужна — отметьте строку здесь и нажмите «Удалить выбранное».", "The old statistics are no longer needed — tick the row here and press “Delete selected”."),
        },
      ],
    };
  },

  entity_not_recorded(c) {
    const { t, e } = c;
    return {
      deletable: true,
      intro: t(
        "Это сведения, а не ошибка: у сенсора есть `state_class`, но он исключён из recorder, поэтому статистика не собирается.",
        "This is information, not an error: the sensor has a `state_class` but is excluded from the recorder, so no statistics are collected."
      ),
      options: [
        {
          title: t("Исключено намеренно — ничего делать не нужно", "Excluded on purpose — nothing to do"),
          where: t("Это нормально, например, для «болтливых» сенсоров.", "That is fine, e.g. for chatty sensors."),
        },
        {
          title: t("Нужна статистика — уберите из exclude", "You want statistics — remove it from exclude"),
          where: t("Файл `configuration.yaml`, раздел `recorder:`.", "File `configuration.yaml`, the `recorder:` section."),
          codes: [{ label: "configuration.yaml", text: `recorder:\n  exclude:\n    entities:\n      - ${e}      # ← ${t("удалить эту строку", "delete this line")}` }],
          links: [link.doc(DOCS.recorder, t("Документация: recorder", "Docs: recorder"))],
        },
      ],
    };
  },

  no_state(c) {
    const { t, e, integ } = c;
    return {
      deletable: true,
      intro: t(
        "В базе есть долговременная статистика, а у сенсора больше нет состояния: он удалён, переименован или его интеграция не загружена.",
        "The database holds long-term statistics, but the sensor has no state any more: it was removed, renamed, or its integration is not loaded."
      ),
      options: compact([
        {
          title: t("Сначала проверьте, не временная ли это поломка", "First check whether it is only temporary"),
          steps: [
            t("Откройте «Настройки → Устройства и службы» и убедитесь, что интеграция загружена без ошибок.", "Open “Settings → Devices & services” and make sure the integration is loaded without errors."),
            t("Если сущность переименовали, история остаётся под старым именем, а под новым начинается новая.", "If the entity was renamed, its history stays under the old name and a new one starts under the new name."),
          ],
          links: compact([integ ? link.integration(t, integ) : null, link.integrations(t), link.logs(t)]),
        },
        {
          title: t("Сенсора больше нет — удалите историю", "The sensor is gone — delete its history"),
          where: t(`Отметьте \`${e}\` в таблице и нажмите «Удалить выбранное»: перед этим делается бэкап и архив отмены.`, `Tick \`${e}\` in the table and press “Delete selected”: a backup and an undo archive are made first.`),
        },
      ]),
    };
  },

  no_statistics(c) {
    const { t, d, e } = c;
    return {
      deletable: false,
      intro: t(
        `У сенсора есть \`state_class\`${d.state_class ? ` (\`${d.state_class}\`)` : ""}, но долговременной статистики ещё нет.`,
        `The sensor has a \`state_class\`${d.state_class ? ` (\`${d.state_class}\`)` : ""}, but there are no long-term statistics yet.`
      ),
      options: compact([
        {
          title: t("1. Подождите до следующего часа", "1. Wait until the next hour"),
          where: t("Статистика собирается раз в час (в :05). Для нового сенсора это нормально.", "Statistics are compiled once an hour (at :05). That is normal for a new sensor."),
        },
        d.numeric === false
          ? {
              title: t("2. Состояние — не число", "2. The state is not a number"),
              where: t(`Сейчас состояние «${d.state}». Сенсор с \`state_class\` обязан отдавать число. Для шаблона добавьте преобразование: \`{{ ... | float(0) }}\`; для интеграции — проверьте единицу и источник.`, `The state is currently “${d.state}”. A sensor with a \`state_class\` must report a number. For a template add a conversion: \`{{ ... | float(0) }}\`; for an integration check the unit and the source.`),
            }
          : null,
        {
          title: t(`${d.numeric === false ? "3" : "2"}. Проверьте фильтр recorder`, `${d.numeric === false ? "3" : "2"}. Check the recorder filter`),
          where: t(`В \`configuration.yaml\`, раздел \`recorder:\`, не должно быть \`${e}\` (или шаблона/домена, под который он подходит) в \`exclude\`; если задан \`include\`, сенсор должен в него входить.`, `In \`configuration.yaml\`, the \`recorder:\` section must not list \`${e}\` (or a glob/domain matching it) under \`exclude\`; if \`include\` is set, the sensor must be part of it.`),
          links: [link.doc(DOCS.recorder, t("Документация: recorder", "Docs: recorder"))],
        },
        {
          title: t("Ничего не помогло", "Nothing helped"),
          where: t("Посмотрите «Диагностика» (очередь recorder, свежесть статистики) и журнал Home Assistant.", "Look at “Diagnostics” (recorder queue, statistics freshness) and the Home Assistant log."),
          links: [link.logs(t), link.entity(t, e)],
        },
      ]),
    };
  },

  lts_stalled(c) {
    const { t, d, e, integ } = c;
    const reason = {
      ok: t("Сенсор сейчас отдаёт число, но запись в статистику остановилась раньше — вероятно, было исключение из recorder, сбой recorder или сенсор долго был недоступен.", "The sensor reports a number now, but the statistics stopped earlier — probably a recorder exclusion, a recorder failure or a long outage of the sensor."),
      unavailable: t("Сейчас сенсор недоступен (`unavailable`/`unknown`) — пока он такой, статистика не пишется.", "The sensor is unavailable (`unavailable`/`unknown`) right now — no statistics are written while it is."),
      not_numeric: t(`Сейчас состояние «${d.state}» — не число. Сенсору со \`state_class\` нужно числовое значение.`, `The state is “${d.state}” — not a number. A sensor with a \`state_class\` needs a numeric value.`),
    }[d.reason] || "";
    return {
      deletable: true,
      intro: t(
        `Статистика сенсора перестала писаться${d.last_ts ? `: последняя запись — ${new Date(d.last_ts * 1000).toLocaleString("ru-RU")}` : ""}. ${reason}`,
        `The sensor's statistics stopped being written${d.last_ts ? `: the last record is from ${new Date(d.last_ts * 1000).toLocaleString("en-GB")}` : ""}. ${reason}`
      ),
      options: compact([
        {
          title: t("Починить источник", "Fix the source"),
          steps: compact([
            t("Откройте карточку сущности и посмотрите текущее состояние и атрибуты.", "Open the entity card and look at the current state and attributes."),
            d.reason === "unavailable" ? t("Проверьте питание и связь устройства, перезагрузите интеграцию («Настройки → Устройства и службы» → интеграция → ⋮ → «Перезагрузить»).", "Check the device's power and connection, reload the integration (“Settings → Devices & services” → the integration → ⋮ → “Reload”).") : null,
            d.reason === "not_numeric" ? t("Для шаблона добавьте `| float(0)`, для интеграции проверьте единицу измерения.", "For a template add `| float(0)`; for an integration check the unit of measurement.") : null,
            t("Проверьте, что сенсор не попал в `recorder: exclude`.", "Check that the sensor is not in `recorder: exclude`."),
          ]),
          links: compact([link.entity(t, e), integ ? link.integration(t, integ) : null, link.logs(t)]),
        },
        {
          title: t("Сенсор больше не нужен", "The sensor is no longer needed"),
          where: t(`Удалите его статистику здесь: отметьте \`${e}\` и нажмите «Удалить выбранное».`, `Delete its statistics here: tick \`${e}\` and press “Delete selected”.`),
        },
      ]),
    };
  },

  unit_not_allowed(c) {
    const { t, d, e } = c;
    const allowed = d.allowed || [];
    const pick = pickUnit(allowed);
    return {
      deletable: true,
      intro: t(
        `Сенсор с классом устройства \`${d.device_class}\` сообщает «${d.unit}», а для этого класса допустимы: ${allowed.join(", ") || "—"}. Такие значения Home Assistant не учитывает в статистике.`,
        `A sensor with the device class \`${d.device_class}\` reports “${d.unit}”, while this class allows: ${allowed.join(", ") || "—"}. Home Assistant ignores such values for statistics.`
      ),
      options: compact([
        pick ? c.custom({ unit_of_measurement: pick }, t(`Подставить допустимую единицу (взята «${pick}»)`, `Set an allowed unit (“${pick}” is filled in)`)) : null,
        pick ? c.source({ unit_of_measurement: pick }) : null,
        c.ui(t("«Единица измерения» (появляется у сенсоров с классом устройства)", "“Unit of measurement” (shown for sensors with a device class)")),
        {
          title: t("Важно", "Important"),
          steps: [
            t("Меняется только подпись единицы — само число должно быть в этой единице. Если сенсор отдаёт, например, Дж, а нужны кВт·ч, значение нужно пересчитать в шаблоне.", "Only the unit label changes — the number itself must be in that unit. If the sensor reports e.g. J but kWh is needed, convert the value in a template."),
            t(`Если неверен сам класс устройства — исправьте \`device_class\` у \`${e}\` тем же способом.`, `If the device class itself is wrong, correct \`device_class\` of \`${e}\` the same way.`),
          ],
        },
      ]),
    };
  },

  state_class_not_allowed(c) {
    const { t, d } = c;
    const allowed = d.allowed || [];
    const pick = allowed[0];
    return {
      deletable: true,
      intro: t(
        `У сенсора с классом устройства \`${d.device_class}\` стоит \`state_class: ${d.state_class}\`, а допустимы: ${allowed.join(", ") || "—"}.`,
        `A sensor with the device class \`${d.device_class}\` has \`state_class: ${d.state_class}\`, while the allowed ones are: ${allowed.join(", ") || "—"}.`
      ),
      options: compact([
        pick ? c.custom({ state_class: pick }, t(`Подставить допустимый state_class (взят «${pick}»)`, `Set an allowed state_class (“${pick}” is filled in)`)) : null,
        pick ? c.source({ state_class: pick }) : null,
        { title: t("Справка", "Reference"), links: [link.doc(DOCS.sensor, t("Документация: класс устройства и state_class", "Docs: device class and state_class"))] },
      ]),
    };
  },

  meta_mismatch(c) {
    const { t, d, e } = c;
    const wantsSum = ["total", "total_increasing"].includes(d.state_class);
    const previous = wantsSum ? "measurement" : "total_increasing";
    return {
      deletable: true,
      intro: t(
        `Метаданные статистики не совпадают с текущим \`state_class: ${d.state_class}\` (${(d.fields || []).join(", ")}). Обычно так бывает, если \`state_class\` когда-то изменили.`,
        `The statistics metadata do not match the current \`state_class: ${d.state_class}\` (${(d.fields || []).join(", ")}). It usually happens when the \`state_class\` was changed at some point.`
      ),
      options: compact([
        {
          title: t("Пересоздать статистику (рекомендуется, если старая история не критична)", "Recreate the statistics (recommended if the old history is not critical)"),
          where: t(`Отметьте \`${e}\` в таблице и нажмите «Удалить выбранное» — Home Assistant создаст статистику заново с правильным типом. Перед этим делается бэкап и архив отмены.`, `Tick \`${e}\` in the table and press “Delete selected” — Home Assistant will create the statistics again with the right type. A backup and an undo archive are made first.`),
        },
        c.custom({ state_class: previous }, t(`Или вернуть прежний state_class (вероятно, «${previous}»)`, `Or put the previous state_class back (probably “${previous}”)`)),
        c.source({ state_class: previous }),
      ]),
    };
  },

  sum_decrease(c) {
    const { t, d, e } = c;
    const when = (ts) => (ts ? new Date(ts * 1000).toLocaleString(t("ru-RU", "en-GB")) : "?");
    return {
      deletable: true,
      intro: t(
        `Накопленная сумма счётчика уменьшалась ${d.count} раз(а) (${when(d.first_ts)} … ${when(d.last_ts)}), самое большое падение — ${d.biggest != null ? Math.round(d.biggest * 1000) / 1000 : "?"}. В панели «Энергия» за эти часы появится отрицательное потребление.`,
        `The counter's cumulative sum went down ${d.count} time(s) (${when(d.first_ts)} … ${when(d.last_ts)}), the biggest drop is ${d.biggest != null ? Math.round(d.biggest * 1000) / 1000 : "?"}. The Energy dashboard shows negative consumption for those hours.`
      ),
      options: [
        {
          title: t("Исправить сумму (сохраняет историю)", "Adjust the sum (keeps the history)"),
          where: t("«Инструменты разработчика → Статистика»", "“Developer tools → Statistics”"),
          steps: [
            t(`Найдите \`${e}\`, нажмите ⋮ → «Изменить сумму» (Adjust sum).`, `Find \`${e}\`, press ⋮ → “Adjust sum”.`),
            t("Выберите час, где сумма «провалилась», и задайте правильное значение; Home Assistant сдвинет сумму для всех последующих часов.", "Pick the hour where the sum dropped and enter the correct value; Home Assistant shifts the sum for all later hours."),
          ],
          links: [link.statistics(t), link.doc(DOCS.devtools, t("Документация", "Docs"))],
        },
        {
          title: t("Причины и профилактика", "Causes and prevention"),
          steps: [
            t("Сброс счётчика в самом устройстве или замена устройства.", "A counter reset in the device itself, or a replaced device."),
            t("Для сбрасываемых счётчиков используйте `state_class: total_increasing` — тогда HA сам обработает сброс (падение считается новым отсчётом).", "For counters that reset use `state_class: total_increasing` — then HA handles the reset itself (a drop counts as a new start)."),
            t("Перед исправлением сделайте бэкап («Обслуживание»).", "Make a backup before fixing (“Maintenance”)."),
          ],
        },
        {
          title: t("Крайний случай", "Last resort"),
          where: t(`Если история счётчика не нужна — удалите статистику \`${e}\` здесь. Статистика панели «Энергия» защищена и не удаляется.`, `If the counter's history is not needed, delete the statistics of \`${e}\` here. Statistics used by the Energy dashboard are protected and cannot be deleted.`),
        },
      ],
    };
  },

  missing_state_class(c) {
    const { t, d, e } = c;
    const allowed = d.allowed || [];
    const pick = allowed.includes("measurement") ? "measurement" : allowed[0];
    return {
      deletable: false,
      intro: t(
        `Сенсор числовой, с единицей «${d.unit}» и классом устройства \`${d.device_class}\`, но без \`state_class\`: долговременная статистика не ведётся. Это сведения: если статистика не нужна — ничего делать не надо.`,
        `The sensor is numeric, has the unit “${d.unit}” and the device class \`${d.device_class}\` but no \`state_class\`: no long-term statistics are kept. This is information: if you do not need statistics, do nothing.`
      ),
      options: compact([
        pick ? c.custom({ state_class: pick }, t(`Включить статистику (подставлен «${pick}»; допустимы: ${allowed.join(", ")})`, `Turn statistics on (“${pick}” is filled in; allowed: ${allowed.join(", ")})`)) : null,
        pick ? c.source({ state_class: pick }) : null,
        {
          title: t("Что выбрать", "What to choose"),
          steps: [
            t("`measurement` — мгновенные значения; `total_increasing` — счётчики, которые только растут; `total` — накопительные, которые могут уменьшаться.", "`measurement` — instantaneous values; `total_increasing` — counters that only grow; `total` — cumulative values that may go down."),
            t(`Помните: статистика \`${e}\` будет занимать место в базе (одна строка в час).`, `Remember: the statistics of \`${e}\` will take space in the database (one row per hour).`),
          ],
          links: [link.doc(DOCS.sensor, t("Документация", "Docs"))],
        },
      ]),
    };
  },

  unavailable_important(c) {
    const { t, e, integ, issue } = c;
    const refs = (issue.refs || []).map((r) => r.replace(":", ": "));
    return {
      deletable: false,
      intro: t(
        `Сущность недоступна больше часа, а на неё опираются: ${refs.join(", ") || "дашборды, автоматизации или YAML"}. Они не получат данных, пока сенсор не вернётся.`,
        `The entity has been unavailable for over an hour and is used by: ${refs.join(", ") || "dashboards, automations or YAML"}. They get no data until the sensor is back.`
      ),
      options: [
        {
          title: t("Что проверить", "What to check"),
          steps: [
            t("Питание и связь устройства (Wi-Fi, Zigbee, батарейка).", "The device's power and connection (Wi-Fi, Zigbee, battery)."),
            t("Интеграция: «Настройки → Устройства и службы» — нет ли ошибок; при необходимости ⋮ → «Перезагрузить».", "The integration: “Settings → Devices & services” — look for errors; reload it with ⋮ → “Reload” if needed."),
            t("Журнал Home Assistant — там обычно видно причину.", "The Home Assistant log usually shows the reason."),
          ],
          links: compact([link.entity(t, e), integ ? link.integration(t, integ) : null, link.integrations(t), link.logs(t)]),
        },
        {
          title: t("Пока чинится", "Meanwhile"),
          where: t("Автоматизации, которые на неё опираются, стоит защитить условием `{{ not is_state('" + e + "', 'unavailable') }}`.", "Automations that rely on it are worth protecting with the condition `{{ not is_state('" + e + "', 'unavailable') }}`."),
        },
      ],
    };
  },
};

export const GUIDE_CODES = Object.keys(BUILDERS);

export function buildGuide(issue, lang = "en") {
  const c = makeContext(issue, lang === "ru" ? "ru" : "en");
  const builder = BUILDERS[issue.code];
  if (!builder) return { intro: "", options: [], deletable: false };
  const guide = builder(c);
  // customize / source / UI options only make sense for real entities (not external statistic ids)
  if (!c.isEntity) guide.options = guide.options.filter((o) => !o.codes?.some((code) => code.label === "configuration.yaml" && /customize/.test(code.text)));
  return guide;
}
