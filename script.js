const timeColumn = document.getElementById("timeColumn");
const daysGrid = document.getElementById("daysGrid");
const courseForm = document.getElementById("courseForm");

const startHour = 9;
const periods = 9;
const endHour = startHour + periods;
const slotMinutes = 30;

const startSelect = document.getElementById("startTime");
const endSelect = document.getElementById("endTime");

const timeSlots = [];

// 로컬 저장 키
const STORAGE_KEY = "timetable_courses_v1";

function pad(num) {
  return String(num).padStart(2, "0");
}

function buildTimeSlots() {
  for (let hour = startHour; hour < endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += slotMinutes) {
      const label = `${pad(hour)}:${pad(minute)}`;
      timeSlots.push(label);
    }
  }
}

function renderTimeColumn() {
  timeSlots.forEach((time) => {
    const slot = document.createElement("div");
    slot.className = "time-slot";
    slot.textContent = time;
    timeColumn.appendChild(slot);
  });
}

function renderSelectOptions() {
  timeSlots.forEach((time) => {
    const optionStart = document.createElement("option");
    optionStart.value = time;
    optionStart.textContent = time;

    const optionEnd = document.createElement("option");
    optionEnd.value = time;
    optionEnd.textContent = time;

    startSelect.appendChild(optionStart);
    endSelect.appendChild(optionEnd);
  });

  startSelect.value = timeSlots[0];
  endSelect.value = timeSlots[2];
}

function timeToIndex(time) {
  return timeSlots.indexOf(time);
}

function saveCourses() {
  const courses = [];
  document.querySelectorAll(".course-block").forEach((el) => {
    courses.push({
      name: el.dataset.name,
      room: el.dataset.room,
      professor: el.dataset.professor,
      day: el.dataset.day,
      start: el.dataset.start,
      end: el.dataset.end,
      color: el.dataset.color,
    });
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

function loadCourses() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const courses = JSON.parse(raw);
    courses.forEach((c) => addCourse(c, false));
  } catch (e) {
    console.error("불러오기 실패", e);
  }
}

function addCourse({ name, room, professor, day, start, end, color }, save = true) {
  const dayColumn = daysGrid.querySelector(`[data-day="${day}"]`);
  if (!dayColumn) return;

  const startIndex = timeToIndex(start);
  const endIndex = timeToIndex(end);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    alert("종료 시간이 시작 시간보다 늦어야 합니다.");
    return;
  }

  const block = document.createElement("div");
  block.className = "course-block";
  block.style.background = color || "#2f6fed";

  // grid row: 시간 슬롯은 1-based. 각 슬롯 높이는 36px이므로 gridRow 사용 대신 top/height 계산
  const slotHeight = 36; // css와 동일
  const top = startIndex * slotHeight + 3; // 약간의 마진 보정
  const height = (endIndex - startIndex) * slotHeight - 6;

  block.style.position = "absolute";
  block.style.top = top + "px";
  block.style.left = "3px";
  block.style.right = "3px";
  block.style.height = height + "px";

  block.innerHTML = `
    <strong>${escapeHtml(name)}</strong>
    <div>${escapeHtml(room)}</div>
    <div>${escapeHtml(professor)}</div>
    <div style="font-size:11px;opacity:0.9">${escapeHtml(start)} ~ ${escapeHtml(end)}</div>
  `;

  block.dataset.name = name;
  block.dataset.room = room;
  block.dataset.professor = professor;
  block.dataset.day = day;
  block.dataset.start = start;
  block.dataset.end = end;
  block.dataset.color = color;

  dayColumn.appendChild(block);

  if (save) saveCourses();
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (s) => {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[s];
  });
}

// 초기화 버튼
const clearButton = document.getElementById("clearButton");
if (clearButton) {
  clearButton.addEventListener("click", () => {
    if (!confirm("모든 강의를 삭제하시겠습니까?")) return;
    document.querySelectorAll('.day-column').forEach(col => col.innerHTML = '');
    saveCourses();
  });
}

buildTimeSlots();
renderTimeColumn();
renderSelectOptions();
loadCourses();

courseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  addCourse({
    name: document.getElementById("courseName").value.trim(),
    room: document.getElementById("courseRoom").value.trim(),
    professor: document.getElementById("courseProfessor").value.trim(),
    day: document.getElementById("courseDay").value,
    start: document.getElementById("startTime").value,
    end: document.getElementById("endTime").value,
    color: document.getElementById("courseColor").value,
  });

  courseForm.reset();
  startSelect.value = timeSlots[0];
  endSelect.value = timeSlots[2];
});
