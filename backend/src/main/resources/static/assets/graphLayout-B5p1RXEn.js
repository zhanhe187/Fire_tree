import{c as f}from"./graph-B9uVLOQt.js";/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=f("MessageSquareTextIcon",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}],["path",{d:"M13 8H7",key:"14i4kc"}],["path",{d:"M17 12H7",key:"16if0g"}]]),x={x:420,y:260},g=720;function T(t,a){const c=Math.max(a,1),s=Math.PI*(3-Math.sqrt(5)),r=c===1?0:t/(c-1),e=72+t%5*31+r*150,n=t*s-Math.PI/2,o=t%7-3,h=Math.sin(t*1.37)*58;return{x:Math.cos(n)*e,y:Math.sin(n)*e*.58+Math.cos(t*.71)*32,z:o*48+h}}function d(t,a,c={}){const s=c.centerX??x.x,r=c.centerY??x.y,e=c.perspective??g,n=a.yaw??0,o=(a.pitch??0)*Math.PI/180,h=Math.cos(n),i=Math.sin(n),p=Math.cos(o),u=Math.sin(o),m=t.x*h+t.z*i,l=-t.x*i+t.z*h,P=t.y*p-l*u,M=t.y*u+l*p,y=z(e/(e-M),.62,1.42);return{x:s+m*y,y:r+P*y,z:M,depth:z(.72+(M+260)/520*.48,.62,1.28),scale:y}}function w(t,a,c=1){const s=Math.max(c,.2);return{x:t.x+a.x/s,y:t.y+a.y/s,z:t.z}}function z(t,a,c){return Math.min(c,Math.max(a,t))}export{I as M,w as a,T as e,d as p};
