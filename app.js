const MENTOR_SECRET_KEY = "admin"; 

const defaultLessons = [
    { id: 1, title: "1. LED Blink", desc: "13-пиндегі диодты жыпылықтату.", icon: "💡", status: "active", code: "void setup() {\n  pinMode(13, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}" },
    { id: 2, title: "2. Button Control", desc: "Батырма арқылы LED басқару.", icon: "🔘", status: "locked", code: "int btn = 2, led = 13;\nvoid setup() {\n  pinMode(led, OUTPUT);\n  pinMode(btn, INPUT);\n}\nvoid loop() {\n  if(digitalRead(btn) == HIGH) digitalWrite(led, HIGH);\n  else digitalWrite(led, LOW);\n}" },
    { id: 3, title: "3. Potentiometer", desc: "Аналогты сигналмен жарықтық реттеу.", icon: "🎛️", status: "locked", code: "void setup() { pinMode(9, OUTPUT); }\nvoid loop() { analogWrite(9, analogRead(A0)/4); }" }
];

let appState = JSON.parse(localStorage.getItem("s7_lms_db_v7")) || {
    users: [],          // Базадағы барлық қолданушылар
    currentUser: null,  // Ағымдағы жүйеге кірген қолданушы
    streak: 1,
    lastLoginDate: null,
    xp: 0,
    lessons: defaultLessons,
    submissions: []
};

function saveData() {
    localStorage.setItem("s7_lms_db_v7", JSON.stringify(appState));
}

window.onload = function() {
    checkSession();
};

function checkSession() {
    const user = appState.currentUser;
    document.getElementById("authContainer").style.display = "none";
    document.getElementById("studentApp").style.display = "none";
    document.getElementById("mentorApp").style.display = "none";

    if (!user) {
        document.getElementById("authContainer").style.display = "flex";
    } else if (user.role === "student") {
        updateStreak(); // Стрикті тексеру және сақтау
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

// Войти / Тіркелу формасын ауыстыру
function switchAuthMode(mode) {
    const loginForm = document.getElementById("loginForm");
    const regForm = document.getElementById("regForm");
    const loginBtn = document.getElementById("loginTabBtn");
    const regBtn = document.getElementById("regTabBtn");

    if (mode === 'login') {
        loginForm.style.display = "block";
        regForm.style.display = "none";
        loginBtn.className = "duo-btn duo-btn-primary";
        regBtn.className = "duo-btn duo-btn-gray";
    } else {
        loginForm.style.display = "none";
        regForm.style.display = "block";
        loginBtn.className = "duo-btn duo-btn-gray";
        regBtn.className = "duo-btn duo-btn-primary";
    }
}

function toggleMentorPasswordInput() {
    const role = document.getElementById("regRole").value;
    document.getElementById("mentorPasswordGroup").style.display = (role === "mentor") ? "block" : "none";
}

// 1. ТІРКЕЛУ (АҚПАРАТ МЕН ПАРОЛЬДІ САҚТАУ)
function handleRegister(e) {
    e.preventDefault();
    const role = document.getElementById("regRole").value;
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const phone = document.getElementById("regPhone").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const mentorSecret = document.getElementById("mentorSecret").value.trim();

    if (role === "mentor" && mentorSecret !== MENTOR_SECRET_KEY) {
        alert("❌ Ментордың арнайы коды қате!");
        return;
    }

    // Нөмір немесе email бұрын тіркелгенін тексеру
    const existingUser = appState.users.find(u => u.email === email || u.phone === phone);
    if (existingUser) {
        alert("⚠️ Бұл email немесе телефон бұрын тіркелген! Кіру батырмасын басыңыз.");
        switchAuthMode('login');
        return;
    }

    const newUser = { role, name, email, phone, password };
    appState.users.push(newUser);
    appState.currentUser = newUser;
    saveData();

    alert("🎉 Сәтті тіркелдіңіз!");
    checkSession();
}

// 2. ВОЙТИ (ПАРOЛЬМЕН КІРУ)
function handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById("loginIdentifier").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value.trim();

    if (appState.users.length === 0) {
        alert("❌ Аккаунт табылмады. Алдымен Тіркеліңіз!");
        switchAuthMode('register');
        return;
    }

    // Email немесе Телефон + Пароль сәйкестігін тексеру
    const user = appState.users.find(u => (u.email === identifier || u.phone === identifier) && u.password === password);

    if (user) {
        appState.currentUser = user;
        saveData();
        checkSession();
    } else {
        alert("❌ Пароль немесе логин қате!");
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
            appState.streak += 1; // Кеше кірген болса, стрик +1
        } else if (diffDays > 1) {
            appState.streak = 1;  // Күн өткізіп алса, сброс болады
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

// САБАҚТАР ЖӘНЕ COMPILER
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
