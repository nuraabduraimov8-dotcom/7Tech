const defaultLessons = [
    { id: 1, title: "1. LED Blink", desc: "13-пиндегі диодты жыпылықтату.", icon: "💡", status: "active", code: "void setup() {\n  pinMode(13, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}" },
    { id: 2, title: "2. Button Control", desc: "Батырма арқылы LED басқару.", icon: "🔘", status: "locked", code: "int btn = 2, led = 13;\nvoid setup() {\n  pinMode(led, OUTPUT);\n  pinMode(btn, INPUT);\n}\nvoid loop() {\n  if(digitalRead(btn) == HIGH) digitalWrite(led, HIGH);\n  else digitalWrite(led, LOW);\n}" },
    { id: 3, title: "3. Potentiometer", desc: "Аналогты сигналмен жарықтық реттеу.", icon: "🎛️", status: "locked", code: "void setup() { pinMode(9, OUTPUT); }\nvoid loop() { analogWrite(9, analogRead(A0)/4); }" },
    { id: 4, title: "4. Buzzer Melody", desc: "Пьезодинамиктен дыбыс шығару.", icon: "🔊", status: "locked", code: "void setup() { pinMode(8, OUTPUT); }\nvoid loop() { tone(8, 1000); delay(500); noTone(8); delay(500); }" }
];

// LocalStorage арқылы деректерді жүктеу немесе жаңадан құру
let appState = JSON.parse(localStorage.getItem("s7_appState_v2")) || {
    xp: 0,
    currentLesson: null,
    lessons: defaultLessons,
    submissions: []
};

// Прогрессті сақтау функциясы
function saveState() {
    localStorage.setItem("s7_appState_v2", JSON.stringify(appState));
    updateStatsUI();
}

function updateStatsUI() {
    document.getElementById("xpCount").innerText = appState.xp;
}

window.onload = function() {
    updateStatsUI();
    renderLessons();
};

// Сабақтарды шығару
function renderLessons() {
    const container = document.getElementById("lessonsContainer");
    if (!container) return;
    container.innerHTML = "";

    appState.lessons.forEach((lesson, index) => {
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

        if (index < appState.lessons.length - 1) {
            const connector = document.createElement("div");
            connector.className = `map-connector ${lesson.status === 'completed' ? 'active' : ''}`;
            container.appendChild(connector);
        }
    });
}

function switchRole() {
    const role = document.getElementById("roleSelect").value;
    const studentView = document.getElementById("studentView");
    const mentorView = document.getElementById("mentorView");
    const studentStats = document.getElementById("studentStats");

    if (role === "student") {
        studentView.classList.add("active");
        mentorView.classList.remove("active");
        studentStats.style.display = "flex";
        renderLessons();
    } else {
        studentView.classList.remove("active");
        mentorView.classList.add("active");
        studentStats.style.display = "none";
        renderMentorTable();
    }
}

function openLessonModal(id) {
    const lesson = appState.lessons.find(l => l.id === id);
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

// Оқушы жобаны жібергенде
function submitProject(e) {
    e.preventDefault();
    const codeVal = document.getElementById("projectCode").value;
    const mediaVal = document.getElementById("projectMedia").value;

    appState.submissions.push({
        id: Date.now(),
        student: "Асан Мұратов",
        lesson: appState.currentLesson.title,
        code: codeVal,
        media: mediaVal,
        status: "Күтілуде"
    });
    
    saveState();
    alert("🎉 Жоба тексеруге жіберілді!");
    closeLessonModal();
    document.getElementById("submissionForm").reset();
}

// Ментор кестесі
function renderMentorTable() {
    const tbody = document.getElementById("mentorTableBody");
    tbody.innerHTML = "";
    appState.submissions.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.student}</strong></td>
            <td>${item.lesson}</td>
            <td><a href="${item.media}" target="_blank">Сілтеме</a></td>
            <td><button class="duo-btn duo-btn-primary" style="padding:6px 10px; font-size:12px;" onclick="viewMentorCode(${item.id})">Кодты көру</button></td>
            <td>${item.status}</td>
            <td>${item.status === 'Күтілуде' ? `<button class="duo-btn duo-btn-green" style="padding:6px 10px; font-size:12px;" onclick="approveSubmission(${item.id})">Қабылдау</button>` : '✅'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Ментор кодты көру
function viewMentorCode(id) {
    const sub = appState.submissions.find(s => s.id === id);
    if (sub) {
        document.getElementById("mentorCodeContent").innerText = sub.code || "Код жоқ";
        document.getElementById("mentorCodeModal").style.display = "flex";
    }
}
function closeMentorCodeModal() { document.getElementById("mentorCodeModal").style.display = "none"; }

// Ментор жобаны қабылдағанда (Прогрессті ашу)
function approveSubmission(id) {
    const sub = appState.submissions.find(s => s.id === id);
    if (sub && sub.status === "Күтілуде") {
        sub.status = "Қабылданды";
        appState.xp += 50;
        
        // Сабақтарды тауып, келесі сабақты ашу
        const lessonIndex = appState.lessons.findIndex(l => l.title === sub.lesson);
        if(lessonIndex !== -1) {
            appState.lessons[lessonIndex].status = "completed"; // Ағымдағы аяқталды
            if(lessonIndex + 1 < appState.lessons.length) {
                appState.lessons[lessonIndex + 1].status = "active"; // Келесі ашылды
            }
        }
        
        saveState();
        renderMentorTable();
    }
}

// AI Чат логикасы
function toggleAIChat() {
    const win = document.getElementById("aiChatWindow");
    win.style.display = (win.style.display === "flex") ? "none" : "flex";
}
function handleAIPress(e) { if (e.key === "Enter") sendAIMessage(); }
function sendAIMessage() {
    const input = document.getElementById("aiInput");
    const text = input.value.trim();
    if (!text) return;

    const chatBody = document.getElementById("aiChatBody");
    const uMsg = document.createElement("div");
    uMsg.className = "chat-msg user-msg";
    uMsg.innerText = text;
    chatBody.appendChild(uMsg);
    input.value = "";

    setTimeout(() => {
        const aiMsg = document.createElement("div");
        aiMsg.className = "chat-msg ai-msg";
        aiMsg.innerText = "🤖 Ментордан жауап күтуде... Кодыңызды тексеріп, қателерді консольден қараңыз.";
        chatBody.appendChild(aiMsg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 500);
}
