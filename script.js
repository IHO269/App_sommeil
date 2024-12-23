// Constantes
const CYCLE_DURATION = 90; // durée d'un cycle en minutes
const RECOMMENDED_CYCLES = {
    min: 4,
    optimal: 5,
    max: 6
};

// Stockage local
const STORAGE_KEY = 'sleepData';
const THEME_KEY = 'theme';

// Messages personnalisés
const APP_MESSAGES = {
    welcome: "Bienvenue sur 'Le sommeil c'est important'",
    noSleepCycles: "Pas assez de temps pour un cycle complet. Essayez une sieste !",
    optimalWakeTitle: "Heures de réveil recommandées",
    napTitle: "Programme de sieste personnalisé",
    statsTitle: "Vos statistiques de sommeil",
    calendarTitle: "Synchronisation avec votre calendrier",
    notificationTitle: "Le sommeil c'est important - Rappel",
    notificationBody: "Il est temps de préparer votre sommeil !"
};

// Constantes pour le thème
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialisation des événements
    document.getElementById('sleepForm').addEventListener('submit', handleSleepCalculation);
    document.getElementById('optimalWakeForm').addEventListener('submit', handleOptimalWake);
    document.querySelectorAll('.nap-card').forEach(card => {
        card.addEventListener('click', handleNapSelection);
    });
    document.getElementById('smartAlarmToggle').addEventListener('change', toggleSmartAlarmSettings);
    document.getElementById('setSmartAlarm').addEventListener('click', setSmartAlarm);
    
    // Initialisation des boutons de calendrier
    document.getElementById('syncGoogle').addEventListener('click', () => syncCalendar('google'));
    document.getElementById('syncOutlook').addEventListener('click', () => syncCalendar('outlook'));
    
    // Chargement des statistiques
    loadStatistics();
    
    // Ajouter un bouton pour activer les notifications
    const notifButton = document.createElement('button');
    notifButton.className = 'btn btn-primary position-fixed';
    notifButton.style.bottom = '80px';
    notifButton.style.right = '20px';
    notifButton.innerHTML = '<i class="fas fa-bell"></i> Activer les notifications';
    notifButton.onclick = requestNotificationPermission;
    document.body.appendChild(notifButton);
    
    // Initialisation du thème
    initializeTheme();
    
    // Écouteur d'événement pour le changement de thème
    document.getElementById('themeSwitch').addEventListener('click', toggleTheme);
}

// Fonction d'initialisation du thème
function initializeTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || THEMES.LIGHT;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// Fonction de changement de thème
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcon(newTheme);
}

// Mise à jour de l'icône du thème
function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('#themeSwitch i');
    if (theme === THEMES.DARK) {
        themeIcon.className = 'fas fa-moon';
    } else {
        themeIcon.className = 'fas fa-sun';
    }
}

// Fonction principale de calcul des cycles
function handleSleepCalculation(e) {
    e.preventDefault();
    
    const bedtime = document.getElementById('bedtime').value;
    const waketime = document.getElementById('waketime').value;
    
    // Conversion des heures en objets Date
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    let bedDateTime = new Date(today.toDateString() + ' ' + bedtime);
    let wakeDateTime = new Date(today.toDateString() + ' ' + waketime);
    
    // Si l'heure de réveil est avant l'heure de coucher, on considère que c'est le lendemain
    if (wakeDateTime <= bedDateTime) {
        wakeDateTime = new Date(tomorrow.toDateString() + ' ' + waketime);
    }
    
    // Calcul de la différence en minutes
    const diffMinutes = (wakeDateTime - bedDateTime) / (1000 * 60);
    const cycles = Math.floor(diffMinutes / CYCLE_DURATION);
    
    // Sauvegarde des données
    saveSleepData({
        date: today.toISOString(),
        bedtime: bedtime,
        waketime: waketime,
        duration: diffMinutes,
        cycles: cycles
    });
    
    // Affichage des résultats
    displaySleepResults(bedtime, waketime, diffMinutes, cycles);
}

