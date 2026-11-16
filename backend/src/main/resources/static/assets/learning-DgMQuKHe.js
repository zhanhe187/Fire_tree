import{c as a,y as t,D as r}from"./graph-B9uVLOQt.js";/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=a("FlameIcon",[["path",{d:"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",key:"96xj49"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s=a("TrophyIcon",[["path",{d:"M6 9H4.5a2.5 2.5 0 0 1 0-5H6",key:"17hqa7"}],["path",{d:"M18 9h1.5a2.5 2.5 0 0 0 0-5H18",key:"lmptdp"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",key:"1nw9bq"}],["path",{d:"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",key:"1np0yb"}],["path",{d:"M18 2H6v7a6 6 0 0 0 12 0V2Z",key:"u46fv3"}]]);function o(e){const n=new URLSearchParams;return e&&n.set("date",e),t(`/api/learning/recommendations/daily?${n.toString()}`)}function h(e){const n=new URLSearchParams;return e.date&&n.set("date",e.date),n.set("limit",String(e.limit??6)),r(`/api/learning/recommendations/generate?${n.toString()}`,"POST")}function d(e=10){const n=new URLSearchParams({limit:String(e)});return t(`/api/learning/hot?${n.toString()}`)}function m(e){const n=new URLSearchParams({month:e.month});return e.username?n.set("username",e.username):e.userId&&n.set("userId",String(e.userId)),t(`/api/learning/checkins?${n.toString()}`)}function u(e){return r("/api/learning/checkins","POST",e)}export{c as F,s as T,d as a,o as b,u as c,m as f,h as g};
