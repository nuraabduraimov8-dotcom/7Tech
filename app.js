const defaultLessons = [
    { id: 1, title: "1. LED Blink", desc: "13-пиндегі диодты жыпылықтату.", icon: "💡", status: "active", code: "void setup() {\n  pinMode(13, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}" },
    { id: 2, title: "2. Button & LED", desc: "Батырма арқылы диодты қосу.", icon: "🔘", status: "locked", code: "int btn = 2, led = 13;\nvoid setup() {\n  pinMode(led, OUTPUT);\n  pinMode(btn, INPUT);\n}\nvoid loop() {\n  if(digitalRead(btn) == HIGH) digitalWrite(led, HIGH);\n  else digitalWrite(led, LOW);\n}" },
    { id: 3, title: "3. Potentiometer PWM", desc: "Аналогты сигналмен LED жарықтығын реттеу.", icon: "🎛️", status: "locked", code: "void setup() { pinMode(9, OUTPUT); }\nvoid loop() { analogWrite(9, analogRead(A0)/4); }" },
    { id: 4, title: "4. Servo Motor Control", desc: "Сервомоторды 0-ден 180 градусқа бұру.", icon: "🦾", status: "locked", code: "#include <Servo.h>\nServo myservo;\nvoid setup() { myservo.attach(9); }\nvoid loop() { myservo.write(90); delay(1000); myservo.write(0); delay(1000); }" },
    { id: 5, title: "5. Ultrasonic Sensor HC-SR04", desc: "Ультратавыш сенсорымен қашықтықты өлшеу.", icon: "📏", status: "locked", code: "int trig=9, echo=10;\nvoid setup() {\n  pinMode(trig, OUTPUT); pinMode(echo, INPUT);\n  Serial.begin(9600);\n}\nvoid loop() {\n  digitalWrite(trig, LOW); delayMicroseconds(2);\n  digitalWrite(trig, HIGH); delayMicroseconds(10);\n  digitalWrite(trig, LOW);\n  long duration = pulseIn(echo, HIGH);\n  int distance = duration * 0.034 / 2;\n  Serial.println(distance);\n  delay(500);\n}" },
    { id: 6, title: "6. LCD 1602 Display", desc: "LCD экранға текст шығару.", icon: "🖥️", status: "locked", code: "#include <LiquidCrystal_I2C.h>\nLiquidCrystal_I2C lcd(0x27,16,2);\nvoid setup() {\n  lcd.init(); lcd.backlight();\n  lcd.print(\"S7 Robotics!\");\n}\nvoid loop() {}" },
    { id: 7, title: "7. MQ-2 Gas Sensor", desc: "Газ сенсоры арқылы қауіпті анықтау.", icon: "🚨", status: "locked", code: "int gasPin = A0, buzzer = 8;\nvoid setup() { pinMode(buzzer, OUTPUT); }\nvoid loop() {\n  if(analogRead(gasPin) > 400) tone(buzzer, 1000);\n  else noTone(buzzer);\n}" },
    { id: 8, title: "8. TDS Water Sensor", desc: "Су сапасын (TDS) өлшеу сенсоры.", icon: "💧", status: "locked", code: "void setup() { Serial.begin(9600); }\nvoid loop() {\n  int val = analogRead(A0);\n  Serial.print(\"TDS Value: \"); Serial.println(val);\n  delay(1000);\n}" }
];

let appState = JSON.parse(localStorage.getItem("s7_lms_db_v11")) || {
    users: [],          
    currentUser: null,  
    mentorRequests: [], 
    streak: 1,
    lastLoginDate: null,
    xp: 0,
    lessons: defaultLessons,
    submissions: []
};

function saveData() {
    localStorage.setItem("s7_lms_db_v11", JSON.stringify(appState));
}

window.onload = function() { checkSession(); };

