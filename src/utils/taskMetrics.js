const COMPLETED_STATE = 'ejecutada';
const DEFAULT_UPCOMING_DAYS = 7;
const DEFAULT_TASK_LIMIT = 5;

const pad = (value) => String(value).padStart(2, '0');

export const toDateKey = (value) => {
  if (!value) {
    return '';
  }

  const stringValue = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    const [year, month, day] = stringValue.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const isValid =
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;

    return isValid ? stringValue : '';
  }

  const date = new Date(stringValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const addDays = (dateKey, days) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return '';
  }

  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return toDateKey(date);
};

export const getTaskState = (task) =>
  task?.state ?? task?.estado ?? 'pendiente';

export const isTaskCompleted = (task) => getTaskState(task) === COMPLETED_STATE;

export const getTaskHours = (task) => {
  const hours = Number(task?.hours ?? task?.horasEstimadas);
  return Number.isFinite(hours) ? hours : 0;
};

export const getTaskDate = (task) =>
  toDateKey(task?.date ?? task?.fechaObjetivo);

export const getEventDate = (event) =>
  toDateKey(event?.date ?? event?.fechaEvento);

export const isEventToday = (event, today) => getEventDate(event) === today;

export const normalizeSubtask = (payload) => ({
  id: payload?.id ?? payload?.idSubtarea,
  eventId: payload?.eventId ?? payload?.idEvento,
  title: payload?.title ?? payload?.nombreGestion ?? payload?.name ?? '',
  hours: payload?.hours ?? payload?.horasEstimadas ?? 0,
  date: getTaskDate(payload),
  state: getTaskState(payload),
});

export const normalizeEvent = (payload) => ({
  id: payload?.id ?? payload?.idEvento,
  name: payload?.name ?? payload?.nombre ?? 'Evento sin nombre',
  date: payload?.date ?? payload?.fechaEvento ?? '',
});

export const sumHours = (tasks) =>
  (Array.isArray(tasks) ? tasks : []).reduce(
    (total, task) => total + getTaskHours(task),
    0
  );

export const getTaskMetrics = (tasks) => {
  const taskList = Array.isArray(tasks) ? tasks : [];
  const completedTasks = taskList.filter(isTaskCompleted);
  const hoursTotal = sumHours(taskList);
  const hoursCompleted = sumHours(completedTasks);

  return {
    total: taskList.length,
    completed: completedTasks.length,
    remaining: taskList.length - completedTasks.length,
    hoursTotal,
    hoursCompleted,
    hoursRemaining: Math.max(0, hoursTotal - hoursCompleted),
    progressHours:
      hoursTotal > 0 ? Math.round((hoursCompleted / hoursTotal) * 100) : 0,
    progressTasks: taskList.length
      ? Math.round((completedTasks.length / taskList.length) * 100)
      : 0,
  };
};

export const classifyTasksByDate = (
  tasks,
  today,
  { upcomingDays = DEFAULT_UPCOMING_DAYS, limit = DEFAULT_TASK_LIMIT } = {}
) => {
  const taskList = Array.isArray(tasks) ? tasks : [];
  const upcomingLimit = addDays(today, upcomingDays);
  const isOpen = (task) => !isTaskCompleted(task) && getTaskDate(task);

  const overdue = taskList
    .filter((task) => isOpen(task) && getTaskDate(task) < today)
    .sort((a, b) => getTaskDate(a).localeCompare(getTaskDate(b)));
  const todayTasks = taskList.filter(
    (task) => isOpen(task) && getTaskDate(task) === today
  );
  const upcoming = taskList
    .filter(
      (task) =>
        isOpen(task) &&
        getTaskDate(task) > today &&
        getTaskDate(task) <= upcomingLimit
    )
    .sort((a, b) => getTaskDate(a).localeCompare(getTaskDate(b)));

  return {
    todayTasks,
    overdueTasks: overdue.slice(0, limit),
    upcomingTasks: upcoming.slice(0, limit),
    todayTotal: todayTasks.length,
    overdueTotal: overdue.length,
    upcomingTotal: upcoming.length,
  };
};

export const formatHours = (value) => {
  const hours = Number(value);
  if (!Number.isFinite(hours)) {
    return '0 h';
  }

  const roundedHours = Math.round(hours * 10) / 10;
  return `${String(roundedHours)} h`;
};

export const formatRelativeDate = (dateKey, today) => {
  if (dateKey === today) {
    return 'Hoy';
  }

  if (dateKey === addDays(today, 1)) {
    return 'Mañana';
  }

  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
  });
};

export const formatOverdueLabel = (dateKey, today) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
  const days = Math.round((todayDate - date) / 86400000);

  if (days <= 1) {
    return 'Vencida hace 1 día';
  }

  return `Vencida hace ${days} días`;
};

export const getStateLabel = (state) => {
  const labels = {
    pendiente: 'Pendiente',
    ejecutada: 'Completada',
    pospuesta: 'Pospuesta',
  };

  return labels[state] || 'Pendiente';
};

export const getStateVariant = (state) =>
  state === COMPLETED_STATE ? 'success' : 'pending';
