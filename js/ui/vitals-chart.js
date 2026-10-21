// WardWell EHR - Lightweight Animated Vitals Trend Chart (Vanilla SVG)
export function renderVitalsChart(container, vitalsData = []) {
  if (!container) return;

  if (!vitalsData || vitalsData.length === 0) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 0.88rem;">
        No vitals data recorded yet to display trend.
      </div>
    `;
    return;
  }

  // Sort chronological
  const sorted = [...vitalsData].sort((a, b) => new Date(a.dateTime || a.date) - new Date(b.dateTime || b.date));

  const width = container.clientWidth || 800;
  const height = 240;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Extract data series
  const labels = sorted.map(d => {
    const raw = d.dateTime || `${d.date || ''} ${d.time || ''}`;
    try {
      const dt = new Date(raw);
      if (!isNaN(dt.getTime())) {
        return `${dt.getMonth() + 1}/${dt.getDate()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      }
    } catch {}
    return d.time || raw || '';
  });

  const temps = sorted.map(d => parseFloat(d.temp)).filter(v => !isNaN(v));
  const pulses = sorted.map(d => parseFloat(d.pulse || d.hr)).filter(v => !isNaN(v));
  const bpHs = sorted.map(d => {
    if (!d.bp) return null;
    const parts = d.bp.split('/');
    return parseFloat(parts[0]);
  });
  const bpLs = sorted.map(d => {
    if (!d.bp) return null;
    const parts = d.bp.split('/');
    return parseFloat(parts[1]);
  });

  // Calculate scales
  // Left Axis: Heart Rate & BP (range ~ 40 to 180)
  const minValLeft = 40;
  const maxValLeft = 180;

  // Right Axis: Temp (range 35 to 40)
  const minTemp = 35.0;
  const maxTemp = 40.0;

  const count = sorted.length;
  const getX = (i) => padding.left + (count > 1 ? (i / (count - 1)) * chartW : chartW / 2);
  const getYLeft = (val) => padding.top + chartH - ((val - minValLeft) / (maxValLeft - minValLeft)) * chartH;
  const getYTemp = (val) => padding.top + chartH - ((val - minTemp) / (maxTemp - minTemp)) * chartH;

  // Build gridlines
  let gridHtml = '';
  const ySteps = 4;
  for (let s = 0; s <= ySteps; s++) {
    const yVal = minValLeft + (s / ySteps) * (maxValLeft - minValLeft);
    const yPos = padding.top + chartH - (s / ySteps) * chartH;
    gridHtml += `
      <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="var(--border-light)" stroke-width="1" stroke-dasharray="3,3" />
      <text x="${padding.left - 8}" y="${yPos + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end" font-family="var(--font-sans)">${Math.round(yVal)}</text>
    `;
  }

  // Build series paths
  function createLinePath(vals, getYFn) {
    let d = '';
    vals.forEach((v, i) => {
      if (v === null || isNaN(v)) return;
      const x = getX(i);
      const y = Math.max(padding.top, Math.min(padding.top + chartH, getYFn(v)));
      if (d === '') d += `M ${x} ${y}`;
      else d += ` L ${x} ${y}`;
    });
    return d;
  }

  const bpHighPath = createLinePath(bpHs, getYLeft);
  const bpLowPath = createLinePath(bpLs, getYLeft);
  const pulsePath = createLinePath(pulses, getYLeft);
  const tempPath = createLinePath(temps, getYTemp);

  // Dots
  let dotsHtml = '';
  sorted.forEach((d, i) => {
    const x = getX(i);
    const bpSys = bpHs[i];
    const bpDia = bpLs[i];
    const p = pulses[i];
    const t = temps[i];

    if (bpSys && !isNaN(bpSys)) {
      dotsHtml += `<circle cx="${x}" cy="${getYLeft(bpSys)}" r="4" fill="#3f603d" stroke="#fff" stroke-width="1.5"><title>BP Sys: ${bpSys}</title></circle>`;
    }
    if (bpDia && !isNaN(bpDia)) {
      dotsHtml += `<circle cx="${x}" cy="${getYLeft(bpDia)}" r="4" fill="#60805e" stroke="#fff" stroke-width="1.5"><title>BP Dia: ${bpDia}</title></circle>`;
    }
    if (p && !isNaN(p)) {
      dotsHtml += `<circle cx="${x}" cy="${getYLeft(p)}" r="4" fill="#d32f2f" stroke="#fff" stroke-width="1.5"><title>Pulse/HR: ${p} bpm</title></circle>`;
    }
    if (t && !isNaN(t)) {
      dotsHtml += `<circle cx="${x}" cy="${getYTemp(t)}" r="4" fill="#000000" stroke="#fff" stroke-width="1.5"><title>Temp: ${t} °C</title></circle>`;
    }

    // X Axis Label
    if (count <= 8 || i % Math.ceil(count / 8) === 0 || i === count - 1) {
      dotsHtml += `<text x="${x}" y="${height - 10}" fill="var(--text-secondary)" font-size="9" text-anchor="middle" font-family="var(--font-sans)">${labels[i]}</text>`;
    }
  });

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%; overflow: visible;">
      <!-- Grid -->
      ${gridHtml}

      <!-- Series Lines with animated dashoffset -->
      <path d="${bpHighPath}" fill="none" stroke="#3f603d" stroke-width="2.5" class="chart-line" />
      <path d="${bpLowPath}" fill="none" stroke="#60805e" stroke-width="2" stroke-dasharray="4,2" class="chart-line" />
      <path d="${pulsePath}" fill="none" stroke="#d32f2f" stroke-width="2.5" class="chart-line" />
      <path d="${tempPath}" fill="none" stroke="#000000" stroke-width="2.5" class="chart-line" />

      <!-- Data Dots -->
      ${dotsHtml}
    </svg>
  `;
}
