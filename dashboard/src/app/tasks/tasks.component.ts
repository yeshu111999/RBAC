import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService, AppUser } from '../auth/auth.service';
import {
  TasksService,
  Task,
  TaskCategory,
  TaskStatus,
} from './tasks.service';

import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './tasks.component.html',
})
export class TasksComponent implements OnInit {
  // Raw tasks
  tasks: Task[] = [];

  // Columns
  todoColumn: Task[] = [];
  inProgressColumn: Task[] = [];
  doneColumn: Task[] = [];

  loading = false;
  error: string | null = null;

  // Create form
  newTitle = '';
  newDescription = '';
  newCategory: TaskCategory = 'WORK';
  selectedAssigneeId: string | null = null;

  // Current user / permissions
  currentUser: AppUser | null = null;
  canManageTasks = false;

  // Users for assignment
  allUsers: AppUser[] = [];

  // Owner user management
  newUserEmail = '';
  newUserName = '';
  newUserRole: 'ADMIN' | 'VIEWER' = 'ADMIN';

  showUserCreatedModal = false;
  createdUserEmail = '';
  createdUserPassword = '';

  // Filters & sorting
  filterCategory: 'ALL' | TaskCategory = 'ALL';
  showOnlyMine = false;
  sortBy: 'createdAt' | 'title' = 'createdAt';

  // Edit modal
  editModalOpen = false;
  editTaskRef: Task | null = null;
  editTitle = '';
  editDescription = '';
  editCategory: TaskCategory = 'WORK';
  editAssigneeId: string | null = null;

  // Stats for chart
  totalTasks = 0;
  todoCount = 0;
  inProgressCount = 0;
  doneCount = 0;
  todoPercent = 0;
  inProgressPercent = 0;
  donePercent = 0;

  // Dark mode
  private readonly DARK_KEY = 'stm_dark_mode';
  isDarkMode = false;

  // Keyboard shortcuts
  @ViewChild('newTitleInput') newTitleInput?: ElementRef<HTMLInputElement>;

  constructor(
    private tasksService: TasksService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initDarkMode();

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUser = this.auth.getUser();
    this.canManageTasks =
      this.currentUser?.role === 'OWNER' ||
      this.currentUser?.role === 'ADMIN';

    this.loadTasks();

    if (this.canManageTasks) {
      this.loadUsers();
    }
  }

  // ========== Dark mode ==========

  private initDarkMode() {
    try {
      const stored = localStorage.getItem(this.DARK_KEY);
      this.isDarkMode = stored === 'true';
    } catch {
      this.isDarkMode = false;
    }
    this.applyDarkMode();
  }

  private applyDarkMode() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (this.isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    try {
      localStorage.setItem(this.DARK_KEY, String(this.isDarkMode));
    } catch {
      // ignore
    }
    this.applyDarkMode();
  }

  // ========== Data loading ==========

  loadUsers() {
    this.auth.getAllUsers().subscribe({
      next: (users) => (this.allUsers = users),
      error: () => {},
    });
  }

  loadTasks() {
    this.loading = true;
    this.error = null;

    this.tasksService.getTasks().subscribe({
      next: (res: Task[]) => {
        this.tasks = res;
        this.loading = false;
        this.refreshBoard();
      },
      error: (err: any) => {
        this.loading = false;
        if (err.status === 401) {
          this.auth.logout();
          this.router.navigate(['/login']);
        } else {
          this.error = err?.error?.message || 'Failed to load tasks';
        }
      },
    });
  }

  // ========== Filters & sorting ==========

  onFiltersChanged() {
    this.refreshBoard();
  }

  private refreshBoard() {
    const filtered = this.applyFilters(this.tasks);

    this.todoColumn = [];
    this.inProgressColumn = [];
    this.doneColumn = [];

    filtered.forEach((t) => {
      if (t.status === 'TODO') this.todoColumn.push(t);
      else if (t.status === 'IN_PROGRESS') this.inProgressColumn.push(t);
      else if (t.status === 'DONE') this.doneColumn.push(t);
    });

    this.sortColumn(this.todoColumn);
    this.sortColumn(this.inProgressColumn);
    this.sortColumn(this.doneColumn);

    this.updateStats();
  }

  private applyFilters(input: Task[]): Task[] {
    let result = [...input];

    if (this.filterCategory !== 'ALL') {
      result = result.filter((t) => t.category === this.filterCategory);
    }

    if (this.showOnlyMine && this.currentUser) {
      result = result.filter(
        (t) => t.assignedTo?.id === this.currentUser!.id,
      );
    }

    return result;
  }

  private sortColumn(col: Task[]) {
    if (this.sortBy === 'createdAt') {
      col.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
    } else {
      col.sort((a, b) => a.title.localeCompare(b.title));
    }
  }

  private updateStats() {
    this.todoCount = this.todoColumn.length;
    this.inProgressCount = this.inProgressColumn.length;
    this.doneCount = this.doneColumn.length;
    this.totalTasks =
      this.todoCount + this.inProgressCount + this.doneCount;

    if (this.totalTasks === 0) {
      this.todoPercent = 0;
      this.inProgressPercent = 0;
      this.donePercent = 0;
      return;
    }

    this.todoPercent = Math.round(
      (this.todoCount / this.totalTasks) * 100,
    );
    this.inProgressPercent = Math.round(
      (this.inProgressCount / this.totalTasks) * 100,
    );
    this.donePercent = Math.round(
      (this.doneCount / this.totalTasks) * 100,
    );
  }