function checkSession() {
    const user = appState.currentUser;
    document.getElementById("authContainer").style.display = "none";
    document.getElementById("studentApp").style.display = "none";
    document.getElementById("mentorApp").style.display = "none";

    if (!user) {
        document.getElementById("authContainer").style.display = "flex";
    } else if (user.role === "student") {
        updateStreak();
        document.getElementById("studentApp").style.display = "block";
        document.getElementById("studentNameDisplay").innerText = user.name;
        document.getElementById("xpCount").innerText = appState.xp;
        renderLessons();
        renderStudentMentorStatus();
    } else if (user.role === "mentor") {
        document.getElementById("mentorApp").style.display = "block";
        document.getElementById("mentorNameDisplay").innerText = user.name;
        renderMentorRequests();
        renderMentorTable();
    }
}

function switchAuthMode(mode) {
    if (mode === 'login') {
        document.getElementById("loginForm").style.display = "block";
        document.getElementById("regForm").style.display = "none";
        document.getElementById("loginTabBtn").className = "duo-btn duo-btn-primary";
        document.getElementById("regTabBtn").className = "duo-btn duo-btn-gray";
    } else {
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("regForm").style.display = "block";
        document.getElementById("loginTabBtn").className = "duo-btn duo-btn-gray";
        document.getElementById("regTabBtn").className = "duo-btn duo-btn-primary";
    }
}

function handleRegister(e) {
    e.preventDefault();
    const role = document.getElementById("regRole").value;
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const phone = document.getElementById("regPhone").value.trim();
    const password = document.getElementById("regPassword").value.trim();

    if (appState.users.some(u => u.email.toLowerCase() === email)) {
        alert("⚠️ Бұл email бұрын тіркелген!");
        return;
    }

    const newUser = { role, name, email, phone, password, mentorEmail: null };
    appState.users.push(newUser);
    appState.currentUser = newUser;
    saveData();
    alert("🎉 Тіркелу сәтті өтті!");
    checkSession();
}

function handleLogin(e) {
    e.preventDefault();
    const id = document.getElementById("loginIdentifier").value.trim().toLowerCase();
    const pass = document.getElementById("loginPassword").value.trim();

    const user = appState.users.find(u => 
        (u.email.toLowerCase() === id || u.phone.trim() === id) && u.password === pass
    );

    if (user) {
        appState.currentUser = user;
        saveData();
        checkSession();
    } else {
        alert("❌ Логин немесе пароль қате!");
    }
}

function sendMentorRequest(e) {
    e.preventDefault();
    const mentorEmail = document.getElementById("targetMentorEmail").value.trim().toLowerCase();

    const mentor = appState.users.find(u => u.email.toLowerCase() === mentorEmail && u.role === 'mentor');

    if (!mentor) {
        alert("❌ Бұл email бойынша Ментор табылмады! Email-дың дұрыс жазылғанын және оның Ментор екенін тексеріңіз.");
        return;
    }

    const existingReq = appState.mentorRequests.find(r => r.studentEmail.toLowerCase() === appState.currentUser.email.toLowerCase());
    if (existingReq) {
        alert("⚠️ Сіз бұған дейін запрос жіберіп қойғансыз!");
        return;
    }

    appState.mentorRequests.push({
        id: Date.now(),
        studentEmail: appState.currentUser.email.toLowerCase(),
        studentName: appState.currentUser.name,
        mentorEmail: mentorEmail,
        status: "Күтілуде"
    });

    saveData();
    alert("📩 Менторға запрос жіберілді!");
    renderStudentMentorStatus();
}

function renderStudentMentorStatus() {
    const box = document.getElementById("mentorStatusBox");
    const req = appState.mentorRequests.find(r => r.studentEmail.toLowerCase() === appState.currentUser.email.toLowerCase());

    if (appState.currentUser.mentorEmail) {
        box.innerHTML = `<p style="color: #22c55e;">✅ Менторыңыз: <strong>${appState.currentUser.mentorEmail}</strong></p>`;
    } else if (req) {
        box.innerHTML = `<p style="color: #f59e0b;">⏳ Запрос жіберілді (${req.mentorEmail}). Ментордың қабылдауын күтіңіз.</p>`;
    }
}

