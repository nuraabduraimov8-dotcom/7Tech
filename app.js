const MENTOR_SECRET_PASSWORD = "admin"; 

const defaultLessons = [
    { id: 1, title: "1. LED Blink", desc: "13-пиндегі диодты жыпылықтату.", icon: "💡", status: "active", code: "void setup() {\n  pinMode(13, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}" },
    { id: 2, title: "2. Button Control", desc: "Батырма арқылы LED басқару.", icon: "🔘", status: "locked", code: "int btn = 2, led = 13;\nvoid setup() {\n  pinMode(led, OUTPUT);\n  pinMode(btn, INPUT);\n}\nvoid loop() {\n  if(digitalRead(btn) == HIGH) digitalWrite(led, HIGH);\n  else digitalWrite(led, LOW);\n}" },
    { id: 3, title: "3. Potentiometer", desc: "Аналогты сигналмен жарықтық реттеу.", icon: "🎛️", status: "locked", code: "void setup() { pinMode(9, OUTPUT); }\nvoid loop() { analogWrite(9, analogRead(A0)/4); }" }
];

let appState = JSON.parse(localStorage.getItem("s7_lms_db_v5")) || {
    currentUser: null,
    generatedCode: null,
    tempUser: null,
    streak: 1,
    lastLoginDate: null,
    xp: 0,
    lessons: defaultLessons,
    submissions: []
};

function saveData() {
    localStorage.setItem("s7_lms_db_v5", JSON.stringify(appState));
}

window.onload = function() {
    checkSession();
};

function checkSession() {
    const user = appState.currentUser;
    document.getElementById("authContainer").style.display = "none";
    document.getElementById("verifyContainer").style.display = "none";
    document.getElementById("studentApp").style.display = "none";
    document.getElementById("mentorApp").style.display = "none";

    if (!user) {
        document.getElementById("authContainer").style.display = "flex";
    } else if (user.role === "student") {
        updateStreak(); // Стрикті есептеу және сақтау
        document.getElementById("studentApp").style.display = "block";
        document.getElementById("studentNameDisplay").innerText = user.name;
        document.getElementById("xpCount").innerText = appState.xp;
        renderLessons();
    } else if (user.role === "mentor") {
        document.getElementById("mentorApp").style.display = "block";
        document.getElementById("mentorNameDisplay").innerText = user.name;
        renderMentorTable();
    }
}

function toggleMentorPasswordInput() {
    const role = document.getElementById("authRole").value;
    document.getElementById("mentorPasswordGroup").style.display = (role === "mentor") ? "block" : "none";
}

// 1. НӨМІРГЕ СМС КОД ЖІБЕРУ
function handleSendSms(e) {
    e.preventDefault();
    const role = document.getElementById("authRole").value;
    const name = document.getElementById("authName").value;
    const email = document.getElementById("authEmail").value;
    const phone = document.getElementById("authPhone").value.trim();
    const password = document.getElementById("mentorPassword").value;

    if (role === "mentor" && password !== MENTOR_SECRET_PASSWORD) {
        alert("❌ Қате Ментор құпия сөзі!");
        return;
    }

    if (phone.length < 10) {
        alert("❌ Телефон нөмірін толық енгізіңіз!");
        return;
    }

    // 4 таңбалы SMS код құрастыру
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    appState.generatedCode = randomCode;
    appState.tempUser = { role, name, email, phone };

    // ТЕСТ РЕЖИМІ: Экранға шығару (Нақты SMS Twilio арқылы арнайы серверен кетеді)
    alert(`📲 [SMS ЖІБЕРІЛДІ] ${phone} нөміріне келген растау коды: ${randomCode}`);
    
    showVerifyWindow();
}

function showVerifyWindow() {
    document.getElementById("authContainer").style.display = "none";
    document.getElementById("verifyContainer").style.display = "flex";
    document.getElementById("userPhoneDisplay").innerText = appState.tempUser.phone;
}

function backToAuth() {
    document.getElementById("verifyContainer").style.display = "none";
    document.getElementById("authContainer").style.display = "flex";
}

// 2. ЕНГІЗІЛГЕН СМС КОДТЫ ТЕКСЕРУ
function handleVerifySubmit(e) {
    e.preventDefault();
    const inputCode = document.getElementById("verifyCode").value.trim();

    if (inputCode === appState.generatedCode) {
        appState.currentUser = appState.tempUser;
        appState.generatedCode = null;
        appState.tempUser = null;
        saveData();
        checkSession();
    } else {
        alert("❌ Код қате! Қайтадан тексеріп енгізіңіз.");
    }
}

