// Arduino IDE Негізіндегі Сабақтар Бинлігі
const lessonsData = [
    {
        id: 1,
        title: "1. LED Blink (Жыпылықтау)",
        desc: "Arduino-дағы ең алғашқы сабақ: 13-ші пиндегі диодты жыпылықтату.",
        icon: "💡",
        status: "completed",
        code: `void setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}`
    },
    {
        id: 2,
        title: "2. Button Control (Батырма)",
        desc: "Батырманы басу арқылы жарық диодты қосу мен өшіру.",
        icon: "🔘",
        status: "active",
        code: `int buttonPin = 2;\nint ledPin = 13;\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n  pinMode(buttonPin, INPUT);\n}\n\nvoid loop() {\n  int state = digitalRead(buttonPin);\n  if (state == HIGH) {\n    digitalWrite(ledPin, HIGH);\n  } else {\n    digitalWrite(ledPin, LOW);\n  }\n}`
    },
    {
        id: 3,
        title: "3. Potentiometer (Аналогты сигнал)",
        desc: "Потенциометр арқылы LED жарықтығын реттеу.",
        icon: "🎛️",
        status: "locked",
        code: `int potPin = A0;\nint ledPin = 9;\n\nvoid setup() {\n  pinMode(ledPin, OUTPUT);\n}\n\nvoid loop() {\n  int val = analogRead(potPin);\n  int bright = map(val, 0, 1023, 0, 255);\n  analogWrite(ledPin, bright);\n}`
    },
    {
        id: 4,
        title: "4. Buzzer Melody (Дыбыс шығару)",
        desc: "Пьезодинамик арқылы әртүрлі жиіліктегі дыбыс пен әуен шығару.",
        icon: "🔊",
        status: "locked",
        code: `int buzzer = 8;\n\nvoid setup() {\n  pinMode(buzzer, OUTPUT);\n}\n\nvoid loop() {\n  tone(buzzer, 1000); // 1000Hz\n  delay(500);\n  noTone(buzzer);\n  delay(500);\n}`
    },
    {
        id: 5,
        title: "5. Ultrasonic Sensor (HC-SR04)",
        desc: "Ультрадыбыстық сенсор көмегімен арақашықтықты см-мен өлшеу.",
        icon: "📡",
        status: "locked",
        code: `int trig = 9, echo = 10;\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(trig, OUTPUT);\n  pinMode(echo, INPUT);\n}\nvoid loop() {\n  digitalWrite(trig, LOW);\n  delayMicroseconds(2);\n  digitalWrite(trig, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(trig, LOW);\n  long duration = pulseIn(echo, HIGH);\n  int cm = duration * 0.034 / 2;\n  Serial.println(cm);\n  delay(200);\n}`
    },
    {
        id: 6,
        title: "6. Servo Motor (SG90)",
        desc: "Сервомоторды 0-ден 180 градусқа дейін бұру.",
        icon: "⚙️",
        status: "locked",
        code: `#include <Servo.h>\nServo myServo;\n\nvoid setup() {\n  myServo.attach(9);\n}\n\nvoid loop() {\n  myServo.write(0);\n  delay(1000);\n  myServo.write(180);\n  delay(1000);\n}`
    }
];

let appState = {
    xp: 120,
    currentLesson: null,
    submissions: [
        { id: 1, student: "Асан Мұратов", lesson: "1. LED Blink", media: "https://tinkercad.com/demo1", status: "Қабылданды" }
    ]
};

// Парақша жүктелгенде сабақтарды шығару
window.onload = function() {
    renderLessons();
};

function renderLessons() {
    const container = document.getElementById("lessonsContainer");
    container.innerHTML = "";

    lessonsData.forEach((lesson, index) => {
        const node = document.createElement("div");
        node.className = "map-node";

        let btnClass = "duo-btn-gray";
        let onclickAttr = "";

        if (lesson.status === "completed") {
            btnClass = "duo-btn-green";
            onclickAttr = `openLessonModal(${lesson.id})`;
        } else if (lesson.status === "active") {
            btnClass = "duo-btn-primary";
            onclickAttr = `openLessonModal(${lesson.id})`;
        }

        node.innerHTML = `
            <button class="node-btn ${btnClass}" onclick="${onclickAttr}">
                ${lesson.status === 'completed' ? '✓' : lesson.icon}
            </button>
            <span class="node-label">${lesson.title}</span>
        `;

        container.appendChild(node);

        if (index < lessonsData.length - 1) {
            const connector = document.createElement("div");
            connector.className = `map-connector ${lesson.status === 'completed' ? 'active' : ''}`;
            container.appendChild(connector);
        }
    });
}