function renderMentorRequests() {
    const list = document.getElementById("mentorRequestsList");
    list.innerHTML = "";

    const myReqs = appState.mentorRequests.filter(r => 
        r.mentorEmail.toLowerCase() === appState.currentUser.email.toLowerCase() && r.status === "Күтілуде"
    );

    if (myReqs.length === 0) {
        list.innerHTML = "<p style='color: #94a3b8;'>Жаңа запростар жоқ</p>";
        return;
    }

    myReqs.forEach(r => {
        const item = document.createElement("div");
        item.style = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; background: #0f172a; padding: 10px; border-radius: 8px;";
        item.innerHTML = `
            <span>👨‍🎓 <strong>${r.studentName}</strong> (${r.studentEmail})</span>
            <button class="duo-btn duo-btn-green" style="padding: 5px 10px; font-size: 12px;" onclick="acceptStudent('${r.studentEmail}', ${r.id})">Қабылдау ✅</button>
        `;
        list.appendChild(item);
    });
}

function acceptStudent(studentEmail, reqId) {
    const req = appState.mentorRequests.find(r => r.id === reqId);
    if (req) req.status = "Қабылданды";

    const student = appState.users.find(u => u.email.toLowerCase() === studentEmail.toLowerCase());
    if (student) {
        student.mentorEmail = appState.currentUser.email.toLowerCase();
        if (appState.currentUser && appState.currentUser.email.toLowerCase() === student.email.toLowerCase()) {
            appState.currentUser.mentorEmail = student.mentorEmail;
        }
    }

    saveData();
    renderMentorRequests();
    alert("✅ Студент сәтті қабылданды!");
}

