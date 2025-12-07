// Скрипт для страницы графиков Дневника давления

console.log('Дневник давления: страница графиков загружена.');

// Ключи для хранения данных в localStorage
const STORAGE_KEY = 'blood_pressure_measurements';
const THEME_KEY = 'blood_pressure_theme';

// Глобальная переменная для хранения экземпляра графика
let pressureChart = null;

// Функция для получения измерений за диапазон дат
function getMeasurementsByDateRange(startDate, endDate) {
    // Получаем все измерения из localStorage
    const measurements = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    // Форматируем даты для сравнения
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Устанавливаем конец дня для включительной фильтрации
    
    // Фильтруем измерения по диапазону дат
    const filteredMeasurements = measurements.filter(measurement => {
        const measurementDate = new Date(measurement.datetime);
        return measurementDate >= start && measurementDate <= end;
    });
    
    // Сортируем измерения по времени (старые в начале)
    filteredMeasurements.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    
    return filteredMeasurements;
}

// Функция для отрисовки графика
function renderChart(startDate, endDate) {
    // Получаем измерения за указанный диапазон дат
    const measurements = getMeasurementsByDateRange(startDate, endDate);
    
    // Если нет измерений, показываем сообщение
    if (measurements.length === 0) {
        if (pressureChart) {
            pressureChart.destroy();
            pressureChart = null;
        }
        return;
    }
    
    // Подготавливаем данные для графика
    const labels = measurements.map(m => {
        const date = new Date(m.datetime);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    });
    
    const systolicData = measurements.map(m => m.systolic);
    const diastolicData = measurements.map(m => m.diastolic);
    const pulseData = measurements.map(m => m.pulse);
    
    // Получаем контекст canvas
    const ctx = document.getElementById('pressure-chart').getContext('2d');
    
    // Уничтожаем предыдущий график, если он существует
    if (pressureChart) {
        pressureChart.destroy();
    }
    
    // Создаем новый график
    pressureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Систолическое давление',
                    data: systolicData,
                    borderColor: '#ff6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Диастолическое давление',
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
                    title: {
                        display: true,
                        text: 'Значение'
                    },
                    // Добавляем горизонтальные линии для отметок 120 и 80
                    afterBuildTicks: function(scale) {
                        // Убедимся, что отметки 120 и 80 включены в шкалу
                        if (scale.min > 120) scale.min = 120;
                        if (scale.max < 120) scale.max = 120;
                        if (scale.min > 80) scale.min = 80;
                        if (scale.max < 80) scale.max = 80;
                    },
                    grid: {
                        // Выделяем линии для отметок 120 и 80
                        color: function(context) {
                            if (context.tick.value === 120) {
                                return 'rgba(255, 99, 132, 0.7)'; // Красный цвет для 120
                            }
                            if (context.tick.value === 80) {
                                return 'rgba(54, 162, 235, 0.7)'; // Синий цвет для 80
                            }
                            return 'rgba(0, 0, 0, 0.1)'; // Стандартный цвет для остальных линий
                        },
                        lineWidth: function(context) {
                            if (context.tick.value === 120 || context.tick.value === 80) {
                                return 2; // Увеличиваем толщину линий для отметок 120 и 80
                            }
                            return 1; // Стандартная толщина для остальных линий
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Дата и время'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Динамика артериального давления и пульса'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Функция для установки начальных дат в поля ввода
function setInitialDates() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    // Устанавливаем даты в поля ввода
    document.getElementById('start-date').value = weekAgo.toISOString().split('T')[0];
    document.getElementById('end-date').value = today.toISOString().split('T')[0];
}

// Функция для обработки нажатия на кнопку "Неделя"
function handleWeekButtonClick() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    // Обновляем поля ввода
    document.getElementById('start-date').value = weekAgo.toISOString().split('T')[0];
    document.getElementById('end-date').value = today.toISOString().split('T')[0];
    
    // Обновляем активную кнопку
    document.querySelectorAll('.btn-range').forEach(btn => btn.classList.remove('active'));
    document.getElementById('week-btn').classList.add('active');
    
    // Обновляем график
    renderChart(weekAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
}

// Функция для обработки нажатия на кнопку "Месяц"
function handleMonthButtonClick() {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    
    // Обновляем поля ввода
    document.getElementById('start-date').value = monthAgo.toISOString().split('T')[0];
    document.getElementById('end-date').value = today.toISOString().split('T')[0];
    
    // Обновляем активную кнопку
    document.querySelectorAll('.btn-range').forEach(btn => btn.classList.remove('active'));
    document.getElementById('month-btn').classList.add('active');
    
    // Обновляем график
    renderChart(monthAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
}

// Функция для обработки изменения дат в полях ввода
function handleDateChange() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    // Проверяем, что обе даты выбраны
    if (startDate && endDate) {
        // Убираем активный класс с кнопок предустановок
        document.querySelectorAll('.btn-range').forEach(btn => btn.classList.remove('active'));
        
        // Обновляем график
        renderChart(startDate, endDate);
    }
}

// Функция для инициализации графиков
function initCharts() {
    // Устанавливаем начальные даты
    setInitialDates();
    
    // Добавляем обработчики событий для кнопок
    document.getElementById('week-btn').addEventListener('click', handleWeekButtonClick);
    document.getElementById('month-btn').addEventListener('click', handleMonthButtonClick);
    
    // Добавляем обработчики событий для полей ввода дат
    document.getElementById('start-date').addEventListener('change', handleDateChange);
    document.getElementById('end-date').addEventListener('change', handleDateChange);
    
    // Устанавливаем активную кнопку по умолчанию
    document.getElementById('week-btn').classList.add('active');
    
    // Отображаем график за последнюю неделю
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    renderChart(weekAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
}

// Функция для заполнения шаблона PDF отчета данными
function fillPdfTemplate(measurements, startDate, endDate) {
    // Получаем элементы шаблона
    const reportPeriod = document.querySelector('#pdf-report .report-period');
    const tableBody = document.querySelector('#pdf-report .measurements-table-body');
    const avgSystolic = document.querySelector('#pdf-report .avg-systolic');
    const avgDiastolic = document.querySelector('#pdf-report .avg-diastolic');
    const avgPulse = document.querySelector('#pdf-report .avg-pulse');
    const count = document.querySelector('#pdf-report .count');
    const generationDate = document.querySelector('#pdf-report .generation-date');
    
    // Форматируем период
    const start = new Date(startDate).toLocaleDateString('ru-RU');
    const end = new Date(endDate).toLocaleDateString('ru-RU');
    reportPeriod.textContent = `Период: с ${start} по ${end}`;
    
    // Очищаем таблицу
    tableBody.innerHTML = '';
    
    // Заполняем таблицу измерений
    measurements.forEach(measurement => {
        const row = document.createElement('tr');
        const date = new Date(measurement.datetime);
        const formattedDate = date.toLocaleDateString('ru-RU');
        const formattedTime = date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td>${measurement.systolic}</td>
            <td>${measurement.diastolic}</td>
            <td>${measurement.pulse}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Вычисляем статистику
    if (measurements.length > 0) {
        const systolicValues = measurements.map(m => m.systolic);
        const diastolicValues = measurements.map(m => m.diastolic);
        const pulseValues = measurements.map(m => m.pulse);
        
        const avgSyst = Math.round(systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length);
        const avgDias = Math.round(diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length);
        const avgPul = Math.round(pulseValues.reduce((a, b) => a + b, 0) / pulseValues.length);
        
        avgSystolic.textContent = avgSyst;
        avgDiastolic.textContent = avgDias;
        avgPulse.textContent = avgPul;
        count.textContent = measurements.length;
    } else {
        avgSystolic.textContent = '0';
        avgDiastolic.textContent = '0';
        avgPulse.textContent = '0';
        count.textContent = '0';
    }
    
    // Устанавливаем дату генерации отчета
    const now = new Date();
    generationDate.textContent = now.toLocaleDateString('ru-RU') + ' ' +
                              now.toLocaleTimeString('ru-RU', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                              });
}

// Функция для создания графика в PDF
function createPdfChart(measurements) {
    // Получаем контекст canvas для PDF
    const ctx = document.getElementById('pdf-chart').getContext('2d');
    
    // Уничтожаем предыдущий график, если он существует
    if (window.pdfChartInstance) {
        window.pdfChartInstance.destroy();
    }
    
    // Если нет измерений, не создаем график
    if (measurements.length === 0) {
        return;
    }
    
    // Подготавливаем данные для графика
    const labels = measurements.map(m => {
        const date = new Date(m.datetime);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit'
        });
    });
    
    const systolicData = measurements.map(m => m.systolic);
    const diastolicData = measurements.map(m => m.diastolic);
    const pulseData = measurements.map(m => m.pulse);
    
    // Создаем новый график
    window.pdfChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Систолическое давление',
                    data: systolicData,
                    borderColor: '#ff6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Диастолическое давление',
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
                    title: {
                        display: true,
                        text: 'Значение'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Дата'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Динамика артериального давления и пульса'
                }
            }
        }
    });
}

