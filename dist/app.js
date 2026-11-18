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
    $('f1-small').textContent = fmtPct(state.model.metrics.test_f1);
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
  if (!hourRaw || !consumptionRaw) return showError('Preencha hora e consumo antes de verificar.');
  const hour = Number(hourRaw), consumption = Number(consumptionRaw);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23.99) return showError('Informe uma hora entre 0 e 23,99.');
  if (!Number.isFinite(consumption) || consumption < 0 || consumption > 50) return showError('Informe um consumo entre 0 e 50 kWh.');
  const result = classify(hour, consumption);
  state.last = {hora: hour, consumo_kwh: consumption, ...result};
  const box = $('result');
  box.className = `result ${result.anomaly ? 'alert' : 'normal'}`;
  box.innerHTML = result.anomaly
    ? `<strong>⚠ Leitura fora do padrão</strong><br>O consumo se distancia das leituras típicas observadas para esse horário. Vale conferir o equipamento ou a medição.<small>Distância padronizada ao núcleo mais próximo: ${result.distance.toFixed(2).replace('.', ',')} · eps: ${state.model.eps.toFixed(2).replace('.', ',')}</small>`
    : `<strong>✓ Leitura dentro do padrão</strong><br>A leitura está próxima de um grupo denso de consumos observados em horários semelhantes.<small>Distância padronizada ao núcleo mais próximo: ${result.distance.toFixed(2).replace('.', ',')} · eps: ${state.model.eps.toFixed(2).replace('.', ',')}</small>`;
  drawChart();
});

function showError(message) {
  $('result').className = 'result alert';
  $('result').textContent = message;
}

function drawChart() {
  const canvas = $('chart');
  if (!canvas || !state.data.length) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  const width = rect.width, height = rect.height;
  const margin = {left: 43, right: 13, top: 15, bottom: 37};
  const plotW = width - margin.left - margin.right, plotH = height - margin.top - margin.bottom;
  const maxY = Math.max(6, Math.ceil(Math.max(...state.data.map((p) => p.consumo_kwh), state.last?.consumo_kwh || 0)));
  const x = (v) => margin.left + (v / 24) * plotW;
  const y = (v) => margin.top + plotH - (v / maxY) * plotH;
  ctx.clearRect(0, 0, width, height);
  ctx.font = '10px Arial'; ctx.lineWidth = 1;
  ctx.strokeStyle = '#e8efee'; ctx.fillStyle = '#829196';
  for (let h = 0; h <= 24; h += 4) {
    const px = x(h); ctx.beginPath(); ctx.moveTo(px, margin.top); ctx.lineTo(px, margin.top + plotH); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillText(String(h), px, height - 12);
  }
  for (let kwh = 0; kwh <= maxY; kwh += Math.max(1, Math.ceil(maxY / 5))) {
    const py = y(kwh); ctx.beginPath(); ctx.moveTo(margin.left, py); ctx.lineTo(width - margin.right, py); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillText(String(kwh), margin.left - 7, py + 3);
  }
  ctx.fillStyle = '#5c7075'; ctx.textAlign = 'center'; ctx.fillText('Hora do dia', margin.left + plotW / 2, height - 1);
  ctx.save(); ctx.translate(12, margin.top + plotH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Consumo (kWh)', 0, 0); ctx.restore();
  for (const point of state.data) {
    ctx.beginPath(); ctx.arc(x(point.hora), y(point.consumo_kwh), point.anomalia_simulada ? 2.2 : 1.9, 0, Math.PI * 2);
    ctx.fillStyle = point.anomalia_simulada ? 'rgba(231,124,83,.66)' : 'rgba(70,159,145,.43)'; ctx.fill();
  }
  if (state.last) {
    const px = x(state.last.hora), py = y(state.last.consumo_kwh);
    ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fillStyle = '#173340'; ctx.fill();
    ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  }
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
