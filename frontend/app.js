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

  // Local Experiences Category Filter Tabs
  const expCatTabs = document.querySelectorAll('.exp-cat-tab');
  const expCards = document.querySelectorAll('.experience-card');

  expCatTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const selectedCat = tab.dataset.category;

      expCatTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      expCards.forEach(card => {
        if (selectedCat === 'all' || card.dataset.category === selectedCat) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

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

  // ==========================================================================
  // SMART ITINERARY DASHBOARD CONTROLLER (Interactive Map & Timeline)
  // ==========================================================================
  const itineraryMapContainer = document.getElementById('itineraryMap');
  let itineraryMap = null;
  const activeMarkers = {};
  let primaryHaloPolyline = null;
  let primaryPolyline = null;
  let altPolyline = null;
  let currentActiveDay = 'all';
  let currentRouteMode = 'primary'; // 'primary' | 'alt'

  const stopsData = {
    sigiriya: {
      num: 1,
      name: "Sigiriya Lion Rock Citadel",
      shortLoc: "Cultural Triangle",
      day: 1,
      coords: [7.9570, 80.7603],
      rating: "5.0 ★",
      crowd: "🟢 Low (6:30 AM)",
      thumb: "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=150&q=80"
    },
    dambulla: {
      num: 2,
      name: "Dambulla Royal Cave Temple",
      shortLoc: "Golden Temple Sanctuary",
      day: 1,
      coords: [7.8742, 80.6511],
      rating: "4.9 ★",
      crowd: "🟡 Moderate Crowd",
      thumb: "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=150&q=80"
    },
    kandy_tooth: {
      num: 3,
      name: "Temple of the Sacred Tooth",
      shortLoc: "Kandy Lakefront",
      day: 2,
      coords: [7.2936, 80.6413],
      rating: "5.0 ★",
      crowd: "🔴 Peak Ceremony (18:30)",
      thumb: "https://images.unsplash.com/photo-1588598198321-9735fd524498?auto=format&fit=crop&w=150&q=80"
    },
    peradeniya: {
      num: 4,
      name: "Royal Botanical Gardens",
      shortLoc: "Peradeniya, Kandy",
      day: 2,
      coords: [7.2711, 80.5960],
      rating: "4.8 ★",
      crowd: "🟢 Low Crowd (147 Acres)",
      thumb: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=150&q=80"
    },
    blue_train: {
      num: 5,
      name: "Iconic Blue Train Journey",
      shortLoc: "Kandy ➔ Nanu Oya ➔ Ella",
      day: 3,
      coords: [6.9404, 80.7486],
      rating: "5.0 ★",
      crowd: "🔴 High Demand (Booked)",
      thumb: "/assets/srilanka_nature_bg.jpg"
    },
    ella_gap: {
      num: 6,
      name: "Little Adam's Peak & Gap",
      shortLoc: "Ella Mountain Ridge",
      day: 3,
      coords: [6.8748, 81.0465],
      rating: "4.9 ★",
      crowd: "🟡 Moderate (Sunset)",
      thumb: "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&w=150&q=80"
    },
    nine_arches: {
      num: 7,
      name: "Nine Arches Viaduct Bridge",
      shortLoc: "Demodara, Ella",
      day: 4,
      coords: [6.8767, 81.0608],
      rating: "5.0 ★",
      crowd: "🟢 Low Crowd (06:15 AM)",
      thumb: "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=150&q=80"
    },
    mirissa: {
      num: 8,
      name: "Coconut Tree Hill & Bay",
      shortLoc: "Mirissa Southern Coast",
      day: 4,
      coords: [5.9442, 80.4593],
      rating: "4.9 ★",
      crowd: "🟡 Sunset Gatherings",
      thumb: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=150&q=80"
    },
    galle_fort: {
      num: 9,
      name: "Galle Fort Ramparts",
      shortLoc: "Galle Lighthouse Citadel",
      day: 5,
      coords: [6.0275, 80.2170],
      rating: "5.0 ★",
      crowd: "🟢 Low Crowd (08:30 AM)",
      thumb: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=150&q=80"
    }
  };

  const primaryRouteCoords = [
    [7.1808, 79.8841], // Bandaranaike Airport
    [7.9570, 80.7603], // Sigiriya Lion Rock
    [7.8742, 80.6511], // Dambulla Rock Cave
    [7.2936, 80.6413], // Kandy Tooth Temple
    [7.2711, 80.5960], // Peradeniya Botanical
    [6.9404, 80.7486], // Nanu Oya Main Line Rail
    [6.8748, 81.0465], // Ella Little Adam's Peak
    [6.8767, 81.0608], // Nine Arches Bridge
    [5.9442, 80.4593], // Mirissa Southern Coast
    [6.0275, 80.2170], // Galle Dutch Fort
    [7.1808, 79.8841]  // Return Colombo Airport
  ];

  const altRouteCoords = [
    [7.2936, 80.6413], // Kandy
    [6.7681, 80.9570], // Haputale Mountain Pass Reroute
    [6.8748, 81.0465]  // Ella
  ];

  function initItineraryDashboardMap() {
    if (!itineraryMapContainer) return;
    if (typeof L === 'undefined') {
      console.warn("Leaflet library not ready yet, retrying in 200ms...");
      setTimeout(initItineraryDashboardMap, 200);
      return;
    }

    try {
      // Create Leaflet Map with full keyboard, mouse pad, and trackpad zooming enabled
      itineraryMap = L.map('itineraryMap', {
        center: [7.4, 80.7],
        zoom: 8,
        minZoom: 6,
        maxZoom: 17,
        zoomControl: false, // Using our customized zoom in/out buttons
        scrollWheelZoom: true, // Mousepad / Trackpad scroll zooming ENABLED
        wheelDebounceTime: 40,
        wheelPxPerZoomLevel: 60,
        touchZoom: true, // Pinch to zoom on trackpads/touch screens
        doubleClickZoom: true,
        boxZoom: true,
        dragging: true,
        keyboard: true, // Keyboard zoom (+ / -) & arrows ENABLED
        keyboardPanDelta: 80
      });

      // Primary High-Reliability OpenStreetMap Tiles
      const osmTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        crossOrigin: true
      });
      osmTileLayer.addTo(itineraryMap);

      // Primary Route: Glowing halo casing underneath for extreme contrast
      primaryHaloPolyline = L.polyline(primaryRouteCoords, {
        color: '#FFFFFF',
        weight: 9,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(itineraryMap);

      // Primary Scenic Polyline (Deep Forest Green)
      primaryPolyline = L.polyline(primaryRouteCoords, {
        color: '#174D3A',
        weight: 5,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(itineraryMap);

      // Alternative Contingency Polyline (Muted Gold Dashed)
      altPolyline = L.polyline(altRouteCoords, {
        color: '#C69B52',
        weight: 4.5,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(itineraryMap);

      // Add High-Visibility Numbered Waypoint Markers
      Object.keys(stopsData).forEach(key => {
        const stop = stopsData[key];

        const customMarkerIcon = L.divIcon({
          className: 'custom-waypoint-marker-wrap',
          html: `<div class="custom-waypoint-marker" id="pin-${key}" title="${stop.name}">${stop.num}</div>`,
          iconSize: [34, 42],
          iconAnchor: [17, 42],
          popupAnchor: [0, -38]
        });

        const marker = L.marker(stop.coords, { icon: customMarkerIcon }).addTo(itineraryMap);

        // Rich Popup matching reference style
        marker.bindPopup(`
          <div class="map-card-popup">
            <img src="${stop.thumb}" alt="${stop.name}" class="popup-thumb" />
            <div class="popup-info">
              <div class="popup-title">${stop.name}</div>
              <div class="popup-loc">📍 ${stop.shortLoc}</div>
              <div class="popup-rating">${stop.rating} • <span style="color: #174D3A; font-weight: 700;">${stop.crowd}</span></div>
            </div>
          </div>
        `, { maxWidth: 300, offset: [0, -6] });

        marker.on('click', () => {
          selectStop(key);
        });

        activeMarkers[key] = marker;
      });

      // Fit Initial Bounds to full Sri Lanka route
      itineraryMap.fitBounds(primaryPolyline.getBounds(), { padding: [50, 50] });

      // Immediate InvalidateSize to prevent blank rendering
      setTimeout(() => {
        if (itineraryMap) itineraryMap.invalidateSize();
      }, 200);

      setTimeout(() => {
        if (itineraryMap) itineraryMap.invalidateSize();
      }, 800);

    } catch (e) {
      console.warn("Could not initialize Leaflet map:", e);
    }
  }

  // Initialize Map immediately
  initItineraryDashboardMap();

  // ResizeObserver / IntersectionObserver to ensure map refreshes immediately when scrolled into view
  if (itineraryMapContainer && 'IntersectionObserver' in window) {
    const mapObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && itineraryMap) {
          itineraryMap.invalidateSize();
        }
      });
    }, { threshold: 0.1 });
    mapObserver.observe(itineraryMapContainer);
  }

  // Window resize & scroll invalidation
  window.addEventListener('resize', () => {
    if (itineraryMap) itineraryMap.invalidateSize();
  });

  document.querySelectorAll('a[href="#itinerary"]').forEach(link => {
    link.addEventListener('click', () => {
      setTimeout(() => {
        if (itineraryMap) {
          itineraryMap.invalidateSize();
          if (primaryPolyline) itineraryMap.fitBounds(primaryPolyline.getBounds(), { padding: [50, 50] });
        }
      }, 350);
    });
  });

  // Dedicated Zoom In / Zoom Out Controls
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (itineraryMap) itineraryMap.zoomIn();
    });
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (itineraryMap) itineraryMap.zoomOut();
    });
  }

  // Global Keyboard Navigation for Map Zooming (+ / - and Arrow keys)
  window.addEventListener('keydown', (e) => {
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
      if (itineraryMap) {
        e.preventDefault();
        itineraryMap.zoomIn();
      }
    } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
      if (itineraryMap) {
        e.preventDefault();
        itineraryMap.zoomOut();
      }
    } else if (e.key === '0' || e.key === 'Home') {
      if (itineraryMap && primaryPolyline) {
        e.preventDefault();
        itineraryMap.fitBounds(primaryPolyline.getBounds(), { padding: [50, 50] });
      }
    }
  });

  // Select Stop Function
  window.selectStop = function(stopId) {
    const stop = stopsData[stopId];
    if (!stop) return;

    // Highlight stop card in timeline
    document.querySelectorAll('.stop-card').forEach(card => card.classList.remove('active'));
    const targetCard = document.querySelector(`.stop-card[data-stop-id="${stopId}"]`);
    if (targetCard) {
      targetCard.classList.add('active');
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Highlight pin on map
    document.querySelectorAll('.custom-waypoint-marker').forEach(pin => pin.classList.remove('pin-active'));
    const targetPin = document.getElementById(`pin-${stopId}`);
    if (targetPin) targetPin.classList.add('pin-active');

    // Pan map to stop and open popup
    if (itineraryMap) {
      itineraryMap.flyTo(stop.coords, 10, { duration: 1.0 });
      const marker = activeMarkers[stopId];
      if (marker) {
        setTimeout(() => marker.openPopup(), 400);
      }
    }
  };

  // View on Map Button
  window.focusOnMap = function(stopId) {
    window.selectStop(stopId);
    if (window.innerWidth <= 1024) {
      const mapEl = document.getElementById('itineraryMap');
      if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Ask AI Concierge to Refine Stop
  window.askAiAboutStop = function(stopName) {
    const prompt = `Can you refine our itinerary for ${stopName} to optimize crowd arrival, check live weather, and confirm transport fare from Colombo?`;
    const assistantSection = document.getElementById('ai-assistant');
    if (assistantSection) {
      assistantSection.scrollIntoView({ behavior: 'smooth' });
    }
    if (chatInput) chatInput.value = prompt;
    handleSendMessage(prompt);
  };

  // Route Mode Switcher
  const btnPrimaryRoute = document.getElementById('btnPrimaryRoute');
  const btnAltRoute = document.getElementById('btnAltRoute');
  const btnInlineAltTrigger = document.getElementById('btnInlineAltTrigger');
  const mapTransitStat = document.getElementById('mapTransitStat');
  const trainBookingBadge = document.getElementById('trainBookingBadge');

  window.toggleRouteMode = function(mode) {
    currentRouteMode = mode;
    if (mode === 'alt') {
      btnPrimaryRoute?.classList.remove('active');
      btnAltRoute?.classList.add('active');

      if (altPolyline) {
        altPolyline.setStyle({ color: '#C69B52', weight: 6, opacity: 1, dashArray: null });
      }
      if (primaryPolyline) {
        primaryPolyline.setStyle({ opacity: 0.35 });
      }
      if (mapTransitStat) {
        mapTransitStat.textContent = '⚡ Alt Reroute: Minivan via Haputale (+25 mins • 2,500 LKR)';
      }
      if (trainBookingBadge) {
        trainBookingBadge.textContent = '🚐 Vetted Co-op Minivan • Reserved';
      }
      if (itineraryMap && altPolyline) {
        itineraryMap.flyToBounds(altPolyline.getBounds(), { padding: [70, 70], duration: 1.2 });
      }
    } else {
      btnAltRoute?.classList.remove('active');
      btnPrimaryRoute?.classList.add('active');

      if (primaryPolyline) {
        primaryPolyline.setStyle({ color: '#174D3A', weight: 5, opacity: 1.0 });
      }
      if (altPolyline) {
        altPolyline.setStyle({ color: '#C69B52', weight: 4.5, opacity: 0.85, dashArray: '8, 8' });
      }
      if (mapTransitStat) {
        mapTransitStat.textContent = '🚗 Transit: ~3.5 hrs • 148 km';
      }
      if (trainBookingBadge) {
        trainBookingBadge.textContent = '🚂 Train #1005 Podi Menike • Reserved';
      }
      if (itineraryMap && primaryPolyline) {
        itineraryMap.fitBounds(primaryPolyline.getBounds(), { padding: [50, 50] });
      }
    }
  };

  if (btnPrimaryRoute) btnPrimaryRoute.addEventListener('click', () => window.toggleRouteMode('primary'));
  if (btnAltRoute) btnAltRoute.addEventListener('click', () => window.toggleRouteMode('alt'));
  if (btnInlineAltTrigger) btnInlineAltTrigger.addEventListener('click', () => window.toggleRouteMode('alt'));

  // Day Filter Tabs Controller
  const dayTabs = document.querySelectorAll('.day-tab');
  const dayBlocks = document.querySelectorAll('.timeline-day-block');
  const mapBreakdownLabel = document.getElementById('mapBreakdownLabel');

  function filterItineraryDay(day) {
    currentActiveDay = day;

    // Update active tab button
    dayTabs.forEach(tab => {
      if (tab.dataset.day === String(day)) tab.classList.add('active');
      else tab.classList.remove('active');
    });

    // Filter timeline blocks
    if (day === 'all') {
      dayBlocks.forEach(b => b.classList.remove('hidden'));
      if (mapBreakdownLabel) mapBreakdownLabel.textContent = 'All Days – Full Island Overview';
      if (itineraryMap && primaryPolyline) {
        itineraryMap.fitBounds(primaryPolyline.getBounds(), { padding: [50, 50] });
      }
    } else {
      const dayNum = parseInt(day);
      dayBlocks.forEach(b => {
        if (b.dataset.dayBlock === String(dayNum)) b.classList.remove('hidden');
        else b.classList.add('hidden');
      });

      const dayNames = {
        1: 'Day 1 – Sigiriya Citadel',
        2: 'Day 2 – Sacred Kandy',
        3: 'Day 3 – Blue Train & Ella',
        4: 'Day 4 – Viaduct & Mirissa',
        5: 'Day 5 – Galle Dutch Fort'
      };
      if (mapBreakdownLabel) mapBreakdownLabel.textContent = dayNames[dayNum] || `Day ${dayNum} Breakdown`;

      // Zoom map to that day's stops
      const dayCoords = Object.values(stopsData)
        .filter(s => s.day === dayNum)
        .map(s => s.coords);

      if (itineraryMap && dayCoords.length > 0) {
        const bounds = L.latLngBounds(dayCoords);
        itineraryMap.flyToBounds(bounds, { padding: [90, 90], maxZoom: 12, duration: 1.2 });
      }
    }
  }

  dayTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterItineraryDay(tab.dataset.day);
    });
  });

  // Bottom Map Navigation Controls
  const btnPrevDay = document.getElementById('btnPrevDay');
  const btnNextDay = document.getElementById('btnNextDay');
  const btnResetMap = document.getElementById('btnResetMap');

  if (btnPrevDay) {
    btnPrevDay.addEventListener('click', () => {
      let nextDay;
      if (currentActiveDay === 'all' || currentActiveDay === '1') nextDay = 5;
      else nextDay = parseInt(currentActiveDay) - 1;
      filterItineraryDay(nextDay);
    });
  }

  if (btnNextDay) {
    btnNextDay.addEventListener('click', () => {
      let nextDay;
      if (currentActiveDay === 'all' || currentActiveDay === '5') nextDay = 1;
      else nextDay = parseInt(currentActiveDay) + 1;
      filterItineraryDay(nextDay);
    });
  }

  if (btnResetMap) {
    btnResetMap.addEventListener('click', () => {
      filterItineraryDay('all');
    });
  }

  // ==========================================
  // THEME SWITCHER (LIGHT / DARK NOCTURNAL MODE)
  // ==========================================
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');
  const mobileThemeToggleBtn = document.getElementById('mobileThemeToggleBtn');
  const mobileThemeIcon = document.getElementById('mobileThemeIcon');
  const mobileThemeLabel = document.getElementById('mobileThemeLabel');

  function updateThemeDisplay(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeIcon) themeIcon.textContent = '☀️';
      if (themeLabel) themeLabel.textContent = 'Light';
      if (mobileThemeIcon) mobileThemeIcon.textContent = '☀️';
      if (mobileThemeLabel) mobileThemeLabel.textContent = 'Switch to Light Mode';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeIcon) themeIcon.textContent = '🌙';
      if (themeLabel) themeLabel.textContent = 'Dark';
      if (mobileThemeIcon) mobileThemeIcon.textContent = '🌙';
      if (mobileThemeLabel) mobileThemeLabel.textContent = 'Switch to Dark Mode';
    }

    // Refresh map layout if rendered
    if (itineraryMap) {
      setTimeout(() => {
        try { itineraryMap.invalidateSize(); } catch(e) {}
      }, 150);
    }
  }

  function handleThemeToggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('smartlanka_theme', nextTheme);
    } catch (e) {
      console.warn('localStorage access error:', e);
    }
    updateThemeDisplay(nextTheme);
  }

  // Sync initial button text with active theme attribute
  const initialTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  updateThemeDisplay(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', handleThemeToggle);
  }
  if (mobileThemeToggleBtn) {
    mobileThemeToggleBtn.addEventListener('click', handleThemeToggle);
  }
});
