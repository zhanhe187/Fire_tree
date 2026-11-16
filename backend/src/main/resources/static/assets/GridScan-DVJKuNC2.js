import{q as et,M as ke,j as tt,l as at,o as Ce,H as De,D as Te,E as ot,L as nt,O as it,G as st,g as Re,w as Q,e as lt}from"./_plugin-vue_export-helper-ByPV5UX7.js";import{E as ct,R as rt,B as dt,C as ut,a as ft}from"./index-DVH7Xudy.js";import{W as mt,S as ht,N as pt,a as yt,O as vt,V as gt,b as xt,c as A,P as wt,M as St,C as bt,d as m}from"./three.module-aHyJ-PPJ.js";const Mt={key:0,class:"right-3 bottom-3 absolute bg-black shadow-[0_4px_16px_rgba(0,0,0,0.4)] border border-white/25 rounded-lg w-[220px] h-[132px] overflow-hidden font-sans text-[12px] text-white leading-[1.2] pointer-events-none"},kt={class:"top-2 left-2 absolute bg-black/50 backdrop-blur-[4px] px-[6px] py-[2px] rounded-[6px]"},Ct=`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,Dt=`
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec2 uSkew;
uniform float uTilt;
uniform float uYaw;
uniform float uLineThickness;
uniform vec3 uLinesColor;
uniform vec3 uScanColor;
uniform float uGridScale;
uniform float uLineStyle;
uniform float uLineJitter;
uniform float uScanOpacity;
uniform float uScanDirection;
uniform float uNoise;
uniform float uBloomOpacity;
uniform float uScanGlow;
uniform float uScanSoftness;
uniform float uPhaseTaper;
uniform float uScanDuration;
uniform float uScanDelay;
varying vec2 vUv;

uniform float uScanStarts[8];
uniform float uScanCount;

const int MAX_SCANS = 8;

