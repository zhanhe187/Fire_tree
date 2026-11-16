import{c as r}from"./graph-B9uVLOQt.js";/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=r("ChevronLeftIcon",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=r("ChevronRightIcon",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);function g(t=new Date){const n=t.getFullYear(),o=String(t.getMonth()+1).padStart(2,"0"),a=String(t.getDate()).padStart(2,"0");return`${n}-${o}-${a}`}function m(t=new Date){const n=t.getFullYear(),o=String(t.getMonth()+1).padStart(2,"0");return`${n}-${o}`}function l(t,n){const[o,a]=t.split("-").map(Number),e=o*12+(a-1)+n,c=Math.floor(e/12),h=e%12+1;return`${c}-${String(h).padStart(2,"0")}`}export{i as C,m as a,f as b,g as f,l as s};
