var Jt=Object.defineProperty;var Kt=(K,_,F)=>_ in K?Jt(K,_,{enumerable:!0,configurable:!0,writable:!0,value:F}):K[_]=F;var b=(K,_,F)=>Kt(K,typeof _!="symbol"?_+"":_,F);import{q as vt,M as Zt,j as yt,l as Qt,w as wt,o as y,H as P,_ as bt,Q as es,R as ie,g as k,k as ts,D as r,F as B,O as ge,G as ne,X as $,z as I,d as ut,I as qe,J as ze,E as g,K as Ee,S as G,$ as ct,U as ae,L as Re,f as X,N as ve}from"./_plugin-vue_export-helper-ByPV5UX7.js";import{c as ue,a as ss,h as Ce,U as os,v as rs,b as Ne,w as is,x as ns}from"./graph-B9uVLOQt.js";import{f as as}from"./product-DhEq5BOF.js";import{r as je}from"./mediaUrl-C7wWYEHx.js";import{W as ls,e as us,a as cs,F as ds,c as J,f as ps,L as hs,V as S,M as We,g as dt,P as pt,C as le,b as He,D as ht,h as D,i as ms,T as fs,I as mt,j as ye}from"./three.module-aHyJ-PPJ.js";import{E as gs,R as vs,a as ft,B as ys,S as Ge,b as ws}from"./index-DVH7Xudy.js";import{I as bs}from"./image-plus-BNEMML1e.js";import{P as Ps}from"./App.vue_vue_type_script_setup_true_lang-CFvGRiMF.js";/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xs=ue("ListMusicIcon",[["path",{d:"M21 15V6",key:"h1cx4g"}],["path",{d:"M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",key:"8saifv"}],["path",{d:"M12 12H3",key:"18klou"}],["path",{d:"M16 6H3",key:"1wxfjs"}],["path",{d:"M12 18H3",key:"11ftsu"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gt=ue("LockKeyholeIcon",[["circle",{cx:"12",cy:"16",r:"1",key:"1au0dj"}],["rect",{x:"3",y:"10",width:"18",height:"12",rx:"2",key:"6s8ecr"}],["path",{d:"M7 10V7a5 5 0 0 1 10 0v3",key:"1pqi11"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ks=ue("PauseIcon",[["rect",{x:"14",y:"4",width:"4",height:"16",rx:"1",key:"zuxfzm"}],["rect",{x:"6",y:"4",width:"4",height:"16",rx:"1",key:"1okwgv"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ss=ue("PlayIcon",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ms=ue("SaveIcon",[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ls=ue("SkipBackIcon",[["polygon",{points:"19 20 9 12 19 4 19 20",key:"o2sva"}],["line",{x1:"5",x2:"5",y1:"19",y2:"5",key:"1ocqjk"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fs=ue("SkipForwardIcon",[["polygon",{points:"5 4 15 12 5 20 5 4",key:"16p6eg"}],["line",{x1:"19",x2:"19",y1:"5",y2:"19",key:"futhcm"}]]),As=`
  uniform float uLanes;
  uniform vec3 uBrokenLinesColor;
  uniform vec3 uShoulderLinesColor;
  uniform float uShoulderLinesWidthPercentage;
  uniform float uBrokenLinesWidthPercentage;
  uniform float uBrokenLinesLengthPercentage;
`,_s=`
  uv.y = mod(uv.y + uTime * 0.05, 1.);
  float laneWidth = 1.0 / uLanes;
  float brokenLineWidth = laneWidth * uBrokenLinesWidthPercentage;
  float laneEmptySpace = 1. - uBrokenLinesLengthPercentage;
  float brokenLines = step(1.0 - brokenLineWidth, fract(uv.x * 2.0)) * step(laneEmptySpace, fract(uv.y * 10.0));
  float sideLines = step(1.0 - brokenLineWidth, fract((uv.x - laneWidth * (uLanes - 1.0)) * 2.0)) + step(brokenLineWidth, uv.x);
  brokenLines = mix(brokenLines, sideLines, uv.x);
  color += brokenLines * uBrokenLinesColor;
  color += sideLines * uShoulderLinesColor;
`,Cs=vt({__name:"Hyperspeed",props:{effectOptions:{default:()=>({})}},setup(K){const _=K,F=Zt("hyperspeedContainer");let C=null;function q(c){return Math.sin(c)*.5+.5}const f={uFreq:{value:new S(3,6,10)},uAmp:{value:new S(30,30,20)}},v={uFreq:{value:new J(5,2)},uAmp:{value:new J(25,15)}},M={uFreq:{value:new J(2,3)},uAmp:{value:new J(35,10)}},ce={uFreq:{value:new dt(4,8,8,1)},uAmp:{value:new dt(25,5,10,10)}},de={uFreq:{value:new J(4,8)},uAmp:{value:new J(10,20)},uPowY:{value:new J(20,2)}},z={mountainDistortion:{uniforms:f,getDistortion:`
      uniform vec3 uAmp;
      uniform vec3 uFreq;
      #define PI 3.14159265358979
      float nsin(float val){ return sin(val) * 0.5 + 0.5; }
      vec3 getDistortion(float progress){
        float movementProgressFix = 0.02;
        return vec3(
          cos(progress * PI * uFreq.x + uTime) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + uTime) * uAmp.x,
          nsin(progress * PI * uFreq.y + uTime) * uAmp.y - nsin(movementProgressFix * PI * uFreq.y + uTime) * uAmp.y,
          nsin(progress * PI * uFreq.z + uTime) * uAmp.z - nsin(movementProgressFix * PI * uFreq.z + uTime) * uAmp.z
        );
      }
    `,getJS:(c,s)=>{const n=f.uFreq.value,l=f.uAmp.value;return new S(Math.cos(c*Math.PI*n.x+s)*l.x-Math.cos(.02*Math.PI*n.x+s)*l.x,q(c*Math.PI*n.y+s)*l.y-q(.02*Math.PI*n.y+s)*l.y,q(c*Math.PI*n.z+s)*l.z-q(.02*Math.PI*n.z+s)*l.z).multiply(new S(2,2,2)).add(new S(0,0,-5))}},xyDistortion:{uniforms:v,getDistortion:`
      uniform vec2 uFreq;
      uniform vec2 uAmp;
      #define PI 3.14159265358979
      vec3 getDistortion(float progress){
        float movementProgressFix = 0.02;
        return vec3(
          cos(progress * PI * uFreq.x + uTime) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + uTime) * uAmp.x,
          sin(progress * PI * uFreq.y + PI/2. + uTime) * uAmp.y - sin(movementProgressFix * PI * uFreq.y + PI/2. + uTime) * uAmp.y,
          0.
        );
      }
    `,getJS:(c,s)=>{const n=v.uFreq.value,l=v.uAmp.value;return new S(Math.cos(c*Math.PI*n.x+s)*l.x-Math.cos(.02*Math.PI*n.x+s)*l.x,Math.sin(c*Math.PI*n.y+s+Math.PI/2)*l.y-Math.sin(.02*Math.PI*n.y+s+Math.PI/2)*l.y,0).multiply(new S(2,.4,1)).add(new S(0,0,-3))}},LongRaceDistortion:{uniforms:M,getDistortion:`
      uniform vec2 uFreq;
      uniform vec2 uAmp;
      #define PI 3.14159265358979
      vec3 getDistortion(float progress){
        float camProgress = 0.0125;
        return vec3(
          sin(progress * PI * uFreq.x + uTime) * uAmp.x - sin(camProgress * PI * uFreq.x + uTime) * uAmp.x,
          sin(progress * PI * uFreq.y + uTime) * uAmp.y - sin(camProgress * PI * uFreq.y + uTime) * uAmp.y,
          0.
        );
      }
    `,getJS:(c,s)=>{const n=M.uFreq.value,l=M.uAmp.value;return new S(Math.sin(c*Math.PI*n.x+s)*l.x-Math.sin(.0125*Math.PI*n.x+s)*l.x,Math.sin(c*Math.PI*n.y+s)*l.y-Math.sin(.0125*Math.PI*n.y+s)*l.y,0).multiply(new S(1,1,0)).add(new S(0,0,-5))}},turbulentDistortion:{uniforms:ce,getDistortion:`
      uniform vec4 uFreq;
      uniform vec4 uAmp;
      float nsin(float val){ return sin(val) * 0.5 + 0.5; }
      #define PI 3.14159265358979
      float getDistortionX(float progress){
        return (
          cos(PI * progress * uFreq.r + uTime) * uAmp.r +
          pow(cos(PI * progress * uFreq.g + uTime * (uFreq.g / uFreq.r)), 2.) * uAmp.g
        );
      }
      float getDistortionY(float progress){
        return (
          -nsin(PI * progress * uFreq.b + uTime) * uAmp.b +
          -pow(nsin(PI * progress * uFreq.a + uTime / (uFreq.b / uFreq.a)), 5.) * uAmp.a
        );
      }
      vec3 getDistortion(float progress){
        return vec3(
          getDistortionX(progress) - getDistortionX(0.0125),
          getDistortionY(progress) - getDistortionY(0.0125),
          0.
        );
      }
    `,getJS:(c,s)=>{const o=ce.uFreq.value,n=ce.uAmp.value,l=w=>Math.cos(Math.PI*w*o.x+s)*n.x+Math.pow(Math.cos(Math.PI*w*o.y+s*(o.y/o.x)),2)*n.y,p=w=>-q(Math.PI*w*o.z+s)*n.z-Math.pow(q(Math.PI*w*o.w+s/(o.z/o.w)),5)*n.w;return new S(l(c)-l(c+.007),p(c)-p(c+.007),0).multiply(new S(-2,-5,0)).add(new S(0,0,-10))}},turbulentDistortionStill:{uniforms:ce,getDistortion:`
      uniform vec4 uFreq;
      uniform vec4 uAmp;
      float nsin(float val){ return sin(val) * 0.5 + 0.5; }
      #define PI 3.14159265358979
      float getDistortionX(float progress){
        return (
          cos(PI * progress * uFreq.r) * uAmp.r +
          pow(cos(PI * progress * uFreq.g * (uFreq.g / uFreq.r)), 2.) * uAmp.g
        );
      }
      float getDistortionY(float progress){
        return (
          -nsin(PI * progress * uFreq.b) * uAmp.b +
          -pow(nsin(PI * progress * uFreq.a / (uFreq.b / uFreq.a)), 5.) * uAmp.a
        );
      }
      vec3 getDistortion(float progress){
        return vec3(
          getDistortionX(progress) - getDistortionX(0.02),
          getDistortionY(progress) - getDistortionY(0.02),
          0.
        );
      }
    `},deepDistortionStill:{uniforms:de,getDistortion:`
      uniform vec2 uFreq;
      uniform vec2 uAmp;
      uniform vec2 uPowY;
      #define PI 3.14159265358979
      float getDistortionX(float progress){
        return sin(progress * PI * uFreq.x) * uAmp.x * 2.;
      }
      float getDistortionY(float progress){
        return pow(abs(progress * uPowY.x), uPowY.y) + sin(progress * PI * uFreq.y) * uAmp.y;
      }
      vec3 getDistortion(float progress){
        return vec3(
          getDistortionX(progress) - getDistortionX(0.02),
          getDistortionY(progress) - getDistortionY(0.05),
          0.
        );
      }
    `},deepDistortion:{uniforms:de,getDistortion:`
      uniform vec2 uFreq;
      uniform vec2 uAmp;
      uniform vec2 uPowY;
      #define PI 3.14159265358979
      float getDistortionX(float progress){
        return sin(progress * PI * uFreq.x + uTime) * uAmp.x;
      }
      float getDistortionY(float progress){
        return pow(abs(progress * uPowY.x), uPowY.y) + sin(progress * PI * uFreq.y + uTime) * uAmp.y;
      }
      vec3 getDistortion(float progress){
        return vec3(
          getDistortionX(progress) - getDistortionX(0.02),
          getDistortionY(progress) - getDistortionY(0.02),
          0.
        );
      }
    `,getJS:(c,s)=>{const o=de.uFreq.value,n=de.uAmp.value,l=de.uPowY.value,p=x=>Math.sin(x*Math.PI*o.x+s)*n.x,m=x=>Math.pow(x*l.x,l.y)+Math.sin(x*Math.PI*o.y+s)*n.y;return new S(p(c)-p(c+.01),m(c)-m(c+.01),0).multiply(new S(-2,-4,0)).add(new S(0,0,-10))}}},we={onSpeedUp:()=>{},onSlowDown:()=>{},distortion:"turbulentDistortion",length:400,roadWidth:10,islandWidth:2,lanesPerRoad:4,fov:90,fovSpeedUp:150,speedUp:2,carLightsFade:.4,totalSideLightSticks:20,lightPairsPerRoadWay:40,shoulderLinesWidthPercentage:.05,brokenLinesWidthPercentage:.1,brokenLinesLengthPercentage:.5,lightStickWidth:[.12,.5],lightStickHeight:[1.3,1.7],movingAwaySpeed:[60,80],movingCloserSpeed:[-120,-160],carLightsLength:[400*.03,400*.2],carLightsRadius:[.05,.14],carWidthPercentage:[.3,.5],carShiftX:[-.8,.8],carFloorSeparation:[0,5],colors:{roadColor:526344,islandColor:657930,background:0,shoulderLines:16777215,brokenLines:16777215,leftCars:[14177983,6770850,12732332],rightCars:[242627,941733,3294549],sticks:242627}};function E(c){return Array.isArray(c)?Math.random()*(c[1]-c[0])+c[0]:Math.random()*c}function be(c){return Array.isArray(c)?c[Math.floor(Math.random()*c.length)]:c}function Ie(c,s,o=.1,n=.001){let l=(s-c)*o;return Math.abs(l)<n&&(l=s-c),l}const Pe=`
  #define USE_FOG;
  ${D.fog_pars_fragment}
  varying vec3 vColor;
  varying vec2 vUv;
  uniform vec2 uFade;
  void main() {
    vec3 color = vec3(vColor);
    float alpha = smoothstep(uFade.x, uFade.y, vUv.x);
    gl_FragColor = vec4(color, alpha);
    if (gl_FragColor.a < 0.0001) discard;
    ${D.fog_fragment}
  }
`,xe=`
  #define USE_FOG;
  ${D.fog_pars_vertex}
  attribute vec3 aOffset;
  attribute vec3 aMetrics;
  attribute vec3 aColor;
  uniform float uTravelLength;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vColor;
  #include <getDistortion_vertex>
  void main() {
    vec3 transformed = position.xyz;
    float radius = aMetrics.r;
    float myLength = aMetrics.g;
    float speed = aMetrics.b;
    transformed.xy *= radius;
    transformed.z *= myLength;
    transformed.z += myLength - mod(uTime * speed + aOffset.z, uTravelLength);
    transformed.xy += aOffset.xy;
    float progress = abs(transformed.z / uTravelLength);
    transformed.xyz += getDistortion(progress);
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
    gl_Position = projectionMatrix * mvPosition;
    vUv = uv;
    vColor = aColor;
    ${D.fog_vertex}
  }
`;class se{constructor(s,o,n,l,p){b(this,"mesh");this.webgl=s,this.options=o,this.colors=n,this.speed=l,this.fade=p}init(){const s=new ms(new S(0,0,0),new S(0,0,-1)),o=new fs(s,40,1,8,!1),n=new mt;for(const h in o.attributes)n.setAttribute(h,o.attributes[h]);o.index&&n.setIndex(o.index),n.instanceCount=this.options.lightPairsPerRoadWay*2;const l=this.options.roadWidth/this.options.lanesPerRoad,p=[],m=[],w=[],x=Array.isArray(this.colors)?this.colors.map(h=>new le(h)):[new le(this.colors)];for(let h=0;h<this.options.lightPairsPerRoadWay;h+=1){const V=E(this.options.carLightsRadius),ee=E(this.options.carLightsLength),Y=E(this.speed),Ue=h%this.options.lanesPerRoad,Se=E(this.options.carWidthPercentage)*l,Me=E(this.options.carShiftX)*l,te=Ue*l-this.options.roadWidth/2+l/2+Me,re=E(this.options.carFloorSeparation)+V*1.3,O=-E(this.options.length),N=be(x);p.push(te-Se/2,re,O,te+Se/2,re,O),m.push(V,ee,Y,V,ee,Y),w.push(N.r,N.g,N.b,N.r,N.g,N.b)}n.setAttribute("aOffset",new ye(new Float32Array(p),3,!1)),n.setAttribute("aMetrics",new ye(new Float32Array(m),3,!1)),n.setAttribute("aColor",new ye(new Float32Array(w),3,!1));const U=new He({fragmentShader:Pe,vertexShader:xe,transparent:!0,uniforms:{uTime:{value:0},uTravelLength:{value:this.options.length},uFade:{value:this.fade},...this.webgl.fogUniforms,...(typeof this.options.distortion=="object"?this.options.distortion.uniforms:{})||{}}});U.onBeforeCompile=h=>{h.vertexShader=h.vertexShader.replace("#include <getDistortion_vertex>",typeof this.options.distortion=="object"?this.options.distortion.getDistortion:"")},this.mesh=new We(n,U),this.mesh.frustumCulled=!1,this.webgl.scene.add(this.mesh)}update(s){this.mesh.material.uniforms.uTime.value=s}}const $e=`
  #define USE_FOG;
  ${D.fog_pars_vertex}
  attribute float aOffset;
  attribute vec3 aColor;
  attribute vec2 aMetrics;
  uniform float uTravelLength;
  uniform float uTime;
  varying vec3 vColor;
  mat4 rotationY(in float angle) {
    return mat4(cos(angle), 0, sin(angle), 0, 0, 1, 0, 0, -sin(angle), 0, cos(angle), 0, 0, 0, 0, 1);
  }
  #include <getDistortion_vertex>
  void main(){
    vec3 transformed = position.xyz;
    float width = aMetrics.x;
    float height = aMetrics.y;
    transformed.xy *= vec2(width, height);
    float time = mod(uTime * 120. + aOffset, uTravelLength);
    transformed = (rotationY(3.14 / 2.) * vec4(transformed, 1.)).xyz;
    transformed.z += -uTravelLength + time;
    float progress = abs(transformed.z / uTravelLength);
    transformed.xyz += getDistortion(progress);
    transformed.y += height / 2.;
    transformed.x += -width / 2.;
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
    gl_Position = projectionMatrix * mvPosition;
    vColor = aColor;
    ${D.fog_vertex}
  }
`,Oe=`
  #define USE_FOG;
  ${D.fog_pars_fragment}
  varying vec3 vColor;
  void main(){
    gl_FragColor = vec4(vec3(vColor), 1.);
    ${D.fog_fragment}
  }
`;class R{constructor(s,o){b(this,"mesh");this.webgl=s,this.options=o}init(){const s=new pt(1,1),o=new mt;for(const h in s.attributes)o.setAttribute(h,s.attributes[h]);s.index&&o.setIndex(s.index),o.instanceCount=this.options.totalSideLightSticks;const n=this.options.length/(this.options.totalSideLightSticks-1),l=[],p=[],m=[],w=this.options.colors.sticks,x=Array.isArray(w)?w.map(h=>new le(h)):[new le(w)];for(let h=0;h<this.options.totalSideLightSticks;h+=1){const V=E(this.options.lightStickWidth),ee=E(this.options.lightStickHeight),Y=be(x);l.push((h-1)*n*2+n*Math.random()),p.push(Y.r,Y.g,Y.b),m.push(V,ee)}o.setAttribute("aOffset",new ye(new Float32Array(l),1,!1)),o.setAttribute("aColor",new ye(new Float32Array(p),3,!1)),o.setAttribute("aMetrics",new ye(new Float32Array(m),2,!1));const U=new He({fragmentShader:Oe,vertexShader:$e,side:ht,uniforms:{uTravelLength:{value:this.options.length},uTime:{value:0},...this.webgl.fogUniforms,...(typeof this.options.distortion=="object"?this.options.distortion.uniforms:{})||{}}});U.onBeforeCompile=h=>{h.vertexShader=h.vertexShader.replace("#include <getDistortion_vertex>",typeof this.options.distortion=="object"?this.options.distortion.getDistortion:"")},this.mesh=new We(o,U),this.mesh.frustumCulled=!1,this.webgl.scene.add(this.mesh)}update(s){this.mesh.material.uniforms.uTime.value=s}}const Z=`
  #define USE_FOG;
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uTime;
  #include <roadMarkings_vars>
  ${D.fog_pars_fragment}
  void main() {
    vec2 uv = vUv;
    vec3 color = vec3(uColor);
    #include <roadMarkings_fragment>
    gl_FragColor = vec4(color, 1.);
    ${D.fog_fragment}
  }
`,oe=Z.replace("#include <roadMarkings_fragment>","").replace("#include <roadMarkings_vars>",""),Q=Z.replace("#include <roadMarkings_fragment>",_s).replace("#include <roadMarkings_vars>",As),pe=`
  #define USE_FOG;
  uniform float uTime;
  ${D.fog_pars_vertex}
  uniform float uTravelLength;
  varying vec2 vUv;
  #include <getDistortion_vertex>
  void main() {
    vec3 transformed = position.xyz;
    vec3 distortion = getDistortion((transformed.y + uTravelLength / 2.) / uTravelLength);
    transformed.x += distortion.x;
    transformed.z += distortion.y;
    transformed.y += -1. * distortion.z;
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
    gl_Position = projectionMatrix * mvPosition;
    vUv = uv;
    ${D.fog_vertex}
  }
`;class ke{constructor(s,o){b(this,"uTime",{value:0});b(this,"leftRoadWay");b(this,"rightRoadWay");b(this,"island");this.webgl=s,this.options=o}createPlane(s,o){const n=new pt(o?this.options.roadWidth:this.options.islandWidth,this.options.length,20,100),l={uTravelLength:{value:this.options.length},uColor:{value:new le(o?this.options.colors.roadColor:this.options.colors.islandColor)},uTime:this.uTime,...o?{uLanes:{value:this.options.lanesPerRoad},uBrokenLinesColor:{value:new le(this.options.colors.brokenLines)},uShoulderLinesColor:{value:new le(this.options.colors.shoulderLines)},uShoulderLinesWidthPercentage:{value:this.options.shoulderLinesWidthPercentage},uBrokenLinesLengthPercentage:{value:this.options.brokenLinesLengthPercentage},uBrokenLinesWidthPercentage:{value:this.options.brokenLinesWidthPercentage}}:{},...this.webgl.fogUniforms,...(typeof this.options.distortion=="object"?this.options.distortion.uniforms:{})||{}},p=new He({fragmentShader:o?Q:oe,vertexShader:pe,side:ht,uniforms:l});p.onBeforeCompile=w=>{w.vertexShader=w.vertexShader.replace("#include <getDistortion_vertex>",typeof this.options.distortion=="object"?this.options.distortion.getDistortion:"")};const m=new We(n,p);return m.rotation.x=-Math.PI/2,m.position.z=-this.options.length/2,m.position.x+=(this.options.islandWidth/2+this.options.roadWidth/2)*s,this.webgl.scene.add(m),m}init(){this.leftRoadWay=this.createPlane(-1,!0),this.rightRoadWay=this.createPlane(1,!0),this.island=this.createPlane(0,!1)}update(s){this.uTime.value=s}}function L(c,s){const o=c.domElement,n=o.parentElement;if(!n)return!1;const l=n.clientWidth,p=n.clientHeight,m=o.width!==l||o.height!==p;return m&&s(l,p,!1),m}class A{constructor(s,o){b(this,"renderer");b(this,"composer");b(this,"camera");b(this,"scene");b(this,"clock",new ps);b(this,"disposed",!1);b(this,"road");b(this,"leftCarLights");b(this,"rightCarLights");b(this,"leftSticks");b(this,"fogUniforms");b(this,"fovTarget");b(this,"speedUpTarget",0);b(this,"speedUp",0);b(this,"timeOffset",0);b(this,"resizeObserver");this.container=s,this.options=o,this.renderer=new ls({antialias:!1,alpha:!0}),this.renderer.setSize(s.offsetWidth,s.offsetHeight,!1),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)),this.renderer.domElement.style.display="block",this.renderer.domElement.style.width="100%",this.renderer.domElement.style.height="100%",s.appendChild(this.renderer.domElement),this.composer=new gs(this.renderer),this.camera=new us(o.fov,s.offsetWidth/s.offsetHeight,.1,1e4),this.camera.position.set(0,8,-5),this.scene=new cs,this.scene.background=null;const n=new ds(o.colors.background,o.length*.2,o.length*500);this.scene.fog=n,this.fogUniforms={fogColor:{value:n.color},fogNear:{value:n.near},fogFar:{value:n.far}},this.road=new ke(this,o),this.leftCarLights=new se(this,o,o.colors.leftCars,o.movingAwaySpeed,new J(0,1-o.carLightsFade)),this.rightCarLights=new se(this,o,o.colors.rightCars,o.movingCloserSpeed,new J(1,o.carLightsFade)),this.leftSticks=new R(this,o),this.fovTarget=o.fov,this.tick=this.tick.bind(this),this.setSize=this.setSize.bind(this),this.onMouseDown=this.onMouseDown.bind(this),this.onMouseUp=this.onMouseUp.bind(this),this.onWindowResize=this.onWindowResize.bind(this),typeof ResizeObserver<"u"?(this.resizeObserver=new ResizeObserver(this.onWindowResize),this.resizeObserver.observe(s)):window.addEventListener("resize",this.onWindowResize)}onWindowResize(){const s=this.container.offsetWidth,o=this.container.offsetHeight;this.renderer.setSize(s,o,!1),this.camera.aspect=s/o,this.camera.updateProjectionMatrix(),this.composer.setSize(s,o)}initPasses(){const s=new vs(this.scene,this.camera),o=new ft(this.camera,new ys({luminanceThreshold:.2,luminanceSmoothing:0,resolutionScale:1})),n=new ft(this.camera,new Ge({preset:ws.MEDIUM}));s.renderToScreen=!1,o.renderToScreen=!1,n.renderToScreen=!0,this.composer.addPass(s),this.composer.addPass(o),this.composer.addPass(n)}loadAssets(){return new Promise(s=>{const o=new hs(s),n=new Image,l=new Image;n.addEventListener("load",()=>o.itemEnd("smaa-search")),l.addEventListener("load",()=>o.itemEnd("smaa-area")),o.itemStart("smaa-search"),o.itemStart("smaa-area"),n.src=Ge.searchImageDataURL,l.src=Ge.areaImageDataURL})}init(){this.initPasses(),this.road.init(),this.leftCarLights.init(),this.leftCarLights.mesh.position.setX(-this.options.roadWidth/2-this.options.islandWidth/2),this.rightCarLights.init(),this.rightCarLights.mesh.position.setX(this.options.roadWidth/2+this.options.islandWidth/2),this.leftSticks.init(),this.leftSticks.mesh.position.setX(-(this.options.roadWidth+this.options.islandWidth/2)),this.container.addEventListener("mousedown",this.onMouseDown),this.container.addEventListener("mouseup",this.onMouseUp),this.container.addEventListener("mouseout",this.onMouseUp),this.tick()}onMouseDown(s){var o,n;(n=(o=this.options).onSpeedUp)==null||n.call(o,s),this.fovTarget=this.options.fovSpeedUp,this.speedUpTarget=this.options.speedUp}onMouseUp(s){var o,n;(n=(o=this.options).onSlowDown)==null||n.call(o,s),this.fovTarget=this.options.fov,this.speedUpTarget=0}update(s){const o=Math.exp(-(-60*Math.log2(.9))*s);this.speedUp+=Ie(this.speedUp,this.speedUpTarget,o,1e-5),this.timeOffset+=this.speedUp*s;const n=this.clock.elapsedTime+this.timeOffset;this.rightCarLights.update(n),this.leftCarLights.update(n),this.leftSticks.update(n),this.road.update(n);let l=!1;const p=Ie(this.camera.fov,this.fovTarget,o);if(p!==0&&(this.camera.fov+=p*s*6,l=!0),typeof this.options.distortion=="object"&&this.options.distortion.getJS){const m=this.options.distortion.getJS(.025,n);this.camera.lookAt(new S(this.camera.position.x+m.x,this.camera.position.y+m.y,this.camera.position.z+m.z)),l=!0}l&&this.camera.updateProjectionMatrix()}dispose(){this.disposed=!0,this.resizeObserver?this.resizeObserver.disconnect():window.removeEventListener("resize",this.onWindowResize),this.container.removeEventListener("mousedown",this.onMouseDown),this.container.removeEventListener("mouseup",this.onMouseUp),this.container.removeEventListener("mouseout",this.onMouseUp),this.renderer.dispose(),this.composer.dispose(),this.scene.traverse(s=>{var o;s instanceof We&&((o=s.geometry)==null||o.dispose(),(Array.isArray(s.material)?s.material:[s.material]).forEach(l=>l.dispose()))}),this.scene.clear()}setSize(s,o,n){this.composer.setSize(s,o,n)}tick(){if(this.disposed)return;L(this.renderer,this.setSize)&&(this.camera.aspect=this.container.offsetWidth/this.container.offsetHeight,this.camera.updateProjectionMatrix());const s=this.clock.getDelta();this.composer.render(s),this.update(s),requestAnimationFrame(this.tick)}}async function W(){var n;if(C){C.dispose();const l=F.value;for(;l!=null&&l.firstChild;)l.removeChild(l.firstChild)}const c=F.value;if(!c)return;const s={...we,..._.effectOptions,colors:{...we.colors,...(n=_.effectOptions)==null?void 0:n.colors}};typeof s.distortion=="string"&&(s.distortion=z[s.distortion]);const o=new A(c,s);C=o,await o.loadAssets(),C===o&&o.init()}return yt(()=>{W()}),Qt(()=>{C==null||C.dispose(),C=null}),wt(()=>_.effectOptions,()=>{W()},{deep:!0}),(c,s)=>(y(),P("div",{ref_key:"hyperspeedContainer",ref:F,class:"hyperspeed-container"},null,512))}}),Is=bt(Cs,[["__scopeId","data-v-94873225"]]),Us={class:"profile-page"},Ts={class:"profile-hyperspeed-background","aria-hidden":"true"},Ds={class:"profile-sidebar"},qs={class:"visualizer-ring"},zs={class:"controls billboard"},Es=["aria-label"],Rs=["src"],Ws={key:1,class:"avatar-letter"},$s={class:"billboard"},Os={class:"billboard"},Bs={class:"progress-shell billboard"},Xs={class:"progress-time"},Vs=["aria-valuemax","aria-valuenow"],Ys=["aria-expanded"],Ns=["aria-expanded"],js=["data-index","onClick"],Hs={id:"profileContent"},Gs={class:"profile-panel-title billboard"},Js={class:"profile-avatar-field avatar-upload-control billboard"},Ks=["disabled"],Zs={class:"profile-form-grid"},Qs={class:"billboard"},eo={class:"billboard"},to={class:"billboard"},so={class:"billboard"},oo={key:0,class:"inline-error billboard"},ro={key:1,class:"inline-success billboard"},io=["disabled"],no={class:"profile-panel-title billboard"},ao={class:"profile-form-grid"},lo={class:"billboard"},uo={class:"billboard"},co={class:"billboard"},po={key:0,class:"inline-error billboard"},ho={key:1,class:"inline-success billboard"},mo=["disabled"],fo={class:"glass-panel profile-panel orders-panel"},go={class:"profile-panel-title billboard"},vo={key:0,class:"billboard order-empty"},yo={key:1,class:"billboard order-empty"},wo={key:2,class:"billboard order-empty"},bo={key:3,class:"order-list"},Po={class:"order-header"},xo={class:"order-status"},ko={class:"order-product"},So=["src","alt"],Mo={key:1,class:"order-fallback"},Lo={class:"order-meta"},Fo=["aria-hidden"],Ao=["data-index","aria-selected","onMouseenter","onClick"],_o={class:"song-title"},Co={class:"song-meta"},Io=640,Uo=.82,To=vt({__name:"ProfilePage",setup(K){const _=es(),F=ie({active:!1}),C=ie({active:!1}),q=k(!1),f=ie({profileError:"",profileSuccess:"",passwordError:"",passwordSuccess:""}),v=ie({nickname:"",realName:"",phone:"",email:"",avatarUrl:""}),M=ie({oldPassword:"",newPassword:"",confirmPassword:""}),ce={distortion:"turbulentDistortion",length:520,roadWidth:11,islandWidth:2.2,lanesPerRoad:4,fov:92,fovSpeedUp:148,speedUp:2.25,carLightsFade:.42,totalSideLightSticks:26,lightPairsPerRoadWay:46,shoulderLinesWidthPercentage:.05,brokenLinesWidthPercentage:.1,brokenLinesLengthPercentage:.55,lightStickWidth:[.12,.42],lightStickHeight:[1.4,2.2],movingAwaySpeed:[66,92],movingCloserSpeed:[-150,-196],carLightsLength:[18,120],carLightsRadius:[.045,.13],carWidthPercentage:[.28,.48],carShiftX:[-.75,.75],carFloorSeparation:[0,5],colors:{roadColor:197638,islandColor:395533,background:132103,shoulderLines:8251903,brokenLines:16244653,leftCars:[14177983,16729943,16036927],rightCars:[242627,941733,2621284],sticks:[242627,16036927,16729943]}},z=ie([{id:30352891,title:"牵丝戏",artist:"银临 / Aki阿杰",duration:239,coverUrl:"https://p1.music.126.net/Nd86SOcyCxU5Qu7jdZn_MQ==/7725168696876736.jpg?param=360y360"},{id:1454730043,title:"赤伶",artist:"李玉刚",duration:300,coverUrl:"https://p1.music.126.net/0el5yaTEo3KjeJjL3ZXxmg==/109951165054951989.jpg?param=360y360"},{id:1911377814,title:"鸳鸯债",artist:"Uri / 喵酱",duration:147,coverUrl:"https://p1.music.126.net/ZrWgJqLD75XvALUIT7E9TQ==/109951166924195228.jpg?param=360y360"},{id:1297802566,title:"十年人间",artist:"李常超",duration:277,coverUrl:"https://p1.music.126.net/TdqG8yFWSZgQqH2K235MgA==/109951163434990771.jpg?param=360y360"},{id:2005252136,title:"相思遥",artist:"魏玉慧",duration:193,coverUrl:"https://p1.music.126.net/e1Q5ANvBtL3jLgPyQjc-NA==/109951168129929242.jpg?param=360y360"},{id:1479526505,title:"虞兮叹",artist:"闻人听書_",duration:210,coverUrl:"https://p1.music.126.net/6gdwWjPXUkyTx4CuuSxkIg==/109951165319864977.jpg?param=360y360"},{id:1913206466,title:"西厢寻他",artist:"伯爵Johnny / 唐伯虎Annie",duration:224,coverUrl:"https://p1.music.126.net/0emB6yNDS1d-SyIPC8nWIw==/109951166953218034.jpg?param=360y360"},{id:2625746775,title:"壁上观",artist:"龚琳娜",duration:223,coverUrl:"https://p1.music.126.net/eZEjSm4b1iLIRpIeC9-dBA==/109951169950184961.jpg?param=360y360"},{id:1451720450,title:"一笑江湖",artist:"闻人听書_",duration:209,coverUrl:"https://p1.music.126.net/SAK07yVLa64lR7HBGKmw7w==/109951165024026423.jpg?param=360y360"},{id:30500857,title:"青丝",artist:"时光胶囊",duration:293,coverUrl:"https://p1.music.126.net/szRyfZ3Dgq6OTe-b4VYtyg==/7775746231888644.jpg?param=360y360"}].map(e=>({...e,audioUrl:`https://music.163.com/song/media/outer/url?id=${e.id}.mp3`,lyrics:[{time:0,text:e.title},{time:Math.round(e.duration*.18),text:e.artist},{time:Math.round(e.duration*.38),text:"网易云歌单 · 国风戏腔"},{time:Math.round(e.duration*.58),text:"让旋律在个人档案里发光"},{time:Math.round(e.duration*.78),text:"非遗记忆，继续向前"}]}))),we=X(()=>{var e,t;return((e=Ce.value)==null?void 0:e.nickname)||((t=Ce.value)==null?void 0:t.username)||"未登录用户"}),E=X(()=>we.value.slice(0,1).toUpperCase()),be=X(()=>je(v.avatarUrl)),Ie=X(()=>{var e;switch((e=Ce.value)==null?void 0:e.userType){case"SUPER_ADMIN":return"超级管理员";case"INHERITOR":return"传承人";case"NORMAL":return"普通用户";default:return"未登录"}}),Pe=k([]),xe=k(!1),se=k("");async function $e(){xe.value=!0,se.value="";try{const e=await as({direction:"BUYING",page:1,size:20});Pe.value=e.items}catch(e){se.value=e instanceof Error?e.message:"订单加载失败"}finally{xe.value=!1}}const Oe=k(null),R=k(null),Z=k(null),oe=k(null),Q=k(null),pe=Array.from({length:50},(e,t)=>t),ke=k(pe.map(()=>10)),L=k(0),A=k(0),W=k(!1),c=k(!1),s=k(0),o=k(!1),n=k(!1),l=k(!1),p=k(!1),m=k(0),w=k(0),x=ie({stretch:1,squash:1,thumbX:0});let U=0,h=0,V=0,ee=0,Y=0,Ue=0,Se=0,Me=0,te=0,re=0,O=null,N=0;const Be=new Map,Le=X(()=>z[L.value]),Pt=X(()=>Ot()),xt=X(()=>{const e=he();return`${Math.max(0,Math.min(s.value/e,1))*100}%`}),kt=X(()=>({"--rx":`${m.value.toFixed(3)}deg`,"--ry":`${w.value.toFixed(3)}deg`})),St=X(()=>({transform:`rotateX(${m.value.toFixed(3)}deg) rotateY(${w.value.toFixed(3)}deg)`})),Mt=X(()=>({"--progress":xt.value,"--stretch":x.stretch.toFixed(3),"--squash":x.squash.toFixed(3),"--thumb-x":`${x.thumbX.toFixed(1)}px`}));wt(Ce,e=>{if(!e){ss.token||_.push({path:"/login",query:{redirect:"/profile"}});return}v.nickname=e.nickname||"",v.realName=e.realName||"",v.phone=e.phone||"",v.email=e.email||"",v.avatarUrl=je(e.avatarUrl)},{immediate:!0}),yt(()=>{Ze(),et(),at(L.value),$e(),window.addEventListener("pointermove",Je),window.addEventListener("pointerup",Ke),window.addEventListener("resize",lt)}),ts(()=>{cancelAnimationFrame(Se),cancelAnimationFrame(Me),cancelAnimationFrame(te),cancelAnimationFrame(re),O&&clearTimeout(O),window.removeEventListener("pointermove",Je),window.removeEventListener("pointerup",Ke),window.removeEventListener("resize",lt)});function Lt(e,t,a){return new Promise(i=>{e.toBlob(i,t,a)})}async function Ft(e){if(typeof document>"u"||typeof createImageBitmap>"u")return e;let t=null;try{t=await createImageBitmap(e);const a=Math.min(1,Io/Math.max(t.width,t.height)),i=Math.max(1,Math.round(t.width*a)),u=Math.max(1,Math.round(t.height*a)),d=document.createElement("canvas");d.width=i,d.height=u;const T=d.getContext("2d");if(!T)return e;T.drawImage(t,0,0,i,u);const j=e.type==="image/png"?"image/webp":"image/jpeg",H=await Lt(d,j,Uo);if(!H||H.size>=e.size)return e;const Ye=j==="image/webp"?"webp":"jpg",De=e.name.replace(/\.[^.]+$/,"")||"avatar";return new File([H],`${De}.${Ye}`,{type:j})}catch{return e}finally{t==null||t.close()}}async function At(){F.active=!0,f.profileError="",f.profileSuccess="";try{const e=await rs({nickname:v.nickname,realName:v.realName,phone:v.phone,email:v.email,avatarUrl:v.avatarUrl});Ne(e),f.profileSuccess="个人信息已更新"}catch(e){f.profileError=e instanceof Error?e.message:"个人信息更新失败"}finally{F.active=!1}}async function _t(e){var i;const t=e.target,a=(i=t.files)==null?void 0:i[0];if(a){if(f.profileError="",f.profileSuccess="",!a.type.startsWith("image/")){f.profileError="请选择图片文件作为头像",t.value="";return}q.value=!0;try{const u=await Ft(a),d=await is(u);Ne(d),v.avatarUrl=je(d.user.avatarUrl||d.avatarUrl),f.profileSuccess="头像已上传"}catch(u){f.profileError=u instanceof Error?u.message:"头像上传失败"}finally{q.value=!1,t.value=""}}}async function Ct(){if(f.passwordError="",f.passwordSuccess="",M.newPassword!==M.confirmPassword){f.passwordError="两次输入的新密码不一致";return}C.active=!0;try{const e=await ns({oldPassword:M.oldPassword,newPassword:M.newPassword});Ne(e),M.oldPassword="",M.newPassword="",M.confirmPassword="",f.passwordSuccess="密码已修改"}catch(e){f.passwordError=e instanceof Error?e.message:"密码修改失败"}finally{C.active=!1}}function It(e){return e instanceof Element?!!e.closest('button, input, textarea, select, a, [role="button"], [role="option"], [role="slider"], .song-list, .right-song-menu, .lyrics-container, .avatar-wrapper, .controls, .elastic-progress'):!1}function Ut(e){e.button!==0||It(e.target)||(p.value=!0,Y=e.clientX,Ue=e.clientY,V=U,ee=h)}function Je(e){p.value&&(h=ee+(e.clientX-Y)*.18,U=V-(e.clientY-Ue)*.18)}function Ke(){p.value&&(p.value=!1,V=U,ee=h)}function Ze(){m.value+=(U-m.value)*.14,w.value+=(h-w.value)*.14,Math.abs(U-m.value)<.001&&(m.value=U),Math.abs(h-w.value)<.001&&(w.value=h),Se=requestAnimationFrame(Ze)}function he(e=Le.value){return Math.max((e==null?void 0:e.duration)||1,1)}function Qe(e){const t=Math.max(0,Math.floor(e)),a=Math.floor(t/60),i=String(t%60).padStart(2,"0");return`${a}:${i}`}function et(){const e=R.value,t=Le.value;!e||!t||(!e.src||e.dataset.songId!==String(t.id))&&(e.src=t.audioUrl,e.dataset.songId=String(t.id),e.load())}async function Xe(){et();const e=R.value;if(e)try{await e.play(),Fe(!0)}catch(t){console.warn("Audio play failed:",t),Fe(!1)}}function Fe(e){c.value=e,e?(ot(),Dt()):(cancelAnimationFrame(Me),cancelAnimationFrame(te),ke.value=pe.map(()=>10))}function tt(){const e=R.value;c.value?e==null||e.pause():Xe()}function Tt(){Te(L.value-1)}function st(){Te(L.value+1)}function Te(e){const t=c.value;L.value=(e+z.length)%z.length,A.value=L.value,s.value=0,n.value=!1,O&&clearTimeout(O);const a=R.value;a&&(a.pause(),a.src=z[L.value].audioUrl,a.dataset.songId=String(z[L.value].id)),Ve(!1),at(L.value),ve(()=>{Ae(),fe()}),t?Xe():Fe(!1)}function ot(){if(!c.value)return;const e=performance.now()*.004;ke.value=pe.map((t,a)=>{const i=Math.sin(a*.38+e)*12,u=Math.cos(a*.17+e*1.65)*7,d=Math.sin(e*.9+L.value)*5;return 24+i+u+d}),Me=requestAnimationFrame(ot)}function Dt(){cancelAnimationFrame(te);const e=()=>{var t;c.value&&(s.value=((t=R.value)==null?void 0:t.currentTime)||s.value,Ae(),te=requestAnimationFrame(e))};te=requestAnimationFrame(e)}function qt(e){var i;const t=(i=Z.value)==null?void 0:i.getBoundingClientRect();if(!(t!=null&&t.width))return 0;const a=(e-t.left)/t.width;return Math.max(0,Math.min(a,1))*he()}function me(e,t=!1){s.value=Math.max(0,Math.min(e,he()));const a=R.value;a!=null&&a.src&&(a.currentTime=s.value),Ae(),t&&Xe()}function zt(e){var d;const t=(d=Z.value)==null?void 0:d.getBoundingClientRect();if(!t)return;const a=Math.max(t.left-e,0),i=Math.max(e-t.right,0),u=Math.min(Math.max(a,i),58);x.stretch=1+u/Math.max(t.width,1),x.squash=1.28-Math.min(u/58,1)*.26,x.thumbX=a?-u/2:i?u/2:0}function Et(){cancelAnimationFrame(re);const e=x.stretch,t=x.squash,a=x.thumbX,i=performance.now(),u=420,d=T=>{const j=Math.min((T-i)/u,1),H=1-Math.cos(j*Math.PI*3)*Math.exp(-j*5);x.stretch=e+(1-e)*H,x.squash=t+(1-t)*H,x.thumbX=a+(0-a)*H,j<1&&(re=requestAnimationFrame(d))};re=requestAnimationFrame(d)}function rt(e){e.stopPropagation(),me(qt(e.clientX),!1),zt(e.clientX)}function Rt(e){var t;l.value=!0,(t=Z.value)==null||t.setPointerCapture(e.pointerId),rt(e)}function Wt(e){l.value&&rt(e)}function it(e){var t;l.value&&(e.stopPropagation(),l.value=!1,(t=Z.value)==null||t.releasePointerCapture(e.pointerId),Et())}function $t(e){const t=e.shiftKey?10:5;e.key==="ArrowRight"||e.key==="ArrowUp"?(e.preventDefault(),me(s.value+t,!1)):e.key==="ArrowLeft"||e.key==="ArrowDown"?(e.preventDefault(),me(s.value-t,!1)):e.key==="Home"?(e.preventDefault(),me(0,!1)):e.key==="End"&&(e.preventDefault(),me(he(),!1))}function Ot(){let e=0;return Le.value.lyrics.forEach((t,a)=>{s.value>=t.time&&(e=a)}),e}function Bt(e){return e?e.split(`
`).flatMap(t=>{const a=[...t.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)],i=t.replace(/\[[^\]]+\]/g,"").trim();return!a.length||!i?[]:a.map(u=>({time:Number(u[1])*60+Number(u[2])+Number((u[3]||"0").padEnd(3,"0"))/1e3,text:i}))}).sort((t,a)=>t.time-a.time):[]}function Xt(e){const t=`https://music.163.com/api/song/lyric?id=${e}&lv=1&kv=1&tv=-1`;return[`https://music-api.gdstudio.xyz/api.php?types=lyric&source=netease&id=${e}`,`https://api.allorigins.win/raw?url=${encodeURIComponent(t)}`,`https://api.allorigins.win/get?url=${encodeURIComponent(t)}`,t]}function Vt(e,t=4200){const a=new AbortController,i=window.setTimeout(()=>a.abort(),t);return fetch(e,{cache:"force-cache",signal:a.signal}).finally(()=>window.clearTimeout(i))}async function Yt(e){var t;try{const a=await Vt(e);if(!a.ok)return[];const i=await a.text(),u=JSON.parse(i),d=u!=null&&u.contents?JSON.parse(u.contents):u;return Bt(((t=d==null?void 0:d.lrc)==null?void 0:t.lyric)||(d==null?void 0:d.lyric)||"")}catch(a){return console.warn("Lyric load failed:",e,a),[]}}function nt(e,t){e!==L.value||!t.length||(z[e].lyrics=t,ve(()=>{Ae(),_e()}))}async function at(e){const t=z[e];if(!(t!=null&&t.id))return;const a=++N;if(Be.has(t.id)){nt(e,Be.get(t.id)??[]);return}let i=!1;await Promise.all(Xt(t.id).map(async u=>{const d=await Yt(u);i||a!==N||!d.length||(i=!0,Be.set(t.id,d),nt(e,d))}))}function Ae(){ve(()=>{var t;if(_e(),!c.value||n.value)return;const e=(t=Q.value)==null?void 0:t.querySelector(".lyric-line.active");e==null||e.scrollIntoView({block:"center",behavior:"smooth"})})}function _e(){const e=Q.value,t=[...(e==null?void 0:e.querySelectorAll(".lyric-line"))??[]];if(!e||!t.length)return;const a=e.getBoundingClientRect(),i=a.top+a.height/2;t.forEach(u=>{const d=u.getBoundingClientRect(),T=Math.min(Math.abs(d.top+d.height/2-i)/120,1.7);u.style.setProperty("--lyric-z",`${(60-T*74).toFixed(1)}px`),u.style.setProperty("--lyric-scale",Math.max(1.08-T*.12,.9).toFixed(3)),u.style.setProperty("--lyric-opacity",Math.max(1-T*.5,.28).toFixed(3))})}function Nt(e){o.value=e,ve(()=>{var t,a;_e(),e&&!n.value&&((a=(t=Q.value)==null?void 0:t.querySelector(".lyric-line.active"))==null||a.scrollIntoView({block:"center",behavior:"smooth"}))})}function jt(e){e.preventDefault();const t=Q.value;t&&(t.scrollTop+=e.deltaY,n.value=!0,O&&clearTimeout(O),O=window.setTimeout(()=>{var a,i;n.value=!1,c.value&&((i=(a=Q.value)==null?void 0:a.querySelector(".lyric-line.active"))==null||i.scrollIntoView({block:"center",behavior:"smooth"}))},2200),requestAnimationFrame(_e))}function Ht(e){me(e.time,!0)}function Ve(e){W.value=e,e&&(A.value=L.value,ve(()=>{var a,i;const t=(a=oe.value)==null?void 0:a.querySelector(`[data-index="${L.value}"]`);t==null||t.scrollIntoView({block:"center",behavior:"smooth"}),fe(),(i=oe.value)==null||i.focus({preventScroll:!0})}))}function fe(){const e=oe.value,t=[...(e==null?void 0:e.querySelectorAll(".song-option"))??[]];if(!e||!t.length)return;const a=e.getBoundingClientRect(),i=a.top+a.height/2;t.forEach(u=>{const d=u.getBoundingClientRect(),T=Math.min(Math.abs(d.top+d.height/2-i)/150,1.55),j=Math.max(86-T*96,-70),H=Math.max(1.08-T*.14,.9),Ye=Math.max(1-T*.52,.26),De=Number(u.dataset.index);u.style.setProperty("--item-z",`${j.toFixed(1)}px`),u.style.setProperty("--item-scale",H.toFixed(3)),u.style.setProperty("--item-opacity",Ye.toFixed(3)),u.classList.toggle("selected",De===A.value),u.setAttribute("aria-selected",String(De===A.value))})}function Gt(e){if(e.key==="ArrowDown"||e.key==="Tab"&&!e.shiftKey)e.preventDefault(),A.value=Math.min(A.value+1,z.length-1);else if(e.key==="ArrowUp"||e.key==="Tab"&&e.shiftKey)e.preventDefault(),A.value=Math.max(A.value-1,0);else if(e.key==="Enter"){e.preventDefault(),Te(A.value);return}else if(e.key==="Escape"){Ve(!1);return}else return;ve(()=>{var a;const t=(a=oe.value)==null?void 0:a.querySelector(`[data-index="${A.value}"]`);t==null||t.scrollIntoView({block:"center",behavior:"smooth"}),fe()})}function lt(){requestAnimationFrame(fe),requestAnimationFrame(_e)}return(e,t)=>{var a;return y(),P("section",Us,[r("div",Ts,[B(Is,{"effect-options":ce})]),t[26]||(t[26]=r("div",{class:"profile-background-shade","aria-hidden":"true"},null,-1)),r("div",{ref_key:"sceneRef",ref:Oe,class:ne(["profile-scene",{dragging:p.value}]),style:ge(kt.value),onPointerdown:Ut},[r("div",{class:"profile-container-wrapper",style:ge(St.value)},[r("aside",Ds,[r("div",{class:ne(["glass-panel music-player",{playing:c.value}])},[r("div",qs,[r("div",zs,[r("button",{class:"player-btn",type:"button","aria-label":"上一首",onClick:$(Tt,["stop"])},[B(I(Ls),{size:17})]),r("button",{class:"player-btn main",type:"button","aria-label":c.value?"暂停":"播放",onClick:$(tt,["stop"])},[c.value?(y(),ut(I(ks),{key:0,size:20})):(y(),ut(I(Ss),{key:1,size:20}))],8,Es),r("button",{class:"player-btn",type:"button","aria-label":"下一首",onClick:$(st,["stop"])},[B(I(Fs),{size:17})])]),(y(!0),P(qe,null,ze(I(pe),i=>(y(),P("span",{key:i,class:"bar",style:ge({"--bar-rotate":`${i*7.2}deg`,height:`${ke.value[i]}px`})},null,4))),128)),r("button",{class:"avatar-wrapper billboard",type:"button",onClick:$(tt,["stop"])},[be.value?(y(),P("img",{key:0,class:"avatar-img",src:be.value,alt:""},null,8,Rs)):(y(),P("span",Ws,g(E.value),1))])]),r("h2",$s,g(we.value),1),r("p",Os,g(Ie.value)+" · "+g(((a=I(Ce))==null?void 0:a.username)||"访客"),1),r("div",Bs,[r("div",Xs,[r("span",null,g(Qe(s.value)),1),r("span",null,g(Qe(he())),1)]),r("div",{ref_key:"songProgressRef",ref:Z,class:ne(["elastic-progress",{dragging:l.value}]),style:ge(Mt.value),role:"slider",tabindex:"0","aria-label":"Song progress","aria-valuemin":"0","aria-valuemax":he(),"aria-valuenow":Math.round(s.value),onPointerdown:Rt,onPointermove:Wt,onPointerup:it,onPointercancel:it,onKeydown:$t},[...t[13]||(t[13]=[r("div",{class:"progress-track"},[r("div",{class:"progress-fill"})],-1),r("div",{class:"progress-thumb"},null,-1)])],46,Vs)]),r("button",{class:"song-menu-toggle billboard",type:"button","aria-expanded":W.value,"aria-controls":"rightSongMenu",onClick:t[0]||(t[0]=$(i=>Ve(!W.value),["stop"]))},[B(I(xs),{size:16}),t[14]||(t[14]=Ee(" 歌曲选择 ",-1))],8,Ys)],2),r("div",{class:ne(["lyrics-shell billboard",{expanded:o.value}])},[r("button",{class:"lyrics-toggle",type:"button","aria-expanded":o.value,onClick:t[1]||(t[1]=$(i=>Nt(!o.value),["stop"]))},g(o.value?"收起歌词":"展开歌词"),9,Ns),r("div",{ref_key:"lyricsContainerRef",ref:Q,class:"lyrics-container",onWheel:$(jt,["prevent"])},[(y(!0),P(qe,null,ze(Le.value.lyrics,(i,u)=>(y(),P("button",{key:`${Le.value.id}-${u}`,class:ne(["lyric-line",{active:u===Pt.value}]),type:"button","data-index":u,style:ge({"--lyric-i":u}),onClick:$(d=>Ht(i),["stop"])},g(i.text),15,js))),128))],544)],2)]),r("main",{class:ne(["main-content",{"show-song-menu":W.value}])},[G(r("div",Hs,[r("form",{class:"glass-panel profile-panel",onSubmit:$(At,["prevent"])},[r("div",Gs,[B(I(os),{size:22}),t[15]||(t[15]=r("div",null,[r("h3",null,"个人资料 / Profile"),r("span",null,"头像与基础联系信息")],-1))]),r("label",Js,[r("span",null,[B(I(bs),{size:16}),t[16]||(t[16]=Ee(" 上传头像图片",-1))]),r("input",{type:"file",accept:"image/*",disabled:q.value||F.active,onChange:_t},null,40,Ks),r("small",null,g(q.value?"头像上传中":"支持 JPG、PNG、WEBP 等图片格式"),1)]),r("div",Zs,[r("label",Qs,[t[17]||(t[17]=r("span",null,"昵称",-1)),G(r("input",{"onUpdate:modelValue":t[2]||(t[2]=i=>v.nickname=i),maxlength:"64",required:""},null,512),[[ae,v.nickname,void 0,{trim:!0}]])]),r("label",eo,[t[18]||(t[18]=r("span",null,"真实姓名",-1)),G(r("input",{"onUpdate:modelValue":t[3]||(t[3]=i=>v.realName=i),maxlength:"64"},null,512),[[ae,v.realName,void 0,{trim:!0}]])]),r("label",to,[t[19]||(t[19]=r("span",null,"手机号",-1)),G(r("input",{"onUpdate:modelValue":t[4]||(t[4]=i=>v.phone=i),maxlength:"32",inputmode:"tel"},null,512),[[ae,v.phone,void 0,{trim:!0}]])]),r("label",so,[t[20]||(t[20]=r("span",null,"邮箱",-1)),G(r("input",{"onUpdate:modelValue":t[5]||(t[5]=i=>v.email=i),maxlength:"128",type:"email"},null,512),[[ae,v.email,void 0,{trim:!0}]])])]),f.profileError?(y(),P("p",oo,g(f.profileError),1)):Re("",!0),f.profileSuccess?(y(),P("p",ro,g(f.profileSuccess),1)):Re("",!0),r("button",{class:"primary-action billboard",type:"submit",disabled:F.active},[B(I(Ms),{size:18}),Ee(" "+g(F.active?"保存中":"保存资料"),1)],8,io)],32),r("form",{class:"glass-panel profile-panel password-panel",onSubmit:$(Ct,["prevent"])},[r("div",no,[B(I(gt),{size:22}),t[21]||(t[21]=r("div",null,[r("h3",null,"修改密码"),r("span",null,"需要验证当前密码")],-1))]),r("div",ao,[r("label",lo,[t[22]||(t[22]=r("span",null,"当前密码",-1)),G(r("input",{"onUpdate:modelValue":t[6]||(t[6]=i=>M.oldPassword=i),type:"password",autocomplete:"current-password",required:""},null,512),[[ae,M.oldPassword]])]),r("label",uo,[t[23]||(t[23]=r("span",null,"新密码",-1)),G(r("input",{"onUpdate:modelValue":t[7]||(t[7]=i=>M.newPassword=i),type:"password",autocomplete:"new-password",required:"",maxlength:"128"},null,512),[[ae,M.newPassword]])]),r("label",co,[t[24]||(t[24]=r("span",null,"确认新密码",-1)),G(r("input",{"onUpdate:modelValue":t[8]||(t[8]=i=>M.confirmPassword=i),type:"password",autocomplete:"new-password",required:"",maxlength:"128"},null,512),[[ae,M.confirmPassword]])])]),f.passwordError?(y(),P("p",po,g(f.passwordError),1)):Re("",!0),f.passwordSuccess?(y(),P("p",ho,g(f.passwordSuccess),1)):Re("",!0),r("button",{class:"primary-action billboard",type:"submit",disabled:C.active},[B(I(gt),{size:18}),Ee(" "+g(C.active?"修改中":"修改密码"),1)],8,mo)],32),r("section",fo,[r("div",go,[B(I(Ps),{size:22}),t[25]||(t[25]=r("div",null,[r("h3",null,"我的订单"),r("span",null,"文创产品购买记录（数据来自服务端）")],-1))]),se.value?(y(),P("div",vo,g(se.value),1)):xe.value?(y(),P("div",yo,"正在加载订单")):Pe.value.length?(y(),P("div",bo,[(y(!0),P(qe,null,ze(Pe.value,i=>{var u;return y(),P("article",{key:i.id,class:"billboard order-card"},[r("div",Po,[r("strong",null,g(i.orderNo),1),r("span",xo,g(i.status==="PAID"?"已付款":i.status),1)]),r("div",ko,[i.productCoverUrl?(y(),P("img",{key:0,src:i.productCoverUrl,alt:i.productName},null,8,So)):(y(),P("span",Mo,g((u=i.productName)==null?void 0:u.slice(0,1)),1)),r("div",null,[r("strong",null,g(i.productName),1),r("small",null,g(new Date(i.createdAt||"").toLocaleString()),1)])]),r("div",Lo,[r("span",null,"数量："+g(i.quantity),1),r("span",null,"合计：¥"+g(Number(i.total).toFixed(2)),1)])])}),128))])):(y(),P("div",wo," 暂无订单记录，购买文创产品后会显示在这里。 "))])],512),[[ct,!W.value]]),G(r("div",{id:"rightSongMenu",class:ne(["right-song-menu",{open:W.value}]),"aria-hidden":!W.value},[r("div",{ref_key:"songListRef",ref:oe,class:"song-list right-song-list",role:"listbox",tabindex:"0","aria-label":"Song selector",onScroll:fe,onKeydown:Gt},[(y(!0),P(qe,null,ze(z,(i,u)=>(y(),P("button",{key:i.id,class:"song-option",type:"button",role:"option","data-index":u,"aria-selected":u===A.value,style:ge({"--item-i":u}),onMouseenter:d=>{A.value=u,fe()},onClick:$(d=>Te(u),["stop"])},[r("span",_o,g(i.title),1),r("span",Co,g(i.artist),1)],44,Ao))),128))],544)],10,Fo),[[ct,W.value]])],2)],4)],38),r("audio",{ref_key:"audioPlayerRef",ref:R,preload:"metadata",onLoadedmetadata:t[9]||(t[9]=i=>{var u;return s.value=((u=R.value)==null?void 0:u.currentTime)||0}),onTimeupdate:t[10]||(t[10]=i=>{var u;s.value=((u=R.value)==null?void 0:u.currentTime)||0,Ae()}),onPlay:t[11]||(t[11]=i=>Fe(!0)),onPause:t[12]||(t[12]=i=>Fe(!1)),onEnded:st},null,544)])}}}),Xo=bt(To,[["__scopeId","data-v-34eaae84"]]);export{Xo as default};
