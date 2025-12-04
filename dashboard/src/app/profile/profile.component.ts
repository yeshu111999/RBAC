import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AppUser } from '../auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  user: AppUser | null = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.user = this.auth.getUser();

    this.loading = true;
    this.auth.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load profile';
      },
    });
  }

  changePassword() {
    this.error = null;
    this.success = null;

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.error = 'All password fields are required';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'New passwords do not match';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'New password must be at least 6 characters long';
      return;
    }

    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.success = 'Password updated successfully';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.error =
          err?.error?.message || 'Failed to change password';
      },
    });
  }

  backToDashboard() {
    this.router.navigate(['/tasks']);
  }
}
