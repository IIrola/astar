import { WIDTH, HEIGHT, TYPES, coords, idOf } from '../shared/constants.js';

export class TacticalRadar {
  constructor(canvas, tooltip) {
    this.canvas = canvas;
    this.tooltip = tooltip;
    this.ctx = canvas.getContext('2d');
    this.resizeObserver = new ResizeObserver(() => this.draw());
    this.resizeObserver.observe(canvas);
    canvas.addEventListener('pointermove', (event) => this.showTooltip(event));
    canvas.addEventListener('pointerleave', () => {
      this.tooltip.hidden = true;
    });
  }
  update(state, graph) {
    this.state = state;
    this.graph = graph;
    this.draw();
  }
  draw() {
    if (!this.state) return;
    const { canvas, ctx, state, graph } = this;
    const width = canvas.clientWidth,
      height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const cw = width / WIDTH,
      ch = height / HEIGHT;
    this.cw = cw;
    this.ch = ch;
    ctx.fillStyle = '#09151f';
    ctx.fillRect(0, 0, width, height);
    const visited = new Set(state.trail),
      discarded = new Set(state.discarded);
    for (let z = 0; z < HEIGHT; z++)
      for (let x = 0; x < WIDTH; x++) {
        const id = idOf(x, z),
          type = state.known[id],
          px = x * cw,
          py = z * ch;
        const sector = Math.floor(x / 8);
        ctx.fillStyle =
          type === null
            ? ['#0b1923', '#0d1c25', '#151b2b'][sector]
            : ['#122833', '#152b33', '#20273b'][sector];
        if (visited.has(id)) ctx.fillStyle = '#153e43';
        if (discarded.has(id)) ctx.fillStyle = '#4c3928';
        ctx.fillRect(px + 1, py + 1, cw - 2, ch - 2);
        ctx.strokeStyle = '#20313e88';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, cw, ch);
        if (type === TYPES.SOLID) {
          const structural = graph.sectorWalls.includes(id);
          ctx.fillStyle = structural ? '#344552' : '#915d50';
          ctx.fillRect(px + cw * 0.23, py + ch * 0.22, cw * 0.54, ch * 0.56);
          if (!structural) {
            ctx.strokeStyle = '#e49b7c';
            ctx.lineWidth = 0.65;
            ctx.beginPath();
            ctx.moveTo(px + cw * 0.33, py + ch * 0.33);
            ctx.lineTo(px + cw * 0.67, py + ch * 0.67);
            ctx.moveTo(px + cw * 0.67, py + ch * 0.33);
            ctx.lineTo(px + cw * 0.33, py + ch * 0.67);
            ctx.stroke();
          }
        } else if (type === TYPES.ANOMALY) {
          ctx.save();
          ctx.translate(px + cw / 2, py + ch / 2);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = '#d9aa60';
          ctx.fillRect(-cw * 0.16, -cw * 0.16, cw * 0.32, cw * 0.32);
          ctx.restore();
        } else if (type === TYPES.GATE || type === TYPES.WORMHOLE) {
          ctx.strokeStyle = type === TYPES.GATE ? '#66cfc1' : '#b293dd';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(px + cw / 2, py + ch / 2, cw * 0.28, ch * 0.34, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (type === null) {
          ctx.fillStyle = '#2b43504a';
          ctx.fillRect(px + cw / 2, py + ch / 2, 1, 1);
        }
      }
    const center = (id) => {
      const { x, z } = coords(id);
      return [x * cw + cw / 2, z * ch + ch / 2];
    };
    const line = (ids, color, dashed, lineWidth = 1) => {
      if (ids.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(dashed ? [3, 4] : []);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ids.forEach((id, i) => {
        const p = center(id);
        if (i) ctx.lineTo(...p);
        else ctx.moveTo(...p);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    };
    line(state.trail, '#327c83', false, 1.5);
    line(
      state.report?.optimalPath ?? state.route,
      state.report ? '#a99bdf' : '#74e5cf',
      true,
      1.15,
    );
    const [sx, sy] = center(graph.start);
    ctx.strokeStyle = '#6cb1b9';
    ctx.strokeRect(sx - cw * 0.22, sy - ch * 0.23, cw * 0.44, ch * 0.46);
    const [gx, gy] = center(graph.goal);
    ctx.strokeStyle = state.report ? '#78e7d0' : '#edb575';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(gx - cw * 0.32, gy - ch * 0.34, cw * 0.64, ch * 0.68);
    ctx.beginPath();
    ctx.moveTo(gx - cw * 0.12, gy);
    ctx.lineTo(gx + cw * 0.12, gy);
    ctx.moveTo(gx, gy - ch * 0.12);
    ctx.lineTo(gx, gy + ch * 0.12);
    ctx.stroke();
    const [nx, ny] = center(state.node);
    ctx.strokeStyle = '#7de2d63b';
    ctx.fillStyle = '#65e6d409';
    ctx.lineWidth = 1;
    // A cross marks the four cardinal neighbors; diagonals remain outside sensor range.
    for (const id of graph.neighbors(state.node)) {
      const { x, z } = coords(id);
      ctx.fillRect(x * cw, z * ch, cw, ch);
      ctx.strokeRect(x * cw + 0.5, z * ch + 0.5, cw - 1, ch - 1);
    }
    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate(Math.atan2(state.heading.dz, state.heading.dx));
    ctx.shadowColor = '#7bffe0';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#9af6dd';
    ctx.beginPath();
    const size = Math.min(cw, ch) * 0.38;
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.8, -size * 0.75);
    ctx.lineTo(-size * 0.4, 0);
    ctx.lineTo(-size * 0.8, size * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    for (const x of [8, 16]) {
      ctx.strokeStyle = '#4c6a7755';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x * cw, 0);
      ctx.lineTo(x * cw, height);
      ctx.stroke();
    }
    canvas.setAttribute(
      'aria-label',
      `Mapa táctico 24 por 14. Nave en (${coords(state.node).x}, ${coords(state.node).z}). Coste ${state.g}. ${state.known.filter((v) => v !== null).length} nodos conocidos.`,
    );
  }
  showTooltip(event) {
    if (!this.state) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.min(WIDTH - 1, Math.max(0, Math.floor((event.clientX - rect.left) / this.cw)));
    const z = Math.min(HEIGHT - 1, Math.max(0, Math.floor((event.clientY - rect.top) / this.ch)));
    const id = idOf(x, z),
      type = this.state.known[id];
    const labels = {
      clear: 'Despejado · +1',
      anomaly: 'Anomalía · +2',
      solid: 'Intransitable · ∞',
      gate: 'Ventana atmosférica · +1',
      wormhole: 'Agujero de gusano · +1',
    };
    this.tooltip.textContent = `(${x}, ${z}) · ${id === this.graph.goal ? 'Fugitivo' : id === this.state.node ? 'Nave' : (labels[type] ?? 'Sin explorar')}`;
    this.tooltip.hidden = false;
  }
}