// Функция для генерации PDF
async function generatePdf() {
    try {
        // Получаем текущий диапазон дат
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        // Проверяем, что даты выбраны
        if (!startDate || !endDate) {
            alert('Пожалуйста, выберите период для генерации отчета');
            return;
        }
        
        // Получаем измерения за выбранный период
        const measurements = getMeasurementsByDateRange(startDate, endDate);
        
        // Проверяем, что есть измерения
        if (measurements.length === 0) {
            alert('За выбранный период нет измерений');
            return;
        }
        
        // Показываем индикатор загрузки
        const generateBtn = document.getElementById('generate-pdf-btn');
        const originalText = generateBtn.textContent;
        generateBtn.textContent = 'Генерация...';
        generateBtn.disabled = true;
        
        // Заполняем шаблон данными
        fillPdfTemplate(measurements, startDate, endDate);
        
        // Создаем график в PDF
        createPdfChart(measurements);
        
        // Ждем небольшое время, чтобы график отрисовался
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Получаем элемент шаблона
        const element = document.getElementById('pdf-report');
        
        // Конвертируем HTML в изображение с помощью html2canvas
        const canvas = await html2canvas(element, {
            scale: 2, // Увеличиваем качество
            useCORS: true,
            logging: false
        });
        
        // Получаем данные изображения
        const imgData = canvas.toDataURL('image/png');
        
        // Создаем PDF с помощью jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Добавляем изображение в PDF
        const imgWidth = 210; // Ширина A4 в мм
        const pageHeight = 297; // Высота A4 в мм
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        // Добавляем первую страницу
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Если изображение не помещается на одной странице, добавляем дополнительные страницы
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Генерируем имя файла
        const start = new Date(startDate).toLocaleDateString('ru-RU').replace(/\./g, '-');
        const end = new Date(endDate).toLocaleDateString('ru-RU').replace(/\./g, '-');
        const fileName = `Отчет_давление_${start}_${end}.pdf`;
        
        // Сохраняем PDF
        pdf.save(fileName);
        
        // Восстанавливаем кнопку
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
        
        console.log('PDF успешно сгенерирован');
    } catch (error) {
        console.error('Ошибка при генерации PDF:', error);
        alert('Произошла ошибка при генерации PDF. Пожалуйста, попробуйте еще раз.');
        
        // Восстанавливаем кнопку в случае ошибки
        const generateBtn = document.getElementById('generate-pdf-btn');
        generateBtn.textContent = 'Сгенерировать PDF';
        generateBtn.disabled = false;
    }
}

