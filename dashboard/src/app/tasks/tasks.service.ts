import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskCategory = 'WORK' | 'PERSONAL' | 'OTHER';

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  category: TaskCategory;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    email: string;
    name?: string;
    role: string;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`);
  }

  createTask(data: {
    title: string;
    description?: string;
    category: TaskCategory;
    assignedToUserId?: string;
  }): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, {
      ...data,
      status: 'TODO',
    });
  }

  updateTask(
    id: string,
    data: Partial<Task> & { assignedToUserId?: string },
  ): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, data);
  }

  deleteTask(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(
      `${this.apiUrl}/tasks/${id}`,
    );
  }
}
