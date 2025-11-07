(function () {
  // === НАСТРОЙКИ (ЗАМЕНИ НИЖЕ НА СВОИ!) ===
  const CONFIG = {
    // Замени на свой Webhook из n8n
    backendUrl: 'https://w3ai.ru/webhook/webhook/chat', 
    // Стили
    position: 'right', // 'left' или 'right'
    mainColor: '#2563eb', // цвет кнопки и сообщений ИИ
    
    // Тексты
    botName: 'Консультант 24/7',
    welcomeMessage: 'Привет! 👋 Как вам удобнее общаться и чем я могу вам помочь?',
    inputPlaceholder: 'Напишите ваш вопрос...',
    
    // Мессенджеры (оставь пустым, если не используешь)
    telegramBot: 'ALAISellerBot',        // Пример: 'my_business_bot'
    whatsappNumber: '79655947120',     // Пример: '79123456789' (без +)
    vkGroup: ''             // Пример: 'my_clinic'
  };

  // Генерируем уникальный ID сессии (сохраняется в браузере)
  let sessionId = localStorage.getItem('ai_session_id');
  if (!sessionId) {
    const randomPart = Math.random().toString(36).substring(2, 8);
    sessionId = 'ai_' + randomPart + '_' + Date.now().toString(36).slice(-6);
    localStorage.setItem('ai_session_id', sessionId);
  }

  // === СОЗДАЁМ ВИДЖЕТ ===
  const container = document.createElement('div');
  container.id = 'custom-chat-widget';
  container.innerHTML = `
    <style>
      #custom-chat-widget {
        position: fixed;
        bottom: 20px;
        ${CONFIG.position}: 20px;
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
        transition: transform 0.2s;
      }
      .chat-toggle-btn:hover {
        transform: scale(1.1);
      }
      .chat-window {
        width: 360px;
        height: 500px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
      }
      .chat-header {
        padding: 16px;
        background: ${CONFIG.mainColor};
        color: white;
        font-weight: 600;
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
        display: none; /* скрыт до выбора "на сайте" */
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
      .channel-selector {
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
      }
      .channel-btn:hover {
        border-color: ${CONFIG.mainColor};
        background: #f8fafc;
      }
    </style>

    <button class="chat-toggle-btn">💬</button>
    <div class="chat-window">
      <div class="chat-header">${CONFIG.botName}</div>
      <div class="chat-messages">
        <div class="message bot-message">${CONFIG.welcomeMessage}</div>
        <div class="channel-selector">
          <p style="margin: 10px 0; font-size: 14px; color: #475569;">Выберите удобный способ связи:</p>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="channel-btn" data-channel="web">💬 На сайте</button>
            ${CONFIG.telegramBot ? `<button class="channel-btn" data-channel="tg">📱 Telegram</button>` : ''}
            ${CONFIG.whatsappNumber ? `<button class="channel-btn" data-channel="wa">💬 WhatsApp</button>` : ''}
            ${CONFIG.vkGroup ? `<button class="channel-btn" data-channel="vk">📘 VK</button>` : ''}
          </div>
        </div>
      </div>
      <div class="chat-input-area">
        <input type="text" class="chat-input" placeholder="${CONFIG.inputPlaceholder}" />
        <button class="send-btn">➤</button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // === ЛОГИКА ===
  const toggleBtn = container.querySelector('.chat-toggle-btn');
  const chatWindow = container.querySelector('.chat-window');
  const messagesEl = container.querySelector('.chat-messages');
  const inputArea = container.querySelector('.chat-input-area');
  const inputEl = container.querySelector('.chat-input');
  const sendBtn = container.querySelector('.send-btn');
  const channelButtons = container.querySelectorAll('.channel-btn');

  toggleBtn.addEventListener('click', () => {
    chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
  });

  channelButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const channel = btn.dataset.channel;
      if (channel === 'web') {
        // Показываем чат
        const selector = container.querySelector('.channel-selector');
        if (selector) selector.remove();
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
      } else {
        addMessage('Этот канал пока не настроен.', false);
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
      addMessage(data.reply || 'Спасибо! Оператор ответит вам в ближайшее время.');
    } catch (err) {
      addMessage('Не удалось отправить сообщение. Попробуйте позже.');
    }

    inputEl.disabled = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

  sendBtn.addEventListener('click', () => sendMessage(inputEl.value));
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage(inputEl.value);
  });
})();