// Fonction pour le calcul du réveil optimal
function handleOptimalWake(e) {
    e.preventDefault();
    
    const bedtime = document.getElementById('optimalBedtime').value;
    const bedDateTime = new Date(new Date().toDateString() + ' ' + bedtime);
    
    // Calcul des heures de réveil optimales (4-6 cycles)
    const wakeOptions = [];
    for (let i = RECOMMENDED_CYCLES.min; i <= RECOMMENDED_CYCLES.max; i++) {
        const wakeTime = new Date(bedDateTime.getTime() + i * CYCLE_DURATION * 60000);
        wakeOptions.push({
            cycles: i,
            time: formatTimeFromDate(wakeTime),
            quality: getWakeQuality(i)
        });
    }
    
    displayOptimalWakeResults(wakeOptions);
}

// Gestion des siestes
function handleNapSelection(e) {
    const card = e.currentTarget;
    const duration = parseInt(card.dataset.duration);
    
    // Retire la sélection précédente
    document.querySelectorAll('.nap-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    
    // Calcul des horaires de sieste optimaux
    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60000);
    const napResult = document.getElementById('napResult');
    
    // Vérifie si l'heure n'est pas trop tardive
    const hour = now.getHours();
    let message = '';
    
    if (hour >= 16) {
        message = `<div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Attention : une sieste après 16h peut perturber votre sommeil nocturne.
        </div>`;
    }
    
    message += `<div class="alert alert-info">
        <h5>${APP_MESSAGES.napTitle} :</h5>
        <p>Début : ${formatTimeFromDate(now)}</p>
        <p>Fin : ${formatTimeFromDate(endTime)}</p>
        <p><i class="fas fa-info-circle me-2"></i>${getNapTips(duration)}</p>
    </div>`;
    
    napResult.innerHTML = message;
}

// Gestion de l'alarme intelligente
function toggleSmartAlarmSettings(e) {
    const settings = document.getElementById('smartAlarmSettings');
    settings.classList.toggle('d-none', !e.target.checked);
}

function setSmartAlarm() {
    const earliest = document.getElementById('alarmEarliest').value;
    const latest = document.getElementById('alarmLatest').value;
    
    if (!earliest || !latest) {
        alert('Veuillez définir une plage horaire complète');
        return;
    }
    
    // Conversion en Date
    const earliestDate = new Date(new Date().toDateString() + ' ' + earliest);
    const latestDate = new Date(new Date().toDateString() + ' ' + latest);
    
    // Vérifie que la plage est d'au moins 90 minutes
    const diffMinutes = (latestDate - earliestDate) / (1000 * 60);
    
    if (diffMinutes < CYCLE_DURATION) {
        alert('La plage horaire doit être d\'au moins 90 minutes');
        return;
    }
    
    // Sauvegarde les paramètres
    localStorage.setItem('smartAlarm', JSON.stringify({
        earliest: earliest,
        latest: latest,
        active: true
    }));
    
    alert('Alarme intelligente activée ! Vous serez réveillé à la fin d\'un cycle entre ' + 
          formatTime(earliest) + ' et ' + formatTime(latest));
}

