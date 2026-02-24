export function buildEmbeddedAnimatorScript(serializedItems: string, fr: number, ip: number, op: number): string {
  return `
(function(){
  const items = ${serializedItems};
  const fr = ${fr};
  const ip = ${ip};
  const op = ${op};
  const duration = Math.max(0.0001, (op - ip) / fr);

  function bezierAt(t, p0, p1, p2, p3){
    const mt = 1 - t;
    return mt*mt*mt*p0 + 3*mt*mt*t*p1 + 3*mt*t*t*p2 + t*t*t*p3;
  }

  function cubicBezierY(x1,y1,x2,y2,t){
    let u = t;
    for (let i=0; i<5; i+=1) {
      const x = bezierAt(u,0,x1,x2,1);
      const dx = 3*(1-u)*(1-u)*x1 + 6*(1-u)*u*(x2-x1) + 3*u*u*(1-x2);
      if (Math.abs(dx) < 1e-6) break;
      u -= (x - t) / dx;
      if (u < 0) u = 0;
      if (u > 1) u = 1;
    }
    return bezierAt(u,0,y1,y2,1);
  }

  function pick(arr, fallback){
    return Array.isArray(arr) ? (arr[0] ?? fallback) : (arr ?? fallback);
  }

  function valueAtFrame(frame, frames, fallback){
    if (!frames || !frames.length) return fallback;
    if (frame <= frames[0].t) return frames[0].s;
    for (let i=0; i<frames.length-1; i+=1){
      const a = frames[i];
      const b = frames[i+1];
      if (frame < b.t) {
        const span = Math.max(1e-6, b.t - a.t);
        let t = (frame - a.t) / span;
        if (a.h === 1) t = 0;
        else {
          const x1 = pick(a.o && a.o.x, 0.667);
          const y1 = pick(a.o && a.o.y, 0.667);
          const x2 = pick(a.i && a.i.x, 0.333);
          const y2 = pick(a.i && a.i.y, 0.333);
          t = cubicBezierY(x1,y1,x2,y2,t);
        }
        return a.s + (b.s - a.s) * t;
      }
    }
    return frames[frames.length-1].s;
  }

  const startTime = performance.now();
  function tick(now){
    const elapsed = ((now - startTime) / 1000) % duration;
    const frame = ip + elapsed * fr;

    for (const item of items){
      const el = document.getElementById(item.id);
      if (!el) continue;

      const start = valueAtFrame(frame, item.startKf, item.start);
      const end = valueAtFrame(frame, item.endKf, item.end);
      const offset = valueAtFrame(frame, item.offsetKf, item.offset);

      const span = Math.max(0, end - start);
      const visible = (span / 100) * item.length;
      const dashOffset = item.length * (1 - end / 100) - (offset / 360) * item.length;

      el.setAttribute('stroke-dasharray', String(Math.max(0.0001, visible)));
      el.setAttribute('stroke-dashoffset', String(dashOffset));
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();`;
}