function updateStreak() {
    const today = new Date().toDateString();
    const lastLogin = appState.lastLoginDate;

    if (!lastLogin) appState.streak = 1;
    else if (lastLogin !== today) {
        const diffDays = Math.round((new Date(today) - new Date(lastLogin)) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) appState.streak += 1;
        else if (diffDays > 1) appState.streak = 1;
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

function renderLessons() {
    const container = document.getElementById("lessonsContainer");
    container.innerHTML = "";

    appState.lessons.forEach((lesson, index) => {
        const node = document.createElement("div");
        node.className = "map-node";
        let btnClass = lesson.status === "completed" ? "duo-btn-green" : (lesson.status === "active" ? "duo-btn-primary" : "duo-btn-gray");

        node.innerHTML = `
            <button class="node-btn ${btnClass}" onclick="${lesson.status !== 'locked' ? `openLessonModal(${lesson.id})` : ''}">
                ${lesson.status === 'completed' ? '✓' : lesson.icon}
            </button>
            <span class="node-label">${lesson.title}</span>
        `;
        container.appendChild(node);

        if (index < appState.lessons.length - 1) {
            const conn = document.createElement("div");
            conn.className = `map-connector ${lesson.status === 'completed' ? 'active' : ''}`;
            container.appendChild(conn);
        }
    });
}

function openLessonModal(id) {
    const lesson = appState.lessons.find(l => l.id === id);
    appState.currentLesson = lesson;
    document.getElementById("modalTitle").innerText = lesson.title;
    document.getElementById("modalDesc").innerText = lesson.desc;
    document.getElementById("modalCode").innerText = lesson.code;
    document.getElementById("compilerConsole").style.display = "none";

    const hasSubmitted = appState.submissions.some(s => 
        s.studentEmail.toLowerCase() === appState.currentUser.email.toLowerCase() && s.lessonTitle === lesson.title
    );

    const form = document.getElementById("submissionForm");
    const msg = document.getElementById("alreadySubmittedMsg");

    if (hasSubmitted) {
        form.style.display = "none";
        msg.style.display = "block";
    } else {
        form.style.display = "block";
        msg.style.display = "none";
        document.getElementById("submissionForm").reset();
    }

    document.getElementById("lessonModal").style.display = "flex";
}

function closeLessonModal() { document.getElementById("lessonModal").style.display = "none"; }

function testCodeRun() {
    const code = document.getElementById("projectCode").value.trim();
    const consoleBox = document.getElementById("compilerConsole");
    consoleBox.style.display = "block";

    if (code.length < 10) {
        consoleBox.style.background = "#fef2f2"; consoleBox.style.color = "#991b1b";
        consoleBox.innerText = "❌ Қате: Код тым қысқа!";
    } else if (!code.includes("setup") || !code.includes("loop")) {
        consoleBox.style.background = "#fff7ed"; consoleBox.style.color = "#c2410c";
        consoleBox.innerText = "⚠️ Ескерту: setup() немесе loop() функциясы жоқ!";
    } else {
        consoleBox.style.background = "#f0fdf4"; consoleBox.style.color = "#166534";
        consoleBox.innerText = "✅ Компиляция сәтті өтті!";
    }
}

function submitProject(e) {
    e.preventDefault();

    let currentMentor = appState.currentUser.mentorEmail;
    if (!currentMentor) {
        const studentReq = appState.mentorRequests.find(r => r.studentEmail.toLowerCase() === appState.currentUser.email.toLowerCase() && r.status === "Қабылданды");
        if (studentReq) {
            currentMentor = studentReq.mentorEmail;
        }
    }

    appState.submissions.push({
        id: Date.now(),
        studentName: appState.currentUser.name,
        studentEmail: appState.currentUser.email.toLowerCase(),
        mentorEmail: currentMentor ? currentMentor.toLowerCase() : null,
        lessonTitle: appState.currentLesson.title,
        code: document.getElementById("projectCode").value,
        media: document.getElementById("projectMedia").value,
        status: "Күтілуде"
    });

    saveData();
    alert("🎉 Жоба Менторға тексеруге жіберілді!");
    closeLessonModal();
}

function renderMentorTable() {
    const tbody = document.getElementById("mentorTableBody");
    tbody.innerHTML = "";

    const mentorEmail = appState.currentUser.email.toLowerCase();
    
    const subs = appState.submissions.filter(s => {
        return !s.mentorEmail || s.mentorEmail.toLowerCase() === mentorEmail;
    });

    if (subs.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:#94a3b8;'>Әзірге тексерілетін тапсырмалар жоқ</td></tr>";
        return;
    }

    subs.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.studentName}</strong></td>
            <td>${item.lessonTitle}</td>
            <td><a href="${item.media}" target="_blank" style="color: #38bdf8;">Wokwi</a></td>
            <td><button class="duo-btn duo-btn-primary" style="padding: 4px 8px; font-size: 12px;" onclick="viewStudentCode('${item.studentName}', '${item.lessonTitle}', ${item.id})">📄 Кодты көру</button></td>
            <td>${item.status === 'Күтілуде' ? `<button class="duo-btn duo-btn-green" style="padding: 4px 8px; font-size: 12px;" onclick="approveSub(${item.id})">Қабылдау</button>` : '✅ Қабылданды'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function viewStudentCode(name, lesson, id) {
    const sub = appState.submissions.find(s => s.id === id);
    if (sub) {
        document.getElementById("codeModalStudentName").innerText = "👨‍🎓 " + name;
        document.getElementById("codeModalLessonTitle").innerText = "📌 " + lesson;
        document.getElementById("codeModalContent").innerText = sub.code;
        document.getElementById("viewCodeModal").style.display = "flex";
    }
}

function closeViewCodeModal() {
    document.getElementById("viewCodeModal").style.display = "none";
}

function approveSub(id) {
    const sub = appState.submissions.find(s => s.id === id);
    if (sub) {
        sub.status = "Қабылданды";
        appState.xp += 50;

        const idx = appState.lessons.findIndex(l => l.title === sub.lessonTitle);
        if (idx !== -1) {
            appState.lessons[idx].status = "completed";
            if (idx + 1 < appState.lessons.length) appState.lessons[idx + 1].status = "active";
        }

        saveData();
        renderMentorTable();
        alert("✅ Тапсырма қабылданды!");
    }
}