// Fonctions de synchronisation du calendrier
function syncCalendar(type) {
    // Simulation de la synchronisation
    const button = document.getElementById('sync' + type.charAt(0).toUpperCase() + type.slice(1));
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Synchronisation...';
    
    setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-check me-2"></i>Synchronisé';
        
        // Affichage des événements (simulation)
        const calendarView = document.getElementById('calendarView');
        calendarView.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-calendar-check me-2"></i>
                Calendrier synchronisé avec succès !
            </div>
            <div class="card">
                <div class="card-body">
                    <h6>${APP_MESSAGES.calendarTitle} :</h6>
                    <ul class="list-unstyled">
                        <li><i class="fas fa-clock me-2"></i>Réunion demain à 9h00</li>
                        <li><i class="fas fa-clock me-2"></i>Déjeuner d'équipe à 12h30</li>
                    </ul>
                </div>
            </div>`;
    }, 2000);
}

// Fonctions de gestion des statistiques
function loadStatistics() {
    const sleepData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (sleepData.length > 0) {
        // Calcul des moyennes
        const avgDuration = sleepData.reduce((acc, curr) => acc + curr.duration, 0) / sleepData.length;
        const avgCycles = sleepData.reduce((acc, curr) => acc + curr.cycles, 0) / sleepData.length;
        
        // Affichage des statistiques
        document.getElementById('avgSleepTime').innerHTML = `
            <h2>${Math.floor(avgDuration / 60)}h${Math.floor(avgDuration % 60)}min</h2>
            <p>Moyenne sur ${sleepData.length} nuits</p>`;
        
        // Calcul de la dette de sommeil
        const sleepDebt = calculateSleepDebt(sleepData);
        document.getElementById('sleepDebt').innerHTML = `
            <h2>${Math.abs(sleepDebt)}h</h2>
            <p>${sleepDebt >= 0 ? 'Repos suffisant' : 'Dette de sommeil'}</p>`;
        
        // Création du graphique
        createSleepChart(sleepData);
    } else {
        document.getElementById('stats').innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Commencez à utiliser l'application pour voir vos statistiques !
            </div>`;
    }
}

function createSleepChart(data) {
    const ctx = document.getElementById('sleepChart').getContext('2d');
    const labels = data.slice(-7).map(d => new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }));
    const durations = data.slice(-7).map(d => d.duration / 60);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Heures de sommeil',
                data: durations,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Heures'
                    }
                }
            }
        }
    });
}

// Fonctions utilitaires
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    return `${hours}h${minutes}`;
}

function formatTimeFromDate(date) {
    return `${String(date.getHours()).padStart(2, '0')}h${String(date.getMinutes()).padStart(2, '0')}`;
}

function getWakeQuality(cycles) {
    if (cycles === RECOMMENDED_CYCLES.optimal) return 'Optimal';
    if (cycles === RECOMMENDED_CYCLES.optimal - 1) return 'Bon';
    return 'Acceptable';
}

function getNapTips(duration) {
    switch(duration) {
        case 20:
            return 'Idéale pour une recharge rapide, évite la phase de sommeil profond.';
        case 45:
            return 'Permet d\'entrer en sommeil léger, bon compromis énergie/temps.';
        case 90:
            return 'Cycle complet, incluant du sommeil paradoxal. Meilleure récupération.';
        default:
            return '';
    }
}

function calculateSleepDebt(data) {
    const RECOMMENDED_SLEEP = 8 * 60; // 8 heures en minutes
    const recentData = data.slice(-7); // Dernière semaine
    const totalSleep = recentData.reduce((acc, curr) => acc + curr.duration, 0);
    const avgSleep = totalSleep / recentData.length;
    return (avgSleep - RECOMMENDED_SLEEP) / 60; // Conversion en heures
}