float smoother01(float a, float b, float x){
  float t = clamp((x - a) / max(1e-5, (b - a)), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
    p.x *= 0.58;

    vec3 ro = vec3(0.0);
    vec3 rd = normalize(vec3(p, 2.0));

    float cR = cos(uTilt), sR = sin(uTilt);
    rd.xy = mat2(cR, -sR, sR, cR) * rd.xy;

    float cY = cos(uYaw), sY = sin(uYaw);
    rd.xz = mat2(cY, -sY, sY, cY) * rd.xz;

    vec2 skew = clamp(uSkew, vec2(-0.7), vec2(0.7));
    rd.xy += skew * rd.z;

    vec3 color = vec3(0.0);
  float minT = 1e20;
  float gridScale = max(1e-5, uGridScale);
    float fadeStrength = 2.0;
    vec2 gridUV = vec2(0.0);

  float hitIsY = 1.0;
    for (int i = 0; i < 4; i++)
    {
        float isY = float(i < 2);
        float pos = mix(-0.2, 0.2, float(i)) * isY + mix(-0.5, 0.5, float(i - 2)) * (1.0 - isY);
        float num = pos - (isY * ro.y + (1.0 - isY) * ro.x);
        float den = isY * rd.y + (1.0 - isY) * rd.x;
        float t = num / den;
        vec3 h = ro + rd * t;

        float depthBoost = smoothstep(0.0, 3.0, h.z);
        h.xy += skew * 0.15 * depthBoost;

    bool use = t > 0.0 && t < minT;
    gridUV = use ? mix(h.zy, h.xz, isY) / gridScale : gridUV;
    minT = use ? t : minT;
    hitIsY = use ? isY : hitIsY;
    }

    vec3 hit = ro + rd * minT;
    float dist = length(hit - ro);

  float jitterAmt = clamp(uLineJitter, 0.0, 1.0);
  if (jitterAmt > 0.0) {
    vec2 j = vec2(
      sin(gridUV.y * 2.7 + iTime * 1.8),
      cos(gridUV.x * 2.3 - iTime * 1.6)
    ) * (0.15 * jitterAmt);
    gridUV += j;
  }
  float fx = fract(gridUV.x);
  float fy = fract(gridUV.y);
  float ax = min(fx, 1.0 - fx);
  float ay = min(fy, 1.0 - fy);
  float wx = fwidth(gridUV.x);
  float wy = fwidth(gridUV.y);
  float halfPx = max(0.0, uLineThickness) * 0.5;

  float tx = halfPx * wx;
  float ty = halfPx * wy;

  float aax = wx;
  float aay = wy;

  float lineX = 1.0 - smoothstep(tx, tx + aax, ax);
  float lineY = 1.0 - smoothstep(ty, ty + aay, ay);
  if (uLineStyle > 0.5) {
    float dashRepeat = 4.0;
    float dashDuty = 0.5;
    float vy = fract(gridUV.y * dashRepeat);
    float vx = fract(gridUV.x * dashRepeat);
    float dashMaskY = step(vy, dashDuty);
    float dashMaskX = step(vx, dashDuty);
    if (uLineStyle < 1.5) {
      lineX *= dashMaskY;
      lineY *= dashMaskX;
    } else {
      float dotRepeat = 6.0;
      float dotWidth = 0.18;
      float cy = abs(fract(gridUV.y * dotRepeat) - 0.5);
      float cx = abs(fract(gridUV.x * dotRepeat) - 0.5);
      float dotMaskY = 1.0 - smoothstep(dotWidth, dotWidth + fwidth(gridUV.y * dotRepeat), cy);
      float dotMaskX = 1.0 - smoothstep(dotWidth, dotWidth + fwidth(gridUV.x * dotRepeat), cx);
      lineX *= dotMaskY;
      lineY *= dotMaskX;
    }
  }
  float primaryMask = max(lineX, lineY);

  vec2 gridUV2 = (hitIsY > 0.5 ? hit.xz : hit.zy) / gridScale;
  if (jitterAmt > 0.0) {
    vec2 j2 = vec2(
      cos(gridUV2.y * 2.1 - iTime * 1.4),
      sin(gridUV2.x * 2.5 + iTime * 1.7)
    ) * (0.15 * jitterAmt);
    gridUV2 += j2;
  }
  float fx2 = fract(gridUV2.x);
  float fy2 = fract(gridUV2.y);
  float ax2 = min(fx2, 1.0 - fx2);
  float ay2 = min(fy2, 1.0 - fy2);
  float wx2 = fwidth(gridUV2.x);
  float wy2 = fwidth(gridUV2.y);
  float tx2 = halfPx * wx2;
  float ty2 = halfPx * wy2;
  float aax2 = wx2;
  float aay2 = wy2;
  float lineX2 = 1.0 - smoothstep(tx2, tx2 + aax2, ax2);
  float lineY2 = 1.0 - smoothstep(ty2, ty2 + aay2, ay2);
  if (uLineStyle > 0.5) {
    float dashRepeat2 = 4.0;
    float dashDuty2 = 0.5;
    float vy2m = fract(gridUV2.y * dashRepeat2);
    float vx2m = fract(gridUV2.x * dashRepeat2);
    float dashMaskY2 = step(vy2m, dashDuty2);
    float dashMaskX2 = step(vx2m, dashDuty2);
    if (uLineStyle < 1.5) {
      lineX2 *= dashMaskY2;
      lineY2 *= dashMaskX2;
    } else {
      float dotRepeat2 = 6.0;
      float dotWidth2 = 0.18;
      float cy2 = abs(fract(gridUV2.y * dotRepeat2) - 0.5);
      float cx2 = abs(fract(gridUV2.x * dotRepeat2) - 0.5);
      float dotMaskY2 = 1.0 - smoothstep(dotWidth2, dotWidth2 + fwidth(gridUV2.y * dotRepeat2), cy2);
      float dotMaskX2 = 1.0 - smoothstep(dotWidth2, dotWidth2 + fwidth(gridUV2.x * dotRepeat2), cx2);
      lineX2 *= dotMaskY2;
      lineY2 *= dotMaskX2;
    }
  }
    float altMask = max(lineX2, lineY2);

    float edgeDistX = min(abs(hit.x - (-0.5)), abs(hit.x - 0.5));
    float edgeDistY = min(abs(hit.y - (-0.2)), abs(hit.y - 0.2));
    float edgeDist = mix(edgeDistY, edgeDistX, hitIsY);
    float edgeGate = 1.0 - smoothstep(gridScale * 0.5, gridScale * 2.0, edgeDist);
    altMask *= edgeGate;

  float lineMask = max(primaryMask, altMask);

    float fade = exp(-dist * fadeStrength);

    float dur = max(0.05, uScanDuration);
    float del = max(0.0, uScanDelay);
    float scanZMax = 2.0;
    float widthScale = max(0.1, uScanGlow);
    float sigma = max(0.001, 0.18 * widthScale * uScanSoftness);
    float sigmaA = sigma * 2.0;

    float combinedPulse = 0.0;
    float combinedAura = 0.0;

    float cycle = dur + del;
    float tCycle = mod(iTime, cycle);
    float scanPhase = clamp((tCycle - del) / dur, 0.0, 1.0);
    float phase = scanPhase;
    if (uScanDirection > 0.5 && uScanDirection < 1.5) {
      phase = 1.0 - phase;
    } else if (uScanDirection > 1.5) {
      float t2 = mod(max(0.0, iTime - del), 2.0 * dur);
      phase = (t2 < dur) ? (t2 / dur) : (1.0 - (t2 - dur) / dur);
    }
    float scanZ = phase * scanZMax;
    float dz = abs(hit.z - scanZ);
    float lineBand = exp(-0.5 * (dz * dz) / (sigma * sigma));
    float taper = clamp(uPhaseTaper, 0.0, 0.49);
    float headW = taper;
    float tailW = taper;
    float headFade = smoother01(0.0, headW, phase);
    float tailFade = 1.0 - smoother01(1.0 - tailW, 1.0, phase);
    float phaseWindow = headFade * tailFade;
    float pulseBase = lineBand * phaseWindow;
    combinedPulse += pulseBase * clamp(uScanOpacity, 0.0, 1.0);
    float auraBand = exp(-0.5 * (dz * dz) / (sigmaA * sigmaA));
    combinedAura += (auraBand * 0.25) * phaseWindow * clamp(uScanOpacity, 0.0, 1.0);

    for (int i = 0; i < MAX_SCANS; i++) {
      if (float(i) >= uScanCount) break;
      float tActiveI = iTime - uScanStarts[i];
      float phaseI = clamp(tActiveI / dur, 0.0, 1.0);
      if (uScanDirection > 0.5 && uScanDirection < 1.5) {
        phaseI = 1.0 - phaseI;
      } else if (uScanDirection > 1.5) {
        phaseI = (phaseI < 0.5) ? (phaseI * 2.0) : (1.0 - (phaseI - 0.5) * 2.0);
      }
      float scanZI = phaseI * scanZMax;
      float dzI = abs(hit.z - scanZI);
      float lineBandI = exp(-0.5 * (dzI * dzI) / (sigma * sigma));
      float headFadeI = smoother01(0.0, headW, phaseI);
      float tailFadeI = 1.0 - smoother01(1.0 - tailW, 1.0, phaseI);
      float phaseWindowI = headFadeI * tailFadeI;
      combinedPulse += lineBandI * phaseWindowI * clamp(uScanOpacity, 0.0, 1.0);
      float auraBandI = exp(-0.5 * (dzI * dzI) / (sigmaA * sigmaA));
      combinedAura += (auraBandI * 0.25) * phaseWindowI * clamp(uScanOpacity, 0.0, 1.0);
    }

  float lineVis = lineMask;
  vec3 gridCol = uLinesColor * lineVis * fade;
  vec3 scanCol = uScanColor * combinedPulse;
  vec3 scanAura = uScanColor * combinedAura;

    color = gridCol + scanCol + scanAura;

  float n = fract(sin(dot(gl_FragCoord.xy + vec2(iTime * 123.4), vec2(12.9898,78.233))) * 43758.5453123);
  color += (n - 0.5) * uNoise;
  color = clamp(color, 0.0, 1.0);
  float alpha = clamp(max(lineVis, combinedPulse), 0.0, 1.0);
  float gx = 1.0 - smoothstep(tx * 2.0, tx * 2.0 + aax * 2.0, ax);
  float gy = 1.0 - smoothstep(ty * 2.0, ty * 2.0 + aay * 2.0, ay);
  float halo = max(gx, gy) * fade;
  alpha = max(alpha, halo * clamp(uBloomOpacity, 0.0, 1.0));
  fragColor = vec4(color, alpha);
}

void main(){
  vec4 c;
  mainImage(c, vUv * iResolution.xy);
  gl_FragColor = c;
}
`,J=8,Pt=et({__name:"GridScan",props:{enableWebcam:{type:Boolean,default:!1},showPreview:{type:Boolean,default:!1},modelsPath:{default:"https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights"},sensitivity:{default:.55},lineThickness:{default:1},linesColor:{default:"#2c3d32"},gridScale:{default:.1},lineStyle:{default:"solid"},lineJitter:{default:.1},enablePost:{type:Boolean,default:!0},bloomIntensity:{default:0},bloomThreshold:{default:0},bloomSmoothing:{default:0},chromaticAberration:{default:.002},noiseIntensity:{default:.01},scanColor:{default:"#48FF28"},scanOpacity:{default:.4},scanDirection:{default:"pingpong"},scanSoftness:{default:2},scanGlow:{default:.5},scanPhaseTaper:{default:.9},scanDuration:{default:2},scanDelay:{default:2},enableGyro:{type:Boolean,default:!1},scanOnClick:{type:Boolean,default:!1},snapBackDelay:{default:250},className:{default:""},style:{}},setup(L){const e=L,$=ke("containerRef"),Z=ke("videoRef"),I=Re(!1),T=Re(!1);let ee=()=>{},te=null;const ae=()=>(te??(te=lt(()=>import("./index-Dd0c2INU.js"),[])),te),z=t=>new bt(t).convertSRGBToLinear(),Ie=(t,n,o,c,h,x)=>{const d=t.clone();c=Math.max(1e-4,c);const r=2/c,p=r*x,u=1/(1+p+.48*p*p+.235*p*p*p),f=t.clone().sub(n),k=n.clone(),w=h*c;f.length()>w&&f.setLength(w),n=t.clone().sub(f);const v=o.clone().addScaledVector(f,r).multiplyScalar(x);o.sub(v.clone().multiplyScalar(r)),o.multiplyScalar(u),d.copy(n.clone().add(f.add(v).multiplyScalar(u)));const P=k.clone().sub(t),g=d.clone().sub(k);return P.dot(g)>0&&(d.copy(k),o.set(0,0)),d},oe=(t,n,o,c,h,x)=>{c=Math.max(1e-4,c);const d=2/c,r=d*x,p=1/(1+r+.48*r*r+.235*r*r*r);let u=t-n;const f=n,k=h*c;u=Math.sign(u)*Math.min(Math.abs(u),k),n=t-u;const w=(o.v+d*u)*x;o.v=(o.v-d*w)*p;let v=n+(u+w)*p;const P=f-t,g=v-f;return P*g>0&&(v=f,o.v=0),{value:v,v:o.v}},B=(t,n,o)=>{t.push(n),t.length>o&&t.shift()},E=t=>{if(t.length===0)return 0;const n=[...t].sort((c,h)=>c-h),o=Math.floor(n.length/2);return n.length%2?n[o]:(n[o-1]+n[o])*.5},ne=t=>{let n=0,o=0;const c=t.length||1;for(const h of t)n+=h.x,o+=h.y;return{x:n/c,y:o/c}},ie=(t,n)=>Math.hypot(t.x-n.x,t.y-n.y),Pe=()=>{const t=$.value;if(!t)return;const n=()=>{const a=t.getBoundingClientRect();return{width:Math.max(1,Math.round(a.width||t.clientWidth||window.innerWidth||1)),height:Math.max(1,Math.round(a.height||t.clientHeight||window.innerHeight||1))}},o=new mt({antialias:!0,alpha:!0});o.setPixelRatio(Math.min(window.devicePixelRatio||1,2));const c=n();o.setSize(c.width,c.height),o.outputColorSpace=ht,o.toneMapping=pt,o.autoClear=!1,o.setClearColor(0,0),t.appendChild(o.domElement);const h=new yt,x=new vt(-1,1,1,-1,0,1),d=new A(0,0),r=new A(0,0),p=new A(0,0);let u=0,f=0,k=0,w=0,v=0,P=0;const g=[],se=[],le=[],ce=[],re=[];let y=null;const s={iResolution:{value:new gt(c.width,c.height,o.getPixelRatio())},iTime:{value:0},uSkew:{value:new A(0,0)},uTilt:{value:0},uYaw:{value:0},uLineThickness:{value:e.lineThickness},uLinesColor:{value:z(e.linesColor)},uScanColor:{value:z(e.scanColor)},uGridScale:{value:e.gridScale},uLineStyle:{value:e.lineStyle==="dashed"?1:e.lineStyle==="dotted"?2:0},uLineJitter:{value:Math.max(0,Math.min(1,e.lineJitter||0))},uScanOpacity:{value:e.scanOpacity},uNoise:{value:e.noiseIntensity},uBloomOpacity:{value:e.bloomIntensity},uScanGlow:{value:e.scanGlow},uScanSoftness:{value:e.scanSoftness},uPhaseTaper:{value:e.scanPhaseTaper},uScanDuration:{value:e.scanDuration},uScanDelay:{value:e.scanDelay},uScanDirection:{value:e.scanDirection==="backward"?1:e.scanDirection==="pingpong"?2:0},uScanStarts:{value:new Array(J).fill(0)},uScanCount:{value:0}},de=new xt({uniforms:s,vertexShader:Ct,fragmentShader:Dt,transparent:!0,depthWrite:!1,depthTest:!1}),ue=new wt(2,2),Ae=new St(ue,de);h.add(Ae);let S=null,R=null,F=null;if(e.enablePost){S=new ct(o);const a=new rt(h,x);S.addPass(a),R=new dt({intensity:1,luminanceThreshold:e.bloomThreshold,luminanceSmoothing:e.bloomSmoothing}),R.blendMode.opacity.value=Math.max(0,e.bloomIntensity),F=new ut({offset:new A(e.chromaticAberration,e.chromaticAberration),radialModulation:!0,modulationOffset:0});const i=new ft(x,R,F);i.renderToScreen=!0,S.addPass(i)}const Le=a=>{g.length>=J&&g.shift(),g.push(a);const i=new Array(J).fill(0);for(let l=0;l<g.length&&l<J;l++)i[l]=g[l];s.uScanStarts.value=i,s.uScanCount.value=g.length},fe=a=>{if(T.value)return;y&&(clearTimeout(y),y=null);const i=t.getBoundingClientRect(),l=(a.clientX-i.left)/i.width*2-1,C=-((a.clientY-i.top)/i.height*2-1);d.set(l,C)},me=async()=>{const a=performance.now()/1e3;e.scanOnClick&&Le(a);const i=DeviceOrientationEvent;if(e.enableGyro&&typeof window<"u"&&window.DeviceOrientationEvent&&i.requestPermission)try{if(await i.requestPermission()!=="granted")return}catch{}},he=()=>{y&&(clearTimeout(y),y=null)},pe=()=>{T.value||(y&&clearTimeout(y),y=window.setTimeout(()=>{d.set(0,0),u=0,w=0},Math.max(0,e.snapBackDelay||0)))},ye=a=>{if(T.value)return;const i=a.gamma??0,l=a.beta??0,C=m.clamp(i/45,-1,1),U=m.clamp(-l/30,-1,1);d.set(C,U),u=m.degToRad(i)*.4},H=()=>{const a=n();o.setSize(a.width,a.height),s.iResolution.value.set(a.width,a.height,o.getPixelRatio()),S&&S.setSize(a.width,a.height)},Y=typeof ResizeObserver<"u"?new ResizeObserver(H):null;Y==null||Y.observe(t),t.addEventListener("mousemove",fe),t.addEventListener("mouseenter",he),t.addEventListener("mouseleave",pe),e.scanOnClick&&t.addEventListener("click",me),e.enableGyro&&window.addEventListener("deviceorientation",ye),window.addEventListener("resize",H);let O=!1,ve=0;const ge=async()=>{if(!e.enableWebcam||!I.value)return;const a=Z.value;if(!a)return;const i=await ae();try{const D=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1280},height:{ideal:720}},audio:!1});a.srcObject=D,await a.play()}catch{return}const l=new i.TinyFaceDetectorOptions({inputSize:320,scoreThreshold:.5}),C=m.clamp(e.sensitivity,0,1),U=m.lerp(.25,.45,C),V=async D=>{if(!O){if(D-ve>=33){ve=D;try{const b=await i.detectSingleFace(a,l).withFaceLandmarks(!0);if(b&&b.detection){const M=b.detection.box,W=a.videoWidth||1,be=a.videoHeight||1,ze=M.x+M.width*.5,Be=M.y+M.height*.5,Ee=ze/W*2-1,Fe=Be/be*2-1;B(se,Ee,5),B(le,Fe,5);const Oe=E(se),Ge=E(le),Xe=new A(Math.tanh(Oe),Math.tanh(Ge)),_e=Math.min(1,Math.hypot(M.width/W,M.height/be)),je=1+U*(_e-.25);d.copy(Xe.multiplyScalar(je));const Ne=b.landmarks.getLeftEye(),qe=b.landmarks.getRightEye(),_=ne(Ne),j=ne(qe),Je=Math.atan2(j.y-_.y,j.x-_.x);B(ce,Je,5),u=E(ce);const N=b.landmarks.getNose(),Me=N[N.length-1]||N[Math.floor(N.length/2)],q=b.landmarks.getJawOutline(),Ze=q[3]||q[2],He=q[13]||q[14],Ke=ie(Me,Ze),Qe=ie(Me,He),$e=Math.hypot(j.x-_.x,j.y-_.y)+1e-6;let K=m.clamp((Qe-Ke)/($e*1.6),-1,1);K=Math.tanh(K),B(re,K,5),w=E(re),T.value=!0}else T.value=!1}catch{T.value=!1}}"requestVideoFrameCallback"in HTMLVideoElement.prototype?a.requestVideoFrameCallback(()=>V(performance.now())):requestAnimationFrame(V)}};requestAnimationFrame(V)},xe=()=>{O=!0;const a=Z.value;if(a){const i=a.srcObject;i&&i.getTracks().forEach(l=>l.stop()),a.pause(),a.srcObject=null}},Ue=Q(()=>e.enableWebcam,a=>{a&&I.value?(O=!1,ge()):xe()}),Ve=Q(I,a=>{a&&e.enableWebcam&&(O=!1,ge())}),We=Q([()=>e.lineThickness,()=>e.linesColor,()=>e.scanColor,()=>e.gridScale,()=>e.lineStyle,()=>e.lineJitter,()=>e.bloomIntensity,()=>e.bloomThreshold,()=>e.bloomSmoothing,()=>e.chromaticAberration,()=>e.noiseIntensity,()=>e.scanGlow,()=>e.scanOpacity,()=>e.scanDirection,()=>e.scanSoftness,()=>e.scanPhaseTaper,()=>e.scanDuration,()=>e.scanDelay],()=>{s.uLineThickness.value=e.lineThickness,s.uLinesColor.value.copy(z(e.linesColor)),s.uScanColor.value.copy(z(e.scanColor)),s.uGridScale.value=e.gridScale,s.uLineStyle.value=e.lineStyle==="dashed"?1:e.lineStyle==="dotted"?2:0,s.uLineJitter.value=Math.max(0,Math.min(1,e.lineJitter||0)),s.uBloomOpacity.value=Math.max(0,e.bloomIntensity),s.uNoise.value=Math.max(0,e.noiseIntensity),s.uScanGlow.value=e.scanGlow,s.uScanOpacity.value=Math.max(0,Math.min(1,e.scanOpacity)),s.uScanDirection.value=e.scanDirection==="backward"?1:e.scanDirection==="pingpong"?2:0,s.uScanSoftness.value=e.scanSoftness,s.uPhaseTaper.value=e.scanPhaseTaper,s.uScanDuration.value=Math.max(.05,e.scanDuration),s.uScanDelay.value=Math.max(0,e.scanDelay),R&&(R.blendMode.opacity.value=Math.max(0,e.bloomIntensity),R.luminanceMaterial.threshold=e.bloomThreshold,R.luminanceMaterial.smoothing=e.bloomSmoothing),F&&F.offset.set(e.chromaticAberration,e.chromaticAberration)});let G=null,we=performance.now();const Se=()=>{const a=performance.now(),i=Math.max(0,Math.min(.1,(a-we)/1e3));we=a;const l=m.clamp(e.sensitivity,0,1),C=m.lerp(.06,.2,l),U=m.lerp(.12,.3,l),V=m.lerp(.1,.28,l),D=m.lerp(.45,.12,l),b=m.lerp(1.2,1.6,l),X=1/0;r.copy(Ie(r,d,p,D,X,i));const M=oe(f,u,{v:k},D,X,i);f=M.value,k=M.v;const W=oe(v,w,{v:P},D,X,i);v=W.value,P=W.v,s.uSkew.value.set(r.x*C,-r.y*b*C),s.uTilt.value=f*U,s.uYaw.value=m.clamp(v*V,-.6,.6),s.iTime.value=a/1e3,o.clear(!0,!0,!0),S?S.render(i):o.render(h,x),G=requestAnimationFrame(Se)};G=requestAnimationFrame(Se),ee=()=>{G&&cancelAnimationFrame(G),y&&clearTimeout(y),t.removeEventListener("mousemove",fe),t.removeEventListener("mouseenter",he),t.removeEventListener("mouseleave",pe),t.removeEventListener("click",me),Y==null||Y.disconnect(),window.removeEventListener("deviceorientation",ye),window.removeEventListener("resize",H),Ue(),Ve(),We(),xe(),de.dispose(),ue.dispose(),S&&S.dispose(),o.dispose(),t.contains(o.domElement)&&t.removeChild(o.domElement)}},Ye=async()=>{if(e.enableWebcam)try{const t=await ae();await Promise.all([t.nets.tinyFaceDetector.loadFromUri(e.modelsPath),t.nets.faceLandmark68TinyNet.loadFromUri(e.modelsPath)]),I.value=!0}catch{I.value=!1}};return tt(()=>{Pe(),e.enableWebcam&&Ye()}),at(()=>{ee()}),(t,n)=>(Ce(),De("div",{ref_key:"containerRef",ref:$,class:st(["relative w-full h-full overflow-hidden",L.className]),style:it(L.style)},[L.showPreview?(Ce(),De("div",Mt,[Te("video",{ref_key:"videoRef",ref:Z,muted:"",playsinline:"",autoplay:"",class:"w-full h-full object-cover -scale-x-100"},null,512),Te("div",kt,ot(L.enableWebcam?I.value?T.value?"Face: tracking":"Face: searching":"Loading models":"Webcam disabled"),1)])):nt("",!0)],6))}});export{Pt as default};
