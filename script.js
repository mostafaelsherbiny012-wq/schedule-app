// تحميل الدروس من LocalStorage
let lessons = JSON.parse(localStorage.getItem('lessons')) || [];

// عرض الدروس عند تحميل الصفحة
window.onload = function() {
    displayLessons();
    checkReminders();
    // التحقق كل دقيقة
    setInterval(checkReminders, 60000);
    // طلب إذن الإشعارات
    requestNotificationPermission();
};

// طلب إذن الإشعارات
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

// إضافة درس جديد
function addLesson() {
    const subject = document.getElementById('subject').value.trim();
    const teacher = document.getElementById('teacher').value.trim();
    const day = document.getElementById('day').value.trim();
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const reminderMinutes = parseInt(document.getElementById('reminderMinutes').value);

    if (!subject || !teacher || !day || !startTime || !endTime) {
        showNotification('⚠️ من فضلك املأ جميع الحقول');
        return;
    }

    // التحقق من صحة الوقت
    if (startTime >= endTime) {
        showNotification('⚠️ وقت البداية يجب أن يكون قبل وقت النهاية');
        return;
    }

    const lesson = {
        id: Date.now(),
        subject,
        teacher,
        day,
        startTime,
        endTime,
        reminderMinutes,
        createdAt: new Date().toISOString()
    };

    lessons.push(lesson);
    localStorage.setItem('lessons', JSON.stringify(lessons));
    displayLessons();
    clearForm();
    showNotification('✅ تم إضافة الدرس بنجاح');
}

// عرض الدروس في الجدول
function displayLessons() {
    const tbody = document.getElementById('scheduleBody');
    if (lessons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;padding:30px;">📭 لا توجد دروس مسجلة</td></tr>';
        return;
    }

    tbody.innerHTML = lessons.map(lesson => `
        <tr>
            <td><strong>${lesson.subject}</strong></td>
            <td>${lesson.teacher}</td>
            <td>${lesson.day}</td>
            <td>${lesson.startTime}</td>
            <td>${lesson.endTime}</td>
            <td><span class="reminder-badge">⏰ ${lesson.reminderMinutes} دقيقة</span></td>
            <td><button class="delete-btn" onclick="deleteLesson(${lesson.id})">🗑️ حذف</button></td>
        </tr>
    `).join('');
}

// حذف درس
function deleteLesson(id) {
    if (confirm('🗑️ هل أنت متأكد من حذف هذا الدرس؟')) {
        lessons = lessons.filter(l => l.id !== id);
        localStorage.setItem('lessons', JSON.stringify(lessons));
        displayLessons();
        showNotification('🗑️ تم حذف الدرس');
    }
}

// مسح حقول النموذج
function clearForm() {
    document.getElementById('subject').value = '';
    document.getElementById('teacher').value = '';
    document.getElementById('day').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
    document.getElementById('reminderMinutes').value = '10';
}

// التحقق من المواعيد للتنبيه
function checkReminders() {
    const now = new Date();
    const currentDay = getDayName(now.getDay());
    const currentTime = formatTime(now.getHours(), now.getMinutes());

    lessons.forEach(lesson => {
        if (lesson.day === currentDay) {
            const reminderTime = getReminderTime(lesson.startTime, lesson.reminderMinutes);
            if (currentTime === reminderTime) {
                showReminder(lesson);
            }
        }
    });
}

// حساب وقت التنبيه
function getReminderTime(startTime, minutesBefore) {
    const [hours, mins] = startTime.split(':').map(Number);
    let totalMins = hours * 60 + mins - minutesBefore;
    if (totalMins < 0) totalMins += 1440;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return formatTime(h, m);
}

// تنسيق الوقت
function formatTime(hours, minutes) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// الحصول على اسم اليوم
function getDayName(dayIndex) {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[dayIndex];
}

// عرض التنبيه مع النطق الصوتي
function showReminder(lesson) {
    const message = `📢 الأستاذ ${lesson.teacher} قرب!`;
    const detail = `⏰ حان وقت مذاكرة مادة ${lesson.subject}`;
    const timeDetail = `📖 يبدأ بعد ${lesson.reminderMinutes} دقيقة`;
    
    // 🔈 التطبيق ينطق الرسالة بصوت
    speakText(`معاد مستر ${lesson.teacher} قرب، حان وقت مذاكرة مادة ${lesson.subject}`);
    
    // تنبيه في المتصفح
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🔔 موعد الدرس قرب!', {
            body: `${message}\n${detail}\n${timeDetail}`,
            icon: '📚'
        });
    }

    // تنبيه على الصفحة (إشعار منبثق)
    showNotification(`🔔 ${message} ${detail} - ${timeDetail}`);
}

// 🔈 دالة النطق الصوتي
function speakText(text) {
    if ('speechSynthesis' in window) {
        // لو في كلام بيشتغل، أوقفه
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-EG'; // اللهجة المصرية
        utterance.rate = 0.9;      // سرعة الكلام (0.1 - 10)
        utterance.pitch = 1;       // نبرة الصوت (0 - 2)
        utterance.volume = 1;      // مستوى الصوت (0 - 1)
        
        // اختيار صوت عربي لو موجود
        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find(voice => voice.lang.startsWith('ar'));
        if (arabicVoice) {
            utterance.voice = arabicVoice;
        }
        
        window.speechSynthesis.speak(utterance);
    } else {
        console.log('متصفحك لا يدعم خاصية النطق');
    }
}

// عرض إشعار على الصفحة (منبثق)
function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    notif.style.display = 'block';
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.display = 'none';
        document.body.removeChild(notif);
    }, 8000);
}
