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
    backendUrl: script.dataset.webhook || 'https://w3ai.ru/webhook/chat',
    privacyUrl: script.dataset.privacyUrl || '#'
  };

  let sessionId = localStorage.getItem('ai_session_id');
  if (!sessionId) {
    const randomPart = Math.random().toString(36).substring(2, 8);
    sessionId = 'ai_' + randomPart + '_' + Date.now().toString(36).slice(-6);
    localStorage.setItem('ai_session_id', sessionId);
  }

  // Создаём структуру чата БЕЗ встроенного <style>
  const container = document.createElement('div');
  container.id = 'custom-chat-widget';
  container.innerHTML = `
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

  // Применяем динамические стили через JS (без CSP-ошибок)
  const style = document.createElement('style');
  style.textContent = `
    .chat-toggle-btn, .chat-header, .user-message, .send-btn, 
    .channel-btn:hover, .close-btn, .bot-avatar {
      background-color: ${CONFIG.mainColor} !important;
      color: white !important;
      border-color: ${CONFIG.mainColor} !important;
    }
    .chat-window {
      background: ${CONFIG.backgroundColor} !important;
    }
    .consent-block a, .channel-btn:hover {
      color: ${CONFIG.mainColor} !important;
    }
  `;
  document.head.appendChild(style);

  // === ЛОГИКА ===
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
        addMessage('Пожалуйста, дайте согласие на обработку Персональных данных, а затем выберите удобный для вас способ связи.', false);
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
      addMessage('Пожалуйста, дайте согласие на обработку Персональных данных, а затем выберите удобный для вас способ связи.', false);
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

  window.openAiChat = function() {
    const chatWindow = document.querySelector('.chat-window');
    const toggleBtn = document.querySelector('.chat-toggle-btn');
    if (chatWindow && toggleBtn) {
      chatWindow.style.display = 'flex';
      toggleBtn.style.display = 'none';
    }
  };
})();
