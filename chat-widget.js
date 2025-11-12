(function () {
  const script = document.currentScript;
  const CONFIG = {
    telegramBot: script.dataset.telegram || '',
    whatsappNumber: script.dataset.whatsapp || '',
    vkGroup: script.dataset.vk || '',
    mainColor: script.dataset.color || '#2563eb',
    backgroundColor: script.dataset.bgColor || '#ffffff',
    botName: script.dataset.botName || 'Агент',
    avatarUrl: script.dataset.avatar || 'https://via.placeholder.com/40/2563eb/ffffff?text=AI',
    welcomeMessage: script.dataset.welcome || 'Здравствуйте! Чем могу помочь?',
    inputPlaceholder: script.dataset.placeholder || 'Напишите ваш вопрос...',
    backendUrl: script.dataset.webhook || 'https://your-n8n-url.com/webhook/chat',
    privacyUrl: script.dataset.privacyUrl || '#'
  };

  let sessionId = localStorage.getItem('ai_session_id');
  if (!sessionId) {
    const randomPart = Math.random().toString(36).substring(2, 8);
    sessionId = 'ai_' + randomPart + '_' + Date.now().toString(36).slice(-6);
    localStorage.setItem('ai_session_id', sessionId);
  }

  const container = document.createElement('div');
  container.id = 'custom-chat-widget';
  container.innerHTML = `
    <style>
      #custom-chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .chat-toggle-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${CONFIG.mainColor};
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        position: relative;
        z-index: 1;
        transition: transform 0.2s;
      }
      .chat-toggle-btn::before,
      .chat-toggle-btn::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: ${CONFIG.mainColor};
        opacity: 0.4;
        z-index: -1;
        animation: pulse 2s infinite;
      }
      .chat-toggle-btn::after {
        animation-delay: 1s;
      }
      @keyframes pulse {
        0% { transform: scale(0.8); opacity: 0.4; }
        100% { transform: scale(2); opacity: 0; }
      }
      .chat-toggle-btn:hover {
        transform: scale(1.1);
        animation: none;
      }
      .chat-toggle-btn:hover::before,
      .chat-toggle-btn:hover::after {
        animation: none;
      }
      .chat-window {
        width: 360px;
        background: ${CONFIG.backgroundColor};
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
        max-height: 80vh;
      }
      .chat-header {
        padding: 16px;
        background: ${CONFIG.mainColor};
        color: white;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
      }
      .close-btn {
        position: absolute;
        right: 12px;
        top: 12px;
        background: rgba(255,255,255,0.2);
        width: 24px;
        height: 24px;
        border: none;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
      .bot-avatar {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        object-fit: cover;
      }
      .chat-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 12px;
        line-height: 1.4;
        word-break: break-word;
      }
      .bot-message {
        align-self: flex-start;
        background: #f1f5f9;
        color: #1e293b;
      }
      .user-message {
        align-self: flex-end;
        background: ${CONFIG.mainColor};
        color: white;
      }
      .chat-input-area {
        display: none;
        padding: 12px;
        border-top: 1px solid #e2e8f0;
      }
      .chat-input {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 24px;
        outline: none;
        font-size: 14px;
      }
      .chat-input:focus {
        border-color: ${CONFIG.mainColor};
      }
      .send-btn {
        width: 36px;
        height: 36px;
        margin-left: 8px;
        background: ${CONFIG.mainColor};
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .channel-selector,
      .consent-block {
        padding: 0 16px 16px;
      }
      .channel-btn {
        padding: 6px 10px;
        font-size: 12px;
        border: 1px solid #cbd5e1;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        flex: 1;
        min-width: 80px;
        color: #333333;
      }
      .channel-btn:hover {
        border-color: ${CONFIG.mainColor};
        background: #f8fafc;
        color: ${CONFIG.mainColor};
      }
	  .channel-btn.full-width {
  		width: 100%;
  		flex: none !important;
  		text-align: center;
  		justify-content: center;
	  }
	  .messenger-row {
  		display: flex;
  		gap: 8px;
  		flex-wrap: wrap;
  		margin-top: 12px;
	  }
      .consent-block label {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 12px;
        color: #475569;
      }
      .consent-block input {
        margin-top: 4px;
      }
      .consent-block a {
        color: ${CONFIG.mainColor};
        text-decoration: underline;
      }

      @media (max-width: 480px) {
        .chat-window {
          width: calc(100vw - 40px);
          max-height: 70vh;
        }
      }
    </style>

    <button class="chat-toggle-btn">💬</button>
    <div class="chat-window">
      <div class="chat-header">
        <img src="${CONFIG.avatarUrl}" class="bot-avatar" alt="Агент" />
        <span>${CONFIG.botName}</span>
        <button class="close-btn">×</button>
      </div>
      <div class="chat-messages">
        <div class="message bot-message">${CONFIG.welcomeMessage}</div>
      <div class="channel-selector">
  	<p style="margin: 10px 0; font-size: 14px; color: #475569;">Выберите способ связи:</p>
  	<button class="channel-btn full-width" data-channel="web">💬 На сайте</button>
  	<div class="messenger-row">
    	${CONFIG.telegramBot ? `<button class="channel-btn" data-channel="tg">📱 Telegram</button>` : ''}
    	${CONFIG.whatsappNumber ? `<button class="channel-btn" data-channel="wa">💬 WhatsApp</button>` : ''}
    	${CONFIG.vkGroup ? `<button class="channel-btn" data-channel="vk">📘 VK</button>` : ''}
  	</div>
	</div>
        <div class="consent-block">
          <label>
            <input type="checkbox" id="consent-checkbox" required>
            Я согласен на обработку персональных данных в соответствии с 
            <a href="${CONFIG.privacyUrl}" target="_blank">Политикой конфиденциальности</a>
          </label>
        </div>
      </div>
      <div class="chat-input-area">
        <input type="text" class="chat-input" placeholder="${CONFIG.inputPlaceholder}" />
        <button class="send-btn">➤</button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const toggleBtn = container.querySelector('.chat-toggle-btn');
  const chatWindow = container.querySelector('.chat-window');
  const closeBtn = container.querySelector('.close-btn');
  const messagesEl = container.querySelector('.chat-messages');
  const inputArea = container.querySelector('.chat-input-area');
  const inputEl = container.querySelector('.chat-input');
  const sendBtn = container.querySelector('.send-btn');
  const consentCheckbox = container.querySelector('#consent-checkbox');
  const channelButtons = container.querySelectorAll('.channel-btn');

  toggleBtn.addEventListener('click', () => {
    chatWindow.style.display = 'flex';
    toggleBtn.style.display = 'none';
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.style.display = 'none';
    toggleBtn.style.display = 'flex';
  });

  channelButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!consentCheckbox.checked) {
        addMessage('Пожалуйста, дайте согласие на обработку ПДн.', false);
        return;
      }
      const channel = btn.dataset.channel;
      if (channel === 'web') {
        container.querySelector('.channel-selector')?.remove();
        container.querySelector('.consent-block')?.remove();
        inputArea.style.display = 'flex';
        addMessage('Отлично! Задавайте ваш вопрос.', false);
      } else if (channel === 'tg' && CONFIG.telegramBot) {
        window.open(`https://t.me/${CONFIG.telegramBot}?start=${sessionId}`, '_blank');
        addMessage('Переход в Telegram…', false);
      } else if (channel === 'wa' && CONFIG.whatsappNumber) {
        window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=ID:%20${sessionId}`, '_blank');
        addMessage('Переход в WhatsApp…', false);
      } else if (channel === 'vk' && CONFIG.vkGroup) {
        window.open(`https://vk.me/${CONFIG.vkGroup}`, '_blank');
        addMessage('Переход в VK…', false);
      }
    });
  });

  function addMessage(text, isUser = false) {
    const msg = document.createElement('div');
    msg.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    msg.textContent = text;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    if (!consentCheckbox.checked) {
      addMessage('Пожалуйста, дайте согласие на обработку ПДн.', false);
      return;
    }
    addMessage(text, true);
    inputEl.value = '';
    inputEl.disabled = true;
    sendBtn.disabled = true;

    try {
      const response = await fetch(CONFIG.backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          timestamp: new Date().toISOString()
        })
      });
      const data = await response.json();
      addMessage(data.reply || 'Спасибо! Оператор ответит позже.');
    } catch (err) {
      addMessage('Ошибка отправки.');
    }

    inputEl.disabled = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

    sendBtn.addEventListener('click', () => sendMessage(inputEl.value));
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage(inputEl.value);
  });

  // === РЕГИСТРИРУЕМ ФУНКЦИЮ ОТКРЫТИЯ ЧАТА ===
  window.openAiChat = function() {
    const chatWindow = document.querySelector('.chat-window');
    const toggleBtn = document.querySelector('.chat-toggle-btn');
    if (chatWindow && toggleBtn) {
      chatWindow.style.display = 'flex';
      toggleBtn.style.display = 'none';
    }
  };
})();



