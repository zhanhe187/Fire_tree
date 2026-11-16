import{c as o,y as i,D as t}from"./graph-B9uVLOQt.js";/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=o("MessageSquareIcon",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=o("UserRoundCheckIcon",[["path",{d:"M2 21a8 8 0 0 1 13.292-6",key:"bjp14o"}],["circle",{cx:"10",cy:"8",r:"5",key:"o932ke"}],["path",{d:"m16 19 2 2 4-4",key:"1b14m6"}]]);function r(e){const n=new URLSearchParams;return e.keyword&&n.set("keyword",e.keyword),e.nodeId&&n.set("nodeId",String(e.nodeId)),e.authorId&&n.set("authorId",String(e.authorId)),n.set("page",String(e.page??1)),n.set("size",String(e.size??10)),i(`/api/community/questions?${n.toString()}`)}function m(e){return i(`/api/community/questions/${e}`)}function a(e,n){return i(`/api/community/questions/${e}/replies-since?since=${encodeURIComponent(n)}`)}function y(e){return t("/api/community/questions","POST",e)}function d(e,n){return t(`/api/community/questions/${e}/answers`,"POST",n)}function f(e,n){return t(`/api/community/questions/${e}/comments`,"POST",n)}function h(e,n){return t(`/api/community/answers/${e}/comments`,"POST",n)}function C(e,n){return t(`/api/community/questions/${e}/likes`,"POST",n)}function S(e){return t(`/api/community/questions/${e}`,"DELETE")}export{u as M,c as U,m as a,a as b,y as c,d,f as e,r as f,h as g,S as h,C as l};
