
# GenAI-Campus: Application Overview & Feature Documentation

## I. General Application Architecture

*   **Frontend**: Built with **Next.js** (a React framework).
    *   Uses **React** for building user interfaces.
    *   **ShadCN UI** for pre-built, customizable UI components.
    *   **Tailwind CSS** for styling.
    *   Client-side routing and page structure are managed by Next.js's App Router (files within the `src/app` directory).
    *   State management for authentication and theme is handled via React Context (`src/context/`).
    *   API interactions with the backend are done using `fetch` via a helper module (`src/lib/api.ts`).
*   **Backend**: Built with **Django** (a Python web framework).
    *   Uses **Django REST Framework (DRF)** to create API endpoints.
    *   Handles user authentication (token-based), data storage (using models and a database like SQLite), and business logic.
    *   Organized into Django apps: `accounts`, `content`, `notifications`.
*   **AI Integration**: Uses **Genkit** for AI-powered features.
    *   Flows defined in `src/ai/flows/`.
    *   Genkit configuration in `src/ai/genkit.ts`.

---

## II. Key User Flows & Features

#### A. Landing Page & Unauthenticated User Experience

1.  **Entry Point / Welcome Page:**
    *   **File:** `src/app/page.tsx` (renders `UnifiedDashboardPage` component)
    *   **Functionality:** Displays a dynamic hero section with a video background and the application logo. Showcases features for Students, Parents, and Schools/Teachers through `FeatureCard` components. Includes a "Contact Sales" form.
    *   **Connected Files:**
        *   `src/components/shared/Logo.tsx` (for app logo)
        *   `src/components/shared/ContactSalesForm.tsx` (for sales inquiries)
        *   `tailwind.config.ts` (for animations)
        *   `public/videos/educational-bg.mp4` (background video)
        *   `public/images/Genai.png` (logo image)

2.  **Header (Unauthenticated):**
    *   **File:** `src/components/layout/Header.tsx`
    *   **Functionality:** Displays the application logo. Provides navigation links to "Login", "Sign Up", and "Register School".
    *   **Connected Files:**
        *   `src/components/shared/Logo.tsx`
        *   `src/context/AuthContext.tsx` (to check authentication state)
        *   Next.js `Link` for navigation.

3.  **Footer:**
    *   **File:** `src/app/layout.tsx` (within `RootLayout`)
    *   **Functionality:** Displays copyright information and decorative educational icons.
    *   **Connected Files:** `lucide-react` (for icons)

#### B. Authentication System

1.  **User Signup:**
    *   **Frontend Page:** `src/app/signup/page.tsx`
    *   **Functionality:** Provides a dynamic form. Based on the selected role (Student, Teacher, Parent), it collects necessary base user information (username, email, password) and detailed profile information (full name, school, class, profile picture, etc.) in a single step.
    *   **Workflow:**
        1.  User selects role.
        2.  Relevant form fields appear. Dropdowns for School, Class, Subject are populated via API calls to backend.
        3.  User fills form, uploads optional profile picture.
        4.  On submit, `FormData` is created and sent to the backend.
        5.  Redirects to `/login` on success.
    *   **Connected Frontend Files:** `src/lib/api.ts` (for `api.post('/signup/')`).
    *   **Backend:**
        *   **File:** `accounts/serializers.py` (contains `UserSignupSerializer`)
        *   **File:** `accounts/views.py` (contains `UserSignupView` which uses `UserSignupSerializer`)
        *   **Functionality:** `UserSignupSerializer.create()` handles creating the `CustomUser` and the associated role-specific profile (`StudentProfile`, `TeacherProfile`, `ParentProfile`) including image uploads and linking related models.