  // ========== CRUD ==========

  createTask() {
    if (!this.canManageTasks) return;

    if (!this.newTitle.trim()) {
      this.error = 'Title is required';
      return;
    }

    this.error = null;

    this.tasksService
      .createTask({
        title: this.newTitle,
        description: this.newDescription,
        category: this.newCategory,
        assignedToUserId: this.selectedAssigneeId || undefined,
      })
      .subscribe({
        next: (task: Task) => {
          this.tasks.push(task);
          this.newTitle = '';
          this.newDescription = '';
          this.newCategory = 'WORK';
          this.selectedAssigneeId = null;
          this.refreshBoard();
        },
        error: (err: any) => {
          this.error =
            err?.error?.message || 'Failed to create task';
        },
      });
  }

  updateStatus(task: Task, status: TaskStatus) {
    if (!this.canManageTasks) return;

    this.tasksService.updateTask(task.id, { status }).subscribe({
      next: (updated: Task) => {
        task.status = updated.status;
        this.refreshBoard();
      },
      error: () => {
        this.error = 'Failed to update task';
      },
    });
  }

  reassignTask(task: Task, assigneeId: string | null) {
    if (!this.canManageTasks) return;

    this.tasksService
      .updateTask(task.id, {
        assignedToUserId: assigneeId || undefined,
      })
      .subscribe({
        next: (updated: Task) => {
          task.assignedTo = updated.assignedTo;
          this.refreshBoard();
        },
        error: () => {
          this.error = 'Failed to reassign task';
        },
      });
  }

  deleteTask(task: Task) {
    if (!this.canManageTasks) return;
    if (!confirm('Delete this task?')) return;

    this.tasksService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter((t) => t.id !== task.id);
        this.refreshBoard();
      },
      error: () => {
        this.error = 'Failed to delete task';
      },
    });
  }

  // ========== Edit modal ==========

  openEditModal(task: Task) {
    if (!this.canManageTasks) return;

    this.editTaskRef = task;
    this.editTitle = task.title;
    this.editDescription = task.description || '';
    this.editCategory = task.category;
    this.editAssigneeId = task.assignedTo?.id || null;
    this.editModalOpen = true;
  }

  closeEditModal() {
    this.editModalOpen = false;
    this.editTaskRef = null;
    this.editTitle = '';
    this.editDescription = '';
    this.editAssigneeId = null;
    this.editCategory = 'WORK';
  }

  saveEditChanges() {
    if (!this.canManageTasks || !this.editTaskRef) return;

    if (!this.editTitle.trim()) {
      this.error = 'Title is required';
      return;
    }

    const payload: {
      title: string;
      description?: string;
      category: TaskCategory;
      assignedToUserId?: string;
    } = {
      title: this.editTitle,
      description: this.editDescription || undefined,
      category: this.editCategory,
    };

    payload.assignedToUserId = this.editAssigneeId || undefined;

    this.tasksService.updateTask(this.editTaskRef.id, payload).subscribe({
      next: (updated: Task) => {
        const idx = this.tasks.findIndex(
          (t) => t.id === this.editTaskRef!.id,
        );
        if (idx >= 0) {
          this.tasks[idx] = { ...this.tasks[idx], ...updated };
        }
        this.refreshBoard();
        this.closeEditModal();
      },
      error: () => {
        this.error = 'Failed to update task';
      },
    });
  }

  // ========== Drag & Drop ==========

  drop(event: CdkDragDrop<Task[]>, newStatus: TaskStatus) {
    if (!this.canManageTasks) return;

    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    const movedTask = event.container.data[event.currentIndex];

    if (movedTask.status !== newStatus) {
      this.updateStatus(movedTask, newStatus);
    }
  }

  // ========== Owner user management ==========

  createUserAccount() {
    if (!this.currentUser || this.currentUser.role !== 'OWNER') return;

    if (!this.newUserEmail.trim() || !this.newUserName.trim()) {
      this.error = 'Email and name are required for new user';
      return;
    }

    this.error = null;

    this.auth
      .createUser(this.newUserEmail, this.newUserName, this.newUserRole)
      .subscribe({
        next: (res) => {
          this.createdUserEmail = res.user.email;
          this.createdUserPassword = res.password;
          this.showUserCreatedModal = true;

          this.newUserEmail = '';
          this.newUserName = '';
          this.newUserRole = 'ADMIN';

          this.loadUsers();
        },
        error: (err) => {
          this.error =
            err?.error?.message || 'Failed to create user account';
        },
      });
  }

  copyCredentials() {
    const text = `Email: ${this.createdUserEmail}\nPassword: ${this.createdUserPassword}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }

  closeUserCreatedModal() {
    this.showUserCreatedModal = false;
  }

  // ========== Navigation ==========

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // ========== Helpers ==========

  displayUserShort(user: Task['assignedTo']): string {
    if (!user) return 'Unassigned';
    if (user.name) return `${user.name} (${user.email})`;
    return user.email;
  }

  // ========== Keyboard shortcuts ==========

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
    ) {
      return;
    }

    // Ctrl/Cmd + N -> focus new task
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      this.focusNewTaskTitle();
    }

    // Ctrl/Cmd + D -> toggle dark mode
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      this.toggleDarkMode();
    }
  }

  private focusNewTaskTitle() {
    if (!this.canManageTasks) return;
    if (this.newTitleInput?.nativeElement) {
      this.newTitleInput.nativeElement.focus();
    }
  }
}