// Ментор және Студент режимдерін ауыстыру (XP Түзетілген)
function switchRole() {
    const role = document.getElementById("roleSelect").value;
    const studentView = document.getElementById("studentView");
    const mentorView = document.getElementById("mentorView");
    const studentStats = document.getElementById("studentStats");

    if (role === "student") {
        studentView.classList.add("active");
        mentorView.classList.remove("active");
        studentStats.style.display = "flex"; // Студентте көрсету
    } else {
        studentView.classList.remove("active");
        mentorView.classList.add("active");
        studentStats.style.display = "none"; // Менторда ХИДДЕН (Жасыру)
        renderMentorTable();
    }
}

// Modal Басқару
function openLessonModal(id) {
    const lesson = lessonsData.find(l => l.id === id);
    if (!lesson) return;

    appState.currentLesson = lesson;
    document.getElementById("modalTitle").innerText = lesson.title;
    document.getElementById("modalDesc").innerText = lesson.desc;
    document.getElementById("modalCode").innerText = lesson.code;
    document.getElementById("lessonModal").style.display = "flex";
}

function closeLessonModal() {
    document.getElementById("lessonModal").style.display = "none";
}

function submitProject(event) {
    event.preventDefault();
    const media = document.getElementById("projectMedia").value;

    appState.submissions.push({
        id: Date.now(),
        student: "Асан Мұратов",
        lesson: appState.currentLesson.title,
        media: media,
        status: "Күтілуде"
    });

    alert("🎉 Жоба тексеруге менторға жіберілді!");
    closeLessonModal();
    document.getElementById("submissionForm").reset();
}

function renderMentorTable() {
    const tbody = document.getElementById("mentorTableBody");
    tbody.innerHTML = "";

    appState.submissions.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.student}</strong></td>
            <td>${item.lesson}</td>
            <td><a href="${item.media}" target="_blank">Сілтемені ашу</a></td>
            <td><span style="color: ${item.status === 'Қабылданды' ? '#58cc02' : '#ff9600'}; font-weight:800;">${item.status}</span></td>
            <td>
                ${item.status === 'Күтілуде' 
                    ? `<button class="duo-btn duo-btn-green" style="padding:6px 12px; font-size:12px;" onclick="approveSubmission(${item.id})">Қабылдау (+50 XP)</button>` 
                    : '✅ Тексерілді'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function approveSubmission(id) {
    const sub = appState.submissions.find(s => s.id === id);
    if (sub) {
        sub.status = "Қабылданды";
        appState.xp += 50;
        document.getElementById("xpCount").innerText = appState.xp;
        renderMentorTable();
        alert("👏 Жоба қабылданды! Студентке +50 XP қосылды.");
    }
}

// --- AI CHATBOT LOGIC ---
function toggleAIChat() {
    const chatWin = document.getElementById("aiChatWindow");
    chatWin.style.display = chatWin.style.display === "flex" ? "none" : "flex";
}

function handleAIPress(e) {
    if (e.key === "Enter") sendAIMessage();
}

function sendAIMessage() {
    const input = document.getElementById("aiInput");
    const text = input.value.trim();
    if (!text) return;

    const chatBody = document.getElementById("aiChatBody");

    // User Message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-msg user-msg";
    userMsg.innerText = text;
    chatBody.appendChild(userMsg);

    input.value = "";

    // AI Response Simulation
    setTimeout(() => {
        const aiMsg = document.createElement("div");
        aiMsg.className = "chat-msg ai-msg";
        aiMsg.innerText = getAIResponse(text);
        chatBody.appendChild(aiMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 600);
}

// Карапайым ИИ логикасы
function getAIResponse(query) {
    query = query.toLowerCase();
    if (query.includes("blink") || query.includes("диод")) {
        return "💡 'Blink' сабағында digitalWrite(13, HIGH) светодиодты жағады, ал delay(1000) 1 секунд күтеді!";
    } else if (query.includes("servo") || query.includes("серво")) {
        return "⚙️ Сервомоторды басқару үшін <Servo.h> кітапханасын қосып, write(90) арқылы градус бер!";
    } else if (query.includes("ultrasonic") || query.includes("сенсор")) {
        return "📡 HC-SR04 датчигі ультрадыбыс толқынын жіберіп, кедергіге дейінгі қашықтықты уақытпен есептейді.";
    } else {
        return "🤖 Тамаша сұрақ! Arduino IDE-де кодты тексеру үшін 'Verify' (✓) батырмасын басып, платаға жүктеу үшін 'Upload' (➔) батырмасын қолдан.";
    }
}
