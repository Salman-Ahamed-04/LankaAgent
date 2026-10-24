// LankaAgent Frontend Client Logic

document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const traceTimeline = document.getElementById('traceTimeline');
  const disruptionsList = document.getElementById('disruptionsList');
  const fareDisplay = document.getElementById('fareDisplay');
  const hostsList = document.getElementById('hostsList');
  const disruptionCount = document.getElementById('disruptionCount');

  // Load initial disruptions
  fetchDisruptions();

  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  // Preset Scenario Buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.dataset.query;
      chatInput.value = query;
      handleSendMessage(query);
    });
  });

  // Form submit
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;
    handleSendMessage(query);
  });

  async function handleSendMessage(query) {
    appendUserMessage(query);
    chatInput.value = '';
    
    // Switch to trace tab automatically to show agent in action
    switchToTab('trace');
    renderLoadingTrace();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      
      // Render Agent Response
      appendAgentMessage(data.final_response);

      // Render Thought Trace Timeline
      renderTraceTimeline(data.thought_trace);

      // Render Fair Fare Card if available
      if (data.fare_card) {
        renderFareCard(data.fare_card);
      }

      // Render Recommended Hosts if available
      if (data.recommended_hosts && data.recommended_hosts.length > 0) {
        renderHosts(data.recommended_hosts);
      }

    } catch (err) {
      appendAgentMessage(`❌ **Error communicating with LankaAgent:** ${err.message}. Please verify the backend service is running.`);
    }
  }

  function appendUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'message user-message';
    msg.innerHTML = `<div class="message-content"><p>${escapeHtml(text)}</p></div>`;
    chatMessages.appendChild(msg);
    scrollToBottom();
  }

  function appendAgentMessage(markdownText) {
    const msg = document.createElement('div');
    msg.className = 'message agent-message';
    msg.innerHTML = `
      <div class="agent-avatar">🇱🇰</div>
      <div class="message-content">${renderSimpleMarkdown(markdownText)}</div>
    `;
    chatMessages.appendChild(msg);
    scrollToBottom();
  }

  function renderLoadingTrace() {
    traceTimeline.innerHTML = `
      <div class="trace-item alert-detected">
        <div class="trace-meta">
          <span class="trace-agent">SupervisorAgent</span>
          <span class="trace-time">Processing...</span>
        </div>
        <div class="trace-action">Evaluating Travel Corridor & Intent</div>
        <div class="trace-details">StateGraph is compiling active constraints and triggering specialized tools...</div>
      </div>
    `;
  }

  function renderTraceTimeline(trace) {
    if (!trace || trace.length === 0) return;

    traceTimeline.innerHTML = '';
    trace.forEach(step => {
      const item = document.createElement('div');
      let extraClass = '';
      if (step.action.includes('Hazard') || step.action.includes('Alert')) extraClass = 'alert-detected';
      if (step.action.includes('Gouging') || step.action.includes('Scam')) extraClass = 'gouging-flagged';

      item.className = `trace-item ${extraClass}`;
      item.innerHTML = `
        <div class="trace-meta">
          <span class="trace-agent">${step.agent_name}</span>
          <span class="trace-time">${step.timestamp}</span>
        </div>
        <div class="trace-action">${step.action}</div>
        <div class="trace-details">${step.details}</div>
      `;
      traceTimeline.appendChild(item);
    });
  }

  function renderFareCard(fare) {
    fareDisplay.innerHTML = `
      <div class="fare-card-box">
        <div class="fare-stat-row">
          <div class="fare-stat-box">
            <div class="label">Official Fair Fare</div>
            <div class="value">LKR ${fare.estimated_fair_fare_lkr.toLocaleString()}</div>
            <div class="label" style="margin-top: 4px;">≈ $${fare.estimated_fair_fare_usd} USD</div>
          </div>
          <div class="fare-stat-box">
            <div class="label">Route & Terrain</div>
            <div class="value" style="font-size: 1.1rem; color: #06b6d4;">${fare.origin} ➔ ${fare.destination}</div>
            <div class="label" style="margin-top: 4px;">${fare.distance_km} km • Multiplier x${fare.terrain_factor}</div>
          </div>
        </div>

        ${fare.quoted_scam_fare_lkr ? `
          <div class="scam-warning-box">
            <div class="scam-warning-title">⚠️ Tourist Price Gouging Detected!</div>
            <p style="font-size: 0.85rem; color: #fecdd3;">
              Driver quoted <strong>LKR ${fare.quoted_scam_fare_lkr.toLocaleString()}</strong>, which is <strong>${fare.overcharge_pct}% higher</strong> than official meter rates.
              You save <strong>LKR ${fare.potential_savings_lkr.toLocaleString()}</strong> by insisting on the meter.
            </p>
          </div>
        ` : ''}

        <div class="script-box">
          <div class="script-title">🇱🇰 Sinhala Negotiation Phrase:</div>
          <div class="script-text">"${fare.bilingual_phrase_sinhala}"</div>
          <div class="script-translit">${fare.bilingual_translit_sinhala}</div>
          <button class="play-audio-btn" onclick="speakText('${fare.bilingual_translit_sinhala}')">
            <span>🔊</span> Listen & Play to Driver
          </button>
        </div>

        <div class="script-box">
          <div class="script-title">🇱🇰 Tamil Negotiation Phrase:</div>
          <div class="script-text">"${fare.bilingual_phrase_tamil}"</div>
          <div class="script-translit">${fare.bilingual_translit_tamil}</div>
          <button class="play-audio-btn" onclick="speakText('${fare.bilingual_translit_tamil}')">
            <span>🔊</span> Listen & Play to Driver
          </button>
        </div>
      </div>
    `;
  }

  function renderHosts(hosts) {
    hostsList.innerHTML = '';
    hosts.forEach(h => {
      const card = document.createElement('div');
      card.className = 'host-card';
      card.innerHTML = `
        <div class="host-header">
          <div>
            <div class="host-name">${h.business_name}</div>
            <div class="host-location">📍 ${h.location} • Host: ${h.host_name}</div>
          </div>
          <div class="host-price">LKR ${h.rate_lkr.toLocaleString()} <span style="font-size: 0.7rem; color: #9ca3af;">(~$${h.rate_usd_approx})</span></div>
        </div>
        <p style="font-size: 0.82rem; color: #d1d5db;">${h.bio_english}</p>
        <div class="dispatch-preview">
          <div style="font-size: 0.72rem; color: #c084fc; font-weight: 600; margin-bottom: 3px;">
            📲 Pre-Translated WhatsApp Audio / Text Dispatch (Direct to Host):
          </div>
          <div>"${h.dispatch_message_sinhala}"</div>
        </div>
      `;
      hostsList.appendChild(card);
    });
  }

  async function fetchDisruptions() {
    try {
      const res = await fetch('/api/disruptions');
      const data = await res.json();
      const list = data.active_disruptions || [];
      disruptionCount.textContent = list.length;

      disruptionsList.innerHTML = '';
      list.forEach(d => {
        const item = document.createElement('div');
        item.className = 'disruption-card';
        item.innerHTML = `
          <span class="disruption-badge">${d.category.toUpperCase()} • ${d.severity}</span>
          <div class="disruption-title">${d.location}</div>
          <div class="disruption-status">${d.event}</div>
          <div class="disruption-rec">
            <strong>Agent Action:</strong> ${d.agent_recommendation}
          </div>
        `;
        disruptionsList.appendChild(item);
      });
    } catch (e) {
      console.warn("Could not fetch disruptions", e);
    }
  }

  function switchToTab(tabName) {
    tabBtns.forEach(b => {
      if (b.dataset.tab === tabName) b.classList.add('active');
      else b.classList.remove('active');
    });
    tabPanels.forEach(p => {
      if (p.id === `tab-${tabName}`) p.classList.add('active');
      else p.classList.remove('active');
    });
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderSimpleMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/### (.*?)\n/g, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n- (.*?)/g, '<br>• $1');
    return `<p>${html}</p>`;
  }

  // Audio simulation / Web Speech API
  window.speakText = function(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Pronunciation audio: " + text);
    }
  };
});