// Функция для инициализации PDF-функционала
function initPdf() {
    // Добавляем обработчик события на кнопку генерации PDF
    document.getElementById('generate-pdf-btn').addEventListener('click', generatePdf);
}

// Функция для переключения темы
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Устанавливаем новую тему
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Обновляем иконку
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    
    // Сохраняем выбор в localStorage
    localStorage.setItem(THEME_KEY, newTheme);
    
    console.log(`Тема изменена на: ${newTheme}`);
}

// Функция для инициализации темы
function initTheme() {
    // Получаем сохраненную тему или используем системные настройки
    const savedTheme = localStorage.getItem(THEME_KEY);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Определяем тему: сохраненная > системная > светлая
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    // Устанавливаем тему
    document.documentElement.setAttribute('data-theme', theme);
    
    // Устанавливаем соответствующую иконку
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    
    // Добавляем обработчик события на кнопку переключения темы
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    
    console.log(`Тема инициализирована: ${theme}`);
}

// Функция для инициализации страницы графиков
function initChartsPage() {
    console.log('Начало инициализации страницы графиков...');
    
    // Инициализируем тему
    initTheme();
    
    // Инициализируем графики
    initCharts();
    
    // Инициализируем PDF-функционал
    initPdf();
    
    // Проверяем, нужно ли сразу генерировать PDF (при переходе с главной страницы)
    if (window.location.hash === '#generate-pdf') {
        // Небольшая задержка, чтобы убедиться, что все элементы загружены
        setTimeout(() => {
            generatePdf();
        }, 500);
    }
    
    console.log('Страница графиков инициализирована');
}

// Запускаем инициализацию страницы после загрузки DOM
document.addEventListener('DOMContentLoaded', initChartsPage);