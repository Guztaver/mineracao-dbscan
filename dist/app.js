const state = {data: [], model: null, last: null, batchCsv: null};
const $ = (id) => document.getElementById(id);
const fmtPct = (number) => `${(number * 100).toFixed(1).replace('.', ',')}%`;
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

async function initialize() {
  try {
    if (!window.PULSO_DATA) throw new Error('Arquivos do modelo não encontrados. Rode os comandos do README.');
    state.data = window.PULSO_DATA.data;
    state.model = window.PULSO_DATA.model;
    $('count').textContent = state.data.length.toLocaleString('pt-BR');
    $('f1').textContent = fmtPct(state.model.metrics.test_f1);
    $('precision').textContent = fmtPct(state.model.metrics.test_precision);
    $('recall').textContent = fmtPct(state.model.metrics.test_recall);
    $('validation').textContent = `Holdout: ${state.model.metrics.train_rows.toLocaleString('pt-BR')} leituras no treino e ${state.model.metrics.test_rows.toLocaleString('pt-BR')} no teste. Precisão ${fmtPct(state.model.metrics.test_precision)}, revocação ${fmtPct(state.model.metrics.test_recall)} e F1 ${fmtPct(state.model.metrics.test_f1)} para as anomalias simuladas. Os valores refletem somente este conjunto artificial.`;
    drawChart();
  } catch (error) {
    $('validation').textContent = error.message;
    $('count').textContent = 'Indisponível';
    $('f1').textContent = '—';
  }
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const delimiter = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
  const splitLine = (line) => {
    const values = [];
    let value = '', quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && quoted && line[i + 1] === '"') { value += '"'; i++; }
      else if (char === '"') quoted = !quoted;
      else if (char === delimiter && !quoted) { values.push(value.trim()); value = ''; }
      else value += char;
    }
    values.push(value.trim());
    return values;
  };
  const headers = splitLine(lines[0]).map((name) => name.trim().toLowerCase());
  return lines.slice(1).filter((line) => line.trim()).map((line) => {
    const values = splitLine(line);
    return Object.fromEntries(headers.map((header, i) => [header, values[i] ?? '']));
  });
}

function classify(hour, consumption) {
  const {means, stds, core_points_scaled: cores, core_labels: labels, eps} = state.model;
  const point = [(hour - means[0]) / stds[0], (consumption - means[1]) / stds[1]];
  let bestIndex = -1, bestDistance = Infinity;
  for (let i = 0; i < cores.length; i++) {
    const d = distance(point, cores[i]);
    if (d < bestDistance) { bestDistance = d; bestIndex = i; }
  }
  const anomaly = bestIndex < 0 || bestDistance > eps;
  return {anomaly, cluster: anomaly ? -1 : labels[bestIndex], distance: bestDistance};
}

$('reading-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const hourRaw = $('hour').value.trim(), consumptionRaw = $('consumption').value.trim();
  setFieldError('hour', !hourRaw);
  setFieldError('consumption', !consumptionRaw);
  if (!hourRaw || !consumptionRaw) return showError('Preencha hora e consumo antes de verificar.');
  const hour = Number(hourRaw), consumption = Number(consumptionRaw);
  const hourInvalid = !Number.isFinite(hour) || hour < 0 || hour > 23.99;
  const consumptionInvalid = !Number.isFinite(consumption) || consumption < 0 || consumption > 50;
  setFieldError('hour', hourInvalid);
  setFieldError('consumption', consumptionInvalid);
  if (hourInvalid) return showError('A hora precisa estar entre 0 e 23,99. Corrija o campo e tente novamente.');
  if (consumptionInvalid) return showError('O consumo precisa estar entre 0 e 50 kWh. Corrija o campo e tente novamente.');
  const result = classify(hour, consumption);
  state.last = {hora: hour, consumo_kwh: consumption, ...result};
  const box = $('result');
  box.className = `result ${result.anomaly ? 'alert' : 'normal'}`;
  box.innerHTML = result.anomaly
    ? `<strong>Leitura fora do padrão</strong><br>Este ponto fica fora da região de maior concentração. Confira o equipamento ou a medição.<small>Distância ao núcleo mais próximo: ${result.distance.toFixed(2).replace('.', ',')} · raio eps: ${state.model.eps.toFixed(2).replace('.', ',')}</small>`
    : `<strong>Leitura dentro do padrão</strong><br>Este ponto fica próximo de uma região densa de leituras para horários semelhantes.<small>Distância ao núcleo mais próximo: ${result.distance.toFixed(2).replace('.', ',')} · raio eps: ${state.model.eps.toFixed(2).replace('.', ',')}</small>`;
  drawChart();
});

