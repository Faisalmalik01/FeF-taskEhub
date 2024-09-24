// DOM Elements
const taskList = document.getElementById("taskList");
const totalTasksElement = document.getElementById("totalTasks");
const completedTasksElement = document.getElementById("completedTasks");
const addTaskBtn = document.getElementById("addTaskBtn");
const filterButtons = document.querySelectorAll(".btn-filter");
const notificationArea = document.getElementById("notificationArea");
const darkModeToggle = document.getElementById("darkModeToggle");
const body = document.body;
const searchInput = document.getElementById("searchTask");

// Task array to store all tasks
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  addTaskBtn.addEventListener("click", addTask);

  filterButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      filterTasks(event.target.dataset.filter);
    });
  });

  darkModeToggle.addEventListener("click", toggleDarkMode);
  searchInput.addEventListener("input", searchTasks);

  renderTasks();
  updateStats();
});

// Function to toggle dark mode
function toggleDarkMode() {
  body.classList.toggle("dark-mode");
  const isDarkMode = body.classList.contains("dark-mode");
  darkModeToggle.innerHTML = isDarkMode
    ? '<i class="fas fa-sun"></i>'
    : '<i class="fas fa-moon"></i>';
  localStorage.setItem("darkMode", isDarkMode);
}

// Check for user's dark mode preference on load
if (localStorage.getItem("darkMode") === "true") {
  body.classList.add("dark-mode");
  darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// Function to add a new task
function addTask() {
  const taskName = document.getElementById("taskName").value;
  const taskDate = document.getElementById("taskDate").value;
  const taskCategory = document.getElementById("taskCategory").value;
  const taskTime = document.getElementById("taskTime").value;
  const taskPriority = document.getElementById("taskPriority").value;
  const taskDescription = document.getElementById("taskDescription").value;
  const taskColor = document.getElementById("taskColor").value;

  if (
    taskName === "" ||
    taskDate === "" ||
    taskCategory === "" ||
    taskTime === "" ||
    taskPriority === ""
  ) {
    showNotification("Please fill out all required fields.", "error");
    return;
  }

  const task = {
    id: Date.now(),
    name: taskName,
    date: taskDate,
    category: taskCategory,
    time: taskTime,
    priority: taskPriority,
    description: taskDescription,
    color: taskColor,
    completed: false,
    createdAt: Date.now(),
  };

  tasks.push(task);
  saveTasks();
  renderTasks();
  updateStats();
  resetForm();
  showNotification("Task added successfully!", "success");
}

// Function to render tasks
function renderTasks() {
  tasks.sort((a, b) => b.createdAt - a.createdAt);
  taskList.innerHTML = "";
  tasks.forEach((task) => {
    const taskItem = document.createElement("div");
    taskItem.classList.add("task-item");
    if (task.completed) {
      taskItem.classList.add("completed");
    }
    taskItem.dataset.category = task.category;
    taskItem.dataset.id = task.id;

    // Convert hex color to RGB for use in CSS variables
    const rgb = hexToRgb(task.color);
    taskItem.style.setProperty("--task-color", task.color);
    taskItem.style.setProperty(
      "--task-color-rgb",
      `${rgb.r}, ${rgb.g}, ${rgb.b}`
    );

    const truncatedDescription = truncateText(task.description, 40);
    const showMoreButton =
      task.description.length > 40 ? `<span class="btn-more">more</span>` : "";

    taskItem.innerHTML = `
            <h3>${task.name}</h3>
            <div class="task-meta">
                <span class="task-category">${task.category}</span>
                <span class="task-priority">${task.priority}</span>
            </div>
            <p><i class="far fa-calendar"></i> ${
              task.date
            }</p> <p><i class="far fa-clock"></i> ${task.time}</p>
            <p class="task-description">${truncatedDescription} ${showMoreButton}</p>
           
            <div class="task-actions">
                <button class="btn-complete">
                    <i class="fas fa-check"></i> ${
                      task.completed ? "Undo" : "Complete"
                    }
                </button>
                <button class="btn-delete">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;

    const completeBtn = taskItem.querySelector(".btn-complete");
    completeBtn.addEventListener("click", () => {
      toggleComplete(task.id);
    });

    const deleteBtn = taskItem.querySelector(".btn-delete");
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    const moreBtn = taskItem.querySelector(".btn-more");
    if (moreBtn) {
      moreBtn.addEventListener("click", () => toggleTaskDetails(task.id));
    }

    taskList.appendChild(taskItem);
  });
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + "...";
}

// Task Completion, Deletion, and Filtering

// Function to toggle task completion
function toggleComplete(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    updateStats();
    showNotification(
      `Task marked as ${task.completed ? "completed" : "incomplete"}.`,
      "info"
    );

    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (task.completed) {
      taskElement.classList.add("completed");
      // Add a checkmark animation
      taskElement.querySelector(".btn-complete").innerHTML =
        '<i class="fas fa-check"></i> Undo';
    } else {
      taskElement.classList.remove("completed");
      // Remove checkmark animation
      taskElement.querySelector(".btn-complete").innerHTML =
        '<i class="fas fa-check"></i> Complete';
    }
  }
}

// Function to delete a task
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
  updateStats();
  showNotification("Task deleted successfully.", "info");
}

// Function to filter tasks
function filterTasks(category) {
  filterButtons.forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");

  const taskItems = taskList.querySelectorAll(".task-item");
  taskItems.forEach((item) => {
    if (category === "All" || item.dataset.category === category) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

// Function to search tasks
function searchTasks() {
  const searchTerm = searchInput.value.toLowerCase();
  const taskItems = taskList.querySelectorAll(".task-item");
  taskItems.forEach((item) => {
    const taskName = item.querySelector("h3").textContent.toLowerCase();
    if (taskName.includes(searchTerm)) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

// Function to update stats and progress bar
function updateStats() {
  const totalTasksElement = document.getElementById("totalTasks");
  const completedTasksElement = document.getElementById("completedTasks");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  // Calculate total and completed tasks
  let totalTasks = tasks.length;
  let completedTasks = tasks.filter((t) => t.completed).length;

  // Update task counts
  totalTasksElement.textContent = totalTasks;
  completedTasksElement.textContent = completedTasks;

  // Avoid division by zero
  let completionPercentage =
    totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

  // Update progress bar width
  progressBar.style.width = completionPercentage + "%";

  // Update progress text
  progressText.textContent = Math.round(completionPercentage) + "% Completed";
}

// Function to reset form
function resetForm() {
  document.getElementById("taskName").value = "";
  document.getElementById("taskDate").value = "";
  document.getElementById("taskCategory").value = "";
  document.getElementById("taskTime").value = "";
  document.getElementById("taskPriority").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskColor").value = "";
}

// Function to show notification
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <i class="fas ${
          type === "success"
            ? "fa-check-circle"
            : type === "error"
            ? "fa-exclamation-circle"
            : "fa-info-circle"
        }"></i>
        <span>${message}</span>
    `;
  notificationArea.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notificationArea.removeChild(notification);
      }, 300);
    }, 3000);
  }, 100);
}

// Function to toggle task details
function toggleTaskDetails(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const modal = document.createElement("div");
  modal.className = "task-modal";
  modal.innerHTML = `
        <div class="task-modal-content">
            <h2>${task.name}</h2>
            <div class="task-modal-body">
                <p><strong>Date:</strong> ${task.date}</p>
                <p><strong>Time:</strong> ${task.time}</p>
                <p><strong>Category:</strong> ${task.category}</p>
                <p><strong>Priority:</strong> ${task.priority}</p>
                <p><strong>Description:</strong></p>
                <p class="task-description">${task.description}</p>
            </div>
            <button class="btn-close-modal">Close</button>
        </div>
    `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector(".btn-close-modal");
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Function to save tasks to local storage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Initialize the app
renderTasks();
updateStats();

//Footer
const li = document.querySelectorAll(".list");
const indicator = document.querySelector(".indicator");

function activeLink() {
  li.forEach((item) => {
    item.classList.remove("active");
  });
  this.classList.add("active");

  // Move the indicator to the correct position
  const index = Array.from(li).indexOf(this);
  indicator.style.transform = `translateX(${index * 50}px)`;
}

li.forEach((item) => item.addEventListener("mouseover", activeLink));
