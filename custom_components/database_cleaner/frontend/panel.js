/*
 * Database Cleaner panel (phase 1: read-only analytics).
 *
 * Plain web component, no build step and no external dependencies. Colours
 * come from the active Home Assistant theme (CSS custom properties), so the
 * panel follows dark / light mode automatically.
 */

const VERSION = "0.4.0";
const DOMAIN = "database_cleaner";
const TOUR_SEEN_KEY = `${DOMAIN}_tour_seen`;

/*
 * Material Design Icons (https://pictogrammers.com/library/mdi/, Apache-2.0): SVG path data copied
 * from the official @mdi/js package. Keys are our own short names; the comment after each key is
 * the MDI icon name. Use ic(name) / badge(name, color) to draw them.
 */
const MDI = {
  help: // help-circle
    "M15.07,11.25L14.17,12.17C13.45,12.89 13,13.5 13,15H11V14.5C11,13.39 11.45,12.39 12.17,11.67L13.41,10.41C13.78,10.05 14,9.55 14,9C14,7.89 13.1,7 12,7A2,2 0 0,0 10,9H8A4,4 0 0,1 12,5A4,4 0 0,1 16,9C16,9.88 15.64,10.67 15.07,11.25M13,19H11V17H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z",
  menu: // menu
    "M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z",
  refresh: // refresh
    "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",
  close: // close
    "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",
  overview: // view-dashboard-outline
    "M19,5V7H15V5H19M9,5V11H5V5H9M19,13V19H15V13H19M9,17V19H5V17H9M21,3H13V9H21V3M11,3H3V13H11V3M21,11H13V21H21V11M11,15H3V21H11V15Z",
  candidates: // broom
    "M19.36,2.72L20.78,4.14L15.06,9.85C16.13,11.39 16.28,13.24 15.38,14.44L9.06,8.12C10.26,7.22 12.11,7.37 13.65,8.44L19.36,2.72M5.93,17.57C3.92,15.56 2.69,13.16 2.35,10.92L7.23,8.83L14.67,16.27L12.58,21.15C10.34,20.81 7.94,19.58 5.93,17.57Z",
  issues: // alert-circle-outline
    "M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z",
  statistics: // chart-timeline-variant
    "M3,14L3.5,14.07L8.07,9.5C7.89,8.85 8.06,8.11 8.59,7.59C9.37,6.8 10.63,6.8 11.41,7.59C11.94,8.11 12.11,8.85 11.93,9.5L14.5,12.07L15,12C15.18,12 15.35,12 15.5,12.07L19.07,8.5C19,8.35 19,8.18 19,8A2,2 0 0,1 21,6A2,2 0 0,1 23,8A2,2 0 0,1 21,10C20.82,10 20.65,10 20.5,9.93L16.93,13.5C17,13.65 17,13.82 17,14A2,2 0 0,1 15,16A2,2 0 0,1 13,14L13.07,13.5L10.5,10.93C10.18,11 9.82,11 9.5,10.93L4.93,15.5L5,16A2,2 0 0,1 3,18A2,2 0 0,1 1,16A2,2 0 0,1 3,14Z",
  states: // history
    "M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3",
  health: // stethoscope
    "M19,8C19.56,8 20,8.43 20,9A1,1 0 0,1 19,10C18.43,10 18,9.55 18,9C18,8.43 18.43,8 19,8M2,2V11C2,13.96 4.19,16.5 7.14,16.91C7.76,19.92 10.42,22 13.5,22A6.5,6.5 0 0,0 20,15.5V11.81C21.16,11.39 22,10.29 22,9A3,3 0 0,0 19,6A3,3 0 0,0 16,9C16,10.29 16.84,11.4 18,11.81V15.41C18,17.91 16,19.91 13.5,19.91C11.5,19.91 9.82,18.7 9.22,16.9C12,16.3 14,13.8 14,11V2H10V5H12V11A4,4 0 0,1 8,15A4,4 0 0,1 4,11V5H6V2H2Z",
  maintenance: // wrench-outline
    "M22.61,19L13.53,9.91C14.46,7.57 14,4.81 12.09,2.91C9.79,0.61 6.21,0.4 3.66,2.26L7.5,6.11L6.08,7.5L2.25,3.69C0.39,6.23 0.6,9.82 2.9,12.11C4.76,13.97 7.47,14.46 9.79,13.59L18.9,22.7C19.29,23.09 19.92,23.09 20.31,22.7L22.61,20.4C23,20 23,19.39 22.61,19M19.61,20.59L10.15,11.13C9.54,11.58 8.86,11.85 8.15,11.95C6.79,12.15 5.36,11.74 4.32,10.7C3.37,9.76 2.93,8.5 3,7.26L6.09,10.35L10.33,6.11L7.24,3C8.5,2.95 9.73,3.39 10.68,4.33C11.76,5.41 12.17,6.9 11.92,8.29C11.8,9 11.5,9.66 11.04,10.25L20.5,19.7L19.61,20.59Z",
  safe: // delete-outline
    "M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M8,9H16V19H8V9M15.5,4L14.5,3H9.5L8.5,4H5V6H19V4H15.5Z",
  unused: // sleep
    "M23,12H17V10L20.39,6H17V4H23V6L19.62,10H23V12M15,16H9V14L12.39,10H9V8H15V10L11.62,14H15V16M7,20H1V18L4.39,14H1V12H7V14L3.62,18H7V20Z",
  review: // magnify
    "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",
  used: // check-circle-outline
    "M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z",
  protected: // shield-lock-outline
    "M21,11C21,16.55 17.16,21.74 12,23C6.84,21.74 3,16.55 3,11V5L12,1L21,5V11M12,21C15.75,20 19,15.54 19,11.22V6.3L12,3.18L5,6.3V11.22C5,15.54 8.25,20 12,21M14.8,11V9.5C14.8,8.1 13.4,7 12,7C10.6,7 9.2,8.1 9.2,9.5V11C8.6,11 8,11.6 8,12.2V15.7C8,16.4 8.6,17 9.2,17H14.7C15.4,17 16,16.4 16,15.8V12.3C16,11.6 15.4,11 14.8,11M13.5,11H10.5V9.5C10.5,8.7 11.2,8.2 12,8.2C12.8,8.2 13.5,8.7 13.5,9.5V11Z",
  energy: // lightning-bolt
    "M11 15H6L13 1V9H18L11 23V15Z",
  dashboards: // view-dashboard
    "M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z",
  automations: // robot
    "M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z",
  scripts: // script-text-outline
    "M15,20A1,1 0 0,0 16,19V4H8A1,1 0 0,0 7,5V16H5V5A3,3 0 0,1 8,2H19A3,3 0 0,1 22,5V6H20V5A1,1 0 0,0 19,4A1,1 0 0,0 18,5V9L18,19A3,3 0 0,1 15,22H5A3,3 0 0,1 2,19V18H13A2,2 0 0,0 15,20M9,6H14V8H9V6M9,10H14V12H9V10M9,14H14V16H9V14Z",
  scenes: // palette-outline
    "M12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2C17.5,2 22,6 22,11A6,6 0 0,1 16,17H14.2C13.9,17 13.7,17.2 13.7,17.5C13.7,17.6 13.8,17.7 13.8,17.8C14.2,18.3 14.4,18.9 14.4,19.5C14.5,20.9 13.4,22 12,22M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C12.3,20 12.5,19.8 12.5,19.5C12.5,19.3 12.4,19.2 12.4,19.1C12,18.6 11.8,18.1 11.8,17.5C11.8,16.1 12.9,15 14.3,15H16A4,4 0 0,0 20,11C20,7.1 16.4,4 12,4M6.5,10C7.3,10 8,10.7 8,11.5C8,12.3 7.3,13 6.5,13C5.7,13 5,12.3 5,11.5C5,10.7 5.7,10 6.5,10M9.5,6C10.3,6 11,6.7 11,7.5C11,8.3 10.3,9 9.5,9C8.7,9 8,8.3 8,7.5C8,6.7 8.7,6 9.5,6M14.5,6C15.3,6 16,6.7 16,7.5C16,8.3 15.3,9 14.5,9C13.7,9 13,8.3 13,7.5C13,6.7 13.7,6 14.5,6M17.5,10C18.3,10 19,10.7 19,11.5C19,12.3 18.3,13 17.5,13C16.7,13 16,12.3 16,11.5C16,10.7 16.7,10 17.5,10Z",
  groups: // account-group
    "M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z",
  persons: // account
    "M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z",
  helpers: // tools
    "M21.71 20.29L20.29 21.71A1 1 0 0 1 18.88 21.71L7 9.85A3.81 3.81 0 0 1 6 10A4 4 0 0 1 2.22 4.7L4.76 7.24L5.29 6.71L6.71 5.29L7.24 4.76L4.7 2.22A4 4 0 0 1 10 6A3.81 3.81 0 0 1 9.85 7L21.71 18.88A1 1 0 0 1 21.71 20.29M2.29 18.88A1 1 0 0 0 2.29 20.29L3.71 21.71A1 1 0 0 0 5.12 21.71L10.59 16.25L7.76 13.42M20 2L16 4V6L13.83 8.17L15.83 10.17L18 8H20L22 4Z",
  yaml: // file-code-outline
    "M14 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2M18 20H6V4H13V9H18V20M9.54 15.65L11.63 17.74L10.35 19L7 15.65L10.35 12.3L11.63 13.56L9.54 15.65M17 15.65L13.65 19L12.38 17.74L14.47 15.65L12.38 13.56L13.65 12.3L17 15.65Z",
  link: // link-variant
    "M10.59,13.41C11,13.8 11,14.44 10.59,14.83C10.2,15.22 9.56,15.22 9.17,14.83C7.22,12.88 7.22,9.71 9.17,7.76V7.76L12.71,4.22C14.66,2.27 17.83,2.27 19.78,4.22C21.73,6.17 21.73,9.34 19.78,11.29L18.29,12.78C18.3,11.96 18.17,11.14 17.89,10.36L18.36,9.88C19.54,8.71 19.54,6.81 18.36,5.64C17.19,4.46 15.29,4.46 14.12,5.64L10.59,9.17C9.41,10.34 9.41,12.24 10.59,13.41M13.41,9.17C13.8,8.78 14.44,8.78 14.83,9.17C16.78,11.12 16.78,14.29 14.83,16.24V16.24L11.29,19.78C9.34,21.73 6.17,21.73 4.22,19.78C2.27,17.83 2.27,14.66 4.22,12.71L5.71,11.22C5.7,12.04 5.83,12.86 6.11,13.65L5.64,14.12C4.46,15.29 4.46,17.19 5.64,18.36C6.81,19.54 8.71,19.54 9.88,18.36L13.41,14.83C14.59,13.66 14.59,11.76 13.41,10.59C13,10.2 13,9.56 13.41,9.17Z",
  healthy: // heart-pulse
    "M7.5,4A5.5,5.5 0 0,0 2,9.5C2,10 2.09,10.5 2.22,11H6.3L7.57,7.63C7.87,6.83 9.05,6.75 9.43,7.63L11.5,13L12.09,11.58C12.22,11.25 12.57,11 13,11H21.78C21.91,10.5 22,10 22,9.5A5.5,5.5 0 0,0 16.5,4C14.64,4 13,4.93 12,6.34C11,4.93 9.36,4 7.5,4V4M3,12.5A1,1 0 0,0 2,13.5A1,1 0 0,0 3,14.5H5.44L11,20C12,20.9 12,20.9 13,20L18.56,14.5H21A1,1 0 0,0 22,13.5A1,1 0 0,0 21,12.5H13.4L12.47,14.8C12.07,15.81 10.92,15.67 10.55,14.83L8.5,9.5L7.54,11.83C7.39,12.21 7.05,12.5 6.6,12.5H3Z",
  orphan: // link-variant-off
    "M2,5.27L3.28,4L20,20.72L18.73,22L13.9,17.17L11.29,19.78C9.34,21.73 6.17,21.73 4.22,19.78C2.27,17.83 2.27,14.66 4.22,12.71L5.71,11.22C5.7,12.04 5.83,12.86 6.11,13.65L5.64,14.12C4.46,15.29 4.46,17.19 5.64,18.36C6.81,19.54 8.71,19.54 9.88,18.36L12.5,15.76L10.88,14.15C10.87,14.39 10.77,14.64 10.59,14.83C10.2,15.22 9.56,15.22 9.17,14.83C8.12,13.77 7.63,12.37 7.72,11L2,5.27M12.71,4.22C14.66,2.27 17.83,2.27 19.78,4.22C21.73,6.17 21.73,9.34 19.78,11.29L18.29,12.78C18.3,11.96 18.17,11.14 17.89,10.36L18.36,9.88C19.54,8.71 19.54,6.81 18.36,5.64C17.19,4.46 15.29,4.46 14.12,5.64L10.79,8.97L9.38,7.55L12.71,4.22M13.41,9.17C13.8,8.78 14.44,8.78 14.83,9.17C16.2,10.54 16.61,12.5 16.06,14.23L14.28,12.46C14.23,11.78 13.94,11.11 13.41,10.59C13,10.2 13,9.56 13.41,9.17Z",
  disabled: // cancel
    "M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22 2 17.5 2 12 6.5 2 12 2M12 4C10.1 4 8.4 4.6 7.1 5.7L18.3 16.9C19.3 15.5 20 13.8 20 12C20 7.6 16.4 4 12 4M16.9 18.3L5.7 7.1C4.6 8.4 4 10.1 4 12C4 16.4 7.6 20 12 20C13.9 20 15.6 19.4 16.9 18.3Z",
  excluded: // filter-remove-outline
    "M14.73,20.83L17.58,18L14.73,15.17L16.15,13.76L19,16.57L21.8,13.76L23.22,15.17L20.41,18L23.22,20.83L21.8,22.24L19,19.4L16.15,22.24L14.73,20.83M13,19.88C13.04,20.18 12.94,20.5 12.71,20.71C12.32,21.1 11.69,21.1 11.3,20.71L7.29,16.7C7.06,16.47 6.96,16.16 7,15.87V10.75L2.21,4.62C1.87,4.19 1.95,3.56 2.38,3.22C2.57,3.08 2.78,3 3,3V3H17V3C17.22,3 17.43,3.08 17.62,3.22C18.05,3.56 18.13,4.19 17.79,4.62L13,10.75V19.88M5.04,5L9,10.06V15.58L11,17.58V10.05L14.96,5H5.04Z",
  stopped: // pause-circle-outline
    "M13,16V8H15V16H13M9,16V8H11V16H9M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z",
  no_states: // help-circle-outline
    "M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6Z",
  no_registry: // clipboard-off-outline
    "M2.39 1.73L1.11 3L3 4.9C3 4.93 3 4.97 3 5V19C3 20.11 3.9 21 5 21H19C19.03 21 19.07 21 19.1 21L20.84 22.73L22.11 21.46L2.39 1.73M5 19V6.89L17.11 19H5M17 7V5H19V15.8L21 17.8V5C21 3.9 20.11 3 19 3H14.82C14.4 1.84 13.3 1 12 1S9.6 1.84 9.18 3H6.2L10.2 7H17M12 3C12.55 3 13 3.45 13 4S12.55 5 12 5 11 4.55 11 4 11.45 3 12 3Z",
  external: // import
    "M14,12L10,8V11H2V13H10V16M20,18V6C20,4.89 19.1,4 18,4H6A2,2 0 0,0 4,6V9H6V6H18V18H6V15H4V18A2,2 0 0,0 6,20H18A2,2 0 0,0 20,18Z",
  error: // alert-circle
    "M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  warning: // alert
    "M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z",
  info: // information-outline
    "M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z",
  backup: // database-export-outline
    "M17.86 18L18.9 19C17.5 20.2 14.94 21 12 21C7.59 21 4 19.21 4 17V7C4 4.79 7.58 3 12 3C14.95 3 17.5 3.8 18.9 5L17.86 6L17.5 6.4C16.65 5.77 14.78 5 12 5C8.13 5 6 6.5 6 7S8.13 9 12 9C13.37 9 14.5 8.81 15.42 8.54L16.38 9.5H13.5V10.92C13 10.97 12.5 11 12 11C9.61 11 7.47 10.47 6 9.64V12.45C7.3 13.4 9.58 14 12 14C12.5 14 13 13.97 13.5 13.92V14.5H16.38L15.38 15.5L15.5 15.61C14.41 15.86 13.24 16 12 16C9.72 16 7.61 15.55 6 14.77V17C6 17.5 8.13 19 12 19C14.78 19 16.65 18.23 17.5 17.61L17.86 18M18.92 7.08L17.5 8.5L20 11H15V13H20L17.5 15.5L18.92 16.92L23.84 12L18.92 7.08Z",
  vacuum: // arrow-collapse-vertical
    "M4,12H20V14H4V12M4,9H20V11H4V9M16,4L12,8L8,4H11V1H13V4H16M8,19L12,15L16,19H13V22H11V19H8Z",
  restore: // backup-restore
    "M12,3A9,9 0 0,0 3,12H0L4,16L8,12H5A7,7 0 0,1 12,5A7,7 0 0,1 19,12A7,7 0 0,1 12,19C10.5,19 9.09,18.5 7.94,17.7L6.5,19.14C8.04,20.3 9.94,21 12,21A9,9 0 0,0 21,12A9,9 0 0,0 12,3M14,12A2,2 0 0,0 12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12Z",
  copy: // content-copy
    "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z",
  select: // checkbox-multiple-marked-outline
    "M20,16V10H22V16A2,2 0 0,1 20,18H8C6.89,18 6,17.1 6,16V4C6,2.89 6.89,2 8,2H16V4H8V16H20M10.91,7.08L14,10.17L20.59,3.58L22,5L14,13L9.5,8.5L10.91,7.08M16,20V22H4A2,2 0 0,1 2,20V7H4V20H16Z",
  clear: // checkbox-multiple-blank-outline
    "M20,16V4H8V16H20M22,16A2,2 0 0,1 20,18H8C6.89,18 6,17.1 6,16V4C6,2.89 6.89,2 8,2H20A2,2 0 0,1 22,4V16M16,20V22H4A2,2 0 0,1 2,20V7H4V20H16Z",
  open: // open-in-new
    "M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z",
  cancel: // stop-circle-outline
    "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4M9,9V15H15V9",
  delete: // delete
    "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z",
  play: // play-circle-outline
    "M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10,16.5L16,12L10,7.5V16.5Z",
  search: // magnify
    "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",
  filter: // filter-variant
    "M6,13H18V11H6M3,6V8H21V6M10,18H14V16H10V18Z",
  database: // database
    "M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z",
  disk: // harddisk
    "M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M12,4A6,6 0 0,0 6,10C6,13.31 8.69,16 12.1,16L11.22,13.77C10.95,13.29 11.11,12.68 11.59,12.4L12.45,11.9C12.93,11.63 13.54,11.79 13.82,12.27L15.74,14.69C17.12,13.59 18,11.9 18,10A6,6 0 0,0 12,4M12,9A1,1 0 0,1 13,10A1,1 0 0,1 12,11A1,1 0 0,1 11,10A1,1 0 0,1 12,9M7,18A1,1 0 0,0 6,19A1,1 0 0,0 7,20A1,1 0 0,0 8,19A1,1 0 0,0 7,18M12.09,13.27L14.58,19.58L17.17,18.08L12.95,12.77L12.09,13.27Z",
  recorder: // record-rec
    "M12.5,5A7.5,7.5 0 0,0 5,12.5A7.5,7.5 0 0,0 12.5,20A7.5,7.5 0 0,0 20,12.5A7.5,7.5 0 0,0 12.5,5M7,10H9A1,1 0 0,1 10,11V12C10,12.5 9.62,12.9 9.14,12.97L10.31,15H9.15L8,13V15H7M12,10H14V11H12V12H14V13H12V14H14V15H12A1,1 0 0,1 11,14V11A1,1 0 0,1 12,10M16,10H18V11H16V14H18V15H16A1,1 0 0,1 15,14V11A1,1 0 0,1 16,10M8,11V12H9V11",
  schema: // file-tree-outline
    "M12 13H7V18H12V20H5V10H7V11H12V13M8 4V6H4V4H8M10 2H2V8H10V2M20 11V13H16V11H20M22 9H14V15H22V9M20 18V20H16V18H20M22 16H14V22H22V16Z",
  clock: // clock-outline
    "M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z",
  check: // check-circle
    "M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z",
  fail: // close-circle
    "M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z",
  verified: // check-decagram
    "M23,12L20.56,9.22L20.9,5.54L17.29,4.72L15.4,1.54L12,3L8.6,1.54L6.71,4.72L3.1,5.53L3.44,9.21L1,12L3.44,14.78L3.1,18.47L6.71,19.29L8.6,22.47L12,21L15.4,22.46L17.29,19.28L20.9,18.46L20.56,14.78L23,12M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z",
  arrow: // arrow-right
    "M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z",
  arrow_down: // arrow-down
    "M11,4H13V16L18.5,10.5L19.92,11.92L12,19.84L4.08,11.92L5.5,10.5L11,16V4Z",
  shield_ok: // shield-check
    "M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z",
  shield_bad: // shield-alert
    "M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5M11,7H13V13H11M11,15H13V17H11",
  sand: // timer-sand
    "M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z",
  cog: // cog-outline
    "M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.62L12.75,4H11.25Z",
  chart: // chart-box-outline
    "M9 17H7V10H9V17M13 17H11V7H13V17M17 17H15V13H17V17M19 19H5V5H19V19.1M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z",
  folder: // folder-outline
    "M20,18H4V8H20M20,6H12L10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6Z",
  bolt: // lightning-bolt-outline
    "M11 9.47V11H14.76L13 14.53V13H9.24L11 9.47M13 1L6 15H11V23L18 9H13V1Z",
  tip: // lightbulb-on-outline
    "M20,11H23V13H20V11M1,11H4V13H1V11M13,1V4H11V1H13M4.92,3.5L7.05,5.64L5.63,7.05L3.5,4.93L4.92,3.5M16.95,5.63L19.07,3.5L20.5,4.93L18.37,7.05L16.95,5.63M12,6A6,6 0 0,1 18,12C18,14.22 16.79,16.16 15,17.2V19A1,1 0 0,1 14,20H10A1,1 0 0,1 9,19V17.2C7.21,16.16 6,14.22 6,12A6,6 0 0,1 12,6M14,21V22A1,1 0 0,1 13,23H11A1,1 0 0,1 10,22V21H14M11,18H13V15.87C14.73,15.43 16,13.86 16,12A4,4 0 0,0 12,8A4,4 0 0,0 8,12C8,13.86 9.27,15.43 11,15.87V18Z",
  rocket: // rocket-launch-outline
    "M13.13 22.19L11.5 18.36C13.07 17.78 14.54 17 15.9 16.09L13.13 22.19M5.64 12.5L1.81 10.87L7.91 8.1C7 9.46 6.22 10.93 5.64 12.5M19.22 4C19.5 4 19.75 4 19.96 4.05C20.13 5.44 19.94 8.3 16.66 11.58C14.96 13.29 12.93 14.6 10.65 15.47L8.5 13.37C9.42 11.06 10.73 9.03 12.42 7.34C15.18 4.58 17.64 4 19.22 4M19.22 2C17.24 2 14.24 2.69 11 5.93C8.81 8.12 7.5 10.53 6.65 12.64C6.37 13.39 6.56 14.21 7.11 14.77L9.24 16.89C9.62 17.27 10.13 17.5 10.66 17.5C10.89 17.5 11.13 17.44 11.36 17.35C13.5 16.53 15.88 15.19 18.07 13C23.73 7.34 21.61 2.39 21.61 2.39S20.7 2 19.22 2M14.54 9.46C13.76 8.68 13.76 7.41 14.54 6.63S16.59 5.85 17.37 6.63C18.14 7.41 18.15 8.68 17.37 9.46C16.59 10.24 15.32 10.24 14.54 9.46M8.88 16.53L7.47 15.12L8.88 16.53M6.24 22L9.88 18.36C9.54 18.27 9.21 18.12 8.91 17.91L4.83 22H6.24M2 22H3.41L8.18 17.24L6.76 15.83L2 20.59V22M2 19.17L6.09 15.09C5.88 14.79 5.73 14.47 5.64 14.12L2 17.76V19.17Z",
  sensor: // access-point
    "M4.93,4.93C3.12,6.74 2,9.24 2,12C2,14.76 3.12,17.26 4.93,19.07L6.34,17.66C4.89,16.22 4,14.22 4,12C4,9.79 4.89,7.78 6.34,6.34L4.93,4.93M19.07,4.93L17.66,6.34C19.11,7.78 20,9.79 20,12C20,14.22 19.11,16.22 17.66,17.66L19.07,19.07C20.88,17.26 22,14.76 22,12C22,9.24 20.88,6.74 19.07,4.93M7.76,7.76C6.67,8.85 6,10.35 6,12C6,13.65 6.67,15.15 7.76,16.24L9.17,14.83C8.45,14.11 8,13.11 8,12C8,10.89 8.45,9.89 9.17,9.17L7.76,7.76M16.24,7.76L14.83,9.17C15.55,9.89 16,10.89 16,12C16,13.11 15.55,14.11 14.83,14.83L16.24,16.24C17.33,15.15 18,13.65 18,12C18,10.35 17.33,8.85 16.24,7.76M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z",
  chart_line: // chart-line
    "M16,11.78L20.24,4.45L21.97,5.45L16.74,14.5L10.23,10.75L5.46,19H22V21H2V3H4V17.54L9.5,8L16,11.78Z",
  timer: // timer-outline
    "M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z",
  calendar: // calendar-clock
    "M15,13H16.5V15.82L18.94,17.23L18.19,18.53L15,16.69V13M19,8H5V19H9.67C9.24,18.09 9,17.07 9,16A7,7 0 0,1 16,9C17.07,9 18.09,9.24 19,9.67V8M5,21C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H6V1H8V3H16V1H18V3H19A2,2 0 0,1 21,5V11.1C22.24,12.36 23,14.09 23,16A7,7 0 0,1 16,23C14.09,23 12.36,22.24 11.1,21H5M16,11.15A4.85,4.85 0 0,0 11.15,16C11.15,18.68 13.32,20.85 16,20.85A4.85,4.85 0 0,0 20.85,16C20.85,13.32 18.68,11.15 16,11.15Z",
  pulse: // pulse
    "M3,13H5.79L10.1,4.79L11.28,13.75L14.5,9.66L17.83,13H21V15H17L14.67,12.67L9.92,18.73L8.94,11.31L7,15H3V13Z",
  speed: // speedometer
    "M12,16A3,3 0 0,1 9,13C9,11.88 9.61,10.9 10.5,10.39L20.21,4.77L14.68,14.35C14.18,15.33 13.17,16 12,16M12,3C13.81,3 15.5,3.5 16.97,4.32L14.87,5.53C14,5.19 13,5 12,5A8,8 0 0,0 4,13C4,15.21 4.89,17.21 6.34,18.65H6.35C6.74,19.04 6.74,19.67 6.35,20.06C5.96,20.45 5.32,20.45 4.93,20.07V20.07C3.12,18.26 2,15.76 2,13A10,10 0 0,1 12,3M22,13C22,15.76 20.88,18.26 19.07,20.07V20.07C18.68,20.45 18.05,20.45 17.66,20.06C17.27,19.67 17.27,19.04 17.66,18.65V18.65C19.11,17.2 20,15.21 20,13C20,12 19.81,11 19.46,10.1L20.67,8C21.5,9.5 22,11.18 22,13Z",
  journal: // text-box-outline
    "M5,3C3.89,3 3,3.89 3,5V19C3,20.11 3.89,21 5,21H19C20.11,21 21,20.11 21,19V5C21,3.89 20.11,3 19,3H5M5,5H19V19H5V5M7,7V9H17V7H7M7,11V13H17V11H7M7,15V17H14V15H7Z",
  table: // table
    "M5,4H19A2,2 0 0,1 21,6V18A2,2 0 0,1 19,20H5A2,2 0 0,1 3,18V6A2,2 0 0,1 5,4M5,8V12H11V8H5M13,8V12H19V8H13M5,14V18H11V14H5M13,14V18H19V14H13Z",
  more: // chevron-down
    "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  puzzle: // puzzle-outline
    "M22,13.5C22,15.26 20.7,16.72 19,16.96V20A2,2 0 0,1 17,22H13.2V21.7A2.7,2.7 0 0,0 10.5,19C9,19 7.8,20.21 7.8,21.7V22H4A2,2 0 0,1 2,20V16.2H2.3C3.79,16.2 5,15 5,13.5C5,12 3.79,10.8 2.3,10.8H2V7A2,2 0 0,1 4,5H7.04C7.28,3.3 8.74,2 10.5,2C12.26,2 13.72,3.3 13.96,5H17A2,2 0 0,1 19,7V10.04C20.7,10.28 22,11.74 22,13.5M17,15H18.5A1.5,1.5 0 0,0 20,13.5A1.5,1.5 0 0,0 18.5,12H17V7H12V5.5A1.5,1.5 0 0,0 10.5,4A1.5,1.5 0 0,0 9,5.5V7H4V9.12C5.76,9.8 7,11.5 7,13.5C7,15.5 5.75,17.2 4,17.88V20H6.12C6.8,18.25 8.5,17 10.5,17C12.5,17 14.2,18.25 14.88,20H17V15Z",
  device: // devices
    "M3 6H21V4H3C1.9 4 1 4.9 1 6V18C1 19.1 1.9 20 3 20H7V18H3V6M13 12H9V13.78C8.39 14.33 8 15.11 8 16C8 16.89 8.39 17.67 9 18.22V20H13V18.22C13.61 17.67 14 16.88 14 16S13.61 14.33 13 13.78V12M11 17.5C10.17 17.5 9.5 16.83 9.5 16S10.17 14.5 11 14.5 12.5 15.17 12.5 16 11.83 17.5 11 17.5M22 8H16C15.5 8 15 8.5 15 9V19C15 19.5 15.5 20 16 20H22C22.5 20 23 19.5 23 19V9C23 8.5 22.5 8 22 8M21 18H17V10H21V18Z",
  ruler: // ruler
    "M1.39,18.36L3.16,16.6L4.58,18L5.64,16.95L4.22,15.54L5.64,14.12L8.11,16.6L9.17,15.54L6.7,13.06L8.11,11.65L9.53,13.06L10.59,12L9.17,10.59L10.59,9.17L13.06,11.65L14.12,10.59L11.65,8.11L13.06,6.7L14.47,8.11L15.54,7.05L14.12,5.64L15.54,4.22L18,6.7L19.07,5.64L16.6,3.16L18.36,1.39L22.61,5.64L5.64,22.61L1.39,18.36Z",
  shape: // shape-outline
    "M11,13.5V21.5H3V13.5H11M9,15.5H5V19.5H9V15.5M12,2L17.5,11H6.5L12,2M12,5.86L10.08,9H13.92L12,5.86M17.5,13C20,13 22,15 22,17.5C22,20 20,22 17.5,22C15,22 13,20 13,17.5C13,15 15,13 17.5,13M17.5,15A2.5,2.5 0 0,0 15,17.5A2.5,2.5 0 0,0 17.5,20A2.5,2.5 0 0,0 20,17.5A2.5,2.5 0 0,0 17.5,15Z",
  area: // floor-plan
    "M10,5V10H9V5H5V13H9V12H10V17H9V14H5V19H12V17H13V19H19V17H21V21H3V3H21V15H19V10H13V15H12V9H19V5H10Z",
  pending: // circle-outline
    "M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  journey: // map-marker-path
    "M18,15A3,3 0 0,1 21,18A3,3 0 0,1 18,21C16.69,21 15.58,20.17 15.17,19H14V17H15.17C15.58,15.83 16.69,15 18,15M18,17A1,1 0 0,0 17,18A1,1 0 0,0 18,19A1,1 0 0,0 19,18A1,1 0 0,0 18,17M18,8A1.43,1.43 0 0,0 19.43,6.57C19.43,5.78 18.79,5.14 18,5.14C17.21,5.14 16.57,5.78 16.57,6.57A1.43,1.43 0 0,0 18,8M18,2.57A4,4 0 0,1 22,6.57C22,9.56 18,14 18,14C18,14 14,9.56 14,6.57A4,4 0 0,1 18,2.57M8.83,17H10V19H8.83C8.42,20.17 7.31,21 6,21A3,3 0 0,1 3,18C3,16.69 3.83,15.58 5,15.17V14H7V15.17C7.85,15.47 8.53,16.15 8.83,17M6,17A1,1 0 0,0 5,18A1,1 0 0,0 6,19A1,1 0 0,0 7,18A1,1 0 0,0 6,17M6,3A3,3 0 0,1 9,6C9,7.31 8.17,8.42 7,8.83V10H5V8.83C3.83,8.42 3,7.31 3,6A3,3 0 0,1 6,3M6,5A1,1 0 0,0 5,6A1,1 0 0,0 6,7A1,1 0 0,0 7,6A1,1 0 0,0 6,5M11,19V17H13V19H11M7,13H5V11H7V13Z",
  save: // content-save-outline
    "M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3M19 19H5V5H16.17L19 7.83V19M12 12C10.34 12 9 13.34 9 15S10.34 18 12 18 15 16.66 15 15 13.66 12 12 12M6 6H15V10H6V6Z",
  queue: // tray-full
    "M18 5H6V7H18M6 9H18V11H6M2 12H4V17H20V12H22V17A2 2 0 0 1 20 19H4A2 2 0 0 1 2 17M18 13H6V15H18Z",
  eye: // eye-outline
    "M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z",
  trash_can: // trash-can-outline
    "M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z",
  flag: // flag-checkered
    "M14.4,6H20V16H13L12.6,14H7V21H5V4H14L14.4,6M14,14H16V12H18V10H16V8H14V10L13,8V6H11V8H9V6H7V8H9V10H7V12H9V10H11V12H13V10L14,12V14M11,10V8H13V10H11M14,10H16V12H14V10Z",
  hourglass: // progress-clock
    "M13,2.03V2.05L13,4.05C17.39,4.59 20.5,8.58 19.96,12.97C19.5,16.61 16.64,19.5 13,19.93V21.93C18.5,21.38 22.5,16.5 21.95,11C21.5,6.25 17.73,2.5 13,2.03M11,2.06C9.05,2.25 7.19,3 5.67,4.26L7.1,5.74C8.22,4.84 9.57,4.26 11,4.06V2.06M4.26,5.67C3,7.19 2.25,9.04 2.05,11H4.05C4.24,9.58 4.8,8.23 5.69,7.1L4.26,5.67M2.06,13C2.26,14.96 3.03,16.81 4.27,18.33L5.69,16.9C4.81,15.77 4.24,14.42 4.06,13H2.06M7.1,18.37L5.67,19.74C7.18,21 9.04,21.79 11,22V20C9.58,19.82 8.23,19.25 7.1,18.37M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z",
  partial: // alert-circle-check-outline
    "M18.75 22.16L16 19.16L17.16 18L18.75 19.59L22.34 16L23.5 17.41L18.75 22.16M11 15H13V17H11V15M11 7H13V13H11V7M12 2C17.5 2 22 6.5 22 12L21.92 13.31C21.31 13.11 20.67 13 19.94 13L20 12C20 7.58 16.42 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C12.71 20 13.39 19.91 14.05 19.74C14.13 20.42 14.33 21.06 14.62 21.65C13.78 21.88 12.9 22 12 22C6.47 22 2 17.5 2 12C2 6.5 6.47 2 12 2Z",
  free: // database-minus-outline
    "M20 13.09V7C20 4.79 16.42 3 12 3S4 4.79 4 7V17C4 19.21 7.59 21 12 21C12.46 21 12.9 21 13.33 20.94C13.12 20.33 13 19.68 13 19L13 18.95C12.68 19 12.35 19 12 19C8.13 19 6 17.5 6 17V14.77C7.61 15.55 9.72 16 12 16C12.65 16 13.27 15.96 13.88 15.89C14.93 14.16 16.83 13 19 13C19.34 13 19.67 13.04 20 13.09M18 12.45C16.7 13.4 14.42 14 12 14S7.3 13.4 6 12.45V9.64C7.47 10.47 9.61 11 12 11S16.53 10.47 18 9.64V12.45M12 9C8.13 9 6 7.5 6 7S8.13 5 12 5 18 6.5 18 7 15.87 9 12 9M23 18V20H15V18H23Z",
  sun: // white-balance-sunny
    "M3.55 19.09L4.96 20.5L6.76 18.71L5.34 17.29M12 6C8.69 6 6 8.69 6 12S8.69 18 12 18 18 15.31 18 12C18 8.68 15.31 6 12 6M20 13H23V11H20M17.24 18.71L19.04 20.5L20.45 19.09L18.66 17.29M20.45 5L19.04 3.6L17.24 5.39L18.66 6.81M13 1H11V4H13M6.76 5.39L4.96 3.6L3.55 5L5.34 6.81L6.76 5.39M1 13H4V11H1M13 20H11V23H13",
  moon: // weather-night
    "M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z",
  translate: // translate
    "M12.87,15.07L10.33,12.56L10.36,12.53C12.1,10.59 13.34,8.36 14.07,6H17V4H10V2H8V4H1V6H12.17C11.5,7.92 10.44,9.75 9,11.35C8.07,10.32 7.3,9.19 6.69,8H4.69C5.42,9.63 6.42,11.17 7.67,12.56L2.58,17.58L4,19L9,14L12.11,17.11L12.87,15.07M18.5,10H16.5L12,22H14L15.12,19H19.87L21,22H23L18.5,10M15.88,17L17.5,12.67L19.12,17H15.88Z",
};

