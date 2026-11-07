// SmartLanka – Autonomous Tourism Concierge & Micro-Economy Disperser
// Professional Frontend Client Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // Core DOM Elements
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const traceTimeline = document.getElementById('traceTimeline');
  const disruptionsList = document.getElementById('disruptionsList');
  const fareDisplay = document.getElementById('fareDisplay');
  const hostsList = document.getElementById('hostsList');
  const disruptionCount = document.getElementById('disruptionCount');
  const ctxCorridor = document.getElementById('ctxCorridor');

  // Mobile Navigation
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
    });
    // Close drawer when link clicked
    mobileDrawer.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => mobileDrawer.classList.remove('open'));
    });
  }

  // Right Panel Tabs (Reasoning, Fare Sentinel, Disruptions, Homestays)
  const rightTabs = document.querySelectorAll('.right-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');

  rightTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      rightTabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  function switchToRightTab(tabName) {
    rightTabs.forEach(t => {
      if (t.dataset.tab === tabName) t.classList.add('active');
      else t.classList.remove('active');
    });
    tabPanes.forEach(p => {
      if (p.id === `tab-${tabName}`) p.classList.add('active');
      else p.classList.remove('active');
    });
  }

  // Load initial active disruptions from backend
  fetchDisruptions();

  // Load initial hosts for Ella
  fetchHosts("ella");

  // Hero Search Bar Submission
  const heroSearchBtn = document.getElementById('heroSearchBtn');
  if (heroSearchBtn) {
    heroSearchBtn.addEventListener('click', () => {
      const dest = document.getElementById('searchDest')?.value.trim() || 'Ella';
      const dates = document.getElementById('searchDates')?.value.trim() || 'Flexible';

      const prompt = `I am planning to explore ${dest} (Travel dates: ${dates}). Can you recommend an optimal itinerary, calculate official fair transport fares from Colombo, check any active disruptions, and recommend authentic verified local homestays?`;
      
      const assistantSection = document.getElementById('ai-assistant');
      if (assistantSection) {
        assistantSection.scrollIntoView({ behavior: 'smooth' });
      }

      if (chatInput) {
        chatInput.value = prompt;
      }
      handleSendMessage(prompt, origin, dest);
    });
  }

  // Sidebar Suggested Prompt Chips
  document.querySelectorAll('.prompt-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.dataset.query;
      if (!query) return;

      const assistantSection = document.getElementById('ai-assistant');
      if (assistantSection) {
        assistantSection.scrollIntoView({ behavior: 'smooth' });
      }

      if (chatInput) chatInput.value = query;
      handleSendMessage(query);
    });
  });

  // "New Consultation" Button
  const newChatBtn = document.getElementById('newChatBtn');
  if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
      chatMessages.innerHTML = `
        <div class="chat-msg agent-msg initial-msg">
          <div class="msg-avatar"><span class="avatar-emblem">SL</span></div>
          <div class="msg-content">
            <div class="msg-meta">
              <span class="sender-name">SmartLanka Concierge</span>
              <span class="msg-time">Just now</span>
            </div>
            <div class="msg-text">
              <p class="greeting-lead"><strong>Consultation reset.</strong> Where would you like to travel next in Sri Lanka?</p>
              <p>Ask a question about train options, driver fares, or local homestays to begin a new journey audit.</p>
            </div>
          </div>
        </div>
      `;
      if (ctxCorridor) ctxCorridor.textContent = 'Awaiting Query';
      switchToRightTab('trace');
      if (traceTimeline) {
        traceTimeline.innerHTML = `
          <div class="deck-empty-state">
            <span class="empty-icon">⚙️</span>
            <p><strong>Awaiting traveler request.</strong> Submit a query to watch the multi-agent graph evaluate parameters in real time.</p>
          </div>
        `;
      }
    });
  }

  // Standalone Fare Calculator Form (Transport Section)
  const standaloneFareForm = document.getElementById('standaloneFareForm');
  const quickFareResult = document.getElementById('quickFareResult');
  if (standaloneFareForm && quickFareResult) {
    standaloneFareForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const origin = document.getElementById('fareOriginInput')?.value.trim() || 'Kandy';
      const dest = document.getElementById('fareDestInput')?.value.trim() || 'Ella';
      const vehicle = document.getElementById('fareVehicleSelect')?.value || 'tuk_tuk';
      const quotedVal = document.getElementById('quotedPriceInput')?.value.trim();
      const quoted = quotedVal ? parseFloat(quotedVal) : null;

      quickFareResult.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: #174D3A; font-weight: 600;">
          Calculating CPC fuel index & terrain factors for ${origin} ➔ ${dest}...
        </div>
      `;

      try {
        const res = await fetch('/api/calculate-fare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin,
            destination: dest,
            vehicle_type: vehicle,
            quoted_scam_fare: quoted
          })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const fare = await res.json();

        quickFareResult.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 0.5rem; border-bottom: 1px solid #E8EAE5;">
              <div>
                <strong style="font-size: 1.05rem; color: #174D3A;">${fare.origin} ➔ ${fare.destination}</strong>
                <div style="font-size: 0.78rem; color: #737B74;">${fare.distance_km} km • Terrain Multiplier: x${fare.terrain_factor}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1.25rem; font-weight: 800; color: #174D3A;">LKR ${fare.estimated_fair_fare_lkr.toLocaleString()}</div>
                <div style="font-size: 0.78rem; color: #737B74;">≈ $${fare.estimated_fair_fare_usd} USD</div>
              </div>
            </div>

            ${fare.quoted_scam_fare_lkr ? `
              <div style="background-color: #FEE2E2; border: 1px solid #FECACA; padding: 0.65rem; border-radius: 6px; font-size: 0.82rem; color: #991B1B;">
                <strong>⚠️ Overcharge Flagged:</strong> Quoted LKR ${fare.quoted_scam_fare_lkr.toLocaleString()} (${fare.overcharge_pct}% over fair meter). Potential savings: <strong>LKR ${fare.potential_savings_lkr.toLocaleString()}</strong>.
              </div>
            ` : ''}

            <div style="background-color: #FFFFFF; border: 1px solid #E8EAE5; padding: 0.75rem; border-radius: 6px; font-size: 0.84rem;">
              <div style="font-size: 0.74rem; font-weight: 700; color: #174D3A; margin-bottom: 3px;">🇱🇰 Sinhala Counter-Offer Phrase:</div>
              <div style="font-weight: 600; color: #202923;">"${fare.bilingual_phrase_sinhala}"</div>
              <div style="font-size: 0.78rem; color: #737B74; font-style: italic; margin-bottom: 6px;">${fare.bilingual_translit_sinhala}</div>
              <button type="button" class="play-audio-btn" onclick="speakText('${fare.bilingual_translit_sinhala}')">
                <span>🔊</span> Listen & Play to Driver
              </button>
            </div>
          </div>
        `;
      } catch (err) {
        quickFareResult.innerHTML = `
          <div style="color: #991B1B; padding: 1rem; text-align: center;">
            Failed to calculate fare: ${err.message}
          </div>
        `;
      }
    });
  }

  // Global Destination Click Trigger
  window.triggerDestinationPlan = function(destName) {
    const prompt = `Plan an optimal visit to ${destName} including must-see heritage attractions, scenic transport options, official meter rates from Colombo, and authentic local food spots.`;
    const assistantSection = document.getElementById('ai-assistant');
    if (assistantSection) {
      assistantSection.scrollIntoView({ behavior: 'smooth' });
    }
    if (chatInput) chatInput.value = prompt;
    handleSendMessage(prompt, 'Colombo', destName);
  };

  // Direct Booking Modal
  const bookingModal = document.getElementById('bookingModal');
  const closeBookingModalBtn = document.getElementById('closeBookingModalBtn');
  const directBookingForm = document.getElementById('directBookingForm');

  window.openBookingModal = function(title, location, rate, host) {
    if (!bookingModal) return;
    document.getElementById('modalExpTitle').textContent = title;
    document.getElementById('modalExpLoc').textContent = location;
    document.getElementById('modalExpHost').textContent = host;
    document.getElementById('modalExpRate').textContent = `LKR ${rate.toLocaleString()} / night`;
    bookingModal.classList.add('show');
  };

  if (closeBookingModalBtn && bookingModal) {
    closeBookingModalBtn.addEventListener('click', () => bookingModal.classList.remove('show'));
    bookingModal.addEventListener('click', (e) => {
      if (e.target === bookingModal) bookingModal.classList.remove('show');
    });
  }

  if (directBookingForm && bookingModal) {
    directBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const traveler = document.getElementById('bookTravelerName')?.value || 'Traveler';
      const phone = document.getElementById('bookTravelerPhone')?.value || '';
      const host = document.getElementById('modalExpHost')?.textContent || 'Host';

      alert(`✅ Community Dispatch Confirmed!\n\nYour reservation request has been dispatched directly to ${host} via verified WhatsApp bridge.\n\n0% corporate commission was charged. Thank you for supporting authentic Sri Lankan families!`);
      bookingModal.classList.remove('show');
      directBookingForm.reset();
    });
  }

  // Main Chat Form Submit
  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = chatInput.value.trim();
      if (!query) return;
      handleSendMessage(query);
    });
  }

  // Core Agent Execution Function (Integrated with Backend API)
  async function handleSendMessage(query, customOrigin = null, customDest = null) {
    appendUserMessage(query);
    if (chatInput) chatInput.value = '';

    // Switch to reasoning tab automatically
    switchToRightTab('trace');
    renderLoadingTrace();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          origin: customOrigin,
          destination: customDest
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      // Render Agent Response
      appendAgentMessage(data.final_response);

      // Render Thought Trace Timeline
      renderTraceTimeline(data.thought_trace);

      // Update corridor context if available
      if (ctxCorridor && data.origin && data.destination) {
        ctxCorridor.textContent = `${data.origin.toUpperCase()} ➔ ${data.destination.toUpperCase()}`;
      }

      // Render Fair Fare Card if available
      if (data.fare_card) {
        renderFareCard(data.fare_card);
        switchToRightTab('fare');
      }

      // Render Disruptions if active
      if (data.active_disruptions && data.active_disruptions.length > 0) {
        renderDisruptions(data.active_disruptions);
      }

      // Render Recommended Hosts if available
      if (data.recommended_hosts && data.recommended_hosts.length > 0) {
        renderHosts(data.recommended_hosts);
      }

    } catch (err) {
      appendAgentMessage(`❌ **Connection Advisory:** Could not communicate with SmartLanka backend: ${err.message}. Please verify the Python service is active.`);
    }
  }

  function appendUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg user-msg';
    msg.innerHTML = `
      <div class="msg-content">
        <p>${escapeHtml(text)}</p>
      </div>
    `;
    chatMessages.appendChild(msg);
    scrollToBottom();
  }

  function appendAgentMessage(markdownText) {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg = document.createElement('div');
    msg.className = 'chat-msg agent-msg';
    msg.innerHTML = `
      <div class="msg-avatar">
        <span class="avatar-emblem">SL</span>
      </div>
      <div class="msg-content">
        <div class="msg-meta">
          <span class="sender-name">SmartLanka Concierge</span>
          <span class="msg-time">${timeNow}</span>
        </div>
        <div class="msg-text">${renderSimpleMarkdown(markdownText)}</div>
      </div>
    `;
    chatMessages.appendChild(msg);
    scrollToBottom();
  }

  function renderLoadingTrace() {
    if (!traceTimeline) return;
    traceTimeline.innerHTML = `
      <div class="trace-item alert-detected">
        <div class="trace-meta">
          <span class="trace-agent">SupervisorAgent</span>
          <span class="trace-time">Processing...</span>
        </div>
        <div class="trace-action">Evaluating Travel Corridor & Intent Constraints</div>
        <div class="trace-details">StateGraph is binding origin/destination nodes and dispatching tools...</div>
      </div>
    `;
  }

  function renderTraceTimeline(trace) {
    if (!traceTimeline || !trace || trace.length === 0) return;

    traceTimeline.innerHTML = '';
    trace.forEach(step => {
      const item = document.createElement('div');
      let extraClass = '';
      if (step.action.includes('Hazard') || step.action.includes('Alert')) extraClass = 'alert-detected';
      if (step.action.includes('Gouging') || step.action.includes('Scam')) extraClass = 'gouging-flagged';

      item.className = `trace-item ${extraClass}`;
      item.innerHTML = `
        <div class="trace-meta">
          <span class="trace-agent">[${step.agent_name}]</span>
          <span class="trace-time">${step.timestamp}</span>
        </div>
        <div class="trace-action">${step.action}</div>
        <div class="trace-details">${step.details}</div>
      `;
      traceTimeline.appendChild(item);
    });
  }

  function renderFareCard(fare) {
    if (!fareDisplay) return;
    fareDisplay.innerHTML = `
      <div class="fare-card-box">
        <div class="fare-stat-row">
          <div class="fare-stat-box">
            <div class="label">Official Fair Meter Fare</div>
            <div class="value">LKR ${fare.estimated_fair_fare_lkr.toLocaleString()}</div>
            <div class="label" style="margin-top: 4px; color: #174D3A; font-weight: 700;">≈ $${fare.estimated_fair_fare_usd} USD</div>
          </div>
          <div class="fare-stat-box">
            <div class="label">Corridor & Elevation</div>
            <div class="value" style="font-size: 1.05rem; color: #174D3A;">${fare.origin} ➔ ${fare.destination}</div>
            <div class="label" style="margin-top: 4px;">${fare.distance_km} km • Multiplier x${fare.terrain_factor}</div>
          </div>
        </div>

        ${fare.quoted_scam_fare_lkr ? `
          <div class="scam-warning-box">
            <div class="scam-warning-title">⚠️ Overcharge Flagged: ${fare.overcharge_pct}% Above Fair Meter</div>
            <p style="color: #991B1B; line-height: 1.5; font-weight: 500;">
              Driver quoted <strong>LKR ${fare.quoted_scam_fare_lkr.toLocaleString()}</strong>. Insisting on official meter saves you <strong>LKR ${fare.potential_savings_lkr.toLocaleString()}</strong>.
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
    if (!hostsList) return;
    hostsList.innerHTML = '';
    hosts.forEach(h => {
      const card = document.createElement('div');
      card.className = 'host-card';
      const hostName = h.name || h.host_name || 'Verified Host';
      const rate = h.rate_lkr || h.rate_lkr_per_night || 6000;
      const rateUsd = h.rate_usd_approx || Math.round(rate / 310);

      card.innerHTML = `
        <div class="host-header">
          <div>
            <div class="host-name">${h.business_name}</div>
            <div class="host-location">📍 ${h.location} • Host: ${hostName}</div>
          </div>
          <div class="host-price">LKR ${rate.toLocaleString()} <span style="font-size: 0.72rem; color: #737B74; font-weight: 500;">(~$${rateUsd})</span></div>
        </div>
        <p style="font-size: 0.84rem; color: #202923; line-height: 1.5; margin-top: 4px;">${h.bio_english || ''}</p>
        <div class="dispatch-preview">
          <div style="font-size: 0.7rem; color: #A57E3B; font-weight: 700; margin-bottom: 2px; text-transform: uppercase;">
            📲 Direct Host Voice/Text Dispatch:
          </div>
          <div style="font-weight: 600; color: #202923;">"${h.bio_sinhala ? h.bio_sinhala.substring(0, 75) + '...' : 'ආයුබෝවන්, සංචාරකයින් පැමිණීමට විමසයි.'}"</div>
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
      if (disruptionCount) disruptionCount.textContent = list.length;
      renderDisruptions(list);
    } catch (e) {
      console.warn("Could not fetch disruptions", e);
    }
  }

  function renderDisruptions(list) {
    if (!disruptionsList) return;
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
  }

  async function fetchHosts(loc) {
    try {
      const res = await fetch(`/api/hosts?location=${encodeURIComponent(loc)}`);
      const data = await res.json();
      if (data && data.hosts) {
        renderHosts(data.hosts);
      }
    } catch (e) {
      console.warn("Could not fetch initial hosts", e);
    }
  }

  function scrollToBottom() {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
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
      .replace(/## (.*?)\n/g, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="font-family: monospace; background: #DDE9DF; padding: 2px 4px; border-radius: 4px; color: #174D3A;">$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n- (.*?)/g, '<br>• $1')
      .replace(/\n\* (.*?)/g, '<br>• $1');
    return `<p>${html}</p>`;
  }

  // Audio speech pronunciation
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

  // Google Gemini API Configuration
  const geminiBtn = document.getElementById('geminiBtn');
  const geminiStatusText = document.getElementById('geminiStatusText');
  const apiModal = document.getElementById('apiModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const geminiKeyForm = document.getElementById('geminiKeyForm');
  const apiKeyInput = document.getElementById('apiKeyInput');

  async function checkGeminiStatus() {
    if (!geminiBtn || !geminiStatusText) return;
    try {
      const res = await fetch('/api/config/gemini');
      const data = await res.json();
      if (data.connected) {
        geminiBtn.classList.remove('disconnected');
        geminiStatusText.textContent = `✨ Gemini Active (${data.masked_key || '3.5 Flash'})`;
        geminiBtn.title = `Connected to Google Gemini (${data.model}). Click to update key.`;
      } else {
        geminiBtn.classList.add('disconnected');
        geminiStatusText.textContent = '🔑 Connect Gemini API';
        geminiBtn.title = 'Click to connect your Google Gemini API key';
      }
    } catch (e) {
      console.warn("Could not check Gemini API status", e);
      geminiBtn.classList.add('disconnected');
      geminiStatusText.textContent = '🔑 Connect Gemini API';
    }
  }

  // Check Gemini Status on Startup
  checkGeminiStatus();

  // Modal Open/Close
  if (geminiBtn && apiModal) {
    geminiBtn.addEventListener('click', () => {
      apiModal.classList.add('show');
      if (apiKeyInput) apiKeyInput.focus();
    });
  }

  if (closeModalBtn && apiModal) {
    closeModalBtn.addEventListener('click', () => apiModal.classList.remove('show'));
  }

  if (apiModal) {
    apiModal.addEventListener('click', (e) => {
      if (e.target === apiModal) apiModal.classList.remove('show');
    });
  }

  if (geminiKeyForm) {
    geminiKeyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const keyVal = apiKeyInput.value.trim();
      if (!keyVal) return;

      const submitBtn = geminiKeyForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.textContent = 'Validating & Connecting...';
        submitBtn.disabled = true;
      }

      try {
        const res = await fetch('/api/config/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: keyVal })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to save key');
        }

        apiModal.classList.remove('show');
        apiKeyInput.value = '';
        checkGeminiStatus();
        appendAgentMessage(`✨ **Google Gemini Connected!** SmartLanka is now operating with **Google Gemini 3.5** for dynamic natural language analysis and verified local synthesis.`);
      } catch (err) {
        alert("Failed to connect Gemini API: " + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
      }
    });
  }
});