2.  **User Login:**
    *   **Frontend Page:** `src/app/login/page.tsx`
    *   **Functionality:** Form for username and password. On successful login, an auth token is stored, user data is fetched, and the user is redirected to the main page (`/`), which then routes to their specific dashboard.
    *   **Workflow:**
        1.  User enters credentials.
        2.  `onSubmit` calls `loginUser` (which uses `AuthContext`).
        3.  `loginUser` calls `api.post` to `/api/token-auth/` (backend).
        4.  If successful, token is stored in `localStorage`. `fetchCurrentUser` is called to get user details.
        5.  `AuthContext` is updated with `currentUser`.
        6.  Redirects to `/`.
    *   **Connected Frontend Files:** `src/lib/api.ts` (for `api.post`), `src/context/AuthContext.tsx`.
    *   **Backend:**
        *   **URL:** `/api/token-auth/` (uses Django REST Framework's `obtain_auth_token` view)
        *   **File:** `stepwise_backend/urls.py`

3.  **Authentication Context (Frontend State Management):**
    *   **File:** `src/context/AuthContext.tsx`
    *   **Functionality:**
        *   Manages `currentUser` state (user object or null).
        *   Manages `isLoadingAuth` state.
        *   Provides `login` and `logout` functions.
        *   `processUserData` helper to determine `profile_completed` status.
        *   On initial app load, attempts to fetch current user if a token exists in `localStorage`.

4.  **Logout:**
    *   **Trigger:** Usually from a "Logout" button in the `Header.tsx` or sidebar footers.
    *   **Functionality:** Calls the `logout` function from `AuthContext`.
    *   **Workflow:**
        1.  `AuthContext.logout()` clears the auth token from `localStorage`.
        2.  Sets `currentUser` in context to `null`.
        3.  Forces a redirect to `/login` via `window.location.href`.

#### C. School Registration

1.  **Registration Form:**
    *   **Frontend Page:** `src/app/register-school/page.tsx`
    *   **Functionality:** Collects school details (name, ID code, license, email, phone, address, principal info) and initial admin account details (username, email, password).
    *   **Workflow:**
        1.  User fills the form.
        2.  On submit, data is sent to the backend.
        3.  Redirects to `/login` on success.
    *   **Connected Frontend Files:** `src/lib/api.ts` (for `api.post('/schools/')`).
    *   **Backend:**
        *   **File:** `accounts/serializers.py` (contains `SchoolSerializer`)
        *   **File:** `accounts/views.py` (contains `SchoolViewSet`, specifically the `create` action with `AllowAny` permission)
        *   **Functionality:** `SchoolSerializer.create()` creates the initial `CustomUser` (as school admin, `is_staff=False`, `is_school_admin=True`) and the `School` record, linking them.

#### D. User Profile Management (All Roles)

1.  **Central Profile Page (Editing):**
    *   **Frontend Page:** `src/app/profile/page.tsx`
    *   **Functionality:** Allows authenticated users to view and edit their base information (username, email, password) and their role-specific detailed profile information (full name, school, class, profile picture, etc.).
    *   **Workflow:**
        1.  Loads current user data from `AuthContext`.
        2.  Populates form with existing data. Dropdowns for School, Class, Subject are fetched from API.
        3.  User makes changes, optionally uploads a new profile picture.
        4.  On submit, `FormData` is created and sent via `api.patch` to `/api/users/{userId}/profile/`.
        5.  `AuthContext` is updated with the response.
    *   **Connected Frontend Files:** `src/lib/api.ts`, `src/context/AuthContext.tsx`.
    *   **Backend:**
        *   **File:** `accounts/views.py` (contains `CustomUserViewSet.update_profile` action)
        *   **File:** `accounts/serializers.py` (uses `CustomUserSerializer` which nests `StudentProfileCompletionSerializer`, `TeacherProfileCompletionSerializer`, `ParentProfileCompletionSerializer` based on role)
        *   **Functionality:** `update_profile` handles partial updates for `CustomUser` and the associated role-specific profile, including image uploads. Marks profile as complete if applicable.

#### E. Student Specific Flow

1.  **Student Dashboard:**
    *   **Entry Point:** `/student` (redirects from `/` if student is logged in and profile is complete).
    *   **File:** `src/app/student/page.tsx` (renders `StudentDashboard` if profile is complete).
    *   **Main Component:** `src/components/dashboard/StudentDashboard.tsx`
    *   **Functionality:**
        *   Displays a welcome message.
        *   Shows sections for "Enrolled Class & Subjects" (fetched from `/api/classes/` filtered by student's school/class). Subjects are displayed as `SubjectCard`s.
        *   "Resource Library" section (fetches books from `/api/books/`).
        *   "Upcoming Events" section (fetches events from `/api/events/`).
        *   Quick action links to Rewards, AI Suggestions, Reports, Forum.
    *   **Connected Files:** `src/components/dashboard/ClassSection.tsx`, `src/components/dashboard/SubjectCard.tsx`, `src/lib/api.ts`.

2.  **Learning Content Viewing:**
    *   **Subjects Overview:** `src/app/student/subjects/page.tsx` (Lists all subjects student is enrolled in).
    *   **Subject Detail (Lessons List):** `src/app/student/learn/class/[classId]/subject/[subjectId]/page.tsx`
        *   Fetches subject details and its lessons from `/api/subjects/{subjectId}/`.
        *   Displays lessons, respecting `is_locked` status.
    *   **Lesson Detail & Quiz:** `src/app/student/learn/class/[classId]/subject/[subjectId]/lesson/[lessonId]/page.tsx`
        *   Fetches lesson details from `/api/lessons/{lessonId}/` (includes lesson content, media URLs, and nested quiz data).
        *   Displays lesson content (text, video, audio, image).
        *   Allows taking the quiz:
            *   User selects answers.
            *   On submit, posts to `/api/quizzes/{quizId}/submit_quiz/`.
            *   Backend `QuizViewSet.submit_quiz` calculates score, creates `UserQuizAttempt`.
            *   Displays result.
        *   AI Note Taker section (placeholder).
    *   **Backend for Content:** `content/views.py` (`ClassViewSet`, `SubjectViewSet`, `LessonViewSet`, `QuizViewSet`, `UserQuizAttemptViewSet`).

3.  **Rewards:**
    *   **Frontend Page:** `src/app/student/rewards/page.tsx`
    *   **Functionality:** Fetches all available rewards (`/api/rewards/`) and user's achieved rewards (`/api/user-rewards/?user={userId}`). Displays unlocked and locked badges.
    *   **Backend:** `content/views.py` (`RewardViewSet`, `UserRewardViewSet`).

4.  **AI Learning Suggestions:**
    *   **Frontend Page:** `src/app/student/recommendations/page.tsx` (renders `LearningSuggestions` component).
    *   **Component:** `src/components/recommendations/LearningSuggestions.tsx`
    *   **Functionality:**
        *   Gathers student performance data (currently mocked/placeholder), available lessons, videos, quizzes.
        *   Calls the Genkit flow `personalizedLearningSuggestions`.
        *   Displays suggestions.
    *   **AI Flow:** `src/ai/flows/personalized-learning-suggestions.ts`.

5.  **Student Calendar:**
    *   **Frontend Page:** `src/app/student/calendar/page.tsx`
    *   **Functionality:** Displays ShadCN calendar. Fetches and shows events relevant to the student (school-wide, class-specific).
    *   **Backend:** `notifications/views.py` (`EventViewSet`).

#### F. Teacher Specific Flow

1.  **Teacher Dashboard:**
    *   **Entry Point:** `/teacher`
    *   **File:** `src/app/teacher/page.tsx` (renders `TeacherDashboard`).
    *   **Main Component:** `src/components/dashboard/TeacherDashboard.tsx`
    *   **Functionality:** Welcome message, stat cards (student count from `/api/users/?role=Student&school={teacherSchoolId}`). Placeholders for active courses, pending reviews, overall performance. Recent activity (placeholder API). Upcoming events. Quick links.
    *   **Connected Files:** `src/lib/api.ts`.

2.  **Content Management:**
    *   **Overview Page:** `src/app/teacher/content/page.tsx`
        *   Fetches recent lessons, quizzes, books.
        *   Links to pages for creating lessons and quizzes.
    *   **Lesson Creation:** `src/app/teacher/content/lessons/create/page.tsx`
        *   Form to create lessons (title, content, media URLs, order, locking).
        *   Cascading dropdowns: School -> Class -> Subject.
        *   POSTS to `/api/lessons/`.
    *   **Quiz Creation:** `src/app/teacher/content/quizzes/create/page.tsx`
        *   Form to create quizzes (title, description, pass mark, questions with choices).
        *   Cascading dropdowns to link quiz to a lesson.
        *   POSTS to `/api/quizzes/`.
    *   **Manage Books:** `src/app/teacher/content/books/page.tsx`
        *   Lists books from `/api/books/`. Placeholder for upload/edit.
    *   **Backend for Content CRUD:** `content/views.py` (`LessonViewSet`, `QuizViewSet`, `QuestionViewSet`, `ChoiceViewSet`, `BookViewSet`) with permissions for teachers to create content for their school.

3.  **Report Card Generation:**
    *   **Frontend Page:** `src/app/teacher/report-card/page.tsx` (renders `ReportCardGenerator`).
    *   **Component:** `src/components/report-card/ReportCardGenerator.tsx`
    *   **Functionality:** Form to input student name, class level, test scores. Calls Genkit flow `generateFinalReportCard`. Displays generated report.
    *   **AI Flow:** `src/ai/flows/final-report-card.ts`.

4.  **Other Teacher Pages (Placeholders):**
    *   `src/app/teacher/students/page.tsx` (for student roster management)
    *   `src/app/teacher/reports/page.tsx` (for viewing "legacy" generated reports)
    *   `src/app/teacher/analytics/page.tsx`
    *   `src/app/teacher/calendar/page.tsx`
    *   `src/app/teacher/communication/page.tsx` (for sending announcements, current uses Event API)

#### G. Parent Specific Flow

1.  **Parent Dashboard:**
    *   **Entry Point:** `/parent`
    *   **File:** `src/app/parent/page.tsx` (renders `ParentDashboard`).
    *   **Main Component:** `src/components/dashboard/ParentDashboard.tsx`
    *   **Functionality:** Welcome. Lists linked children (fetched from `/api/parent-student-links/?parent={parentId}`). Upcoming events. Links to communication and settings.

2.  **Child Management:**
    *   **Frontend Page:** `src/app/parent/children/page.tsx`
    *   **Functionality:**
        *   Lists linked children.
        *   "Link New Child" dialog: Parent enters child's admission number and school ID code.
        *   Calls `api.post('/parent-student-links/link-child-by-admission/')`.
        *   Backend `ParentStudentLinkViewSet.link_child_by_admission` action verifies student details (admission number, school ID code, and parent's email against `student_profile.parent_email_for_linking`). If successful, creates the link and returns student details for confirmation.
    *   **Backend:** `accounts/views.py` (`ParentStudentLinkViewSet`).

3.  **Viewing Child Progress & Reports (Placeholders):**
    *   `src/app/parent/child/[childId]/progress/page.tsx`
    *   `src/app/parent/reports/[childId]/page.tsx`
    *   These pages currently fetch placeholder data and indicate that full API integration is needed to show actual progress/reports for the specific child.

4.  **Other Parent Pages (Placeholders):**
    *   `src/app/parent/progress/page.tsx` (overview of all children's progress)
    *   `src/app/parent/communication/page.tsx`
    *   `src/app/parent/calendar/page.tsx`

#### H. School Admin Specific Flow

1.  **School Admin Dashboard:**
    *   **Entry Point:** `/school-admin/[schoolId]`
    *   **File:** `src/app/school-admin/[schoolId]/page.tsx`
    *   **Functionality:**
        *   Displays school name. Stat cards for student/staff count (fetched from `/api/users/` filtered by school and role).
        *   Upcoming events for the school (fetched from `/api/events/` filtered by school).
        *   Lists a few teachers from the school.
        *   Placeholders for School Performance, AI Management Tool.
        *   Links to other admin sections.

2.  **School Calendar Management:**
    *   **Frontend Page:** `src/app/school-admin/[schoolId]/calendar/page.tsx`
    *   **Functionality:** Displays calendar. Allows creating new school-specific events (or class-specific within that school) via a dialog form. Posts to `/api/events/`.
    *   **Backend:** `notifications/views.py` (`EventViewSet` - create action requires admin/staff or correct school admin).

3.  **School Communication (Announcements):**
    *   **Frontend Page:** `src/app/school-admin/[schoolId]/communication/page.tsx`
    *   **Functionality:** Form to create announcements (currently posts as 'General' type events). Can target entire school or specific classes within the school. Lists recent announcements.
    *   **Backend:** `notifications/views.py` (`EventViewSet`).

4.  **Other School Admin Pages (Placeholders):**
    *   `students/page.tsx`, `teachers/page.tsx`, `content/page.tsx`, `reports/page.tsx`, `analytics/page.tsx`, `settings/page.tsx` within the `/school-admin/[schoolId]/` directory.

#### I. Shared Features

1.  **Layout & Navigation System:**
    *   **Main Layout:** `src/app/layout.tsx` (includes `ThemeProvider`, `AuthProvider`, `MainAppShell`).
    *   **App Shell:** `src/components/layout/MainAppShell.tsx` (conditionally renders Header, role-specific Sidebar, and page content).
    *   **Header:** `src/components/layout/Header.tsx` (Logo, main navigation links based on auth/role, user profile dropdown/auth buttons, Dashboard link).
    *   **Sidebars:**
        *   `src/components/layout/StudentSidebarNav.tsx`
        *   `src/components/layout/TeacherSidebarNav.tsx`
        *   `src/components/layout/ParentSidebarNav.tsx`
        *   `src/components/layout/SchoolAdminSidebarNav.tsx`
        *   All use the collapsible `Sidebar` components from `src/components/ui/sidebar.tsx`.
    *   **Custom Sidebar Toggle:** `src/components/layout/CustomSidebarToggle.tsx` (Chevron icons for expand/collapse, positioned mid-sidebar).

2.  **Theme Management:**
    *   **Context:** `src/context/ThemeContext.tsx` (manages light/dark/system theme, persists to localStorage, defaults to light).
    *   **Global Styles:** `src/app/globals.css` (defines CSS variables for light and dark themes inspired by app logo colors).
    *   **Toggle UI:** Theme selection `Select` component now in role-specific settings pages (e.g., `src/app/student/settings/page.tsx`).

3.  **Forum (Placeholder):**
    *   **Frontend Page:** `src/app/forum/page.tsx`
    *   **Functionality:** Basic UI for a forum. Currently tries to fetch threads from a placeholder API endpoint. Full backend for forum (threads, posts, replies, categories) is not implemented.

---

### III. Conceptual Data Flow (Example: Student Logs In & Views a Lesson)

1.  **User Action (Login):** Student enters credentials on `src/app/login/page.tsx`.
2.  **API Call:** `loginUser` function in `src/lib/api.ts` sends a POST request to Django's `/api/token-auth/`.
3.  **Backend Auth:** Django authenticates, returns auth token.
4.  **Frontend State Update:** Token stored in `localStorage`. `fetchCurrentUser` called (GET to `/api/users/me/`). `AuthContext` updates `currentUser`.
5.  **Redirection:**
    *   `login/page.tsx` redirects to `/`.
    *   `src/app/page.tsx` (`UnifiedDashboardPage`) sees authenticated student, redirects to `/student`.
6.  **Student Dashboard Load:** `src/app/student/page.tsx` mounts.
    *   It checks if the student's profile is complete (as per the new logic of directly going to dashboard).
    *   It fetches class/subject data from `/api/classes/` (backend: `ClassViewSet`).
    *   Displays subjects.
7.  **User Action (Clicks Subject):** Navigates to `/student/learn/class/.../subject/...`.
8.  **Subject Page Load:** Fetches subject details (including lesson list) from `/api/subjects/{id}/`.
9.  **User Action (Clicks Lesson):** Navigates to `/student/learn/class/.../subject/.../lesson/...`.
10. **Lesson Page Load:** Fetches lesson details (content, quiz) from `/api/lessons/{id}/`. Displays content.

---

This document provides a high-level overview. For detailed function maps, graphs, or specific code snippets for *every* function, you would need to use code analysis tools, generate diagrams (e.g., UML, sequence diagrams), and write more granular developer documentation as the project evolves.