const I18N = {
  en: {
    title: "Database Cleaner",
    tab_overview: "Overview",
    tab_statistics: "Statistics",
    tab_states: "States",
    tab_health: "Diagnostics",
    refresh: "Refresh",
    tour: "Guided tour of the panel",
    tour_failed: "Could not load the guided tour",
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
    approx_mib: "≈ MB",
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
    mib: "MB",
    commit_note: "The recorder writes in batches every {s} s, so the most recent seconds are not visible yet.",
    tab_candidates: "Candidates",
    tab_issues: "Problems",
    issues_intro: "What Home Assistant reports about statistics (the same as Developer tools → Statistics) plus our own checks. This tab only shows problems; nothing is changed from here.",
    only_important: "only important",
    important_hint: "Entities that are used in Energy, dashboards, automations, scripts or YAML",
    src_all: "all sources",
    src_ha: "Home Assistant",
    src_own: "Database Cleaner",
    issues_none: "No problems found",
    issues_wait: "Reads every sensor and every statistic; the first run can take a minute.",
    issues_total: "problems",
    issues_important: "of them important",
    col_problem: "Problem",
    col_source: "Source",
    act_ha_stats: "HA statistics",
    act_entity: "Entity",
    act_candidates: "In Candidates",
    in_repairs: "in Repairs",
    cand_focus: "Showing one statistic from the Problems tab:",
    cand_unfocus: "Show all",
    sev_error: "error",
    sev_warning: "warning",
    sev_info: "info",
    i_units_changed: "Unit changed",
    i_state_class_removed: "state_class removed",
    i_mean_type_changed: "Mean type changed",
    i_entity_no_longer_recorded: "Excluded from recorder, statistics remain",
    i_entity_not_recorded: "Has state_class but is excluded from recorder",
    i_no_state: "Statistics without an entity",
    i_no_statistics: "Has state_class, but no statistics yet",
    i_lts_stalled: "Statistics stopped being written",
    i_unit_not_allowed: "Unit does not fit the device class",
    i_state_class_not_allowed: "state_class does not fit the device class",
    i_meta_mismatch: "Statistics metadata disagree with state_class",
    i_sum_decrease: "Cumulative sum goes down",
    i_missing_state_class: "No state_class: not kept as long-term statistics",
    i_unavailable_important: "Used entity is unavailable",
    i_fix_units_changed: "Developer tools → Statistics offers to convert or fix the unit; or delete the statistic if the old history is not needed.",
    i_fix_state_class_removed: "Give the sensor its state_class back, or delete the statistic.",
    i_fix_mean_type_changed: "Old and new statistics cannot be mixed: delete the statistic and start over.",
    i_fix_entity_no_longer_recorded: "Remove the entity from recorder exclude, or delete its statistics.",
    i_fix_entity_not_recorded: "Informational: statistics are not collected because of recorder exclude.",
    i_fix_no_state: "The sensor is gone: if nobody needs the history, delete it in Candidates.",
    i_fix_no_statistics: "Wait one hour; if it stays, check recorder include/exclude and that the state is numeric.",
    i_fix_lts_stalled: "Usually the sensor is unavailable or reports text. Fix the source or delete the statistic.",
    i_fix_unit_not_allowed: "Fix the unit of measurement in the integration or template; HA ignores such values for statistics.",
    i_fix_state_class_not_allowed: "Pick a state_class that is allowed for this device class (see HA docs on sensors).",
    i_fix_meta_mismatch: "Delete the statistic so it is rebuilt with the right type, or restore the previous state_class.",
    i_fix_sum_decrease: "Negative consumption appears in Energy. Fix the sum in Developer tools → Statistics (adjust) or delete the broken period.",
    i_fix_missing_state_class: "Add state_class: measurement (or total_increasing) if you want long-term statistics.",
    i_fix_unavailable_important: "Check the device or integration: dashboards and automations rely on this entity.",
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
    not_checked: "Not visible here: Node-RED, AppDaemon, packages outside the config folder, external tools (Grafana, InfluxDB). YAML files of the config folder are searched as text (comments and secrets.yaml are skipped). Check the rest yourself before deleting “not used” statistics.",
    src_energy: "energy",
    src_dashboards: "dashboards",
    src_automations: "automations",
    src_scripts: "scripts",
    src_scenes: "scenes",
    src_groups: "groups",
    src_persons: "persons",
    src_helpers: "helpers",
    src_yaml_files: "YAML files",
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
    flow_title: "Where the data goes",
    flow_sensors: "Sensors",
    flow_kept: "kept {d} d",
    flow_auto: "deleted by the recorder",
    flow_forever: "kept forever",
    flow_manual: "only you clean it",
    next_title: "What to do next",
    next_biggest: "{name}: {pct} of the database",
    next_cand_sub: "Open Candidates: see what can be deleted",
    next_states_sub: "Open States: see who writes the most",
    next_issues: "Check problems with statistics",
    next_issues_sub: "What Home Assistant and this panel report",
    next_disk_low: "Low disk space",
    next_disk_low_sub: "A backup may not fit: free some space first",
    next_free_pages: "{pct} of the file is empty",
    next_free_pages_sub: "Compact the database (VACUUM) in Maintenance",
    next_backup: "Make a backup",
    next_backup_sub: "Before any cleaning: Maintenance tab",
    sum_free: "Can be freed right now",
    sum_title: "Candidates by verdict",
    sev_summary: "By severity",
    age_title: "When was the statistic last written",
    age_hint: "Rows grouped by how long ago the statistic stopped growing. Click a column to filter the list.",
    age_d1: "today",
    age_d7: "≤ 7 d",
    age_d30: "≤ 30 d",
    age_d365: "≤ 1 y",
    age_old: "older",
    age_none: "never",
    top_writers: "Who writes the most",
    strip_title: "Health at a glance",
    lamp_recording: "Recording",
    lamp_queue: "Queue",
    lamp_state: "States",
    lamp_short: "5-min statistics",
    lamp_lts: "Hourly statistics",
    lamp_unclean: "Unclean stops",
    lamp_integrity: "Integrity",
    lamp_clean: "none",
    lamp_not_run: "not run",
    sf_title: "How deletion stays safe",
    sf_preflight: "HA is running, space is enough",
    sf_backup: "verified copy of the file",
    sf_delete: "small batches + undo archive",
    sf_repack: "optional: frees disk space",
    sf_restore: "returns rows from the archive",
    act_backup_hint: "A verified copy of the database file",
    act_repack_hint: "Frees empty pages; the recorder pauses writes meanwhile",
    before_after: "before → after",
    theme_to_light: "Switch to the light theme",
    theme_to_dark: "Switch to the dark theme",
    lang_switch: "Switch language",
  },
  ru: {
    title: "Database Cleaner",
    tab_overview: "Обзор",
    tab_statistics: "Статистика",
    tab_states: "Состояния",
    tab_health: "Диагностика",
    refresh: "Обновить",
    tour: "Экскурсия по панели",
    tour_failed: "Не удалось загрузить экскурсию",
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
    approx_mib: "≈ MB",
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
    mib: "MB",
    commit_note: "Recorder пишет пачками раз в {s} с, поэтому последние секунды ещё не видны.",
    tab_candidates: "Кандидаты",
    tab_issues: "Проблемы",
    issues_intro: "Что Home Assistant сообщает о статистике (то же, что «Инструменты разработчика → Статистика») плюс наши проверки. Вкладка только показывает проблемы — отсюда ничего не меняется.",
    only_important: "только важные",
    important_hint: "Сущности, которые используются в Энергии, дашбордах, автоматизациях, скриптах или YAML",
    src_all: "все источники",
    src_ha: "Home Assistant",
    src_own: "Database Cleaner",
    issues_none: "Проблем не найдено",
    issues_wait: "Читает все сенсоры и всю статистику; первый запуск может занять минуту.",
    issues_total: "проблем",
    issues_important: "из них важных",
    col_problem: "Проблема",
    col_source: "Источник",
    act_ha_stats: "Статистика HA",
    act_entity: "Сущность",
    act_candidates: "В «Кандидатах»",
    in_repairs: "в «Исправлениях»",
    cand_focus: "Показана одна статистика с вкладки «Проблемы»:",
    cand_unfocus: "Показать все",
    sev_error: "ошибка",
    sev_warning: "предупреждение",
    sev_info: "сведения",
    i_units_changed: "Изменилась единица измерения",
    i_state_class_removed: "У сенсора пропал state_class",
    i_mean_type_changed: "Изменился тип усреднения",
    i_entity_no_longer_recorded: "Исключена из recorder, статистика осталась",
    i_entity_not_recorded: "Есть state_class, но сущность исключена из recorder",
    i_no_state: "Статистика без сущности",
    i_no_statistics: "Есть state_class, но статистики ещё нет",
    i_lts_stalled: "Статистика перестала писаться",
    i_unit_not_allowed: "Единица не подходит к классу устройства",
    i_state_class_not_allowed: "state_class не подходит к классу устройства",
    i_meta_mismatch: "Метаданные статистики не совпадают со state_class",
    i_sum_decrease: "Накопленная сумма уменьшается",
    i_missing_state_class: "Нет state_class: долговременная статистика не ведётся",
    i_unavailable_important: "Используемая сущность недоступна",
    i_fix_units_changed: "«Инструменты разработчика → Статистика» предложит пересчитать или исправить единицу; либо удалите статистику, если старая история не нужна.",
    i_fix_state_class_removed: "Верните сенсору state_class или удалите статистику.",
    i_fix_mean_type_changed: "Старую и новую статистику смешивать нельзя: удалите её и начните заново.",
    i_fix_entity_no_longer_recorded: "Уберите сущность из recorder exclude или удалите её статистику.",
    i_fix_entity_not_recorded: "Справочно: статистика не собирается из-за recorder exclude.",
    i_fix_no_state: "Сенсора больше нет: если история не нужна, удалите её во вкладке «Кандидаты».",
    i_fix_no_statistics: "Подождите час; если не появилась — проверьте include/exclude recorder и что состояние числовое.",
    i_fix_lts_stalled: "Обычно сенсор недоступен или отдаёт текст. Почините источник или удалите статистику.",
    i_fix_unit_not_allowed: "Исправьте единицу измерения в интеграции или шаблоне; HA не учитывает такие значения в статистике.",
    i_fix_state_class_not_allowed: "Выберите state_class, допустимый для этого класса устройства (см. документацию HA по сенсорам).",
    i_fix_meta_mismatch: "Удалите статистику, чтобы она пересоздалась с правильным типом, или верните прежний state_class.",
    i_fix_sum_decrease: "В «Энергии» появляется отрицательное потребление. Исправьте сумму в «Инструменты разработчика → Статистика» или удалите испорченный период.",
    i_fix_missing_state_class: "Добавьте state_class: measurement (или total_increasing), если нужна долговременная статистика.",
    i_fix_unavailable_important: "Проверьте устройство или интеграцию: дашборды и автоматизации рассчитывают на эту сущность.",
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
    not_checked: "Отсюда не видно: Node-RED, AppDaemon, пакеты вне папки конфига, внешние системы (Grafana, InfluxDB). YAML-файлы папки конфига просматриваются как текст (комментарии и secrets.yaml пропускаются). Остальное проверьте сами, прежде чем удалять «неиспользуемые».",
    src_energy: "энергия",
    src_dashboards: "дашборды",
    src_automations: "автоматизации",
    src_scripts: "скрипты",
    src_scenes: "сцены",
    src_groups: "группы",
    src_persons: "люди",
    src_helpers: "хелперы",
    src_yaml_files: "YAML-файлы",
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
    flow_title: "Куда идут данные",
    flow_sensors: "Сенсоры",
    flow_kept: "хранится {d} д",
    flow_auto: "recorder удаляет сам",
    flow_forever: "хранится бессрочно",
    flow_manual: "чистите только вы",
    next_title: "Что делать дальше",
    next_biggest: "{name}: {pct} базы",
    next_cand_sub: "Откройте «Кандидаты»: что можно удалить",
    next_states_sub: "Откройте «Состояния»: кто пишет больше всех",
    next_issues: "Проверьте проблемы со статистикой",
    next_issues_sub: "Что сообщают Home Assistant и эта панель",
    next_disk_low: "Мало места на диске",
    next_disk_low_sub: "Бэкап может не поместиться: сначала освободите место",
    next_free_pages: "{pct} файла пусто",
    next_free_pages_sub: "Сожмите базу (VACUUM) на вкладке «Обслуживание»",
    next_backup: "Сделайте бэкап",
    next_backup_sub: "Перед любой чисткой: вкладка «Обслуживание»",
    sum_free: "Можно освободить прямо сейчас",
    sum_title: "Кандидаты по вердиктам",
    sev_summary: "По важности",
    age_title: "Когда статистика писалась в последний раз",
    age_hint: "Строки по тому, как давно статистика перестала расти. Нажмите на столбик, чтобы отфильтровать список.",
    age_d1: "сегодня",
    age_d7: "≤ 7 д",
    age_d30: "≤ 30 д",
    age_d365: "≤ 1 г",
    age_old: "старше",
    age_none: "никогда",
    top_writers: "Кто пишет больше всех",
    strip_title: "Здоровье с первого взгляда",
    lamp_recording: "Запись",
    lamp_queue: "Очередь",
    lamp_state: "Состояния",
    lamp_short: "5-мин статистика",
    lamp_lts: "Часовая статистика",
    lamp_unclean: "Некорректные остановки",
    lamp_integrity: "Целостность",
    lamp_clean: "нет",
    lamp_not_run: "не запускалась",
    sf_title: "Как удаление остаётся безопасным",
    sf_preflight: "HA работает, места хватает",
    sf_backup: "проверенная копия файла",
    sf_delete: "малыми порциями + архив отмены",
    sf_repack: "по желанию: освобождает диск",
    sf_restore: "возвращает строки из архива",
    act_backup_hint: "Проверенная копия файла базы",
    act_repack_hint: "Освобождает пустые страницы; recorder на это время приостанавливает запись",
    before_after: "до → после",
    theme_to_light: "Переключить на светлую тему",
    theme_to_dark: "Переключить на тёмную тему",
    lang_switch: "Сменить язык",
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
// ref kind (as sent by the backend) -> MDI key; verdict / category / tab / severity keys are MDI keys themselves
const REF_ICON = {
  energy: "energy",
  dashboard: "dashboards",
  automation: "automations",
  script: "scripts",
  scene: "scenes",
  group: "groups",
  person: "persons",
  helper: "helpers",
  yaml: "yaml",
};
const REASON_ICON = {
  orphan: "orphan",
  disabled: "disabled",
  excluded: "excluded",
  no_states: "no_states",
  stopped: "stopped",
  no_registry: "no_registry",
  external: "external",
  diagnostic: "health",
  derived: "puzzle",
  cloud_weather: "sensor",
  low_value_unit: "ruler",
  test_name: "flag",
  tiny: "free",
};
const GROUP_ICON = { lts: "chart_line", states: "states", short_term: "timer", events: "calendar", meta: "cog", other: "database" };
const SEV_COLOR = { error: "var(--error-color, #db4437)", warning: "var(--warning-color, #ffa600)", info: "#78909c" };
const OK_COLOR = "var(--success-color, #43a047)";
const BAD_COLOR = "var(--error-color, #db4437)";
const WARN_COLOR = "var(--warning-color, #ffa600)";
const OFF_COLOR = "#8d8d8d";
const ACCENT = "var(--primary-color, #03a9f4)";

// The panel has its own dark / light switch (toolbar). Dark is the main theme and the default; the
// palette is set as CSS variables on the panel element (and on the tour), so every colour below follows it.
const THEMES = {
  dark: {
    "color-scheme": "dark",
    "--primary-background-color": "#111111",
    "--card-background-color": "#1c1c1c",
    "--ha-card-background": "#1c1c1c",
    "--primary-text-color": "#e1e1e1",
    "--secondary-text-color": "#9b9b9b",
    "--divider-color": "rgba(225, 225, 225, 0.12)",
    "--ha-card-border-color": "rgba(225, 225, 225, 0.12)",
    "--app-header-background-color": "#111111",
    "--app-header-text-color": "#e1e1e1",
    "--input-fill-color": "rgba(127, 127, 127, 0.12)",
    "--ha-card-box-shadow": "none",
  },
  light: {
    "color-scheme": "light",
    "--primary-background-color": "#f4f6f8",
    "--card-background-color": "#ffffff",
    "--ha-card-background": "#ffffff",
    "--primary-text-color": "#212121",
    "--secondary-text-color": "#6b6b6b",
    "--divider-color": "rgba(0, 0, 0, 0.12)",
    "--ha-card-border-color": "rgba(0, 0, 0, 0.12)",
    "--app-header-background-color": "#ffffff",
    "--app-header-text-color": "#212121",
    "--input-fill-color": "rgba(0, 0, 0, 0.05)",
    "--ha-card-box-shadow": "none",
  },
};
const PREF_PREFIX = `${DOMAIN}_`;
const LOCALE = { ru: "ru-RU", en: "en-GB" };
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

// ------------------------------------------------------------------ icons and charts
// Every chart is a pure function (data -> HTML/SVG string); colours come from the callers, so the
// panel follows the Home Assistant theme. Hovering a segment shows its exact value (<title>).
const ic = (name, cls = "") => svg(MDI[name] || MDI.info, cls);
const badge = (name, color = ACCENT, size = "") =>
  `<span class="badge ${size}" style="--c:${color}">${ic(name)}</span>`;
const note = (icon, html, cls = "") => `<div class="note ico ${cls}">${ic(icon)}<span>${html}</span></div>`;

/** Ring with the parts in the middle: used for "where the space goes". */
function donut(segs, { center = "", sub = "" } = {}) {
  const total = segs.reduce((a, s) => a + s.value, 0);
  if (!total) return "";
  const gap = segs.length > 1 ? 0.6 : 0;
  let acc = 0;
  const arcs = segs
    .map((s) => {
      const len = (100 * s.value) / total;
      const dash = Math.max(len - gap, 0.01);
      const arc = `<circle class="arc" cx="60" cy="60" r="46" pathLength="100" style="stroke:${s.color}"
        stroke-dasharray="${dash.toFixed(3)} ${(100 - dash).toFixed(3)}" stroke-dashoffset="${(-acc).toFixed(3)}"><title>${esc(
        s.label
      )}: ${esc(s.text ?? "")}</title></circle>`;
      acc += len;
      return arc;
    })
    .join("");
  return `<svg class="donut" viewBox="0 0 120 120" role="img"><circle cx="60" cy="60" r="46" class="donut-bg"/>${arcs}
    <text x="60" y="60" class="donut-c">${esc(center)}</text><text x="60" y="75" class="donut-s">${esc(sub)}</text></svg>`;
}

/** Small progress ring with a short label inside (disk, free pages). */
function ring(pct, color, label = "") {
  const p = Math.max(0, Math.min(100, pct ?? 0));
  const arc = p
    ? `<circle class="arc" cx="22" cy="22" r="18" pathLength="100" style="stroke:${color};stroke-width:5;transform-origin:22px 22px"
        stroke-dasharray="${p.toFixed(2)} ${(100 - p).toFixed(2)}" stroke-linecap="${p >= 100 ? "butt" : "round"}"/>`
    : "";
  return `<svg class="ring" viewBox="0 0 44 44" role="img"><circle cx="22" cy="22" r="18" class="donut-bg" style="stroke-width:5"/>${arc}
    <text x="22" y="22.5" class="ring-t">${esc(label)}</text></svg>`;
}

/** One segmented bar plus a legend with icons. segs: {label, text, value, color, icon}. */
function stackbar(segs) {
  const total = segs.reduce((a, s) => a + s.value, 0);
  if (!total) return "";
  const bar = segs
    .filter((s) => s.value > 0)
    .map(
      (s) =>
        `<span style="width:${(100 * s.value) / total}%;background:${s.color}" title="${esc(s.label)}: ${esc(s.text)}"></span>`
    )
    .join("");
  const legend = segs
    .map(
      (s) =>
        `<span class="lg-i"><span class="lg-ic" style="--c:${s.color}">${ic(s.icon)}</span>${esc(s.label)} <b>${esc(s.text)}</b></span>`
    )
    .join("");
  return `<div class="stack">${bar}</div><div class="legend">${legend}</div>`;
}

/** Horizontal bars: rows {label, sub, value, text, color}. */
function hbars(rows, color = ACCENT) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return `<div class="hbars">${rows
    .map(
      (r) => `<div class="hb"><div class="hb-l" title="${esc(r.label)}">${esc(r.label)}${
        r.sub ? `<span class="muted small">${esc(r.sub)}</span>` : ""
      }</div><div class="hb-t"><span style="width:${r.value ? Math.max(1.5, (100 * r.value) / max) : 0}%;background:${
        r.color || color
      }"></span></div><b class="hb-v">${esc(r.text)}</b></div>`
    )
    .join("")}</div>`;
}

/** Vertical columns that double as filter buttons: buckets {key, label, sub, value, text, color, active, title}. */
function columns(buckets, action) {
  const max = Math.max(1, ...buckets.map((b) => b.value));
  return `<div class="cols">${buckets
    .map(
      (b) => `<button class="col ${b.active ? "active" : ""}" data-action="${action}" data-value="${b.key}" title="${esc(
        b.title || ""
      )}"><span class="col-v">${esc(b.text)}</span><span class="col-track"><span class="col-bar" style="height:${
        b.value ? Math.max(3, (100 * b.value) / max) : 0
      }%;background:${b.color}"></span></span><span class="col-l">${esc(b.label)}</span><span class="col-s">${esc(
        b.sub || ""
      )}</span></button>`
    )
    .join("")}</div>`;
}

/** Bars on a shared time axis: rows {label, icon, from, to, color, sub, title, live}; times are unix seconds. */
function timeline(rows, min, max, fmt) {
  if (!rows.length || min == null || max == null) return "";
  const span = Math.max(1, max - min);
  const body = rows
    .map((r) => {
      const left = (100 * (r.from - min)) / span;
      const width = Math.max(1.5, (100 * ((r.to ?? max) - r.from)) / span);
      return `<div class="tl-row" title="${esc(r.title || "")}"><div class="tl-l">${
        r.icon ? `<span class="lg-ic" style="--c:${r.color}">${ic(r.icon)}</span>` : ""
      }<span>${esc(r.label)}</span></div><div class="tl-m"><div class="tl-t"><span class="tl-b ${r.live ? "live" : ""}" style="left:${left.toFixed(
        2
      )}%;width:${Math.min(width, 100 - left).toFixed(2)}%;background:${r.color}"></span></div>${
        r.sub ? `<div class="tl-d muted small">${esc(r.sub)}</div>` : ""
      }</div></div>`;
    })
    .join("");
  return `<div class="tl">${body}<div class="tl-axis muted small"><span>${esc(fmt(min))}</span><span>${esc(fmt(max))}</span></div></div>`;
}

/** Process steps with arrows: steps {icon, label, sub, state: done|active|pending|alt, color}. */
function stepper(steps) {
  return `<ol class="stepper">${steps
    .map(
      (s, i) =>
        `${i ? `<li class="st-arrow" aria-hidden="true">${ic("arrow")}</li>` : ""}<li class="st ${s.state || "pending"}">${badge(
          s.state === "done" ? "check" : s.icon,
          s.state === "done" ? OK_COLOR : s.color || ACCENT
        )}<b>${esc(s.label)}</b>${s.sub ? `<span class="muted small">${esc(s.sub)}</span>` : ""}</li>`
    )
    .join("")}</ol>`;
}

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
      lts: { period: "all", groupBy: "statistic", category: null, diagnostic: false, age: null, search: "", limit: 0, sort: "rows" },
      st: { window: null, groupBy: "entity", limit: 0, sort: "rows" },
      cand: { verdict: "safe", reason: null, search: "", limit: 0, selected: new Set(), yaml: false, toast: "", focus: null },
      issues: null,
      iss: { source: "all", important: false, code: null, search: "", limit: 0 },
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
      const savedLang = this._pref("lang");
      this._lang =
        savedLang === "ru" || savedLang === "en"
          ? savedLang
          : (hass.language || "en").toLowerCase().startsWith("ru")
          ? "ru"
          : "en";
      this._nf = new Intl.NumberFormat(savedLang ? LOCALE[this._lang] : hass.locale?.language || hass.language || undefined);
      this._theme = this._pref("theme") === "light" ? "light" : "dark";
      this._applyTheme();
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
    this._tour?.close();
  }

  // ---------------------------------------------------------------- language and theme
  _pref(key) {
    try {
      return localStorage.getItem(PREF_PREFIX + key);
    } catch (_err) {
      return null;
    }
  }

  _savePref(key, value) {
    try {
      localStorage.setItem(PREF_PREFIX + key, value);
    } catch (_err) {
      /* storage blocked: the choice just lasts until reload */
    }
  }

  _applyTheme() {
    for (const [name, value] of Object.entries(THEMES[this._theme])) this.style.setProperty(name, value);
  }

  _setTheme(theme) {
    this._theme = theme;
    this._savePref("theme", theme);
    this._applyTheme();
    this._render();
  }

  _setLang(lang) {
    this._lang = lang;
    this._savePref("lang", lang);
    this._nf = new Intl.NumberFormat(LOCALE[lang]);
    this._render();
  }

  // ---------------------------------------------------------------- guided tour
  // The tour lives in tour.js (steps + engine), loaded on first use. It only needs
  // the three hooks below; targets are marked with data-tour="…" in the markup.
  _tourSeen() {
    try {
      return !!localStorage.getItem(TOUR_SEEN_KEY);
    } catch (_err) {
      return true;
    }
  }

  async _startTour() {
    if (this._tour) return;
    try {
      // Reuse this module's ?v=… query so a new version never serves a stale tour.js.
      const url = new URL("./tour.js", import.meta.url);
      url.search = new URL(import.meta.url).search;
      const mod = await import(url.href);
      if (this._tour) return;
      this._tour = mod.startTour(this, {
        lang: this._lang,
        icons: MDI,
        theme: THEMES[this._theme],
        onClose: () => {
          this._tour = null;
        },
      });
      try {
        localStorage.setItem(TOUR_SEEN_KEY, "1");
      } catch (_err) {
        /* storage blocked: the hint simply stays */
      }
      this.shadowRoot.querySelector('[data-tour="help"]')?.classList.remove("attn");
    } catch (err) {
      console.error("database_cleaner: tour failed", err);
      this._s.notice = `⚠️ ${this.t("tour_failed")}`;
      this._renderContent();
    }
  }

  /** Hook for the tour: the tab that is open right now. */
  get tourTab() {
    return this._s.tab;
  }

  /** Hook for the tour: reset filters so a step always sees the same list. */
  tourPrepare(key) {
    const c = this._s.cand;
    if (key === "cand-safe") {
      Object.assign(c, { verdict: "safe", reason: null, search: "", limit: 0, focus: null });
      this._renderContent();
    }
  }

  /** Hook for the tour: open a tab (and start loading its data). */
  tourGoTo(tab) {
    if (this._s.tab !== tab) {
      this._s.tab = tab;
      this._render();
      this._ensureTab();
    }
  }

  /** Hook for the tour: true while any tab data is still being fetched. */
  tourBusy() {
    return Object.keys(this._s.loading).length > 0 || !this._s.info;
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
      case "issues":
        if (force || (!s.issues && !s.loading.issues)) this._load("issues", "issues", { refresh: force });
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
      case "tour":
        this._startTour();
        break;
      case "theme":
        this._setTheme(this._theme === "dark" ? "light" : "dark");
        break;
      case "lang":
        this._setLang(this._lang === "ru" ? "en" : "ru");
        break;
      case "category":
        s.lts.category = s.lts.category === value ? null : value;
        s.lts.limit = 0;
        this._renderContent();
        break;
      case "age":
        s.lts.age = s.lts.age === value ? null : value;
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
      case "iss-code":
        s.iss.code = s.iss.code === value ? null : value;
        s.iss.limit = 0;
        this._renderContent();
        break;
      case "iss-important":
        s.iss.important = !s.iss.important;
        s.iss.limit = 0;
        this._renderContent();
        break;
      case "iss-source":
        s.iss.source = value;
        s.iss.limit = 0;
        this._renderContent();
        break;
      case "more-iss":
        s.iss.limit += this._topN();
        this._renderContent();
        break;
      case "nav":
        history.pushState(null, "", value);
        window.dispatchEvent(new CustomEvent("location-changed"));
        break;
      case "more-info":
        this.dispatchEvent(
          new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: value } })
        );
        break;
      case "to-cand":
        s.cand.focus = value;
        s.cand.selected.add(value);
        s.tab = "candidates";
        this._render();
        this._ensureTab();
        break;
      case "cand-unfocus":
        s.cand.focus = null;
        s.cand.limit = 0;
        this._renderContent();
        break;
      case "verdict":
        s.cand.focus = null;
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
    if (field !== "lts-search" && field !== "cand-search" && field !== "iss-search") return;
    const target = field === "lts-search" ? this._s.lts : field === "iss-search" ? this._s.iss : this._s.cand;
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
    const units = ["B", "KB", "MB", "GB", "TB"];
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
    const tabs = ["overview", "candidates", "issues", "statistics", "states", "health", "maintenance"];
    const running = !!s.jobs?.current;
    const dbPath = s.info?.db_path ? ` · ${esc(s.info.db_path)}` : "";
    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <div class="toolbar">
        ${this._narrow ? `<button class="icon" data-action="menu" title="Menu">${ic("menu")}</button>` : ""}
        <div class="title">${this.t("title")}<span class="sub">v${VERSION}${dbPath}</span></div>
        <span class="prefs" data-tour="prefs">
          <button class="icon txt" data-action="lang" title="${this.t("lang_switch")}: ${this._lang === "ru" ? "English" : "Русский"}">${ic(
      "translate"
    )}<span>${this._lang === "ru" ? "RU" : "EN"}</span></button>
          <button class="icon" data-action="theme" title="${this.t(this._theme === "dark" ? "theme_to_light" : "theme_to_dark")}">${ic(
      this._theme === "dark" ? "sun" : "moon"
    )}</button>
        </span>
        <button class="icon ${this._tourSeen() ? "" : "attn"}" data-action="tour" data-tour="help" title="${this.t("tour")}">${ic("help")}</button>
        <button class="icon" data-action="refresh" data-tour="refresh" title="${this.t("refresh")}">${ic("refresh")}</button>
      </div>
      <nav class="tabs" data-tour="tabs">
        ${tabs
          .map(
            (tab) =>
              `<button class="tab ${s.tab === tab ? "active" : ""}" data-action="tab" data-value="${tab}">${ic(tab)}<span>${this.t(
                `tab_${tab}`
              )}</span>${this._tabBadge(tab, running)}</button>`
          )
          .join("")}
      </nav>
      <main id="content"></main>`;
    this._renderContent();
  }

  _tabBadge(tab, running) {
    if (tab === "maintenance" && running) return '<span class="pulse"></span>';
    if (tab === "issues" && this._s.issues?.total) return `<span class="count-badge">${this.n(this._s.issues.total)}</span>`;
    return "";
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
        issues: () => this._issues(),
        statistics: () => this._statistics(),
        states: () => this._states(),
        health: () => this._health(),
        maintenance: () => this._maintenance(),
      }[s.tab]();
    const notice = s.notice
      ? `<div class="card notice"><span>${esc(s.notice)}</span><button class="icon small" data-action="dismiss-notice" title="${this.t("close")}">${ic("close")}</button></div>`
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
    return `<div class="card error">${ic("error")} ${this.t("error")}: ${esc(msg)}</div>`;
  }

  _meta(res) {
    if (!res) return "";
    const parts = [];
    if (res.age_s != null) parts.push(`${this.t("computed")} ${this.dur(res.age_s)} ${this.t("ago")}`);
    if (res.took_ms != null) parts.push(`${this.t("took")} ${this.n(Math.round(res.took_ms))} ms`);
    return `<span class="muted small">${parts.join(" · ")}</span>`;
  }

  /** KPI card; `visual` is a badge() or ring() shown left of the number. */
  _kpi(label, value, sub = "", visual = "") {
    return `<div class="card kpi"><div class="kpi-main">${visual}<div><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div></div></div>${
      sub ? `<div class="kpi-sub">${sub}</div>` : ""
    }</div>`;
  }

  /** Clickable filter tile: icon badge + big number + a thin share bar. */
  _tile({ action, value = "", selected, empty, title = "", icon, color, label, count, sub = "", share = null }) {
    return `<button class="card cat ${selected ? "selected" : ""} ${empty ? "empty" : ""}" style="--c:${color}"
        data-action="${action}" data-value="${esc(value)}" title="${esc(title)}">
      <div class="cat-top">${badge(icon, color)}<div class="cat-value">${count}</div></div>
      <div class="cat-head">${label}</div>
      <div class="kpi-sub">${sub}</div>
      ${share != null ? `<div class="mini"><span style="width:${Math.max(0, Math.min(100, share)).toFixed(1)}%"></span></div>` : ""}
    </button>`;
  }

  // ---------------------------------------------------------------- overview
  _nextSteps(o, groups, totalBytes) {
    const items = [];
    const biggest = groups
      .filter((x) => ["lts", "states", "events"].includes(x.key) && x.bytes)
      .sort((a, b) => b.bytes - a.bytes)[0];
    if (biggest && totalBytes) {
      const go = {
        lts: { tab: "candidates", icon: "candidates", sub: "next_cand_sub" },
        states: { tab: "states", icon: "states", sub: "next_states_sub" },
        events: { tab: "states", icon: "calendar", sub: "next_states_sub" },
      }[biggest.key];
      items.push({
        tab: go.tab,
        icon: go.icon,
        color: GROUP_COLOR[biggest.key],
        title: this.t("next_biggest", { name: this.t(biggest.key), pct: this.pct(biggest.bytes, totalBytes, 0) }),
        sub: this.t(go.sub),
      });
    }
    const disk = o.file.disk;
    if (disk && o.file.size && disk.free < (o.file.size + (o.file.wal_size || 0)) * 1.2)
      items.push({ tab: "maintenance", icon: "disk", color: BAD_COLOR, title: this.t("next_disk_low"), sub: this.t("next_disk_low_sub") });
    const sq = o.sqlite || {};
    if (sq.page_count && sq.freelist_count / sq.page_count >= 0.1)
      items.push({
        tab: "maintenance",
        icon: "vacuum",
        color: WARN_COLOR,
        title: this.t("next_free_pages", { pct: this.pct(sq.freelist_count, sq.page_count, 0) }),
        sub: this.t("next_free_pages_sub"),
      });
    items.push({ tab: "issues", icon: "issues", color: WARN_COLOR, title: this.t("next_issues"), sub: this.t("next_issues_sub") });
    items.push({ tab: "maintenance", icon: "backup", color: OK_COLOR, title: this.t("next_backup"), sub: this.t("next_backup_sub") });
    return items
      .slice(0, 4)
      .map(
        (n) => `<button class="next-item" data-action="tab" data-value="${n.tab}">${badge(n.icon, n.color)}
          <span class="next-t"><b>${n.title}</b><span class="muted small">${n.sub}</span></span><span class="next-go">${ic("arrow")}</span></button>`
      )
      .join("");
  }

  _flow(groups, totalBytes, rec) {
    const g = Object.fromEntries(groups.map((x) => [x.key, x]));
    const keep = rec.keep_days;
    const rows = [
      { key: "states", tab: "states", auto: true },
      { key: "short_term", tab: null, auto: true },
      { key: "events", tab: "states", auto: true },
      { key: "lts", tab: "candidates", auto: false },
    ]
      .filter((r) => g[r.key])
      .map((r) => {
        const gr = g[r.key];
        const color = GROUP_COLOR[r.key];
        const share = totalBytes && gr.bytes ? (100 * gr.bytes) / totalBytes : 0;
        const body = `${badge(GROUP_ICON[r.key], color)}<div class="grow"><b>${this.t(r.key)}</b><span class="sub">${
          gr.bytes != null ? `${this.size(gr.bytes)} · ${this.pct(gr.bytes, totalBytes, 0)}` : `${this.n(gr.rows)} ${this.t("rows").toLowerCase()}`
        }</span><div class="mini" style="--c:${color}"><span style="width:${share.toFixed(1)}%"></span></div></div>`;
        const node = r.tab
          ? `<button class="fnode main" style="--c:${color}" data-action="tab" data-value="${r.tab}" title="${esc(this.t(`tab_${r.tab}`))}">${body}</button>`
          : `<div class="fnode main" style="--c:${color}">${body}</div>`;
        const label = r.auto ? (keep != null ? this.t("flow_kept", { d: keep }) : "") : this.t("flow_forever");
        const end = r.auto
          ? `<div class="fnode end">${badge("trash_can", OFF_COLOR)}<div class="grow"><b>${this.t("flow_auto")}</b></div></div>`
          : `<button class="fnode end" style="--c:${ACCENT}" data-action="tab" data-value="candidates">${badge("candidates", ACCENT)}<div class="grow"><b>${this.t(
              "flow_manual"
            )}</b><span class="sub">${this.t("tab_candidates")}</span></div></button>`;
        return `<div class="flow-row">${node}<div class="farrow">${ic("arrow")}<span>${label}</span></div>${end}</div>`;
      })
      .join("");
    return `<div class="flow">
      <div class="flow-in">
        <div class="fnode" style="--c:${ACCENT}">${badge("sensor", ACCENT)}<b>${this.t("flow_sensors")}</b></div>
        <div class="flow-arrow">${ic("arrow")}</div>
        <div class="fnode" style="--c:${GROUP_COLOR.events}">${badge("recorder", GROUP_COLOR.events)}<div class="grow"><b>${this.t(
      "recorder"
    )}</b><span class="sub">${keep != null ? this.t("flow_kept", { d: keep }) : "—"}</span></div></div>
      </div>
      <div class="flow-arrow">${ic("arrow")}</div>
      <div class="flow-rows">${rows}</div></div>`;
  }

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
    const disk = o.file.disk;
    const freePct = disk ? (100 * disk.free) / disk.total : null;
    const diskColor = freePct == null ? OFF_COLOR : freePct < 10 ? BAD_COLOR : freePct < 25 ? WARN_COLOR : OK_COLOR;

    const kpis = [
      this._kpi(this.t("db_size"), this.size(o.file.size), `${this.t("wal")}: ${this.size(o.file.wal_size)}`, badge("database", ACCENT)),
      this._kpi(
        this.t("disk_free"),
        this.size(disk?.free),
        disk ? `${this.pct(disk.free, disk.total, 0)} ${this.t("of")} ${this.size(disk.total)}` : "",
        disk ? ring(freePct, diskColor, `${Math.round(freePct)}%`) : badge("disk", OFF_COLOR)
      ),
      this._kpi(
        this.t("lts"),
        g.lts?.bytes != null ? this.pct(g.lts.bytes, totalBytes, 0) : this.n(tableRows("statistics")),
        `${this.n(tableRows("statistics"))} ${this.t("rows").toLowerCase()} · ${this.t(
          "data_since"
        ).toLowerCase()} ${this.date(o.ranges?.statistics?.min)}`,
        badge(GROUP_ICON.lts, GROUP_COLOR.lts)
      ),
      this._kpi(
        this.t("states"),
        g.states?.bytes != null ? this.pct(g.states.bytes, totalBytes, 0) : this.n(tableRows("states")),
        `${this.n(tableRows("states"))} ${this.t("rows").toLowerCase()} · ${
          statesDays != null ? this.dur(statesDays * 86400) : "—"
        }`,
        badge(GROUP_ICON.states, GROUP_COLOR.states)
      ),
      this._kpi(
        `${this.t("recorder")} · ${this.t("keep_days")}`,
        `${rec.keep_days ?? "—"} <span class="unit">${this.t("d")}</span>`,
        `${this.t("commit_interval")} ${rec.commit_interval ?? "—"} ${this.t("sec")} · ${this.t("filter")}: ${
          rec.filter_active ? this.t("yes") : this.t("no")
        }`,
        badge("recorder", GROUP_COLOR.events)
      ),
      this._kpi(
        this.t("schema"),
        o.schema_version ?? "—",
        `SQLite ${esc(o.sqlite.version)} · ${esc(o.sqlite.journal_mode || "")}`,
        badge("schema", GROUP_COLOR.meta)
      ),
    ].join("");

    // where the space goes: donut + legend rows
    const segs = groups
      .filter((x) => x.bytes)
      .map((x) => ({
        label: this.t(x.key),
        value: x.bytes,
        text: `${this.size(x.bytes)} · ${this.pct(x.bytes, totalBytes)}`,
        color: GROUP_COLOR[x.key],
      }));
    const legend = groups
      .map(
        (x) => `<div class="lg-row">${badge(GROUP_ICON[x.key] || "database", GROUP_COLOR[x.key], "sm")}<span>${this.t(x.key)}</span>
          <b>${x.bytes != null ? this.size(x.bytes) : "—"}</b><span class="muted num">${x.bytes != null ? this.pct(x.bytes, totalBytes, 0) : ""}</span></div>`
      )
      .join("");
    const space = totalBytes
      ? `<div class="space">${donut(segs, { center: this.size(totalBytes), sub: this.t("total") })}<div class="legend-list">${legend}</div></div>`
      : `<div class="muted">${this.t("no_dbstat")}</div>`;

    // how old is the data in every table group
    const rangeKey = { states: "states", statistics: "lts", statistics_short_term: "short_term", events: "events" };
    const rr = Object.entries(o.ranges || {})
      .filter(([, r]) => r.min != null && r.max != null)
      .map(([k, r]) => ({
        label: this.t(rangeKey[k] || "other"),
        icon: GROUP_ICON[rangeKey[k]] || "database",
        from: r.min,
        to: r.max,
        color: GROUP_COLOR[rangeKey[k]] || OFF_COLOR,
        sub: `${this.date(r.min, true)} → ${this.date(r.max, true)} · ${this.dur(r.max - r.min)}`,
      }));
    const since = timeline(rr, Math.min(...rr.map((r) => r.from)), Math.max(...rr.map((r) => r.to)), (v) => this.date(v));

    const maxTable = Math.max(1, ...o.tables.map((t) => (t.bytes || 0) + (t.index_bytes || 0)));
    const tableHtml = o.tables
      .map((t) => {
        const total = (t.bytes || 0) + (t.index_bytes || 0);
        return `<tr><td><span class="lg-i"><span class="lg-ic" style="--c:${GROUP_COLOR[t.group]}">${ic(GROUP_ICON[t.group] || "database")}</span>${esc(t.name)}</span></td>
          <td class="num">${this.n(t.rows)}</td>
          <td class="num hide-narrow">${this.mib(t.bytes)}</td>
          <td class="num hide-narrow">${this.mib(t.index_bytes)}</td>
          <td class="num">${o.dbstat ? this.mib(total) : "—"}</td>
          <td class="num barcell"><div class="bar"><span style="width:${((100 * total) / maxTable).toFixed(1)}%;background:${
            GROUP_COLOR[t.group]
          }"></span></div>${o.dbstat ? this.pct(total, totalBytes) : "—"}</td></tr>`;
      })
      .join("");

    const mib = this.t("mib");
    return `
      <div class="kpis" data-tour="overview-kpis">${kpis}</div>
      <div class="card" data-tour="overview-next"><h2>${ic("rocket")}${this.t("next_title")}</h2><div class="nexts">${this._nextSteps(
      o,
      groups,
      totalBytes
    )}</div></div>
      <div class="card" data-tour="overview-space"><div class="card-head"><h2>${ic("chart")}${this.t("space")}</h2>${this._meta(o)}</div>${space}</div>
      <div class="card" data-tour="overview-flow"><h2>${ic("journey")}${this.t("flow_title")}</h2>${this._flow(groups, totalBytes, rec)}</div>
      <div class="card" data-tour="overview-since"><h2>${ic("calendar")}${this.t("data_since")}</h2>${since}</div>
      <div class="card" data-tour="overview-tables"><h2>${ic("table")}${this.t("tables")}</h2>
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
    if (f.focus) return res.items.filter((i) => i.statistic_id === f.focus);
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
      .map(([k, n]) => `<span class="ref">${ic(REF_ICON[k] || "link")}${n > 1 ? n : ""}</span>`)
      .join("");
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
    const srcKeys = ["energy", "dashboards", "automations", "scripts", "scenes", "groups", "persons", "helpers", "yaml_files"];
    const coverage = srcKeys
      .map((k) => {
        const v = src[k];
        return `<span class="src ${v == null ? "off" : ""}">${ic(k === "yaml_files" ? "yaml" : k)}${this.t(`src_${k}`)}${
          v == null
            ? ` <span class="muted">(${this.t("not_scanned")})</span>`
            : ` <b>${this.n(v)}</b> <span class="ok">${ic("check")}</span>`
        }</span>`;
      })
      .join("");
    const errors = (src.errors || []).length
      ? note("warning", `${this.t("scan_errors")}: ${esc(src.errors.join("; "))}`, "warn")
      : "";

    // verdict cards
    const verdicts = Object.fromEntries(res.cleanup.verdicts.map((v) => [v.key, v]));
    const vTotalBytes = VERDICT_ORDER.reduce((a, k) => a + (verdicts[k]?.bytes || 0), 0);
    const cards = VERDICT_ORDER.map((k) => {
      const v = verdicts[k] || { count: 0, rows: 0, bytes: 0 };
      return this._tile({
        action: "verdict",
        value: k,
        selected: f.verdict === k,
        empty: !v.count,
        title: this.t(`v_hint_${k}`),
        icon: k,
        color: VERDICT_COLOR[k],
        label: this.t(`v_${k}`),
        count: this.n(v.count),
        sub: `${this.n(v.rows)} · ≈ ${this.size(v.bytes)}`,
        share: vTotalBytes ? (100 * (v.bytes || 0)) / vTotalBytes : 0,
      });
    }).join("");
    const safe = verdicts.safe || { count: 0, rows: 0, bytes: 0 };
    const summary = `<div class="card" data-tour="cand-summary"><h2>${ic("chart")}${this.t("sum_title")}</h2>
      <div class="sum-big">${badge("safe", VERDICT_COLOR.safe, "lg")}<div><div class="kpi-label">${this.t("sum_free")}</div>
        <div class="kpi-value">≈ ${this.size(safe.bytes)}</div>
        <div class="kpi-sub">${this.n(safe.count)} ${this.t("statistics_n").toLowerCase()} · ${this.pct(safe.bytes, vTotalBytes, 0)}</div></div></div>
      ${stackbar(
        VERDICT_ORDER.map((k) => ({
          label: this.t(`v_${k}`),
          text: `${this.n(verdicts[k]?.count || 0)} · ${this.size(verdicts[k]?.bytes || 0)}`,
          value: verdicts[k]?.bytes || 0,
          color: VERDICT_COLOR[k],
          icon: k,
        }))
      )}</div>`;

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
          `<button class="pill ${f.reason === r ? "active" : ""}" data-action="reason" data-value="${r}">${ic(
            REASON_ICON[r] || "info"
          )}${this.t(`r_${r}`)} <span class="muted">${this.n(a.count)} · ${this.size(a.rows * rb)}</span></button>`
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

    const none = f.selected.size ? "" : "disabled";
    const selectionBar = selectable
      ? `<div class="selbar" data-tour="cand-selbar">
          <span class="lg-i">${badge("select", ACCENT, "sm")}<b>${this.t("selected")}: ${this.n(f.selected.size)}</b> <span class="muted">· ≈ ${this.size(
          selRows * rb
        )}</span></span>
          <button class="btn small" data-action="select-shown">${ic("select")}${this.t("select_shown")}</button>
          <button class="btn small" data-action="clear-selection" ${none}>${ic("clear")}${this.t("clear_selection")}</button>
          <button class="btn small" data-action="copy-list" ${none}>${ic("copy")}${this.t("copy_list")}</button>
          <button class="btn small" data-action="toggle-yaml" ${none}>${ic("yaml")}${this.t("exclude_yaml")}</button>
          <button class="btn small danger" data-action="open-delete" data-tour="cand-delete" ${
            f.selected.size && !s.jobs?.current ? "" : "disabled"
          }>${ic("delete")}${this.t("delete_selected")}</button>
          <span class="toast">${esc(f.toast)}</span>
        </div>`
      : "";

    let yaml = "";
    if (f.yaml && f.selected.size) {
      const y = this._excludeYaml();
      yaml = y.ids.length
        ? `<div class="yaml"><div class="muted small">${this.t("yaml_note")}</div>
            <pre>${esc(y.text)}</pre><button class="btn small" data-action="copy-yaml">${ic("copy")}${this.t("copy_list")} (YAML)</button></div>`
        : note("info", this.t("yaml_empty"));
    }

    return `
      ${summary}
      <div class="cats" data-tour="cand-verdicts">${cards}</div>
      <div class="card" data-tour="cand-coverage"><h2>${ic("search")}${this.t("coverage")}</h2><div class="sources">${coverage}</div>
        ${note("info", this.t("not_checked"))}${errors}</div>
      <div class="card">
        ${
          f.focus
            ? `<div class="note ico">${ic("search")}<span>${this.t("cand_focus")} <b>${esc(f.focus)}</b> <button class="btn small" data-action="cand-unfocus">${this.t(
                "cand_unfocus"
              )}</button></span></div>`
            : note(f.verdict, this.t(`v_hint_${f.verdict}`))
        }
        ${reasonChips ? `<div class="controls" data-tour="cand-reasons">${reasonChips}</div>` : ""}
        <div class="controls" data-tour="cand-search">
          <input type="search" data-field="cand-search" placeholder="${this.t("search")}" value="${esc(f.search)}">
          <span class="muted small grow">${this.t("statistics_n")}: ${this.n(items.length)} · ${this.t("rows")}: ${this.n(
      shownRows
    )} · ≈ ${this.size(shownRows * rb)}</span>${this._meta(res)}
        </div>
        ${selectionBar}${yaml}
        <div class="table-wrap" data-tour="cand-table"><table>
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

  /** The steps of a job as a stepper; `current` marks the running one (done before it, pending after). */
  _flowSteps(kind, { repack = true, current = null, compact = false } = {}) {
    const defs = {
      preflight: ["shield_ok", "sf_preflight"],
      backup: ["backup", "sf_backup"],
      delete: ["delete", "sf_delete"],
      repack: ["vacuum", "sf_repack"],
      restore: ["restore", "sf_restore"],
    };
    const order =
      {
        delete: ["preflight", "backup", "delete", ...(repack ? ["repack"] : [])],
        repack: ["preflight", "backup", "repack"],
        backup: ["preflight", "backup"],
        restore: ["restore"],
      }[kind] || ["preflight", "backup", "delete", "repack"];
    const at = current ? order.indexOf(current) : -1;
    return order.map((k, i) => ({
      icon: defs[k][0],
      label: this.t(`step_${k}`),
      sub: compact ? "" : this.t(defs[k][1]),
      state: at < 0 ? "pending" : i < at ? "done" : i === at ? "active" : "pending",
    }));
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
        return `<li><span class="${c.ok ? "ok" : "bad"}">${ic(c.ok ? "check" : "fail")}</span><span>${this.t(`pf_${c.key}`)}${extra}</span></li>`;
      })
      .join("")}</ul>${
      pre.fresh_backup
        ? `<div class="muted small tipline">${ic("backup")}<span>${this.t("fresh_backup")}: ${esc(pre.fresh_backup)}</span></div>`
        : ""
    }`;
  }

  _dialog() {
    const d = this._s.dialog;
    const hours = this._s.maintenance?.settings?.max_age_hours ?? 24;
    let body = "";
    if (d.kind === "delete") {
      const byId = new Map((this._s.statistics?.items || []).map((i) => [i.statistic_id, i]));
      const items = d.ids.map((sid) => byId.get(sid)).filter(Boolean);
      const rows = items.reduce((a, i) => a + i.rows, 0);
      const rb = this._s.statistics?.row_bytes || 78;
      const live = items.filter((i) => i.source === "recorder" && LIVE_CATEGORIES.has(i.category)).length;
      body = `
        <div class="dlg-head">${badge("delete", BAD_COLOR, "lg")}<div><h2>${this.t("dlg_delete_title")}</h2>
          <b>${this.t("dlg_summary", { n: this.n(d.ids.length), rows: this.n(rows), size: this.size(rows * rb) })}</b></div></div>
        ${live ? `<p class="warn-text tipline">${ic("warning")}<span>${this.t("dlg_live_warn", { n: this.n(live) })}</span></p>` : ""}
        <p class="muted tipline">${ic("backup")}<span>${this.t("dlg_backup", { h: this.n(hours) })}</span></p>
        <label class="check-line"><input type="checkbox" data-field="dlg-repack" ${d.repack ? "checked" : ""}>
          ${this.t("dlg_repack")}</label>
        <div class="muted small">${this.t("dlg_repack_note")}</div>`;
    } else {
      body = `<div class="dlg-head">${badge("vacuum", ACCENT, "lg")}<h2>${this.t("repack_title")}</h2></div>
        <p class="muted">${this.t("repack_text")}</p>
        <p class="muted tipline">${ic("backup")}<span>${this.t("dlg_backup", { h: this.n(hours) })}</span></p>`;
    }
    return `<div class="overlay"><div class="dialog card" role="dialog" aria-modal="true">
      ${body}
      ${stepper(this._flowSteps(d.kind, { repack: d.repack }))}
      <h3>${this.t("preflight")}</h3>${this._checks(d.pre)}
      ${d.error ? `<div class="error tipline">${ic("error")}<span>${esc(d.error)}</span></div>` : ""}
      <label class="confirm"><span>${this.t("dlg_type", { word: `<b>${esc(this._confirmWord())}</b>` })}</span>
        <input type="text" data-field="confirm-text" value="${esc(d.text)}" autocomplete="off" spellcheck="false"></label>
      <div class="dialog-actions">
        <button class="btn" data-action="dlg-close">${ic("close")}${this.t("cancel")}</button>
        <button class="btn danger solid" data-action="dlg-start" ${this._dialogReady() ? "" : "disabled"}>${ic("play")}${this.t(
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
      <div class="card-head"><h2>${ic("sand")}${this.t("job_running")}: ${this.t(`kind_${job.kind}`)}</h2>
        <button class="btn small" data-action="cancel-job">${ic("cancel")}${this.t("cancel_job")}</button></div>
      ${stepper(this._flowSteps(job.kind, { current: job.step, compact: true }))}
      <div style="margin-top:10px">${job.step ? this.t(`step_${job.step}`) : this.t(`st_${job.status}`)}${
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
    const freeRatio = m.db.free_pages_ratio;

    // how a deletion stays safe: the same steps the dialog and the running job show
    const flow = `<div class="card" data-tour="maint-flow"><h2>${ic("shield_ok")}${this.t("sf_title")}</h2>${stepper(
      this._flowSteps("delete")
    )}<div class="undo-line">${stepper([
      { icon: "restore", label: this.t("step_restore"), sub: this.t("sf_restore"), state: "alt", color: OK_COLOR },
    ])}</div></div>`;

    const actions = `<div class="card" data-tour="maint-actions"><h2>${ic("maintenance")}${this.t("actions")}</h2>
      <div class="action-row">
        <button class="tile-btn" style="--c:${OK_COLOR}" data-action="backup-now" ${busy ? "disabled" : ""}>${badge("backup", OK_COLOR, "lg")}
          <span><b>${this.t("make_backup")}</b><span class="muted small">${this.t("act_backup_hint")}</span></span></button>
        <button class="tile-btn" style="--c:${ACCENT}" data-action="open-repack" ${busy ? "disabled" : ""}>${badge("vacuum", ACCENT, "lg")}
          <span><b>${this.t("repack_now")}</b><span class="muted small">${this.t("act_repack_hint")}</span></span></button>
      </div>
      ${
        freeRatio != null
          ? `<div class="rings"><div class="ring-item">${ring(
              100 * freeRatio,
              freeRatio >= 0.1 ? WARN_COLOR : OK_COLOR,
              `${Math.round(100 * freeRatio)}%`
            )}<span>${this.t("free_pages")}</span></div></div>`
          : ""
      }
      <div class="rows">
        <div><span class="rl">${ic("database")}${this.t("db_size")}</span><b>${this.size(m.db.size)}${m.db.wal_size ? ` + WAL ${this.size(m.db.wal_size)}` : ""}</b></div>
        <div><span class="rl">${ic("free")}${this.t("free_pages")}</span><b>${this.pct(m.db.free_pages_ratio, 1)}</b></div>
        <div><span class="rl">${ic("disk")}${this.t("disk_free")}</span><b>${this.size(m.db.free_db_dir)}</b></div>
        <div><span class="rl">${ic("folder")}${this.t("folder")}</span><b class="path">${esc(m.settings.backup_dir)}</b></div>
        <div><span class="rl">${ic("backup")}${this.t("fresh_backup")}</span><b>${m.fresh_backup ? esc(m.fresh_backup) : this.t("none")}</b></div>
      </div>
      <div class="muted small tipline">${ic("cog")}<span>${this.t("settings_hint")}</span></div></div>`;

    const backups = m.backups.length
      ? `<div class="table-wrap"><table><tbody>${m.backups
          .map(
            (b) => `<tr><td class="name"><div class="eid">${esc(b.name)}</div>
            <div class="muted small">${this.date(b.created_ts, true)} · ${this.size(b.size)} · ${
              b.verified ? `<span class="ok-text">${ic("verified")}${this.t("verified")}</span>` : ic("warning")
            } · schema ${esc(b.schema_version)}</div></td>
            <td class="num"><button class="btn small" data-action="delete-backup" data-value="${esc(b.name)}" ${
              busy ? "disabled" : ""
            }>${ic("delete")}${this.t("delete")}</button></td></tr>`
          )
          .join("")}</tbody></table></div>`
      : `<div class="muted">${this.t("no_backups")}</div>`;

    const archives = m.archives.length
      ? `<div class="table-wrap"><table><tbody>${m.archives
          .map(
            (a) => `<tr><td class="name"><div class="eid">${esc(a.name)}</div>
            <div class="muted small">${this.date(a.created_ts, true)} · ${this.t("statistics_n")}: ${this.n(
              a.statistics.length
            )} · ${this.t("rows")}: ${this.n(a.rows)}${a.complete ? "" : ` · ${ic("warning")} ${this.t("incomplete")}`}</div></td>
            <td class="num"><button class="btn small" data-action="restore-archive" data-value="${esc(a.name)}" ${
              busy || !a.statistics.length ? "disabled" : ""
            }>${ic("restore")}${this.t("restore")}</button></td></tr>`
          )
          .join("")}</tbody></table></div>`
      : `<div class="muted">${this.t("no_archives")}</div>`;

    const jobIcon = { done: ["check", OK_COLOR], failed: ["fail", BAD_COLOR], cancelled: ["cancel", OFF_COLOR], interrupted: ["warning", WARN_COLOR] };
    const journal = jobs.history.length
      ? jobs.history
          .map((j) => {
            const dur = j.started && j.finished ? this.dur(j.finished - j.started) : "—";
            const [icon, color] = jobIcon[j.status] || ["sand", ACCENT];
            const r = j.result || {};
            const ba =
              r.size_before > 0 && r.size_after != null
                ? `<div class="ba" title="${this.t("before_after")}: ${this.size(r.size_before)} → ${this.size(r.size_after)}"><span style="width:100%"></span><span class="after" style="width:${Math.min(
                    100,
                    (100 * r.size_after) / r.size_before
                  ).toFixed(1)}%"></span></div>`
                : "";
            return `<div class="jobrow">${badge(icon, color, "sm")}<div class="jb"><div><b>${this.t(`kind_${j.kind}`)}</b>
              <span class="muted small">· ${this.t(`st_${j.status}`)}</span></div>
              <div class="muted small">${this._jobSummary(j)}</div>${ba}</div>
              <div class="small num">${this.date(j.started || j.created, true)}<div class="muted">${dur}</div></div></div>`;
          })
          .join("")
      : `<div class="muted">${this.t("no_jobs")}</div>`;

    return `${busy ? this._currentJob(jobs.current) : ""}
      ${flow}
      <div class="grid2">
        ${actions}
        <div class="card" data-tour="maint-journal"><h2>${ic("journal")}${this.t("journal")}</h2>${journal}</div>
        <div class="card" data-tour="maint-backups"><h2>${ic("backup")}${this.t("backups")}</h2>${backups}${note("info", this.t("restore_full"))}</div>
        <div class="card" data-tour="maint-archives"><h2>${ic("restore")}${this.t("archives")}</h2>${archives}</div>
      </div>`;
  }

  // ---------------------------------------------------------------- statistics (LTS)
  _ageBucket(ts) {
    if (ts == null) return "none";
    const days = (Date.now() / 1000 - ts) / 86400;
    return days <= 1 ? "d1" : days <= 7 ? "d7" : days <= 30 ? "d30" : days <= 365 ? "d365" : "old";
  }

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
    const catBytes = res.categories.reduce((a, c) => a + (c.bytes || 0), 0);
    const catCards = CATEGORY_ORDER.filter((k) => cats[k])
      .map((k) => {
        const c = cats[k];
        return this._tile({
          action: "category",
          value: k,
          selected: f.category === k,
          empty: !c.count,
          title: this.t(`cat_hint_${k}`),
          icon: k,
          color: CATEGORY_COLOR[k],
          label: this.t(`cat_${k}`),
          count: this.n(c.count),
          sub: `${this.n(c.rows)} · ≈ ${this.size(c.bytes)}`,
          share: catBytes ? (100 * (c.bytes || 0)) / catBytes : 0,
        });
      })
      .join("");
    const diag = res.diagnostic;
    const diagCard = this._tile({
      action: "diagnostic",
      selected: f.diagnostic,
      icon: "health",
      color: OFF_COLOR,
      label: this.t("diagnostic"),
      count: this.n(diag.count),
      sub: `${this.n(diag.rows)} · ≈ ${this.size(diag.bytes)}`,
      share: catBytes ? (100 * (diag.bytes || 0)) / catBytes : null,
    });

    // filter
    const q = f.search.trim().toLowerCase();
    const base = res.items.filter(
      (i) =>
        (!f.category || i.category === f.category) &&
        (!f.diagnostic || i.diagnostic) &&
        (!q ||
          [i.statistic_id, i.name, i.device, i.integration, i.area]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)))
    );
    const items = base.filter((i) => !f.age || this._ageBucket(i.last_ts) === f.age);
    const filteredRows = items.reduce((a, i) => a + this._ltsRows(i), 0);

    // when was every statistic last written: fresh = green, old = red; the columns filter the list
    const AGE = [
      ["d1", OK_COLOR],
      ["d7", "#9ccc65"],
      ["d30", "#ffb300"],
      ["d365", "#ff7043"],
      ["old", BAD_COLOR],
      ["none", OFF_COLOR],
    ];
    const ages = new Map(AGE.map(([k]) => [k, { count: 0, rows: 0 }]));
    for (const i of base) {
      const a = ages.get(this._ageBucket(i.last_ts));
      a.count += 1;
      a.rows += this._ltsRows(i);
    }
    const ageChart = columns(
      AGE.filter(([k]) => k !== "none" || ages.get("none").count).map(([k, color]) => {
        const a = ages.get(k);
        return {
          key: k,
          label: this.t(`age_${k}`),
          text: this.n(a.rows),
          sub: `${this.n(a.count)} ${this.t("statistics_n").toLowerCase()}`,
          value: a.rows,
          color,
          active: f.age === k,
          title: `${this.t(`age_${k}`)}: ${this.n(a.count)} / ${this.n(a.rows)} ${this.t("rows").toLowerCase()}`,
        };
      }),
      "age"
    );

    const periods = ["all", ...res.periods.slice().sort((a, b) => Number(b) - Number(a))];
    const controls = `<div class="controls" data-tour="lts-controls">
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
      <div class="cats" data-tour="lts-cats">${catCards}${diagCard}</div>
      <div class="card" data-tour="lts-age"><h2>${ic("calendar")}${this.t("age_title")}</h2>
        ${ageChart}${note("info", this.t("age_hint"))}</div>
      <div class="card">
        ${controls}
        ${note("info", this.t("lts_flat_note"))}
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
        )}">${ic(i.category)}${this.t(`cat_${i.category}`)}</span></td>
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


  // ---------------------------------------------------------------- problems
  _issueDetail(i) {
    const d = i.data || {};
    const parts = [];
    for (const [k, v] of Object.entries(d)) {
      if (k === "statistic_id" || v == null || v === "") continue;
      const shown = /_ts$/.test(k) ? this.date(v, true) : Array.isArray(v) ? v.join(", ") : typeof v === "number" ? this.n(Math.round(v * 1000) / 1000) : v;
      parts.push(`${esc(k)}: <b>${esc(shown)}</b>`);
    }
    return parts.join(" · ");
  }

  _issues() {
    const s = this._s;
    if (s.errors.issues) return this._error(s.errors.issues);
    if (!s.issues) return this._spinner("issues", this.t("issues_wait"));
    const res = s.issues;
    const f = s.iss;
    const q = f.search.trim().toLowerCase();
    const HA_FIXABLE = new Set(["units_changed", "state_class_removed", "mean_type_changed"]);
    const GONE = new Set(["no_state", "entity_no_longer_recorded", "lts_stalled"]);

    const list = res.issues.filter(
      (i) =>
        (!f.important || i.important) &&
        (f.source === "all" || i.source === f.source) &&
        (!f.code || i.code === f.code) &&
        (!q || [i.statistic_id, i.name].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)))
    );
    const limit = this._topN() + f.limit;

    const tiles = res.codes
      .map((c) => {
        const sev = res.issues.find((i) => i.code === c.key)?.severity || "info";
        return this._tile({
          action: "iss-code",
          value: c.key,
          selected: f.code === c.key,
          empty: !c.count,
          title: this.t(`i_fix_${c.key}`),
          icon: sev,
          color: SEV_COLOR[sev],
          label: this.t(`i_${c.key}`),
          count: this.n(c.count),
          sub: c.important ? `${ic("bolt")} ${this.n(c.important)}` : "&nbsp;",
          share: res.total ? (100 * c.count) / res.total : 0,
        });
      })
      .join("");

    const sevCount = { error: 0, warning: 0, info: 0 };
    for (const i of res.issues) sevCount[i.severity] = (sevCount[i.severity] || 0) + 1;
    const sevBar = stackbar(
      ["error", "warning", "info"].map((k) => ({
        label: this.t(`sev_${k}`),
        text: this.n(sevCount[k]),
        value: sevCount[k],
        color: SEV_COLOR[k],
        icon: k,
      }))
    );

    const pill = (action, value, icon, label, active, title = "") =>
      `<button class="pill ${active ? "active" : ""}" data-action="${action}" data-value="${value}" ${
        title ? `title="${esc(title)}"` : ""
      }>${ic(icon)}${label}</button>`;
    const SRC_ICON = { all: "filter", ha: "cog", own: "candidates" };

    const rows = list
      .slice(0, limit)
      .map((i) => {
        const links = [];
        if (HA_FIXABLE.has(i.code))
          links.push(`<button class="btn small" data-action="nav" data-value="/developer-tools/statistics">${ic("chart")}${this.t("act_ha_stats")}</button>`);
        if (i.code !== "no_state" && i.statistic_id.includes("."))
          links.push(`<button class="btn small" data-action="more-info" data-value="${esc(i.statistic_id)}">${ic("open")}${this.t("act_entity")}</button>`);
        if (GONE.has(i.code) && !i.important)
          links.push(`<button class="btn small" data-action="to-cand" data-value="${esc(i.statistic_id)}">${ic("candidates")}${this.t("act_candidates")}</button>`);
        const sub = [i.name && i.name !== i.statistic_id ? esc(i.name) : null].filter(Boolean).join("");
        const tags = [
          `<span class="tag">${this.t(i.source === "ha" ? "src_ha" : "src_own")}</span>`,
          i.in_repairs ? `<span class="tag">${this.t("in_repairs")}</span>` : "",
          i.important ? `<span class="tag" title="${esc(this.t("important_hint"))}">${ic("bolt")}</span>` : "",
        ].join(" ");
        return `<tr>
          <td class="name"><div class="eid">${esc(i.statistic_id)} ${this._refsBadge(i.refs)}</div>
            <div class="muted small">${sub}</div></td>
          <td><div class="lg-i" title="${this.t(`sev_${i.severity}`)}">${badge(i.severity, SEV_COLOR[i.severity] || OFF_COLOR, "sm")}<b>${this.t(
          `i_${i.code}`
        )}</b> ${tags}</div>
            <div class="muted small">${this._issueDetail(i)}</div>
            <div class="muted small tipline hint">${ic("tip")}<span>${this.t(`i_fix_${i.code}`)}</span></div></td>
          <td class="actions">${links.join(" ")}</td>
        </tr>`;
      })
      .join("");

    const errors = (res.sources?.errors || []).length
      ? note("warning", `${this.t("scan_errors")}: ${esc(res.sources.errors.join("; "))}`, "warn")
      : "";
    const body = list.length
      ? `<div class="table-wrap"><table>
          <thead><tr><th>${this.t("g_statistic")}</th><th>${this.t("col_problem")}</th><th></th></tr></thead>
          <tbody>${rows}</tbody></table></div>${this._more(list.length, limit, "more-iss")}`
      : `<div class="note ico">${ic("check")}<span>${this.t("issues_none")}</span></div>`;

    return `
      <div class="card" data-tour="issues-intro">${note("info", this.t("issues_intro"))}
        <div class="sum-big">${badge("issues", res.total ? WARN_COLOR : OK_COLOR, "lg")}<div>
          <div class="kpi-value">${this.n(res.total)}</div>
          <div class="kpi-sub">${this.t("issues_total")} · ${ic("bolt")} ${this.n(res.important)} ${this.t("issues_important")}</div></div></div>
        ${sevBar}
        <div class="tabsum"><span>${ic("sensor")}${this.n(res.sources?.sensors)} sensors</span><span>${ic("statistics")}${this.n(
      res.sources?.statistics
    )} ${this.t("statistics_n").toLowerCase()}</span></div>${errors}</div>
      ${res.codes.length ? `<div class="cats" data-tour="issues-tiles">${tiles}</div>` : ""}
      <div class="card">
        <div class="controls" data-tour="issues-filters">
          ${pill("iss-important", "1", "bolt", this.t("only_important"), f.important, this.t("important_hint"))}
          ${["all", "ha", "own"].map((v) => pill("iss-source", v, SRC_ICON[v], this.t(`src_${v}`), f.source === v)).join("")}
        </div>
        <div class="controls">
          <input type="search" data-field="iss-search" placeholder="${this.t("search")}" value="${esc(f.search)}">
          <span class="muted small grow">${this.n(list.length)} / ${this.n(res.total)}</span>${this._meta(res)}
        </div>
        ${body}
      </div>`;
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
    const controls = `<div class="controls" data-tour="states-controls">
      <span class="muted lg-i">${ic("clock")}${this.t("window")}</span>${chips}
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
      ? note(
          "sand",
          this.t("truncated", {
            from: this.date(res.data_from, true),
            hours: this.n(Math.round(res.effective_hours)),
          }),
          "warn"
        )
      : "";
    const kpis = `<div class="kpis inline">
      ${this._kpi(this.t("total_rows"), this.n(res.total_rows), "", badge("states", GROUP_COLOR.states))}
      ${this._kpi(this.t("per_hour"), this.n(Math.round(res.total_rows / Math.max(res.effective_hours, 0.01))), "", badge("clock", ACCENT))}
      ${this._kpi(this.t("entities_n"), this.n(res.items.length), "", badge("shape", GROUP_COLOR.events))}
    </div>`;

    let table;
    let top = "";
    if (f.groupBy === "entity") {
      const sorters = {
        rows: (a, b) => b.rows - a.rows,
        distinct: (a, b) => a.distinct_states - b.distinct_states || b.rows - a.rows,
        unavailable: (a, b) => b.unavailable - a.unavailable,
        name: (a, b) => a.entity_id.localeCompare(b.entity_id),
      };
      const sorted = res.items.slice().sort(sorters[f.sort] || sorters.rows);
      top = hbars(
        res.items
          .slice()
          .sort((a, b) => b.rows - a.rows)
          .slice(0, 10)
          .map((i) => ({
            label: i.entity_id,
            value: i.rows,
            text: `${this.n(i.rows)} · ${this.pct(i.rows, res.total_rows, 0)}`,
            color: GROUP_COLOR.states,
          }))
      );
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
      top = hbars(
        sorted.slice(0, 10).map((g) => ({
          label: g.key,
          value: g.rows,
          text: `${this.n(g.rows)} · ${this.pct(g.rows, res.total_rows, 0)}`,
          color: GROUP_COLOR.states,
        }))
      );
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
    return `${banner}${kpis}<div class="chartbox" data-tour="states-top"><h3>${ic("chart")}${this.t("top_writers")}</h3>${top}</div>${table}`;
  }

  _eventsCard(res) {
    if (!res.items.length) return "";
    const rows = res.items.slice(0, this._topN()).map((i) => ({
      label: i.event_type,
      value: i.rows,
      text: `${this.n(i.rows)} · ${this.pct(i.rows, res.total_rows, 0)}`,
      color: GROUP_COLOR.events,
    }));
    return `<div class="card" data-tour="states-events"><h2>${ic("calendar")}${this.t("events_top")}</h2>${hbars(rows)}</div>`;
  }

  // ---------------------------------------------------------------- health
  _health() {
    const s = this._s;
    if (s.errors.health) return this._error(s.errors.health);
    if (!s.health) return this._spinner("health");
    const h = s.health;
    const c = h.current || {};
    const rec = h.recorder || {};
    const status = (ok) => `<span class="status ${ok ? "ok" : "warn"}">${ic(ok ? "check" : "warning")}</span>`;
    const chk = s.check;
    const closed = h.recorder_runs?.closed_incorrect || 0;

    // traffic-light strip: everything important in one glance
    const lampColor = { ok: OK_COLOR, warn: WARN_COLOR, bad: BAD_COLOR, off: OFF_COLOR };
    const lamp = (icon, label, value, state) =>
      `<div class="lamp" style="--c:${lampColor[state]}">${badge(icon, lampColor[state])}<div><div class="lamp-l">${label}</div><div class="lamp-v">${value}</div></div></div>`;
    const fresh = (age, limit) => (age == null ? "off" : age < limit ? "ok" : "warn");
    const strip = `<div class="card" data-tour="health-strip"><h2>${ic("pulse")}${this.t("strip_title")}</h2><div class="lamps">
      ${lamp("recorder", this.t("lamp_recording"), rec.recording ? this.t("yes") : this.t("no"), rec.recording ? "ok" : "bad")}
      ${lamp("queue", this.t("lamp_queue"), this.n(rec.backlog), (rec.backlog || 0) < 100 ? "ok" : "warn")}
      ${lamp("states", this.t("lamp_state"), this.dur(c.states_age_s), fresh(c.states_age_s, 1800))}
      ${lamp("timer", this.t("lamp_short"), this.dur(c.short_term_age_s), fresh(c.short_term_age_s, 900))}
      ${lamp("chart_line", this.t("lamp_lts"), this.dur(c.lts_age_s), fresh(c.lts_age_s, 9000))}
      ${lamp("warning", this.t("lamp_unclean"), closed ? this.n(closed) : this.t("lamp_clean"), closed ? "warn" : "ok")}
      ${lamp(
        chk && !chk.ok ? "shield_bad" : "shield_ok",
        this.t("lamp_integrity"),
        chk ? (chk.ok ? this.t("check_ok") : this.t("check_fail")) : this.t("lamp_not_run"),
        chk ? (chk.ok ? "ok" : "bad") : "off"
      )}
    </div></div>`;

    const s5 = Math.round((c.states_5m || 0) / 5);
    const s60 = Math.round((c.states_60m || 0) / 60);
    const load = `<div class="card"><h2>${ic("speed")}${this.t("write_load")}</h2>
      <div class="muted small">${this.t("states_per_min")}</div>
      ${hbars([
        { label: this.t("last_5m"), value: s5, text: this.n(s5), color: GROUP_COLOR.states },
        { label: this.t("last_60m"), value: s60, text: this.n(s60), color: GROUP_COLOR.states },
      ])}
      <div class="rows"><div><span class="rl">${ic("calendar")}${this.t("events_hour")}</span><b>${this.n(c.events_60m)}</b></div></div>
      <div class="muted small">${this.t("commit_note", { s: this.n(rec.commit_interval) })}</div></div>`;

    const freshCard = `<div class="card"><h2>${ic("clock")}${this.t("freshness")}</h2>
      <div class="rows">
        <div><span class="rl">${ic("states")}${this.t("newest_state")}</span><b>${this.dur(c.states_age_s)} ${status(c.states_age_s != null && c.states_age_s < 1800)}</b></div>
        <div><span class="rl">${ic("timer")}${this.t("newest_short")}</span><b>${this.dur(c.short_term_age_s)} ${status(
      c.short_term_age_s != null && c.short_term_age_s < 900
    )}</b></div>
        <div><span class="rl">${ic("chart_line")}${this.t("newest_lts")}</span><b>${this.dur(c.lts_age_s)} ${status(
      c.lts_age_s != null && c.lts_age_s < 9000
    )}</b></div>
      </div></div>`;

    // recorder runs on a time axis: a gap between bars = HA was down
    const parse = (v) => (v ? Date.parse(v) / 1000 : null);
    const runRows = (h.recorder_runs?.runs || [])
      .map((r) => {
        const from = parse(r.start);
        const to = parse(r.end);
        return {
          label: String(r.start || "").slice(0, 16).replace("T", " "),
          icon: r.closed_incorrect ? "warning" : "check",
          from,
          to,
          color: r.closed_incorrect ? WARN_COLOR : OK_COLOR,
          live: !r.end,
          sub: r.end ? this.dur(to - from) : this.t("running"),
          title: `${r.start || ""} → ${r.end || this.t("running")}`,
        };
      })
      .filter((r) => r.from != null && !Number.isNaN(r.from));
    const runsMin = Math.min(...runRows.map((r) => r.from));
    const runsMax = Math.max(Date.now() / 1000, ...runRows.map((r) => r.to ?? 0));
    const recorder = `<div class="card"><h2>${ic("recorder")}${this.t("recorder")}</h2>
      <div class="rows">
        <div><span class="rl">${ic("queue")}${this.t("queue")}</span><b>${this.n(rec.backlog)}</b></div>
        <div><span class="rl">${ic("recorder")}${this.t("recording")}</span><b>${rec.recording ? this.t("yes") : this.t("no")}</b></div>
        <div><span class="rl">${ic("calendar")}${this.t("keep_days")}</span><b>${this.n(rec.keep_days)}</b></div>
        <div><span class="rl">${ic("timer")}${this.t("commit_interval")}</span><b>${this.n(rec.commit_interval)} ${this.t("sec")}</b></div>
        <div><span class="rl">${ic("warning")}${this.t("unclean_runs")}</span><b>${this.n(h.recorder_runs?.closed_incorrect)}</b></div>
      </div>
      <h3>${this.t("runs")}</h3>${timeline(runRows, runsMin, runsMax, (v) => this.date(v))}</div>`;

    const disk = h.file.disk;
    const diskFree = disk ? (100 * disk.free) / disk.total : null;
    const fp = h.free_pages_pct;
    const file = `<div class="card"><h2>${ic("database")}${this.t("file")}</h2>
      <div class="rings">
        ${
          diskFree != null
            ? `<div class="ring-item">${ring(diskFree, diskFree < 10 ? BAD_COLOR : diskFree < 25 ? WARN_COLOR : OK_COLOR, `${Math.round(diskFree)}%`)}<span>${this.t(
                "disk_free"
              )}</span></div>`
            : ""
        }
        ${
          fp != null
            ? `<div class="ring-item">${ring(fp, fp >= 10 ? WARN_COLOR : OK_COLOR, `${Math.round(fp)}%`)}<span>${this.t("free_pages")}</span></div>`
            : ""
        }
      </div>
      <div class="rows">
        <div><span class="rl">${ic("database")}${this.t("db_size")}</span><b>${this.size(h.file.size)}</b></div>
        <div><span class="rl">${ic("journal")}${this.t("wal")}</span><b>${this.size(h.file.wal_size)}</b></div>
        <div><span class="rl">${ic("disk")}${this.t("disk_free")}</span><b>${this.size(h.file.disk?.free)}</b></div>
        <div><span class="rl">${ic("free")}${this.t("free_pages")}</span><b>${fp != null ? fp + " %" : "—"}</b></div>
        <div><span class="rl">${ic("vacuum")}${this.t("reclaimable")}</span><b>${this.size(h.reclaimable_bytes)}</b></div>
      </div></div>`;

    const hist = h.history || [];
    const probe = `<div class="card"><h2>${ic("pulse")}${this.t("probe")}</h2>
      <div class="rows">
        <div><span class="rl">${ic("play")}${this.t("point")}</span><b>${this.n(c.point_ms)} ms</b></div>
        <div><span class="rl">${ic("chart_line")}${this.t("range")}</span><b>${this.n(c.range_ms)} ms</b></div>
        <div><span class="rl">${ic("clock")}${this.t("fresh")}</span><b>${this.n(c.fresh_ms)} ms</b></div>
      </div>
      ${sparkline(hist.map((p) => p.total_ms))}
      <div class="muted small">${this.t("probe_note")} (${this.n(hist.length)})</div></div>`;

    let checkBody = `<div class="muted small">${this.t("integrity_note")}</div>`;
    if (s.loading.check) checkBody += this._spinner("check");
    else if (s.errors.check) checkBody += this._error(s.errors.check);
    else if (chk)
      checkBody += `<div class="bigcheck">${badge(chk.ok ? "shield_ok" : "shield_bad", chk.ok ? OK_COLOR : BAD_COLOR, "lg")}
        <div><b>${chk.ok ? this.t("check_ok") : this.t("check_fail")}</b>
        <span class="muted small">· ${this.n(Math.round(chk.took_ms))} ms</span></div></div>${
        chk.ok ? "" : `<pre>${esc(JSON.stringify(chk, null, 2))}</pre>`
      }`;
    const integrity = `<div class="card" data-tour="health-integrity"><div class="card-head"><h2>${ic("shield_ok")}${this.t("integrity")}</h2>
      <button class="btn" data-action="check" ${s.loading.check ? "disabled" : ""}>${ic("play")}${this.t("run_check")}</button></div>${checkBody}</div>`;

    return `${strip}<div class="grid2" data-tour="health-grid">${load}${freshCard}${probe}${file}${recorder}${integrity}</div>`;
  }
}

