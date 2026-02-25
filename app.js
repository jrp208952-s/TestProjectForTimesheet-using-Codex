angular.module('workforceApp', [])
  .controller('MainController', function($scope, $timeout) {
    const vm = this;

    vm.tabs = ['Dashboard', 'Todo & Issues', 'Planning & Workforce', 'Feedback'];
    vm.activeTab = vm.tabs[0];

    const standardFlow = ['Pending', 'Assign', 'Development', 'Complete', 'QC', 'Tested', 'Ready to release'];
    const reopenFlow = ['Reopen', 'Development', 'Complete', 'QC', 'Tested', 'Ready to release'];

    vm.todos = [
      {
        id: 1,
        title: 'Implement login API',
        type: 'Feature',
        status: 'Pending',
        start: new Date(new Date().setHours(9, 0, 0, 0)),
        end: new Date(new Date().setHours(18, 30, 0, 0)),
        reopened: false,
        chat: ['Kickoff done']
      }
    ];

    vm.todoForm = { type: 'Issue' };
    vm.alerts = [
      '2 tasks are still in Pending status.',
      '1 issue has crossed estimated hours.',
      'Payroll sync scheduled at 6:00 PM.'
    ];
    vm.meetings = ['Standup: blockers identified in API test environment.'];
    vm.meetingInput = '';
    vm.interviews = [{ candidate: 'Ava Smith', role: 'Frontend Developer', stage: 'Technical' }];
    vm.interviewForm = { stage: 'Scheduled' };
    vm.releases = [{ project: 'Workforce Portal', version: 'v1.4.0', date: new Date() }];
    vm.releaseForm = {};
    vm.feedback = { text: '', link: '', qr: '' };

    vm.statusOptions = (todo) => todo.reopened ? reopenFlow : standardFlow;

    vm.estimateHours = (todo) => {
      if (!todo.start || !todo.end) return 0;
      const diff = (new Date(todo.end) - new Date(todo.start)) / (1000 * 60 * 60);
      return diff > 0 ? diff : 0;
    };

    vm.saveTodo = () => {
      if (!vm.todoForm.start || !vm.todoForm.end) return;
      const start = new Date(vm.todoForm.start);
      const end = new Date(vm.todoForm.end);
      if (vm.todoForm.id) {
        const idx = vm.todos.findIndex(t => t.id === vm.todoForm.id);
        vm.todos[idx] = { ...vm.todos[idx], ...vm.todoForm, start, end };
      } else {
        vm.todos.push({
          id: Date.now(),
          title: vm.todoForm.title,
          type: vm.todoForm.type,
          status: 'Pending',
          start,
          end,
          reopened: false,
          chat: []
        });
      }
      vm.todoForm = { type: 'Issue' };
      $timeout(vm.renderCharts, 0);
    };

    vm.editTodo = (todo) => {
      vm.todoForm = { ...todo };
    };

    vm.deleteTodo = (id) => {
      vm.todos = vm.todos.filter(t => t.id !== id);
      $timeout(vm.renderCharts, 0);
    };

    vm.toggleReopen = (todo) => {
      todo.reopened = !todo.reopened;
      todo.status = todo.reopened ? 'Reopen' : 'Pending';
      $timeout(vm.renderCharts, 0);
    };

    vm.sendChat = (todo) => {
      if (!todo.newMsg) return;
      todo.chat.push(todo.newMsg);
      todo.newMsg = '';
    };

    vm.addMeeting = () => {
      if (vm.meetingInput) vm.meetings.unshift(vm.meetingInput);
      vm.meetingInput = '';
    };

    vm.addInterview = () => {
      vm.interviews.unshift({ ...vm.interviewForm });
      vm.interviewForm = { stage: 'Scheduled' };
    };

    vm.addRelease = () => {
      vm.releases.unshift({ ...vm.releaseForm });
      vm.releaseForm = {};
    };

    vm.timesheet = () => vm.todos.map(t => {
      const hours = vm.estimateHours(t);
      return { title: t.title, hours, overtime: Math.max(0, hours - 8) };
    });

    vm.totalOvertimeHours = () => vm.timesheet().reduce((sum, row) => sum + row.overtime, 0);
    vm.overtimePayout = () => vm.totalOvertimeHours() * 25;

    vm.generateFeedbackShare = () => {
      const encoded = encodeURIComponent(vm.feedback.text || 'Team feedback');
      vm.feedback.link = `https://example.com/feedback?message=${encoded}`;
      vm.feedback.qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(vm.feedback.link)}`;
    };

    vm.renderCharts = () => {
      const statusCount = vm.todos.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {});

      const labels = Object.keys(statusCount);
      const values = labels.map(k => statusCount[k]);

      const bar = echarts.init(document.getElementById('statusBarChart'));
      bar.setOption({
        title: { text: 'Task Status (Bar)' },
        tooltip: {},
        xAxis: { type: 'category', data: labels },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: values, itemStyle: { color: '#4a67ff' } }]
      });

      const pie = echarts.init(document.getElementById('statusPieChart'));
      pie.setOption({
        title: { text: 'Task Status (Pie)' },
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie',
          radius: '55%',
          data: labels.map((label, i) => ({ name: label, value: values[i] }))
        }]
      });
    };

    $timeout(vm.renderCharts, 50);

    angular.element(window).on('resize', () => vm.renderCharts());
    $scope.$on('$destroy', () => angular.element(window).off('resize'));
  });
