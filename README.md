# Smart Issue Tracker - React + Firebase

A modern, full-featured issue tracking system built with React, Firebase, Tailwind CSS, and shadcn/ui components.

![Issue Tracker](https://img.shields.io/badge/React-18.3-blue)
![Firebase](https://img.shields.io/badge/Firebase-10.13-orange)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)

## Features

- ✅ **Authentication**: Email/password sign-up and login with Firebase Auth
- ✅ **Issue Management**: Create, read, and update issues with full CRUD operations
- ✅ **Smart Duplicate Detection**: Intelligent similar issue detection using text similarity algorithms
- ✅ **Status Workflow**: Enforced status transitions (Open → In Progress → Done)
- ✅ **Advanced Filtering**: Filter by status and priority with real-time updates
- ✅ **Modern UI**: Clean, professional interface using shadcn/ui components
## Live Demo

🚀 **[View Live Application](https://smart-issue-tracker.vercel.app)**

Test credentials (optional):
- Email: test@example.com
- Password: test2025
## Why This Frontend Stack?

### React
I chose React because it's the industry standard for building dynamic single-page applications with excellent component reusability [web:27]. The component-based architecture made it easy to separate concerns (Auth, CreateIssue, IssueList) and maintain clean, modular code.

### Tailwind CSS
Tailwind provides utility-first CSS that enables rapid UI development without context-switching between files [web:27]. It's particularly effective for responsive design and maintaining consistent spacing/colors across components.

### shadcn/ui
Unlike traditional component libraries, shadcn/ui copies components directly into your project, giving you full control and customization [web:27]. This approach provides:
- **Zero dependencies overhead**: Only install what you use
- **Full customization**: Modify components without fighting library constraints
- **Type-safe**: Built with TypeScript foundations
- **Accessible**: Built on Radix UI primitives with ARIA compliance

### Firebase
Firebase offers a complete backend solution with minimal setup [web:29]:
- **Firestore**: Real-time NoSQL database with offline support
- **Authentication**: Secure, battle-tested auth with email/password
- **Serverless**: No backend code to maintain, scales automatically
- **Free tier**: Generous limits for development and small projects

This stack enables rapid development while maintaining professional code quality and user experience.

## Firestore Data Structure

### Collection: `issues`

Each document in the `issues` collection has the following structure:
{
  id: "auto-generated-doc-id", // Firebase auto-generated
  title: "Fix login button alignment", // String
  description: "The login button...", // String (detailed)
  priority: "High", // Enum: "Low" | "Medium" | "High"
  status: "In Progress", // Enum: "Open" | "In Progress" | "Done"
  assignedTo: "asfar@example.com", // String (email or name)
  createdBy: "admin@example.com", // String (creator's email)
  createdAt: "2025-12-29T18:30:00Z" // ISO 8601 timestamp string
}

### Design Decisions

**Flat Structure**: I chose a single collection instead of nested subcollections because:
- All issues have equal hierarchy (no parent-child relationships)
- Simpler queries and filtering
- Better performance for listing all issues

**String-based Timestamps**: Using ISO 8601 strings instead of Firestore timestamps because:
- Easier to sort and display in React
- No timezone conversion issues
- Simpler JSON serialization

**Email for User References**: Instead of user IDs, I used emails because:
- More readable in the UI without additional lookups
- Simpler authentication flow
- Adequate for this application scope

**Enum-like Fields**: Status and priority use predefined string values enforced at the application level, making queries predictable and UI rendering consistent.

## Similar Issue Detection Algorithm

### Implementation Strategy

I implemented a **keyword-based similarity detection** algorithm that runs client-side before creating new issues:

const checkSimilarIssues = async (searchTitle) => {
// 1. Extract meaningful keywords (ignore words < 3 chars)
const titleWords = searchTitle.toLowerCase()
.split(' ')
.filter(word => word.length > 2);

// 2. Fetch all existing issues
const querySnapshot = await getDocs(issuesRef);

// 3. Calculate similarity score for each issue
const similar = [];
querySnapshot.forEach((doc) => {
const issue = doc.data();
const issueTitle = issue.title.toLowerCase();
// Count matching keywords
const matchCount = titleWords.filter(word => 
  issueTitle.includes(word)
).length;

// Calculate similarity percentage
const similarity = matchCount / titleWords.length;

// Threshold: 40% keyword match
if (similarity > 0.4) {
  similar.push({ id: doc.id, ...issue, similarity });
}
});

// 4. Return top 3 most similar issues
return similar
.sort((a, b) => b.similarity - a.similarity)
.slice(0, 3);
};

### Why This Approach?

1. **No External Dependencies**: Avoids heavy NLP libraries, keeping bundle size small
2. **Fast Execution**: Simple string operations complete in milliseconds
3. **Tunable Threshold**: 40% match balances false positives vs. false negatives
4. **Context-Aware**: Shows status and priority to help users decide if it's truly duplicate

### User Flow

1. User fills out issue form and clicks "Create"
2. Algorithm checks for similar titles
3. If matches found → Shows dialog with similar issues
4. User can either:
   - **Cancel**: Go back and modify their issue
   - **Create Anyway**: Proceed despite similarities

### Improvements Considered

- **Levenshtein Distance**: For typo tolerance (rejected due to complexity)
- **TF-IDF Scoring**: For better keyword weighting (rejected for this scope)
- **Description Matching**: Currently only checks titles (future enhancement)

## Challenges & Confusing Aspects

### 1. Firestore Query Limitations
**Challenge**: Firestore doesn't support full-text search or regex queries natively [web:29].

**Solution**: I had to fetch all issues client-side and perform similarity matching in JavaScript. For a production app with 10,000+ issues, I'd implement:
- Algolia/Elasticsearch integration for search
- Firestore extensions for better text search
- Pagination to limit fetched documents

### 2. shadcn/ui Setup Without TypeScript
**Challenge**: Most shadcn documentation assumes TypeScript, but this project uses JavaScript.

**Solution**: Had to manually adapt components:
- Removed TypeScript type annotations
- Adjusted import paths in `jsconfig.json`
- Modified component prop destructuring patterns

### 3. Status Transition Validation
**Challenge**: Ensuring the "Open → Done" restriction works reliably without a backend.

**Solution**: Implemented dual-layer validation:
- **Client-side**: Immediate feedback with friendly error messages
- **Firestore rules**: Server-side enforcement to prevent malicious updates

**Confusion**: Initially unclear if Firestore security rules could access previous document state (`resource.data`) - documentation was scattered.

### 4. Real-time Updates After CRUD Operations
**Challenge**: Issues list wouldn't update immediately after creating/editing issues.

**Solution**: Implemented a `refreshKey` prop in parent component that increments on changes, triggering `useEffect` re-fetch in child component.

### 5. Select Component Styling Within Badge
**Challenge**: Wrapping shadcn Select trigger with Badge component broke styling.

**Solution**: Placed Badge inside SelectTrigger and adjusted height classes to maintain consistent appearance.

## What I Would Improve Next

### High Priority

1. **Add Toast Notifications**
   - Install `sonner` for better user feedback [web:27]
   - Replace Alert components with non-blocking toasts
   - Show success messages for create/update operations

2. **Implement Optimistic Updates**
   - Update UI immediately before Firestore confirms
   - Roll back on error
   - Improves perceived performance

3. **Add Issue Comments**
   - Subcollection under each issue
   - Real-time comment thread
   - Mention/notification system

4. **Pagination & Infinite Scroll**
   - Currently loads all issues (doesn't scale)
   - Implement Firestore cursor-based pagination
   - Add "Load More" or infinite scroll

### Medium Priority

5. **Search Functionality**
   - Full-text search across title and description
   - Filter by assigned user or creator
   - Date range filtering

6. **Issue Attachments**
   - Firebase Storage integration
   - Image/file uploads
   - Preview in issue cards

7. **User Profile Management**
   - Display names instead of just emails
   - Profile pictures
   - User roles (admin, developer, viewer)

8. **Export Functionality**
   - Export issues to CSV/JSON
   - Filtered export based on current view
   - Bulk operations (close multiple issues)

### Nice-to-Have

9. **Dark Mode**
   - Already have CSS variables set up
   - Just need theme toggle component
   - Persist preference in localStorage

10. **Activity Timeline**
    - Track all status changes
    - Show who changed what and when
    - Audit trail for compliance

11. **Email Notifications**
    - Firebase Cloud Functions for triggers
    - Notify assignee when issue created/updated
    - Daily digest of open issues

12. **Advanced Similar Issue Detection**
    - Use description text, not just title
    - Implement TF-IDF or cosine similarity
    - Machine learning-based duplicate detection

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Firebase account

### Step 1: Clone & Install
git clone <your-repo-url>
cd issue-tracker
npm install

### Step 2: Firebase Configuration
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Email/Password authentication
3. Create a Firestore database
4. Copy your config and create `.env`:

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

### Step 3: Firestore Security Rules
rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
match /issues/{issue} {
allow read: if request.auth != null;
allow create: if request.auth != null;
allow update: if request.auth != null &&
!(resource.data.status == 'Open' && request.resource.data.status == 'Done');
allow delete: if request.auth != null;
}
}
}

### Step 4: Run Development Server
npm run dev

Open http://localhost:5173 in your browser.

## Project Structure

issue-tracker/
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn components
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── select.jsx
│   │   │   ├── textarea.jsx
│   │   │   ├── card.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── alert.jsx
│   │   │   ├── label.jsx
│   │   │   └── dialog.jsx
│   │   ├── Auth.jsx             # Login/signup component
│   │   ├── CreateIssue.jsx      # Issue creation form
│   │   ├── IssueList.jsx        # Issues display & filters
│   │   └── SimilarIssuesDialog.jsx # Duplicate detection UI
│   ├── lib/
│   │   └── utils.js             # Utility functions (cn helper)
│   ├── firebase.js              # Firebase initialization
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles + Tailwind
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Template for .env
├── components.json              # shadcn configuration
├── jsconfig.json                # Path aliases
├── tailwind.config.js           # Tailwind configuration
├── vite.config.js               # Vite configuration
└── package.json                 # Dependencies


## Technologies Used

- **React 18.3** - UI framework
- **Firebase 10.13** - Backend (Auth + Firestore)
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - Component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Vite 5.4** - Build tool and dev server

## License

MIT License - feel free to use this project for learning or production.

## Author
**Sk Asfar Ali**
- GitHub: https://github.com/Asfar35
  
Built as a demonstration of modern React development practices with Firebase integration.

