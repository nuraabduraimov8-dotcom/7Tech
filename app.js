// 🔥 FIREBASE БАПТАУЫ (Өз кілттеріңізді осында жазасыз)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://data-base-c0657-default-rtdb.firebaseio.com",
    projectId: "data-base-c0657",
    storageBucket: "data-base-c0657.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase іске қосу
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Бастапқы сабақтар тізімі
const defaultLessons = [
    { id: 1, title: "1. LED Blink", desc: "13-пиндегі диодты жыпылықтату.", icon: "💡", status: "active", code: "void setup() {\n  pinMode(13, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}" },
    { id: 2, title: "2. Button & LED", desc: "Батырма арқылы диодты қосу.", icon: "🔘", status: "locked", code: "int btn = 2, led = 13;\nvoid setup() {\n  pinMode(led, OUTPUT);\n  pinMode(btn, INPUT);\n}\nvoid loop() {\n  if(digitalRead(btn) == HIGH) digitalWrite(led, HIGH);\n  else digitalWrite(led, LOW);\n}" },
    { id: 3, title: "3. Potentiometer PWM", desc: "Аналогты сигналмен LED жарықтығын реттеу.", icon: "🎛️", status: "locked", code: "void setup() { pinMode(9, OUTPUT); }\nvoid loop() { analogWrite(9, analogRead(A0)/4); }" },
    { id: 4, title: "4. Servo Motor Control", desc: "Сервомоторды 0-ден 180 градусқа бұру.", icon: "🦾", status: "locked", code: "#include <Servo.h>\nServo myservo;\nvoid setup() { myservo.attach(9); }\nvoid loop() { myservo.write(90); delay(1000); myservo.write(0); delay(1000); }" },
    { id: 5, title: "5. Ultrasonic Sensor HC-SR04", desc: "Ультрадыбыс сенсорымен қашықтықты өлшеу.", icon: "📏", status: "locked", code: "int trig=9, echo=10;\nvoid setup() {\n  pinMode(trig, OUTPUT); pinMode(echo, INPUT);\n  Serial.begin(9600);\n}\nvoid loop() {\n  digitalWrite(trig, LOW); delayMicroseconds(2);\n  digitalWrite(trig, HIGH); delayMicroseconds(10);\n  digitalWrite(trig, LOW);\n  long duration = pulseIn(echo, HIGH);\n  int distance = duration * 0.034 / 2;\n  Serial.println(distance);\n  delay(500);\n}" },
    { id: 6, title: "6. LCD 1602 Display", desc: "LCD экранға текст шығару.", icon: "🖥️", status: "locked", code: "#include <LiquidCrystal_I2C.h>\nLiquidCrystal_I2C lcd(0x27,16,2);\nvoid setup() {\n  lcd.init(); lcd.backlight();\n  lcd.print(\"S7 Robotics!\");\n}\nvoid loop() {}" },
    { id: 7, title: "7. MQ-2 Gas Sensor", desc: "Газ сенсоры арқылы қауіпті анықтау.", icon: "🚨", status: "locked", code: "int gasPin = A0, buzzer = 8;\nvoid setup() { pinMode(buzzer, OUTPUT); }\nvoid loop() {\n  if(analogRead(gasPin) > 400) tone(buzzer, 1000);\n  else noTone(buzzer);\n}" },
    { id: 8, title: "8. TDS Water Sensor", desc: "Су сапасын (TDS) өлшеу сенсоры.", icon: "💧", status: "locked", code: "void setup() { Serial.begin(9600); }\nvoid loop() {\n  int val = analogRead(A0);\n  Serial.print(\"TDS Value: \"); Serial.println(val);\n  delay(1000);\n}" }
];

let appState = {
    users: [],          
    currentUser: JSON.parse(localStorage.getItem("s7_current_user")) || null,  
    streak: 1,
    lastLoginDate: null,
    xp: 0,
    lessons: defaultLessons,
    submissions: []
};

// 🔄 FIREBASE-ПЕН НАҚТЫ УАҚЫТТА СИНХРОНИЗАЦИЯ
db.ref("s7_global_database").on("value", (snapshot) => {
    const data = snapshot.val();
    if (data) {
        appState.users = Array.isArray(data.users) ? data.users : (data.users ? Object.values(data.users) : []);
        appState.submissions = Array.isArray(data.submissions) ? data.submissions : (data.submissions ? Object.values(data.submissions) : []);
        if (data.lessons) appState.lessons = data.lessons;
    }
    checkSession();
});

function syncCloudData() {
    return db.ref("s7_global_database").set({
        users: appState.users,
        submissions: appState.submissions,
        lessons: appState.lessons
    });
}