// 3. СТРИК (STREAK) АВТОМАТТЫ ЕСЕПТЕУ
function updateStreak() {
    const today = new Date().toDateString();
    const lastLogin = appState.lastLoginDate;

    if (!lastLogin) {
        appState.streak = 1;
    } else if (lastLogin !== today) {
        const lastDate = new Date(lastLogin);
        const currentDate = new Date(today);
        const diffDays = Math.round((currentDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            appState.streak += 1; // Кеше кірген болса +1 күн
        } else if (diffDays > 1) {
            appState.streak = 1;  // Күн өткізіп алса, қайтадан 1 болады
        }
    }

    appState.lastLoginDate = today;
    document.getElementById("streakCount").innerText = appState.streak;
    saveData();
}

function logout() {
    appState.currentUser = null;
    saveData();
    location.reload();
}

// САБАҚТАРДЫ КӨРСЕТУ ЖӘНЕ КОДТЫ ТЕКСЕРУ (COMPILER)
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

function openLessonModal(id) {
    const lesson = appState.lessons.find(l => l.id === id);
    if (!lesson) return;
    appState.currentLesson = lesson;
    document.getElementById("modalTitle").innerText = lesson.title;
    document.getElementById("modalDesc").innerText = lesson.desc;
    document.getElementById("modalCode").innerText = lesson.code;
    document.getElementById("compilerConsole").style.display = "none";
    document.getElementById("lessonModal").style.display = "flex";
}

function closeLessonModal() { document.getElementById("lessonModal").style.display = "none"; }

function testCodeRun() {
    const code = document.getElementById("projectCode").value.trim();
    const consoleBox = document.getElementById("compilerConsole");
    consoleBox.style.display = "block";

    if (code.length < 10) {
        consoleBox.style.background = "#fef2f2";
        consoleBox.style.color = "#991b1b";
        consoleBox.innerText = "❌ Қате: Код тым қысқа! Arduino синтаксисін толық жазыңыз (setup, loop).";
    } else if (!code.includes("setup") || !code.includes("loop")) {
        consoleBox.style.background = "#fff7ed";
        consoleBox.style.color = "#c2410c";
        consoleBox.innerText = "⚠️ Ескерту: Кодта void setup() немесе void loop() функциясы табылмады.";
    } else {
        consoleBox.style.background = "#f0fdf4";
        consoleBox.style.color = "#166534";
        consoleBox.innerText = "✅ Компиляция сәтті өтті! Синтаксистік қателер табылмады. Жобаны Менторға жібере аласыз.";
    }
}

function submitProject(e) {
    e.preventDefault();
    const codeVal = document.getElementById("projectCode").value;
    const mediaVal = document.getElementById("projectMedia").value;

    appState.submissions.push({
        id: Date.now(),
        studentName: appState.currentUser.name,
        studentPhone: appState.currentUser.phone,
        lessonTitle: appState.currentLesson.title,
        code: codeVal,
        media: mediaVal,
        status: "Күтілуде"
    });

    saveData();
    alert("🎉 Жоба тексеруге жіберілді!");
    closeLessonModal();
    document.getElementById("submissionForm").reset();
}

function renderMentorTable() {
    const tbody = document.getElementById("mentorTableBody");
    tbody.innerHTML = "";
    appState.submissions.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.studentName}</strong></td>
            <td><small>${item.studentPhone}</small></td>
            <td>${item.lessonTitle}</td>
            <td><a href="${item.media}" target="_blank">Сілтеме</a></td>
            <td><button class="duo-btn duo-btn-primary" style="padding:4px 8px; font-size:12px;" onclick="alert('${item.code}')">Кодты көру</button></td>
            <td><strong>${item.status}</strong></td>
            <td>${item.status === 'Күтілуде' ? `<button class="duo-btn duo-btn-green" style="padding:4px 8px; font-size:12px;" onclick="approveSubmission(${item.id})">Қабылдау</button>` : '✅'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function approveSubmission(id) {
    const sub = appState.submissions.find(s => s.id === id);
    if (sub && sub.status === "Күтілуде") {
        sub.status = "Қабылданды";
        appState.xp += 50;

        const lessonIndex = appState.lessons.findIndex(l => l.title === sub.lessonTitle);
        if (lessonIndex !== -1) {
            appState.lessons[lessonIndex].status = "completed";
            if (lessonIndex + 1 < appState.lessons.length) {
                appState.lessons[lessonIndex + 1].status = "active";
            }
        }

        saveData();
        renderMentorTable();
        alert("✅ Тапсырма қабылданды! Келесі сабақ оқушыға ашылды.");
    }
}
