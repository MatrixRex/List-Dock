# List Dock 📋

A sleek, high-performance Chrome Extension for managing your tasks directly in the side panel. Built with a focus on speed, aesthetics, and user experience.

[![Latest Release](https://img.shields.io/github/v/release/MatrixRex/List-Dock?label=Download&color=2e7d32&logo=github)](https://github.com/MatrixRex/List-Dock/releases/latest)

<div align="center">
  <img src="public/Screenshot_4.jpg" alt="List Dock Screenshot" width="128" />
</div>

## 🚀 Key Features

- **Side Panel Integration**: Open/Close with icon click.
- **Combo Input**: Add task, folder and serach from one input.
- **Drag & Drop**: Intuitive reorganization of tasks and folders.
- **Folder Organization**: Categorize your tasks into folders with support for subtasks.
- **Search**: Global and local search to find your tasks instantly.
- **Undo Actions**: Use the undo from toast message.
- **Sleek Design**: Modern glassmorphism UI with smooth Framer Motion animations.
- **Fully Local**: Your data stays on your machine, synced and saved via `chrome.storage.local`.

## 🛠️ Tech Stack

- **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build System**: [Vite](https://vitejs.dev/) + [CRXJS](https://crxjs.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Search**: [Fuse.js](https://www.fusejs.io/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

## 📦 Installation

To install the extension in your browser:

1. **Download the Latest Release**: Head to the [Latest Release](https://github.com/MatrixRex/List-Dock/releases/latest) page and download the `list-dock.zip` file.
2. **Unzip the file**: Extract the contents to a folder on your computer.
3. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** (top right toggle).
   - Click **Load unpacked**.
   - Select the folder you extracted in step 2.
   - **Do not delete** the folder after loading.

## 🛠️ Development

If you want to contribute or build the extension from source:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MatrixRex/List-Dock.git
   cd list-dock
   ```
2. **Install dependencies**:
   ```bash
   pnpm install
   ```
3. **Build the extension**:
   ```bash
   pnpm build
   ```
4. **Load the build**:
   - Follow the "Load in Chrome" steps above, but select the `dist` folder generated inside the project directory.


## 📖 How to Use

- **Opening the Sidebar**: Click the List Dock extension icon ![alt text](public/icons/icon16.png) in your browser toolbar to toggle the side panel.
- **Combo Input**: Use the multifunctional input at the bottom:
  - **Task Mode**: Default mode to add tasks. If a task is selected, it adds a subtask.
  - **Folder Mode**: Click the folder icon to create new categories. Only available in root.
  - **Search Mode**: Click the magnifying glass to filter through all your tasks.
- **Managing Tasks**: Drag and drop tasks to prioritize or move them into folders.
- **Undo**: Use the toast notification to undo your last action.


## 🔗 Links

- **Latest Release**: [Download here](https://github.com/MatrixRex/List-Dock/releases/latest)
- **Open Source**: This project is open for contributions!

## 📄 License

This project is **Open Source** and available under the [MIT License](LICENSE).
