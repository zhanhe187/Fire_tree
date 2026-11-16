import{W as B,a as I,O as F,C as L,b as O,c as k,M as H,P}from"./three.module-aHyJ-PPJ.js";import{q as G,M as _,j as z,k as N,o as Y,H as q,O as W,g as c,f as j}from"./_plugin-vue_export-helper-ByPV5UX7.js";const V=`
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,U=`
precision highp float;

uniform float uTime, uAttenuation, uLineThickness;
uniform float uBaseRadius, uRadiusStep, uScaleRate;
uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;
uniform float uFadeIn, uFadeOut;
uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;
uniform vec2 uResolution, uMouse;
uniform vec3 uColor, uColorTwo;
uniform int uRingCount;

const float HP = 1.5707963;
const float CYCLE = 3.45;

float fade(float t) {
  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);
}

float ring(vec2 p, float ri, float cut, float t0, float px) {
  float t = mod(uTime + t0, CYCLE);
  float r = ri + t / CYCLE * uScaleRate;
  float d = abs(length(p) - r);
  float a = atan(abs(p.y), abs(p.x)) / HP;
  float th = max(1.0 - a, 0.5) * px * uLineThickness;
  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
  d += pow(cut * a, 3.0) * r;
  return h * exp(-uAttenuation * d) * fade(t);
}

void main() {
  float px = 1.0 / min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;
  float cr = cos(uRotation), sr = sin(uRotation);
  p = mat2(cr, -sr, sr, cr) * p;
  p -= uMouse * uMouseInfluence;
  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;
  p /= sc;
  vec3 c = vec3(0.0);
  float rcf = max(float(uRingCount) - 1.0, 1.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uRingCount) break;
    float fi = float(i);
    vec2 pr = p - fi * uParallax * uMouse;
    vec3 rc = mix(uColor, uColorTwo, fi / rcf);
    c = mix(c, rc, vec3(ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));
  }
  c *= 1.0 + uBurst * 2.0;
  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * uNoiseAmount;
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);
}
`,D=G({__name:"MagicRings",props:{color:{default:"#7cff67"},colorTwo:{default:"#42fcff"},speed:{default:1},ringCount:{default:6},attenuation:{default:10},lineThickness:{default:2},baseRadius:{default:.35},radiusStep:{default:.1},scaleRate:{default:.1},opacity:{default:1},blur:{default:0},noiseAmount:{default:.1},rotation:{default:0},ringGap:{default:1.5},fadeIn:{default:.7},fadeOut:{default:.5},followMouse:{type:Boolean,default:!1},mouseInfluence:{default:.2},hoverScale:{default:1.2},parallax:{default:.05},clickBurst:{type:Boolean,default:!1}},setup(A){const a=A,h=_("mountRef"),s=c([0,0]),l=c([0,0]),v=c(0),d=c(!1),i=c(0),E=j(()=>({color:a.color,colorTwo:a.colorTwo,speed:a.speed,ringCount:a.ringCount,attenuation:a.attenuation,lineThickness:a.lineThickness,baseRadius:a.baseRadius,radiusStep:a.radiusStep,scaleRate:a.scaleRate,opacity:a.opacity,blur:a.blur,noiseAmount:a.noiseAmount,rotation:a.rotation,ringGap:a.ringGap,fadeIn:a.fadeIn,fadeOut:a.fadeOut,followMouse:a.followMouse,mouseInfluence:a.mouseInfluence,hoverScale:a.hoverScale,parallax:a.parallax,clickBurst:a.clickBurst}));let n=null,m=0,r=null;const g=[];return z(()=>{const t=h.value;if(!t)return;try{n=new B({alpha:!0})}catch{return}if(!n.capabilities.isWebGL2){n.dispose(),n=null;return}n.setClearColor(0,0),t.appendChild(n.domElement);const p=new I,C=new F(-.5,.5,.5,-.5,.1,10);C.position.z=1;const u={uTime:{value:0},uAttenuation:{value:0},uResolution:{value:new k},uColor:{value:new L},uColorTwo:{value:new L},uLineThickness:{value:0},uBaseRadius:{value:0},uRadiusStep:{value:0},uScaleRate:{value:0},uRingCount:{value:0},uOpacity:{value:1},uNoiseAmount:{value:0},uRotation:{value:0},uRingGap:{value:1.6},uFadeIn:{value:.5},uFadeOut:{value:.75},uMouse:{value:new k},uMouseInfluence:{value:0},uHoverAmount:{value:0},uHoverScale:{value:1},uParallax:{value:0},uBurst:{value:0}},w=new O({vertexShader:V,fragmentShader:U,uniforms:u,transparent:!0}),x=new H(new P(1,1),w);p.add(x);const f=()=>{if(!n)return;const o=t.clientWidth,e=t.clientHeight,R=Math.min(window.devicePixelRatio,2);n.setPixelRatio(R),n.setSize(o,e,!1),u.uResolution.value.set(o*R,e*R)};f(),window.addEventListener("resize",f),r=new ResizeObserver(f),r.observe(t);const M=o=>{const e=t.getBoundingClientRect();s.value[0]=(o.clientX-e.left)/e.width-.5,s.value[1]=-((o.clientY-e.top)/e.height-.5)},S=()=>{d.value=!0},b=()=>{d.value=!1,s.value=[0,0]},T=()=>{i.value=1};t.addEventListener("mousemove",M),t.addEventListener("mouseenter",S),t.addEventListener("mouseleave",b),t.addEventListener("click",T);const y=o=>{if(!n)return;m=requestAnimationFrame(y);const e=E.value;l.value[0]+=(s.value[0]-l.value[0])*.08,l.value[1]+=(s.value[1]-l.value[1])*.08,v.value+=((d.value?1:0)-v.value)*.08,i.value*=.95,i.value<.001&&(i.value=0),u.uTime.value=o*.001*e.speed,u.uAttenuation.value=e.attenuation,u.uColor.value.set(e.color),u.uColorTwo.value.set(e.colorTwo),u.uLineThickness.value=e.lineThickness,u.uBaseRadius.value=e.baseRadius,u.uRadiusStep.value=e.radiusStep,u.uScaleRate.value=e.scaleRate,u.uRingCount.value=e.ringCount,u.uOpacity.value=e.opacity,u.uNoiseAmount.value=e.noiseAmount,u.uRotation.value=e.rotation*Math.PI/180,u.uRingGap.value=e.ringGap,u.uFadeIn.value=e.fadeIn,u.uFadeOut.value=e.fadeOut,u.uMouse.value.set(l.value[0],l.value[1]),u.uMouseInfluence.value=e.followMouse?e.mouseInfluence:0,u.uHoverAmount.value=v.value,u.uHoverScale.value=e.hoverScale,u.uParallax.value=e.parallax,u.uBurst.value=e.clickBurst?i.value:0,n.render(p,C)};m=requestAnimationFrame(y),g.push(()=>{cancelAnimationFrame(m),window.removeEventListener("resize",f),r==null||r.disconnect(),t.removeEventListener("mousemove",M),t.removeEventListener("mouseenter",S),t.removeEventListener("mouseleave",b),t.removeEventListener("click",T);const o=n;(o==null?void 0:o.domElement.parentNode)===t&&t.removeChild(o.domElement),o==null||o.dispose(),n=null,w.dispose(),x.geometry.dispose()})}),N(()=>{g.forEach(t=>t())}),(t,p)=>(Y(),q("div",{ref_key:"mountRef",ref:h,class:"w-full h-full magic-rings-canvas",style:W({width:"100%",height:"100%",filter:a.blur>0?`blur(${a.blur}px)`:void 0})},null,4))}});export{D as default};
