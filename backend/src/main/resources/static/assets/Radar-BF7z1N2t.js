import{G as C,R as M,P as b,a as R}from"./Mesh-B7YS--Ut.js";import{q as T,M as x,j as I,k as y,w as B,o as F,H as L}from"./_plugin-vue_export-helper-ByPV5UX7.js";class A extends C{constructor(l,{attributes:e={}}={}){Object.assign(e,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])},uv:{size:2,data:new Float32Array([0,0,2,0,0,2])}}),super(l,e)}}const E=`
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`,_=`
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uRingCount;
uniform float uSpokeCount;
uniform float uRingThickness;
uniform float uSpokeThickness;
uniform float uSweepSpeed;
uniform float uSweepWidth;
uniform float uSweepLobes;
uniform vec3 uColor;
uniform vec3 uBgColor;
uniform float uFalloff;
uniform float uBrightness;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define TAU 6.28318530718

void main() {
  vec2 st = gl_FragCoord.xy / uResolution.xy;
  st = st * 2.0 - 1.0;
  st.x *= uResolution.x / uResolution.y;

  if (uEnableMouse) {
    vec2 mShift = (uMouse * 2.0 - 1.0);
    mShift.x *= uResolution.x / uResolution.y;
    st -= mShift * uMouseInfluence;
  }

  st *= uScale;

  float dist = length(st);
  float theta = atan(st.y, st.x);
  float t = uTime * uSpeed;

  float ringPhase = dist * uRingCount - t;
  float ringDist = abs(fract(ringPhase) - 0.5);
  float ringGlow = 1.0 - smoothstep(0.0, uRingThickness, ringDist);

  float spokeAngle = abs(fract(theta * uSpokeCount / TAU + 0.5) - 0.5) * TAU / uSpokeCount;
  float arcDist = spokeAngle * dist;
  float spokeGlow = (1.0 - smoothstep(0.0, uSpokeThickness, arcDist)) * smoothstep(0.0, 0.1, dist);

  float sweepPhase = t * uSweepSpeed;
  float sweepBeam = pow(max(0.5 * sin(uSweepLobes * theta + sweepPhase) + 0.5, 0.0), uSweepWidth);

  float fade = smoothstep(1.05, 0.85, dist) * pow(max(1.0 - dist, 0.0), uFalloff);

  float intensity = max((ringGlow + spokeGlow + sweepBeam) * fade * uBrightness, 0.0);
  vec3 col = uColor * intensity + uBgColor;

  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`,G=T({__name:"Radar",props:{speed:{default:1},scale:{default:.5},ringCount:{default:10},spokeCount:{default:10},ringThickness:{default:.05},spokeThickness:{default:.01},sweepSpeed:{default:1},sweepWidth:{default:2},sweepLobes:{default:1},color:{default:"#27FF64"},backgroundColor:{default:"#000000"},falloff:{default:2},brightness:{default:1},enableMouseInteraction:{type:Boolean,default:!0},mouseInfluence:{default:.1}},setup(d){function l(t){const n=t.replace("#","");return[parseInt(n.slice(0,2),16)/255,parseInt(n.slice(2,4),16)/255,parseInt(n.slice(4,6),16)/255]}const e=d,c=x("containerRef");let s=null;const v=()=>{if(!c.value)return;const t=c.value,n=new M({alpha:!0,premultipliedAlpha:!1}),o=n.gl;o.clearColor(0,0,0,0);const i=[.5,.5];let r=[.5,.5];function m(u){const f=o.canvas.getBoundingClientRect();r=[(u.clientX-f.left)/f.width,1-(u.clientY-f.top)/f.height]}function h(){r=[.5,.5]}n.setSize(t.offsetWidth,t.offsetHeight);const k=new A(o),a=new b(o,{vertex:E,fragment:_,uniforms:{uTime:{value:0},uResolution:{value:[o.canvas.width,o.canvas.height,o.canvas.width/o.canvas.height]},uSpeed:{value:e.speed},uScale:{value:e.scale},uRingCount:{value:e.ringCount},uSpokeCount:{value:e.spokeCount},uRingThickness:{value:e.ringThickness},uSpokeThickness:{value:e.spokeThickness},uSweepSpeed:{value:e.sweepSpeed},uSweepWidth:{value:e.sweepWidth},uSweepLobes:{value:e.sweepLobes},uColor:{value:l(e.color)},uBgColor:{value:l(e.backgroundColor)},uFalloff:{value:e.falloff},uBrightness:{value:e.brightness},uMouse:{value:new Float32Array([.5,.5])},uMouseInfluence:{value:e.mouseInfluence},uEnableMouse:{value:e.enableMouseInteraction}}});function g(){n.setSize(t.offsetWidth,t.offsetHeight),a.uniforms.uResolution.value=[o.canvas.width,o.canvas.height,o.canvas.width/o.canvas.height]}window.addEventListener("resize",g);const S=new R(o,{geometry:k,program:a});t.appendChild(o.canvas),e.enableMouseInteraction&&(o.canvas.addEventListener("mousemove",m),o.canvas.addEventListener("mouseleave",h));let p;function w(u){p=requestAnimationFrame(w),a.uniforms.uTime.value=u*.001,e.enableMouseInteraction?(i[0]+=.05*(r[0]-i[0]),i[1]+=.05*(r[1]-i[1]),a.uniforms.uMouse.value[0]=i[0],a.uniforms.uMouse.value[1]=i[1]):(a.uniforms.uMouse.value[0]=.5,a.uniforms.uMouse.value[1]=.5),n.render({scene:S})}p=requestAnimationFrame(w),s=()=>{var u;cancelAnimationFrame(p),window.removeEventListener("resize",g),e.enableMouseInteraction&&(o.canvas.removeEventListener("mousemove",m),o.canvas.removeEventListener("mouseleave",h)),t.contains(o.canvas)&&t.removeChild(o.canvas),(u=o.getExtension("WEBGL_lose_context"))==null||u.loseContext()}};return I(()=>{v()}),y(()=>{s==null||s()}),B(()=>[e.speed,e.scale,e.ringCount,e.spokeCount,e.ringThickness,e.spokeThickness,e.sweepSpeed,e.sweepWidth,e.sweepLobes,e.color,e.backgroundColor,e.falloff,e.brightness,e.enableMouseInteraction,e.mouseInfluence],()=>{s==null||s(),v()}),(t,n)=>(F(),L("div",{ref_key:"containerRef",ref:c,class:"radar-canvas"},null,512))}});export{G as default};