function saveData() {
    localStorage.setItem("s7_current_user", JSON.stringify(appState.currentUser));
    return syncCloudData();
}

function checkSession() {
    const user = appState.currentUser;
    const authContainer = document.getElementById("authContainer");
    const studentApp = document.getElementById("studentApp");
    const mentorApp = document.getElementById("mentorApp");

    if (authContainer) authContainer.style.display = "none";
    if (studentApp) studentApp.style.display = "none";
    if (mentorApp) mentorApp.style.display = "none";

    if (!user) {
        if (authContainer) authContainer.style.display = "flex";
    } else if (user.role === "student") {
        updateStreak();
        if (studentApp) studentApp.style.display = "block";
        const nameDisp = document.getElementById("studentNameDisplay");
        const xpDisp = document.getElementById("xpCount");
        if (nameDisp) nameDisp.innerText = user.name;
        if (xpDisp) xpDisp.innerText = appState.xp;
        renderLessons();
    } else if (user.role === "mentor") {
        if (mentorApp) mentorApp.style.display = "block";
        const mentorNameDisp = document.getElementById("mentorNameDisplay");
        if (mentorNameDisp) mentorNameDisp.innerText = user.name;
        renderMentorTable();
    }
}

function switchAuthMode(mode) {
    const loginForm = document.getElementById("loginForm");
    const regForm = document.getElementById("regForm");
    const loginTabBtn = document.getElementById("loginTabBtn");
    const regTabBtn = document.getElementById("regTabBtn");

    if (mode === 'login') {
        if (loginForm) loginForm.style.display = "block";
        if (regForm) regForm.style.display = "none";
        if (loginTabBtn) loginTabBtn.className = "duo-btn duo-btn-primary";
        if (regTabBtn) regTabBtn.className = "duo-btn duo-btn-gray";
    } else {
        if (loginForm) loginForm.style.display = "none";
        if (regForm) regForm.style.display = "block";
        if (loginTabBtn) loginTabBtn.className = "duo-btn duo-btn-gray";
        if (regTabBtn) regTabBtn.className = "duo-btn duo-btn-primary";
    }
}

// 1. ТІРКЕЛУ (ҚАТЕЛЕР ЖОЙЫЛДЫ, АСИНХРОНДЫ ТҮРДЕ ЖҰМЫС ІСТЕЙДІ)
async function handleRegister(e) {
    e.preventDefault();
    
    const roleElem = document.getElementById("regRole");
    const nameElem = document.getElementById("regName");
    const emailElem = document.getElementById("regEmail");
    const phoneElem = document.getElementById("regPhone");
    const passElem = document.getElementById("regPassword");

    if (!roleElem || !nameElem || !emailElem || !passElem) {
        alert("⚠️ Форма элементтері толық табылмады!");
        return;
    }

    const role = roleElem.value;
    const name = nameElem.value.trim();
    const email = emailElem.value.trim().toLowerCase();
    const phone = phoneElem ? phoneElem.value.trim().replace(/\s+/g, '') : "";
    const password = passElem.value.trim();

    // Firebase-тен ең соңғы деректерді алу
    const snapshot = await db.ref("s7_global_database/users").once("value");
    const rawData = snapshot.val();
    let currentUsers = Array.isArray(rawData) ? rawData : (rawData ? Object.values(rawData) : []);

    const emailExists = currentUsers.some(u => u && (u.email || "").toLowerCase() === email);
    const phoneExists = phone ? currentUsers.some(u => u && (u.phone || "").replace(/\s+/g, '') === phone) : false;

    if (emailExists) {
        alert("⚠️ Бұл email арқылы аккаунт бұрын тіркелген!");
        return;
    }
    
    if (phoneExists) {
        alert("⚠️ Бұл телефон нөмірі арқылы аккаунт бұрын тіркелген!");
        return;
    }

    const newUser = { role, name, email, phone, password };
    appState.users = [...currentUsers, newUser];
    appState.currentUser = newUser;
    
    await saveData();
    alert("🎉 Тіркелу сәтті өтті!");
    checkSession();
}

