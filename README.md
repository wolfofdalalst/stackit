# StackIt

A minimal question-and-answer platform that supports collaborative learning and structured knowledge sharing. Designed to be simple, user-friendly, and focused on the core experience of asking and answering questions within a community.

## Team BARY

| Name | Email |
|------|-------|
| Benny | benny01r@gmail.com |
| Ayush | ayushgupta01195@gmail.com |
| Rishi | akkina.rishyendra@gmail.com |
| Yogesh | yogesh.gorrepati30@gmail.com |

## Features

### User Roles

| Role  | Permissions |
|-------|-------------|
| Guest | View all questions and answers |
| User  | Register, log in, post questions/answers, vote |
| Admin | Moderate content |

### Core Functionality

#### Asking Questions
Users can submit new questions with:
- **Title** – Short and descriptive
- **Description** – Written using a rich text editor
- **Tags** – Multi-select input (e.g., `React`, `JWT`)

#### Rich Text Editor
The description editor supports:
- **Text Formatting**: Bold, Italic, Strikethrough
- **Lists**: Numbered lists, Bullet points
- **Media**: Emoji insertion, Image upload
- **Links**: Hyperlink insertion (URL)
- **Alignment**: Left, Center, Right

#### Answering Questions
- Users can post answers to any question
- Answers can be formatted using the same rich text editor
- Only logged-in users can post answers

#### Voting & Accepting Answers
- Users can upvote or downvote answers
- Question owners can mark one answer as accepted

#### Tagging System
- Questions must include relevant tags for categorization

#### Notification System
A notification system keeps users engaged with:
- **Notification Icon**: Bell icon appears in the top navigation bar
- **Notification Triggers**:
  - Someone answers their question
  - Someone comments on their answer
  - Someone mentions them using `@username`
- **Visual Indicators**: Icon shows the number of unread notifications
- **Notification Panel**: Clicking the icon opens a dropdown with recent notifications