function setFieldError(id, invalid) {
  const input = $(id);
  if (invalid) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function showError(message) {
  $('result').className = 'result error';
  $('result').textContent = message;
}

let densityCache = {maxY: null, values: null, max: 0};

function computeDensity(maxY) {
  if (densityCache.values && densityCache.maxY === maxY) return densityCache;
  const {means, stds, core_points_scaled: cores, eps} = state.model;
  const cols = 76, rows = 40, values = new Float32Array((cols + 1) * (rows + 1));
  const bandwidth = eps * 0.68, cutoffSquared = (eps * 1.8) ** 2;
  let max = 0;
  for (let row = 0; row <= rows; row++) {
    const consumption = (1 - row / rows) * maxY;
    const sy = (consumption - means[1]) / stds[1];
    for (let col = 0; col <= cols; col++) {
      const hour = (col / cols) * 24;
      const sx = (hour - means[0]) / stds[0];
      let density = 0;
      for (let i = 0; i < cores.length; i++) {
        const dx = sx - cores[i][0], dy = sy - cores[i][1];
        const d2 = dx * dx + dy * dy;
        if (d2 < cutoffSquared) density += Math.exp(-d2 / (2 * bandwidth * bandwidth));
      }
      values[row * (cols + 1) + col] = density;
      if (density > max) max = density;
    }
  }
  densityCache = {cols, rows, maxY, values, max};
  return densityCache;
}

function drawContours(ctx, field, x0, y0, plotW, plotH) {
  const {cols, rows, values, max} = field;
  if (!max) return;
  const levels = [0.16, 0.29, 0.44, 0.62];
  const px = (col) => x0 + (col / cols) * plotW;
  const py = (row) => y0 + (row / rows) * plotH;
  const valueAt = (row, col) => values[row * (cols + 1) + col] / max;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cornerValues = [valueAt(row, col), valueAt(row, col + 1), valueAt(row + 1, col + 1), valueAt(row + 1, col)];
      const average = cornerValues.reduce((sum, value) => sum + value, 0) / 4;
      if (average > 0.08) {
        ctx.fillStyle = `rgba(62, 132, 165, ${Math.min(0.13, (average - 0.08) * 0.16)})`;
        ctx.fillRect(px(col), py(row), plotW / cols + 1, plotH / rows + 1);
      }
    }
  }
  const edgePoint = (a, b, threshold, ax, ay, bx, by) => {
    const t = Math.max(0, Math.min(1, (threshold - a) / (b - a || 1)));
    return [ax + (bx - ax) * t, ay + (by - ay) * t];
  };
  levels.forEach((threshold, index) => {
    ctx.beginPath();
    ctx.strokeStyle = ['rgba(91, 158, 184, .45)', 'rgba(112, 178, 199, .60)', 'rgba(159, 204, 216, .76)', 'rgba(208, 231, 234, .92)'][index];
    ctx.lineWidth = index === levels.length - 1 ? 1.45 : 1.05;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const [tl, tr, br, bl] = [valueAt(row, col), valueAt(row, col + 1), valueAt(row + 1, col + 1), valueAt(row + 1, col)];
        const edges = [];
        if ((tl < threshold) !== (tr < threshold)) edges.push(edgePoint(tl, tr, threshold, px(col), py(row), px(col + 1), py(row)));
        if ((tr < threshold) !== (br < threshold)) edges.push(edgePoint(tr, br, threshold, px(col + 1), py(row), px(col + 1), py(row + 1)));
        if ((br < threshold) !== (bl < threshold)) edges.push(edgePoint(br, bl, threshold, px(col + 1), py(row + 1), px(col), py(row + 1)));
        if ((bl < threshold) !== (tl < threshold)) edges.push(edgePoint(bl, tl, threshold, px(col), py(row + 1), px(col), py(row)));
        if (edges.length === 2) {
          ctx.moveTo(edges[0][0], edges[0][1]); ctx.lineTo(edges[1][0], edges[1][1]);
        } else if (edges.length === 4) {
          const centerHigh = (tl + tr + br + bl) / 4 >= threshold;
          const pairs = centerHigh ? [[0, 1], [2, 3]] : [[0, 3], [1, 2]];
          for (const [a, b] of pairs) { ctx.moveTo(edges[a][0], edges[a][1]); ctx.lineTo(edges[b][0], edges[b][1]); }
        }
      }
    }
    ctx.stroke();
  });
}

