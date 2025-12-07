document.addEventListener('DOMContentLoaded', () => {
    console.log('charts.js загружен');

    let pressureChart = null;
    const chartsContainer = document.getElementById('charts-container');

    if (chartsContainer) {
        initCharts();
        initPdf();
    }

    function renderChart(startDate, endDate) {
        const measurements = getMeasurementsByDateRange(startDate, endDate);
        const ctx = document.getElementById('pressure-chart').getContext('2d');

        if (pressureChart) {
            pressureChart.destroy();
        }

        if (measurements.length === 0) {
            // Можно показать сообщение, что данных нет
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
        handleDateChange(); // Первоначальная отрисовка
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
            
            // PDF-шаблон находится в основном HTML, его нужно будет заполнить
            fillPdfTemplate(measurements, startDate, endDate);
            
            await new Promise(resolve => setTimeout(resolve, 500)); // Ждем отрисовки
            
            const element = document.getElementById('pdf-report');
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            
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
        document.getElementById('generate-pdf-btn').addEventListener('click', generatePdf);
    }
});