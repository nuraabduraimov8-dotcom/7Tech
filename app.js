// 1. ТІРКЕЛУ (БІРДЕЙ ДЕРЕКПЕН ҚАЙТА ТІРКЕЛУДІ БЛОКТАУ)
async function handleRegister(e) {
    e.preventDefault();
    const role = document.getElementById("regRole").value;
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const phone = document.getElementById("regPhone").value.trim().replace(/\s+/g, '');
    const password = document.getElementById("regPassword").value.trim();

    // Firebase базасынан ең соңғы қолданушылар тізімін алу
    const snapshot = await db.ref("s7_global_database/users").once("value");
    const rawData = snapshot.val();
    
    // Firebase деректі объект немесе массив түрінде қайтаруы мүмкін, соны сенімді түрде массивке айналдырамыз
    let currentUsers = [];
    if (Array.isArray(rawData)) {
        currentUsers = rawData;
    } else if (rawData) {
        currentUsers = Object.values(rawData);
    }

    // Email немесе Телефон бұрын тіркелгенін қатаң түрде тексеру
    const emailExists = currentUsers.some(u => u && (u.email || "").toLowerCase() === email);
    const phoneExists = currentUsers.some(u => u && (u.phone || "").replace(/\s+/g, '') === phone);

    if (emailExists) {
        alert("⚠️ Бұл email арқылы аккаунт бұрын тіркелген!");
        return;
    }
    
    if (phoneExists) {
        alert("⚠️ Бұл телефон нөмірі арқылы аккаунт бұрын тіркелген!");
        return;
    }

    // Жаңа қолданушыны қосу
    const newUser = { role, name, email, phone, password };
    appState.users = [...currentUsers, newUser];
    appState.currentUser = newUser;
    
    await saveData();
    alert("🎉 Тіркелу сәтті өтті!");
    checkSession();
}
