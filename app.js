let appState = {
    xp: 120,
    streak: 3,
    gems: 5,
    submissions: [
        {
            id: 1,
            student: "Асан Мұратов",
            lesson: "2-сабақ: Ultrasonic Sensor",
            media: "https://tinkercad.com/demo",
            status: "Күтілуде"
        }
    ]
};

// Рөлді ауыстыру
function switchRole() {
    const role = document.getElementById("roleSelect").value;
    const studentView = document.getElementById("studentView");
    const mentorView = document.getElementById("mentorView");

    if (role === "student") {
        studentView.classList.add("active");
        mentorView.classList.remove("active");
    } else {
        studentView.classList.remove("active");
        mentorView.classList.add("active");
        renderMentorTable();
    }
}

// Modal басқару
function openLessonModal() {
    document.getElementById("lessonModal").style.display = "flex";
}

function closeLessonModal() {
    document.getElementById("lessonModal").style.display = "none";
}

// Тапсырма жіберу
function submitProject(event) {
    event.preventDefault();
    const code = document.getElementById("projectCode").value;
    const media = document.getElementById("projectMedia").value;

    appState.submissions.push({
        id: Date.now(),
        student: "Асан Мұратов",
        lesson: "2-сабақ: Ultrasonic Sensor",
        media: media,
        status: "Күтілуде"
    });

    alert("🎉 Тапсырма менторға жіберілді! Тексеруді күтіңіз.");
    closeLessonModal();
    document.getElementById("submissionForm").reset();
}

// Ментор кестесін жаңарту
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

// Ментордың растауы және XP қосу
function approveSubmission(id) {
    const sub = appState.submissions.find(s => s.id === id);
    if (sub) {
        sub.status = "Қабылданды";
        appState.xp += 50;
        document.getElementById("xpCount").innerText = appState.xp;
        renderMentorTable();
        alert("👏 Жоба қабылданды! Студентке +50 XP берілді.");
    }
}