function svg(path, cls = "") {
  return `<svg class="mdi ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg>`;
}

function sparkline(values, unit = "ms") {
  const v = values.filter((x) => x != null);
  if (v.length < 2) return "";
  const w = 300;
  const h = 56;
  const max = Math.max(...v);
  const min = Math.min(...v);
  const span = max - min || 1;
  const pts = v.map((y, i) => [(i / (v.length - 1)) * w, h - 4 - ((y - min) / span) * (h - 10)]);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fmt = (x) => `${Math.round(x * 10) / 10} ${unit}`;
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img">
    <polygon points="0,${h} ${line} ${w},${h}" style="fill:var(--primary-color, #03a9f4);opacity:0.16"/>
    <polyline points="${line}" fill="none" stroke="var(--primary-color, #03a9f4)" stroke-width="2" vector-effect="non-scaling-stroke"/>
  </svg><div class="spark-lab"><span>min ${fmt(min)}</span><span>max ${fmt(max)}</span></div>`;
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
  .prefs { display: inline-flex; align-items: center; gap: 2px; }
  .icon.txt { align-items: center; gap: 6px; padding: 8px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; letter-spacing: 0.04em; }
  .icon.txt .mdi { width: 20px; height: 20px; }
  .icon.attn { color: var(--dc-accent); animation: pulse 1.6s ease-in-out infinite; }
  .tabs { display: flex; gap: 4px; padding: 0 12px; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid var(--dc-border);
    background: var(--primary-background-color, #111); }
  .tab { display: inline-flex; align-items: center; gap: 8px; background: none; border: 0; border-bottom: 2px solid transparent;
    padding: 12px 14px; cursor: pointer; white-space: nowrap; color: var(--dc-muted); }
  .tab:hover { color: var(--primary-text-color); }
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
  /* data bar: the share is painted as a soft fill behind the number */
  .barcell { position: relative; z-index: 0; min-width: 120px; }
  .bar { position: absolute; z-index: -1; left: 2px; right: 2px; top: 4px; bottom: 4px; border-radius: 6px; }
  .bar span { display: block; height: 100%; border-radius: 6px; background: var(--dc-accent); opacity: 0.16; }
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
  .pill { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--dc-border); background: none; border-radius: 16px; padding: 4px 12px; cursor: pointer; font-size: 13px; }
  .pill.active { border-color: var(--dc-accent); color: var(--dc-accent); background: color-mix(in srgb, var(--dc-accent) 12%, transparent); }
  .btn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--dc-accent); color: var(--dc-accent); background: none; border-radius: 18px; padding: 6px 16px; cursor: pointer; font-size: 14px; }
  .btn:disabled { opacity: 0.5; cursor: default; }
  .foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; }
  .note { font-size: 13px; color: var(--dc-muted); margin: 4px 0 12px; }
  .note.warn { color: var(--warning-color, #ffa600); }
  .rows > div { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px solid var(--dc-border); font-size: 14px; }
  .rows > div:last-child { border-bottom: 0; }
  .rows b { font-weight: 500; font-variant-numeric: tabular-nums; text-align: right; }
  .status { font-size: 12px; font-weight: 400; margin-left: 6px; }
  .status.warn { color: var(--warning-color, #ffa600); }
  .spark { width: 100%; height: 56px; margin: 8px 0 2px; }
  .status.ok { color: var(--success-color, #43a047); }
  .status .mdi { width: 16px; height: 16px; vertical-align: -3px; }
  .ok-text { color: var(--success-color, #43a047); display: inline-flex; align-items: center; gap: 4px; }
  .chip .mdi { width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px; }
  .tag .mdi { width: 12px; height: 12px; vertical-align: -2px; }
  .dlg-head { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
  .dlg-head h2 { margin: 0 0 2px; }
  .dialog .stepper { flex-direction: column; gap: 2px; margin: 14px 0 4px; }
  .dialog .st { flex: 0 0 auto; }
  .dialog .st-arrow { justify-content: center; height: 14px; transform: rotate(90deg); }
  .dialog .st-arrow .mdi { width: 16px; height: 16px; }
  .chartbox { margin: 4px 0 16px; }
  .chartbox h3 { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
  .check { margin-top: 12px; font-size: 15px; }
  pre { font-size: 12px; overflow-x: auto; }
  .loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px 16px; color: var(--dc-muted); }
  .spinner { width: 32px; height: 32px; border: 3px solid rgba(127,127,127,0.25); border-top-color: var(--dc-accent);
    border-radius: 50%; animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .error { color: var(--error-color, #db4437); }
  .sources { display: flex; flex-wrap: wrap; gap: 8px; font-size: 14px; margin-bottom: 12px; }
  .src { display: inline-flex; align-items: center; gap: 6px; padding: 3px 12px 3px 8px; border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--success-color, #43a047) 45%, transparent);
    background: color-mix(in srgb, var(--success-color, #43a047) 8%, transparent); }
  .src.off { color: var(--dc-muted); border-color: var(--dc-border); background: none; }
  .src .ok { color: var(--success-color, #43a047); }
  .tags { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; }
  .actions { white-space: nowrap; text-align: right; }
  .actions .btn { margin-left: 4px; }
  .refs { display: inline-flex; gap: 8px; margin-left: 8px; cursor: help; white-space: nowrap; vertical-align: middle; }
  .ref { display: inline-flex; align-items: center; gap: 2px; color: var(--dc-muted); font-size: 12px; }
  .ref .mdi { width: 16px; height: 16px; vertical-align: 0; }
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
  .checks li { display: flex; align-items: center; gap: 8px; padding: 3px 0; }
  .checks .ok { color: var(--success-color, #43a047); }
  .checks .bad { color: var(--error-color, #db4437); }
  .checks .loading { padding: 12px; }
  .confirm { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; font-size: 14px; }
  .confirm input { font: inherit; color: var(--primary-text-color); background: var(--input-fill-color, rgba(127,127,127,0.12));
    border: 1px solid var(--dc-border); border-radius: 8px; padding: 8px 10px; letter-spacing: 0.08em; }
  .dialog-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
  .notice { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 16px; }
  .icon.small { padding: 4px 8px; font-size: 14px; }
  .icon.small .mdi { width: 18px; height: 18px; }
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
  /* ---- MDI icons and badges ---- */
  .mdi { width: 1.25em; height: 1.25em; flex: none; vertical-align: -0.25em; }
  .icon .mdi { width: 24px; height: 24px; vertical-align: 0; }
  .badge { --c: var(--dc-accent); display: inline-flex; align-items: center; justify-content: center; flex: none;
    width: 38px; height: 38px; border-radius: 50%; color: var(--c); background: color-mix(in srgb, var(--c) 16%, transparent); }
  .badge .mdi { width: 22px; height: 22px; vertical-align: 0; }
  .badge.sm { width: 28px; height: 28px; }
  .badge.sm .mdi { width: 17px; height: 17px; }
  .badge.lg { width: 52px; height: 52px; }
  .badge.lg .mdi { width: 30px; height: 30px; }
  .lg-ic { --c: var(--dc-accent); display: inline-flex; align-items: center; justify-content: center; flex: none;
    width: 22px; height: 22px; border-radius: 50%; color: var(--c); background: color-mix(in srgb, var(--c) 16%, transparent); }
  .lg-ic .mdi { width: 14px; height: 14px; vertical-align: 0; }
  .lg-i { display: inline-flex; align-items: center; gap: 6px; }
  .note.ico { display: flex; align-items: flex-start; gap: 8px; }
  .note.ico .mdi { margin-top: 1px; }
  .note.warn .mdi { color: var(--warning-color, #ffa600); }
  .tab .mdi { width: 20px; height: 20px; vertical-align: 0; }
  .count-badge { font-size: 11px; min-width: 18px; padding: 1px 6px; border-radius: 9px; background: var(--dc-accent); color: #fff; text-align: center; }
  h2 .mdi { vertical-align: -0.3em; margin-right: 4px; color: var(--dc-accent); }
  .btn .mdi { width: 1.15em; height: 1.15em; vertical-align: 0; }
  .tipline { display: flex; align-items: flex-start; gap: 6px; }
  .tipline .mdi { color: var(--dc-muted); width: 1.1em; height: 1.1em; margin-top: 1px; }
  .tipline.hint .mdi, .tipline.warn-text .mdi { color: var(--warning-color, #ffa600); }

  /* ---- KPI, tiles ---- */
  .kpi-main { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
  .kpi-main .kpi-value { margin-top: 0; }
  .ring { width: 52px; height: 52px; flex: none; }
  .ring-t { font-size: 11px; font-weight: 500; text-anchor: middle; dominant-baseline: middle; fill: var(--primary-text-color); }
  .cat { --c: var(--dc-accent); }
  .cat-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .cat-top .cat-value { margin-top: 0; }
  .cat .cat-head { margin-top: 8px; }
  .mini { height: 4px; border-radius: 2px; background: rgba(127,127,127,0.15); margin-top: 8px; overflow: hidden; }
  .mini span { display: block; height: 100%; background: var(--c); }
  .cat.selected { border-color: var(--c); box-shadow: 0 0 0 1px var(--c) inset; }
  .sum-big { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
  .sum-big .kpi-value { margin-top: 0; font-size: 30px; }

  /* ---- donut, legend ---- */
  .space { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 36px; }
  .donut { width: 170px; height: 170px; flex: none; }
  .donut-bg { fill: none; stroke: rgba(127,127,127,0.18); stroke-width: 16; }
  .arc { fill: none; stroke-width: 16; transform: rotate(-90deg); transform-origin: 60px 60px; }
  .donut-c { font-size: 15px; font-weight: 500; text-anchor: middle; dominant-baseline: middle; fill: var(--primary-text-color); }
  .donut-s { font-size: 8px; text-anchor: middle; dominant-baseline: middle; fill: var(--dc-muted); }
  .legend-list { flex: 1; min-width: 260px; display: flex; flex-direction: column; gap: 8px; }
  .lg-row { display: grid; grid-template-columns: 28px 1fr auto 56px; align-items: center; gap: 10px; font-size: 14px; }
  .lg-row .num { min-width: 0; }
  .lg-row b { white-space: nowrap; }

  /* ---- data-flow scheme ---- */
  .flow { display: flex; align-items: stretch; flex-wrap: wrap; gap: 14px 10px; }
  .flow-in { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 2px; }
  .flow-arrow { display: flex; align-items: center; justify-content: center; color: var(--dc-muted); }
  .flow-arrow .mdi { width: 28px; height: 28px; }
  .flow-in .flow-arrow .mdi { transform: rotate(90deg); }
  .flow-rows { flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 10px; border-left: 2px solid var(--dc-border); padding-left: 22px; margin-left: 4px; }
  .flow-row { position: relative; display: flex; align-items: center; flex-wrap: wrap; gap: 8px 10px; }
  .flow-row::before { content: ""; position: absolute; left: -22px; top: 50%; width: 14px; border-top: 2px solid var(--dc-border); }
  .flow-row::after { content: ""; position: absolute; left: -9px; top: calc(50% - 5px); border-left: 7px solid var(--dc-border);
    border-top: 5px solid transparent; border-bottom: 5px solid transparent; }
  .fnode { --c: var(--dc-muted); display: flex; align-items: center; gap: 10px; padding: 8px 12px; text-align: left; font: inherit; color: inherit;
    border: 1px solid var(--dc-border); border-radius: 12px; background: color-mix(in srgb, var(--c) 7%, transparent); min-width: 0; }
  button.fnode { cursor: pointer; }
  button.fnode:hover { border-color: var(--c); }
  .fnode b { display: block; font-weight: 500; }
  .fnode .sub { display: block; font-size: 12px; color: var(--dc-muted); }
  .fnode.main { flex: 1 1 230px; }
  .fnode.end { flex: 1 1 190px; }
  .fnode .grow { min-width: 0; }
  .farrow { display: flex; flex-direction: column; align-items: center; font-size: 12px; color: var(--dc-muted); text-align: center; }
  .farrow .mdi { width: 24px; height: 24px; }

  /* ---- next steps ---- */
  .nexts { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 10px; }
  .next-item { display: flex; align-items: center; gap: 12px; text-align: left; border: 1px solid var(--dc-border);
    border-radius: 12px; background: none; padding: 10px 12px; cursor: pointer; }
  .next-item:hover { border-color: var(--dc-accent); background: color-mix(in srgb, var(--dc-accent) 6%, transparent); }
  .next-t { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .next-t b { font-weight: 500; }
  .next-go { color: var(--dc-muted); display: flex; }
  .tile-btn { --c: var(--dc-accent); display: flex; align-items: center; gap: 14px; text-align: left; flex: 1 1 250px;
    padding: 12px 16px; border: 1px solid var(--dc-border); border-radius: 14px; background: none; cursor: pointer; }
  .tile-btn:hover:not(:disabled) { border-color: var(--c); background: color-mix(in srgb, var(--c) 6%, transparent); }
  .tile-btn:disabled { opacity: 0.5; cursor: default; }
  .tile-btn b { display: block; font-weight: 500; font-size: 15px; }

  /* ---- bar charts ---- */
  .hbars { display: flex; flex-direction: column; gap: 6px; }
  .hb { display: grid; grid-template-columns: minmax(120px, 34%) 1fr auto; align-items: center; gap: 10px; font-size: 13px; }
  .hb-l { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hb-l .small { margin-left: 6px; }
  .hb-t { height: 12px; border-radius: 6px; background: rgba(127,127,127,0.14); overflow: hidden; }
  .hb-t span { display: block; height: 100%; border-radius: 6px; }
  .hb-v { font-weight: 500; font-variant-numeric: tabular-nums; min-width: 64px; text-align: right; }
  .cols { display: flex; gap: 10px; align-items: stretch; }
  .col { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px;
    border: 1px solid transparent; border-radius: 10px; background: none; cursor: pointer; }
  .col:hover { background: rgba(127,127,127,0.08); }
  .col.active { border-color: var(--dc-accent); background: color-mix(in srgb, var(--dc-accent) 8%, transparent); }
  .col-track { height: 110px; width: 100%; max-width: 64px; display: flex; align-items: flex-end; background: rgba(127,127,127,0.08); border-radius: 8px; overflow: hidden; }
  .col-bar { display: block; width: 100%; border-radius: 6px 6px 0 0; }
  .col-v { font-weight: 500; font-size: 13px; font-variant-numeric: tabular-nums; }
  .col-l { font-size: 13px; }
  .col-s { font-size: 11px; color: var(--dc-muted); }

  /* ---- timeline ---- */
  .tl { display: flex; flex-direction: column; gap: 10px; }
  .tl-row { display: grid; grid-template-columns: minmax(130px, 24%) 1fr; gap: 12px; align-items: center; font-size: 14px; }
  .tl-l { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .tl-t { position: relative; height: 14px; border-radius: 7px; background: rgba(127,127,127,0.14); }
  .tl-b { position: absolute; top: 0; bottom: 0; min-width: 6px; border-radius: 7px; }
  .tl-b.live { animation: pulse 1.6s ease-in-out infinite; }
  .tl-d { margin-top: 3px; }
  .tl-axis { display: grid; grid-template-columns: minmax(130px, 24%) 1fr; gap: 12px; }
  .tl-axis span:first-child { grid-column: 2; grid-row: 1; justify-self: start; }
  .tl-axis span:last-child { grid-column: 2; grid-row: 1; justify-self: end; }

  /* ---- stepper ---- */
  .stepper { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px; }
  .st { display: grid; grid-template-columns: auto 1fr; column-gap: 10px; align-items: center; flex: 1 1 160px; min-width: 0;
    padding: 8px 12px; border: 1px solid var(--dc-border); border-radius: 12px; }
  .st .badge { grid-row: 1 / span 2; }
  .st b { font-weight: 500; font-size: 14px; }
  .st.active { border-color: var(--dc-accent); box-shadow: 0 0 0 1px var(--dc-accent) inset; background: color-mix(in srgb, var(--dc-accent) 8%, transparent); }
  .st.active .badge { animation: pulse 1.2s ease-in-out infinite; }
  .st.done { border-color: color-mix(in srgb, var(--success-color, #43a047) 55%, var(--dc-border)); }
  .st.alt { border-style: dashed; }
  .st-arrow { display: flex; align-items: center; color: var(--dc-muted); }
  .undo-line { margin-top: 8px; }
  .undo-line .st { flex: 0 1 340px; }

  /* ---- health lamps, sparkline labels, journal ---- */
  .lamps { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
  .lamp { --c: var(--dc-muted); display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--c) 40%, var(--dc-border)); background: color-mix(in srgb, var(--c) 6%, transparent); }
  .lamp-l { font-size: 12px; color: var(--dc-muted); }
  .lamp-v { font-weight: 500; font-size: 14px; }
  .rl { display: inline-flex; align-items: center; gap: 8px; color: var(--dc-muted); }
  .rings { display: flex; flex-wrap: wrap; gap: 8px 24px; margin-bottom: 8px; }
  .ring-item { display: flex; align-items: center; gap: 10px; font-size: 13px; }
  .spark-lab { display: flex; justify-content: space-between; font-size: 11px; color: var(--dc-muted); }
  .bigcheck { display: flex; align-items: center; gap: 14px; margin-top: 12px; font-size: 15px; }
  .jobrow { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--dc-border); }
  .jobrow:last-child { border-bottom: 0; }
  .jobrow .jb { flex: 1; min-width: 0; }
  .ba { display: grid; gap: 3px; margin-top: 6px; max-width: 280px; }
  .ba span { display: block; height: 6px; border-radius: 3px; background: var(--dc-accent); }
  .ba span.after { background: var(--success-color, #43a047); }
  .tabsum { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; color: var(--dc-muted); margin-top: 10px; }
  .tabsum span { display: inline-flex; align-items: center; gap: 6px; }
  @media (max-width: 700px) {
    main { padding: 12px; gap: 12px; }
    .tab { flex-direction: column; gap: 2px; padding: 8px 10px; font-size: 11px; }
    .tab .mdi { width: 22px; height: 22px; }
    .donut { width: 140px; height: 140px; margin: 0 auto; }
    .legend-list { min-width: 0; width: 100%; }
    .flow-in { flex-direction: row; width: 100%; justify-content: flex-start; }
    .flow-in .flow-arrow .mdi { transform: none; }
    .flow > .flow-arrow .mdi { transform: rotate(90deg); }
    .flow > .flow-arrow { width: 100%; }
    .flow-rows { min-width: 0; width: 100%; padding-left: 16px; margin-left: 0; }
    .flow-row::before { left: -16px; width: 8px; }
    .flow-row::after { left: -9px; }
    .hb { grid-template-columns: minmax(90px, 40%) 1fr auto; }
    .tl-row { grid-template-columns: 1fr; gap: 4px; }
    .tl-axis { grid-template-columns: 1fr; }
    .tl-axis span:first-child, .tl-axis span:last-child { grid-column: 1; }
    .stepper { flex-direction: column; }
    .st { flex: 0 0 auto; }
    .st-arrow { justify-content: center; transform: rotate(90deg); }
    .cols { gap: 4px; }
    .col-track { height: 80px; }
    .col-l { font-size: 11px; }
    .lamps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
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
