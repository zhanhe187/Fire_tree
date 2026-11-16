import{_ as n}from"./App.vue_vue_type_script_setup_true_lang-CFvGRiMF.js";import{q as a,j as e,l as i,d as t,o}from"./_plugin-vue_export-helper-ByPV5UX7.js";import"./graph-B9uVLOQt.js";const p=`:root {\r
  color-scheme: light;\r
  --ink: #070707;\r
  --paper: #e9f6ff;\r
  --paper-2: #f7ead7;\r
  --blue: #1e9cff;\r
  --red: #d83a2e;\r
  --gold: #f4b43f;\r
  --green: #22a76d;\r
  --line: rgba(7, 7, 7, 0.14);\r
  --muted: rgba(7, 7, 7, 0.62);\r
  /* admin/styles.css 由 main.ts 全局引入，其 :root 定义的是暗色令牌。\r
     门户只覆盖了部分变量，缺这几个时 var() 会落回管理端暗色值，\r
     导致 .chain-empty 一类的通用类在门户渲染成近黑方块。\r
     这里补齐同名令牌的浅色值，仅作用于门户（本表在 PortalHeritageEntry 挂载时追加，晚于 admin 表）。 */\r
  --surface: rgba(255, 255, 255, 0.78);\r
  --surface-strong: rgba(255, 255, 255, 0.92);\r
  --paper-soft: #574332;\r
  --ink-2: #efe0c3;\r
  --heritage-paper: #fff7e7;\r
  --heritage-paper-deep: #f3dfb9;\r
  --heritage-line: rgba(168, 118, 40, 0.28);\r
  --heritage-ink: #241c16;\r
  --heritage-muted: #726048;\r
  --heritage-vermilion: #b84a35;\r
  --heritage-amber: #a87628;\r
  --heritage-jade: #167963;\r
  /* 学习语义色板：收藏学习相关页面统一从这里取值，不要在组件规则里写死色值 */\r
  --learn-paper: #fff7e7;\r
  --learn-ink: #241c16;\r
  --learn-seal: #b84a35;\r
  --learn-amber: #a87628;\r
  --learn-jade: #167963;\r
  --learn-idle: rgba(7, 7, 7, 0.28);\r
  --learn-radius-card: 18px;\r
  --learn-radius-item: 10px;\r
  --display-cn: "FZYaoti", "STZhongsong", "Songti SC", "SimSun", "STKaiti", "KaiTi", serif;\r
  --body-cn: "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif;\r
  font-family: "Microsoft YaHei", "PingFang SC", "Arial Narrow", "Impact", sans-serif;\r
  background: var(--paper);\r
  color: var(--ink);\r
}\r
\r
* { box-sizing: border-box; }\r
\r
html { scroll-behavior: smooth; }\r
\r
body {\r
  margin: 0;\r
  min-width: 320px;\r
  background: var(--paper);\r
}\r
\r
img { display: block; max-width: 100%; }\r
\r
a, button { color: inherit; }\r
button { font: inherit; }\r
\r
.top-nav {\r
  position: sticky;\r
  top: 0;\r
  z-index: 100;\r
  display: grid;\r
  grid-template-columns: 286px 1fr minmax(180px, 240px);\r
  align-items: center;\r
  gap: 24px;\r
  min-height: 92px;\r
  padding: 0 clamp(24px, 4vw, 54px);\r
  border-bottom: 1px solid rgba(255,255,255,.18);\r
  background:\r
    linear-gradient(180deg, rgba(6, 8, 10, .44), rgba(6, 8, 10, .18) 74%, rgba(6, 8, 10, 0)),\r
    linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02));\r
  color: #fff;\r
  text-shadow: 0 2px 12px rgba(0,0,0,.58);\r
  backdrop-filter: blur(18px) saturate(1.25);\r
  box-shadow: 0 16px 44px rgba(0,0,0,0);\r
  transition: min-height .28s ease, background .28s ease, border-color .28s ease, box-shadow .28s ease, backdrop-filter .28s ease;\r
}\r
\r
.account-entry {\r
  display: grid;\r
  grid-template-columns: 38px minmax(0, 1fr);\r
  align-items: center;\r
  gap: 8px 10px;\r
  justify-self: end;\r
  min-height: 52px;\r
  width: 100%;\r
  max-width: 240px;\r
  border: 1px solid rgba(255, 255, 255, .22);\r
  border-radius: 999px;\r
  padding: 6px 14px 6px 7px;\r
  background: rgba(10, 12, 14, .28);\r
  color: #fff;\r
  cursor: pointer;\r
  text-align: left;\r
  backdrop-filter: blur(14px);\r
}\r
\r
.account-entry span {\r
  grid-row: span 2;\r
  display: grid;\r
  place-items: center;\r
  width: 38px;\r
  height: 38px;\r
  border-radius: 50%;\r
  background: linear-gradient(135deg, #d83a2e, #f4b43f);\r
  font-weight: 1000;\r
}\r
\r
.account-entry strong,\r
.account-entry small {\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
\r
.account-entry strong {\r
  font-size: 13px;\r
}\r
\r
.account-entry small {\r
  color: rgba(255, 255, 255, .68);\r
  font-size: 11px;\r
}\r
\r
.auth-page {\r
  position: relative;\r
  display: grid;\r
  grid-template-columns: minmax(360px, 1fr) minmax(320px, 430px);\r
  gap: clamp(28px, 5vw, 72px);\r
  align-items: center;\r
  min-height: calc(100vh - 92px);\r
  margin-top: -92px;\r
  padding: 156px clamp(22px, 5vw, 72px) 64px;\r
  background:\r
    radial-gradient(circle at 12% 18%, rgba(216, 58, 46, .18), transparent 30%),\r
    radial-gradient(circle at 88% 12%, rgba(30, 156, 255, .18), transparent 30%),\r
    linear-gradient(145deg, #fff8e9 0%, #eaf7ff 100%);\r
}\r
\r
.auth-page:not(.admin) {\r
  min-height: 100vh;\r
  background-color: #120b08;\r
  background-image: var(--auth-bg);\r
  background-position: center center;\r
  background-size: cover;\r
}\r
\r
.auth-page:not(.admin)::before {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  background:\r
    radial-gradient(circle at 40% 52%, rgba(0, 0, 0, .46), rgba(0, 0, 0, .18) 28%, transparent 46%),\r
    linear-gradient(90deg, rgba(0, 0, 0, .32), rgba(0, 0, 0, .08) 48%, rgba(0, 0, 0, .24));\r
  pointer-events: none;\r
}\r
\r
.auth-visual,\r
.auth-card {\r
  position: relative;\r
  z-index: 1;\r
}\r
\r
.auth-visual {\r
  display: grid;\r
  place-items: center;\r
  min-height: 360px;\r
  text-align: center;\r
}\r
\r
.auth-visual h1 {\r
  margin: 12px 0 16px;\r
  max-width: 760px;\r
  font-family: var(--display-cn);\r
  font-size: clamp(48px, 6vw, 88px);\r
  line-height: 1;\r
}\r
\r
.auth-kicker {\r
  display: inline-flex;\r
  min-height: 30px;\r
  padding: 0 12px;\r
  align-items: center;\r
  border: 1px solid rgba(216, 58, 46, .24);\r
  border-radius: 999px;\r
  background: rgba(216, 58, 46, .08);\r
  color: #b92f25;\r
  font-weight: 1000;\r
}\r
\r
.auth-visual p {\r
  max-width: 620px;\r
  color: rgba(7, 7, 7, .66);\r
  font-size: 17px;\r
  line-height: 1.75;\r
}\r
\r
.auth-rotating-headline {\r
  display: inline-flex;\r
  align-items: center;\r
  justify-content: center;\r
  gap: clamp(12px, 2vw, 22px);\r
  width: min(760px, 100%);\r
  color: #fff8df;\r
  font-family: var(--display-cn);\r
  font-size: clamp(44px, 6vw, 86px);\r
  font-weight: 900;\r
  line-height: 1;\r
  text-shadow: 0 5px 24px rgba(0, 0, 0, .62), 0 0 28px rgba(244, 180, 63, .28);\r
}\r
\r
.auth-rotating-headline strong {\r
  flex: 0 0 auto;\r
  white-space: nowrap;\r
}\r
\r
.rotating-heritage-name {\r
  display: inline-flex;\r
  align-items: center;\r
  justify-content: center;\r
  min-width: 4.4em;\r
  min-height: 1.16em;\r
  overflow: hidden;\r
  color: #ffe19a;\r
  white-space: nowrap;\r
}\r
\r
.rotating-heritage-split {\r
  overflow: hidden;\r
  padding-bottom: .08em;\r
}\r
\r
.rotating-heritage-char {\r
  will-change: transform, opacity;\r
}\r
\r
@media (max-width: 720px) {\r
  .auth-page {\r
    grid-template-columns: 1fr;\r
    padding: 132px 18px 44px;\r
  }\r
\r
  .auth-visual {\r
    min-height: 260px;\r
  }\r
\r
  .auth-rotating-headline {\r
    flex-wrap: wrap;\r
    gap: 12px;\r
    font-size: clamp(38px, 15vw, 64px);\r
  }\r
\r
  .rotating-heritage-name {\r
    min-width: 4em;\r
  }\r
}\r
\r
@media (max-width: 1500px) {\r
  .top-nav {\r
    grid-template-columns: minmax(210px, 260px) minmax(0, 1fr) minmax(170px, 220px);\r
    gap: 16px;\r
  }\r
\r
  .nav-links {\r
    gap: clamp(12px, 2.2vw, 34px);\r
  }\r
\r
  .nav-links button {\r
    padding: 0 10px;\r
    font-size: 16px;\r
  }\r
}\r
\r
.auth-card {\r
  --card-x: 50%;\r
  --card-y: 50%;\r
  overflow: hidden;\r
  display: grid;\r
  gap: 16px;\r
  padding: 28px;\r
  border: 1px solid rgba(255, 244, 214, .42);\r
  border-radius: 32px;\r
  background:\r
    linear-gradient(145deg, rgba(255, 255, 255, .44), rgba(255, 247, 224, .2)),\r
    rgba(255, 255, 255, .22);\r
  box-shadow:\r
    inset 0 1px 0 rgba(255, 255, 255, .56),\r
    inset 0 -24px 54px rgba(92, 39, 10, .08),\r
    0 30px 90px rgba(0, 0, 0, .36);\r
  backdrop-filter: blur(28px) saturate(1.45);\r
  -webkit-backdrop-filter: blur(28px) saturate(1.45);\r
  isolation: isolate;\r
  transform: translateZ(0);\r
  transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease, background .22s ease;\r
}\r
\r
.auth-card::before {\r
  content: "";\r
  position: absolute;\r
  inset: -1px;\r
  z-index: -1;\r
  border-radius: inherit;\r
  background:\r
    radial-gradient(circle at var(--card-x) var(--card-y), rgba(255, 220, 142, .5), rgba(244, 180, 63, .16) 26%, transparent 52%),\r
    linear-gradient(135deg, rgba(255, 255, 255, .28), transparent 42%);\r
  opacity: .74;\r
  pointer-events: none;\r
  transition: opacity .22s ease;\r
}\r
\r
.auth-card::after {\r
  content: "";\r
  position: absolute;\r
  inset: 1px;\r
  z-index: -1;\r
  border-radius: 30px;\r
  border: 1px solid rgba(255, 255, 255, .24);\r
  background: linear-gradient(180deg, rgba(255, 255, 255, .18), rgba(255, 255, 255, .06));\r
  pointer-events: none;\r
}\r
\r
.auth-card:hover {\r
  transform: translateY(-3px);\r
  border-color: rgba(255, 232, 176, .7);\r
  box-shadow:\r
    inset 0 1px 0 rgba(255, 255, 255, .68),\r
    inset 0 -24px 54px rgba(92, 39, 10, .08),\r
    0 34px 100px rgba(0, 0, 0, .42),\r
    0 0 34px rgba(244, 180, 63, .16);\r
}\r
\r
.auth-card:hover::before {\r
  opacity: 1;\r
}\r
\r
.auth-tabs {\r
  display: grid;\r
  grid-template-columns: repeat(2, 1fr);\r
  gap: 6px;\r
  padding: 5px;\r
  border-radius: 999px;\r
  background: rgba(255, 255, 255, .22);\r
  box-shadow: inset 0 1px 8px rgba(0, 0, 0, .12);\r
}\r
\r
.auth-tabs button,\r
.auth-current button,\r
.auth-submit {\r
  border: 0;\r
  cursor: pointer;\r
}\r
\r
.auth-tabs button {\r
  min-height: 40px;\r
  border-radius: 999px;\r
  background: transparent;\r
  color: rgba(20, 16, 12, .78);\r
  font-weight: 1000;\r
  transition: background .2s ease, box-shadow .2s ease, color .2s ease, transform .2s ease;\r
}\r
\r
.auth-tabs button.active {\r
  background: rgba(255, 255, 255, .86);\r
  color: #c76f09;\r
  box-shadow: 0 10px 24px rgba(76, 34, 7, .16), inset 0 1px 0 rgba(255, 255, 255, .82);\r
}\r
\r
.auth-tabs button:hover {\r
  transform: translateY(-1px);\r
}\r
\r
.auth-card label {\r
  display: grid;\r
  gap: 8px;\r
  font-weight: 900;\r
  color: rgba(10, 7, 4, .9);\r
}\r
\r
.auth-card input,\r
.auth-card select {\r
  width: 100%;\r
  min-height: 44px;\r
  border: 1px solid rgba(255, 244, 214, .24);\r
  border-radius: 10px;\r
  padding: 0 13px;\r
  background:\r
    linear-gradient(180deg, rgba(42, 34, 25, .84), rgba(42, 34, 25, .7)),\r
    rgba(20, 14, 10, .68);\r
  color: #fff8e9;\r
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .08), 0 10px 20px rgba(0, 0, 0, .12);\r
  outline: none;\r
  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease, transform .2s ease;\r
}\r
\r
.auth-card input::placeholder {\r
  color: rgba(255, 248, 233, .38);\r
}\r
\r
.auth-card input:focus,\r
.auth-card select:focus {\r
  border-color: rgba(255, 209, 108, .86);\r
  background:\r
    linear-gradient(180deg, rgba(48, 37, 24, .9), rgba(35, 26, 18, .78)),\r
    rgba(20, 14, 10, .72);\r
  box-shadow:\r
    inset 0 1px 0 rgba(255, 255, 255, .1),\r
    0 0 0 3px rgba(244, 180, 63, .18),\r
    0 16px 30px rgba(0, 0, 0, .16);\r
  transform: translateY(-1px);\r
}\r
\r
.auth-current,\r
.auth-error {\r
  border-radius: 18px;\r
  padding: 10px 12px;\r
}\r
\r
.auth-current {\r
  display: flex;\r
  justify-content: space-between;\r
  gap: 10px;\r
  background: rgba(34, 167, 109, .1);\r
}\r
\r
.auth-current button {\r
  background: transparent;\r
  color: #b92f25;\r
  font-weight: 900;\r
}\r
\r
.auth-error {\r
  margin: 0;\r
  background: rgba(216, 58, 46, .1);\r
  color: #9c241c;\r
}\r
\r
.auth-submit {\r
  display: inline-flex;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 8px;\r
  min-height: 48px;\r
  border-radius: 999px;\r
  background: linear-gradient(135deg, #d83a2e, #f4b43f);\r
  color: #fff;\r
  font-weight: 1000;\r
  box-shadow: 0 16px 34px rgba(216, 58, 46, .28), inset 0 1px 0 rgba(255, 255, 255, .22);\r
  transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;\r
}\r
\r
.auth-submit:hover:not(:disabled) {\r
  transform: translateY(-2px);\r
  box-shadow: 0 20px 42px rgba(216, 58, 46, .34), 0 0 22px rgba(244, 180, 63, .2);\r
  filter: saturate(1.12);\r
}\r
\r
.auth-submit:disabled {\r
  cursor: wait;\r
  opacity: .74;\r
}\r
\r
.top-nav::before {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  z-index: -1;\r
  background: radial-gradient(circle at 12% 0%, rgba(255,255,255,.16), transparent 34%);\r
  opacity: .8;\r
  pointer-events: none;\r
}\r
\r
.top-nav.is-scrolled {\r
  min-height: 76px;\r
  border-bottom-color: rgba(255,255,255,.22);\r
  background:\r
    linear-gradient(180deg, rgba(8, 8, 8, .96), rgba(8, 8, 8, .88)),\r
    linear-gradient(90deg, rgba(255,255,255,.06), transparent);\r
  backdrop-filter: blur(22px) saturate(1.35);\r
  box-shadow: 0 18px 46px rgba(0,0,0,.32);\r
}\r
\r
.brand {\r
  border: 0;\r
  background: transparent;\r
  cursor: pointer;\r
  position: relative;\r
  display: inline-grid;\r
  grid-template-columns: 68px minmax(0, 1fr);\r
  align-items: center;\r
  gap: 16px;\r
  width: max-content;\r
  min-width: 238px;\r
  min-height: 68px;\r
  padding: 8px 18px 8px 10px;\r
  border: 1px solid rgba(255, 255, 255, .18);\r
  border-radius: 999px;\r
  background:\r
    linear-gradient(135deg, rgba(255, 255, 255, .18), rgba(255, 255, 255, .04)),\r
    rgba(10, 12, 14, .2);\r
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .16);\r
  text-decoration: none;\r
  transition: transform .24s ease, border-color .24s ease, background .24s ease, box-shadow .24s ease;\r
}\r
\r
.brand::after {\r
  content: "";\r
  position: absolute;\r
  left: 84px;\r
  top: 18px;\r
  bottom: 18px;\r
  width: 1px;\r
  background: linear-gradient(180deg, transparent, rgba(244, 180, 63, .72), transparent);\r
  opacity: .72;\r
}\r
\r
.brand:hover {\r
  transform: translateY(-1px);\r
  border-color: rgba(244, 180, 63, .42);\r
  background:\r
    linear-gradient(135deg, rgba(255, 255, 255, .22), rgba(244, 180, 63, .08)),\r
    rgba(10, 12, 14, .26);\r
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .2), 0 16px 34px rgba(0, 0, 0, .22);\r
}\r
\r
.brand-emblem {\r
  position: relative;\r
  display: grid;\r
  place-items: center;\r
  width: 58px;\r
  height: 58px;\r
  border-radius: 18px;\r
  background:\r
    linear-gradient(145deg, rgba(255, 229, 158, .95), rgba(214, 55, 43, .9)),\r
    #d83a2e;\r
  box-shadow:\r
    inset 0 0 0 2px rgba(255, 237, 175, .32),\r
    inset 0 -10px 24px rgba(122, 25, 20, .2),\r
    0 12px 26px rgba(216, 58, 46, .34);\r
  overflow: hidden;\r
  transition: transform .28s ease, box-shadow .28s ease;\r
}\r
\r
.brand-emblem::before,\r
.brand-emblem::after {\r
  content: "";\r
  position: absolute;\r
  pointer-events: none;\r
}\r
\r
.brand-emblem::before {\r
  inset: 7px;\r
  border: 1px solid rgba(255, 243, 202, .55);\r
  border-radius: 12px;\r
}\r
\r
.brand-emblem::after {\r
  inset: -24px 18px 18px -24px;\r
  background: rgba(255, 255, 255, .28);\r
  transform: rotate(38deg);\r
}\r
\r
.brand-mark {\r
  position: relative;\r
  z-index: 1;\r
  display: inline-block;\r
  color: #fff8df;\r
  font-family: var(--display-cn);\r
  font-size: 22px;\r
  font-weight: 900;\r
  letter-spacing: .08em;\r
  line-height: 1;\r
  writing-mode: vertical-rl;\r
  text-shadow: 0 2px 10px rgba(85, 14, 12, .48);\r
}\r
\r
.brand:hover .brand-emblem {\r
  transform: rotate(-2deg) scale(1.03);\r
  box-shadow:\r
    inset 0 0 0 2px rgba(255, 237, 175, .4),\r
    inset 0 -10px 24px rgba(122, 25, 20, .2),\r
    0 16px 32px rgba(216, 58, 46, .42);\r
}\r
\r
.brand-text {\r
  display: grid;\r
  gap: 3px;\r
  color: #fff;\r
  text-shadow: 0 2px 12px rgba(0,0,0,.62);\r
}\r
\r
.brand-text strong {\r
  font-family: var(--display-cn);\r
  font-size: 22px;\r
  font-weight: 900;\r
  line-height: 1;\r
  letter-spacing: .16em;\r
}\r
\r
.brand-text small {\r
  color: rgba(255, 255, 255, .68);\r
  font-family: var(--body-cn);\r
  font-size: 12px;\r
  font-weight: 800;\r
  letter-spacing: .34em;\r
  line-height: 1;\r
}\r
\r
.top-nav.is-scrolled .brand-mark {\r
  text-shadow: 0 2px 10px rgba(85, 14, 12, .5);\r
}\r
\r
.top-nav.is-scrolled .brand {\r
  background:\r
    linear-gradient(135deg, rgba(255, 255, 255, .14), rgba(244, 180, 63, .06)),\r
    rgba(10, 12, 14, .42);\r
}\r
\r
.nav-links {\r
  display: flex;\r
  align-items: center;\r
  justify-content: center;\r
  gap: clamp(22px, 4vw, 68px);\r
}\r
\r
.nav-links button {\r
  border: 0;\r
  border-radius: 999px;\r
  background: transparent;\r
  cursor: pointer;\r
  position: relative;\r
  min-height: 42px;\r
  padding: 0 14px;\r
  color: rgba(255,255,255,.76);\r
  font-size: 18px;\r
  font-weight: 1000;\r
  letter-spacing: .08em;\r
  white-space: nowrap;\r
  text-decoration: none;\r
  text-shadow: 0 2px 12px rgba(0,0,0,.62);\r
  transition: color .2s ease, background .2s ease, transform .2s ease;\r
}\r
\r
.nav-links button:hover,\r
.nav-links button.active {\r
  color: #fff;\r
  background: rgba(255,255,255,.1);\r
  transform: translateY(-1px);\r
}\r
\r
.top-nav.is-scrolled .nav-links button.active {\r
  background: rgba(255,255,255,.14);\r
}\r
\r
.nav-links button.active::after {\r
  content: "";\r
  position: absolute;\r
  left: 14px;\r
  right: 14px;\r
  bottom: 2px;\r
  height: 3px;\r
  border-radius: 999px;\r
  background: #fff;\r
  box-shadow: 0 0 18px rgba(255,255,255,.5);\r
}\r
\r
.heritage-opening {\r
  --p1fade: 1;\r
  position: relative;\r
  min-height: 100vh;\r
  margin-top: -92px;\r
  overflow: hidden;\r
  background: #000;\r
  color: #fff;\r
  isolation: isolate;\r
}\r
\r
.video-bg {\r
  position: absolute;\r
  inset: 0;\r
  z-index: 0;\r
  width: 100%;\r
  height: 100%;\r
  object-fit: cover;\r
  background: #000;\r
}\r
\r
.opening-vignette,\r
.opening-top-fade,\r
.opening-bottom-fade {\r
  position: absolute;\r
  inset: 0;\r
  pointer-events: none;\r
}\r
\r
.opening-vignette {\r
  z-index: 1;\r
  background: radial-gradient(ellipse at 50% 50%, transparent 15%, rgba(0, 10, 25, .35) 60%, rgba(0, 0, 0, .85) 100%);\r
}\r
\r
.opening-top-fade {\r
  z-index: 3;\r
  background: linear-gradient(to bottom, rgba(0, 0, 0, .6) 0%, rgba(0, 0, 0, .2) 8%, transparent 20%);\r
}\r
\r
.opening-bottom-fade {\r
  z-index: 3;\r
  background: linear-gradient(to bottom, transparent 62%, rgba(0, 0, 0, .42) 84%, #000 100%);\r
}\r
\r
.p1-ui {\r
  position: absolute;\r
  z-index: 5;\r
  opacity: var(--p1fade);\r
  transition: opacity .3s ease;\r
}\r
\r
.opening-center {\r
  top: 50%;\r
  left: 50%;\r
  display: grid;\r
  justify-items: center;\r
  text-align: center;\r
  transform: translate(-50%, -50%);\r
}\r
\r
.opening-center h1 {\r
  position: relative;\r
  margin: 0;\r
  color: rgba(180, 220, 255, .92);\r
  font-family: var(--display-cn);\r
  font-size: 8rem;\r
  font-weight: 900;\r
  line-height: .95;\r
  opacity: 0;\r
  text-shadow: 0 0 20px rgba(120, 190, 255, .5), 0 0 50px rgba(80, 160, 240, .2), 0 0 90px rgba(60, 140, 220, .1);\r
  animation:\r
    openingHeroIn 1.2s cubic-bezier(.2, 1, .3, 1) .6s forwards,\r
    openingGiantScale 2.5s ease-in-out 2s infinite,\r
    openingGiantGlow 2.5s ease-in-out 2s infinite;\r
}\r
\r
.opening-center h1::before,\r
.opening-center h1::after,\r
.opening-feature .opening-label::before,\r
.opening-feature h2::before,\r
.opening-event p::before {\r
  position: absolute;\r
  top: 50%;\r
  left: 50%;\r
  pointer-events: none;\r
  content: "";\r
  transform: translate(-50%, -50%);\r
}\r
\r
.opening-center h1::before {\r
  z-index: -1;\r
  width: 100%;\r
  height: 140%;\r
  background: radial-gradient(ellipse, rgba(100, 180, 255, .2) 0%, rgba(80, 160, 240, .08) 40%, transparent 70%);\r
  animation: openingRingExpand 2.5s ease-out 2s infinite;\r
}\r
\r
.opening-center h1::after {\r
  inset: 0;\r
  top: auto;\r
  left: auto;\r
  background: linear-gradient(90deg, transparent 0%, rgba(180, 230, 255, 1) 45%, rgba(255, 255, 255, 1) 50%, rgba(180, 230, 255, 1) 55%, transparent 100%);\r
  background-size: 250% 100%;\r
  background-clip: text;\r
  color: transparent;\r
  content: attr(data-title);\r
  mix-blend-mode: screen;\r
  transform: none;\r
  animation: openingHeroSweep 3s linear 2s infinite;\r
}\r
\r
.opening-center p {\r
  margin: 14px 0 0;\r
  color: rgba(220, 235, 250, .68);\r
  font-family: var(--display-cn);\r
  font-size: 1.35rem;\r
  font-style: italic;\r
  opacity: 0;\r
  animation: openingFadeUp 1s ease-out 1.2s forwards;\r
}\r
\r
.opening-feature {\r
  top: 32%;\r
  left: 4%;\r
  width: min(420px, 28%);\r
  padding-left: 16px;\r
  border-left: 3px solid rgba(255, 200, 80, .85);\r
}\r
\r
.opening-feature .opening-label {\r
  position: relative;\r
  margin: 0;\r
  color: rgba(255, 200, 80, .92);\r
  font-family: var(--display-cn);\r
  font-size: 1.75rem;\r
  font-weight: 900;\r
  opacity: 0;\r
  animation:\r
    openingSlideRight .8s ease-out 1.4s forwards,\r
    openingGoldPulse 3s ease-in-out 2.5s infinite;\r
}\r
\r
.opening-feature .opening-label::before,\r
.opening-event p::before {\r
  z-index: -1;\r
  width: 115%;\r
  height: 160%;\r
  background: radial-gradient(ellipse, rgba(255, 200, 80, .15) 0%, rgba(255, 180, 60, .06) 40%, transparent 70%);\r
  animation: openingRingExpand 3.5s ease-out 2.5s infinite;\r
}\r
\r
.opening-feature h2 {\r
  position: relative;\r
  margin: 8px 0 18px;\r
  color: #fff;\r
  font-family: var(--display-cn);\r
  font-size: 2rem;\r
  font-weight: 900;\r
  line-height: 1.15;\r
  opacity: 0;\r
  animation:\r
    openingSlideRight .8s ease-out 1.6s forwards,\r
    openingWhitePulse 3.5s ease-in-out 2.8s infinite;\r
}\r
\r
.opening-feature h2::before {\r
  z-index: -1;\r
  width: 110%;\r
  height: 150%;\r
  background: radial-gradient(ellipse, rgba(150, 200, 255, .15) 0%, rgba(150, 200, 255, .06) 40%, transparent 70%);\r
  animation: openingRingExpand 3.5s ease-out 2.8s infinite;\r
}\r
\r
.opening-body-wrap {\r
  width: 72%;\r
  height: 9.5em;\r
  overflow: hidden;\r
  color: rgba(220, 235, 250, .62);\r
  font-family: var(--body-cn);\r
  font-size: 1rem;\r
  line-height: 1.9;\r
  opacity: 0;\r
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 15%, #000 85%, transparent 100%);\r
  mask-image: linear-gradient(to bottom, transparent 0%, #000 15%, #000 85%, transparent 100%);\r
  animation: openingBodyCrush .3s cubic-bezier(.8, 0, .2, 1) 0s forwards, openingBodyFadeIn .8s ease-out 1.2s forwards;\r
}\r
\r
.opening-body-scroll {\r
  animation: openingBodyScroll 12s linear 2.5s infinite;\r
}\r
\r
.opening-body-scroll p {\r
  margin: 0 0 .5em;\r
}\r
\r
.opening-btn {\r
  display: inline-flex;\r
  align-items: center;\r
  justify-content: center;\r
  min-height: 42px;\r
  margin-top: 18px;\r
  padding: 0 22px;\r
  border: 0;\r
  border-radius: 24px;\r
  background: rgba(255, 200, 80, .9);\r
  color: #000;\r
  cursor: pointer;\r
  font-family: var(--body-cn);\r
  font-size: .82rem;\r
  font-weight: 900;\r
  opacity: 0;\r
  animation: openingBtnIn .6s ease-out 2.4s forwards;\r
}\r
\r
.opening-event {\r
  right: 4%;\r
  bottom: clamp(96px, 12vh, 132px);\r
  max-width: 320px;\r
  padding-right: 16px;\r
  border-right: 3px solid rgba(255, 200, 80, .85);\r
  text-align: right;\r
}\r
\r
.opening-event p {\r
  position: relative;\r
  margin: 0 0 10px;\r
  color: rgba(255, 200, 80, .92);\r
  font-family: var(--display-cn);\r
  font-size: 1.05rem;\r
  font-weight: 900;\r
  opacity: 0;\r
  animation:\r
    openingSlideLeft .8s ease-out 1.5s forwards,\r
    openingGoldPulse 3s ease-in-out 2.3s infinite;\r
}\r
\r
.opening-event strong {\r
  display: block;\r
  color: #fff;\r
  font-family: var(--body-cn);\r
  font-size: 1.25rem;\r
  font-weight: 900;\r
  line-height: 1.45;\r
  opacity: 0;\r
  animation:\r
    openingSlideLeft .8s ease-out 1.7s forwards,\r
    openingEventBreath 4s ease-in-out 3s infinite;\r
}\r
\r
.opening-vertical {\r
  top: 50%;\r
  right: 1.5%;\r
  margin: 0;\r
  color: rgba(220, 235, 250, .42);\r
  font-family: var(--display-cn);\r
  font-size: .75rem;\r
  font-style: italic;\r
  line-height: 1.8;\r
  opacity: 0;\r
  transform: translateY(-50%);\r
  writing-mode: vertical-rl;\r
  animation: openingFadeIn 1.5s ease-in 2.5s forwards;\r
}\r
\r
@keyframes openingHeroIn {\r
  0% { opacity: 0; transform: scale(2.5); filter: blur(20px); }\r
  40% { opacity: .5; filter: blur(5px); }\r
  70% { opacity: 1; transform: scale(.92); filter: blur(0); }\r
  85% { transform: scale(1.03); }\r
  100% { opacity: 1; transform: scale(1); filter: blur(0); }\r
}\r
\r
@keyframes openingGiantScale {\r
  0%, 100% { transform: scale(1); }\r
  50% { transform: scale(1.04); }\r
}\r
\r
@keyframes openingGiantGlow {\r
  0%, 100% { text-shadow: 0 0 20px rgba(120, 190, 255, .5), 0 0 50px rgba(80, 160, 240, .2), 0 0 90px rgba(60, 140, 220, .1); }\r
  50% { text-shadow: 0 0 40px rgba(180, 220, 255, .95), 0 0 90px rgba(100, 180, 255, .5), 0 0 160px rgba(80, 160, 240, .25); }\r
}\r
\r
@keyframes openingHeroSweep {\r
  0% { background-position: 250% 0; }\r
  100% { background-position: -250% 0; }\r
}\r
\r
@keyframes openingRingExpand {\r
  0% { transform: translate(-50%, -50%) scale(.8); opacity: .8; }\r
  100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }\r
}\r
\r
@keyframes openingFadeUp {\r
  0% { opacity: 0; transform: translateY(40px) scale(.9); }\r
  60% { opacity: 1; transform: translateY(-5px) scale(1.02); }\r
  100% { opacity: 1; transform: translateY(0) scale(1); }\r
}\r
\r
@keyframes openingFadeIn {\r
  0% { opacity: 0; transform: translateY(-50%) scale(1.3); }\r
  60% { opacity: .8; }\r
  100% { opacity: 1; transform: translateY(-50%) scale(1); }\r
}\r
\r
@keyframes openingSlideRight {\r
  0% { opacity: 0; transform: translateX(-80px) scale(.85); }\r
  60% { opacity: 1; transform: translateX(10px) scale(1.03); }\r
  100% { opacity: 1; transform: translateX(0) scale(1); }\r
}\r
\r
@keyframes openingSlideLeft {\r
  0% { opacity: 0; transform: translateX(80px) scale(.85); }\r
  60% { opacity: 1; transform: translateX(-10px) scale(1.03); }\r
  100% { opacity: 1; transform: translateX(0) scale(1); }\r
}\r
\r
@keyframes openingGoldPulse {\r
  0%, 100% { text-shadow: 0 0 8px rgba(255, 200, 80, .35), 0 0 18px rgba(255, 180, 60, .12); transform: scale(1); }\r
  50% { text-shadow: 0 0 22px rgba(255, 225, 110, .9), 0 0 45px rgba(255, 200, 80, .4), 0 0 75px rgba(255, 180, 60, .15); transform: scale(1.04); }\r
}\r
\r
@keyframes openingWhitePulse {\r
  0%, 100% { text-shadow: 0 0 8px rgba(200, 225, 255, .35), 0 0 18px rgba(150, 200, 255, .12); transform: scale(1); }\r
  50% { text-shadow: 0 0 22px rgba(255, 255, 255, .85), 0 0 45px rgba(180, 220, 255, .4), 0 0 75px rgba(150, 200, 255, .15); transform: scale(1.03); }\r
}\r
\r
@keyframes openingBodyCrush {\r
  0% { transform: scale(1); }\r
  100% { transform: scale(.3); }\r
}\r
\r
@keyframes openingBodyFadeIn {\r
  0% { opacity: 0; transform: scale(.3); }\r
  100% { opacity: 1; transform: scale(1); }\r
}\r
\r
@keyframes openingBodyScroll {\r
  0% { transform: translateY(0); }\r
  100% { transform: translateY(-50%); }\r
}\r
\r
@keyframes openingBtnIn {\r
  0% { opacity: 0; transform: translateY(10px); }\r
  100% { opacity: 1; transform: translateY(0); }\r
}\r
\r
@keyframes openingEventBreath {\r
  0%, 100% { opacity: .85; transform: scale(1); }\r
  50% { opacity: 1; transform: scale(1.02); }\r
}\r
\r
@keyframes openingNextPageFade {\r
  0% {\r
    opacity: .12;\r
    filter: blur(22px);\r
    transform: translateY(52px) scale(.985);\r
  }\r
  100% {\r
    opacity: 1;\r
    filter: blur(0);\r
    transform: translateY(0) scale(1);\r
  }\r
}\r
\r
.hero,\r
.page-hero {\r
  position: relative;\r
  overflow: hidden;\r
  min-height: calc(100vh - 92px);\r
  margin-top: -92px;\r
  padding: 152px 42px 64px;\r
}\r
\r
.home-hero {\r
  display: grid;\r
  grid-template-columns: minmax(430px, .92fr) minmax(520px, 1.08fr);\r
  align-items: center;\r
  gap: 54px;\r
  color: #fff;\r
  animation: openingNextPageFade 1s both ease-out;\r
  animation-timeline: view();\r
  animation-range: entry 0% cover 38%;\r
  will-change: opacity, filter, transform;\r
  background:\r
    radial-gradient(circle at 72% 26%, rgba(244, 180, 63, .12), transparent 40%),\r
    radial-gradient(circle at 16% 78%, rgba(216, 58, 46, .12), transparent 42%),\r
    linear-gradient(180deg, #1c1f24 0%, #14161a 52%, #0d0f12 100%);\r
}\r
\r
.home-hero .label-tag,\r
.home-hero .stamp {\r
  border-color: rgba(255,255,255,.32);\r
  background: rgba(255,255,255,.08);\r
  color: #fff;\r
}\r
\r
.home-hero .hero-copy h1 {\r
  max-width: 480px;\r
  color: #fff;\r
  text-shadow: 0 2px 0 rgba(0,0,0,.18), 0 22px 48px rgba(0,0,0,.4);\r
}\r
\r
.home-hero .hero-copy p:not(.label-tag) {\r
  max-width: 480px;\r
  color: rgba(255,255,255,.74);\r
}\r
\r
.intro-radar-background {\r
  position: absolute;\r
  inset: -18% -8%;\r
  z-index: 0;\r
  opacity: .95;\r
  pointer-events: auto;\r
  mix-blend-mode: screen;\r
  filter: saturate(1.25) contrast(1.1) brightness(1.05);\r
}\r
\r
.intro-radar-background::after {\r
  position: absolute;\r
  inset: 0;\r
  pointer-events: none;\r
  content: "";\r
  background:\r
    radial-gradient(circle at 47% 44%, transparent 0 42%, rgba(13,15,18,.32) 100%),\r
    linear-gradient(90deg, rgba(13,15,18,.28), transparent 46%, rgba(13,15,18,.32));\r
}\r
\r
.intro-radar-background .radar-canvas,\r
.intro-radar-background canvas {\r
  display: block;\r
  width: 100%;\r
  height: 100%;\r
}\r
\r
.intro-radar-background canvas {\r
  opacity: 1;\r
}\r
\r
.explore-magic-rings-background {\r
  position: absolute;\r
  inset: -18% -10% -10% -18%;\r
  z-index: 0;\r
  opacity: .95;\r
  pointer-events: none;\r
  mix-blend-mode: multiply;\r
  filter: saturate(1.18) contrast(1.04);\r
}\r
\r
.explore-magic-rings-background::after {\r
  position: absolute;\r
  inset: 0;\r
  pointer-events: none;\r
  content: "";\r
  background:\r
    radial-gradient(circle at 76% 40%, rgba(232, 245, 255, .18), transparent 24%),\r
    linear-gradient(90deg, rgba(232, 245, 255, .2), transparent 42%, rgba(232, 245, 255, .36));\r
}\r
\r
.explore-magic-rings-background .magic-rings-canvas,\r
.explore-magic-rings-background canvas {\r
  display: block;\r
  width: 100%;\r
  height: 100%;\r
}\r
\r
.explore-magic-rings-background canvas {\r
  opacity: .9;\r
}\r
\r
.hero-copy,\r
.card-swap-stage,\r
.page-hero > *,\r
.light-section > *,\r
.dark-section > * { position: relative; z-index: 1; }\r
\r
.page-hero > .explore-magic-rings-background,\r
.page-hero > .graph-scan-background {\r
  position: absolute;\r
  z-index: 0;\r
}\r
\r
.hero-copy {\r
  max-width: 610px;\r
  align-self: center;\r
  padding: 20px 0 0;\r
}\r
\r
.label-tag,\r
.stamp {\r
  display: inline-flex;\r
  align-items: center;\r
  min-height: 34px;\r
  margin: 0 0 20px;\r
  padding: 0 12px;\r
  border: 2px solid rgba(7,7,7,.72);\r
  border-radius: 6px;\r
  background: rgba(255,255,255,.54);\r
  color: #111;\r
  box-shadow: 0 8px 22px rgba(0,0,0,.08);\r
  font-size: 14px;\r
  font-weight: 1000;\r
  letter-spacing: .08em;\r
}\r
\r
.page-hero h1,\r
.section-copy h2,\r
.section-copy .spotlight-reveal-text,\r
.section-head h2,\r
.project-row h2,\r
.about-grid h2,\r
.system-copy h2 {\r
  margin: 0;\r
  color: #050505;\r
  font-family: var(--display-cn);\r
  font-weight: 900;\r
  letter-spacing: 0;\r
  text-transform: none;\r
  overflow-wrap: anywhere;\r
}\r
\r
.hero-copy h1 {\r
  max-width: 610px;\r
  color: #050505;\r
  font-family: "Microsoft YaHei", "PingFang SC", "Arial Narrow", "Impact", sans-serif;\r
  font-weight: 1000;\r
  font-size: clamp(54px, 5vw, 86px);\r
  line-height: .92;\r
  letter-spacing: 0;\r
  text-wrap: balance;\r
  text-shadow: 0 1px 0 rgba(255,255,255,.25), 0 18px 44px rgba(8,60,105,.14);\r
}\r
\r
.hero-copy p:not(.label-tag) {\r
  max-width: 600px;\r
  color: rgba(7,7,7,.68);\r
  font-size: 18px;\r
  line-height: 1.78;\r
}\r
\r
.hero-copy p:not(.label-tag),\r
.page-hero p,\r
.section-copy p,\r
.entry-card p,\r
.project-row p,\r
.about-grid p,\r
.timeline p {\r
  max-width: 760px;\r
  color: rgba(7,7,7,.72);\r
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;\r
  font-size: 17px;\r
  line-height: 1.72;\r
}\r
\r
.hero-actions,\r
.button-row {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 16px;\r
  margin-top: 34px;\r
}\r
\r
.btn {\r
  border: 0;\r
  cursor: pointer;\r
  display: inline-flex;\r
  align-items: center;\r
  justify-content: center;\r
  min-width: 156px;\r
  min-height: 52px;\r
  padding: 0 26px;\r
  border-radius: 18px;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 14px;\r
  font-weight: 900;\r
  letter-spacing: .08em;\r
  text-decoration: none;\r
}\r
\r
.btn.solid {\r
  border: 2px solid #fff;\r
  background: #fff;\r
  color: #111;\r
  box-shadow: 0 14px 30px rgba(0,0,0,.18);\r
}\r
\r
.btn.outline {\r
  border: 2px solid rgba(255,255,255,.92);\r
  background: rgba(255,255,255,.16);\r
  color: #fff;\r
  backdrop-filter: blur(10px);\r
}\r
\r
.btn.dark {\r
  border-color: #111;\r
  color: #111;\r
  background: rgba(255,255,255,.45);\r
}\r
\r
.btn.compact {\r
  min-width: auto;\r
  min-height: 38px;\r
  padding: 0 16px;\r
  border-radius: 999px;\r
  font-size: 12px;\r
  letter-spacing: .06em;\r
}\r
\r
.card-swap-stage {\r
  position: relative;\r
  min-height: 620px;\r
  overflow: visible;\r
}\r
\r
.card-swap-container {\r
  position: absolute;\r
  right: 0;\r
  bottom: 34px;\r
  width: min(760px, 56vw);\r
  height: min(520px, 42vw);\r
  perspective: 1100px;\r
  transform-style: preserve-3d;\r
  overflow: visible;\r
}\r
\r
.swap-card {\r
  position: absolute;\r
  top: 50%;\r
  left: 50%;\r
  width: min(760px, 56vw);\r
  height: min(520px, 42vw);\r
  margin: 0;\r
  overflow: hidden;\r
  border: 1px solid rgba(0,0,0,.34);\r
  border-radius: 28px;\r
  background: #0b0b0b;\r
  box-shadow: 0 36px 86px rgba(0,0,0,.34);\r
  transform-style: preserve-3d;\r
  backface-visibility: hidden;\r
  will-change: transform, opacity;\r
  cursor: pointer;\r
}\r
\r
.swap-card::after {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  background: linear-gradient(180deg, transparent 52%, rgba(0,0,0,.58));\r
  pointer-events: none;\r
}\r
\r
.swap-card img {\r
  width: 100%;\r
  height: 100%;\r
  border-radius: inherit;\r
  object-fit: cover;\r
}\r
\r
.swap-card-caption {\r
  position: absolute;\r
  left: 34px;\r
  bottom: 30px;\r
  z-index: 2;\r
  display: grid;\r
  gap: 6px;\r
  color: #fff;\r
  text-shadow: 0 2px 18px rgba(0,0,0,.42);\r
}\r
\r
.swap-card-caption span {\r
  width: max-content;\r
  padding: 5px 10px;\r
  border-radius: 999px;\r
  background: rgba(255,255,255,.18);\r
  font-family: "Microsoft YaHei";\r
  font-size: 13px;\r
  font-weight: 900;\r
}\r
\r
.swap-card-caption strong {\r
  font-size: clamp(40px, 4.8vw, 76px);\r
  font-weight: 1000;\r
  line-height: .9;\r
}\r
\r
.swap-card-caption small {\r
  font-family: "Microsoft YaHei";\r
  font-size: 16px;\r
  font-weight: 800;\r
}\r
\r
.dark-caption {\r
  color: #14100a;\r
  text-shadow: 0 1px 12px rgba(255,255,255,.3);\r
}\r
\r
.card-swap-container.is-paused .swap-card {\r
  transition-duration: .2s;\r
}\r
\r
.light-section {\r
  position: relative;\r
  overflow: hidden;\r
  min-height: 760px;\r
  padding: clamp(84px, 9vw, 126px) 42px;\r
  background:\r
    linear-gradient(90deg, rgba(201, 35, 30, .045) 1px, transparent 1px),\r
    linear-gradient(0deg, rgba(11, 79, 92, .045) 1px, transparent 1px),\r
    linear-gradient(135deg, #eff8ff 0%, #e6f4fb 46%, #fff2df 100%);\r
  background-size: 34px 34px, 34px 34px, auto;\r
}\r
\r
.light-section::before {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  background:\r
    linear-gradient(90deg, rgba(7, 7, 7, .035), transparent 18%, transparent 82%, rgba(7, 7, 7, .035)),\r
    repeating-linear-gradient(115deg, rgba(255, 255, 255, .2) 0 1px, transparent 1px 7px);\r
  opacity: .65;\r
  pointer-events: none;\r
}\r
\r
.split-layout {\r
  display: grid;\r
  grid-template-columns: minmax(400px, 1.06fr) minmax(360px, .84fr);\r
  align-items: center;\r
  gap: clamp(54px, 7vw, 104px);\r
  max-width: 1320px;\r
  margin: 0 auto;\r
}\r
\r
.reveal-slot {\r
  margin: 0;\r
  min-width: 0;\r
}\r
\r
.reveal-slot .scroll-reveal-content {\r
  overflow: visible;\r
}\r
\r
.feature-poster-reveal,\r
.entry-card-reveal {\r
  display: block;\r
}\r
\r
.entry-card-reveal,\r
.entry-card-reveal .entry-card {\r
  width: 100%;\r
  height: 100%;\r
}\r
\r
.quick-entry-reveal {\r
  display: block;\r
  max-width: 1380px;\r
  margin: 0 auto;\r
}\r
\r
.section-copy h2,\r
.section-copy .spotlight-reveal-text,\r
.section-head h2,\r
.page-hero h1 {\r
  font-size: clamp(48px, 5.4vw, 92px);\r
  line-height: 1.05;\r
}\r
\r
.spotlight-reveal {\r
  margin: 0 0 22px;\r
}\r
\r
.spotlight-reveal-text {\r
  position: relative;\r
  max-width: 820px;\r
  color: #111817;\r
  font-family: var(--display-cn);\r
  letter-spacing: .03em;\r
  text-wrap: balance;\r
  text-shadow:\r
    0 1px 0 rgba(255, 255, 255, .65),\r
    8px 12px 0 rgba(244, 180, 63, .16),\r
    -6px -8px 0 rgba(201, 35, 30, .08);\r
}\r
\r
.spotlight-reveal-text::after {\r
  content: "";\r
  display: block;\r
  width: min(260px, 44%);\r
  height: 8px;\r
  margin-top: 20px;\r
  border-radius: 999px;\r
  background: linear-gradient(90deg, #c9231e, #f4b43f 72%, transparent);\r
  box-shadow: 0 10px 24px rgba(201, 35, 30, .18);\r
}\r
\r
.spotlight-reveal-text .word {\r
  will-change: opacity, filter, transform;\r
}\r
\r
.section-copy > p:not(.stamp) {\r
  position: relative;\r
  max-width: 680px;\r
  padding-left: 18px;\r
  border-left: 4px solid rgba(201, 35, 30, .76);\r
}\r
\r
.feature-poster {\r
  position: relative;\r
  margin: 0 auto;\r
  width: 100%;\r
  max-width: 470px;\r
  aspect-ratio: 4 / 5;\r
  border-radius: 30px;\r
  overflow: hidden;\r
  transform: rotate(3.5deg);\r
  border: 2px solid rgba(11, 18, 20, .68);\r
  box-shadow:\r
    18px 20px 0 rgba(201, 35, 30, .14),\r
    -18px -18px 0 rgba(244, 180, 63, .16),\r
    0 30px 70px rgba(0,0,0,.24);\r
  background: #111;\r
}\r
\r
.feature-poster::before {\r
  content: "";\r
  position: absolute;\r
  inset: 16px;\r
  z-index: 2;\r
  border: 1px solid rgba(255, 238, 186, .54);\r
  border-radius: 22px;\r
  pointer-events: none;\r
}\r
\r
.feature-poster::after {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  z-index: 1;\r
  background:\r
    linear-gradient(180deg, rgba(0, 0, 0, .02) 34%, rgba(0, 0, 0, .62)),\r
    linear-gradient(115deg, rgba(244, 180, 63, .26), transparent 34%, rgba(30, 156, 255, .18));\r
  pointer-events: none;\r
}\r
\r
.feature-poster img {\r
  width: 100%;\r
  height: 100%;\r
  object-fit: cover;\r
}\r
\r
.feature-poster figcaption {\r
  position: absolute;\r
  left: 34px;\r
  bottom: 32px;\r
  z-index: 3;\r
  display: grid;\r
  gap: 6px;\r
  color: #fff;\r
}\r
\r
.feature-poster strong {\r
  font-family: var(--display-cn);\r
  font-size: clamp(38px, 4vw, 58px);\r
  font-weight: 900;\r
  letter-spacing: .04em;\r
  text-shadow: 0 4px 18px rgba(0, 0, 0, .48);\r
}\r
.feature-poster span { font-family: "Microsoft YaHei"; font-weight: 800; }\r
\r
.heritage-story-section {\r
  position: relative;\r
  overflow: hidden;\r
  padding: clamp(86px, 9vw, 130px) 42px;\r
  background:\r
    radial-gradient(circle at 8% 18%, rgba(244, 180, 63, .22), transparent 28%),\r
    radial-gradient(circle at 88% 8%, rgba(216, 58, 46, .16), transparent 30%),\r
    linear-gradient(180deg, #fff7e8 0%, #edf8ff 100%);\r
}\r
\r
.heritage-story-section::before {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  background:\r
    linear-gradient(90deg, rgba(7, 7, 7, .04) 1px, transparent 1px),\r
    linear-gradient(0deg, rgba(7, 7, 7, .035) 1px, transparent 1px);\r
  background-size: 42px 42px;\r
  opacity: .7;\r
  pointer-events: none;\r
}\r
\r
.heritage-story-section::after {\r
  content: "";\r
  position: absolute;\r
  inset: auto 0 0;\r
  height: 36%;\r
  background: linear-gradient(0deg, rgba(237, 248, 255, .92), rgba(237, 248, 255, 0));\r
  pointer-events: none;\r
}\r
\r
.story-head,\r
.story-gallery,\r
.inheritance-panel,\r
.inheritance-list {\r
  position: relative;\r
  z-index: 1;\r
}\r
\r
.scroll-float-container {\r
  margin: 0;\r
  overflow: hidden;\r
}\r
\r
.scroll-float-text {\r
  display: inline-block;\r
  font: inherit;\r
  line-height: inherit;\r
}\r
\r
.scroll-float-char {\r
  display: inline-block;\r
  will-change: opacity, transform;\r
}\r
\r
.story-head {\r
  max-width: 1120px;\r
  margin: 0 auto 42px;\r
  text-align: center;\r
}\r
\r
.story-head p:not(.label-tag) {\r
  margin-inline: auto;\r
}\r
\r
.story-gallery {\r
  height: clamp(420px, 48vw, 620px);\r
  width: min(1480px, 100%);\r
  margin: -4px auto 0;\r
  overflow: hidden;\r
  border-radius: 34px;\r
  background:\r
    radial-gradient(circle at 50% 14%, rgba(244, 180, 63, .18), transparent 40%),\r
    linear-gradient(180deg, rgba(255, 255, 255, .34), rgba(255, 255, 255, .06));\r
  mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);\r
}\r
\r
.story-gallery::before,\r
.story-gallery::after {\r
  content: "";\r
  position: absolute;\r
  z-index: 2;\r
  pointer-events: none;\r
}\r
\r
.story-gallery::before {\r
  inset: 0;\r
  border: 1px solid rgba(255, 255, 255, .55);\r
  border-radius: inherit;\r
  box-shadow:\r
    inset 0 1px 0 rgba(255, 255, 255, .58),\r
    inset 0 -70px 120px rgba(237, 248, 255, .4);\r
}\r
\r
.story-gallery::after {\r
  right: clamp(18px, 4vw, 54px);\r
  bottom: clamp(16px, 3vw, 36px);\r
  min-height: 34px;\r
  padding: 8px 13px;\r
  border: 1px solid rgba(7, 7, 7, .14);\r
  border-radius: 999px;\r
  background: rgba(255, 255, 255, .58);\r
  color: rgba(7, 7, 7, .68);\r
  content: "拖拽 / 滚轮浏览";\r
  font-family: var(--body-cn);\r
  font-size: 13px;\r
  font-weight: 900;\r
  backdrop-filter: blur(14px);\r
}\r
\r
.inheritance-glow-card {\r
  width: 100%;\r
  height: 100%;\r
}\r
\r
.inheritance-glow-card {\r
  border-color: rgba(255, 255, 255, .16);\r
}\r
\r
.inheritance-list strong {\r
  color: var(--red);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 15px;\r
  font-weight: 1000;\r
  letter-spacing: .12em;\r
}\r
\r
.inheritance-section p,\r
.inheritance-list span {\r
  color: rgba(7, 7, 7, .7);\r
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;\r
  font-size: 16px;\r
  line-height: 1.78;\r
}\r
\r
.inheritance-section {\r
  display: grid;\r
  grid-template-columns: minmax(420px, 1.1fr) minmax(360px, .9fr);\r
  gap: 28px;\r
  padding: 88px 42px;\r
  background:\r
    linear-gradient(135deg, rgba(8, 8, 8, .98), rgba(27, 21, 14, .98)),\r
    #080808;\r
  color: #fff;\r
}\r
\r
.inheritance-panel,\r
.inheritance-list {\r
  width: 100%;\r
  max-width: 780px;\r
}\r
\r
.inheritance-panel {\r
  justify-self: end;\r
  padding: 36px;\r
  border: 1px solid rgba(255, 255, 255, .18);\r
  border-radius: 34px;\r
  background:\r
    radial-gradient(circle at 0% 0%, rgba(244, 180, 63, .18), transparent 35%),\r
    rgba(255, 255, 255, .07);\r
}\r
\r
.inheritance-panel h2 {\r
  margin: 0 0 22px;\r
  color: #fff;\r
  font-family: var(--display-cn);\r
  font-size: clamp(42px, 4.8vw, 78px);\r
  line-height: 1.05;\r
}\r
\r
.inheritance-panel p:not(.stamp) {\r
  max-width: 720px;\r
  color: rgba(255, 255, 255, .72);\r
}\r
\r
.inheritance-list {\r
  display: grid;\r
  gap: 16px;\r
  align-content: center;\r
}\r
\r
.inheritance-card {\r
  display: grid;\r
  grid-template-columns: 92px 1fr;\r
  gap: 18px;\r
  align-items: start;\r
  padding: 24px;\r
}\r
\r
.inheritance-list strong {\r
  color: var(--gold);\r
  font-size: 20px;\r
}\r
\r
.inheritance-list span {\r
  color: rgba(255, 255, 255, .7);\r
}\r
\r
.inheritance-motion-section {\r
  position: relative;\r
  height: clamp(420px, 58vh, 680px);\r
  min-height: 420px;\r
  overflow: hidden;\r
  background:\r
    radial-gradient(circle at 18% 0%, rgba(216, 58, 46, .2), transparent 36%),\r
    linear-gradient(180deg, #120c08 0%, #050505 100%);\r
  isolation: isolate;\r
}\r
\r
.inheritance-motion-section::before,\r
.inheritance-motion-section::after {\r
  content: "";\r
  position: absolute;\r
  left: 0;\r
  right: 0;\r
  z-index: 4;\r
  height: 150px;\r
  pointer-events: none;\r
}\r
\r
.inheritance-motion-section::before {\r
  top: 0;\r
  background: linear-gradient(180deg, rgba(8, 8, 8, .98), rgba(8, 8, 8, 0));\r
}\r
\r
.inheritance-motion-section::after {\r
  bottom: 0;\r
  background: linear-gradient(0deg, rgba(5, 5, 5, 1), rgba(5, 5, 5, 0));\r
}\r
\r
.border-glow {\r
  position: relative;\r
  isolation: isolate;\r
  display: grid;\r
  border: 1px solid rgba(255, 255, 255, .15);\r
  transform: translate3d(0, 0, .01px);\r
  box-shadow:\r
    rgba(0, 0, 0, .1) 0 1px 2px,\r
    rgba(0, 0, 0, .1) 0 2px 4px,\r
    rgba(0, 0, 0, .1) 0 4px 8px,\r
    rgba(0, 0, 0, .1) 0 8px 16px,\r
    rgba(0, 0, 0, .1) 0 16px 32px,\r
    rgba(0, 0, 0, .1) 0 32px 64px;\r
}\r
\r
.border-glow-border,\r
.border-glow-fill {\r
  position: absolute;\r
  inset: 0;\r
  z-index: 0;\r
  border-radius: inherit;\r
  pointer-events: none;\r
}\r
\r
.border-glow-fill {\r
  mix-blend-mode: soft-light;\r
}\r
\r
.border-glow-outer {\r
  position: absolute;\r
  z-index: 1;\r
  border-radius: inherit;\r
  pointer-events: none;\r
  mix-blend-mode: plus-lighter;\r
}\r
\r
.border-glow-shadow {\r
  position: absolute;\r
  border-radius: inherit;\r
}\r
\r
.border-glow-content {\r
  position: relative;\r
  z-index: 2;\r
  display: flex;\r
  flex-direction: column;\r
  overflow: visible;\r
  border-radius: inherit;\r
}\r
\r
.dark-section {\r
  padding: 96px 42px 112px;\r
  background: #080808;\r
  color: #fff;\r
}\r
\r
.center { text-align: center; margin-inline: auto; }\r
.center .label-tag { background: transparent; color: #fff; }\r
.dark-section h2 { color: #fff; }\r
\r
.entry-grid {\r
  display: grid;\r
  grid-template-columns: repeat(3, minmax(0, 1fr));\r
  gap: 20px;\r
  max-width: 1380px;\r
  margin: 36px auto 0;\r
}\r
\r
.entry-card {\r
  width: 100%;\r
  border: 0;\r
  text-align: left;\r
  cursor: pointer;\r
  min-height: 270px;\r
  padding: 28px;\r
  border: 1px solid rgba(255,255,255,.22);\r
  border-radius: 28px;\r
  background: linear-gradient(145deg, rgba(255,255,255,.12), rgba(255,255,255,.04));\r
  color: #fff;\r
  text-decoration: none;\r
  transition: transform .22s ease, background .22s ease;\r
}\r
\r
.entry-card:hover { transform: translateY(-8px); background: rgba(255,255,255,.15); }\r
.entry-card span { color: var(--gold); font-size: 18px; font-weight: 1000; }\r
.entry-card h3 { margin: 44px 0 12px; font-size: 34px; }\r
.entry-card p { color: rgba(255,255,255,.7); }\r
\r
.curved-heritage-section {\r
  position: relative;\r
  overflow: hidden;\r
  padding: clamp(92px, 9vw, 136px) 42px clamp(104px, 10vw, 150px);\r
  background:\r
    radial-gradient(circle at 22% 18%, rgba(216, 58, 46, .16), transparent 32%),\r
    radial-gradient(circle at 78% 72%, rgba(244, 180, 63, .12), transparent 36%),\r
    #050505;\r
}\r
\r
.curved-heritage-section::before {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  background:\r
    linear-gradient(90deg, rgba(255, 255, 255, .035) 1px, transparent 1px),\r
    linear-gradient(0deg, rgba(255, 255, 255, .025) 1px, transparent 1px);\r
  background-size: 42px 42px;\r
  mask-image: linear-gradient(180deg, transparent, black 18%, black 82%, transparent);\r
  pointer-events: none;\r
}\r
\r
.curved-heritage-copy,\r
.curved-loop,\r
.curved-heritage-notes {\r
  position: relative;\r
  z-index: 1;\r
}\r
\r
.curved-heritage-copy {\r
  max-width: 1020px;\r
  margin: 0 auto 18px;\r
  text-align: center;\r
}\r
\r
.curved-heritage-copy .label-tag {\r
  border-color: rgba(255, 255, 255, .34);\r
  background: rgba(255, 255, 255, .08);\r
  color: #fff;\r
}\r
\r
.curved-heritage-copy h2 {\r
  margin: 0;\r
  color: #fff;\r
  font-family: var(--display-cn);\r
  font-size: clamp(48px, 6.2vw, 108px);\r
  font-weight: 900;\r
  line-height: 1.05;\r
  text-wrap: balance;\r
}\r
\r
.curved-heritage-copy p:not(.label-tag) {\r
  max-width: 860px;\r
  margin: 28px auto 0;\r
  color: rgba(255, 255, 255, .68);\r
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;\r
  font-size: 17px;\r
  line-height: 1.78;\r
}\r
\r
.curved-loop {\r
  display: flex;\r
  align-items: center;\r
  justify-content: center;\r
  width: min(1440px, 100%);\r
  min-height: 280px;\r
  margin: 6px auto 22px;\r
  user-select: none;\r
  touch-action: pan-y;\r
}\r
\r
.curved-loop-svg {\r
  display: block;\r
  width: 100%;\r
  overflow: visible;\r
  aspect-ratio: 100 / 12;\r
}\r
\r
.curved-loop-measure {\r
  visibility: hidden;\r
  opacity: 0;\r
  pointer-events: none;\r
}\r
\r
.curved-loop-text {\r
  fill: rgba(255, 255, 255, .92);\r
  font-family: var(--display-cn);\r
  font-size: clamp(58px, 8vw, 122px);\r
  font-weight: 900;\r
  letter-spacing: .08em;\r
  text-transform: none;\r
  paint-order: stroke;\r
  stroke: rgba(244, 180, 63, .08);\r
  stroke-width: 1px;\r
  filter: drop-shadow(0 16px 26px rgba(0, 0, 0, .28));\r
}\r
\r
.curved-heritage-marquee {\r
  fill: rgba(255, 255, 255, .92);\r
}\r
\r
.curved-heritage-notes {\r
  display: grid;\r
  grid-template-columns: repeat(3, minmax(0, 1fr));\r
  gap: 18px;\r
  max-width: 1240px;\r
  margin: 0 auto;\r
}\r
\r
.curved-heritage-notes button {\r
  min-height: 178px;\r
  padding: 28px;\r
  border: 1px solid rgba(255, 255, 255, .16);\r
  border-radius: 28px;\r
  background: linear-gradient(145deg, rgba(255, 255, 255, .1), rgba(255, 255, 255, .035));\r
  color: #fff;\r
  cursor: pointer;\r
  text-align: left;\r
  transition: transform .22s ease, border-color .22s ease, background .22s ease;\r
}\r
\r
.curved-heritage-notes button:hover {\r
  transform: translateY(-6px);\r
  border-color: rgba(244, 180, 63, .42);\r
  background: linear-gradient(145deg, rgba(244, 180, 63, .13), rgba(255, 255, 255, .055));\r
}\r
\r
.curved-heritage-notes span {\r
  color: var(--gold);\r
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;\r
  font-size: 18px;\r
  font-weight: 1000;\r
  letter-spacing: .08em;\r
}\r
\r
.curved-heritage-notes p {\r
  margin: 18px 0 0;\r
  color: rgba(255, 255, 255, .68);\r
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;\r
  font-size: 15px;\r
  line-height: 1.7;\r
}\r
\r
.page-hero {\r
  display: grid;\r
  grid-template-columns: minmax(420px, .95fr) minmax(320px, .48fr);\r
  align-items: center;\r
  gap: 54px;\r
  background: #e8f5ff;\r
}\r
\r
.compact-hero {\r
  min-height: 640px;\r
  padding-bottom: 118px;\r
  background:\r
    radial-gradient(circle at 76% 34%, rgba(255, 255, 255, .9), transparent 30%),\r
    radial-gradient(circle at 18% 72%, rgba(30, 156, 255, .12), transparent 32%),\r
    linear-gradient(180deg, #e8f5ff 0%, #eaf6fb 68%, #dfedf3 100%);\r
}\r
\r
.compact-hero::after {\r
  content: "";\r
  position: absolute;\r
  left: 0;\r
  right: 0;\r
  bottom: -1px;\r
  z-index: 0;\r
  height: clamp(150px, 20vh, 230px);\r
  background:\r
    radial-gradient(ellipse at 50% 100%, rgba(255, 255, 255, .72), transparent 64%),\r
    linear-gradient(180deg, rgba(232, 245, 255, 0) 0%, rgba(223, 237, 243, .72) 56%, #dcebf1 100%);\r
  pointer-events: none;\r
}\r
\r
.compact-hero .page-hero-image {\r
  width: min(38vw, 460px);\r
  justify-self: center;\r
}\r
.projects-hero { min-height: 620px; grid-template-columns: 1fr; background: linear-gradient(135deg, #e8f5ff, #fff1d9); }\r
\r
.graph-scan-hero {\r
  display: flex;\r
  align-items: center;\r
  width: 100vw;\r
  margin-left: calc(50% - 50vw);\r
  margin-right: calc(50% - 50vw);\r
  min-height: 100vh !important;\r
  min-height: 100svh !important;\r
  isolation: isolate;\r
  overflow: hidden;\r
  clip-path: inset(0);\r
  background:\r
    radial-gradient(circle at 16% 26%, rgba(232, 245, 255, .86), transparent 34%),\r
    radial-gradient(circle at 86% 24%, rgba(255, 241, 217, .84), transparent 36%),\r
    linear-gradient(135deg, #dff2ff 0%, #fff6e8 58%, #f7e4c8 100%);\r
}\r
\r
.graph-scan-background {\r
  position: absolute;\r
  inset: 0;\r
  width: 100%;\r
  height: 100%;\r
  min-height: 100vh;\r
  overflow: hidden;\r
  pointer-events: auto;\r
  opacity: .74;\r
  mix-blend-mode: multiply;\r
  filter: saturate(1.22) contrast(1.08);\r
  transform: none;\r
}\r
\r
.graph-scan-background::before,\r
.graph-scan-background::after {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  pointer-events: none;\r
}\r
\r
.graph-scan-background::before {\r
  z-index: 1;\r
  background:\r
    linear-gradient(90deg, rgba(223, 242, 255, .86), rgba(255, 250, 241, .62) 47%, rgba(255, 227, 183, .76)),\r
    radial-gradient(circle at 70% 38%, rgba(255, 159, 252, .16), transparent 36%);\r
}\r
\r
.graph-scan-background::after {\r
  z-index: 2;\r
  background:\r
    linear-gradient(rgba(47, 41, 58, .045) 1px, transparent 1px),\r
    linear-gradient(90deg, rgba(47, 41, 58, .045) 1px, transparent 1px);\r
  background-size: 28px 28px;\r
  mask-image: linear-gradient(180deg, rgba(0,0,0,.88), rgba(0,0,0,.45));\r
}\r
\r
.graph-scan-background > *,\r
.graph-scan-canvas {\r
  position: absolute;\r
  inset: 0;\r
  z-index: 0;\r
  width: 100% !important;\r
  height: 100% !important;\r
  min-width: 100%;\r
  min-height: 100%;\r
}\r
\r
.graph-scan-background canvas {\r
  display: block;\r
  width: 100% !important;\r
  height: 100% !important;\r
  min-width: 100%;\r
  min-height: 100%;\r
}\r
\r
.graph-scan-copy {\r
  position: relative;\r
  z-index: 1;\r
  max-width: min(1120px, 92vw);\r
}\r
\r
.graph-scan-copy h1 {\r
  max-width: 960px;\r
  font-size: clamp(56px, 7vw, 116px);\r
  line-height: 1.04;\r
  text-shadow: 0 1px 0 rgba(255,255,255,.36), 0 22px 56px rgba(62, 64, 76, .14);\r
}\r
\r
.graph-scan-copy p:not(.label-tag) {\r
  max-width: 760px;\r
}\r
\r
.top-entry-actions {\r
  display: flex;\r
  flex-wrap: wrap;\r
  align-items: center;\r
  gap: 10px 14px;\r
  margin-top: 24px;\r
}\r
\r
.top-entry-actions span {\r
  color: rgba(7, 7, 7, .54);\r
  font-family: var(--body-cn);\r
  font-size: 13px;\r
  font-weight: 700;\r
  letter-spacing: .04em;\r
}\r
\r
.graph-entry-btn.btn.compact,\r
.favorite-entry-btn.btn.compact,\r
.favorite-checkin-btn.btn.compact {\r
  min-height: 36px;\r
  padding-inline: 15px;\r
  border-width: 1px;\r
  box-shadow: 0 10px 22px rgba(13, 74, 124, .12);\r
}\r
\r
.graph-entry-btn.btn.solid,\r
.favorite-entry-btn.btn.solid {\r
  background: rgba(255, 255, 255, .86);\r
  color: #111;\r
}\r
\r
.favorite-checkin-btn.btn.outline {\r
  border-color: rgba(7, 7, 7, .22);\r
  background: rgba(255, 255, 255, .3);\r
  color: #17110d;\r
}\r
\r
.graph-board-page.canvas-transitioning {\r
  overflow: hidden;\r
}\r
\r
.graph-board-page.canvas-transitioning .graph-canvas-entry,\r
.graph-board-page.canvas-transitioning .table-toolbar {\r
  opacity: 0;\r
  pointer-events: none;\r
}\r
\r
.graph-canvas-expansion {\r
  --canvas-transition-x: 50%;\r
  --canvas-transition-y: 50%;\r
  position: fixed;\r
  inset: 0;\r
  z-index: 80;\r
  overflow: hidden;\r
  background:\r
    radial-gradient(circle at var(--canvas-transition-x) var(--canvas-transition-y), rgba(255,255,255,.98), rgba(255,248,234,.9) 34%, rgba(226,246,255,.9) 68%),\r
    linear-gradient(135deg, #eaf7ff 0%, #fff8eb 54%, #f7ead7 100%);\r
  clip-path: circle(112px at var(--canvas-transition-x) var(--canvas-transition-y));\r
  animation: graphCanvasExpand .92s cubic-bezier(.17, .82, .18, 1) forwards;\r
  pointer-events: none;\r
  will-change: clip-path;\r
}\r
\r
.graph-canvas-expansion::before {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  z-index: 1;\r
  background:\r
    radial-gradient(circle at var(--canvas-transition-x) var(--canvas-transition-y), rgba(244, 180, 63, .36), transparent 24%),\r
    linear-gradient(rgba(47, 41, 58, .05) 1px, transparent 1px),\r
    linear-gradient(90deg, rgba(47, 41, 58, .045) 1px, transparent 1px);\r
  background-size: auto, 28px 28px, 28px 28px;\r
  animation: graphCanvasGridFade .92s ease forwards;\r
}\r
\r
.graph-canvas-expansion::after {\r
  content: "";\r
  position: absolute;\r
  left: var(--canvas-transition-x);\r
  top: var(--canvas-transition-y);\r
  z-index: 3;\r
  width: 92px;\r
  height: 92px;\r
  border: 1px solid rgba(244, 180, 63, .7);\r
  border-radius: 999px;\r
  box-shadow:\r
    0 0 0 18px rgba(244, 180, 63, .13),\r
    0 0 64px rgba(216, 58, 46, .2);\r
  transform: translate(-50%, -50%) scale(.72);\r
  animation: graphCanvasPulse .62s ease-out forwards;\r
}\r
\r
.graph-canvas-expansion-preview {\r
  position: absolute;\r
  inset: 0;\r
  z-index: 2;\r
  display: grid;\r
  place-items: center;\r
  opacity: 0;\r
  transform: scale(1.06);\r
  filter: blur(12px) saturate(.9);\r
  transform-origin: var(--canvas-transition-x) var(--canvas-transition-y);\r
  animation: graphCanvasReveal .68s cubic-bezier(.2, .72, .22, 1) .22s forwards;\r
}\r
\r
.graph-canvas-expansion-preview svg {\r
  width: min(100vw, 1900px);\r
  height: min(100vh, 920px);\r
}\r
\r
.graph-canvas-expansion-preview .graph-node circle:first-child {\r
  filter: drop-shadow(0 18px 20px rgba(40, 28, 16, .2));\r
}\r
\r
.graph-canvas-expansion-preview .graph-node text {\r
  fill: #fff;\r
  font-size: 12px;\r
  font-weight: 1000;\r
  paint-order: stroke;\r
  stroke: rgba(7, 7, 7, .62);\r
  stroke-width: 3px;\r
}\r
\r
@keyframes graphCanvasExpand {\r
  0% {\r
    clip-path: circle(112px at var(--canvas-transition-x) var(--canvas-transition-y));\r
  }\r
  48% {\r
    clip-path: circle(38vmax at var(--canvas-transition-x) var(--canvas-transition-y));\r
  }\r
  100% {\r
    clip-path: circle(150vmax at var(--canvas-transition-x) var(--canvas-transition-y));\r
  }\r
}\r
\r
@keyframes graphCanvasReveal {\r
  0% {\r
    opacity: 0;\r
    transform: scale(1.06);\r
    filter: blur(12px) saturate(.9);\r
  }\r
  44% {\r
    opacity: .62;\r
  }\r
  100% {\r
    opacity: 1;\r
    transform: scale(1);\r
    filter: blur(0) saturate(1);\r
  }\r
}\r
\r
@keyframes graphCanvasGridFade {\r
  0% {\r
    opacity: .34;\r
    transform: scale(.86);\r
  }\r
  62% {\r
    opacity: .74;\r
  }\r
  100% {\r
    opacity: .2;\r
    transform: scale(1.04);\r
  }\r
}\r
\r
@keyframes graphCanvasPulse {\r
  0% {\r
    opacity: 1;\r
    transform: translate(-50%, -50%) scale(.72);\r
  }\r
  100% {\r
    opacity: 0;\r
    transform: translate(-50%, -50%) scale(7.6);\r
  }\r
}\r
\r
.about-hero { background: #f2eadb; }\r
\r
.favorites-top-hero {\r
  min-height: auto;\r
  padding-top: 100px;\r
  padding-bottom: 32px;\r
}\r
\r
.page-hero-image {\r
  margin: 0;\r
  overflow: hidden;\r
  border-radius: 34px;\r
  transform: rotate(5deg);\r
  border: 2px solid #111;\r
  box-shadow: 0 28px 72px rgba(0,0,0,.24);\r
}\r
\r
.favorites-hero-stack {\r
  position: relative;\r
  width: min(31vw, 430px);\r
  height: min(40vw, 540px);\r
  justify-self: center;\r
  transform: rotate(3deg);\r
  isolation: isolate;\r
}\r
\r
.favorites-hero-stack::before,\r
.favorites-hero-stack::after {\r
  content: "";\r
  position: absolute;\r
  border-radius: 999px;\r
  pointer-events: none;\r
  z-index: -1;\r
}\r
\r
.favorites-hero-stack::before {\r
  inset: -18% -14% auto auto;\r
  width: 54%;\r
  aspect-ratio: 1;\r
  background: radial-gradient(circle, rgba(216, 58, 46, .26), transparent 68%);\r
  filter: blur(10px);\r
  animation: favoriteStackPulse 5.6s ease-in-out infinite alternate;\r
}\r
\r
.favorites-hero-stack::after {\r
  left: -18%;\r
  bottom: -12%;\r
  width: 62%;\r
  aspect-ratio: 1;\r
  background: radial-gradient(circle, rgba(244, 180, 63, .24), transparent 70%);\r
  filter: blur(12px);\r
  animation: favoriteStackPulse 6.8s ease-in-out infinite alternate-reverse;\r
}\r
\r
.favorites-hero-stack .stack-card {\r
  border: 1px solid rgba(255, 255, 255, .46);\r
  border-radius: 30px;\r
  box-shadow:\r
    0 28px 70px rgba(45, 31, 20, .22),\r
    0 0 0 1px rgba(216, 58, 46, .08),\r
    inset 0 0 0 1px rgba(255, 255, 255, .2);\r
}\r
\r
@keyframes favoriteStackPulse {\r
  from { transform: translate3d(0, 0, 0) scale(.94); opacity: .66; }\r
  to { transform: translate3d(10px, -12px, 0) scale(1.06); opacity: .96; }\r
}\r
\r
@keyframes browseContentRise {\r
  0% {\r
    opacity: 0;\r
    filter: blur(18px);\r
    transform: translateY(58px) scale(.985);\r
  }\r
\r
  55% {\r
    opacity: .9;\r
    filter: blur(5px);\r
  }\r
\r
  100% {\r
    opacity: 1;\r
    filter: blur(0);\r
    transform: translateY(0) scale(1);\r
  }\r
}\r
\r
.regions-page-section {\r
  position: relative;\r
  z-index: 1;\r
  margin-top: -82px;\r
  padding: 104px 42px 96px;\r
  overflow: hidden;\r
  background:\r
    radial-gradient(circle at 22% 0%, rgba(255, 255, 255, .82), transparent 28%),\r
    radial-gradient(circle at 72% 6%, rgba(244, 180, 63, .12), transparent 26%),\r
    linear-gradient(180deg, #dcebf1 0%, #bfd1d4 18%, #263030 48%, #080808 100%);\r
  isolation: isolate;\r
}\r
\r
.regions-page-section::before {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  z-index: 0;\r
  background:\r
    linear-gradient(90deg, rgba(255, 255, 255, .04) 1px, transparent 1px),\r
    linear-gradient(0deg, rgba(255, 255, 255, .03) 1px, transparent 1px);\r
  background-size: 36px 36px;\r
  mask-image: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.55) 22%, #000 100%);\r
  pointer-events: none;\r
}\r
\r
.regions-page-section > * {\r
  position: relative;\r
  z-index: 1;\r
}\r
\r
.regions-page-section .filter-panel,\r
.regions-page-section .heritage-list-state,\r
.regions-page-section .masonry-container {\r
  animation: browseContentRise .86s cubic-bezier(.2, .84, .2, 1) both;\r
  animation-timeline: view();\r
  animation-range: entry 0% cover 28%;\r
  will-change: opacity, filter, transform;\r
}\r
\r
.explore-search {\r
  display: grid;\r
  grid-template-columns: auto minmax(0, 1fr) auto auto;\r
  align-items: center;\r
  gap: 10px;\r
  max-width: 1380px;\r
  margin: 0 auto 14px;\r
  padding: 10px 12px 10px 18px;\r
  border: 1px solid rgba(13, 26, 24, .12);\r
  border-radius: 999px;\r
  background: rgba(236, 247, 241, .92);\r
  box-shadow: 0 18px 46px rgba(15, 43, 38, .16);\r
  backdrop-filter: blur(18px);\r
}\r
\r
.explore-search-icon {\r
  display: inline-flex;\r
  color: #7a4a2a;\r
}\r
\r
.explore-search input {\r
  min-width: 0;\r
  min-height: 40px;\r
  border: 0;\r
  background: transparent;\r
  color: #17261f;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 15px;\r
  font-weight: 800;\r
}\r
\r
.explore-search input:focus {\r
  outline: none;\r
}\r
\r
.explore-search-clear {\r
  width: 30px;\r
  height: 30px;\r
  border: 1px solid rgba(20, 45, 40, .18);\r
  border-radius: 50%;\r
  background: rgba(255, 255, 255, .9);\r
  color: #17261f;\r
  font-size: 18px;\r
  line-height: 1;\r
  cursor: pointer;\r
}\r
\r
.explore-search-submit {\r
  min-height: 42px;\r
  padding: 0 22px;\r
  border: 0;\r
  border-radius: 999px;\r
  background: linear-gradient(135deg, #d83a2e, #f4b43f);\r
  color: #fff;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 1000;\r
  cursor: pointer;\r
  box-shadow: 0 12px 26px rgba(216, 58, 46, .24);\r
}\r
\r
.explore-search-summary {\r
  display: flex;\r
  flex-wrap: wrap;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 10px;\r
  max-width: 1380px;\r
  margin: 0 auto 14px;\r
  padding: 0 6px;\r
  color: rgba(23, 38, 31, .72);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 13px;\r
  font-weight: 800;\r
}\r
\r
.explore-search-summary strong {\r
  color: #9a3328;\r
  font-size: 16px;\r
}\r
\r
.explore-search-summary button,\r
.explore-search-reset {\r
  border: 1px solid rgba(20, 45, 40, .2);\r
  border-radius: 999px;\r
  background: rgba(255, 255, 255, .86);\r
  color: #17261f;\r
  padding: 6px 14px;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 900;\r
  cursor: pointer;\r
}\r
\r
.explore-search-reset {\r
  margin-top: 12px;\r
}\r
\r
@media (max-width: 640px) {\r
  .explore-search {\r
    grid-template-columns: auto minmax(0, 1fr) auto;\r
    padding: 10px 14px;\r
    border-radius: 28px;\r
  }\r
\r
  .explore-search-submit {\r
    grid-column: 1 / -1;\r
  }\r
}\r
\r
.filter-panel {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 12px;\r
  max-width: 1380px;\r
  margin: 0 auto 26px;\r
  padding: 12px;\r
  border: 1px solid rgba(13, 26, 24, .12);\r
  border-radius: 999px;\r
  background: rgba(236, 247, 241, .88);\r
  box-shadow: 0 18px 46px rgba(15, 43, 38, .16);\r
  backdrop-filter: blur(18px);\r
}\r
\r
.filter-btn {\r
  min-height: 44px;\r
  padding: 0 18px;\r
  border: 1px solid rgba(20, 45, 40, .2);\r
  border-radius: 999px;\r
  background: rgba(255, 255, 255, .84);\r
  color: #17261f;\r
  font-family: "Microsoft YaHei";\r
  font-weight: 900;\r
  letter-spacing: .01em;\r
  text-shadow: none;\r
  box-shadow:\r
    inset 0 1px 0 rgba(255, 255, 255, .88),\r
    0 8px 22px rgba(12, 35, 31, .1);\r
  cursor: pointer;\r
  transition: transform .18s ease, border-color .18s ease, background .18s ease, color .18s ease, box-shadow .18s ease;\r
}\r
\r
.filter-btn:hover,\r
.filter-btn.active {\r
  border-color: rgba(216, 58, 46, .46);\r
  background: #fff;\r
  color: #111;\r
  text-shadow: none;\r
  box-shadow:\r
    inset 0 1px 0 rgba(255, 255, 255, .92),\r
    0 14px 32px rgba(12, 35, 31, .18);\r
  transform: translateY(-1px);\r
}\r
\r
.filter-btn.active {\r
  background: linear-gradient(180deg, #fff, #fff6e6);\r
  color: #0f1814;\r
}\r
.heritage-detail-page {\r
  min-height: 100vh;\r
  padding: 118px clamp(18px, 3vw, 42px) 80px;\r
  background:\r
    linear-gradient(90deg, rgba(244, 180, 63, .12), transparent 22%),\r
    linear-gradient(180deg, rgba(10, 16, 15, .62), transparent 42%),\r
    radial-gradient(circle at 82% 10%, rgba(30, 156, 255, .16), transparent 30%),\r
    linear-gradient(135deg, #07111f 0%, #14231d 52%, #060b13 100%);\r
  color: #fff8df;\r
}\r
\r
.heritage-detail-state,\r
.heritage-detail-toast {\r
  max-width: 1180px;\r
  margin: 24px auto 0;\r
  padding: 20px 22px;\r
  border: 1px solid rgba(255, 244, 214, .18);\r
  border-radius: 22px;\r
  background: rgba(255, 255, 255, .08);\r
  color: rgba(255, 248, 223, .82);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 900;\r
}\r
\r
.heritage-detail-state.error {\r
  border-color: rgba(216, 58, 46, .44);\r
  color: #ffd0ca;\r
}\r
\r
.heritage-detail-toast {\r
  border-color: rgba(34, 167, 109, .45);\r
  color: #bff7d6;\r
}\r
\r
.detail-back-button {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 8px;\r
  min-height: 38px;\r
  margin: 0 0 18px calc((100% - min(1180px, 100%)) / 2);\r
  padding: 0 14px;\r
  border: 1px solid rgba(255, 244, 214, .22);\r
  border-radius: 999px;\r
  background: rgba(255, 255, 255, .08);\r
  color: #fff8df;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 900;\r
  backdrop-filter: blur(12px);\r
  cursor: pointer;\r
  transition: transform .18s ease, border-color .18s ease, background .18s ease;\r
}\r
\r
.detail-back-button:hover {\r
  border-color: rgba(255, 244, 214, .42);\r
  background: rgba(255, 255, 255, .12);\r
  transform: translateY(-1px);\r
}\r
\r
.heritage-detail-shell {\r
  display: grid;\r
  grid-template-columns: minmax(340px, .9fr) minmax(460px, 1.1fr);\r
  gap: clamp(18px, 2.2vw, 28px);\r
  max-width: 1260px;\r
  margin: 0 auto;\r
}\r
\r
.heritage-detail-cover,\r
.heritage-detail-copy {\r
  overflow: hidden;\r
  border: 1px solid rgba(255, 244, 214, .16);\r
  border-radius: 24px;\r
  background: rgba(255, 255, 255, .07);\r
  box-shadow: 0 26px 70px rgba(0, 0, 0, .28);\r
  backdrop-filter: blur(18px);\r
}\r
\r
.heritage-detail-cover {\r
  position: sticky;\r
  top: 108px;\r
  align-self: start;\r
  margin: 0;\r
}\r
\r
.heritage-detail-cover::before,\r
.heritage-detail-copy::before {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  pointer-events: none;\r
}\r
\r
.heritage-detail-cover::before {\r
  border-radius: inherit;\r
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .18);\r
}\r
\r
.heritage-detail-image-stage,\r
.heritage-detail-cover-fallback {\r
  width: 100%;\r
  min-height: clamp(420px, 58vh, 660px);\r
}\r
\r
.heritage-detail-image-stage {\r
  position: relative;\r
  overflow: hidden;\r
  background:\r
    linear-gradient(135deg, rgba(255, 248, 223, .08), transparent 32%),\r
    rgba(7, 17, 31, .46);\r
}\r
\r
.heritage-detail-cover img {\r
  display: block;\r
  width: 100%;\r
  height: 100%;\r
  min-height: clamp(420px, 58vh, 660px);\r
  object-fit: cover;\r
  object-position: center;\r
  filter: saturate(1.06) contrast(1.02);\r
}\r
\r
.heritage-detail-cover.has-image .heritage-detail-image-stage::after {\r
  content: "";\r
  position: absolute;\r
  inset: auto 0 0;\r
  height: 38%;\r
  background: linear-gradient(0deg, rgba(4, 11, 13, .76), transparent);\r
}\r
\r
.heritage-detail-cover-fallback {\r
  display: grid;\r
  place-items: center;\r
  align-content: center;\r
  gap: 12px;\r
  padding: 34px;\r
  background:\r
    linear-gradient(45deg, rgba(255, 248, 223, .08) 25%, transparent 25%, transparent 50%, rgba(255, 248, 223, .08) 50%, rgba(255, 248, 223, .08) 75%, transparent 75%),\r
    linear-gradient(135deg, rgba(32, 65, 55, .94), rgba(7, 17, 31, .82));\r
  background-size: 34px 34px, auto;\r
  color: #fff8df;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  text-align: center;\r
}\r
\r
.heritage-detail-cover-fallback strong {\r
  font-family: var(--display-cn);\r
  font-size: clamp(40px, 6vw, 78px);\r
  line-height: 1;\r
}\r
\r
.heritage-detail-cover-fallback span {\r
  max-width: 420px;\r
  color: rgba(255, 248, 223, .78);\r
  font-size: 15px;\r
  font-weight: 900;\r
  line-height: 1.7;\r
}\r
\r
.heritage-detail-cover figcaption {\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 12px;\r
  padding: 14px 18px 16px;\r
  color: rgba(255, 248, 223, .72);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 900;\r
}\r
\r
.heritage-detail-cover figcaption small {\r
  flex: 0 0 auto;\r
  color: #ffe19a;\r
  font-weight: 1000;\r
}\r
\r
.heritage-detail-copy {\r
  position: relative;\r
  display: grid;\r
  align-content: start;\r
  gap: 16px;\r
  padding: clamp(24px, 3.4vw, 42px);\r
}\r
\r
.heritage-detail-copy::before {\r
  background:\r
    linear-gradient(90deg, rgba(244, 180, 63, .2), transparent 36%),\r
    linear-gradient(180deg, rgba(255, 255, 255, .06), transparent 24%);\r
  opacity: .72;\r
}\r
\r
.heritage-detail-copy .label-tag {\r
  position: relative;\r
  z-index: 1;\r
  width: fit-content;\r
  border: 1px solid rgba(255, 244, 214, .2);\r
  background: rgba(255, 255, 255, .1);\r
}\r
\r
.heritage-detail-copy h1 {\r
  position: relative;\r
  z-index: 1;\r
  margin: 0;\r
  font-family: var(--display-cn);\r
  font-size: clamp(42px, 5.4vw, 82px);\r
  line-height: 1;\r
}\r
\r
.heritage-detail-alias {\r
  position: relative;\r
  z-index: 1;\r
  margin: -8px 0 0;\r
  color: rgba(255, 225, 154, .82);\r
  font-size: 18px;\r
  font-weight: 900;\r
}\r
\r
.heritage-detail-meta,\r
.heritage-detail-actions {\r
  position: relative;\r
  z-index: 1;\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 10px;\r
}\r
\r
.heritage-detail-meta span {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 7px;\r
  border: 1px solid rgba(244, 180, 63, .32);\r
  border-radius: 999px;\r
  padding: 8px 12px;\r
  background: rgba(255, 244, 214, .055);\r
  color: #ffe19a;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 900;\r
}\r
\r
.detail-learning-button,\r
.detail-secondary-button,\r
.heritage-source-link {\r
  display: inline-flex;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 8px;\r
  min-height: 42px;\r
  padding: 0 15px;\r
  border-radius: 999px;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 1000;\r
  text-decoration: none;\r
  cursor: pointer;\r
}\r
\r
.detail-learning-button {\r
  border: 0;\r
  background: linear-gradient(135deg, #d83a2e, #f4b43f);\r
  color: #fff;\r
  box-shadow: 0 12px 28px rgba(216, 58, 46, .28);\r
}\r
\r
.detail-secondary-button,\r
.heritage-source-link {\r
  border: 1px solid rgba(255, 244, 214, .24);\r
  background: rgba(255, 255, 255, .08);\r
  color: #fff8df;\r
}\r
\r
.heritage-detail-summary {\r
  position: relative;\r
  z-index: 1;\r
  margin: 0;\r
  padding: 18px 20px;\r
  border-left: 4px solid #f4b43f;\r
  border-radius: 18px;\r
  background: rgba(255, 244, 214, .08);\r
  color: rgba(255, 248, 223, .9);\r
  font-size: 16px;\r
  line-height: 1.9;\r
}\r
\r
.heritage-detail-admin-note {\r
  position: relative;\r
  z-index: 1;\r
  margin: -4px 0 2px;\r
  color: rgba(255, 248, 223, .58);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 12px;\r
  font-weight: 800;\r
  line-height: 1.7;\r
}\r
\r
.heritage-detail-facts {\r
  position: relative;\r
  z-index: 1;\r
  display: grid;\r
  grid-template-columns: repeat(2, minmax(0, 1fr));\r
  gap: 12px;\r
}\r
\r
.heritage-detail-facts div {\r
  min-height: 92px;\r
  padding: 16px;\r
  border: 1px solid rgba(255, 244, 214, .16);\r
  border-radius: 16px;\r
  background: rgba(255, 255, 255, .055);\r
}\r
\r
.heritage-detail-facts span {\r
  display: block;\r
  color: rgba(255, 248, 223, .54);\r
  font-size: 12px;\r
  font-weight: 900;\r
}\r
\r
.heritage-detail-facts strong {\r
  display: block;\r
  margin-top: 8px;\r
  color: #fff8df;\r
  line-height: 1.45;\r
}\r
\r
.heritage-detail-body {\r
  position: relative;\r
  z-index: 1;\r
  color: rgba(255, 248, 223, .78);\r
  line-height: 1.9;\r
}\r
\r
.heritage-detail-body p {\r
  margin: 0 0 14px;\r
}\r
\r
.heritage-related-media {\r
  position: relative;\r
  z-index: 1;\r
  display: grid;\r
  gap: 14px;\r
  margin-top: 4px;\r
}\r
\r
.heritage-related-media .detail-section-heading {\r
  display: grid;\r
  gap: 4px;\r
}\r
\r
.heritage-related-media .detail-section-heading span {\r
  color: #ffe19a;\r
  font-size: 12px;\r
  font-weight: 1000;\r
}\r
\r
.heritage-related-media .detail-section-heading h2 {\r
  margin: 0;\r
  color: #fff8df;\r
  font-family: var(--display-cn);\r
  font-size: clamp(24px, 3vw, 34px);\r
  line-height: 1.1;\r
}\r
\r
.heritage-related-media .detail-section-heading small {\r
  color: rgba(255, 248, 223, .58);\r
  font-size: 13px;\r
  font-weight: 800;\r
}\r
\r
.heritage-media-loading {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 8px;\r
  width: fit-content;\r
  border: 1px solid rgba(255, 244, 214, .18);\r
  border-radius: 999px;\r
  padding: 9px 13px;\r
  color: rgba(255, 248, 223, .76);\r
  background: rgba(255, 255, 255, .07);\r
}\r
\r
.heritage-media-grid {\r
  display: grid;\r
  grid-template-columns: repeat(2, minmax(0, 1fr));\r
  gap: 12px;\r
}\r
\r
.heritage-media-card {\r
  overflow: hidden;\r
  border: 1px solid rgba(255, 244, 214, .16);\r
  border-radius: 8px;\r
  background:\r
    linear-gradient(145deg, rgba(255, 244, 214, .08), rgba(39, 128, 112, .08)),\r
    rgba(255, 255, 255, .055);\r
  box-shadow: 0 18px 38px rgba(0, 0, 0, .18);\r
}\r
\r
.heritage-media-preview {\r
  display: grid;\r
  place-items: center;\r
  min-height: 168px;\r
  background:\r
    linear-gradient(135deg, rgba(244, 180, 63, .14), transparent 36%),\r
    rgba(7, 17, 31, .34);\r
}\r
\r
.heritage-media-preview img,\r
.heritage-media-preview video {\r
  display: block;\r
  width: 100%;\r
  height: 180px;\r
  object-fit: cover;\r
}\r
\r
.heritage-media-preview audio {\r
  width: calc(100% - 24px);\r
}\r
\r
.heritage-media-preview > div {\r
  display: grid;\r
  place-items: center;\r
  gap: 8px;\r
  color: rgba(255, 248, 223, .74);\r
  font-weight: 900;\r
}\r
\r
.heritage-media-copy {\r
  display: grid;\r
  gap: 7px;\r
  padding: 13px 14px 15px;\r
}\r
\r
.heritage-media-copy span,\r
.heritage-media-copy small {\r
  color: rgba(255, 248, 223, .58);\r
  font-size: 12px;\r
  font-weight: 900;\r
}\r
\r
.heritage-media-copy strong {\r
  color: #fff8df;\r
  line-height: 1.45;\r
  overflow-wrap: anywhere;\r
}\r
\r
.heritage-media-copy a {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 6px;\r
  width: fit-content;\r
  margin-top: 2px;\r
  color: #ffe19a;\r
  font-size: 13px;\r
  font-weight: 1000;\r
  text-decoration: none;\r
}\r
\r
@media (max-width: 980px) {\r
  .heritage-detail-shell {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .heritage-detail-cover {\r
    position: relative;\r
    top: auto;\r
  }\r
\r
  .heritage-detail-image-stage,\r
  .heritage-detail-cover img,\r
  .heritage-detail-cover-fallback {\r
    min-height: 320px;\r
    max-height: none;\r
  }\r
\r
  .heritage-detail-facts {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .heritage-media-grid {\r
    grid-template-columns: 1fr;\r
  }\r
}\r
\r
.material-submit-page {\r
  min-height: 100vh;\r
  padding: 104px clamp(18px, 3vw, 42px) 72px;\r
  background:\r
    radial-gradient(circle at 9% 8%, rgba(244, 180, 63, .22), transparent 26%),\r
    radial-gradient(circle at 88% 4%, rgba(30, 156, 255, .18), transparent 28%),\r
    linear-gradient(135deg, #eef7f2 0%, #dcebe5 48%, #eef8f9 100%);\r
  color: #14231d;\r
}\r
\r
.material-submit-hero,\r
.material-submit-layout {\r
  width: min(1420px, 100%);\r
  margin: 0 auto;\r
}\r
\r
.material-submit-hero {\r
  display: grid;\r
  grid-template-columns: minmax(0, 1fr) minmax(260px, .34fr);\r
  align-items: stretch;\r
  gap: 18px;\r
  margin-bottom: 18px;\r
}\r
\r
.material-submit-hero-copy,\r
.material-submit-stats article,\r
.material-submit-list,\r
.material-upload-card {\r
  border: 1px solid rgba(20, 45, 40, .13);\r
  background: rgba(255, 255, 255, .78);\r
  box-shadow: 0 18px 48px rgba(15, 43, 38, .13);\r
  backdrop-filter: blur(18px);\r
}\r
\r
.material-submit-hero-copy {\r
  display: grid;\r
  align-content: center;\r
  gap: 10px;\r
  min-height: 190px;\r
  padding: clamp(24px, 3vw, 38px);\r
  border-radius: 30px;\r
}\r
\r
.material-submit-hero .label-tag,\r
.material-upload-summary .label-tag,\r
.material-list-heading .label-tag {\r
  width: fit-content;\r
  color: #d83a2e;\r
}\r
\r
.material-submit-hero h1 {\r
  max-width: 780px;\r
  margin: 0;\r
  font-family: var(--display-cn);\r
  font-size: clamp(38px, 4.5vw, 68px);\r
  line-height: .98;\r
  letter-spacing: -.03em;\r
}\r
\r
.material-submit-hero p {\r
  max-width: 760px;\r
  margin: 0;\r
  color: rgba(20, 35, 29, .66);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 800;\r
  line-height: 1.75;\r
}\r
\r
.material-submit-stats {\r
  display: grid;\r
  gap: 12px;\r
}\r
\r
.material-submit-stats article {\r
  display: grid;\r
  align-content: center;\r
  gap: 7px;\r
  min-height: 88px;\r
  padding: 18px;\r
  border-radius: 24px;\r
}\r
\r
.material-submit-stats svg {\r
  color: #d83a2e;\r
}\r
\r
.material-submit-stats span {\r
  color: rgba(20, 35, 29, .58);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 12px;\r
  font-weight: 900;\r
}\r
\r
.material-submit-stats strong {\r
  color: #14231d;\r
  font-size: 26px;\r
  font-weight: 1000;\r
}\r
\r
.material-submit-layout {\r
  display: grid;\r
  grid-template-columns: minmax(320px, .36fr) minmax(0, .64fr);\r
  align-items: start;\r
  gap: 18px;\r
}\r
\r
.material-submit-list,\r
.material-upload-card {\r
  border-radius: 30px;\r
}\r
\r
.material-submit-list {\r
  position: sticky;\r
  top: 92px;\r
  display: grid;\r
  grid-template-rows: auto minmax(0, 1fr);\r
  gap: 12px;\r
  max-height: calc(100vh - 120px);\r
  padding: 18px;\r
  overflow: hidden;\r
}\r
\r
.material-list-heading {\r
  padding: 2px 2px 10px;\r
  border-bottom: 1px solid rgba(20, 45, 40, .1);\r
}\r
\r
.material-list-heading h2 {\r
  font-size: 24px;\r
}\r
\r
.material-list-heading span {\r
  display: block;\r
  margin-top: 6px;\r
  color: rgba(20, 35, 29, .58);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 12px;\r
  font-weight: 900;\r
}\r
\r
.material-submit-scroll {\r
  display: grid;\r
  gap: 10px;\r
  min-height: 0;\r
  overflow: auto;\r
  padding-right: 4px;\r
}\r
\r
.material-submit-list button {\r
  min-height: auto;\r
  padding: 14px 15px;\r
  border: 1px solid rgba(20, 45, 40, .12);\r
  border-radius: 18px;\r
  background: rgba(247, 250, 246, .94);\r
  color: #17261f;\r
  text-align: left;\r
  cursor: pointer;\r
  transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease;\r
}\r
\r
.material-submit-list button:hover {\r
  transform: translateY(-1px);\r
  border-color: rgba(216, 58, 46, .24);\r
}\r
\r
.material-submit-list button.active {\r
  border-color: rgba(216, 58, 46, .48);\r
  background: linear-gradient(135deg, #fff8eb, #fffdf7);\r
  box-shadow: inset 4px 0 0 #d83a2e, 0 10px 24px rgba(216, 58, 46, .1);\r
}\r
\r
.material-submit-list strong,\r
.material-submit-list span,\r
.material-submit-list em {\r
  display: block;\r
  font-family: "Microsoft YaHei", sans-serif;\r
}\r
\r
.material-submit-list strong {\r
  overflow: hidden;\r
  color: #12231d;\r
  font-size: 16px;\r
  font-weight: 1000;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
\r
.material-submit-list span {\r
  margin-top: 5px;\r
  color: rgba(23, 38, 31, .62);\r
  font-size: 12px;\r
  font-weight: 800;\r
}\r
\r
.material-submit-list em {\r
  margin-top: 8px;\r
  color: #9b2d22;\r
  font-size: 12px;\r
  font-style: normal;\r
  font-weight: 900;\r
}\r
\r
.material-upload-card {\r
  display: grid;\r
  gap: 18px;\r
  min-height: calc(100vh - 310px);\r
  padding: clamp(22px, 3vw, 34px);\r
}\r
\r
.material-upload-summary {\r
  display: grid;\r
  gap: 8px;\r
  padding-bottom: 14px;\r
  border-bottom: 1px solid rgba(20, 45, 40, .1);\r
}\r
\r
.material-upload-summary h2 {\r
  margin: 0;\r
  font-family: var(--display-cn);\r
  font-size: clamp(34px, 3.6vw, 56px);\r
  line-height: 1;\r
}\r
\r
.material-upload-summary span,\r
.material-upload-summary em {\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 900;\r
}\r
\r
.material-upload-summary span {\r
  color: rgba(20, 35, 29, .62);\r
}\r
\r
.material-upload-summary em {\r
  width: fit-content;\r
  padding: 5px 10px;\r
  border-radius: 999px;\r
  background: rgba(216, 58, 46, .1);\r
  color: #9b2d22;\r
  font-size: 12px;\r
  font-style: normal;\r
}\r
\r
.material-upload-main {\r
  display: grid;\r
  grid-template-columns: minmax(360px, 1fr) minmax(260px, .42fr);\r
  gap: 18px;\r
  align-items: stretch;\r
}\r
\r
.material-file-drop {\r
  display: grid;\r
  place-items: center;\r
  min-height: 420px;\r
  overflow: hidden;\r
  border: 2px dashed rgba(20, 45, 40, .22);\r
  border-radius: 28px;\r
  background:\r
    repeating-linear-gradient(90deg, rgba(15, 39, 33, .06) 0 1px, transparent 1px 32px),\r
    repeating-linear-gradient(0deg, rgba(15, 39, 33, .05) 0 1px, transparent 1px 32px),\r
    rgba(247, 250, 246, .88);\r
  cursor: pointer;\r
  transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;\r
}\r
\r
.material-file-drop:hover,\r
.material-file-drop.ready {\r
  border-color: rgba(216, 58, 46, .38);\r
  box-shadow: inset 0 0 0 1px rgba(216, 58, 46, .08);\r
}\r
\r
.material-file-drop input {\r
  display: none;\r
}\r
\r
.material-file-drop img {\r
  width: 100%;\r
  height: 100%;\r
  min-height: 420px;\r
  object-fit: cover;\r
}\r
\r
.material-file-drop span {\r
  display: grid;\r
  place-items: center;\r
  gap: 10px;\r
  color: rgba(20, 35, 29, .62);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 1000;\r
  text-align: center;\r
}\r
\r
.material-file-drop span svg {\r
  color: #d83a2e;\r
}\r
\r
.material-file-drop span small {\r
  color: rgba(20, 35, 29, .48);\r
  font-size: 12px;\r
}\r
\r
.material-upload-side {\r
  display: grid;\r
  align-content: start;\r
  gap: 14px;\r
}\r
\r
.material-upload-tip {\r
  display: flex;\r
  align-items: flex-start;\r
  gap: 8px;\r
  min-height: 64px;\r
  padding: 14px;\r
  border: 1px solid rgba(20, 45, 40, .12);\r
  border-radius: 18px;\r
  background: rgba(247, 250, 246, .9);\r
  color: rgba(20, 35, 29, .68);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 13px;\r
  font-weight: 900;\r
  line-height: 1.55;\r
}\r
\r
.material-upload-tip svg {\r
  flex: 0 0 auto;\r
  color: #22a76d;\r
}\r
\r
.material-upload-field span {\r
  display: block;\r
  margin-bottom: 7px;\r
  color: rgba(23, 38, 31, .7);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 12px;\r
  font-weight: 900;\r
}\r
\r
.material-upload-field input {\r
  width: 100%;\r
  min-height: 46px;\r
  border: 1px solid rgba(20, 45, 40, .16);\r
  border-radius: 16px;\r
  background: rgba(255, 255, 255, .92);\r
  color: #17261f;\r
  padding: 0 14px;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 800;\r
}\r
\r
.material-upload-submit {\r
  display: inline-flex;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 8px;\r
  min-height: 48px;\r
  border: 0;\r
  border-radius: 999px;\r
  background: linear-gradient(135deg, #d83a2e, #f4b43f);\r
  color: #fff;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 1000;\r
  box-shadow: 0 14px 32px rgba(216, 58, 46, .22);\r
  cursor: pointer;\r
}\r
\r
.material-upload-submit:disabled {\r
  cursor: not-allowed;\r
  opacity: .55;\r
}\r
\r
.material-upload-caption-only {\r
  display: inline-flex;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 8px;\r
  min-height: 44px;\r
  border: 1px solid rgba(20, 45, 40, .24);\r
  border-radius: 999px;\r
  background: rgba(255, 255, 255, .9);\r
  color: #14231d;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 900;\r
  cursor: pointer;\r
  transition: border-color .18s ease, background .18s ease, transform .18s ease;\r
}\r
\r
.material-upload-caption-only:hover:not(:disabled) {\r
  border-color: rgba(216, 58, 46, .46);\r
  background: #fff;\r
  transform: translateY(-1px);\r
}\r
\r
.material-upload-caption-only:disabled {\r
  cursor: not-allowed;\r
  opacity: .55;\r
}\r
\r
.material-submit-stats small {\r
  color: rgba(20, 35, 29, .62);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 12px;\r
  font-weight: 800;\r
}\r
\r
@media (max-width: 1180px) {\r
  .material-submit-layout,\r
  .material-upload-main {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .material-submit-list {\r
    position: relative;\r
    top: auto;\r
    max-height: none;\r
  }\r
\r
  .material-submit-scroll {\r
    max-height: 360px;\r
  }\r
}\r
\r
@media (max-width: 820px) {\r
  .material-submit-page {\r
    padding-inline: 18px;\r
  }\r
\r
  .material-submit-hero {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .material-submit-stats {\r
    grid-template-columns: repeat(2, minmax(0, 1fr));\r
  }\r
\r
  .material-file-drop,\r
  .material-file-drop img {\r
    min-height: 300px;\r
  }\r
}\r
\r
.material-completion-bar,\r
.material-completion-panel {\r
  max-width: 1380px;\r
  margin: 0 auto 22px;\r
  border: 1px solid rgba(20, 45, 40, .14);\r
  border-radius: 26px;\r
  background: rgba(255, 255, 255, .82);\r
  color: #17261f;\r
  box-shadow: 0 18px 46px rgba(15, 43, 38, .14);\r
  backdrop-filter: blur(18px);\r
}\r
\r
.material-completion-bar {\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 18px;\r
  padding: 18px 22px;\r
}\r
\r
.material-completion-bar strong,\r
.material-panel-heading h2 {\r
  display: block;\r
  margin: 0;\r
  color: #12231d;\r
  font-weight: 1000;\r
}\r
\r
.material-completion-bar span {\r
  display: block;\r
  margin-top: 5px;\r
  color: rgba(23, 38, 31, .66);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 13px;\r
  font-weight: 800;\r
}\r
\r
.material-completion-toggle,\r
.material-submit-form button {\r
  border: 0;\r
  border-radius: 999px;\r
  background: linear-gradient(135deg, #d83a2e, #f4b43f);\r
  color: #fff;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 1000;\r
  box-shadow: 0 14px 32px rgba(216, 58, 46, .22);\r
  cursor: pointer;\r
}\r
\r
.material-completion-toggle {\r
  min-height: 42px;\r
  padding: 0 18px;\r
  white-space: nowrap;\r
}\r
\r
.material-completion-panel {\r
  padding: 22px;\r
}\r
\r
.material-panel-heading {\r
  display: flex;\r
  align-items: flex-start;\r
  justify-content: space-between;\r
  gap: 18px;\r
  margin-bottom: 18px;\r
}\r
\r
.material-panel-heading .label-tag {\r
  width: fit-content;\r
  margin: 0 0 8px;\r
  color: #d83a2e;\r
}\r
\r
.material-panel-heading button {\r
  width: 34px;\r
  height: 34px;\r
  border: 1px solid rgba(20, 45, 40, .14);\r
  border-radius: 50%;\r
  background: rgba(255, 255, 255, .78);\r
  color: #17261f;\r
  font-size: 24px;\r
  line-height: 1;\r
  cursor: pointer;\r
}\r
\r
.material-missing-list {\r
  display: grid;\r
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\r
  gap: 10px;\r
  margin-bottom: 18px;\r
}\r
\r
.material-missing-list button,\r
.material-complete-state {\r
  min-height: 96px;\r
  padding: 14px;\r
  border: 1px solid rgba(20, 45, 40, .12);\r
  border-radius: 18px;\r
  background: rgba(247, 250, 246, .94);\r
  color: #17261f;\r
  text-align: left;\r
}\r
\r
.material-missing-list button.active {\r
  border-color: rgba(216, 58, 46, .42);\r
  background: #fff8eb;\r
  box-shadow: inset 0 0 0 1px rgba(216, 58, 46, .12);\r
}\r
\r
.material-missing-list strong,\r
.material-missing-list span,\r
.material-missing-list em {\r
  display: block;\r
  font-family: "Microsoft YaHei", sans-serif;\r
}\r
\r
.material-missing-list strong {\r
  font-weight: 1000;\r
}\r
\r
.material-missing-list span {\r
  margin-top: 5px;\r
  color: rgba(23, 38, 31, .62);\r
  font-size: 12px;\r
  font-weight: 800;\r
}\r
\r
.material-missing-list em {\r
  margin-top: 8px;\r
  color: #9b2d22;\r
  font-size: 12px;\r
  font-style: normal;\r
  font-weight: 900;\r
}\r
\r
.material-submit-form {\r
  display: grid;\r
  grid-template-columns: minmax(180px, .8fr) minmax(240px, 1.2fr) minmax(220px, 1fr) auto;\r
  align-items: end;\r
  gap: 12px;\r
}\r
\r
.material-submit-form label span {\r
  display: block;\r
  margin-bottom: 7px;\r
  color: rgba(23, 38, 31, .7);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 12px;\r
  font-weight: 900;\r
}\r
\r
.material-submit-form input,\r
.material-submit-form select {\r
  width: 100%;\r
  min-height: 42px;\r
  border: 1px solid rgba(20, 45, 40, .16);\r
  border-radius: 14px;\r
  background: rgba(255, 255, 255, .92);\r
  color: #17261f;\r
  padding: 0 12px;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 800;\r
}\r
\r
.material-submit-form button {\r
  min-height: 42px;\r
  padding: 0 16px;\r
}\r
\r
.material-submit-form button:disabled {\r
  cursor: not-allowed;\r
  opacity: .55;\r
}\r
\r
.material-message {\r
  grid-column: 1 / -1;\r
  margin: 0;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-weight: 900;\r
}\r
\r
.material-message.success { color: #197a4d; }\r
.material-message.error { color: #b3352a; }\r
\r
@media (max-width: 960px) {\r
  .material-completion-bar,\r
  .material-submit-form {\r
    grid-template-columns: 1fr;\r
    align-items: stretch;\r
  }\r
\r
  .material-completion-bar {\r
    flex-direction: column;\r
    align-items: stretch;\r
  }\r
}\r
\r
.heritage-list-state {\r
  max-width: 1380px;\r
  margin: 24px auto 0;\r
  padding: 28px;\r
  border: 1px solid rgba(255, 244, 214, .2);\r
  border-radius: 24px;\r
  background: rgba(255, 255, 255, .08);\r
  color: rgba(255, 248, 223, .78);\r
  font-weight: 900;\r
}\r
\r
.heritage-list-state.error {\r
  border-color: rgba(216, 58, 46, .42);\r
  color: #ffd0ca;\r
}\r
\r
.region-grid {\r
  display: grid;\r
  grid-template-columns: repeat(4, minmax(0, 1fr));\r
  gap: 18px;\r
  max-width: 1380px;\r
  margin: 0 auto;\r
}\r
\r
.region-card {\r
  position: relative;\r
  min-height: 342px;\r
  overflow: hidden;\r
  padding: 20px;\r
  border-radius: 28px;\r
  background: #f3ead8;\r
  color: #111;\r
  transition: transform .22s ease;\r
}\r
\r
.region-card:hover { transform: translateY(-7px) rotate(-1deg); }\r
\r
.region-card::after {\r
  content: "";\r
  position: absolute;\r
  right: -42px;\r
  bottom: -44px;\r
  width: 190px;\r
  height: 190px;\r
  border-radius: 50%;\r
  background: var(--accent);\r
  opacity: .22;\r
}\r
\r
.card-topline {\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 10px;\r
  position: relative;\r
  z-index: 1;\r
}\r
\r
.card-topline span {\r
  font-size: 13px;\r
  font-weight: 1000;\r
  letter-spacing: .08em;\r
}\r
\r
.card-topline small {\r
  font-family: "Microsoft YaHei";\r
  color: rgba(0,0,0,.56);\r
}\r
\r
.region-badge {\r
  position: relative;\r
  z-index: 1;\r
  display: grid;\r
  place-items: center;\r
  width: 84px;\r
  height: 84px;\r
  margin-top: 30px;\r
  border: 4px solid #111;\r
  background: #fff;\r
  font-family: "STKaiti", "KaiTi", serif;\r
  font-size: 32px;\r
  font-weight: 1000;\r
}\r
\r
.category,\r
.region-card h3,\r
.intro,\r
.tag-row { position: relative; z-index: 1; }\r
.category { margin: 22px 0 8px; color: var(--accent); font-family: "Microsoft YaHei"; font-weight: 900; }\r
.region-card h3 { margin: 0 0 10px; font-size: 30px; line-height: 1; }\r
.intro { margin: 0; color: rgba(0,0,0,.66); font-family: "Microsoft YaHei"; line-height: 1.65; }\r
.tag-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }\r
.tag-row em { padding: 5px 9px; border: 1px solid rgba(0,0,0,.18); border-radius: 999px; font-family: "Microsoft YaHei"; font-size: 12px; font-style: normal; }\r
\r
.project-showcase {\r
  padding: 30px 42px 100px;\r
  background: #e8f5ff;\r
}\r
\r
.project-row {\r
  display: grid;\r
  grid-template-columns: minmax(420px, .95fr) minmax(360px, .8fr);\r
  align-items: center;\r
  gap: 66px;\r
  max-width: 1380px;\r
  margin: 0 auto 92px;\r
}\r
\r
.project-row.reverse { grid-template-columns: minmax(360px, .8fr) minmax(420px, .95fr); }\r
.project-row.reverse figure { order: 2; }\r
.project-row figure { margin: 0; overflow: hidden; border-radius: 34px; border: 2px solid #111; transform: rotate(-4deg); box-shadow: 0 28px 72px rgba(0,0,0,.22); }\r
.project-row.reverse figure { transform: rotate(4deg); }\r
.project-row span { font-family: "Microsoft YaHei"; font-weight: 900; color: var(--red); }\r
.project-row h2 { font-size: clamp(52px, 7vw, 118px); line-height: .86; }\r
\r
.about-grid,\r
.timeline-section {\r
  padding: 80px 42px;\r
  background: #080808;\r
}\r
\r
.about-grid {\r
  display: grid;\r
  grid-template-columns: repeat(3, minmax(0, 1fr));\r
  gap: 20px;\r
}\r
\r
.about-grid article,\r
.timeline article {\r
  padding: 28px;\r
  border: 1px solid rgba(255,255,255,.2);\r
  border-radius: 28px;\r
  background: rgba(255,255,255,.08);\r
  color: #fff;\r
}\r
\r
.about-grid span,\r
.timeline span { color: var(--gold); font-family: "Microsoft YaHei"; font-weight: 900; }\r
.about-grid h2 { color: #fff; margin-top: 28px; font-size: 42px; line-height: .96; }\r
.about-grid p { color: rgba(255,255,255,.68); }\r
\r
.timeline-section { padding-top: 30px; }\r
.timeline { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; max-width: 1380px; margin: 34px auto 0; }\r
.timeline strong { display: block; margin-top: 24px; color: #fff; font-size: 30px; }\r
.timeline p { color: rgba(255,255,255,.68); }\r
\r
@media (max-width: 1120px) {\r
  .top-nav { grid-template-columns: 1fr; gap: 14px; padding: 18px 24px; }\r
  .nav-links { justify-content: flex-start; overflow-x: auto; gap: 24px; }\r
  .heritage-opening { min-height: 980px; }\r
  .opening-center h1 { font-size: 6rem; }\r
  .opening-feature {\r
    top: 36%;\r
    width: min(520px, 48%);\r
  }\r
  .opening-body-wrap { width: 88%; }\r
  .home-hero,\r
  .page-hero,\r
  .split-layout,\r
  .project-row,\r
  .project-row.reverse { grid-template-columns: 1fr; }\r
  .compact-hero .page-hero-image { width: min(86vw, 460px); }\r
  .favorites-hero-stack { width: min(78vw, 420px); height: min(88vw, 500px); }\r
  .project-row.reverse figure { order: 0; }\r
  .card-swap-stage { min-height: 620px; }\r
  .card-swap-container { width: 92vw; height: 58vw; right: -10vw; }\r
  .swap-card { width: 92vw; height: 58vw; }  .region-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }\r
  .entry-grid,\r
  .curved-heritage-notes,\r
  .about-grid,\r
  .timeline { grid-template-columns: 1fr; }\r
  .inheritance-section { grid-template-columns: 1fr; }\r
  .inheritance-panel { justify-self: stretch; max-width: none; }\r
  .inheritance-list { max-width: none; }\r
}\r
\r
@media (max-width: 720px) {\r
  .top-nav { position: relative; min-height: auto; background: #080808; }\r
  .brand-text { display: none; }\r
  .nav-links { flex-wrap: wrap; justify-content: center; gap: 8px; width: 100%; overflow-x: visible; }\r
  .nav-links button { min-height: 40px; padding: 0 10px; font-size: 15px; }\r
  .heritage-opening {\r
    min-height: 820px;\r
    margin-top: 0;\r
  }\r
  .opening-center {\r
    top: 38%;\r
    width: calc(100% - 36px);\r
  }\r
  .opening-center h1 { font-size: 4.4rem; }\r
  .opening-center p { font-size: 1.05rem; }\r
  .opening-feature {\r
    top: auto;\r
    right: 18px;\r
    bottom: 132px;\r
    left: 18px;\r
    width: auto;\r
    max-width: none;\r
  }\r
  .opening-feature .opening-label { font-size: 1.2rem; }\r
  .opening-feature h2 { font-size: 1.55rem; }\r
  .opening-body-wrap {\r
    width: 100%;\r
    height: 7.4em;\r
    font-size: .9rem;\r
  }\r
  .opening-event {\r
    right: 18px;\r
    bottom: 34px;\r
  }\r
  .opening-event strong { font-size: 1rem; }\r
  .opening-vertical { display: none; }\r
  .hero, .page-hero { margin-top: 0; padding: 48px 18px; min-height: auto; }\r
  .graph-scan-hero { min-height: 100vh; padding-top: 112px; padding-bottom: 48px; }\r
  .graph-scan-copy h1 { font-size: clamp(42px, 12vw, 72px); }\r
  .hero-copy h1 {\r
    font-size: clamp(38px, 12vw, 62px);\r
    line-height: .96;\r
  }\r
  .page-hero h1, .section-copy h2, .section-copy .spotlight-reveal-text, .section-head h2 {\r
    font-size: clamp(38px, 12vw, 62px);\r
    line-height: 1.05;\r
  }\r
  .card-swap-stage { min-height: 460px; }\r
  .favorites-hero-stack { width: min(82vw, 360px); height: min(102vw, 450px); transform: rotate(2deg); }\r
  .card-swap-container { width: 108vw; height: 72vw; right: -30vw; bottom: 60px; transform: scale(.86); transform-origin: bottom right; }\r
  .swap-card { width: 108vw; height: 72vw; border-radius: 22px; }\r
  .light-section, .dark-section, .regions-page-section, .project-showcase, .about-grid, .timeline-section, .heritage-story-section, .inheritance-section {\r
    padding-left: 18px;\r
    padding-right: 18px;\r
  }\r
  .inheritance-motion-section {\r
    height: 360px;\r
    min-height: 360px;\r
  }\r
  .story-gallery {\r
    height: 390px;\r
    margin-top: 10px;\r
    border-radius: 24px;\r
    mask-image: none;\r
  }\r
  .story-gallery::after {\r
    right: 12px;\r
    bottom: 12px;\r
    font-size: 12px;\r
  }\r
  .inheritance-panel { padding: 24px; }\r
  .inheritance-card { grid-template-columns: 1fr; }\r
}\r
\r
.masonry-container {\r
  position: relative;\r
  width: min(1380px, 100%);\r
  min-height: 900px;\r
  margin: 0 auto;\r
}\r
\r
.masonry-item {\r
  position: absolute;\r
  box-sizing: content-box;\r
  cursor: pointer;\r
  transform-origin: center center;\r
}\r
\r
.masonry-card {\r
  position: relative;\r
  width: 100%;\r
  height: 100%;\r
  overflow: hidden;\r
  border: 1px solid rgba(255, 255, 255, 0.16);\r
  border-radius: 28px;\r
  background-color: #f3ead8;\r
  background-position: center;\r
  background-size: cover;\r
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);\r
  color: #fff;\r
  opacity: 0;\r
  filter: blur(12px) saturate(.88);\r
  transform: translateY(34px) scale(.985);\r
  transition:\r
    opacity .78s cubic-bezier(.2, .84, .2, 1),\r
    filter .78s cubic-bezier(.2, .84, .2, 1),\r
    transform .78s cubic-bezier(.2, .84, .2, 1),\r
    box-shadow .24s ease;\r
  will-change: opacity, filter, transform;\r
}\r
\r
.masonry-item.is-in-view .masonry-card {\r
  opacity: 1;\r
  filter: blur(0) saturate(1);\r
  transform: translateY(0) scale(1);\r
}\r
\r
.masonry-card.is-missing-image {\r
  color: #10231d;\r
  background-size: 180% 180%;\r
  background-position: center;\r
}\r
\r
.masonry-card.is-missing-image::before {\r
  background:\r
    linear-gradient(180deg, rgba(255, 255, 255, .08), rgba(17, 41, 34, .08) 42%, rgba(11, 24, 20, .68)),\r
    radial-gradient(circle at 24% 18%, rgba(255, 255, 255, .46), transparent 24%),\r
    repeating-linear-gradient(90deg, rgba(15, 39, 33, .1) 0 1px, transparent 1px 28px),\r
    repeating-linear-gradient(0deg, rgba(15, 39, 33, .08) 0 1px, transparent 1px 28px);\r
}\r
\r
.masonry-card.is-missing-image::after {\r
  border-color: rgba(20, 45, 40, .18);\r
}\r
\r
.masonry-card.is-missing-image .masonry-image-label {\r
  border-color: rgba(216, 58, 46, .32);\r
  background: rgba(255, 248, 232, .9);\r
  color: #9b2d22;\r
}\r
\r
.masonry-card.is-missing-image .masonry-card-topline small,\r
.masonry-card.is-missing-image .masonry-card-copy span,\r
.masonry-card.is-missing-image .masonry-tag-row em {\r
  color: rgba(255, 255, 255, .86);\r
}\r
\r
.masonry-card.is-missing-image .masonry-card-copy p,\r
.masonry-card.is-missing-image .masonry-card-copy h3,\r
.masonry-card.is-missing-image .masonry-card-copy span {\r
  text-shadow: 0 3px 14px rgba(0, 0, 0, .48);\r
}\r
\r
.masonry-card::before {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  background:\r
    linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.18) 38%, rgba(0, 0, 0, 0.82)),\r
    radial-gradient(circle at 78% 84%, color-mix(in srgb, var(--accent, #f4b43f), transparent 22%), transparent 36%);\r
  pointer-events: none;\r
}\r
\r
.masonry-card::after {\r
  content: "";\r
  position: absolute;\r
  inset: 1px;\r
  border-radius: 27px;\r
  border: 1px solid rgba(255, 244, 214, .2);\r
  pointer-events: none;\r
}\r
\r
.masonry-card-topline,\r
.masonry-image-label,\r
.masonry-card-copy,\r
.masonry-tag-row {\r
  position: relative;\r
  z-index: 1;\r
}\r
\r
.masonry-card-topline {\r
  display: flex;\r
  align-items: center;\r
  justify-content: flex-end;\r
  gap: 12px;\r
  padding: 20px 22px 0;\r
}\r
\r
.masonry-card-topline small {\r
  color: rgba(255, 255, 255, 0.76);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 12px;\r
  font-weight: 800;\r
}\r
\r
.masonry-image-label {\r
  position: absolute;\r
  top: 54px;\r
  right: 22px;\r
  padding: 6px 10px;\r
  border: 1px solid rgba(255, 244, 214, .28);\r
  border-radius: 999px;\r
  background: rgba(0, 0, 0, .34);\r
  color: #ffe19a;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 12px;\r
  font-weight: 900;\r
  backdrop-filter: blur(10px);\r
}\r
\r
.masonry-card-copy {\r
  position: absolute;\r
  left: 22px;\r
  right: 22px;\r
  bottom: 66px;\r
}\r
\r
.masonry-card-copy p {\r
  margin: 0 0 8px;\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 14px;\r
  font-weight: 1000;\r
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.42);\r
}\r
\r
.masonry-card-copy h3 {\r
  margin: 0 0 10px;\r
  color: #fff;\r
  font-size: clamp(28px, 2.2vw, 42px);\r
  line-height: 0.95;\r
  text-shadow: 0 4px 18px rgba(0, 0, 0, 0.42);\r
}\r
\r
.masonry-card-copy span {\r
  display: block;\r
  color: rgba(255, 255, 255, 0.78);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 14px;\r
  line-height: 1.65;\r
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.46);\r
}\r
\r
.masonry-tag-row {\r
  position: absolute;\r
  left: 22px;\r
  right: 22px;\r
  bottom: 22px;\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 8px;\r
}\r
\r
.masonry-tag-row em {\r
  padding: 5px 10px;\r
  border: 1px solid rgba(255, 255, 255, 0.28);\r
  border-radius: 999px;\r
  background: rgba(0, 0, 0, 0.22);\r
  color: rgba(255, 255, 255, 0.86);\r
  font-family: "Microsoft YaHei", sans-serif;\r
  font-size: 12px;\r
  font-style: normal;\r
  backdrop-filter: blur(8px);\r
}\r
\r
.color-overlay {\r
  position: absolute;\r
  inset: 0;\r
  z-index: 1;\r
  border-radius: 28px;\r
  background: linear-gradient(135deg, rgba(216, 58, 46, 0.4), rgba(30, 156, 255, 0.34));\r
  opacity: 0;\r
  pointer-events: none;\r
}\r
\r
.portal-feature-hero {\r
  min-height: 620px;\r
}\r
\r
.portal-function-section {\r
  display: grid;\r
  gap: 24px;\r
  padding: 42px clamp(18px, 3vw, 42px) 96px;\r
  background:\r
    radial-gradient(circle at 14% 0%, rgba(30, 156, 255, 0.22), transparent 28%),\r
    linear-gradient(180deg, #dff2ff 0%, #f7ead7 100%);\r
}\r
\r
.portal-function-section .graph-board-page,\r
.portal-function-section .community-page,\r
.portal-function-section .favorite-page,\r
.portal-function-section .learning-page {\r
  width: min(1320px, 100%);\r
  margin: 0 auto;\r
  color: #080808;\r
}\r
\r
.portal-function-section .page-heading,\r
.portal-function-section .filter-bar,\r
.portal-function-section .table-toolbar,\r
.portal-function-section .side-section,\r
.portal-function-section .community-list-panel,\r
.portal-function-section .learning-recommend-panel,\r
.portal-function-section .favorite-graph-panel,\r
.portal-function-section .table-panel,\r
.portal-function-section .favorite-table-panel,\r
.portal-function-section .node-modal,\r
.portal-function-section .state-panel {\r
  border: 2px solid rgba(7, 7, 7, 0.14);\r
  border-radius: 0;\r
  background: rgba(255, 255, 255, 0.72);\r
  color: #080808;\r
  box-shadow: 0 22px 54px rgba(13, 74, 124, 0.12);\r
  backdrop-filter: blur(14px);\r
}\r
\r
.portal-function-section .page-heading {\r
  padding: 18px 20px;\r
}\r
\r
.portal-function-section .page-heading h2,\r
.portal-function-section .panel-title h3,\r
.portal-function-section .side-section h3,\r
.portal-function-section .community-question-card h3,\r
.portal-function-section .learning-hero-node h3 {\r
  margin: 0;\r
  color: #050505;\r
  letter-spacing: 0;\r
}\r
\r
.portal-function-section .page-heading span,\r
.portal-function-section .filter-bar span,\r
.portal-function-section .form-grid span,\r
.portal-function-section .side-section dd,\r
.portal-function-section .chain-empty,\r
.portal-function-section .community-meta-row,\r
.portal-function-section .community-question-card p,\r
.portal-function-section .community-question-detail p,\r
.portal-function-section .community-answer-list p,\r
.portal-function-section .favorite-add-box label span,\r
.portal-function-section .favorite-detail-panel label span,\r
.portal-function-section .learning-stats span,\r
.portal-function-section .favorite-stats span {\r
  color: rgba(7, 7, 7, 0.62);\r
}\r
\r
.portal-function-section .eyebrow {\r
  color: #1e71b8;\r
  font-weight: 1000;\r
}\r
\r
.portal-function-section .primary-action,\r
.portal-function-section .secondary-action,\r
.portal-function-section .danger-action,\r
.portal-function-section .icon-only,\r
.portal-function-section .row-actions button {\r
  border: 2px solid rgba(7, 7, 7, 0.14);\r
  border-radius: 0;\r
  color: #070707;\r
  background: rgba(255, 255, 255, 0.72);\r
  box-shadow: none;\r
}\r
\r
.portal-function-section .primary-action {\r
  border-color: #111;\r
  background: #111;\r
  color: #fff;\r
}\r
\r
.portal-function-section .secondary-action:hover,\r
.portal-function-section .icon-only:hover {\r
  border-color: #1e9cff;\r
}\r
\r
.portal-function-section input,\r
.portal-function-section select,\r
.portal-function-section textarea {\r
  border: 2px solid rgba(7, 7, 7, 0.14);\r
  border-radius: 0;\r
  background: rgba(255, 255, 255, 0.82);\r
  color: #070707;\r
}\r
\r
.portal-function-section input::placeholder,\r
.portal-function-section textarea::placeholder {\r
  color: rgba(7, 7, 7, 0.42);\r
}\r
\r
.portal-function-section .inline-error {\r
  border-color: rgba(216, 58, 46, 0.38);\r
  background: rgba(216, 58, 46, 0.1);\r
  color: #8b2019;\r
}\r
\r
.portal-function-section .inline-success {\r
  border-color: rgba(34, 167, 109, 0.38);\r
  background: rgba(34, 167, 109, 0.1);\r
  color: #116b45;\r
}\r
\r
.portal-function-section .graph-board-layout,\r
.portal-function-section .community-workbench,\r
.portal-function-section .learning-workbench,\r
.portal-function-section .compact-learning-workbench,\r
.portal-function-section .compact-favorite-workbench {\r
  gap: 18px;\r
}\r
\r
.portal-function-section .graph-stage,\r
.portal-function-section .favorite-graph-stage {\r
  border-radius: 0;\r
  background:\r
    linear-gradient(90deg, rgba(30, 156, 255, 0.09) 1px, transparent 1px),\r
    linear-gradient(0deg, rgba(30, 156, 255, 0.08) 1px, transparent 1px),\r
    radial-gradient(circle at 50% 42%, rgba(30, 156, 255, 0.26), transparent 48%),\r
    #eef8ff;\r
  background-size: 40px 40px, 40px 40px, auto, auto;\r
}\r
\r
.portal-function-section .community-stats,\r
.portal-function-section .favorite-stats,\r
.portal-function-section .learning-stats {\r
  gap: 14px;\r
}\r
\r
.portal-function-section .community-stats article,\r
.portal-function-section .favorite-stats article,\r
.portal-function-section .learning-stats article,\r
.portal-function-section .community-question-card,\r
.portal-function-section .favorite-list article,\r
.portal-function-section .learning-recommend-list article,\r
.portal-function-section .learning-hot-list article,\r
.portal-function-section .chain-card {\r
  border: 2px solid rgba(7, 7, 7, 0.12);\r
  border-radius: 0;\r
  background: rgba(255, 255, 255, 0.72);\r
  color: #080808;\r
  box-shadow: 0 14px 32px rgba(13, 74, 124, 0.1);\r
}\r
\r
.portal-function-section .community-stats strong,\r
.portal-function-section .favorite-stats strong,\r
.portal-function-section .learning-stats strong,\r
.portal-function-section .favorite-list strong,\r
.portal-function-section .learning-hero-node strong {\r
  color: #050505;\r
}\r
\r
.portal-function-section .community-question-card:hover,\r
.portal-function-section .community-question-card.selected,\r
.portal-function-section .favorite-list article.selected {\r
  border-color: #1e9cff;\r
  box-shadow: inset 4px 0 0 #1e9cff, 0 18px 40px rgba(30, 156, 255, 0.16);\r
}\r
\r
.portal-function-section .type-chip,\r
.portal-function-section .status-chip,\r
.portal-function-section .learning-focus-chip,\r
.portal-function-section .community-thread-actions span,\r
.portal-function-section .community-thread-actions small {\r
  border-radius: 999px;\r
  background: rgba(30, 156, 255, 0.1);\r
  color: #0b5791;\r
}\r
\r
.portal-function-section .modal-backdrop {\r
  background: rgba(7, 7, 7, 0.42);\r
}\r
\r
/* User portal: graph / community / favorites visual refresh */\r
.portal-feature-hero {\r
  min-height: 560px;\r
  background:\r
    radial-gradient(circle at 78% 22%, rgba(244, 180, 63, .28), transparent 32%),\r
    radial-gradient(circle at 12% 72%, rgba(30, 156, 255, .22), transparent 34%),\r
    linear-gradient(135deg, #edf8ff 0%, #fff7e8 52%, #f7ead7 100%);\r
}\r
\r
.portal-feature-hero::before {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  background:\r
    linear-gradient(90deg, rgba(7, 7, 7, .035) 1px, transparent 1px),\r
    linear-gradient(0deg, rgba(7, 7, 7, .03) 1px, transparent 1px);\r
  background-size: 38px 38px;\r
  mask-image: linear-gradient(180deg, transparent, black 18%, black 88%, transparent);\r
  pointer-events: none;\r
}\r
\r
.portal-feature-hero > div:first-child {\r
  max-width: 1160px;\r
}\r
\r
.portal-feature-hero > .graph-scan-background:first-child {\r
  max-width: none !important;\r
}\r
\r
.portal-feature-hero .label-tag {\r
  border-color: rgba(7, 7, 7, .56);\r
  background: rgba(255, 255, 255, .68);\r
  box-shadow: 0 12px 28px rgba(13, 74, 124, .12);\r
}\r
\r
.portal-feature-hero h1 {\r
  max-width: 1240px;\r
  text-shadow: 0 1px 0 rgba(255, 255, 255, .62), 12px 18px 0 rgba(244, 180, 63, .08);\r
}\r
\r
.portal-feature-hero p:not(.label-tag) {\r
  color: rgba(7, 7, 7, .66);\r
  font-size: 18px;\r
}\r
\r
.page-hero.portal-feature-hero.favorites-top-hero {\r
  min-height: auto;\r
  padding-top: 100px;\r
  padding-bottom: 32px;\r
}\r
\r
.portal-function-section {\r
  gap: 28px;\r
  padding: 28px clamp(18px, 3.4vw, 54px) 80px;\r
  background:\r
    radial-gradient(circle at 8% 0%, rgba(30, 156, 255, .24), transparent 28%),\r
    radial-gradient(circle at 92% 14%, rgba(244, 180, 63, .2), transparent 30%),\r
    radial-gradient(circle at 50% 100%, rgba(216, 58, 46, .1), transparent 34%),\r
    linear-gradient(180deg, #dff2ff 0%, #f5fbff 42%, #fff2df 100%);\r
}\r
\r
.graph-function-section,\r
.favorites-function-section {\r
  scroll-margin-top: 92px;\r
}\r
\r
.portal-function-section .graph-board-page,\r
.portal-function-section .community-page,\r
.portal-function-section .favorite-page,\r
.portal-function-section .learning-page {\r
  display: grid;\r
  gap: 22px;\r
}\r
\r
.portal-function-section .page-heading,\r
.portal-function-section .filter-bar,\r
.portal-function-section .table-toolbar,\r
.portal-function-section .side-section,\r
.portal-function-section .community-list-panel,\r
.portal-function-section .community-detail-panel,\r
.portal-function-section .learning-recommend-panel,\r
.portal-function-section .favorite-graph-panel,\r
.portal-function-section .favorite-detail-panel,\r
.portal-function-section .favorite-add-box,\r
.portal-function-section .table-panel,\r
.portal-function-section .favorite-table-panel,\r
.portal-function-section .node-modal,\r
.portal-function-section .state-panel {\r
  border: 1px solid rgba(7, 7, 7, .12);\r
  border-radius: 28px;\r
  background:\r
    linear-gradient(145deg, rgba(255, 255, 255, .84), rgba(255, 250, 240, .58)),\r
    rgba(255, 255, 255, .72);\r
  box-shadow: 0 24px 64px rgba(13, 74, 124, .12);\r
  backdrop-filter: blur(18px) saturate(1.12);\r
}\r
\r
.portal-function-section .page-heading {\r
  position: relative;\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 22px;\r
  padding: 26px 28px;\r
  overflow: hidden;\r
}\r
\r
.portal-function-section .page-heading::before {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  background: radial-gradient(circle at 8% 0%, rgba(216, 58, 46, .12), transparent 24%), radial-gradient(circle at 94% 0%, rgba(244, 180, 63, .14), transparent 28%);\r
  pointer-events: none;\r
}\r
\r
.portal-function-section .page-heading > * {\r
  position: relative;\r
  z-index: 1;\r
}\r
\r
.portal-function-section .page-heading h2,\r
.portal-function-section .panel-title h3,\r
.portal-function-section .side-section h3,\r
.portal-function-section .community-question-card h3,\r
.portal-function-section .learning-hero-node h3 {\r
  font-family: var(--display-cn);\r
  letter-spacing: .04em;\r
}\r
\r
.portal-function-section .page-heading h2 {\r
  margin-top: 6px;\r
  font-size: clamp(32px, 3vw, 48px);\r
  line-height: 1.08;\r
}\r
\r
.portal-function-section .eyebrow {\r
  display: inline-flex;\r
  align-items: center;\r
  width: max-content;\r
  min-height: 26px;\r
  margin: 0 0 8px;\r
  padding: 0 10px;\r
  border: 1px solid rgba(216, 58, 46, .22);\r
  border-radius: 999px;\r
  background: rgba(216, 58, 46, .08);\r
  color: #b92f25;\r
  font-size: 12px;\r
  letter-spacing: .12em;\r
}\r
\r
.portal-function-section .filter-bar {\r
  display: grid;\r
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;\r
  gap: 16px;\r
  align-items: end;\r
  padding: 18px;\r
}\r
\r
.portal-function-section .compact-filter,\r
.portal-function-section .learning-filter {\r
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;\r
}\r
\r
.portal-function-section label {\r
  display: grid;\r
  gap: 8px;\r
}\r
\r
.portal-function-section input,\r
.portal-function-section select,\r
.portal-function-section textarea {\r
  min-height: 44px;\r
  border: 1px solid rgba(7, 7, 7, .14);\r
  border-radius: 14px;\r
  background: rgba(255, 255, 255, .86);\r
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .72);\r
  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;\r
}\r
\r
.portal-function-section textarea {\r
  padding: 12px 14px;\r
}\r
\r
.portal-function-section input:focus,\r
.portal-function-section select:focus,\r
.portal-function-section textarea:focus {\r
  outline: none;\r
  border-color: rgba(216, 58, 46, .56);\r
  box-shadow: 0 0 0 4px rgba(216, 58, 46, .1);\r
  background: #fff;\r
}\r
\r
.portal-function-section .primary-action,\r
.portal-function-section .secondary-action,\r
.portal-function-section .danger-action,\r
.portal-function-section .icon-only,\r
.portal-function-section .row-actions button {\r
  display: inline-flex;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 8px;\r
  min-height: 42px;\r
  border: 1px solid rgba(7, 7, 7, .14);\r
  border-radius: 999px;\r
  font-weight: 900;\r
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease, background .2s ease;\r
}\r
\r
.portal-function-section .primary-action {\r
  border-color: rgba(216, 58, 46, .9);\r
  background: linear-gradient(135deg, #d83a2e, #f4b43f);\r
  color: #fff;\r
  box-shadow: 0 14px 30px rgba(216, 58, 46, .22);\r
}\r
\r
.portal-function-section .secondary-action,\r
.portal-function-section .icon-only {\r
  background: rgba(255, 255, 255, .72);\r
}\r
\r
.portal-function-section .primary-action:hover,\r
.portal-function-section .secondary-action:hover,\r
.portal-function-section .icon-only:hover,\r
.portal-function-section .row-actions button:hover {\r
  transform: translateY(-1px);\r
  border-color: rgba(244, 180, 63, .72);\r
  box-shadow: 0 12px 26px rgba(13, 74, 124, .14);\r
}\r
\r
.portal-function-section .graph-board-layout {\r
  display: grid;\r
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, .65fr);\r
}\r
\r
.portal-function-section .community-workbench {\r
  display: grid;\r
  grid-template-columns: minmax(360px, .78fr) minmax(0, 1.22fr);\r
}\r
\r
.portal-function-section .compact-favorite-workbench,\r
.portal-function-section .compact-learning-workbench {\r
  display: grid;\r
  grid-template-columns: minmax(360px, .75fr) minmax(0, 1.25fr);\r
}\r
\r
.portal-function-section .graph-board-layout,\r
.portal-function-section .community-workbench,\r
.portal-function-section .learning-workbench,\r
.portal-function-section .compact-learning-workbench,\r
.portal-function-section .compact-favorite-workbench {\r
  gap: 22px;\r
  align-items: start;\r
}\r
\r
.portal-function-section .graph-workbench,\r
.portal-function-section .favorite-visual-stack,\r
.portal-function-section .learning-side,\r
.portal-function-section .graph-side-panel,\r
.portal-function-section .community-detail-panel,\r
.portal-function-section .favorite-detail-panel {\r
  display: grid;\r
  gap: 18px;\r
}\r
\r
.portal-function-section .graph-stage,\r
.portal-function-section .favorite-graph-stage {\r
  overflow: hidden;\r
  border: 1px solid rgba(7, 7, 7, .14);\r
  border-radius: 28px;\r
  background:\r
    radial-gradient(circle at 50% 42%, rgba(244, 180, 63, .2), transparent 36%),\r
    radial-gradient(circle at 18% 18%, rgba(30, 156, 255, .2), transparent 26%),\r
    linear-gradient(90deg, rgba(30, 156, 255, .08) 1px, transparent 1px),\r
    linear-gradient(0deg, rgba(216, 58, 46, .06) 1px, transparent 1px),\r
    #eef8ff;\r
  background-size: auto, auto, 38px 38px, 38px 38px, auto;\r
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .72), 0 24px 58px rgba(13, 74, 124, .14);\r
}\r
\r
.portal-function-section .table-toolbar,\r
.portal-function-section .panel-title,\r
.portal-function-section .detail-title-row {\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 14px;\r
}\r
\r
.portal-function-section .table-toolbar {\r
  padding: 16px 18px;\r
  margin-bottom: 12px;\r
}\r
\r
.portal-function-section .community-stats,\r
.portal-function-section .favorite-stats,\r
.portal-function-section .learning-stats,\r
.portal-function-section .learning-data-strip {\r
  display: grid;\r
  gap: 16px;\r
}\r
\r
.portal-function-section .community-session-strip {\r
  display: flex;\r
  align-items: center;\r
  flex-wrap: wrap;\r
  gap: 10px;\r
  margin-top: 14px;\r
  padding: 13px 16px;\r
  border: 1px solid rgba(7, 7, 7, .1);\r
  border-radius: 20px;\r
  background: rgba(255, 255, 255, .72);\r
  box-shadow: 0 14px 34px rgba(13, 74, 124, .08);\r
}\r
\r
.portal-function-section .community-session-strip span,\r
.portal-function-section .community-session-strip small {\r
  color: rgba(7, 7, 7, .58);\r
  font-size: 12px;\r
}\r
\r
.portal-function-section .community-session-strip strong {\r
  color: #b92f25;\r
}\r
\r
.portal-function-section .community-stats,\r
.portal-function-section .favorite-stats,\r
.portal-function-section .learning-stats {\r
  grid-template-columns: repeat(3, minmax(0, 1fr));\r
}\r
\r
.portal-function-section .learning-data-strip {\r
  grid-template-columns: minmax(0, 1fr) minmax(320px, .7fr);\r
  align-items: stretch;\r
}\r
\r
.portal-function-section .community-stats article,\r
.portal-function-section .favorite-stats article,\r
.portal-function-section .learning-stats article,\r
.portal-function-section .community-question-card,\r
.portal-function-section .favorite-list article,\r
.portal-function-section .learning-recommend-list article,\r
.portal-function-section .learning-hot-list article,\r
.portal-function-section .chain-card,\r
.portal-function-section .relation-list article,\r
.portal-function-section .learning-hero-node,\r
.portal-function-section .community-answer-list article,\r
.portal-function-section .community-inheritor-list article,\r
.portal-function-section .learning-calendar,\r
.portal-function-section .favorite-add-box,\r
.portal-function-section .favorite-detail-panel .side-section {\r
  border: 1px solid rgba(7, 7, 7, .11);\r
  border-radius: 22px;\r
  background: rgba(255, 255, 255, .66);\r
  box-shadow: 0 14px 34px rgba(13, 74, 124, .1);\r
}\r
\r
.portal-function-section .community-question-card,\r
.portal-function-section .favorite-list article,\r
.portal-function-section .learning-recommend-list article,\r
.portal-function-section .learning-hot-list article,\r
.portal-function-section .chain-card,\r
.portal-function-section .relation-list article,\r
.portal-function-section .community-answer-list article,\r
.portal-function-section .community-inheritor-list article {\r
  padding: 16px;\r
}\r
\r
.portal-function-section .community-answer-list article {\r
  position: relative;\r
  padding-left: 58px;\r
}\r
\r
.portal-function-section .community-answer-list article::before {\r
  position: absolute;\r
  top: 16px;\r
  left: 16px;\r
  display: grid;\r
  place-items: center;\r
  width: 34px;\r
  height: 34px;\r
  border-radius: 50%;\r
  background: linear-gradient(135deg, #d83a2e, #f4b43f);\r
  color: #fff;\r
  content: "答";\r
  font-weight: 1000;\r
}\r
\r
.portal-function-section .community-comment-list span {\r
  display: grid;\r
  grid-template-columns: 28px minmax(0, 1fr);\r
  gap: 9px;\r
  align-items: start;\r
  border-left: 0;\r
  border-radius: 16px;\r
  padding: 9px 11px;\r
  background: rgba(255, 255, 255, .58);\r
}\r
\r
.portal-function-section .community-comment-list span::before {\r
  display: grid;\r
  place-items: center;\r
  width: 28px;\r
  height: 28px;\r
  border-radius: 50%;\r
  background: rgba(216, 58, 46, .12);\r
  color: #b92f25;\r
  content: "评";\r
  font-size: 12px;\r
  font-weight: 1000;\r
}\r
\r
.portal-function-section .community-inline-form {\r
  grid-template-columns: minmax(0, 1fr) 44px;\r
}\r
\r
.portal-function-section .community-question-card,\r
.portal-function-section .favorite-list article,\r
.portal-function-section .learning-recommend-list article {\r
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease, background .2s ease;\r
}\r
\r
.portal-function-section .community-question-card:hover,\r
.portal-function-section .community-question-card.selected,\r
.portal-function-section .favorite-list article:hover,\r
.portal-function-section .favorite-list article.selected,\r
.portal-function-section .learning-recommend-list article:hover {\r
  transform: translateY(-2px);\r
  border-color: rgba(216, 58, 46, .46);\r
  background: rgba(255, 255, 255, .84);\r
  box-shadow: inset 4px 0 0 #d83a2e, 0 18px 42px rgba(216, 58, 46, .12);\r
}\r
\r
.portal-function-section .type-chip,\r
.portal-function-section .status-chip,\r
.portal-function-section .learning-focus-chip,\r
.portal-function-section .community-thread-actions span,\r
.portal-function-section .community-thread-actions small {\r
  border: 1px solid rgba(244, 180, 63, .34);\r
  background: rgba(244, 180, 63, .14);\r
  color: #7a4c05;\r
  font-weight: 900;\r
}\r
\r
.portal-function-section .inline-error,\r
.portal-function-section .inline-success {\r
  border-radius: 18px;\r
  padding: 12px 16px;\r
}\r
\r
.community-hero-image {\r
  width: min(32vw, 430px);\r
  justify-self: center;\r
  transform: rotate(3deg) scale(.88);\r
  transform-origin: center;\r
}\r
\r
.community-trail-hero {\r
  grid-template-columns: 1fr;\r
  align-items: center;\r
  min-height: 100vh;\r
  padding: clamp(150px, 16vh, 190px) clamp(28px, 5vw, 72px) clamp(70px, 10vh, 110px);\r
  background:\r
    radial-gradient(circle at 16% 28%, rgba(30, 156, 255, .22), transparent 30%),\r
    radial-gradient(circle at 84% 18%, rgba(244, 180, 63, .28), transparent 28%),\r
    radial-gradient(circle at 48% 78%, rgba(216, 58, 46, .12), transparent 34%),\r
    linear-gradient(110deg, #e8f6ff 0%, #fff8eb 48%, #f8ead4 100%);\r
  cursor: crosshair;\r
}\r
\r
.community-trail-hero::before {\r
  z-index: 0;\r
  background:\r
    linear-gradient(90deg, rgba(7, 7, 7, .045) 1px, transparent 1px),\r
    linear-gradient(0deg, rgba(7, 7, 7, .035) 1px, transparent 1px),\r
    radial-gradient(circle at 78% 28%, rgba(255, 255, 255, .4), transparent 28%);\r
  background-size: 36px 36px, 36px 36px, auto;\r
  mask-image: none;\r
}\r
\r
.community-trail-hero::after {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  z-index: 1;\r
  background:\r
    radial-gradient(circle at 58% 46%, rgba(255, 255, 255, .18), transparent 28%),\r
    linear-gradient(90deg, rgba(232, 246, 255, .5), rgba(255, 248, 235, .18) 48%, rgba(248, 234, 212, .32));\r
  pointer-events: none;\r
}\r
\r
.community-trail-layer {\r
  position: absolute !important;\r
  top: 92px;\r
  right: 0;\r
  bottom: 0;\r
  left: min(48vw, 860px);\r
  z-index: 4 !important;\r
  overflow: visible;\r
  pointer-events: auto;\r
}\r
\r
.community-trail-copy {\r
  position: relative;\r
  z-index: 3 !important;\r
  width: min(980px, 52vw);\r
  pointer-events: auto;\r
}\r
\r
.community-trail-copy .label-tag {\r
  border-color: rgba(7, 7, 7, .48);\r
  background: rgba(255, 255, 255, .58);\r
  box-shadow: 0 14px 34px rgba(13, 74, 124, .12);\r
}\r
\r
.community-trail-copy h1 {\r
  max-width: 1060px;\r
  color: #050505;\r
  font-size: clamp(64px, 8.8vw, 148px);\r
  line-height: .92;\r
  letter-spacing: .1em;\r
  text-shadow: 0 1px 0 rgba(255, 255, 255, .72), 16px 20px 0 rgba(244, 180, 63, .1);\r
}\r
\r
.community-trail-copy p:not(.label-tag) {\r
  max-width: 760px;\r
  color: rgba(7, 7, 7, .68);\r
  font-size: clamp(16px, 1.4vw, 20px);\r
  line-height: 1.9;\r
}\r
\r
.community-trail-actions {\r
  margin-top: 26px;\r
  pointer-events: auto;\r
}\r
\r
.community-enter-btn {\r
  min-height: 52px;\r
  padding: 0 30px;\r
  border-radius: 999px;\r
  font-size: 17px;\r
  font-weight: 900;\r
  background: linear-gradient(135deg, #dc2626, #f97316 56%, #fbbf24);\r
  color: #fff;\r
  border: 0;\r
  box-shadow: 0 18px 40px rgba(216, 58, 46, .3);\r
}\r
\r
.community-portal-section {\r
  display: grid;\r
  place-items: center;\r
}\r
\r
.community-entry-board {\r
  position: relative;\r
  display: grid;\r
  gap: 22px;\r
  width: min(960px, 100%);\r
  padding: clamp(30px, 4vw, 52px);\r
  border: 1px solid rgba(124, 45, 18, .12);\r
  border-radius: 34px;\r
  background:\r
    radial-gradient(circle at 12% 0%, rgba(216, 58, 46, .12), transparent 30%),\r
    radial-gradient(circle at 88% 8%, rgba(244, 180, 63, .16), transparent 32%),\r
    linear-gradient(145deg, rgba(255, 255, 255, .94), rgba(255, 250, 242, .72));\r
  box-shadow: 0 28px 70px rgba(91, 55, 22, .14);\r
  backdrop-filter: blur(18px);\r
  text-align: center;\r
  justify-items: center;\r
}\r
\r
.community-entry-head h2 {\r
  margin: 12px 0 14px;\r
  max-width: 720px;\r
  color: #101828;\r
  font-family: var(--display-cn);\r
  font-size: clamp(26px, 3vw, 40px);\r
  line-height: 1.18;\r
  letter-spacing: .04em;\r
}\r
\r
.community-entry-head p:not(.label-tag) {\r
  max-width: 640px;\r
  margin: 0 auto;\r
  color: rgba(7, 7, 7, .64);\r
  font-size: 15px;\r
  line-height: 1.8;\r
}\r
\r
.community-entry-stats {\r
  display: grid;\r
  grid-template-columns: repeat(3, minmax(0, 1fr));\r
  gap: 16px;\r
  width: min(640px, 100%);\r
}\r
\r
.community-entry-stats article {\r
  display: grid;\r
  gap: 4px;\r
  padding: 20px 12px;\r
  border: 1px solid rgba(15, 23, 42, .08);\r
  border-radius: 22px;\r
  background: rgba(255, 255, 255, .72);\r
}\r
\r
.community-entry-stats strong {\r
  color: #b91c1c;\r
  font-family: var(--display-cn);\r
  font-size: clamp(28px, 3vw, 40px);\r
  line-height: 1;\r
}\r
\r
.community-entry-stats span {\r
  color: rgba(7, 7, 7, .56);\r
  font-size: 13px;\r
  font-weight: 800;\r
}\r
\r
.qa-portal-section {\r
  padding-top: clamp(28px, 3vw, 48px);\r
}\r
\r
@media (max-width: 720px) {\r
  .community-entry-stats {\r
    grid-template-columns: 1fr;\r
  }\r
}\r
\r
.product-portal-layout {\r
  display: grid;\r
  grid-template-columns: minmax(0, 1fr) minmax(320px, 390px);\r
  gap: 18px;\r
  align-items: start;\r
}\r
\r
.product-portal-page {\r
  background:\r
    linear-gradient(90deg, rgba(36, 93, 82, 0.05) 1px, transparent 1px),\r
    linear-gradient(0deg, rgba(123, 60, 39, 0.05) 1px, transparent 1px),\r
    linear-gradient(180deg, #f4eddf 0%, #fbf7ec 48%, #eee1d0 100%);\r
  background-size: 36px 36px, 36px 36px, auto;\r
  color: #241811;\r
}\r
\r
.product-portal-page .product-hero-panel {\r
  overflow: hidden;\r
  min-height: clamp(220px, 24vw, 320px);\r
  padding: clamp(28px, 4.5vw, 54px);\r
  border: 1px solid rgba(109, 77, 48, 0.18);\r
  border-radius: 8px;\r
  background:\r
    linear-gradient(115deg, rgba(255, 252, 242, 0.96), rgba(243, 231, 205, 0.84)),\r
    repeating-linear-gradient(90deg, rgba(94, 68, 42, 0.06) 0 1px, transparent 1px 72px);\r
  box-shadow: 0 22px 56px rgba(67, 45, 27, 0.1);\r
}\r
\r
.product-portal-page .product-hero-panel h1 {\r
  max-width: 10em;\r
  color: #1f2a27;\r
  font-size: clamp(42px, 6vw, 72px);\r
  line-height: 1.02;\r
}\r
\r
.product-portal-page .product-hero-panel p:not(.label-tag) {\r
  max-width: 560px;\r
  color: rgba(36, 24, 17, 0.66);\r
}\r
\r
.product-hero-metrics {\r
  align-self: stretch;\r
  display: grid;\r
  grid-template-columns: repeat(3, minmax(0, 1fr));\r
  gap: 10px;\r
}\r
\r
.product-hero-metrics article {\r
  display: grid;\r
  align-content: space-between;\r
  min-height: 124px;\r
  padding: 16px;\r
  border: 1px solid rgba(68, 98, 86, 0.18);\r
  border-radius: 8px;\r
  background: rgba(255, 255, 255, 0.48);\r
}\r
\r
.product-hero-metrics svg {\r
  color: #8f3d2e;\r
}\r
\r
.product-hero-metrics span {\r
  color: rgba(36, 24, 17, 0.58);\r
  font-size: 13px;\r
  font-weight: 800;\r
}\r
\r
.product-hero-metrics strong {\r
  color: #1f2a27;\r
  font-family: var(--display-cn);\r
  font-size: 34px;\r
}\r
\r
.product-portal-page .product-filter-panel {\r
  grid-template-columns: minmax(160px, 0.36fr) minmax(260px, 1fr) minmax(160px, 0.3fr) auto;\r
  gap: 12px;\r
  align-items: end;\r
  border: 1px solid rgba(109, 77, 48, 0.18);\r
  border-radius: 8px;\r
  background: rgba(255, 252, 242, 0.9);\r
  box-shadow: 0 18px 48px rgba(67, 45, 27, 0.1);\r
}\r
\r
.product-catalog-head {\r
  display: grid;\r
  gap: 4px;\r
}\r
\r
.product-catalog-head span,\r
.product-portal-page .product-filter-panel label span {\r
  color: rgba(36, 24, 17, 0.58);\r
  font-size: 12px;\r
  font-weight: 900;\r
}\r
\r
.product-catalog-head strong {\r
  color: #1f2a27;\r
  font-size: 15px;\r
}\r
\r
.product-portal-page .product-filter-panel label {\r
  display: grid;\r
  gap: 7px;\r
}\r
\r
.product-search-field {\r
  display: grid;\r
  grid-template-columns: auto minmax(0, 1fr);\r
  gap: 8px;\r
  align-items: center;\r
  min-height: 42px;\r
  padding: 0 12px;\r
  border: 1px solid rgba(54, 84, 75, 0.22);\r
  background: rgba(255, 255, 255, 0.82);\r
}\r
\r
.product-search-field svg {\r
  color: rgba(36, 24, 17, 0.46);\r
}\r
\r
.product-portal-page .product-filter-panel input,\r
.product-portal-page .product-filter-panel select {\r
  min-height: 42px;\r
  border-color: rgba(54, 84, 75, 0.22);\r
  background: rgba(255, 255, 255, 0.82);\r
  color: #1f2a27;\r
}\r
\r
.product-search-field input {\r
  min-height: 0;\r
  padding: 0;\r
  border: 0;\r
  background: transparent;\r
}\r
\r
.product-portal-page .directory-grid {\r
  grid-template-columns: repeat(2, minmax(0, 1fr));\r
  align-items: stretch;\r
}\r
\r
.product-catalog-panel {\r
  min-width: 0;\r
}\r
\r
.product-catalog-panel > .directory-grid {\r
  width: min(1320px, 100%);\r
  margin: 0 auto;\r
}\r
\r
.product-card {\r
  cursor: pointer;\r
  grid-template-columns: minmax(128px, 0.42fr) minmax(0, 1fr);\r
  min-height: 228px;\r
  border-radius: 8px;\r
  border-color: rgba(109, 77, 48, 0.16);\r
  background:\r
    linear-gradient(145deg, rgba(255, 254, 248, 0.94), rgba(250, 241, 219, 0.84));\r
  box-shadow: 0 14px 34px rgba(67, 45, 27, 0.09);\r
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;\r
}\r
\r
.product-card:hover {\r
  transform: translateY(-3px);\r
  border-color: rgba(54, 84, 75, 0.34);\r
  box-shadow: 0 22px 52px rgba(67, 45, 27, 0.14);\r
}\r
\r
.product-card-cover {\r
  position: relative;\r
  min-width: 0;\r
  min-height: 100%;\r
  margin: 0;\r
  overflow: hidden;\r
  border-right: 1px solid rgba(109, 77, 48, 0.12);\r
  background:\r
    linear-gradient(180deg, rgba(143, 61, 46, 0.14), rgba(56, 98, 84, 0.1)),\r
    rgba(255, 252, 242, 0.76);\r
}\r
\r
.product-card-cover img {\r
  width: 100%;\r
  height: 100%;\r
  min-height: 228px;\r
  object-fit: cover;\r
}\r
\r
.product-card-cover > span {\r
  display: grid;\r
  place-items: center;\r
  width: 100%;\r
  height: 100%;\r
  min-height: 228px;\r
  color: #8f3d2e;\r
  font-family: var(--display-cn);\r
  font-size: 48px;\r
  font-weight: 900;\r
}\r
\r
.product-card-cover svg {\r
  position: absolute;\r
  right: 10px;\r
  top: 10px;\r
  display: grid;\r
  place-items: center;\r
  width: 30px;\r
  height: 30px;\r
  padding: 6px;\r
  border-radius: 999px;\r
  background: rgba(255, 252, 242, 0.82);\r
  color: #2f6d5f;\r
  box-shadow: 0 8px 18px rgba(36, 24, 17, 0.12);\r
}\r
\r
.product-card-mark {\r
  display: grid;\r
  align-content: space-between;\r
  justify-items: center;\r
  padding: 18px 12px;\r
  border-right: 1px solid rgba(109, 77, 48, 0.12);\r
  background: linear-gradient(180deg, rgba(143, 61, 46, 0.12), rgba(56, 98, 84, 0.08));\r
  color: #8f3d2e;\r
}\r
\r
.product-card-mark span {\r
  display: grid;\r
  place-items: center;\r
  width: 42px;\r
  height: 42px;\r
  border: 1px solid rgba(143, 61, 46, 0.28);\r
  border-radius: 50%;\r
  background: rgba(255, 252, 242, 0.76);\r
  font-family: var(--display-cn);\r
  font-size: 24px;\r
}\r
\r
.product-card-mark svg {\r
  color: #2f6d5f;\r
}\r
\r
.product-card-body {\r
  display: grid;\r
  gap: 12px;\r
  padding: 18px;\r
}\r
\r
.product-card h2 {\r
  margin-top: 4px;\r
  color: #1f2a27;\r
  font-size: clamp(22px, 2vw, 28px);\r
  line-height: 1.25;\r
}\r
\r
.product-card small {\r
  color: rgba(36, 24, 17, 0.52);\r
}\r
\r
.product-card p {\r
  color: rgba(36, 24, 17, 0.64);\r
  display: -webkit-box;\r
  overflow: hidden;\r
  -webkit-box-orient: vertical;\r
  -webkit-line-clamp: 2;\r
}\r
\r
.product-card.selected {\r
  border-color: rgba(143, 61, 46, 0.56);\r
  box-shadow: 0 20px 54px rgba(143, 61, 46, 0.16);\r
}\r
\r
.product-meta-grid {\r
  display: grid;\r
  grid-template-columns: repeat(3, minmax(0, 1fr));\r
  gap: 8px;\r
}\r
\r
.product-meta-grid span {\r
  display: grid;\r
  gap: 3px;\r
  min-width: 0;\r
  padding: 8px;\r
  border: 1px solid rgba(109, 77, 48, 0.12);\r
  border-radius: 8px;\r
  background: rgba(255, 255, 255, 0.5);\r
  color: rgba(36, 24, 17, 0.54);\r
  font-size: 12px;\r
}\r
\r
.product-meta-grid strong {\r
  overflow: hidden;\r
  color: #1f2a27;\r
  font-size: 16px;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
\r
.rating-row {\r
  display: flex;\r
  justify-content: space-between;\r
  gap: 10px;\r
  align-items: center;\r
}\r
\r
.product-review-panel {\r
  position: sticky;\r
  top: 108px;\r
  display: grid;\r
  gap: 14px;\r
  padding: 22px;\r
  border: 1px solid rgba(86, 56, 36, 0.16);\r
  border-radius: 8px;\r
  background:\r
    linear-gradient(180deg, rgba(255, 253, 246, 0.96), rgba(247, 237, 213, 0.9));\r
  box-shadow: 0 22px 58px rgba(67, 45, 27, 0.13);\r
}\r
\r
.product-score-card {\r
  display: grid;\r
  gap: 10px;\r
  padding: 16px;\r
  border: 1px solid rgba(143, 61, 46, 0.2);\r
  border-radius: 8px;\r
  background: linear-gradient(145deg, rgba(143, 61, 46, 0.1), rgba(49, 93, 82, 0.07));\r
}\r
\r
.product-score-cover {\r
  margin: -16px -16px 2px;\r
  overflow: hidden;\r
  border-radius: 8px 8px 0 0;\r
  aspect-ratio: 4 / 3;\r
  background: rgba(36, 24, 17, 0.08);\r
}\r
\r
.product-score-cover img {\r
  width: 100%;\r
  height: 100%;\r
  object-fit: cover;\r
}\r
\r
.product-score-card > span {\r
  color: rgba(36, 24, 17, 0.56);\r
  font-size: 12px;\r
  font-weight: 900;\r
}\r
\r
.product-score-card > div {\r
  display: flex;\r
  align-items: end;\r
  justify-content: space-between;\r
  gap: 12px;\r
}\r
\r
.product-score-card strong {\r
  color: #8f3d2e;\r
  font-family: var(--display-cn);\r
  font-size: 42px;\r
  line-height: 1;\r
}\r
\r
.product-score-card small {\r
  color: rgba(36, 24, 17, 0.54);\r
  text-align: right;\r
}\r
\r
.product-review-panel h2,\r
.product-review-panel p {\r
  margin: 0;\r
}\r
\r
.product-description-markdown {\r
  max-height: 260px;\r
  overflow: auto;\r
  color: rgba(36, 24, 17, 0.72);\r
}\r
\r
.product-description-markdown h3,\r
.product-description-markdown h4,\r
.product-description-markdown h5 {\r
  margin: 8px 0 6px;\r
  color: #1f2a27;\r
  font-size: 18px;\r
}\r
\r
.product-description-markdown p,\r
.product-description-markdown li {\r
  color: rgba(36, 24, 17, 0.72);\r
  font-size: 14px;\r
  line-height: 1.75;\r
}\r
\r
.product-description-markdown ul,\r
.product-description-markdown ol {\r
  margin: 6px 0 0;\r
  padding-left: 18px;\r
}\r
\r
.product-description-markdown img {\r
  width: 100%;\r
  border-radius: 8px;\r
}\r
\r
.product-detail-page {\r
  background:\r
    linear-gradient(90deg, rgba(36, 93, 82, 0.05) 1px, transparent 1px),\r
    linear-gradient(0deg, rgba(123, 60, 39, 0.05) 1px, transparent 1px),\r
    linear-gradient(180deg, #f4eddf 0%, #fbf7ec 48%, #eee1d0 100%);\r
  background-size: 36px 36px, 36px 36px, auto;\r
  color: #241811;\r
}\r
\r
.product-detail-shell {\r
  width: min(1320px, calc(100% - 32px));\r
}\r
\r
.product-detail-layout {\r
  display: grid;\r
  grid-template-columns: minmax(0, 1fr) minmax(330px, 410px);\r
  gap: 18px;\r
  align-items: start;\r
}\r
\r
.product-detail-main {\r
  display: grid;\r
  gap: 18px;\r
  min-width: 0;\r
}\r
\r
.product-detail-cover {\r
  display: grid;\r
  place-items: center;\r
  margin: 0;\r
  overflow: hidden;\r
  aspect-ratio: 16 / 9;\r
  border: 1px solid rgba(109, 77, 48, 0.18);\r
  border-radius: 8px;\r
  background:\r
    linear-gradient(135deg, rgba(143, 61, 46, 0.13), rgba(49, 93, 82, 0.09)),\r
    rgba(255, 252, 242, 0.78);\r
  box-shadow: 0 22px 56px rgba(67, 45, 27, 0.12);\r
}\r
\r
.product-detail-cover img {\r
  width: 100%;\r
  height: 100%;\r
  object-fit: cover;\r
}\r
\r
.product-detail-cover-fallback {\r
  color: #8f3d2e;\r
  font-family: var(--display-cn);\r
  font-size: clamp(64px, 12vw, 136px);\r
  font-weight: 900;\r
}\r
\r
.product-detail-header {\r
  padding: clamp(24px, 4vw, 44px);\r
  border: 1px solid rgba(109, 77, 48, 0.18);\r
  border-radius: 8px;\r
  background: rgba(255, 252, 242, 0.92);\r
}\r
\r
.product-detail-header h1 {\r
  max-width: 12em;\r
}\r
\r
.product-detail-review-panel {\r
  top: 104px;\r
}\r
\r
.product-review-panel form,\r
.product-review-panel label {\r
  display: grid;\r
  gap: 8px;\r
}\r
\r
.product-review-panel input,\r
.product-review-panel select,\r
.product-review-panel textarea {\r
  width: 100%;\r
  border: 1px solid rgba(86, 56, 36, 0.18);\r
  background: rgba(255, 255, 255, 0.72);\r
  color: #241811;\r
  font: inherit;\r
}\r
\r
.product-review-panel input,\r
.product-review-panel select {\r
  min-height: 42px;\r
  padding: 0 12px;\r
}\r
\r
.product-review-panel textarea {\r
  min-height: 110px;\r
  padding: 12px;\r
  resize: vertical;\r
}\r
\r
.product-review-list {\r
  display: grid;\r
  gap: 10px;\r
}\r
\r
.product-review-list article {\r
  display: grid;\r
  gap: 8px;\r
  padding: 12px;\r
  border: 1px solid rgba(109, 77, 48, 0.12);\r
  border-radius: 8px;\r
  background: rgba(255, 255, 255, 0.44);\r
}\r
\r
.product-review-list article > div {\r
  display: flex;\r
  justify-content: space-between;\r
  gap: 10px;\r
}\r
\r
.product-review-list strong {\r
  color: #1f2a27;\r
}\r
\r
.product-review-list span {\r
  color: #8f3d2e;\r
  font-size: 13px;\r
  font-weight: 900;\r
}\r
\r
.product-review-list p {\r
  color: rgba(36, 24, 17, 0.66);\r
  line-height: 1.7;\r
}\r
\r
.review-empty {\r
  display: flex;\r
  gap: 8px;\r
  align-items: center;\r
  padding: 12px;\r
  border: 1px dashed rgba(109, 77, 48, 0.2);\r
  border-radius: 8px;\r
  color: rgba(36, 24, 17, 0.58);\r
}\r
\r
.rating-stars {\r
  display: inline-flex;\r
  gap: 3px;\r
  color: rgba(86, 56, 36, 0.32);\r
}\r
\r
.rating-stars .on {\r
  color: #b7791f;\r
  fill: currentColor;\r
}\r
\r
.directory-pagination {\r
  display: flex;\r
  justify-content: center;\r
  align-items: center;\r
  gap: 14px;\r
  margin-top: 24px;\r
}\r
\r
@media (max-width: 960px) {\r
  .product-portal-layout {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .product-detail-layout {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .product-review-panel {\r
    position: static;\r
  }\r
\r
  .product-portal-page .product-filter-panel,\r
  .product-hero-metrics {\r
    grid-template-columns: 1fr;\r
  }\r
}\r
\r
@media (max-width: 720px) {\r
  .product-card {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .product-card-cover {\r
    border-right: 0;\r
    border-bottom: 1px solid rgba(109, 77, 48, 0.12);\r
    aspect-ratio: 16 / 10;\r
  }\r
\r
  .product-card-cover img,\r
  .product-card-cover > span {\r
    min-height: 0;\r
  }\r
\r
  .product-card-mark {\r
    grid-template-columns: auto auto;\r
    justify-content: space-between;\r
    border-right: 0;\r
    border-bottom: 1px solid rgba(109, 77, 48, 0.12);\r
  }\r
\r
  .product-meta-grid {\r
    grid-template-columns: 1fr;\r
  }\r
}\r
\r
/* User portal: community discussion refresh */\r
.portal-function-section .community-page {\r
  width: min(1240px, 100%);\r
}\r
\r
.portal-function-section .community-page .page-heading {\r
  display: grid;\r
  grid-template-columns: minmax(0, 1fr) auto;\r
  border-radius: 34px;\r
}\r
\r
.portal-function-section .community-page .page-heading h2 {\r
  max-width: 760px;\r
  font-size: clamp(34px, 4vw, 62px);\r
}\r
\r
.portal-function-section .community-session-strip {\r
  width: max-content;\r
  max-width: 100%;\r
  margin-top: -6px;\r
}\r
\r
.portal-function-section .community-stats {\r
  grid-template-columns: repeat(4, minmax(0, 1fr));\r
}\r
\r
.portal-function-section .community-stats article {\r
  min-height: 118px;\r
  padding: 22px;\r
  border-radius: 26px;\r
}\r
\r
.portal-function-section .community-workbench {\r
  grid-template-columns: minmax(330px, .42fr) minmax(0, .58fr);\r
  gap: 24px;\r
}\r
\r
.portal-function-section .community-list-panel,\r
.portal-function-section .community-detail-panel {\r
  border-radius: 34px;\r
}\r
\r
.portal-function-section .community-list-panel {\r
  position: sticky;\r
  top: 96px;\r
  align-self: start;\r
  padding: 20px;\r
}\r
\r
.portal-function-section .community-question-list {\r
  display: grid;\r
  gap: 14px;\r
}\r
\r
.portal-function-section .community-question-card {\r
  display: grid;\r
  gap: 10px;\r
  width: 100%;\r
  padding: 18px;\r
  border-radius: 24px;\r
  cursor: pointer;\r
  text-align: left;\r
}\r
\r
.portal-function-section .community-question-card h3 {\r
  font-size: 24px;\r
  line-height: 1.16;\r
}\r
\r
.portal-function-section .community-question-card p {\r
  display: -webkit-box;\r
  overflow: hidden;\r
  -webkit-line-clamp: 2;\r
  -webkit-box-orient: vertical;\r
}\r
\r
.portal-function-section .community-detail-panel {\r
  display: grid;\r
  gap: 18px;\r
  background: transparent;\r
  border: 0;\r
  box-shadow: none;\r
  backdrop-filter: none;\r
}\r
\r
.portal-function-section .community-detail-panel > .side-section,\r
.portal-function-section .community-detail-panel > template + .side-section {\r
  border-radius: 30px;\r
}\r
\r
.portal-function-section .community-question-detail {\r
  padding: 30px;\r
  background:\r
    radial-gradient(circle at 0% 0%, rgba(244, 180, 63, .18), transparent 30%),\r
    rgba(255, 255, 255, .82);\r
}\r
\r
.portal-function-section .community-question-detail h3 {\r
  max-width: 760px;\r
  font-size: clamp(30px, 3vw, 48px);\r
  line-height: 1.12;\r
}\r
\r
.portal-function-section .community-question-detail > p {\r
  margin: 18px 0;\r
  color: rgba(7, 7, 7, .72);\r
  font-size: 17px;\r
  line-height: 1.78;\r
}\r
\r
.portal-function-section .community-compose {\r
  padding: 22px;\r
}\r
\r
.portal-function-section .community-compose textarea,\r
.portal-function-section .community-inline-form input {\r
  border-radius: 20px;\r
  background: rgba(255, 255, 255, .82);\r
}\r
\r
.portal-function-section .community-answer-list {\r
  display: grid;\r
  gap: 16px;\r
}\r
\r
.portal-function-section .community-answer-list article {\r
  border-radius: 26px;\r
  background:\r
    linear-gradient(145deg, rgba(255, 255, 255, .88), rgba(255, 248, 235, .62)),\r
    rgba(255, 255, 255, .76);\r
}\r
\r
.portal-function-section .community-answer-list article strong {\r
  display: block;\r
  margin-bottom: 3px;\r
  color: #070707;\r
  font-size: 17px;\r
}\r
\r
.portal-function-section .community-answer-list article p {\r
  margin: 14px 0;\r
  color: rgba(7, 7, 7, .72);\r
  font-size: 16px;\r
  line-height: 1.72;\r
}\r
\r
.portal-function-section .community-comment-list {\r
  display: grid;\r
  gap: 10px;\r
  margin-top: 12px;\r
}\r
\r
.portal-function-section .community-comment-list.standalone {\r
  margin: 0 0 14px;\r
}\r
\r
.portal-function-section .community-inline-form {\r
  display: grid;\r
  gap: 10px;\r
  align-items: center;\r
  margin-top: 14px;\r
}\r
\r
@media (max-width: 1120px) {\r
  .community-trail-hero {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .community-trail-copy {\r
    width: min(980px, 100%);\r
  }\r
\r
  .community-trail-layer {\r
    left: 28vw;\r
  }\r
\r
  .community-hero-image {\r
    width: min(76vw, 420px);\r
    justify-self: start;\r
  }\r
\r
  .portal-function-section .community-page .page-heading,\r
  .portal-function-section .community-workbench {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .portal-function-section .community-list-panel {\r
    position: static;\r
  }\r
\r
  .portal-function-section .community-stats {\r
    grid-template-columns: repeat(2, minmax(0, 1fr));\r
  }\r
}\r
\r
/* Consumer-style 收藏学习 page */\r
.portal-function-section:has(.learning-space-page),\r
.portal-function-section:has(.learning-journey-page) {\r
  gap: 34px;\r
  background:\r
    radial-gradient(circle at 8% 4%, rgba(216, 58, 46, .16), transparent 26%),\r
    radial-gradient(circle at 86% 10%, rgba(244, 180, 63, .22), transparent 30%),\r
    radial-gradient(circle at 44% 68%, rgba(30, 156, 255, .16), transparent 34%),\r
    linear-gradient(180deg, #fff7e8 0%, #eaf7ff 48%, #fff3df 100%);\r
}\r
\r
.learning-space-page,\r
.learning-journey-page {\r
  width: min(1280px, 100%);\r
  margin: 0 auto;\r
  color: #080808;\r
}\r
\r
.learning-space-hero,\r
.learning-journey-hero,\r
.learning-space-discovery,\r
.my-favorites-panel,\r
.learning-map-card,\r
.learning-note-card,\r
.learning-focus-card,\r
.learning-journey-controls,\r
.daily-recommend-card,\r
.checkin-calendar-card,\r
.hot-heritage-card {\r
  position: relative;\r
  overflow: hidden;\r
  border: 1px solid rgba(7, 7, 7, .12);\r
  border-radius: 34px;\r
  background:\r
    linear-gradient(145deg, rgba(255, 255, 255, .9), rgba(255, 248, 235, .66)),\r
    rgba(255, 255, 255, .78);\r
  box-shadow: 0 28px 70px rgba(13, 74, 124, .12);\r
  backdrop-filter: blur(18px) saturate(1.12);\r
}\r
\r
.learning-map-card {\r
  display: grid;\r
  grid-template-rows: auto 1fr;\r
  align-content: start;\r
}\r
\r
.learning-space-hero,\r
.learning-journey-hero {\r
  display: grid;\r
  grid-template-columns: minmax(0, 1fr) minmax(260px, .38fr);\r
  gap: 24px;\r
  align-items: end;\r
  padding: clamp(30px, 4vw, 52px);\r
}\r
\r
.learning-space-hero::before,\r
.learning-journey-hero::before,\r
.learning-space-discovery::before,\r
.daily-recommend-card::before {\r
  content: "";\r
  position: absolute;\r
  inset: 0;\r
  background:\r
    radial-gradient(circle at 8% 0%, rgba(216, 58, 46, .13), transparent 28%),\r
    radial-gradient(circle at 92% 10%, rgba(244, 180, 63, .16), transparent 30%);\r
  pointer-events: none;\r
}\r
\r
.learning-space-hero > *,\r
.learning-journey-hero > *,\r
.learning-space-discovery > *,\r
.daily-recommend-card > * {\r
  position: relative;\r
  z-index: 1;\r
}\r
\r
.learning-space-hero-copy h2,\r
.learning-journey-hero h2,\r
.discovery-copy h3,\r
.my-favorites-panel h3,\r
.learning-panel-title h3,\r
.learning-note-card h3,\r
.learning-focus-card h3,\r
.daily-recommend-card h3,\r
.checkin-calendar-card h3,\r
.hot-heritage-card h3 {\r
  margin: 0;\r
  font-family: var(--display-cn);\r
  color: #070707;\r
  letter-spacing: .04em;\r
}\r
\r
.learning-space-hero-copy h2,\r
.learning-journey-hero h2 {\r
  max-width: 820px;\r
  font-size: clamp(42px, 5.2vw, 82px);\r
  line-height: 1.04;\r
  text-shadow: 0 1px 0 rgba(255, 255, 255, .72), 10px 14px 0 rgba(244, 180, 63, .12);\r
}\r
\r
.learning-space-hero-copy > span,\r
.learning-journey-hero > div:first-child > span,\r
.discovery-copy p,\r
.learning-space-user-card span,\r
.learning-space-page small,\r
.learning-journey-page small,\r
.favorite-learning-card p,\r
.learning-focus-card p,\r
.daily-learning-list p {\r
  color: rgba(7, 7, 7, .64);\r
  font-family: var(--body-cn);\r
  line-height: 1.7;\r
}\r
\r
.learning-space-hero-copy > span,\r
.learning-journey-hero > div:first-child > span {\r
  display: block;\r
  max-width: 760px;\r
  margin-top: 18px;\r
  font-size: 17px;\r
}\r
\r
.learning-space-user-card,\r
.learning-journey-actions {\r
  display: grid;\r
  gap: 14px;\r
  padding: 18px;\r
  border: 1px solid rgba(7, 7, 7, .1);\r
  border-radius: 24px;\r
  background: rgba(255, 255, 255, .62);\r
}\r
\r
.learning-user-status {\r
  display: grid;\r
  gap: 8px;\r
  padding-top: 12px;\r
  border-top: 1px solid rgba(122, 76, 45, .12);\r
}\r
\r
.learning-user-status span {\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 12px;\r
  color: rgba(7, 7, 7, .62);\r
  font-size: 13px;\r
  font-weight: 900;\r
}\r
\r
.learning-space-user-card label {\r
  display: grid;\r
  gap: 8px;\r
}\r
\r
.learning-user-summary {\r
  display: grid;\r
  grid-template-columns: 48px minmax(0, 1fr);\r
  align-items: center;\r
  gap: 12px;\r
}\r
\r
.learning-user-summary > span {\r
  display: grid;\r
  place-items: center;\r
  width: 48px;\r
  height: 48px;\r
  border-radius: 18px;\r
  background: linear-gradient(135deg, rgba(216, 58, 46, .92), rgba(244, 180, 63, .92));\r
  color: #fff;\r
  font-size: 20px;\r
  font-weight: 1000;\r
  box-shadow: 0 14px 28px rgba(216, 58, 46, .2);\r
}\r
\r
.learning-user-summary strong,\r
.learning-user-summary small {\r
  display: block;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
\r
.learning-user-summary strong {\r
  color: #070707;\r
  font-size: 17px;\r
}\r
\r
.learning-user-summary small {\r
  margin-top: 4px;\r
  color: rgba(7, 7, 7, .58);\r
  font-size: 12px;\r
  line-height: 1.45;\r
}\r
\r
.learning-user-summary:not(.signed) > span {\r
  background: linear-gradient(135deg, rgba(7, 7, 7, .78), rgba(7, 7, 7, .48));\r
}\r
\r
.learning-space-metrics,\r
.learning-journey-overview {\r
  display: grid;\r
  grid-template-columns: repeat(4, minmax(0, 1fr));\r
  gap: 16px;\r
}\r
\r
.learning-space-metrics {\r
  grid-column: 1 / -1;\r
  margin-top: 6px;\r
}\r
\r
.learning-space-metrics article,\r
.learning-journey-overview article {\r
  display: grid;\r
  gap: 8px;\r
  min-height: 126px;\r
  padding: 22px;\r
  border: 1px solid rgba(7, 7, 7, .1);\r
  border-radius: 26px;\r
  background: rgba(255, 255, 255, .68);\r
  box-shadow: 0 16px 40px rgba(13, 74, 124, .09);\r
}\r
\r
.learning-space-metrics svg,\r
.learning-journey-overview svg,\r
.learning-space-metrics span,\r
.learning-journey-overview span {\r
  color: #a62b23;\r
  font-weight: 900;\r
}\r
\r
.learning-space-metrics strong,\r
.learning-journey-overview strong {\r
  font-size: clamp(28px, 3vw, 44px);\r
  line-height: 1;\r
}\r
\r
.learning-space-discovery {\r
  display: grid;\r
  grid-template-columns: minmax(300px, .42fr) minmax(0, .58fr);\r
  gap: 24px;\r
  padding: 30px;\r
}\r
\r
.discovery-copy h3 {\r
  max-width: 460px;\r
  font-size: clamp(32px, 3vw, 52px);\r
  line-height: 1.08;\r
}\r
\r
.discovery-copy p {\r
  margin: 16px 0 0;\r
  max-width: 480px;\r
}\r
\r
.discovery-controls {\r
  display: grid;\r
  grid-template-columns: repeat(2, minmax(0, 1fr));\r
  gap: 14px;\r
  align-items: end;\r
}\r
\r
.discovery-controls label,\r
.favorite-search-row,\r
.learning-journey-controls label {\r
  display: grid;\r
  gap: 8px;\r
}\r
\r
.discovery-search,\r
.discovery-note {\r
  grid-column: span 2;\r
}\r
\r
.learning-space-main,\r
.learning-journey-main {\r
  display: grid;\r
  grid-template-columns: minmax(340px, .38fr) minmax(0, .62fr);\r
  gap: 24px;\r
  align-items: start;\r
}\r
\r
.learning-space-workbench {\r
  display: grid;\r
  grid-template-columns: minmax(280px, .28fr) minmax(0, .72fr);\r
  gap: 20px;\r
  align-items: start;\r
}\r
\r
.space-section-panel {\r
  display: grid;\r
  gap: 18px;\r
}\r
\r
.learning-journey-main {\r
  grid-template-columns: minmax(0, 1.14fr) minmax(340px, .86fr);\r
  gap: clamp(22px, 3vw, 34px);\r
}\r
\r
.learning-companion-panel {\r
  grid-template-rows: auto auto;\r
}\r
\r
.my-favorites-panel,\r
.learning-map-card,\r
.daily-recommend-card,\r
.checkin-calendar-card,\r
.hot-heritage-card {\r
  padding: 26px;\r
}\r
\r
.learning-map-card {\r
  display: grid;\r
  grid-template-rows: auto 1fr;\r
  align-content: start;\r
}\r
\r
.learning-panel-title {\r
  display: flex;\r
  align-items: start;\r
  justify-content: space-between;\r
  gap: 16px;\r
  margin-bottom: 18px;\r
}\r
\r
.learning-panel-title h3 {\r
  font-size: clamp(26px, 2.4vw, 38px);\r
  line-height: 1.08;\r
}\r
\r
.favorite-search-row {\r
  grid-template-columns: 1fr auto auto;\r
  gap: 10px;\r
  align-items: end;\r
  margin-bottom: 16px;\r
}\r
\r
.favorite-learning-list,\r
.daily-learning-list,\r
.consumer-hot-list {\r
  display: grid;\r
  gap: 14px;\r
}\r
\r
.favorite-learning-card,\r
.daily-learning-list article,\r
.consumer-hot-list article {\r
  position: relative;\r
  display: grid;\r
  border: 1px solid rgba(7, 7, 7, .1);\r
  border-radius: 24px;\r
  background: rgba(255, 255, 255, .7);\r
  box-shadow: 0 14px 34px rgba(13, 74, 124, .09);\r
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease, background .2s ease;\r
}\r
\r
.favorite-learning-card:hover,\r
.favorite-learning-card.selected,\r
.daily-learning-list article:hover,\r
.consumer-hot-list article:hover {\r
  transform: translateY(-2px);\r
  border-color: rgba(216, 58, 46, .42);\r
  background: rgba(255, 255, 255, .86);\r
  box-shadow: inset 4px 0 0 #d83a2e, 0 18px 44px rgba(216, 58, 46, .12);\r
}\r
\r
.favorite-learning-card > button:first-child {\r
  display: grid;\r
  gap: 8px;\r
  width: 100%;\r
  padding: 18px 52px 18px 18px;\r
  border: 0;\r
  background: transparent;\r
  color: inherit;\r
  cursor: pointer;\r
  text-align: left;\r
}\r
\r
.favorite-learning-card strong,\r
.daily-learning-list strong,\r
.consumer-hot-list strong,\r
.learning-note-card strong,\r
.learning-focus-card strong {\r
  color: #070707;\r
  font-size: 18px;\r
}\r
\r
.favorite-learning-card .danger-icon {\r
  position: absolute;\r
  top: 16px;\r
  right: 16px;\r
  width: 32px;\r
  height: 32px;\r
  border: 1px solid rgba(216, 58, 46, .2);\r
  border-radius: 50%;\r
  background: rgba(255, 255, 255, .72);\r
  color: #b92f25;\r
  cursor: pointer;\r
}\r
\r
.learning-map-experience,\r
.learning-companion-panel {\r
  display: grid;\r
  gap: 20px;\r
}\r
\r
.learning-main-column {\r
  display: grid;\r
  gap: 20px;\r
  min-width: 0;\r
}\r
\r
.learning-map-and-checkin {\r
  display: grid;\r
  grid-template-columns: minmax(0, 1fr) minmax(300px, 340px);\r
  gap: 22px;\r
  align-items: start;\r
}\r
\r
.learning-space-sidecar,\r
.space-daily-recommend-card,\r
.space-checkin-card {\r
  display: grid;\r
  gap: 14px;\r
}\r
\r
.learning-space-sidecar {\r
  gap: 18px;\r
}\r
\r
.space-daily-recommend-card,\r
.space-checkin-card {\r
  padding: 20px;\r
  border: 1px solid rgba(7, 7, 7, .08);\r
  border-radius: 22px;\r
  background: rgba(255, 255, 255, .78);\r
  box-shadow: 0 6px 18px rgba(119, 66, 38, .06);\r
}\r
\r
.space-date-field {\r
  display: grid;\r
  gap: 7px;\r
  padding: 12px;\r
  border: 1px solid rgba(216, 58, 46, .12);\r
  border-radius: 18px;\r
  background: rgba(255, 255, 255, .58);\r
}\r
\r
.space-date-field span {\r
  color: rgba(7, 7, 7, .62);\r
  font-weight: 900;\r
}\r
\r
.space-top-recommend {\r
  display: grid;\r
  gap: 8px;\r
  padding: 16px;\r
  border-radius: 22px;\r
  background:\r
    radial-gradient(circle at 0% 0%, rgba(244, 180, 63, .22), transparent 38%),\r
    linear-gradient(135deg, rgba(216, 58, 46, .1), rgba(255, 255, 255, .72));\r
}\r
\r
.space-top-recommend span {\r
  color: #a62b23;\r
  font-weight: 1000;\r
}\r
\r
.space-top-recommend strong {\r
  font-family: var(--display-cn);\r
  font-size: clamp(26px, 2.5vw, 38px);\r
  line-height: 1.08;\r
}\r
\r
.space-top-recommend p,\r
.space-recommend-list p {\r
  display: -webkit-box;\r
  overflow: hidden;\r
  margin: 0;\r
  -webkit-line-clamp: 2;\r
  -webkit-box-orient: vertical;\r
}\r
\r
.space-recommend-list article {\r
  grid-template-columns: 40px 1fr;\r
  padding: 14px;\r
}\r
\r
.space-checkin-toolbar {\r
  grid-template-columns: minmax(0, 1fr);\r
  gap: 12px;\r
}\r
\r
.space-checkin-toolbar .checkin-action {\r
  width: 100%;\r
  justify-content: center;\r
}\r
\r
.checkin-month-field {\r
  display: grid;\r
  gap: 7px;\r
}\r
\r
.checkin-month-field span {\r
  color: rgba(7, 7, 7, .62);\r
  font-weight: 900;\r
}\r
\r
.compact-space-calendar {\r
  gap: 6px;\r
  padding: 12px;\r
}\r
\r
.compact-space-calendar span {\r
  min-height: 32px;\r
  border-radius: 11px;\r
}\r
\r
.compact-space-calendar span strong {\r
  font-size: 12px;\r
}\r
\r
.space-hot-card {\r
  padding: 18px;\r
}\r
\r
.learning-map-stage {\r
  min-height: 320px;\r
  margin-top: 14px;\r
}\r
\r
.learning-map-stage svg {\r
  display: block;\r
  width: 100%;\r
  height: auto;\r
  min-height: 320px;\r
}\r
\r
.learning-detail-cards {\r
  display: grid;\r
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);\r
  gap: 20px;\r
}\r
\r
.learning-note-card,\r
.learning-focus-card {\r
  display: grid;\r
  gap: 14px;\r
  padding: 24px;\r
  border: 1px solid rgba(7, 7, 7, .08);\r
  border-radius: 22px;\r
  background: rgba(255, 255, 255, .72);\r
  box-shadow: 0 6px 18px rgba(119, 66, 38, .06);\r
}\r
\r
.learning-note-card label {\r
  display: grid;\r
  gap: 8px;\r
}\r
\r
.space-checkin-card {\r
  border: 1px solid rgba(216, 58, 46, .14);\r
  background: rgba(255, 251, 246, .88);\r
  box-shadow: 0 8px 24px rgba(216, 58, 46, .08);\r
}\r
\r
.space-hot-card,\r
.hot-heritage-card {\r
  border: 1px solid rgba(7, 7, 7, .08);\r
  border-radius: 22px;\r
  background: rgba(255, 255, 255, .72);\r
  box-shadow: 0 6px 18px rgba(119, 66, 38, .06);\r
}\r
\r
.learning-journey-controls {\r
  display: grid;\r
  grid-template-columns: minmax(180px, .9fr) minmax(220px, 1fr) auto auto;\r
  gap: 14px;\r
  align-items: end;\r
  padding: 20px;\r
}\r
\r
.daily-feature-card {\r
  display: grid;\r
  grid-template-columns: 1fr auto;\r
  gap: 24px;\r
  align-items: center;\r
  margin: 6px 0 18px;\r
  padding: 26px;\r
  border-radius: 28px;\r
  background:\r
    radial-gradient(circle at 0% 0%, rgba(244, 180, 63, .22), transparent 34%),\r
    linear-gradient(135deg, rgba(216, 58, 46, .1), rgba(255, 255, 255, .72));\r
}\r
\r
.daily-feature-card span {\r
  color: #a62b23;\r
  font-weight: 1000;\r
}\r
\r
.daily-feature-card h3 {\r
  margin-top: 10px;\r
  font-size: clamp(34px, 4vw, 58px);\r
  line-height: 1;\r
}\r
\r
.daily-feature-card p {\r
  margin: 14px 0 0;\r
  color: rgba(7, 7, 7, .66);\r
  line-height: 1.72;\r
}\r
\r
.daily-feature-card > strong {\r
  display: grid;\r
  place-items: center;\r
  width: 92px;\r
  height: 92px;\r
  border: 2px solid rgba(7, 7, 7, .12);\r
  border-radius: 30px;\r
  background: rgba(255, 255, 255, .72);\r
  color: #d83a2e;\r
  font-size: 34px;\r
}\r
\r
.daily-learning-list article {\r
  grid-template-columns: 48px 1fr;\r
  gap: 14px;\r
  padding: 18px;\r
}\r
\r
.daily-learning-list article > span,\r
.consumer-hot-list article > span {\r
  display: grid;\r
  place-items: center;\r
  width: 38px;\r
  height: 38px;\r
  border-radius: 14px;\r
  background: rgba(244, 180, 63, .2);\r
  color: #9b5d00;\r
  font-weight: 1000;\r
}\r
\r
.checkin-calendar-card,\r
.hot-heritage-card {\r
  display: grid;\r
  gap: 18px;\r
}\r
\r
.checkin-title-row {\r
  align-items: start;\r
}\r
\r
.checkin-title-row .eyebrow {\r
  margin-bottom: 6px;\r
}\r
\r
.checkin-calendar-toolbar {\r
  display: grid;\r
  grid-template-columns: minmax(0, 1fr);\r
  gap: 12px;\r
  align-items: end;\r
  padding: 14px;\r
  border: 1px solid rgba(216, 58, 46, .12);\r
  border-radius: 22px;\r
  background:\r
    radial-gradient(circle at 0% 0%, rgba(244, 180, 63, .16), transparent 42%),\r
    rgba(255, 255, 255, .58);\r
}\r
\r
.checkin-calendar-toolbar label {\r
  display: grid;\r
  gap: 7px;\r
}\r
\r
.checkin-calendar-toolbar label span {\r
  color: rgba(7, 7, 7, .62);\r
  font-weight: 900;\r
}\r
\r
.checkin-action {\r
  min-width: 132px;\r
  white-space: nowrap;\r
}\r
\r
.checkin-action:disabled {\r
  opacity: .5;\r
  cursor: not-allowed;\r
}\r
\r
.consumer-calendar {\r
  display: grid;\r
  grid-template-columns: repeat(7, minmax(0, 1fr));\r
  gap: 8px;\r
  padding: 16px;\r
  border: 1px solid rgba(7, 7, 7, .08);\r
  border-radius: 22px;\r
  background: rgba(255, 255, 255, .58);\r
}\r
\r
.consumer-calendar span {\r
  display: grid;\r
  place-items: center;\r
  min-height: 38px;\r
  border-radius: 14px;\r
  color: rgba(7, 7, 7, .62);\r
  font-weight: 900;\r
}\r
\r
.consumer-calendar span strong {\r
  font-size: 13px;\r
  line-height: 1;\r
}\r
\r
.consumer-calendar span.today {\r
  outline: 2px solid rgba(216, 58, 46, .38);\r
}\r
\r
.consumer-calendar span.checked {\r
  background: linear-gradient(135deg, #d83a2e, #f4b43f);\r
  color: #fff;\r
  box-shadow: 0 10px 20px rgba(216, 58, 46, .18);\r
}\r
\r
.consumer-calendar span.future {\r
  color: rgba(7, 7, 7, .28);\r
  background: rgba(7, 7, 7, .03);\r
  font-weight: 400;\r
}\r
\r
.consumer-hot-list article {\r
  grid-template-columns: 44px 1fr;\r
  gap: 12px;\r
  align-items: center;\r
  padding: 14px;\r
}\r
\r
.learning-pagination {\r
  display: flex;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 12px;\r
  margin-top: 18px;\r
}\r
\r
.learning-empty-state {\r
  min-height: 180px;\r
  justify-items: center;\r
  text-align: center;\r
}\r
\r
.favorites-function-section {\r
  position: relative;\r
  overflow: visible;\r
  padding-top: 118px;\r
  background:\r
    linear-gradient(90deg, rgba(216, 58, 46, .05) 1px, transparent 1px),\r
    linear-gradient(180deg, rgba(13, 74, 124, .055) 1px, transparent 1px),\r
    linear-gradient(180deg, #fff9ef 0%, #f6fbff 48%, #fff4e3 100%);\r
  background-size: 42px 42px, 42px 42px, auto;\r
}\r
\r
.favorites-function-section > * {\r
  position: relative;\r
}\r
\r
.favorites-function-section .learning-space-page,\r
.favorites-function-section .learning-journey-page {\r
  width: min(1240px, 100%);\r
}\r
\r
.favorites-function-section .learning-space-hero,\r
.favorites-function-section .my-favorites-panel,\r
.favorites-function-section .learning-map-card,\r
.favorites-function-section .learning-note-card,\r
.favorites-function-section .learning-focus-card,\r
.favorites-function-section .space-daily-recommend-card,\r
.favorites-function-section .space-checkin-card,\r
.favorites-function-section .learning-journey-hero,\r
.favorites-function-section .learning-journey-controls,\r
.favorites-function-section .daily-recommend-card,\r
.favorites-function-section .checkin-calendar-card,\r
.favorites-function-section .hot-heritage-card {\r
  border: 1px solid rgba(122, 76, 45, .1);\r
  border-radius: 18px;\r
  background: rgba(255, 255, 255, .84);\r
  box-shadow: 0 12px 36px rgba(119, 66, 38, .07);\r
  backdrop-filter: blur(8px) saturate(1.04);\r
}\r
\r
.learning-space-hero.site-learning-hero {\r
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);\r
  gap: clamp(18px, 3vw, 36px);\r
  align-items: stretch;\r
  padding: clamp(28px, 4vw, 48px);\r
  border-radius: 24px;\r
  background:\r
    linear-gradient(120deg, rgba(255, 255, 255, .94) 0%, rgba(255, 247, 232, .86) 58%, rgba(231, 246, 255, .9) 100%),\r
    #fff;\r
}\r
\r
.favorites-function-section .learning-space-hero-copy h2 {\r
  max-width: 760px;\r
  margin-top: 16px;\r
  font-family: var(--display-cn);\r
  font-size: clamp(34px, 4.3vw, 64px);\r
  line-height: 1.08;\r
  letter-spacing: 0;\r
  text-shadow: none;\r
}\r
\r
.learning-space-kicker {\r
  display: inline-flex;\r
  flex-wrap: wrap;\r
  align-items: center;\r
  gap: 10px;\r
  width: fit-content;\r
  margin: 0;\r
  padding: 8px 12px;\r
  border: 1px solid rgba(216, 58, 46, .16);\r
  border-radius: 999px;\r
  background: rgba(255, 255, 255, .72);\r
  color: #a62b23;\r
  font-weight: 1000;\r
}\r
\r
.learning-space-kicker small {\r
  color: rgba(7, 7, 7, .58);\r
  font-size: 12px;\r
  font-weight: 900;\r
}\r
\r
.learning-space-quick-actions {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 10px;\r
  margin-top: 24px;\r
}\r
\r
.learning-space-quick-actions .primary-action,\r
.learning-space-quick-actions .secondary-action {\r
  min-height: 42px;\r
  padding: 0 16px;\r
}\r
\r
.learning-space-status-strip {\r
  grid-column: 1 / -1;\r
  grid-template-columns: repeat(5, minmax(0, 1fr));\r
  margin-top: 8px;\r
  padding: 10px;\r
  border: 1px solid rgba(122, 76, 45, .12);\r
  border-radius: 18px;\r
  background: rgba(255, 255, 255, .56);\r
}\r
\r
.learning-space-status-strip article {\r
  min-height: 72px;\r
}\r
\r
.learning-space-section-head {\r
  display: flex;\r
  align-items: end;\r
  justify-content: space-between;\r
  gap: 24px;\r
  margin: 28px 0 4px;\r
  padding: 0 4px;\r
}\r
\r
.learning-space-section-head h3 {\r
  margin: 0;\r
  color: #111;\r
  font-family: var(--display-cn);\r
  font-size: clamp(24px, 2.4vw, 34px);\r
  letter-spacing: 0;\r
}\r
\r
.learning-space-section-head > span {\r
  max-width: 420px;\r
  color: rgba(7, 7, 7, .62);\r
  font-weight: 700;\r
  line-height: 1.7;\r
}\r
\r
.learning-content-grid {\r
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);\r
  gap: 18px;\r
}\r
\r
.learning-support-grid {\r
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);\r
  gap: 18px;\r
}\r
\r
.favorites-function-section .learning-space-metrics article,\r
.favorites-function-section .learning-journey-overview article,\r
.favorites-function-section .favorite-learning-card,\r
.favorites-function-section .daily-learning-list article,\r
.favorites-function-section .consumer-hot-list article {\r
  border-color: rgba(216, 58, 46, .12);\r
  border-radius: 16px;\r
  background: rgba(255, 255, 255, .78);\r
  box-shadow: 0 10px 24px rgba(119, 66, 38, .07);\r
}\r
\r
.favorites-function-section .learning-space-metrics article:hover,\r
.favorites-function-section .favorite-learning-card:hover,\r
.favorites-function-section .favorite-learning-card.selected,\r
.favorites-function-section .daily-learning-list article:hover,\r
.favorites-function-section .consumer-hot-list article:hover {\r
  transform: translateY(-2px);\r
  border-color: rgba(216, 58, 46, .42);\r
  box-shadow:\r
    0 14px 34px rgba(216, 58, 46, .12),\r
    inset 3px 0 0 #d83a2e;\r
}\r
\r
.favorites-function-section .learning-space-hero {\r
  min-height: auto;\r
}\r
\r
.favorites-function-section .learning-space-metrics article {\r
  min-height: 82px;\r
  padding: 14px;\r
}\r
\r
.favorites-function-section .my-favorites-panel,\r
.favorites-function-section .learning-map-card,\r
.favorites-function-section .learning-note-card,\r
.favorites-function-section .learning-focus-card,\r
.favorites-function-section .space-daily-recommend-card,\r
.favorites-function-section .space-checkin-card,\r
.favorites-function-section .daily-recommend-card,\r
.favorites-function-section .checkin-calendar-card,\r
.favorites-function-section .hot-heritage-card {\r
  padding: clamp(18px, 2.2vw, 24px);\r
}\r
\r
.favorites-function-section .learning-panel-title {\r
  margin-bottom: 12px;\r
}\r
\r
.favorites-function-section .favorite-learning-list,\r
.favorites-function-section .daily-learning-list,\r
.favorites-function-section .consumer-hot-list {\r
  gap: 10px;\r
}\r
\r
.favorites-function-section .favorite-learning-card > button:first-child {\r
  padding: 14px 46px 14px 16px;\r
}\r
\r
.favorites-function-section .favorite-learning-card p {\r
  display: -webkit-box;\r
  overflow: hidden;\r
  -webkit-line-clamp: 2;\r
  -webkit-box-orient: vertical;\r
}\r
\r
.favorites-function-section .learning-map-stage {\r
  min-height: 320px;\r
  border-radius: 18px;\r
  background:\r
    linear-gradient(90deg, rgba(122, 76, 45, .06) 1px, transparent 1px),\r
    linear-gradient(180deg, rgba(122, 76, 45, .05) 1px, transparent 1px),\r
    linear-gradient(135deg, rgba(255,255,255,.82), rgba(255,248,232,.52));\r
  background-size: 26px 26px, 26px 26px, auto;\r
}\r
\r
.favorites-function-section .learning-map-stage svg {\r
  display: block;\r
  width: 100%;\r
  height: auto;\r
  min-height: 320px;\r
}\r
\r
.favorites-function-section .learning-detail-cards {\r
  gap: 14px;\r
}\r
\r
.favorites-function-section .primary-action {\r
  background: linear-gradient(135deg, #d83a2e, #f4b43f);\r
  box-shadow: 0 14px 32px rgba(216, 58, 46, .2);\r
}\r
\r
.favorites-function-section .secondary-action,\r
.favorites-function-section .icon-only {\r
  background: rgba(255, 255, 255, .76);\r
  border-color: rgba(216, 58, 46, .14);\r
}\r
\r
/* 收藏学习空间：用户端网站式布局 */\r
.favorites-function-section.favorites-direct-page {\r
  padding-top: 104px;\r
  background:\r
    linear-gradient(90deg, rgba(17, 24, 39, .035) 1px, transparent 1px),\r
    linear-gradient(180deg, rgba(17, 24, 39, .035) 1px, transparent 1px),\r
    linear-gradient(180deg, #fffdf8 0%, #f7fbfb 46%, #fff8ec 100%);\r
  background-size: 56px 56px, 56px 56px, auto;\r
}\r
\r
.favorites-function-section .learning-space-page {\r
  width: min(1180px, calc(100vw - 40px));\r
}\r
\r
.favorites-function-section .learning-space-hero.site-learning-hero {\r
  grid-template-columns: minmax(0, 1.12fr) minmax(300px, .58fr);\r
  gap: clamp(24px, 4vw, 56px);\r
  align-items: stretch;\r
  min-height: 410px;\r
  padding: clamp(30px, 5vw, 64px);\r
  border: 1px solid rgba(34, 43, 51, .12);\r
  border-radius: 8px;\r
  background:\r
    linear-gradient(110deg, rgba(255, 255, 255, .96) 0%, rgba(255, 252, 244, .92) 58%, rgba(236, 249, 248, .94) 100%),\r
    #fff;\r
  box-shadow: 0 26px 70px rgba(35, 67, 78, .1);\r
}\r
\r
.favorites-function-section .learning-space-hero.site-learning-hero::after {\r
  content: "";\r
  position: absolute;\r
  inset: auto 34px 26px auto;\r
  width: min(34vw, 360px);\r
  height: 1px;\r
  background: linear-gradient(90deg, transparent, rgba(216, 58, 46, .42), rgba(39, 128, 112, .5));\r
}\r
\r
.favorites-function-section .learning-space-hero-copy {\r
  display: flex;\r
  flex-direction: column;\r
  justify-content: center;\r
  min-width: 0;\r
}\r
\r
.favorites-function-section .learning-space-hero-copy h2 {\r
  max-width: 740px;\r
  margin-top: 18px;\r
  color: #131313;\r
  font-size: clamp(38px, 5vw, 72px);\r
  line-height: 1.02;\r
}\r
\r
.favorites-function-section .learning-space-hero-copy > span {\r
  max-width: 670px;\r
  margin-top: 20px;\r
  color: rgba(19, 19, 19, .68);\r
  font-size: clamp(15px, 1.45vw, 18px);\r
}\r
\r
.favorites-function-section .learning-space-kicker {\r
  gap: 12px;\r
  padding: 0;\r
  border: 0;\r
  border-radius: 0;\r
  background: transparent;\r
  color: #b33027;\r
  letter-spacing: 0;\r
}\r
\r
.favorites-function-section .learning-space-kicker::before {\r
  content: "";\r
  width: 34px;\r
  height: 2px;\r
  background: #b33027;\r
}\r
\r
.favorites-function-section .learning-space-kicker small {\r
  color: rgba(19, 19, 19, .52);\r
}\r
\r
.favorites-function-section .learning-space-quick-actions {\r
  margin-top: 30px;\r
}\r
\r
.favorites-function-section .learning-space-quick-actions .primary-action,\r
.favorites-function-section .learning-space-quick-actions .secondary-action,\r
.favorites-function-section .learning-pagination .secondary-action,\r
.favorites-function-section .primary-action.compact {\r
  min-height: 42px;\r
  border-radius: 8px;\r
}\r
\r
.favorites-function-section .learning-profile-panel {\r
  align-self: stretch;\r
  display: grid;\r
  align-content: space-between;\r
  gap: 22px;\r
  padding: clamp(22px, 3vw, 30px);\r
  border: 1px solid rgba(34, 43, 51, .12);\r
  border-radius: 8px;\r
  background:\r
    linear-gradient(180deg, rgba(255, 255, 255, .82), rgba(250, 248, 241, .72)),\r
    repeating-linear-gradient(135deg, rgba(39, 128, 112, .06) 0 1px, transparent 1px 13px);\r
  box-shadow: none;\r
}\r
\r
.learning-profile-topline,\r
.learning-profile-highlight {\r
  display: grid;\r
  gap: 8px;\r
}\r
\r
.learning-profile-topline {\r
  grid-template-columns: 1fr auto;\r
  align-items: center;\r
  padding-bottom: 18px;\r
  border-bottom: 1px solid rgba(34, 43, 51, .1);\r
}\r
\r
.learning-profile-topline span,\r
.learning-profile-highlight p {\r
  margin: 0;\r
  color: #27705f;\r
  font-size: 13px;\r
  font-weight: 1000;\r
}\r
\r
.learning-profile-highlight {\r
  padding-top: 20px;\r
  border-top: 1px solid rgba(34, 43, 51, .1);\r
}\r
\r
.learning-profile-highlight strong {\r
  display: -webkit-box;\r
  overflow: hidden;\r
  color: #131313;\r
  font-family: var(--display-cn);\r
  font-size: clamp(24px, 2.6vw, 34px);\r
  line-height: 1.08;\r
  -webkit-line-clamp: 2;\r
  -webkit-box-orient: vertical;\r
}\r
\r
.learning-profile-highlight span {\r
  color: rgba(19, 19, 19, .62);\r
  line-height: 1.7;\r
}\r
\r
.favorites-function-section .learning-user-summary {\r
  grid-template-columns: 56px minmax(0, 1fr);\r
}\r
\r
.favorites-function-section .learning-user-summary > span {\r
  width: 56px;\r
  height: 56px;\r
  border-radius: 8px;\r
  background: linear-gradient(135deg, #b33027, #d79d32);\r
}\r
\r
.favorites-function-section .learning-user-summary strong {\r
  font-size: 18px;\r
}\r
\r
.favorites-function-section .learning-space-status-strip {\r
  grid-column: 1 / -1;\r
  display: grid;\r
  grid-template-columns: repeat(5, minmax(0, 1fr));\r
  gap: 0;\r
  margin-top: 10px;\r
  padding: 0;\r
  border: 1px solid rgba(34, 43, 51, .1);\r
  border-radius: 8px;\r
  background: rgba(255, 255, 255, .82);\r
  overflow: hidden;\r
}\r
\r
.favorites-function-section .learning-space-status-strip article {\r
  min-height: 96px;\r
  padding: 18px;\r
  border: 0;\r
  border-right: 1px solid rgba(34, 43, 51, .08);\r
  border-radius: 0;\r
  background: transparent;\r
  box-shadow: none;\r
}\r
\r
.favorites-function-section .learning-space-status-strip article:last-child {\r
  border-right: 0;\r
}\r
\r
.favorites-function-section .learning-space-status-strip svg,\r
.favorites-function-section .learning-space-status-strip span {\r
  color: #27705f;\r
}\r
\r
.favorites-function-section .learning-space-status-strip strong {\r
  color: #151515;\r
  font-size: clamp(30px, 3vw, 42px);\r
}\r
\r
.favorites-function-section .learning-space-anchor-bar {\r
  position: sticky;\r
  top: 74px;\r
  z-index: 20;\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 8px;\r
  margin: 18px 0 26px;\r
  padding: 10px;\r
  border: 1px solid rgba(34, 43, 51, .1);\r
  border-radius: 8px;\r
  background: rgba(255, 255, 255, .86);\r
  box-shadow: 0 14px 34px rgba(35, 67, 78, .08);\r
  backdrop-filter: blur(12px);\r
}\r
\r
.favorites-function-section .learning-space-anchor-bar button {\r
  padding: 9px 14px;\r
  border: none;\r
  border-radius: 6px;\r
  background: transparent;\r
  color: rgba(19, 19, 19, .68);\r
  font-size: 13px;\r
  font-weight: 1000;\r
  cursor: pointer;\r
  text-decoration: none;\r
  transition: background .18s ease, color .18s ease;\r
}\r
\r
.favorites-function-section .learning-space-anchor-bar button:hover {\r
  background: rgba(39, 128, 112, .1);\r
  color: #1f6858;\r
}\r
\r
.favorites-function-section .learning-space-section-head {\r
  margin: 6px 0 18px;\r
  padding: 0;\r
  border-bottom: 1px solid rgba(34, 43, 51, .1);\r
  padding-bottom: 18px;\r
}\r
\r
.favorites-function-section .learning-space-section-head h3 {\r
  max-width: 700px;\r
  font-size: clamp(26px, 3vw, 42px);\r
}\r
\r
.favorites-function-section .learning-content-grid {\r
  grid-template-columns: minmax(280px, 330px) minmax(0, 1fr);\r
  gap: clamp(18px, 2.4vw, 28px);\r
  align-items: start;\r
}\r
\r
.favorites-function-section .learning-map-and-checkin {\r
  grid-template-columns: minmax(0, 1fr) minmax(272px, 310px);\r
  gap: clamp(16px, 2vw, 22px);\r
}\r
\r
.favorites-function-section .learning-space-sidecar {\r
  gap: 16px;\r
}\r
\r
.favorites-function-section .my-favorites-panel,\r
.favorites-function-section .learning-map-card,\r
.favorites-function-section .learning-note-card,\r
.favorites-function-section .learning-focus-card,\r
.favorites-function-section .space-daily-recommend-card,\r
.favorites-function-section .space-checkin-card,\r
.favorites-function-section .hot-heritage-card {\r
  border: 1px solid rgba(34, 43, 51, .1);\r
  border-radius: 18px;\r
  background: rgba(255, 255, 255, .82);\r
  box-shadow: 0 12px 36px rgba(35, 67, 78, .07);\r
  backdrop-filter: blur(8px);\r
}\r
\r
\r
.favorites-function-section .learning-map-card {\r
  display: grid;\r
  grid-template-rows: auto 1fr;\r
  align-content: start;\r
}\r
\r
.favorites-function-section .learning-panel-title {\r
  align-items: flex-start;\r
  border-bottom: 1px solid rgba(34, 43, 51, .08);\r
  padding-bottom: 14px;\r
}\r
\r
.favorites-function-section .learning-panel-title h3,\r
.favorites-function-section .learning-note-card h3,\r
.favorites-function-section .learning-focus-card h3,\r
.favorites-function-section .hot-heritage-card h3 {\r
  letter-spacing: 0;\r
  font-size: clamp(22px, 2vw, 30px);\r
}\r
\r
.favorites-function-section .favorite-learning-card,\r
.favorites-function-section .daily-learning-list article,\r
.favorites-function-section .consumer-hot-list article {\r
  border-radius: 8px;\r
  border-color: rgba(34, 43, 51, .1);\r
  background: #fff;\r
  box-shadow: none;\r
}\r
\r
.favorites-function-section .favorite-learning-card:hover,\r
.favorites-function-section .favorite-learning-card.selected,\r
.favorites-function-section .daily-learning-list article:hover,\r
.favorites-function-section .consumer-hot-list article:hover {\r
  transform: translateY(-1px);\r
  border-color: rgba(179, 48, 39, .42);\r
  box-shadow: inset 3px 0 0 #b33027, 0 12px 28px rgba(35, 67, 78, .08);\r
}\r
\r
.favorites-function-section .favorite-learning-card .danger-icon,\r
.favorites-function-section .icon-only {\r
  border-radius: 8px;\r
}\r
\r
.favorites-function-section .learning-map-stage {\r
  min-height: 320px;\r
  border: 1px solid rgba(34, 43, 51, .08);\r
  border-radius: 8px;\r
  background:\r
    linear-gradient(90deg, rgba(34, 43, 51, .05) 1px, transparent 1px),\r
    linear-gradient(180deg, rgba(34, 43, 51, .05) 1px, transparent 1px),\r
    linear-gradient(135deg, rgba(255, 255, 255, .94), rgba(239, 248, 246, .72));\r
  background-size: 30px 30px, 30px 30px, auto;\r
}\r
\r
.favorites-function-section .learning-map-stage svg {\r
  display: block;\r
  width: 100%;\r
  height: auto;\r
  min-height: 320px;\r
}\r
\r
.favorites-function-section .space-date-field,\r
.favorites-function-section .checkin-calendar-toolbar,\r
.favorites-function-section .consumer-calendar,\r
.favorites-function-section .space-top-recommend {\r
  border-radius: 8px;\r
}\r
\r
.favorites-function-section .space-top-recommend {\r
  background:\r
    linear-gradient(135deg, rgba(255, 248, 229, .92), rgba(236, 249, 248, .86));\r
}\r
\r
.favorites-function-section .space-top-recommend span,\r
.favorites-function-section .daily-learning-list article > span,\r
.favorites-function-section .consumer-hot-list article > span {\r
  color: #1f6858;\r
}\r
\r
.favorites-function-section .daily-learning-list article > span,\r
.favorites-function-section .consumer-hot-list article > span {\r
  border-radius: 8px;\r
  background: rgba(39, 128, 112, .1);\r
}\r
\r
.favorites-function-section .consumer-calendar span {\r
  border-radius: 6px;\r
}\r
\r
.favorites-function-section .consumer-calendar span.checked {\r
  background: linear-gradient(135deg, #b33027, #27705f);\r
}\r
\r
.favorites-function-section .learning-support-grid {\r
  grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr);\r
  gap: clamp(16px, 2vw, 22px);\r
}\r
\r
@media (prefers-reduced-motion: reduce) {\r
  .favorites-hero-stack::before,\r
  .favorites-hero-stack::after,\r
  .regions-page-section .filter-panel,\r
  .regions-page-section .heritage-list-state,\r
  .regions-page-section .masonry-container {\r
    animation: none;\r
  }\r
\r
  .masonry-card,\r
  .masonry-item.is-in-view .masonry-card {\r
    opacity: 1;\r
    filter: none;\r
    transform: none;\r
    transition: none;\r
  }\r
}\r
\r
@media (max-width: 1120px) {\r
  .favorites-function-section .learning-space-hero.site-learning-hero,\r
  .favorites-function-section .learning-content-grid,\r
  .favorites-function-section .learning-map-and-checkin,\r
  .favorites-function-section .learning-support-grid {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .favorites-function-section .my-favorites-panel {\r
    position: static;\r
  }\r
\r
  .favorites-function-section .learning-space-status-strip {\r
    grid-template-columns: repeat(2, minmax(0, 1fr));\r
  }\r
\r
  .favorites-function-section .learning-space-status-strip article:nth-child(2n) {\r
    border-right: 0;\r
  }\r
\r
  .favorites-function-section .learning-space-status-strip article:last-child {\r
    grid-column: 1 / -1;\r
    border-top: 1px solid rgba(34, 43, 51, .08);\r
  }\r
\r
  .learning-space-hero,\r
  .learning-journey-hero,\r
  .learning-space-discovery,\r
  .learning-space-main,\r
  .learning-space-workbench,\r
  .learning-map-and-checkin,\r
  .learning-journey-main,\r
  .learning-journey-controls {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .learning-space-metrics,\r
  .learning-journey-overview {\r
    grid-template-columns: repeat(2, minmax(0, 1fr));\r
  }\r
\r
  .learning-detail-cards {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .learning-space-section-head {\r
    align-items: start;\r
    flex-direction: column;\r
  }\r
\r
  .learning-content-grid,\r
  .learning-support-grid {\r
    grid-template-columns: 1fr;\r
  }\r
}\r
\r
@media (max-width: 720px) {\r
  .favorites-function-section.favorites-direct-page {\r
    padding-top: 92px;\r
  }\r
\r
  .favorites-function-section .learning-space-page {\r
    width: min(100%, calc(100vw - 24px));\r
  }\r
\r
  .favorites-function-section .learning-space-hero.site-learning-hero {\r
    min-height: auto;\r
    padding: 22px;\r
  }\r
\r
  .favorites-function-section .learning-space-hero-copy h2 {\r
    font-size: clamp(32px, 11vw, 46px);\r
    line-height: 1.04;\r
  }\r
\r
  .favorites-function-section .learning-space-quick-actions {\r
    display: grid;\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .favorites-function-section .learning-space-status-strip {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .favorites-function-section .learning-space-status-strip article,\r
  .favorites-function-section .learning-space-status-strip article:nth-child(2n) {\r
    min-height: 76px;\r
    border-right: 0;\r
    border-bottom: 1px solid rgba(34, 43, 51, .08);\r
  }\r
\r
  .favorites-function-section .learning-space-status-strip article:last-child {\r
    border-bottom: 0;\r
  }\r
\r
  .favorites-function-section .learning-space-anchor-bar {\r
    position: static;\r
    margin: 14px 0 22px;\r
  }\r
\r
  .favorites-function-section .learning-space-section-head {\r
    gap: 12px;\r
  }\r
\r
  .favorites-function-section .learning-map-stage {\r
    min-height: 300px;\r
  }\r
\r
  .learning-space-hero,\r
  .learning-journey-hero,\r
  .learning-space-discovery,\r
  .my-favorites-panel,\r
  .learning-map-card,\r
  .daily-recommend-card,\r
  .checkin-calendar-card,\r
  .hot-heritage-card {\r
    padding: 20px;\r
    border-radius: 26px;\r
  }\r
\r
  .favorites-function-section {\r
    padding-top: 104px;\r
  }\r
\r
  .learning-space-hero.site-learning-hero {\r
    padding: 22px;\r
    border-radius: 20px;\r
  }\r
\r
  .favorites-function-section .learning-space-hero-copy h2 {\r
    font-size: clamp(30px, 10vw, 42px);\r
  }\r
\r
  .learning-space-kicker {\r
    align-items: start;\r
    border-radius: 16px;\r
  }\r
\r
  .learning-space-quick-actions {\r
    display: grid;\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .learning-space-metrics,\r
  .learning-journey-overview,\r
  .discovery-controls,\r
  .favorite-search-row,\r
  .daily-feature-card {\r
    grid-template-columns: 1fr;\r
  }\r
\r
  .discovery-search,\r
  .discovery-note {\r
    grid-column: auto;\r
  }\r
}\r
\r
@media (max-width: 1120px) {\r
  .top-nav {\r
    grid-template-columns: 1fr;\r
    gap: 12px;\r
    padding-block: 14px;\r
  }\r
\r
  .account-entry {\r
    justify-self: stretch;\r
    max-width: none;\r
  }\r
\r
  .portal-function-section .graph-board-layout,\r
  .portal-function-section .community-workbench,\r
  .portal-function-section .learning-workbench,\r
  .portal-function-section .compact-learning-workbench,\r
  .portal-function-section .compact-favorite-workbench,\r
  .portal-function-section .favorite-composer-panel {\r
    grid-template-columns: 1fr;\r
  }\r
}\r
/* 卡片悬停效果 */\r
.learning-space-row .my-favorites-panel:hover,\r
.learning-space-row .learning-map-card:hover,\r
.learning-space-row .space-daily-recommend-card:hover,\r
.learning-space-row .learning-note-card:hover,\r
.learning-space-row .learning-focus-card:hover,\r
.learning-space-row .space-checkin-card:hover,\r
.learning-space-row .hot-heritage-card:hover {\r
  transform: translateY(-2px);\r
  box-shadow: 0 16px 48px rgba(119, 66, 38, .12);\r
  transition: transform .2s ease, box-shadow .2s ease;\r
}\r
\r
/* 卡片标题区域增强 */\r
.learning-space-row .panel-title,\r
.learning-space-row .detail-title-row {\r
  padding-bottom: 12px;\r
  border-bottom: 1px solid rgba(34, 43, 51, .08);\r
  margin-bottom: 16px;\r
}\r
\r
.learning-space-row .panel-title h3,\r
.learning-space-row .detail-title-row h3 {\r
  font-size: clamp(20px, 1.8vw, 26px);\r
  line-height: 1.2;\r
}\r
\r
/* 收藏卡片增强 */\r
.learning-space-row .favorite-learning-card {\r
  border-radius: 12px;\r
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;\r
}\r
\r
.learning-space-row .favorite-learning-card:hover {\r
  transform: translateY(-1px);\r
  box-shadow: 0 8px 24px rgba(216, 58, 46, .1);\r
}\r
\r
.learning-space-row .favorite-learning-card.selected {\r
  border-color: rgba(216, 58, 46, .42);\r
  box-shadow: inset 3px 0 0 #d83a2e, 0 8px 24px rgba(216, 58, 46, .1);\r
}\r
\r
/* 图谱卡片增强 */\r
.learning-space-row .learning-map-card {\r
  min-height: 400px;\r
}\r
\r
.learning-space-row .learning-map-stage {\r
  border-radius: 12px;\r
  background: linear-gradient(135deg, rgba(255, 255, 255, .94), rgba(239, 248, 246, .72));\r
}\r
\r
/* 推荐卡片增强 */\r
.learning-space-row .space-top-recommend {\r
  border-radius: 12px;\r
  background: linear-gradient(135deg, rgba(255, 248, 229, .92), rgba(236, 249, 248, .86));\r
  padding: 16px;\r
  margin-bottom: 12px;\r
}\r
\r
.learning-space-row .space-top-recommend strong {\r
  font-size: clamp(22px, 2vw, 28px);\r
  line-height: 1.2;\r
}\r
\r
/* 打卡卡片增强 */\r
.learning-space-row .space-checkin-card {\r
  background: rgba(255, 251, 246, .92);\r
  border-color: rgba(216, 58, 46, .14);\r
}\r
\r
.learning-space-row .checkin-calendar-toolbar {\r
  border-radius: 12px;\r
  background: rgba(255, 255, 255, .68);\r
}\r
\r
.learning-space-row .checkin-action {\r
  border-radius: 10px;\r
  font-weight: 700;\r
}\r
\r
/* 热门节点卡片增强 */\r
.learning-space-row .hot-heritage-card h3 {\r
  font-size: clamp(22px, 2vw, 28px);\r
  margin-bottom: 16px;\r
}\r
\r
.learning-space-row .consumer-hot-list article {\r
  border-radius: 10px;\r
  transition: transform .2s ease, box-shadow .2s ease;\r
}\r
\r
.learning-space-row .consumer-hot-list article:hover {\r
  transform: translateY(-1px);\r
  box-shadow: 0 6px 18px rgba(119, 66, 38, .08);\r
}\r
\r
/* 笔记卡片增强 */\r
.learning-space-row .learning-note-card textarea {\r
  border-radius: 10px;\r
  border-color: rgba(34, 43, 51, .1);\r
  background: rgba(255, 255, 255, .68);\r
  transition: border-color .2s ease, box-shadow .2s ease;\r
}\r
\r
.learning-space-row .learning-note-card textarea:focus {\r
  border-color: rgba(216, 58, 46, .42);\r
  box-shadow: 0 0 0 3px rgba(216, 58, 46, .1);\r
  outline: none;\r
}\r
\r
/* 焦点卡片增强 */\r
.learning-space-row .learning-focus-card {\r
  background: linear-gradient(135deg, rgba(255, 255, 255, .92), rgba(250, 248, 241, .86));\r
}\r
\r
/* 空状态增强 */\r
.learning-space-row .state-panel.empty {\r
  border-radius: 12px;\r
  background: rgba(255, 255, 255, .68);\r
  padding: 32px 24px;\r
}\r
\r
/* 分页控件增强 */\r
.learning-space-row .pagination {\r
  margin-top: 16px;\r
  padding-top: 12px;\r
  border-top: 1px solid rgba(34, 43, 51, .08);\r
}\r
\r
/* 日历增强 */\r
.learning-space-row .consumer-calendar {\r
  border-radius: 12px;\r
  background: rgba(255, 255, 255, .68);\r
}\r
\r
.learning-space-row .consumer-calendar span {\r
  border-radius: 8px;\r
  transition: background .2s ease, color .2s ease;\r
}\r
\r
.learning-space-row .consumer-calendar span:hover {\r
  background: rgba(216, 58, 46, .08);\r
}\r
\r
.learning-space-row .consumer-calendar span.checked {\r
  background: linear-gradient(135deg, #d83a2e, #f4b43f);\r
  color: #fff;\r
  box-shadow: 0 4px 12px rgba(216, 58, 46, .2);\r
}\r
\r
.learning-space-row .consumer-calendar span.today {\r
  outline: 2px solid rgba(216, 58, 46, .38);\r
  outline-offset: -2px;\r
}\r
\r
.learning-space-row .consumer-calendar span.future {\r
  color: rgba(7, 7, 7, .24);\r
  background: rgba(7, 7, 7, .02);\r
}\r
\r
/* 按钮增强 */\r
.learning-space-row .primary-action,\r
.learning-space-row .secondary-action {\r
  border-radius: 10px;\r
  font-weight: 700;\r
  transition: transform .2s ease, box-shadow .2s ease;\r
}\r
\r
.learning-space-row .primary-action:hover,\r
.learning-space-row .secondary-action:hover {\r
  transform: translateY(-1px);\r
  box-shadow: 0 6px 18px rgba(216, 58, 46, .16);\r
}\r
\r
/* 图标按钮增强 */\r
.learning-space-row .icon-only {\r
  border-radius: 8px;\r
  transition: background .2s ease, color .2s ease;\r
}\r
\r
.learning-space-row .icon-only:hover {\r
  background: rgba(216, 58, 46, .1);\r
  color: #d83a2e;\r
}\r
\r
/* 类型标签增强 */\r
.learning-space-row .type-chip {\r
  border-radius: 999px;\r
  font-weight: 700;\r
  letter-spacing: .02em;\r
}\r
\r
/* 输入框增强 */\r
.learning-space-row input[type="date"],\r
.learning-space-row input[type="month"] {\r
  border-radius: 10px;\r
  border-color: rgba(34, 43, 51, .1);\r
  background: rgba(255, 255, 255, .68);\r
  transition: border-color .2s ease, box-shadow .2s ease;\r
}\r
\r
.learning-space-row input[type="date"]:focus,\r
.learning-space-row input[type="month"]:focus {\r
  border-color: rgba(216, 58, 46, .42);\r
  box-shadow: 0 0 0 3px rgba(216, 58, 46, .1);\r
  outline: none;\r
}\r
\r
/* ===== 学习空间：三列联动布局（优化使用链路） ===== */\r
/* 主工作区改为三列，每列内部上下堆叠相关功能 */\r
.learning-space-row-primary {\r
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr) minmax(280px, 320px);\r
  grid-template-rows: auto auto;\r
  gap: 20px;\r
}\r
\r
/* 左侧列：收藏清单 + 学习笔记 */\r
.learning-space-row-primary .my-favorites-panel {\r
  grid-column: 1;\r
  grid-row: 1;\r
}\r
\r
.learning-space-row-primary .learning-note-card {\r
  grid-column: 1;\r
  grid-row: 2;\r
}\r
\r
/* 中间列：图谱 + 图谱焦点 */\r
.learning-space-row-primary .learning-map-card {\r
  grid-column: 2;\r
  grid-row: 1;\r
}\r
\r
.learning-space-row-primary .learning-focus-card {\r
  grid-column: 2;\r
  grid-row: 2;\r
}\r
\r
/* 右侧列：今日推荐 + 学习打卡 */\r
.learning-space-row-primary .space-daily-recommend-card {\r
  grid-column: 3;\r
  grid-row: 1;\r
}\r
\r
.learning-space-row-primary .space-checkin-card {\r
  grid-column: 3;\r
  grid-row: 2;\r
}\r
\r
/* 隐藏原来的第二行 */\r
.learning-space-row-secondary {\r
  display: none;\r
}\r
\r
/* 响应式：平板和手机改为单列 */\r
@media (max-width: 1120px) {\r
  .learning-space-row-primary {\r
    grid-template-columns: 1fr;\r
    grid-template-rows: auto;\r
  }\r
\r
  .learning-space-row-primary .my-favorites-panel,\r
  .learning-space-row-primary .learning-note-card,\r
  .learning-space-row-primary .learning-map-card,\r
  .learning-space-row-primary .learning-focus-card,\r
  .learning-space-row-primary .space-daily-recommend-card,\r
  .learning-space-row-primary .space-checkin-card {\r
    grid-column: 1;\r
    grid-row: auto;\r
  }\r
\r
  .learning-space-row-secondary {\r
    display: grid;\r
    grid-template-columns: 1fr;\r
  }\r
}\r
\r
/* ===== 学习空间：三列联动布局 ===== */\r
/* 主工作区：三列两行，每列内部上下堆叠相关功能 */\r
.learning-space-row-primary {\r
  display: grid;\r
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr) minmax(280px, 320px);\r
  grid-template-rows: auto auto;\r
  gap: 20px;\r
  align-items: start;\r
}\r
\r
/* 左列：收藏清单（上）+ 学习笔记（下） */\r
.learning-space-row-primary .my-favorites-panel {\r
  grid-column: 1;\r
  grid-row: 1;\r
}\r
\r
.learning-space-row-primary .learning-note-card {\r
  grid-column: 1;\r
  grid-row: 2;\r
}\r
\r
/* 中列：图谱（上）+ 图谱焦点（下） */\r
.learning-space-row-primary .learning-map-card {\r
  grid-column: 2;\r
  grid-row: 1;\r
}\r
\r
.learning-space-row-primary .learning-focus-card {\r
  grid-column: 2;\r
  grid-row: 2;\r
}\r
\r
/* 右列：今日推荐（上）+ 学习打卡（下） */\r
.learning-space-row-primary .space-daily-recommend-card {\r
  grid-column: 3;\r
  grid-row: 1;\r
}\r
\r
.learning-space-row-primary .space-checkin-card {\r
  grid-column: 3;\r
  grid-row: 2;\r
}\r
\r
/* 隐藏原来的第二行 */\r
.learning-space-row-secondary {\r
  display: none;\r
}\r
\r
/* 热门节点全宽 */\r
.learning-space-row-full {\r
  display: grid;\r
  grid-template-columns: 1fr;\r
  margin-top: 20px;\r
}\r
\r
/* 响应式：平板和手机改为单列堆叠 */\r
@media (max-width: 1120px) {\r
  .learning-space-row-primary {\r
    grid-template-columns: 1fr;\r
    grid-template-rows: auto;\r
  }\r
\r
  .learning-space-row-primary .my-favorites-panel,\r
  .learning-space-row-primary .learning-note-card,\r
  .learning-space-row-primary .learning-map-card,\r
  .learning-space-row-primary .learning-focus-card,\r
  .learning-space-row-primary .space-daily-recommend-card,\r
  .learning-space-row-primary .space-checkin-card {\r
    grid-column: 1;\r
    grid-row: auto;\r
  }\r
}\r
\r
@media (max-width: 720px) {\r
  .learning-space-row-primary {\r
    gap: 16px;\r
  }\r
}\r
\r
/* ============================================================\r
   收藏学习：学习感视觉层\r
   仅样式与展示性结构，不改变任何请求、字段与状态流转。\r
   颜色一律取 --learn-* 语义变量，不要在下面写死品牌色。\r
   ============================================================ */\r
\r
.learn-cta {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 8px;\r
}\r
\r
/* 页面标题降级为阅读优先，不再和 hero 口号抢注意力 */\r
.favorites-function-section .learning-space-hero-copy h2 {\r
  font-size: clamp(28px, 3.2vw, 44px);\r
  line-height: 1.14;\r
}\r
\r
/* ---- 学习仪表条：状态 → 进度 → 积累 ---- */\r
.learn-metrics {\r
  display: grid;\r
  grid-template-columns: repeat(7, minmax(0, 1fr));\r
  gap: 12px;\r
}\r
\r
.learn-metrics article {\r
  display: grid;\r
  grid-template-columns: auto minmax(0, 1fr);\r
  grid-template-rows: auto auto;\r
  align-content: center;\r
  align-items: center;\r
  gap: 2px 10px;\r
  min-height: 84px;\r
  padding: 14px 16px;\r
  border-radius: 16px;\r
}\r
\r
.learn-metrics article > svg,\r
.learn-metrics article > .learn-ring {\r
  grid-column: 1;\r
  grid-row: 1 / span 2;\r
}\r
\r
.learn-metrics article > span:not(.learn-ring) {\r
  grid-column: 2;\r
  grid-row: 1;\r
  color: rgba(7, 7, 7, .58);\r
  font-size: 12px;\r
  font-weight: 900;\r
  letter-spacing: .04em;\r
}\r
\r
.learn-metrics article > strong {\r
  grid-column: 2;\r
  grid-row: 2;\r
  margin: 0;\r
  font-size: 24px;\r
  font-variant-numeric: tabular-nums;\r
  line-height: 1.1;\r
}\r
\r
.learn-metrics article > strong em {\r
  margin-left: 2px;\r
  font-size: 13px;\r
  font-style: normal;\r
  font-weight: 800;\r
  opacity: .6;\r
}\r
\r
.learn-metrics .learn-metric-text {\r
  font-size: 19px;\r
  letter-spacing: .02em;\r
}\r
\r
.learn-metric-state.is-done > strong {\r
  color: var(--learn-jade);\r
}\r
\r
.learn-metric-state.is-todo > strong {\r
  color: var(--learn-amber);\r
}\r
\r
.learn-metric-state.is-done {\r
  border-color: rgba(22, 121, 99, .28);\r
  background: linear-gradient(140deg, rgba(255, 255, 255, .92), rgba(224, 245, 236, .7));\r
}\r
\r
.learn-metric-state.is-todo {\r
  border-color: rgba(168, 118, 40, .26);\r
  background: linear-gradient(140deg, rgba(255, 255, 255, .92), rgba(255, 245, 223, .72));\r
}\r
\r
.learn-ring {\r
  --learn-ring-value: 0%;\r
  position: relative;\r
  display: grid;\r
  place-items: center;\r
  width: 42px;\r
  height: 42px;\r
  border-radius: 50%;\r
  background: conic-gradient(var(--learn-seal) var(--learn-ring-value), rgba(7, 7, 7, .08) 0);\r
}\r
\r
.learn-ring::before {\r
  position: absolute;\r
  inset: 4px;\r
  border-radius: 50%;\r
  background: rgba(255, 255, 255, .94);\r
  content: "";\r
}\r
\r
.learn-ring > svg {\r
  position: relative;\r
  z-index: 1;\r
  color: var(--learn-seal);\r
}\r
\r
/* ---- 空态：给起点，不给解释 ---- */\r
.learn-empty-card {\r
  display: grid;\r
  justify-items: center;\r
  gap: 10px;\r
  width: 100%;\r
  padding: 26px 20px;\r
  border: 1px dashed rgba(168, 118, 40, .34);\r
  border-radius: 16px;\r
  background:\r
    linear-gradient(90deg, rgba(168, 118, 40, .05) 1px, transparent 1px),\r
    linear-gradient(180deg, rgba(168, 118, 40, .05) 1px, transparent 1px),\r
    var(--learn-paper);\r
  background-size: 22px 22px, 22px 22px, auto;\r
  text-align: center;\r
}\r
\r
.learn-empty-card > .primary-action {\r
  max-width: 100%;\r
  white-space: normal;\r
}\r
\r
.learn-empty-art {\r
  display: grid;\r
  place-items: center;\r
  width: 52px;\r
  height: 52px;\r
  border: 1px solid rgba(168, 118, 40, .3);\r
  border-radius: 50%;\r
  background: rgba(255, 255, 255, .8);\r
  color: var(--learn-seal);\r
}\r
\r
.learn-empty-card strong,\r
.learn-empty-card h1 {\r
  margin: 0;\r
  color: var(--learn-ink);\r
  font-size: 17px;\r
}\r
\r
.learn-empty-card > span:not(.learn-empty-art) {\r
  max-width: 300px;\r
  color: rgba(7, 7, 7, .58);\r
  font-size: 13px;\r
  line-height: 1.7;\r
}\r
\r
/* ---- 学习卡：书签 + 状态 + 记笔记 ---- */\r
.favorite-learning-card {\r
  grid-template-columns: minmax(0, 1fr);\r
  overflow: hidden;\r
  border-radius: 16px;\r
}\r
\r
.favorite-learning-card > .favorite-card-main {\r
  display: grid;\r
  gap: 6px;\r
  width: 100%;\r
  padding: 16px 16px 12px 26px;\r
  border: 0;\r
  background: transparent;\r
  color: inherit;\r
  cursor: pointer;\r
  text-align: left;\r
}\r
\r
.favorite-card-index {\r
  position: absolute;\r
  top: 14px;\r
  left: 10px;\r
  color: rgba(7, 7, 7, .34);\r
  font-size: 11px;\r
  font-weight: 1000;\r
  font-variant-numeric: tabular-nums;\r
  letter-spacing: .06em;\r
}\r
\r
.favorite-bookmark {\r
  position: absolute;\r
  top: 0;\r
  right: 18px;\r
  width: 10px;\r
  height: 20px;\r
  border-radius: 0 0 4px 4px;\r
  background: linear-gradient(180deg, var(--learn-seal), var(--learn-amber));\r
  opacity: .78;\r
}\r
\r
.favorite-card-meta {\r
  display: flex;\r
  flex-wrap: wrap;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 8px;\r
  margin-top: 2px;\r
}\r
\r
.favorite-card-meta time {\r
  color: rgba(7, 7, 7, .42);\r
  font-size: 11px;\r
  font-variant-numeric: tabular-nums;\r
}\r
\r
.learn-state {\r
  padding: 2px 8px;\r
  border-radius: 999px;\r
  font-size: 11px;\r
  font-style: normal;\r
  font-weight: 900;\r
}\r
\r
.learn-state.is-noted {\r
  background: rgba(22, 121, 99, .12);\r
  color: var(--learn-jade);\r
}\r
\r
.learn-state.is-todo {\r
  background: rgba(168, 118, 40, .14);\r
  color: var(--learn-amber);\r
}\r
\r
.favorite-card-actions {\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 8px;\r
  padding: 0 14px 12px 26px;\r
}\r
\r
.favorite-learning-card .favorite-card-actions .danger-icon {\r
  position: static;\r
  top: auto;\r
  right: auto;\r
}\r
\r
/* ---- 学习地图 ---- */\r
.learn-map-tools {\r
  display: flex;\r
  flex: 0 0 auto;\r
  flex-direction: column;\r
  align-items: flex-end;\r
  gap: 6px;\r
  text-align: right;\r
}\r
\r
.learn-toggle {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 6px;\r
  padding: 3px 9px;\r
  border: 1px solid rgba(7, 7, 7, .12);\r
  border-radius: 999px;\r
  background: rgba(255, 255, 255, .72);\r
  color: rgba(7, 7, 7, .62);\r
  font-size: 12px;\r
  font-weight: 900;\r
  white-space: nowrap;\r
  cursor: pointer;\r
}\r
\r
.learn-toggle input {\r
  flex: 0 0 auto;\r
  width: 13px;\r
  height: 13px;\r
  margin: 0;\r
  accent-color: var(--learn-seal);\r
  cursor: pointer;\r
}\r
\r
.learn-map-count {\r
  color: rgba(7, 7, 7, .48);\r
  font-size: 11px;\r
  font-variant-numeric: tabular-nums;\r
  white-space: nowrap;\r
}\r
\r
.favorite-node:not(.favorited) .node-core {\r
  opacity: .5;\r
}\r
\r
.favorite-node:not(.favorited) .node-halo {\r
  fill: none;\r
  stroke: rgba(7, 7, 7, .28);\r
  stroke-dasharray: 4 4;\r
}\r
\r
.favorite-node .node-bookmark {\r
  fill: var(--learn-amber);\r
  stroke: rgba(255, 255, 255, .9);\r
  stroke-width: 1.5;\r
}\r
\r
.learn-edge-label {\r
  fill: rgba(7, 7, 7, .5);\r
  font-size: 10px;\r
  font-weight: 800;\r
  text-anchor: middle;\r
  paint-order: stroke;\r
  stroke: rgba(255, 255, 255, .92);\r
  stroke-width: 3px;\r
  pointer-events: none;\r
}\r
\r
/* ---- 今日清单 ---- */\r
.learn-task-progress,\r
.learn-week-strip {\r
  display: grid;\r
  grid-template-columns: auto minmax(0, 1fr) auto;\r
  align-items: center;\r
  gap: 10px;\r
  margin-top: 12px;\r
  color: rgba(7, 7, 7, .58);\r
  font-size: 12px;\r
  font-weight: 900;\r
}\r
\r
.learn-task-progress strong,\r
.learn-week-strip strong {\r
  color: var(--learn-ink);\r
  font-variant-numeric: tabular-nums;\r
}\r
\r
.learn-progress-track {\r
  position: relative;\r
  height: 6px;\r
  overflow: hidden;\r
  border-radius: 999px;\r
  background: rgba(7, 7, 7, .08);\r
}\r
\r
.learn-progress-track > i {\r
  display: block;\r
  height: 100%;\r
  border-radius: 999px;\r
  background: linear-gradient(90deg, var(--learn-seal), var(--learn-amber));\r
  transition: width .28s ease;\r
}\r
\r
.learn-task-list article {\r
  grid-template-columns: 26px minmax(0, 1fr);\r
  align-items: start;\r
  gap: 10px;\r
  padding: 14px 16px;\r
}\r
\r
.learn-task-list article.done {\r
  background: rgba(224, 245, 236, .6);\r
}\r
\r
.learn-task-list article.done strong {\r
  color: rgba(7, 7, 7, .5);\r
  text-decoration: line-through;\r
}\r
\r
.learn-task-list article > div {\r
  display: grid;\r
  gap: 4px;\r
  min-width: 0;\r
}\r
\r
.learn-task-check {\r
  display: grid;\r
  place-items: center;\r
  width: 26px;\r
  height: 26px;\r
  margin: 0;\r
  padding: 0;\r
  border: 0;\r
  border-radius: 50%;\r
  background: transparent;\r
  color: rgba(7, 7, 7, .32);\r
  cursor: pointer;\r
  transition: color .18s ease, transform .18s ease;\r
}\r
\r
.learn-task-check[aria-pressed="true"] {\r
  color: var(--learn-jade);\r
}\r
\r
.learn-task-check:hover {\r
  transform: scale(1.08);\r
}\r
\r
.learn-task-hint {\r
  margin: 8px 0 0;\r
  color: rgba(7, 7, 7, .42);\r
  font-size: 11px;\r
}\r
\r
/* ---- 打卡日历：印章 + 金环 + 盖章动效 ---- */\r
.consumer-calendar span {\r
  position: relative;\r
}\r
\r
.consumer-calendar span.checked {\r
  border-radius: 50%;\r
  background: radial-gradient(circle at 32% 28%, #d9694f, var(--learn-seal) 62%);\r
  color: #fff;\r
  box-shadow:\r
    inset 0 0 0 1px rgba(255, 255, 255, .5),\r
    0 8px 18px rgba(184, 74, 53, .22);\r
}\r
\r
.consumer-calendar span.checked::after {\r
  position: absolute;\r
  top: 1px;\r
  right: 2px;\r
  color: #fff0d2;\r
  font-size: 9px;\r
  font-weight: 1000;\r
  content: "✓";\r
}\r
\r
.consumer-calendar span.today {\r
  outline: 2px solid var(--learn-amber);\r
  outline-offset: 1px;\r
}\r
\r
.consumer-calendar span.today.checked {\r
  outline-color: rgba(255, 255, 255, .9);\r
}\r
\r
.consumer-calendar.is-stamping span.checked {\r
  animation: learn-seal-stamp .42s ease;\r
}\r
\r
@keyframes learn-seal-stamp {\r
  0% {\r
    transform: scale(.86);\r
    opacity: .45;\r
  }\r
  60% {\r
    transform: scale(1.04);\r
    opacity: 1;\r
  }\r
  100% {\r
    transform: scale(1);\r
  }\r
}\r
\r
@media (prefers-reduced-motion: reduce) {\r
  .consumer-calendar.is-stamping span.checked {\r
    animation: none;\r
  }\r
\r
  .learn-progress-track > i,\r
  .learn-task-check,\r
  .favorite-learning-card {\r
    transition: none;\r
  }\r
}\r
\r
@media (max-width: 1120px) {\r
  .learn-metrics {\r
    grid-template-columns: repeat(4, minmax(0, 1fr));\r
  }\r
}\r
\r
@media (max-width: 720px) {\r
  .learn-metrics {\r
    grid-template-columns: repeat(2, minmax(0, 1fr));\r
  }\r
\r
  .learn-map-tools {\r
    align-items: flex-start;\r
    text-align: left;\r
  }\r
}\r
\r
/* ============================================================\r
   收藏学习重构：学习索引页 / 学习页\r
   颜色一律取 --learn-* 语义变量；不改动任何既有选择器。\r
   ============================================================ */\r
\r
.learning-index-page,\r
.learning-study-page {\r
  display: grid;\r
  gap: 18px;\r
  width: min(1240px, 100%);\r
  margin: 0 auto;\r
}\r
\r
.learning-index-head {\r
  display: flex;\r
  align-items: flex-end;\r
  justify-content: space-between;\r
  gap: 20px;\r
}\r
\r
.learning-index-head h2 {\r
  margin: 6px 0 0;\r
  color: var(--learn-ink);\r
  font-family: var(--display-cn);\r
  font-size: clamp(26px, 3vw, 40px);\r
  line-height: 1.16;\r
  letter-spacing: 0;\r
}\r
\r
.learning-index-head > div > span {\r
  display: block;\r
  max-width: 620px;\r
  margin-top: 8px;\r
  color: rgba(7, 7, 7, .6);\r
  line-height: 1.7;\r
}\r
\r
.learning-index-filter {\r
  grid-template-columns: minmax(0, 1fr) auto;\r
  align-items: end;\r
}\r
\r
/* ---- 笔记卡片网格 ---- */\r
.learning-card-grid {\r
  display: grid;\r
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));\r
  gap: 20px;\r
}\r
\r
.learning-card {\r
  display: grid;\r
  grid-template-rows: minmax(0, 1fr) auto;\r
  overflow: hidden;\r
  border: 1px solid rgba(7, 7, 7, .1);\r
  border-radius: 16px;\r
  background: rgba(255, 255, 255, .82);\r
  box-shadow: 0 12px 32px rgba(119, 66, 38, .08);\r
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;\r
}\r
\r
.learning-card:hover {\r
  transform: translateY(-2px);\r
  border-color: rgba(184, 74, 53, .34);\r
  box-shadow: inset 3px 0 0 var(--learn-seal), 0 18px 44px rgba(119, 66, 38, .12);\r
}\r
\r
.learning-card-main {\r
  display: grid;\r
  grid-template-rows: auto minmax(0, 1fr);\r
  gap: 0;\r
  padding: 0;\r
  border: 0;\r
  background: transparent;\r
  color: inherit;\r
  text-align: left;\r
  cursor: pointer;\r
}\r
\r
.learning-card-body {\r
  display: grid;\r
  gap: 8px;\r
  padding: 16px 18px 12px;\r
}\r
\r
.learning-card-chips {\r
  display: flex;\r
  flex-wrap: wrap;\r
  align-items: center;\r
  gap: 8px;\r
}\r
\r
.learning-card-body strong {\r
  color: var(--learn-ink);\r
  font-size: 18px;\r
  line-height: 1.3;\r
}\r
\r
.learning-card-body small {\r
  color: rgba(7, 7, 7, .5);\r
  font-size: 12px;\r
  font-variant-numeric: tabular-nums;\r
}\r
\r
/* 笔记预览：卡片的核心内容 */\r
.learning-card-note-preview {\r
  display: -webkit-box;\r
  overflow: hidden;\r
  margin: 4px 0 0;\r
  padding: 10px 12px;\r
  border-left: 3px solid var(--learn-amber);\r
  border-radius: 0 8px 8px 0;\r
  background: rgba(255, 247, 231, .6);\r
  color: rgba(7, 7, 7, .72);\r
  font-size: 13px;\r
  line-height: 1.65;\r
  -webkit-box-orient: vertical;\r
  -webkit-line-clamp: 3;\r
}\r
\r
.learning-card-note-preview.is-empty {\r
  border-left-color: rgba(7, 7, 7, .15);\r
  background: rgba(7, 7, 7, .03);\r
  color: rgba(7, 7, 7, .45);\r
  font-style: italic;\r
}\r
\r
.learning-card-foot {\r
  display: flex;\r
  flex-wrap: wrap;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 8px;\r
  padding: 10px 16px 14px;\r
  border-top: 1px solid rgba(7, 7, 7, .06);\r
}\r
\r
.learning-card-meta,\r
.learning-card-relations {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 5px;\r
  color: rgba(7, 7, 7, .45);\r
  font-size: 11px;\r
  font-variant-numeric: tabular-nums;\r
}\r
\r
/* ---- 笔记卡片状态色 ---- */\r
.learning-card.is-mastered .learning-card-note-preview {\r
  border-left-color: var(--learn-jade);\r
  background: rgba(22, 121, 99, .06);\r
}\r
\r
.learning-card.is-fuzzy .learning-card-note-preview {\r
  border-left-color: var(--learn-amber);\r
}\r
\r
.learning-card.is-todo .learning-card-note-preview {\r
  border-left-color: var(--learn-seal);\r
}\r
\r
/* ---- 自适应封面 ---- */\r
.learning-cover {\r
  position: relative;\r
  display: grid;\r
  place-items: center;\r
  overflow: hidden;\r
  aspect-ratio: 16 / 9;\r
  background: var(--learn-amber);\r
}\r
\r
.learning-cover img {\r
  width: 100%;\r
  height: 100%;\r
  object-fit: cover;\r
}\r
\r
.learning-cover-fallback,\r
.learning-cover-loading {\r
  display: grid;\r
  place-items: center;\r
  width: 44px;\r
  height: 44px;\r
  border-radius: 50%;\r
  background: rgba(255, 255, 255, .82);\r
  color: var(--learn-ink);\r
  font-family: var(--display-cn);\r
  font-size: 20px;\r
}\r
\r
.learning-cover.has-image {\r
  background: none;\r
}\r
\r
/* ---- 学习页：笔记为主，内容为参考 ---- */\r
.study-back {\r
  justify-self: start;\r
}\r
\r
.study-grid {\r
  display: grid;\r
  grid-template-columns: minmax(280px, 0.85fr) minmax(0, 1.15fr);\r
  gap: 18px;\r
  align-items: start;\r
}\r
\r
.study-read-column,\r
.study-learn-column {\r
  display: grid;\r
  gap: 16px;\r
  min-width: 0;\r
}\r
\r
/* 左侧内容区：紧凑参考卡片 */\r
.study-material,\r
.study-relations {\r
  border: 1px solid rgba(7, 7, 7, .1);\r
  border-radius: 14px;\r
  background: rgba(255, 255, 255, .84);\r
  box-shadow: 0 8px 24px rgba(119, 66, 38, .06);\r
  padding: 16px;\r
}\r
\r
/* 右侧笔记区：视觉焦点 */\r
.study-note {\r
  border: 1px solid rgba(184, 74, 53, .18);\r
  border-radius: 18px;\r
  background: rgba(255, 255, 255, .92);\r
  box-shadow: 0 16px 40px rgba(119, 66, 38, .1), inset 3px 0 0 var(--learn-seal);\r
  padding: 22px;\r
}\r
\r
.study-ai {\r
  border: 1px solid rgba(7, 7, 7, .1);\r
  border-radius: 14px;\r
  background: rgba(255, 255, 255, .84);\r
  box-shadow: 0 8px 24px rgba(119, 66, 38, .06);\r
  padding: 16px;\r
}\r
\r
.study-title {\r
  margin: 6px 0 0;\r
  color: var(--learn-ink);\r
  font-family: var(--display-cn);\r
  font-size: clamp(22px, 2.2vw, 32px);\r
  line-height: 1.2;\r
  letter-spacing: 0;\r
}\r
\r
.study-material-meta {\r
  display: flex;\r
  flex-wrap: wrap;\r
  align-items: center;\r
  gap: 10px;\r
  margin-top: 10px;\r
  color: rgba(7, 7, 7, .55);\r
  font-size: 12px;\r
  font-variant-numeric: tabular-nums;\r
}\r
\r
.study-material-body {\r
  margin-top: 14px;\r
  color: rgba(7, 7, 7, .78);\r
  line-height: 1.8;\r
}\r
\r
.study-material-empty {\r
  margin: 14px 0 0;\r
  color: rgba(7, 7, 7, .5);\r
  font-size: 13px;\r
}\r
\r
.study-relation-groups {\r
  display: grid;\r
  gap: 14px;\r
  margin-top: 12px;\r
}\r
\r
.study-relation-group {\r
  display: flex;\r
  flex-wrap: wrap;\r
  align-items: center;\r
  gap: 8px;\r
}\r
\r
.study-relation-group p {\r
  width: 100%;\r
  margin: 0 0 2px;\r
  color: var(--learn-amber);\r
  font-size: 12px;\r
  font-weight: 900;\r
}\r
\r
.study-note-head {\r
  display: flex;\r
  align-items: baseline;\r
  justify-content: space-between;\r
  gap: 10px;\r
}\r
\r
.study-note-head small {\r
  color: rgba(7, 7, 7, .45);\r
  font-size: 11px;\r
}\r
\r
.study-note textarea {\r
  width: 100%;\r
  margin: 10px 0;\r
  padding: 12px;\r
  border: 1px solid rgba(7, 7, 7, .12);\r
  border-radius: 10px;\r
  background: rgba(255, 255, 255, .86);\r
  color: var(--learn-ink);\r
  font: inherit;\r
  line-height: 1.7;\r
  resize: vertical;\r
}\r
\r
.study-note textarea:focus,\r
.study-note input:focus {\r
  border-color: rgba(184, 74, 53, .42);\r
  box-shadow: 0 0 0 3px rgba(184, 74, 53, .1);\r
  outline: none;\r
}\r
\r
.study-note label {\r
  display: block;\r
  margin-top: 12px;\r
  color: var(--learn-ink);\r
  font-size: 12px;\r
  font-weight: 800;\r
}\r
\r
.study-note input {\r
  width: 100%;\r
  margin: 8px 0;\r
  padding: 10px 12px;\r
  border: 1px solid rgba(7, 7, 7, .12);\r
  border-radius: 10px;\r
  background: rgba(255, 255, 255, .86);\r
  color: var(--learn-ink);\r
  font: inherit;\r
}\r
\r
.learning-storage-badge {\r
  padding: 3px 7px;\r
  border-radius: 999px;\r
  font-size: 10px;\r
  font-weight: 800;\r
}\r
.learning-storage-badge.is-synced { color: var(--learn-jade); background: rgba(22, 121, 99, .1); }\r
.learning-storage-badge.is-local { color: var(--learn-amber); background: rgba(168, 118, 40, .12); }\r
.learning-review-flow { margin-top: 10px; display: grid; gap: 14px; }\r
\r
/* 步骤引导式学习卡片 */\r
.study-step {\r
  padding: 12px;\r
  border: 1px solid rgba(168, 118, 40, .18);\r
  border-radius: 12px;\r
  background: rgba(255, 252, 245, .6);\r
  display: grid;\r
  gap: 8px;\r
}\r
.study-step-head {\r
  display: flex;\r
  align-items: center;\r
  gap: 8px;\r
}\r
.study-step-num {\r
  display: inline-grid;\r
  place-items: center;\r
  width: 22px;\r
  height: 22px;\r
  border-radius: 50%;\r
  background: var(--learn-amber);\r
  color: #fff;\r
  font-size: 12px;\r
  font-weight: 800;\r
  flex: 0 0 auto;\r
}\r
.study-step-label {\r
  font-weight: 700;\r
  color: var(--learn-ink);\r
  font-size: 13px;\r
}\r
.study-step-done {\r
  color: var(--learn-jade);\r
  font-weight: 800;\r
  font-size: 13px;\r
  margin-left: auto;\r
}\r
.study-step-hint {\r
  margin: 0;\r
  color: rgba(7, 7, 7, .52);\r
  font-size: 12px;\r
  line-height: 1.5;\r
}\r
.study-step-ai {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 6px;\r
  margin-top: 2px;\r
}\r
.study-step-sub-label {\r
  font-size: 12px;\r
  font-weight: 600;\r
  color: rgba(7, 7, 7, .62);\r
  margin-top: 4px;\r
}\r
\r
/* 复习测验盒：揭晓前的提示区 */\r
.review-quiz-box {\r
  margin: 8px 0;\r
  padding: 14px;\r
  border: 1px dashed rgba(168, 118, 40, .35);\r
  border-radius: 12px;\r
  background: rgba(255, 247, 231, .5);\r
  text-align: center;\r
}\r
.review-quiz-box .learn-task-hint { margin: 0 0 10px; }\r
.review-reveal-btn { min-width: 140px; }\r
\r
/* AI 自测问题：用户作答区 */\r
.ai-quiz-box {\r
  margin: 10px 0 0;\r
  padding: 12px;\r
  border: 1px dashed rgba(168, 118, 40, .35);\r
  border-radius: 12px;\r
  background: rgba(255, 247, 231, .5);\r
  display: grid;\r
  gap: 8px;\r
}\r
.ai-quiz-box label {\r
  font-size: 12px;\r
  font-weight: 600;\r
  color: var(--learn-seal);\r
}\r
.ai-quiz-box textarea {\r
  width: 100%;\r
  min-height: 64px;\r
  resize: vertical;\r
  border: 1px solid var(--line);\r
  border-radius: 8px;\r
  padding: 8px 10px;\r
  font: inherit;\r
  background: rgba(255, 255, 255, .8);\r
  color: var(--ink);\r
}\r
.ai-quiz-box .learning-review-answer { margin-top: 4px; }\r
\r
/* 揭晓后的答案区 */\r
.learning-review-answer {\r
  margin: 0;\r
  padding: 0;\r
  border-radius: 0;\r
  background: transparent;\r
  text-align: left;\r
}\r
.learning-review-answer strong {\r
  display: block;\r
  color: var(--learn-seal);\r
  font-size: 13px;\r
  margin-bottom: 6px;\r
}\r
.learning-review-answer p {\r
  margin: 0;\r
  padding: 10px 12px;\r
  border-left: 3px solid var(--learn-amber);\r
  border-radius: 0 8px 8px 0;\r
  background: rgba(255, 247, 231, .6);\r
  color: rgba(7, 7, 7, .72);\r
  line-height: 1.65;\r
}\r
\r
/* 自评按钮 */\r
.study-review-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }\r
.study-review-actions .secondary-action {\r
  min-width: 72px;\r
  justify-content: center;\r
}\r
.study-review-actions .secondary-action.is-active {\r
  border-color: var(--learn-jade);\r
  background: rgba(22, 121, 99, .12);\r
  color: var(--learn-jade);\r
  font-weight: 800;\r
}\r
.learning-review-meta { display: block; margin-top: 8px; color: rgba(7, 7, 7, .48); font-size: 11px; }\r
\r
/* 关联节点合并区域 */\r
.study-related-combined {\r
  margin-top: 8px;\r
  padding: 10px;\r
  border: 1px solid rgba(168, 118, 40, .24);\r
  border-radius: var(--learn-radius-item);\r
  background: var(--learn-paper);\r
}\r
.study-related-combined legend {\r
  padding: 0 6px;\r
  color: var(--learn-amber);\r
  font-size: 12px;\r
  font-weight: 900;\r
}\r
.related-selected-row {\r
  display: flex;\r
  flex-wrap: wrap;\r
  align-items: center;\r
  gap: 6px;\r
  min-height: 32px;\r
  padding-bottom: 8px;\r
  border-bottom: 1px dashed rgba(168, 118, 40, .2);\r
}\r
.related-selected-row .related-empty-hint {\r
  color: rgba(7, 7, 7, .42);\r
  font-size: 12px;\r
}\r
.related-candidates-row {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 6px;\r
  padding-top: 8px;\r
}\r
.related-candidates-row small {\r
  color: rgba(7, 7, 7, .48);\r
}\r
.related-candidate-btn {\r
  display: inline-flex;\r
  align-items: center;\r
  min-height: 28px;\r
  padding: 0 10px;\r
  border: 1px solid rgba(7, 7, 7, .14);\r
  border-radius: 999px;\r
  background: rgba(255, 255, 255, .72);\r
  color: rgba(7, 7, 7, .62);\r
  font-size: 12px;\r
  cursor: pointer;\r
  transition: border-color .15s ease, background .15s ease, color .15s ease;\r
}\r
.related-candidate-btn:hover {\r
  border-color: rgba(22, 121, 99, .4);\r
  color: var(--learn-jade);\r
}\r
.related-candidate-btn.is-selected {\r
  border-color: var(--learn-jade);\r
  background: rgba(22, 121, 99, .1);\r
  color: var(--learn-jade);\r
  font-weight: 800;\r
}\r
\r
.related-chip {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 6px;\r
  max-width: 100%;\r
  padding: 6px 7px 6px 10px;\r
  overflow-wrap: anywhere;\r
  border: 1px solid rgba(22, 121, 99, .3);\r
  border-radius: 999px;\r
  background: rgba(22, 121, 99, .1);\r
  color: var(--learn-ink);\r
  font-size: 12px;\r
  line-height: 1.3;\r
}\r
\r
.related-chip button {\r
  display: inline-grid;\r
  flex: 0 0 auto;\r
  width: 22px;\r
  height: 22px;\r
  place-items: center;\r
  padding: 0;\r
  border: 0;\r
  border-radius: 50%;\r
  background: transparent;\r
  color: var(--learn-seal);\r
  font-size: 18px;\r
  line-height: 1;\r
  cursor: pointer;\r
}\r
\r
.related-chip button:hover {\r
  background: rgba(184, 74, 53, .12);\r
}\r
\r
.related-chip button:focus-visible {\r
  outline: 2px solid var(--learn-seal);\r
  outline-offset: 2px;\r
}\r
\r
.study-related-node-list { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 8px; }\r
.study-related-node-list small { color: rgba(7, 7, 7, .48); }\r
.study-related-node-list .is-selected { border-color: var(--learn-jade); color: var(--learn-jade); }\r
\r
@media (max-width: 480px) {\r
  .related-chip {\r
    flex: 1 1 100%;\r
    justify-content: space-between;\r
  }\r
\r
  .related-candidate-btn {\r
    flex: 1 1 100%;\r
    justify-content: center;\r
  }\r
}\r
\r
.study-ai-actions {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 8px;\r
  margin-top: 10px;\r
}\r
\r
.study-ai-output {\r
  margin-top: 12px;\r
  padding: 14px;\r
  border: 1px solid rgba(168, 118, 40, .22);\r
  border-radius: 12px;\r
  background: var(--learn-paper);\r
}\r
\r
.study-ai-output strong {\r
  display: block;\r
  margin-bottom: 8px;\r
  color: var(--learn-seal);\r
  font-size: 13px;\r
}\r
\r
.study-ai-output-actions {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 8px;\r
  margin-top: 12px;\r
}\r
\r
/* 导航只从这里出：后端 suggestions 是唯一经 pageIndex 校验的通道，正文里的 /xxx 已被清掉，\r
   所以这里用站内链接 —— 读者要的是页面名，不是路由地址。 */\r
.study-ai-suggestions {\r
  display: flex;\r
  flex-wrap: wrap;\r
  align-items: center;\r
  gap: 8px;\r
  margin-top: 12px;\r
  padding-top: 10px;\r
  border-top: 1px dashed rgba(168, 118, 40, .22);\r
}\r
\r
.study-ai-suggestions-label {\r
  color: var(--learn-ink-soft, #6b6257);\r
  font-size: 12px;\r
}\r
\r
.study-ai-suggestion {\r
  padding: 4px 10px;\r
  border: 1px solid rgba(168, 118, 40, .3);\r
  border-radius: 999px;\r
  background: rgba(168, 118, 40, .08);\r
  color: var(--learn-seal);\r
  font-size: 12px;\r
  text-decoration: none;\r
}\r
\r
.study-ai-suggestion:hover,\r
.study-ai-suggestion:focus-visible {\r
  border-color: var(--learn-seal);\r
  background: rgba(168, 118, 40, .16);\r
}\r
\r
/* 修复提交 52a00bb 新增的失败容器（超时/空回答/断线）：与输出区同构，\r
   但用 seal 色的虚线边框区分「这次请求失败了」与「这是 AI 的回答」。 */\r
.study-ai-failure {\r
  margin-top: 12px;\r
  padding: 14px;\r
  border: 1px dashed rgba(184, 74, 53, .34);\r
  border-radius: 12px;\r
  background: rgba(184, 74, 53, .05);\r
}\r
\r
.study-lesson-nav {\r
  display: grid;\r
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);\r
  gap: 10px;\r
}\r
\r
.study-lesson-nav button {\r
  justify-content: center;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
\r
@media (max-width: 1120px) {\r
  .study-grid {\r
    grid-template-columns: minmax(0, 1fr);\r
  }\r
\r
  .learning-index-head {\r
    flex-direction: column;\r
    align-items: flex-start;\r
  }\r
}\r
\r
@media (max-width: 900px) {\r
  .study-grid {\r
    grid-template-columns: minmax(0, 1fr);\r
  }\r
}\r
\r
@media (max-width: 720px) {\r
  .learning-card-grid {\r
    grid-template-columns: minmax(0, 1fr);\r
  }\r
\r
  .study-lesson-nav {\r
    grid-template-columns: minmax(0, 1fr);\r
  }\r
\r
  .learning-index-filter {\r
    grid-template-columns: minmax(0, 1fr);\r
  }\r
}\r
\r
@media (prefers-reduced-motion: reduce) {\r
  .learning-card {\r
    transition: none;\r
  }\r
}\r
\r
/* Learning dashboard additions */\r
.learn-sync-badge,\r
.learn-storage-label {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 6px;\r
  border: 1px solid rgba(7, 7, 7, .12);\r
  border-radius: 999px;\r
  padding: 5px 9px;\r
  color: rgba(7, 7, 7, .62);\r
  background: rgba(255, 255, 255, .72);\r
  font-size: 11px;\r
  font-weight: 800;\r
  white-space: nowrap;\r
}\r
.learn-sync-badge > span { width: 7px; height: 7px; border-radius: 50%; background: var(--learn-amber); }\r
.learn-sync-badge.is-synced > span { background: var(--learn-jade); }\r
.learn-dashboard-metric { border-color: rgba(184, 74, 53, .2); }\r
.learn-dashboard-callout { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 14px; padding: 14px 16px; border: 1px solid rgba(168, 118, 40, .28); border-radius: 14px; background: rgba(255, 247, 231, .76); }\r
.learn-dashboard-callout strong { color: var(--learn-ink); }\r
.learn-dashboard-callout span { flex: 1 1 280px; color: rgba(7, 7, 7, .62); font-size: 13px; line-height: 1.6; }\r
.learn-dashboard-callout button { margin-left: auto; }\r
.learning-card.is-mastered { border-color: rgba(22, 121, 99, .28); }\r
.learning-card.is-fuzzy { border-color: rgba(168, 118, 40, .3); }\r
.learning-card-learning-meta { display: flex; flex-wrap: wrap; gap: 8px 14px; color: rgba(7, 7, 7, .5); font-size: 11px; }\r
.learning-card-learning-meta .has-content { color: var(--learn-jade); font-weight: 800; }\r
.learning-card-status-hint { color: rgba(7, 7, 7, .48); }\r
.learning-card-chips .learn-storage-label { padding: 3px 7px; border: 0; background: rgba(7, 7, 7, .05); font-size: 10px; }\r
.learning-card-chips .learn-state.is-mastered { color: var(--learn-jade); }\r
.learning-card-chips .learn-state.is-fuzzy { color: var(--learn-amber); }\r
.learning-card-chips .learn-state.is-todo { color: var(--learn-seal); }\r
@media (max-width: 720px) {\r
  .learning-index-head { align-items: flex-start; flex-direction: column; }\r
  .heading-actions { width: 100%; justify-content: space-between; }\r
  .learn-dashboard-callout button { width: 100%; margin-left: 0; }\r
  .learning-card-foot { align-items: stretch; }\r
  .learning-card-foot .primary-action { width: 100%; justify-content: center; }\r
}\r
`,m=a({__name:"PortalHeritageEntry",setup(s){let r=null;return e(()=>{r=document.createElement("style"),r.setAttribute("data-heritage-intro-theme","true"),r.textContent=p,document.head.appendChild(r)}),i(()=>{r==null||r.remove(),r=null}),(l,d)=>(o(),t(n))}});export{m as default};