function saveSleepData(data) {
    const existingData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existingData.push(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
}

function displaySleepResults(bedtime, waketime, diffMinutes, cycles) {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = Math.floor(diffMinutes % 60);
    
    // Calcul des horaires pour chaque cycle
    let cyclesDetails = [];
    let currentTime = new Date(new Date().toDateString() + ' ' + bedtime);
    
    for (let i = 0; i < cycles; i++) {
        const startTime = new Date(currentTime);
        currentTime.setMinutes(currentTime.getMinutes() + CYCLE_DURATION);
        const endTime = new Date(currentTime);
        
        cyclesDetails.push({
            cycleNum: i + 1,
            start: formatTimeFromDate(startTime),
            end: formatTimeFromDate(endTime),
            phase: getCyclePhase(i + 1)
        });
    }
    
    // Construction du message HTML
    const resultDiv = document.getElementById('result');
    let message = `
        <div class="alert alert-info">
            <div class="text-center mb-4">
                <p>Entre <strong>${formatTime(bedtime)}</strong> et <strong>${formatTime(waketime)}</strong> :</p>
                <p>Durée de sommeil : <strong>${hours}h${minutes > 0 ? minutes + 'min' : ''}</strong></p>
                <p>Nombre de cycles complets : <strong>${cycles}</strong></p>
            </div>
        </div>
        
        <div class="cycles-table-container">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Cycle</th>
                        <th>Début</th>
                        <th>Fin</th>
                        <th>Phase principale</th>
                    </tr>
                </thead>
                <tbody>`;
    
    cyclesDetails.forEach(cycle => {
        message += `
            <tr>
                <td>
                    <i class="fas fa-moon cycle-icon-small"></i>
                    Cycle ${cycle.cycleNum}
                </td>
                <td>${cycle.start}</td>
                <td>${cycle.end}</td>
                <td>${cycle.phase}</td>
            </tr>`;
    });
    
    message += `
                </tbody>
            </table>
        </div>`;
    
    resultDiv.innerHTML = message;
    
    // Ajout de la visualisation des cycles
    const cyclesVisualization = document.createElement('div');
    cyclesVisualization.className = 'cycles-visualization mt-4';
    const cyclesIcons = document.createElement('div');
    cyclesIcons.className = 'cycles-icons';
    
    for (let i = 0; i < cycles; i++) {
        const icon = document.createElement('i');
        icon.className = 'fas fa-moon cycle-icon';
        icon.style.animationDelay = `${i * 0.2}s`;
        cyclesIcons.appendChild(icon);
    }
    
    cyclesVisualization.appendChild(cyclesIcons);
    resultDiv.appendChild(cyclesVisualization);
}

function displayOptimalWakeResults(options) {
    const resultDiv = document.getElementById('optimalResult');
    let message = `
        <div class="alert alert-info">
            <h5>${APP_MESSAGES.optimalWakeTitle} :</h5>
        </div>
        <div class="row g-3">`;
    
    options.forEach(option => {
        const qualityClass = option.quality === 'Optimal' ? 'success' : 
                           option.quality === 'Bon' ? 'primary' : 'info';
        
        message += `
            <div class="col-md-4">
                <div class="card text-center h-100">
                    <div class="card-body">
                        <h5 class="card-title text-${qualityClass}">${option.time}</h5>
                        <p class="card-text">${option.cycles} cycles</p>
                        <span class="badge bg-${qualityClass}">${option.quality}</span>
                    </div>
                </div>
            </div>`;
    });
    
    message += `
        </div>
        <div class="alert alert-light mt-3">
            <i class="fas fa-info-circle me-2"></i>
            Choisissez l'heure qui correspond le mieux à votre emploi du temps.
        </div>`;
    
    resultDiv.innerHTML = message;
}

function getCyclePhase(cycleNum) {
    switch(cycleNum) {
        case 1:
            return 'Sommeil léger et profond';
        case 2:
            return 'Sommeil profond';
        case 3:
            return 'Sommeil paradoxal';
        case 4:
            return 'Sommeil léger et paradoxal';
        default:
            return 'Sommeil léger et paradoxal';
    }
}

// Fonction pour demander la permission des notifications
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // Afficher un message de confirmation
            showToast("Notifications activées pour 'Le sommeil c'est important'");
            subscribeToNotifications();
        }
    }
}

// S'abonner aux notifications push
async function subscribeToNotifications() {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'VOTRE_CLE_PUBLIQUE_VAPID'
        });

        // Envoyer l'abonnement au serveur
        await fetch('http://localhost:3000/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription)
        });
    }
}

function displayStatistics(stats) {
    const statsContainer = document.getElementById('statsContainer');
    statsContainer.innerHTML = `
        <h3>${APP_MESSAGES.statsTitle}</h3>
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">Le sommeil c'est important - Vos données</h5>
                {{ ... }}
            </div>
        </div>
    `;
}