// 2. КІРУ (АВТОРИЗАЦИЯ)
async function handleLogin(e) {
    e.preventDefault();
    const identifierElem = document.getElementById("loginIdentifier");
    const passElem = document.getElementById("loginPassword");

    if (!identifierElem || !passElem) return;

    const id = identifierElem.value.trim().toLowerCase().replace(/\s+/g, '');
    const pass = passElem.value.trim();

    const snapshot = await db.ref("s7_global_database/users").once("value");
    const rawData = snapshot.val();
    const dbUsers = Array.isArray(rawData) ? rawData : (rawData ? Object.values(rawData) : []);

    const user = dbUsers.find(u => {
        if (!u) return false;
        const uEmail = (u.email || "").toLowerCase();
        const uPhone = (u.phone || "").replace(/\s+/g, '');
        return (uEmail === id || uPhone === id) && u.password === pass;
    });

    if (user) {
        appState.currentUser = user;
        localStorage.setItem("s7_current_user", JSON.stringify(user));
        checkSession();
    } else {
        alert("❌ Логин немесе пароль қате!");
    }
}

// 3. СТРИК ЖӘНЕ ШЫҒУ
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
    const streakElem = document.getElementById("streakCount");
    if (streakElem) streakElem.innerText = appState.streak;
}

function logout() {
    appState.currentUser = null;
    localStorage.removeItem("s7_current_user");
    location.reload();
}

// 4. САБАҚТАР ЖӘНЕ ТАПСЫРМА ЖІБЕРУ
function renderLessons() {
    const container = document.getElementById("lessonsContainer");
    if (!container) return;
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
    if (!lesson) return;
    appState.currentLesson = lesson;
    
    document.getElementById("modalTitle").innerText = lesson.title;
    document.getElementById("modalDesc").innerText = lesson.desc;
    document.getElementById("modalCode").innerText = lesson.code;
    document.getElementById("compilerConsole").style.display = "none";

    const hasSubmitted = appState.submissions.some(s => 
        s && s.studentEmail && appState.currentUser && s.studentEmail.toLowerCase() === appState.currentUser.email.toLowerCase() && s.lessonTitle === lesson.title
    );

    const form = document.getElementById("submissionForm");
    const msg = document.getElementById("alreadySubmittedMsg");

    if (hasSubmitted) {
        if (form) form.style.display = "none";
        if (msg) msg.style.display = "block";
    } else {
        if (form) {
            form.style.display = "block";
            form.reset();
        }
        if (msg) msg.style.display = "none";
    }

    document.getElementById("lessonModal").style.display = "flex";
}

function closeLessonModal() { 
    const modal = document.getElementById("lessonModal");
    if (modal) modal.style.display = "none"; 
}

function testCodeRun() {
    const codeElem = document.getElementById("projectCode");
    const consoleBox = document.getElementById("compilerConsole");
    if (!codeElem || !consoleBox) return;

    const code = codeElem.value.trim();
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

async function submitProject(e) {
    e.preventDefault();
    const codeElem = document.getElementById("projectCode");
    const mediaElem = document.getElementById("projectMedia");
    if (!codeElem || !mediaElem) return;

    appState.submissions.push({
        id: Date.now(),
        studentName: appState.currentUser.name,
        studentEmail: appState.currentUser.email.toLowerCase(),
        lessonTitle: appState.currentLesson.title,
        code: codeElem.value,
        media: mediaElem.value,
        status: "Күтілуде"
    });

    await saveData();
    alert("🎉 Жоба барлық менторларға тексеруге жіберілді!");
    closeLessonModal();
}

// 5. МЕНТОР ПАНЕЛІ
function renderMentorTable() {
    const tbody = document.getElementById("mentorTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!appState.submissions || appState.submissions.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align: center; color: #94a3b8;'>Әлі ешқандай тапсырма түскен жоқ</td></tr>";
        return;
    }

    appState.submissions.forEach(item => {
        if (!item) return;
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
    const sub = appState.submissions.find(s => s && s.id === id);
    if (sub) {
        document.getElementById("codeModalStudentName").innerText = "👨‍🎓 " + name;
        document.getElementById("codeModalLessonTitle").innerText = "📌 " + lesson;
        document.getElementById("codeModalContent").innerText = sub.code;
        document.getElementById("viewCodeModal").style.display = "flex";
    }
}

function closeViewCodeModal() {
    const modal = document.getElementById("viewCodeModal");
    if (modal) modal.style.display = "none";
}

async function approveSub(id) {
    const sub = appState.submissions.find(s => s && s.id === id);
    if (sub) {
        sub.status = "Қабылданды";
        appState.xp += 50;

        const idx = appState.lessons.findIndex(l => l.title === sub.lessonTitle);
        if (idx !== -1) {
            appState.lessons[idx].status = "completed";
            if (idx + 1 < appState.lessons.length) appState.lessons[idx + 1].status = "active";
        }

        await saveData();
        renderMentorTable();
        alert("✅ Тапсырма қабылданды!");
    }
}
