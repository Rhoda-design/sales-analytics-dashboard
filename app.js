/**
 * PulseSales Dashboard Application Logic
 * Pure Vanilla JavaScript with WebStorage Persistence
 * Zero external libraries or CSS variables
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY = 'pulsesales_transactions_store_v1';
  const MONTHLY_TARGET = 100000; // $100,000 monthly sales quota

  const CATEGORY_COLORS = {
    'Software': '#3b82f6',
    'Subscriptions': '#10b981',
    'Services': '#8b5cf6',
    'Hardware': '#f59e0b'
  };

  // --- Application State ---
  const state = {
    transactions: [],
    currentPeriod: 'all', // 'all', '30', '14', '7'
    chartMetric: 'revenue', // 'revenue' | 'orders'
    tableSearch: '',
    tableCategory: 'all',
    tableStatus: 'all',
    sortColumn: 'date',
    sortDirection: 'desc',
    currentPage: 1,
    rowsPerPage: 8,
    activeChartHoverIndex: null
  };

  // --- Realistic Default Seed Data Generation ---
  function generateSeedData() {
    const customers = [
      { name: 'Elena Rostova', email: 'elena@novatech.io' },
      { name: 'Marcus Vance', email: 'm.vance@apexlogistics.com' },
      { name: 'Sophia Sterling', email: 'sophia@sterlingfin.co' },
      { name: 'Priya Sharma', email: 'priya@cloudsync.org' },
      { name: 'Liam O’Connor', email: 'liam@dublindesign.ie' },
      { name: 'Jordan Miller', email: 'jordan@hypergrowth.tech' },
      { name: 'Chloe Dubois', email: 'chloe.d@atelierlum.fr' },
      { name: 'Mateo Alvarez', email: 'mateo@solarmetrics.mx' },
      { name: 'Aiden Brooks', email: 'abrooks@streamflow.net' },
      { name: 'Zoe Nakamura', email: 'zoe@tokyoedge.jp' },
      { name: 'Alexander Wright', email: 'awright@quantumcore.com' },
      { name: 'Hannah Schmidt', email: 'hannah@berlinops.de' },
      { name: 'David Kim', email: 'dkim@seoulventures.kr' },
      { name: 'Isabella Rossi', email: 'isabella@milanochain.it' },
      { name: 'Benjamin Chen', email: 'ben.chen@pacificaero.sg' },
      { name: 'Nadia Petrov', email: 'nadia@nordicsolutions.se' },
      { name: 'Lucas Ferreira', email: 'lucas@saopauloai.br' },
      { name: 'Amira Hassan', email: 'amira@dubaiinnovate.ae' }
    ];

    const products = [
      { title: 'Enterprise Cloud Suite', category: 'Software', min: 2800, max: 5400 },
      { title: 'Pro Analytics Tier', category: 'Subscriptions', min: 799, max: 1499 },
      { title: 'API Gateway License', category: 'Software', min: 1200, max: 2400 },
      { title: 'Strategic Architecture Audit', category: 'Services', min: 3500, max: 6800 },
      { title: 'Team Collaboration Seats', category: 'Subscriptions', min: 450, max: 950 },
      { title: 'Edge Hardware Gateway', category: 'Hardware', min: 990, max: 1850 },
      { title: 'Dedicated DevOps Retainer', category: 'Services', min: 2500, max: 4500 },
      { title: 'IoT Sensor Cluster Kit', category: 'Hardware', min: 650, max: 1400 }
    ];

    const channels = ['Direct Sales', 'Online Store', 'Partner Referral', 'Inbound Call'];
    const statuses = ['completed', 'completed', 'completed', 'completed', 'pending', 'refunded'];

    const seed = [];
    const baseDate = new Date(2026, 10, 1); // Nov 1, 2026 (matching system date)

    // Generate 48 transactions distributed over last 85 days
    for (let i = 1; i <= 48; i++) {
      const daysAgo = Math.floor((i * 1.7) + (Math.sin(i) * 3));
      const transDate = new Date(baseDate);
      transDate.setDate(baseDate.getDate() - daysAgo);

      const customer = customers[i % customers.length];
      const prod = products[i % products.length];
      const channel = channels[(i * 3) % channels.length];
      const status = statuses[i % statuses.length];

      // Realistic varied price
      const priceSpread = prod.max - prod.min;
      const amount = Math.round((prod.min + ((i * 19) % priceSpread)) * 100) / 100;

      const orderNum = (1000 + (i * 37) % 8999).toString();

      seed.push({
        id: `ORD-${orderNum}`,
        customer: customer.name,
        email: customer.email,
        product: prod.title,
        category: prod.category,
        amount: amount,
        channel: channel,
        status: status,
        date: transDate.toISOString().split('T')[0]
      });
    }

    // Sort descending by date
    seed.sort((a, b) => new Date(b.date) - new Date(a.date));
    return seed;
  }

  // --- WebStorage Persistence Handlers ---
  function loadTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read from WebStorage:', e);
    }
    const seed = generateSeedData();
    saveTransactions(seed);
    return seed;
  }

  function saveTransactions(data) {
    state.transactions = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      showToast('Storage quota exceeded or disabled', 'error');
    }
    refreshDashboard();
  }

  function resetToDefaultData() {
    if (confirm('Are you sure you want to reset all records to the original default sample dataset? Any added transactions will be lost.')) {
      const freshSeed = generateSeedData();
      saveTransactions(freshSeed);
      showToast('Sample dataset restored successfully!', 'success');
    }
  }

  // --- Filtering & Metric Calculations ---
  function getFilteredByPeriod(transactions, period) {
    if (period === 'all') return transactions;
    const days = parseInt(period, 10);
    const cutoff = new Date(2026, 10, 1);
    cutoff.setDate(cutoff.getDate() - days);

    return transactions.filter(t => new Date(t.date) >= cutoff);
  }

  function formatCurrency(val) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  }

  function formatCurrencyExact(val) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  }

  function updateKpis(activeData) {
    let grossRev = 0;
    let netRev = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let refundedCount = 0;
    let maxDeal = 0;

    activeData.forEach(item => {
      grossRev += item.amount;
      if (item.status === 'completed') {
        netRev += item.amount;
        completedCount++;
        if (item.amount > maxDeal) maxDeal = item.amount;
      } else if (item.status === 'pending') {
        pendingCount++;
      } else if (item.status === 'refunded') {
        refundedCount++;
      }
    });

    const aov = completedCount > 0 ? netRev / completedCount : 0;
    const totalTransactions = activeData.length;
    const successRate = totalTransactions > 0 ? (completedCount / totalTransactions) * 100 : 0;

    // DOM Updates
    document.getElementById('kpi-gross-revenue').textContent = formatCurrency(grossRev);
    document.getElementById('kpi-net-revenue').textContent = formatCurrency(netRev);
    document.getElementById('kpi-order-count').textContent = completedCount.toLocaleString();
    document.getElementById('kpi-pending-count').textContent = `${pendingCount} pending payment`;
    document.getElementById('kpi-aov').textContent = formatCurrencyExact(aov);
    document.getElementById('kpi-highest-deal').textContent = `Peak deal: ${formatCurrency(maxDeal)}`;
    document.getElementById('kpi-success-rate').textContent = `${successRate.toFixed(1)}%`;
    document.getElementById('kpi-refund-count').textContent = `${refundedCount} refunded (${((refundedCount / (totalTransactions || 1)) * 100).toFixed(1)}%)`;

    // Monthly quota in sidebar (filter transactions from Oct/Nov 2026)
    const currentMonthPrefix = '2026-10'; // or '2026-11'
    let currentMonthRevenue = 0;
    state.transactions.forEach(t => {
      if (t.status === 'completed' && (t.date.startsWith('2026-10') || t.date.startsWith('2026-11'))) {
        currentMonthRevenue += t.amount;
      }
    });

    const quotaPct = Math.min(100, Math.round((currentMonthRevenue / MONTHLY_TARGET) * 100));
    const quotaFillEl = document.getElementById('quota-bar-fill');
    if (quotaFillEl) quotaFillEl.style.width = `${quotaPct}%`;
    const quotaTextEl = document.getElementById('quota-percent-text');
    if (quotaTextEl) quotaTextEl.textContent = `${quotaPct}%`;
    const quotaActualEl = document.getElementById('quota-actual');
    if (quotaActualEl) quotaActualEl.textContent = formatCurrency(currentMonthRevenue);
    const quotaTargetEl = document.getElementById('quota-target');
    if (quotaTargetEl) quotaTargetEl.textContent = formatCurrency(MONTHLY_TARGET);
  }

  // --- Chart 1: Revenue & Orders Over Time (Line Chart) ---
  let lineChartDataCache = [];

  function drawRevenueLineChart(activeData) {
    const canvas = document.getElementById('revenueLineChart');
    if (!canvas) return;

    // Handle high DPI
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = 280;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Group active transactions by date
    const dateMap = {};
    activeData.forEach(item => {
      if (!dateMap[item.date]) {
        dateMap[item.date] = { date: item.date, revenue: 0, orders: 0 };
      }
      if (item.status !== 'refunded') {
        dateMap[item.date].revenue += item.amount;
      }
      if (item.status === 'completed') {
        dateMap[item.date].orders += 1;
      }
    });

    // Sort chronologically
    const sortedDates = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    lineChartDataCache = sortedDates;

    if (sortedDates.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No transaction data found for this period', width / 2, height / 2);
      return;
    }

    const padding = { top: 25, right: 30, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const metric = state.chartMetric; // 'revenue' or 'orders'
    const values = sortedDates.map(d => d[metric]);
    const maxVal = Math.max(...values, metric === 'revenue' ? 1000 : 5) * 1.15;
    const minVal = 0;

    // Draw horizontal grid lines & Y-axis labels
    const gridLines = 4;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b';
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      const labelVal = maxVal - (maxVal / gridLines) * i;

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const text = metric === 'revenue' ? formatCurrency(labelVal) : Math.round(labelVal).toString();
      ctx.fillText(text, padding.left - 10, y + 4);
    }

    // Coordinate mapping
    const points = sortedDates.map((item, index) => {
      const x = padding.left + (index / (sortedDates.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((item[metric] - minVal) / (maxVal - minVal)) * chartHeight;
      return { x, y, data: item };
    });

    // Store points for tooltip hit testing
    canvas._chartPoints = points;

    // Draw area fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartHeight);
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.lineTo(pt.x, pt.y);
      else {
        const prev = points[idx - 1];
        const cpX = (prev.x + pt.x) / 2;
        ctx.bezierCurveTo(cpX, prev.y, cpX, pt.y, pt.x, pt.y);
      }
    });
    ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.00)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line stroke
    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else {
        const prev = points[idx - 1];
        const cpX = (prev.x + pt.x) / 2;
        ctx.bezierCurveTo(cpX, prev.y, cpX, pt.y, pt.x, pt.y);
      }
    });
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw dots and X-axis labels
    const step = Math.max(1, Math.floor(sortedDates.length / 6));
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';

    points.forEach((pt, idx) => {
      if (idx % step === 0 || idx === points.length - 1) {
        // Date label
        const d = new Date(pt.data.date);
        const month = d.toLocaleString('en-US', { month: 'short' });
        const day = d.getDate();
        ctx.fillText(`${month} ${day}`, pt.x, height - 14);

        // Dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#090d16';
        ctx.stroke();
      }
    });

    // Draw active hover highlight if present
    if (state.activeChartHoverIndex !== null && points[state.activeChartHoverIndex]) {
      const activePt = points[state.activeChartHoverIndex];
      // Vertical guide
      ctx.beginPath();
      ctx.moveTo(activePt.x, padding.top);
      ctx.lineTo(activePt.x, padding.top + chartHeight);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Glow circle
      ctx.beginPath();
      ctx.arc(activePt.x, activePt.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2563eb';
      ctx.stroke();
    }
  }

  // --- Chart 2: Category Donut Chart ---
  function drawCategoryDonutChart(activeData) {
    const canvas = document.getElementById('categoryDonutChart');
    if (!canvas) return;

    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(container.clientWidth, 190);

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    // Calculate totals by category
    const catMap = {
      'Software': 0,
      'Subscriptions': 0,
      'Services': 0,
      'Hardware': 0
    };

    let totalEarned = 0;
    activeData.forEach(item => {
      if (item.status !== 'refunded') {
        const cat = item.category || 'Software';
        catMap[cat] = (catMap[cat] || 0) + item.amount;
        totalEarned += item.amount;
      }
    });

    const entries = Object.keys(catMap).map(k => ({
      name: k,
      amount: catMap[k],
      color: CATEGORY_COLORS[k] || '#38bdf8',
      pct: totalEarned > 0 ? (catMap[k] / totalEarned) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);

    // Update legend DOM
    const legendEl = document.getElementById('category-legend');
    if (legendEl) {
      legendEl.innerHTML = entries.map(item => `
        <div class="legend-item">
          <div class="legend-label-group">
            <span class="legend-color-dot" style="background-color: ${item.color};"></span>
            <span class="legend-name">${item.name}</span>
          </div>
          <div class="legend-value-group">
            <span class="legend-amount">${formatCurrency(item.amount)}</span>
            <span class="legend-pct">${item.pct.toFixed(0)}%</span>
          </div>
        </div>
      `).join('');
    }

    // Render Canvas Donut
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.44;
    const innerRadius = size * 0.30;

    let startAngle = -Math.PI / 2;

    if (totalEarned === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = radius - innerRadius;
      ctx.stroke();
      return;
    }

    entries.forEach(entry => {
      const sliceAngle = (entry.amount / totalEarned) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius + innerRadius) / 2, startAngle, endAngle);
      ctx.strokeStyle = entry.color;
      ctx.lineWidth = radius - innerRadius;
      ctx.stroke();

      startAngle = endAngle;
    });

    // Center cutout text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText('Total', centerX, centerY - 8);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(formatCurrency(totalEarned), centerX, centerY + 10);
  }

  // --- Chart 3: Channel Performance Bar Chart ---
  function drawChannelBarChart(activeData) {
    const canvas = document.getElementById('channelBarChart');
    if (!canvas) return;

    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = 260;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const channelMap = {
      'Direct Sales': 0,
      'Online Store': 0,
      'Partner Referral': 0,
      'Inbound Call': 0
    };

    activeData.forEach(item => {
      if (item.status !== 'refunded') {
        const ch = item.channel || 'Direct Sales';
        channelMap[ch] = (channelMap[ch] || 0) + item.amount;
      }
    });

    const channels = Object.keys(channelMap).map(k => ({
      name: k,
      amount: channelMap[k]
    }));

    const maxVal = Math.max(...channels.map(c => c.amount), 1000) * 1.15;
    const padding = { top: 20, right: 30, bottom: 40, left: 110 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barHeight = chartHeight / channels.length - 12;

    function drawRoundedRect(ctx, x, y, w, h, r) {
      if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.rect(x, y, w, h);
      }
    }

    channels.forEach((item, index) => {
      const y = padding.top + index * (chartHeight / channels.length) + 6;
      const barW = Math.max(4, (item.amount / maxVal) * chartWidth);

      // Label on the left
      ctx.textAlign = 'right';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText(item.name, padding.left - 12, y + barHeight / 2 + 4);

      // Track bar background
      ctx.beginPath();
      drawRoundedRect(ctx, padding.left, y, chartWidth, barHeight, 4);
      ctx.fillStyle = '#1e293b';
      ctx.fill();

      // Colored filled bar
      const grad = ctx.createLinearGradient(padding.left, y, padding.left + barW, y);
      grad.addColorStop(0, '#2563eb');
      grad.addColorStop(1, '#38bdf8');

      ctx.beginPath();
      drawRoundedRect(ctx, padding.left, y, barW, barHeight, 4);
      ctx.fillStyle = grad;
      ctx.fill();

      // Amount label at the end of the bar
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11.5px sans-serif';
      ctx.fillText(formatCurrency(item.amount), padding.left + barW + 8, y + barHeight / 2 + 4);
    });
  }

  // --- Leaderboard: Top Products by Revenue ---
  function updateProductLeaderboard(activeData) {
    const container = document.getElementById('product-leaderboard');
    if (!container) return;

    const productMap = {};
    activeData.forEach(item => {
      if (item.status !== 'refunded') {
        if (!productMap[item.product]) {
          productMap[item.product] = { title: item.product, revenue: 0, count: 0, category: item.category };
        }
        productMap[item.product].revenue += item.amount;
        productMap[item.product].count += 1;
      }
    });

    const ranked = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const topRevenue = ranked.length > 0 ? ranked[0].revenue : 1;

    if (ranked.length === 0) {
      container.innerHTML = '<div style="color: #64748b; padding: 20px; text-align: center;">No product sales recorded</div>';
      return;
    }

    container.innerHTML = ranked.map((item, index) => {
      const pct = Math.round((item.revenue / topRevenue) * 100);
      return `
        <div class="leader-item">
          <div class="leader-top-row">
            <div class="leader-info">
              <span class="leader-rank">#${index + 1}</span>
              <div>
                <div class="leader-name">${item.title}</div>
                <div class="leader-meta">${item.count} deals &bull; ${item.category}</div>
              </div>
            </div>
            <div class="leader-revenue">${formatCurrency(item.revenue)}</div>
          </div>
          <div class="leader-bar-track">
            <div class="leader-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Transactions Table Rendering & Pagination ---
  function updateTable() {
    let list = [...state.transactions];

    // Filter by period
    list = getFilteredByPeriod(list, state.currentPeriod);

    // Filter by search query
    if (state.tableSearch.trim()) {
      const query = state.tableSearch.toLowerCase().trim();
      list = list.filter(item =>
        item.id.toLowerCase().includes(query) ||
        item.customer.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.product.toLowerCase().includes(query) ||
        item.channel.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (state.tableCategory !== 'all') {
      list = list.filter(item => item.category === state.tableCategory);
    }

    // Filter by status
    if (state.tableStatus !== 'all') {
      list = list.filter(item => item.status === state.tableStatus);
    }

    // Sort
    const col = state.sortColumn;
    const dir = state.sortDirection === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let valA = a[col];
      let valB = b[col];

      if (col === 'amount') {
        return (valA - valB) * dir;
      }
      if (col === 'date') {
        return (new Date(valA) - new Date(valB)) * dir;
      }
      return valA.toString().localeCompare(valB.toString()) * dir;
    });

    // Pagination calculations
    const totalEntries = list.length;
    const totalPages = Math.ceil(totalEntries / state.rowsPerPage) || 1;
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (state.currentPage < 1) state.currentPage = 1;

    const startIdx = (state.currentPage - 1) * state.rowsPerPage;
    const endIdx = Math.min(startIdx + state.rowsPerPage, totalEntries);
    const pageItems = list.slice(startIdx, endIdx);

    // Render table body
    const tbody = document.getElementById('table-body');
    if (tbody) {
      if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 32px; color: #64748b;">No matching transactions found</td></tr>`;
      } else {
        tbody.innerHTML = pageItems.map(item => `
          <tr data-id="${item.id}">
            <td><span class="order-id-badge">${item.id}</span></td>
            <td>${item.date}</td>
            <td>
              <div class="customer-cell">
                <span class="customer-name">${escapeHtml(item.customer)}</span>
                <span class="customer-email">${escapeHtml(item.email || 'N/A')}</span>
              </div>
            </td>
            <td>
              <div class="product-cell">
                <span class="product-title">${escapeHtml(item.product)}</span>
                <span class="category-tag">${escapeHtml(item.category)}</span>
              </div>
            </td>
            <td>${escapeHtml(item.channel)}</td>
            <td>
              <span class="status-pill ${item.status}">
                &bull; ${item.status}
              </span>
            </td>
            <td class="text-right table-amount">${formatCurrencyExact(item.amount)}</td>
            <td class="text-center">
              <div class="action-btn-group">
                <button class="btn-icon-action btn-view-sale" data-id="${item.id}" title="View Receipt">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                <button class="btn-icon-action btn-icon-danger btn-delete-sale" data-id="${item.id}" title="Delete Record">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        `).join('');
      }
    }

    // Info text
    const infoEl = document.getElementById('table-info');
    if (infoEl) {
      if (totalEntries === 0) {
        infoEl.textContent = 'Showing 0 of 0 entries';
      } else {
        infoEl.textContent = `Showing ${startIdx + 1} to ${endIdx} of ${totalEntries} entries`;
      }
    }

    // Pagination controls
    const paginationEl = document.getElementById('pagination-controls');
    if (paginationEl) {
      let pagesHtml = `
        <button class="page-btn prev-btn" ${state.currentPage <= 1 ? 'disabled' : ''}>&larr;</button>
      `;

      for (let p = 1; p <= totalPages; p++) {
        // Show only around current page if many
        if (totalPages > 6 && Math.abs(p - state.currentPage) > 2 && p !== 1 && p !== totalPages) {
          if (p === 2 || p === totalPages - 1) {
            pagesHtml += `<span style="color: #64748b; padding: 0 4px;">...</span>`;
          }
          continue;
        }

        pagesHtml += `
          <button class="page-btn ${p === state.currentPage ? 'active' : ''}" data-page="${p}">${p}</button>
        `;
      }

      pagesHtml += `
        <button class="page-btn next-btn" ${state.currentPage >= totalPages ? 'disabled' : ''}>&rarr;</button>
      `;

      paginationEl.innerHTML = pagesHtml;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- Main Refresh Orchestrator ---
  function refreshDashboard() {
    const activeData = getFilteredByPeriod(state.transactions, state.currentPeriod);

    updateKpis(activeData);
    drawRevenueLineChart(activeData);
    drawCategoryDonutChart(activeData);
    drawChannelBarChart(activeData);
    updateProductLeaderboard(activeData);
    updateTable();
  }

  // --- Tooltip & Chart Interaction ---
  function setupLineChartInteractions() {
    const canvas = document.getElementById('revenueLineChart');
    const tooltip = document.getElementById('chart-tooltip');
    if (!canvas || !tooltip) return;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const points = canvas._chartPoints;

      if (!points || points.length === 0) return;

      // Find closest point on X
      let closestIdx = 0;
      let minDistance = Infinity;

      points.forEach((pt, idx) => {
        const dist = Math.abs(pt.x - mouseX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      if (minDistance < 40) {
        state.activeChartHoverIndex = closestIdx;
        const pt = points[closestIdx];
        const val = state.chartMetric === 'revenue'
          ? formatCurrencyExact(pt.data.revenue)
          : `${pt.data.orders} orders`;

        tooltip.innerHTML = `
          <div class="tooltip-date">${pt.data.date}</div>
          <div class="tooltip-val">${val}</div>
        `;
        tooltip.style.left = `${pt.x}px`;
        tooltip.style.top = `${pt.y}px`;
        tooltip.style.display = 'block';

        // Redraw chart to update guide line
        const activeData = getFilteredByPeriod(state.transactions, state.currentPeriod);
        drawRevenueLineChart(activeData);
      } else {
        hideTooltip();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      hideTooltip();
    });

    function hideTooltip() {
      if (state.activeChartHoverIndex !== null) {
        state.activeChartHoverIndex = null;
        tooltip.style.display = 'none';
        const activeData = getFilteredByPeriod(state.transactions, state.currentPeriod);
        drawRevenueLineChart(activeData);
      }
    }
  }

  // --- Toast Notification Helper ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, 3200);
  }

  // --- Export CSV Handler ---
  function exportCSV() {
    let list = getFilteredByPeriod(state.transactions, state.currentPeriod);
    if (list.length === 0) {
      showToast('No transaction data to export', 'error');
      return;
    }

    const headers = ['Order ID', 'Date', 'Customer Name', 'Customer Email', 'Product', 'Category', 'Channel', 'Status', 'Amount (USD)'];
    const rows = list.map(item => [
      item.id,
      item.date,
      `"${item.customer.replace(/"/g, '""')}"`,
      `"${item.email.replace(/"/g, '""')}"`,
      `"${item.product.replace(/"/g, '""')}"`,
      item.category,
      item.channel,
      item.status,
      item.amount
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulsesales-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Exported ${list.length} transactions as CSV`, 'success');
  }

  // --- Modal Management ---
  function setupModals() {
    const addModal = document.getElementById('add-sale-modal');
    const viewModal = document.getElementById('view-sale-modal');
    const btnOpenAdd = document.getElementById('btn-open-add-modal');
    const btnCloseAdd = document.getElementById('btn-close-modal');
    const btnCancelAdd = document.getElementById('btn-cancel-modal');
    const btnCloseView = document.getElementById('btn-close-view-modal');
    const btnCloseViewBtn = document.getElementById('btn-close-view-btn');
    const addForm = document.getElementById('add-sale-form');

    function openModal(modal) {
      if (modal) modal.classList.add('open');
    }

    function closeModal(modal) {
      if (modal) modal.classList.remove('open');
    }

    if (btnOpenAdd) {
      btnOpenAdd.addEventListener('click', () => {
        // Pre-fill today's date
        const dateInput = document.getElementById('form-date');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        openModal(addModal);
      });
    }

    if (btnCloseAdd) btnCloseAdd.addEventListener('click', () => closeModal(addModal));
    if (btnCancelAdd) btnCancelAdd.addEventListener('click', () => closeModal(addModal));
    if (btnCloseView) btnCloseView.addEventListener('click', () => closeModal(viewModal));
    if (btnCloseViewBtn) btnCloseViewBtn.addEventListener('click', () => closeModal(viewModal));

    // Close on backdrop click
    window.addEventListener('click', (e) => {
      if (e.target === addModal) closeModal(addModal);
      if (e.target === viewModal) closeModal(viewModal);
    });

    // Handle Form Submit
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const customer = document.getElementById('form-customer').value.trim();
        const email = document.getElementById('form-email').value.trim();
        const product = document.getElementById('form-product').value.trim();
        const category = document.getElementById('form-category').value;
        const amount = parseFloat(document.getElementById('form-amount').value);
        const date = document.getElementById('form-date').value;
        const channel = document.getElementById('form-channel').value;
        const status = document.getElementById('form-status').value;

        if (!customer || !product || isNaN(amount) || amount <= 0 || !date) {
          showToast('Please complete all required fields with valid inputs', 'error');
          return;
        }

        const newSale = {
          id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          customer,
          email: email || `${customer.toLowerCase().replace(/\s+/g, '.')}@client.com`,
          product,
          category,
          amount,
          date,
          channel,
          status
        };

        const updated = [newSale, ...state.transactions];
        saveTransactions(updated);

        addForm.reset();
        closeModal(addModal);
        showToast(`Transaction ${newSale.id} created successfully!`, 'success');
      });
    }
  }

  // --- Show Detail Modal ---
  function showTransactionDetails(id) {
    const item = state.transactions.find(t => t.id === id);
    if (!item) return;

    const modal = document.getElementById('view-sale-modal');
    const orderIdEl = document.getElementById('view-order-id');
    const detailsContainer = document.getElementById('view-sale-details');

    if (orderIdEl) orderIdEl.textContent = item.id;
    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <div class="detail-list">
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-val status-pill ${item.status}">&bull; ${item.status}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Amount</span>
            <span class="detail-val" style="color: #38bdf8; font-size: 16px;">${formatCurrencyExact(item.amount)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Customer</span>
            <span class="detail-val">${escapeHtml(item.customer)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-val">${escapeHtml(item.email || 'N/A')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Product / Service</span>
            <span class="detail-val">${escapeHtml(item.product)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category</span>
            <span class="detail-val">${escapeHtml(item.category)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Acquisition Channel</span>
            <span class="detail-val">${escapeHtml(item.channel)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date Recorded</span>
            <span class="detail-val">${item.date}</span>
          </div>
        </div>
      `;
    }

    if (modal) modal.classList.add('open');
  }

  // --- Delete Transaction ---
  function deleteTransaction(id) {
    if (confirm(`Are you sure you want to delete transaction ${id}?`)) {
      const updated = state.transactions.filter(t => t.id !== id);
      saveTransactions(updated);
      showToast(`Transaction ${id} removed`, 'info');
    }
  }

  // --- Attach Event Listeners ---
  function initEventListeners() {
    // Period filter chips
    const periodButtons = document.querySelectorAll('.date-filter-group .filter-chip');
    periodButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        periodButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentPeriod = btn.dataset.period;
        state.currentPage = 1;
        refreshDashboard();
      });
    });

    // Metric toggle (Revenue vs Orders)
    const metricButtons = document.querySelectorAll('.chart-metric-selector .metric-btn');
    metricButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        metricButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.chartMetric = btn.dataset.metric;
        const activeData = getFilteredByPeriod(state.transactions, state.currentPeriod);
        drawRevenueLineChart(activeData);
      });
    });

    // Reset data button
    const btnReset = document.getElementById('btn-reset-data');
    if (btnReset) {
      btnReset.addEventListener('click', resetToDefaultData);
    }

    // Export CSV button
    const btnExport = document.getElementById('btn-export-csv');
    if (btnExport) {
      btnExport.addEventListener('click', exportCSV);
    }

    // Table search
    const searchInput = document.getElementById('table-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.tableSearch = e.target.value;
        state.currentPage = 1;
        updateTable();
      });
    }

    // Table category filter
    const catSelect = document.getElementById('filter-category');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        state.tableCategory = e.target.value;
        state.currentPage = 1;
        updateTable();
      });
    }

    // Table status filter
    const statusSelect = document.getElementById('filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        state.tableStatus = e.target.value;
        state.currentPage = 1;
        updateTable();
      });
    }

    // Table column sorting
    const tableHeaders = document.querySelectorAll('#sales-table th.sortable');
    tableHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (state.sortColumn === col) {
          state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortColumn = col;
          state.sortDirection = 'desc';
        }

        tableHeaders.forEach(h => {
          h.classList.remove('sorted-asc', 'sorted-desc');
          const icon = h.querySelector('.sort-icon');
          if (icon) icon.innerHTML = '&updownarrow;';
        });

        th.classList.add(state.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
        const activeIcon = th.querySelector('.sort-icon');
        if (activeIcon) {
          activeIcon.innerHTML = state.sortDirection === 'asc' ? '&uarr;' : '&darr;';
        }

        updateTable();
      });
    });

    // Table action delegation (View, Delete, Pagination)
    const tbody = document.getElementById('table-body');
    if (tbody) {
      tbody.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.btn-view-sale');
        if (viewBtn) {
          const id = viewBtn.dataset.id;
          showTransactionDetails(id);
          return;
        }

        const delBtn = e.target.closest('.btn-delete-sale');
        if (delBtn) {
          const id = delBtn.dataset.id;
          deleteTransaction(id);
          return;
        }
      });
    }

    const paginationContainer = document.getElementById('pagination-controls');
    if (paginationContainer) {
      paginationContainer.addEventListener('click', (e) => {
        const pageBtn = e.target.closest('.page-btn');
        if (!pageBtn || pageBtn.disabled) return;

        if (pageBtn.classList.contains('prev-btn')) {
          if (state.currentPage > 1) {
            state.currentPage--;
            updateTable();
          }
        } else if (pageBtn.classList.contains('next-btn')) {
          state.currentPage++;
          updateTable();
        } else if (pageBtn.dataset.page) {
          state.currentPage = parseInt(pageBtn.dataset.page, 10);
          updateTable();
        }
      });
    }

    // Window resize handler (debounced redraw for responsive canvas charts)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const activeData = getFilteredByPeriod(state.transactions, state.currentPeriod);
        drawRevenueLineChart(activeData);
        drawCategoryDonutChart(activeData);
        drawChannelBarChart(activeData);
      }, 150);
    });
  }

  // --- Application Initialization ---
  function init() {
    state.transactions = loadTransactions();
    setupModals();
    setupLineChartInteractions();
    initEventListeners();
    refreshDashboard();
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
