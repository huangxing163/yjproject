class YogaCourseManager {
    constructor() {
        this.courses = JSON.parse(localStorage.getItem('yogaCourses')) || [];
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeMonthSelector();
        this.renderCourses();
        this.updateTotalHours();
        this.updateLocationStats();
    }

    initializeElements() {
        this.form = document.getElementById('yogaForm');
        this.courseList = document.getElementById('courseList');
        this.exportBtn = document.getElementById('exportBtn');
        this.tabItems = document.querySelectorAll('.tab-item');
        this.pages = document.querySelectorAll('.page');
        this.totalHoursElement = document.getElementById('totalHours');
        this.monthSelector = document.getElementById('monthSelector');
        this.locationStats = document.getElementById('locationStats');
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        
        // 标签切换
        this.tabItems.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab));
        });
    }

    switchTab(tab) {
        // 更新标签状态
        this.tabItems.forEach(item => item.classList.remove('active'));
        tab.classList.add('active');

        // 更新页面显示
        const targetTab = tab.dataset.tab;
        this.pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === `${targetTab}-page`) {
                page.classList.add('active');
            }
        });
    }

    handleSubmit(event) {
        event.preventDefault();
        
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        
        const course = {
            id: Date.now(),
            date: document.getElementById('date').value,
            startTime,
            endTime,
            location: document.getElementById('location').value,
            courseName: document.getElementById('courseName').value,
            duration: 1, // 默认每节课为1课时
            remarks: document.getElementById('remarks').value
        };

        this.courses.push(course);
        this.saveCourses();
        this.renderCourses();
        this.updateTotalHours();
        this.updateLocationStats();
        this.initializeMonthSelector(); // 更新月份选择器
        this.form.reset();
        this.showNotification('课程添加成功！');
        
        this.switchTab(document.querySelector('[data-tab="list"]'));
    }

    updateTotalHours() {
        const total = this.courses.reduce((sum, course) => sum + course.duration, 0);
        this.totalHoursElement.textContent = total;
    }

    renderCourses() {
        this.courseList.innerHTML = '';
        
        this.courses
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(course => {
                const card = document.createElement('div');
                card.className = 'course-card';
                card.innerHTML = `
                    <div class="course-header">
                        <span class="course-title">${course.courseName}</span>
                        <span class="course-date">${this.formatDate(course.date)}</span>
                    </div>
                    <div class="course-info">
                        <div class="info-item">
                            <i class="far fa-clock"></i> ${course.startTime} - ${course.endTime}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i> ${course.location}
                        </div>
                        ${course.remarks ? `
                        <div class="info-item remarks">
                            <i class="fas fa-comment"></i> ${course.remarks}
                        </div>
                        ` : ''}
                    </div>
                    <div class="course-actions">
                        <button class="btn-delete" onclick="yogaManager.deleteCourse(${course.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                this.courseList.appendChild(card);
            });
    }

    deleteCourse(id) {
        this.courses = this.courses.filter(course => course.id !== id);
        this.saveCourses();
        this.renderCourses();
        this.updateTotalHours();
        this.updateLocationStats();
        this.showNotification('课程删除成功！');
    }

    saveCourses() {
        localStorage.setItem('yogaCourses', JSON.stringify(this.courses));
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(dateString).toLocaleDateString('zh-CN', options);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 2000);
    }

    exportToCSV() {
        const headers = ['日期', '开始时间', '结束时间', '地址', '课程名称', '课时', '备注'];
        const csvContent = [
            headers.join(','),
            ...this.courses.map(course => [
                course.date,
                course.startTime,
                course.endTime,
                course.location,
                course.courseName,
                course.duration,
                course.remarks
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `瑜伽课程记录_${new Date().toLocaleDateString()}.csv`;
        link.click();
    }

    initializeMonthSelector() {
        // 获取所有不重复的年月
        const months = [...new Set(this.courses.map(course => {
            const date = new Date(course.date);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }))].sort().reverse();

        // 添加当前月份（如果不存在）
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        if (!months.includes(currentMonth)) {
            months.unshift(currentMonth);
        }

        // 填充选择器
        this.monthSelector.innerHTML = months.map(month => `
            <option value="${month}">${month.replace('-', '年')}月</option>
        `).join('');

        // 监听月份变化
        this.monthSelector.addEventListener('change', () => this.updateLocationStats());
    }

    updateLocationStats() {
        const selectedMonth = this.monthSelector.value;
        const [year, month] = selectedMonth.split('-').map(Number);

        // 筛选选定月份的课程
        const monthCourses = this.courses.filter(course => {
            const courseDate = new Date(course.date);
            return courseDate.getFullYear() === year && 
                   courseDate.getMonth() === month - 1;
        });

        // 按地点统计课时
        const locationStats = {};
        monthCourses.forEach(course => {
            locationStats[course.location] = (locationStats[course.location] || 0) + course.duration;
        });

        // 渲染统计结果
        this.locationStats.innerHTML = Object.entries(locationStats)
            .map(([location, hours]) => `
                <div class="location-stat-card">
                    <div class="location-name">${location}</div>
                    <div class="location-hours">${hours} 课时</div>
                </div>
            `).join('');

        // 如果没有数据，显示提示
        if (Object.keys(locationStats).length === 0) {
            this.locationStats.innerHTML = '<div class="no-data">本月暂无课程记录</div>';
        }
    }

    exportToJSON() {
        const data = JSON.stringify(this.courses, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `yoga_courses_${new Date().toLocaleDateString()}.json`;
        link.click();
    }

    importFromJSON(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const courses = JSON.parse(e.target.result);
                this.courses = courses;
                this.saveCourses();
                this.renderCourses();
                this.updateTotalHours();
                this.updateLocationStats();
                this.initializeMonthSelector();
                this.showNotification('数据导入成功！');
            } catch (error) {
                this.showNotification('数据导入失败！');
            }
        };
        reader.readAsText(file);
    }
}

// 初始化应用
const yogaManager = new YogaCourseManager();