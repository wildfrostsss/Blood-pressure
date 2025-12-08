// script.js

console.log('Дневник давления: script.js загружен.');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, запускается общая инициализация.');

    // --- Глобальные переменные ---
    let currentDate = new Date();
    let selectedDate = null;
    let pressureChart = null;

    // --- Инициализация ---
    initializeTheme();
    registerServiceWorker();
    initNavigation();
    initMeasurementForm();
    initCalendar();
    initCharts();
    initPdf();

    // --- Service Worker ---
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('Service Worker зарегистрирован с областью:', registration.scope);
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    showUpdateNotification();
                                }
                            });
                        });
                    })
                    .catch(error => {
                        console.error('Ошибка регистрации Service Worker:', error);
                    });
            });
        } else {
            console.log('Service Worker не поддерживается в этом браузере');
        }
    }

    function showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <p>Доступна новая версия приложения. Обновите страницу для получения последних функций.</p>
                <button id="update-btn" class="btn">Обновить</button>
                <button id="dismiss-btn" class="btn btn-secondary">Отклонить</button>
            </div>
        `;
        document.body.appendChild(notification);
        document.getElementById('update-btn').addEventListener('click', () => {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        });
        document.getElementById('dismiss-btn').addEventListener('click', () => {
            document.body.removeChild(notification);
        });
    }

    // --- Хранилище ---
    const STORAGE_KEY = 'blood_pressure_measurements';
    const THEME_KEY = 'blood_pressure_theme';

    function saveMeasurement(systolic, diastolic, pulse, datetime) {
        const measurements = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const newMeasurement = {
            systolic: parseInt(systolic),
            diastolic: parseInt(diastolic),
            pulse: parseInt(pulse),
            datetime: datetime
        };
        measurements.push(newMeasurement);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(measurements));
        console.log('Измерение сохранено:', newMeasurement);
        return newMeasurement;
    }

    function getMeasurements() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    }
    
    function getMeasurementsByDate(date) {
        const measurements = getMeasurements();
        const targetDate = new Date(date).toISOString().split('T')[0];
        const filteredMeasurements = measurements.filter(measurement => {
            const measurementDate = new Date(measurement.datetime).toISOString().split('T')[0];
            return measurementDate === targetDate;
        });
        filteredMeasurements.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
        return filteredMeasurements;
    }

    function getMeasurementsByDateRange(startDate, endDate) {
        const measurements = getMeasurements();
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const filteredMeasurements = measurements.filter(measurement => {
            const measurementDate = new Date(measurement.datetime);
            return measurementDate >= start && measurementDate <= end;
        });
        filteredMeasurements.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        return filteredMeasurements;
    }

    function deleteMeasurement(id) {
        let measurements = getMeasurements();
        const index = measurements.findIndex(measurement => new Date(measurement.datetime).getTime() === parseInt(id));
        
        if (index !== -1) {
            measurements.splice(index, 1);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(measurements));
            console.log('Измерение удалено с id:', id);
            return true;
        } else {
            console.error('Измерение с id', id, 'не найдено');
            return false;
        }
    }

    // --- Тема ---
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }
        localStorage.setItem(THEME_KEY, newTheme);
        console.log(`Тема изменена на: ${newTheme}`);
    }

    function initializeTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if(themeToggleBtn) {
            themeToggleBtn.addEventListener('click', toggleTheme);
        }
        console.log(`Тема инициализирована: ${theme}`);
    }

    
    // --- Навигация ---
    function showSection(sectionId) {
        document.querySelectorAll('main section').forEach(section => {
            section.classList.add('hidden');
        });
        const sectionToShow = document.getElementById(sectionId);
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
        }
        if (sectionId === 'calendar-section') {
            const today = new Date().toISOString().split('T')[0];
            selectDate(today, true);
        } else if (sectionId === 'charts-section') {
            handleDateChange();
        }
    }

    function initNavigation() {
        document.querySelectorAll('.tile').forEach(tile => {
            tile.addEventListener('click', () => {
                const sectionId = tile.getAttribute('data-section');
                if (sectionId) {
                    showSection(sectionId);
                }
            });
        });

        document.querySelectorAll('.btn-back').forEach(button => {
            button.addEventListener('click', () => {
                showSection('home-screen');
            });
        });

        // Специальная логика для плитки отчета
        const pdfTile = document.getElementById('pdf-report-tile');
        if (pdfTile) {
            pdfTile.addEventListener('click', (event) => {
                event.stopPropagation(); // Предотвращаем стандартный переход по data-section
                showSection('charts-section');
                // Даем время на отрисовку и прокручиваем
                setTimeout(() => {
                    document.getElementById('generate-pdf-btn').focus();
                    document.getElementById('generate-pdf-btn').scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            });
        }
    }

    // --- Форма добавления ---
    function setCurrentDateTime() {
        const datetimeInput = document.getElementById('datetime');
        if (datetimeInput) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            datetimeInput.value = formattedDateTime;
        }
    }

    function initMeasurementForm() {
        const pressureForm = document.getElementById('pressure-form');
        if (pressureForm) {
            setCurrentDateTime();
            pressureForm.addEventListener('submit', (event) => {
                event.preventDefault();
                
                const systolic = document.getElementById('systolic').value;
                const diastolic = document.getElementById('diastolic').value;
                const pulse = document.getElementById('pulse').value;
                const datetime = document.getElementById('datetime').value;
                
                if (!systolic || !diastolic || !pulse || !datetime) {
                    alert('Пожалуйста, заполните все поля формы');
                    return;
                }
                
                saveMeasurement(systolic, diastolic, pulse, datetime);
                
                pressureForm.reset();
                setCurrentDateTime();
                
                const notification = document.createElement('div');
                notification.className = 'success-notification';
                notification.textContent = 'Измерение успешно сохранено';
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 3000);

                showSection('home-screen');
            });
        }
    }

    // --- Календарь ---
    function getDatesWithMeasurements() {
        const measurements = getMeasurements();
        const dates = new Set();
        measurements.forEach(measurement => {
            const date = new Date(measurement.datetime).toISOString().split('T')[0];
            dates.add(date);
        });
        return dates;
    }

    function generateCalendar(year, month) {
        const calendarDays = document.getElementById('calendar-days');
        if(!calendarDays) return;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        const firstDayIndex = firstDay.getDay() === 0 ? 7 : firstDay.getDay();
        const lastDayIndex = lastDay.getDay() === 0 ? 7 : lastDay.getDay();
        const nextDays = 7 - lastDayIndex;
        
        const datesWithMeasurements = getDatesWithMeasurements();
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;

        calendarDays.innerHTML = '';

        for (let x = firstDayIndex - 1; x > 0; x--) {
            const day = prevLastDay.getDate() - x + 1;
            calendarDays.appendChild(createDayElement(day, true, false, false, ''));
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const isToday = dateString === todayString;
            const hasMeasurements = datesWithMeasurements.has(dateString);
            const isSelected = selectedDate === dateString;
            calendarDays.appendChild(createDayElement(i, false, isToday, hasMeasurements, dateString, isSelected));
        }

        for (let j = 1; j <= nextDays; j++) {
            calendarDays.appendChild(createDayElement(j, true, false, false, ''));
        }
    }

    function createDayElement(day, isOtherMonth, isToday, hasMeasurements, dateString, isSelected = false) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        if (isOtherMonth) dayElement.classList.add('other-month');
        if (isToday) dayElement.classList.add('today');
        if (hasMeasurements) dayElement.classList.add('has-measurements');
        if (isSelected) dayElement.classList.add('selected');
        if (!isOtherMonth && dateString) {
            dayElement.addEventListener('click', () => selectDate(dateString));
        }
        return dayElement;
    }

    function selectDate(dateString, showMeasurementsList = true) {
        selectedDate = dateString;
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        
        const selectedDateObj = new Date(dateString);
        const formattedDate = selectedDateObj.toLocaleDateString('ru-RU');
        const measurementsListHeader = document.querySelector('#measurements-list h2');
        if(measurementsListHeader) {
            measurementsListHeader.textContent = `Измерения за ${formattedDate}`;
        }

        const measurements = getMeasurementsByDate(dateString);
        displayMeasurements(measurements);
        
        if (showMeasurementsList) {
            showSection('measurements-list');
        }
    }

    function displayMeasurements(measurements) {
        const container = document.getElementById('measurements-container');
        if (!container) return;
        container.innerHTML = '';

        if (measurements.length === 0) {
            container.innerHTML = '<p class="no-measurements">Нет измерений за выбранную дату</p>';
            return;
        }

        measurements.forEach(measurement => {
            const measurementElement = document.createElement('div');
            measurementElement.className = 'measurement-item';
            const datetime = new Date(measurement.datetime);
            const formattedDate = datetime.toLocaleDateString('ru-RU');
            const formattedTime = datetime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const timestamp = new Date(measurement.datetime).getTime();
            
            measurementElement.innerHTML = `
                <div class="measurement-data">
                    <div class="measurement-values">
                        <span class="pressure">${measurement.systolic}/${measurement.diastolic}</span>
                        <span class="pulse">${measurement.pulse}</span>
                    </div>
                    <div class="measurement-datetime">
                        <span class="date">${formattedDate}</span>
                        <span class="time">${formattedTime}</span>
                    </div>
                </div>
                <div class="measurement-actions">
                    <button class="btn btn-small btn-delete" data-id="${timestamp}">Удалить</button>
                </div>`;
            container.appendChild(measurementElement);
        });
    }

    function handleDeleteButtonClick(event) {
        if (event.target.classList.contains('btn-delete')) {
            const id = event.target.getAttribute('data-id');
            if (confirm('Вы уверены, что хотите удалить это измерение?')) {
                if(deleteMeasurement(id)) {
                    const currentMeasurements = getMeasurementsByDate(selectedDate);
                    displayMeasurements(currentMeasurements);
                    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
                }
            }
        }
    }

    function initCalendar() {
        const calendarContainer = document.getElementById('calendar-container');
        if (!calendarContainer) return;

        document.getElementById('prev-month').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });
        document.getElementById('next-month').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });

        const measurementsContainer = document.getElementById('measurements-container');
        if (measurementsContainer) {
            measurementsContainer.addEventListener('click', handleDeleteButtonClick);
        }

        const today = new Date().toISOString().split('T')[0];
        selectedDate = today;
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }

    // --- Графики ---
    function renderChart(startDate, endDate) {
        const measurements = getMeasurementsByDateRange(startDate, endDate);
        const ctx = document.getElementById('pressure-chart').getContext('2d');

        if (pressureChart) {
            pressureChart.destroy();
        }
        
        if (measurements.length === 0) {
            // Очищаем canvas если данных нет
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            return;
        }

        const labels = measurements.map(m => {
            const date = new Date(m.datetime);
            return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        });
        const systolicData = measurements.map(m => m.systolic);
        const diastolicData = measurements.map(m => m.diastolic);
        const pulseData = measurements.map(m => m.pulse);

        pressureChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Систолическое',
                        data: systolicData,
                        borderColor: '#ff6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Диастолическое',
                        data: diastolicData,
                        borderColor: '#36a2eb',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Пульс',
                        data: pulseData,
                        borderColor: '#4bc0c0',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: 'Значение' },
                        grid: {
                            color: function(context) {
                                if (context.tick.value === 120) return 'rgba(255, 99, 132, 0.7)';
                                if (context.tick.value === 80) return 'rgba(54, 162, 235, 0.7)';
                                return 'rgba(0, 0, 0, 0.1)';
                            },
                            lineWidth: function(context) {
                                if (context.tick.value === 120 || context.tick.value === 80) return 2;
                                return 1;
                            }
                        }
                    },
                    x: {
                        title: { display: true, text: 'Дата и время' }
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Динамика давления и пульса' }
                }
            }
        });
    }

    function setInitialDates() {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        document.getElementById('start-date').value = weekAgo.toISOString().split('T')[0];
        document.getElementById('end-date').value = today.toISOString().split('T')[0];
    }

    function handleDateChange() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        if (startDate && endDate) {
            document.querySelectorAll('.btn-range').forEach(btn => btn.classList.remove('active'));
            renderChart(startDate, endDate);
        }
    }

    function initCharts() {
        const chartsContainer = document.getElementById('charts-container');
        if (!chartsContainer) return;
        
        setInitialDates();
        
        document.getElementById('week-btn').addEventListener('click', () => {
            const today = new Date();
            const weekAgo = new Date();
            weekAgo.setDate(today.getDate() - 7);
            document.getElementById('start-date').value = weekAgo.toISOString().split('T')[0];
            document.getElementById('end-date').value = today.toISOString().split('T')[0];
            document.querySelectorAll('.btn-range').forEach(btn => btn.classList.remove('active'));
            document.getElementById('week-btn').classList.add('active');
            renderChart(weekAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
        });

        document.getElementById('month-btn').addEventListener('click', () => {
            const today = new Date();
            const monthAgo = new Date();
            monthAgo.setMonth(today.getMonth() - 1);
            document.getElementById('start-date').value = monthAgo.toISOString().split('T')[0];
            document.getElementById('end-date').value = today.toISOString().split('T')[0];
            document.querySelectorAll('.btn-range').forEach(btn => btn.classList.remove('active'));
            document.getElementById('month-btn').classList.add('active');
            renderChart(monthAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
        });
        
        document.getElementById('start-date').addEventListener('change', handleDateChange);
        document.getElementById('end-date').addEventListener('change', handleDateChange);
        
        document.getElementById('week-btn').classList.add('active');
        handleDateChange();
    }

    // --- PDF Generation ---
    async function generatePdf() {
        try {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            if (!startDate || !endDate) {
                alert('Пожалуйста, выберите период для генерации отчета');
                return;
            }
            const measurements = getMeasurementsByDateRange(startDate, endDate);
            if (measurements.length === 0) {
                alert('За выбранный период нет измерений');
                return;
            }

            const generateBtn = document.getElementById('generate-pdf-btn');
            const originalText = generateBtn.textContent;
            generateBtn.textContent = 'Генерация...';
            generateBtn.disabled = true;
            
            const pdfTemplate = document.getElementById('pdf-report');
            pdfTemplate.style.display = 'block'; // Показываем шаблон для рендеринга
            
            fillPdfTemplate(measurements, startDate, endDate);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const canvas = await html2canvas(pdfTemplate, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            
            pdfTemplate.style.display = 'none'; // Скрываем шаблон обратно

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            const start = new Date(startDate).toLocaleDateString('ru-RU').replace(/\./g, '-');
            const end = new Date(endDate).toLocaleDateString('ru-RU').replace(/\./g, '-');
            pdf.save(`Отчет_давление_${start}_${end}.pdf`);
            
            generateBtn.textContent = originalText;
            generateBtn.disabled = false;

        } catch (error) {
            console.error('Ошибка при генерации PDF:', error);
            alert('Произошла ошибка при генерации PDF.');
            const generateBtn = document.getElementById('generate-pdf-btn');
            generateBtn.textContent = 'Сгенерировать PDF';
            generateBtn.disabled = false;
            document.getElementById('pdf-report').style.display = 'none';
        }
    }

    function fillPdfTemplate(measurements, startDate, endDate) {
        document.querySelector('#pdf-report .report-period').textContent = `Период: с ${new Date(startDate).toLocaleDateString('ru-RU')} по ${new Date(endDate).toLocaleDateString('ru-RU')}`;
        const tableBody = document.querySelector('#pdf-report .measurements-table-body');
        tableBody.innerHTML = '';
        measurements.forEach(m => {
            const row = document.createElement('tr');
            const date = new Date(m.datetime);
            row.innerHTML = `
                <td>${date.toLocaleDateString('ru-RU')}</td>
                <td>${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
                <td>${m.systolic}</td>
                <td>${m.diastolic}</td>
                <td>${m.pulse}</td>
            `;
            tableBody.appendChild(row);
        });

        if (measurements.length > 0) {
            const avgSyst = Math.round(measurements.reduce((a, b) => a + b.systolic, 0) / measurements.length);
            const avgDias = Math.round(measurements.reduce((a, b) => a + b.diastolic, 0) / measurements.length);
            const avgPul = Math.round(measurements.reduce((a, b) => a + b.pulse, 0) / measurements.length);
            document.querySelector('#pdf-report .avg-systolic').textContent = avgSyst;
            document.querySelector('#pdf-report .avg-diastolic').textContent = avgDias;
            document.querySelector('#pdf-report .avg-pulse').textContent = avgPul;
            document.querySelector('#pdf-report .count').textContent = measurements.length;
        }
        document.querySelector('#pdf-report .generation-date').textContent = new Date().toLocaleString('ru-RU');
    }

    function initPdf() {
        const generateBtn = document.getElementById('generate-pdf-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', generatePdf);
        }
    }
});