function drawChart() {
  const canvas = $('chart');
  if (!canvas || !state.data.length) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(ratio, ratio);
  const width = rect.width, height = rect.height;
  const margin = {left: 48, right: 17, top: 17, bottom: 40};
  const plotW = width - margin.left - margin.right, plotH = height - margin.top - margin.bottom;
  const maxY = Math.max(6, Math.ceil(Math.max(...state.data.map((p) => p.consumo_kwh), state.last?.consumo_kwh || 0)));
  const x = (v) => margin.left + (v / 24) * plotW;
  const y = (v) => margin.top + plotH - (v / maxY) * plotH;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0a2033'; ctx.fillRect(0, 0, width, height);
  ctx.font = '12px "Barlow Semi Condensed", sans-serif'; ctx.lineWidth = 1;
  ctx.save(); ctx.beginPath(); ctx.rect(margin.left, margin.top, plotW, plotH); ctx.clip();
  drawContours(ctx, computeDensity(maxY), margin.left, margin.top, plotW, plotH);
  ctx.strokeStyle = 'rgba(126, 164, 183, .14)';
  for (let h = 0; h <= 24; h += 4) {
    const px = x(h); ctx.beginPath(); ctx.moveTo(px, margin.top); ctx.lineTo(px, margin.top + plotH); ctx.stroke();
  }
  for (let kwh = 0; kwh <= maxY; kwh += Math.max(1, Math.ceil(maxY / 5))) {
    const py = y(kwh); ctx.beginPath(); ctx.moveTo(margin.left, py); ctx.lineTo(width - margin.right, py); ctx.stroke();
  }
  for (const point of state.data) {
    ctx.beginPath(); ctx.arc(x(point.hora), y(point.consumo_kwh), point.anomalia_simulada ? 2.4 : 2, 0, Math.PI * 2);
    ctx.fillStyle = point.anomalia_simulada ? 'rgba(179, 161, 247, .78)' : 'rgba(145, 202, 219, .58)'; ctx.fill();
  }
  if (state.last) {
    const px = x(state.last.hora), py = y(state.last.consumo_kwh);
    ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255, 195, 107, .42)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fillStyle = '#ffc36b'; ctx.fill();
    ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fillStyle = '#172333'; ctx.fill();
    ctx.font = '600 11px "Barlow Semi Condensed", sans-serif'; ctx.fillStyle = '#ffe0ae';
    ctx.textAlign = px < width - 100 ? 'left' : 'right';
    ctx.fillText('SUA LEITURA', px < width - 100 ? px + 13 : px - 13, Math.max(margin.top + 12, py - 13));
  }
  ctx.restore();
  ctx.font = '12px "Barlow Semi Condensed", sans-serif'; ctx.fillStyle = '#b0c5cf'; ctx.textAlign = 'center';
  for (let h = 0; h <= 24; h += 4) ctx.fillText(String(h), x(h), height - 13);
  ctx.textAlign = 'right';
  for (let kwh = 0; kwh <= maxY; kwh += Math.max(1, Math.ceil(maxY / 5))) ctx.fillText(String(kwh), margin.left - 9, y(kwh) + 4);
  ctx.fillStyle = '#d1dfe5'; ctx.textAlign = 'center'; ctx.font = '500 13px "Barlow Semi Condensed", sans-serif';
  ctx.fillText('Hora do dia', margin.left + plotW / 2, height - 1);
  ctx.save(); ctx.translate(13, margin.top + plotH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Consumo (kWh)', 0, 0); ctx.restore();
}

let lastCsvResult = '';
$('csv-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const rows = parseCsv(await file.text());
  if (!rows.length || !('hora' in rows[0]) || !('consumo_kwh' in rows[0])) {
    $('batch-message').textContent = 'CSV inválido. Inclua os cabeçalhos hora e consumo_kwh.'; $('download').classList.add('hidden'); return;
  }
  const results = [];
  for (let i = 0; i < rows.length; i++) {
    const hourRaw = String(rows[i].hora ?? '').trim(), consumptionRaw = String(rows[i].consumo_kwh ?? '').trim();
    const hour = Number(hourRaw.replace(',', '.')), consumption = Number(consumptionRaw.replace(',', '.'));
    if (!hourRaw || !consumptionRaw || !Number.isFinite(hour) || !Number.isFinite(consumption) || hour < 0 || hour > 23.99 || consumption < 0 || consumption > 50) {
      $('batch-message').textContent = `Linha ${i + 2}: valores inválidos. Hora: 0 a 23,99; consumo: 0 a 50 kWh.`; $('download').classList.add('hidden'); return;
    }
    const result = classify(hour, consumption);
    results.push({...rows[i], resultado: result.anomaly ? 'Fora do padrão' : 'Normal', distancia_padronizada: result.distance.toFixed(4)});
  }
  const headers = [...new Set(results.flatMap(Object.keys))];
  lastCsvResult = [headers.join(','), ...results.map((row) => headers.map((h) => `"${String(row[h] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n');
  const anomalies = results.filter((row) => row.resultado === 'Fora do padrão').length;
  $('batch-message').textContent = `${results.length} leituras analisadas · ${anomalies} fora do padrão.`;
  $('download').classList.remove('hidden');
});

$('download').addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob(['\uFEFF', lastCsvResult], {type: 'text/csv;charset=utf-8'}));
  link.download = 'leituras_classificadas.csv'; link.click(); URL.revokeObjectURL(link.href);
});

window.addEventListener('resize', drawChart);
initialize();
