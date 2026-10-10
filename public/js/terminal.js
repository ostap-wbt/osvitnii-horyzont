// Interactive Cyber Simulator Terminal

(function() {
  const termBody = document.getElementById('terminal-output');
  const termInput = document.getElementById('terminal-input');
  const quickBtns = document.querySelectorAll('.term-btn');

  if (!termBody) return;

  const commandResponses = {
    'help': `
<span class="term-prompt">Доступні системні команди:</span>
  • <span class="term-cyan">scan</span>      - Запустити сканування вразливостей периметру (Cyber Range)
  • <span class="term-cyan">robot</span>     - Отримати телеметрію польотного контролера БПЛА (ROS 2)
  • <span class="term-cyan">vr</span>        - Ініціалізація OpenXR шолома просторових обчислень
  • <span class="term-cyan">net</span>       - Тест затримок магістрального вузла 5G/Cloud Backbone
  • <span class="term-cyan">ai</span>        - Запуск моделі детекції кіберзагроз у реальному часі
  • <span class="term-cyan">status</span>    - Перевірити статус інфраструктури (Atlas + Render)
  • <span class="term-cyan">courses</span>   - Вивести список топових спеціалізацій 2026/2027
  • <span class="term-cyan">clear</span>     - Очистити консоль терміналу
`,
    'scan': `
<span class="term-prompt">[CYBERSEC KERNEL]</span> Ініціалізація інструментів аудиту безпеки...
[>] Протокол: Nmap Stealth SYN-Scan v7.94
[>] Ціль: virtual-lab.horizon.internal [10.128.0.42]
[✓] Порт 22/tcp   - SSH (OpenSSH 9.6) -> ЗАХИЩЕНО (ed25519)
[✓] Порт 443/tcp  - HTTPS (TLS 1.3 ChaCha20-Poly1305) -> ОК
[!] Порт 8080/tcp - SOC Alert: Спроба SQLi нейтралізована WAF.
<span class="term-success">[SUCCESS]</span> Периметр стабільний. Індикатори компрометації (IoC) відсутні.
`,
    'robot': `
<span class="term-prompt">[ROS 2 NODE]</span> Підключення до /drone_quad_alpha/telemetry...
[+] IMU Gyro/Accel: OK (3-axis calibrated)
[+] LiDAR SLAM: Карта простору побудована (1482 хмари точок)
[+] Батарея: 98.4% (LiPo 6S) | Тяга моторів: 1240 rpm
<span class="term-success">[ONLINE]</span> Автономний дрон готовий до місії обльоту периметру.
`,
    'vr': `
<span class="term-prompt">[OPENXR RUNTIME]</span> Пошук гарнітури Spatial Computing...
[✓] Пристрій: Meta Quest 3 / VisionOS Bridge виявлено
[✓] Рендеринг: 90 fps стереопари 4K
[✓] Hand Tracking: Активно (26 суглобів на руку)
<span class="term-pink">[METAVERSE READY]</span> Віртуальна лабораторія завантажена у воксельному просторі.
`,
    'net': `
<span class="term-prompt">[BGP/SDN BACKBONE]</span> Ping Frankfurt Cloud Node (Render Gateway):
64 bytes from render-eu-central.net: icmp_seq=1 ttl=58 time=12.4 ms
64 bytes from render-eu-central.net: icmp_seq=2 ttl=58 time=11.8 ms
64 bytes from render-eu-central.net: icmp_seq=3 ttl=58 time=12.1 ms
<span class="term-success">[STABLE]</span> Втрати пакетів: 0.0% | Пропускна здатність: 10 Gbps SDN.
`,
    'ai': `
<span class="term-prompt">[NEURAL INFERENCE]</span> Запуск трансформера LLM + Threat Detector...
[✓] Вхідний потік: 45,000 подій/сек
[✓] Інференс: 4.2ms на кластері TensorCore
<span class="term-success">[AI COGNITION]</span> Аномалій не виявлено. Рівень довіри: 99.87%.
`,
    'status': `
<span class="term-prompt">[SYSTEM MATRIX]</span>
 • Хостинг платформи: <span class="term-success">Render.com Cloud (Node.js Service)</span>
 • Сховище даних: <span class="term-success">MongoDB Atlas Cluster (ostap.yunak@gmail.com)</span>
 • Репозиторій коду: <span class="term-cyan">GitHub: ostap-wbt/osvitnii-horyzont</span>
 • Статус безпеки: <span class="term-success">Шифрування TLS 1.3 / OWASP Compliant</span>
`,
    'courses': `
<span class="term-prompt">[ДОСТУПНІ НАПРЯМКИ 2026/2027]:</span>
 1. 🛡️ <span class="term-cyan">Етичний хакінг та Кібероборона (SOC)</span> - 6 міс.
 2. 🤖 <span class="term-cyan">Автономні роботи, ROS 2 та STM32</span> - 7 міс.
 3. 🥽 <span class="term-cyan">VR/AR & Просторові інтерфейси</span> - 5 міс.
 4. 🌐 <span class="term-cyan">Цифрові мережі, 5G/6G & DevOps</span> - 5 міс.
 5. 💻 <span class="term-cyan">Fullstack & Штучний інтелект (AI/ML)</span> - 6 міс.
 6. ⚡ <span class="term-cyan">Постквантова криптографія</span> - 4 міс.
Натисніть "Записатися" нижче або введіть форму для бронювання місця.
`
  };

  function appendOutput(html) {
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerHTML = html;
    termBody.appendChild(div);
    termBody.scrollTop = termBody.scrollHeight;
  }

  function handleCommand(cmdRaw) {
    const cmd = cmdRaw.trim().toLowerCase();
    appendOutput(`<span class="term-prompt">horizon@terminal:~$</span> ${cmdRaw}`);

    if (cmd === 'clear') {
      termBody.innerHTML = '';
      return;
    }

    if (commandResponses[cmd]) {
      appendOutput(commandResponses[cmd]);
    } else {
      appendOutput(`<span class="term-warn">Команду '${cmd}' не знайдено.</span> Введіть <span class="term-cyan">help</span> для списку інструкцій.`);
    }
  }

  if (termInput) {
    termInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        const value = termInput.value;
        if (value) {
          handleCommand(value);
          termInput.value = '';
        }
      }
    });
  }

  quickBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const cmd = this.getAttribute('data-cmd');
      if (cmd) {
        handleCommand(cmd);
      }
    });
  });

  // Initial welcome message
  setTimeout(() => {
    appendOutput(`<span class="term-success">● СИСТЕМА ОСВІТНІЙ ГОРИЗОНТ АКТИВОВАНА</span>. Введіть <span class="term-cyan">help</span> або оберіть швидку дію нижче.`);
  }, 400);

})();
