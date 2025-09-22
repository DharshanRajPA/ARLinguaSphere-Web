# AR Language Learner

AI-Powered Object Recognition and Translation. An immersive, AI-powered language learning assistant. Upload an image or use your webcam to detect objects, see their names, and hear them translated into a language of your choice.

[![AR Language Learner Demo](./public/demo.png)](https://your-website-url.com)

**[➡️ View Live Demo](https://your-website-url.com)** (Link to be updated with your deployment URL)

---

## ✨ Features

-   **🤖 AI Object Detection:** Identifies multiple objects in an image using the Google Gemini API.
-   **🌐 Instant Translation:** Translates object names into Spanish, French, German, or Italian.
-   **🖼️ Interactive Exploration:** Click through each detected object with a visual bounding box highlighting it in the image.
-   **🎤 Pronunciation Practice:** Use your microphone to practice saying the translated words and get instant visual feedback on your accuracy.
-   **📚 Vocabulary Builder:** Automatically saves new words to a personal vocabulary list, persisted in your browser.
-   **🧠 Knowledge Quizzes:** Test your knowledge with dynamically generated multiple-choice quizzes based on the objects you've found.
-   **🗂️ Analysis History:** Keeps a record of your recent image analyses so you can revisit them anytime.
-   **📸 Webcam & Upload Support:** Use your live webcam to analyze your surroundings or upload any image file.

## 🛠️ Technology Stack

-   **Frontend:** React, TypeScript, Tailwind CSS
-   **AI Model:** Google Gemini API (`gemini-2.5-flash`)
-   **Web APIs:** Web Speech API (SpeechRecognition), Web Audio API (SpeechSynthesis)
-   **Storage:** Browser `localStorage` for persisting history and vocabulary.

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

-   You need to have [Node.js](https://nodejs.org/) (which includes `npm`) installed on your computer.
-   A modern web browser like Chrome or Firefox.

### 1. Clone the Repository

First, clone this repository to your local machine:

```bash
git clone https://github.com/your-username/ar-language-learner.git
cd ar-language-learner
```

### 2. Get Your Gemini API Key

This project requires a Google Gemini API key to function.

1.  Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to get your API key.
2.  Click **"Create API key in new project"** and copy the generated key.

### 3. Configure Your API Key

You need to make your API key available to the application. The project is set up to read the key from an environment variable.

1.  This project uses Vite, which handles environment variables. Create a new file named `.env.local` in the root of the project directory.

2.  Add the following line to the `.env.local` file, replacing `YOUR_GEMINI_API_KEY_HERE` with the key you obtained.

    ```
    VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```

### 4. Install Dependencies & Run

Install the necessary packages and start the development server.

```bash
npm install
npm run dev
```

The application should now be running at `http://localhost:5173` (or another port if 5173 is busy).

## ⚙️ How It Works

1.  **Image Input**: The user provides an image via webcam or file upload.
2.  **API Request**: The image is converted to a base64 string and sent to the Gemini API (`gemini-2.5-flash` model).
3.  **AI Analysis**: A detailed prompt instructs the model to act as a computer vision system. It identifies objects and returns a structured JSON array containing each object's `label`, `translation`, `confidence` score, and `boundingBox` coordinates.
4.  **Interactive Display**: The frontend parses the JSON response and displays the results. Users can cycle through each object, which is highlighted with a bounding box on the image.
5.  **Learning Tools**: The Web Audio API is used to speak the translations (text-to-speech). The Web Speech API is used to listen to the user's pronunciation and provide feedback (speech-to-text).
6.  **Persistence**: The user's vocabulary and analysis history are saved to the browser's `localStorage`, making them available across sessions.

## 🌐 Deployment

This is a static frontend application that can be deployed to any static site hosting service.

**Popular options include:**

-   [Vercel](https://vercel.com/)
-   [Netlify](https://www.netlify.com/)
-   [GitHub Pages](https://pages.github.com/)

### ⚠️ Important Security Note

The current setup exposes your Gemini API key on the client-side. **This is not secure for a public production application**, as anyone could find and use your key, potentially incurring costs on your Google Cloud account.

**For a real-world deployment, you MUST protect your API key.** The recommended approach is to create a simple backend proxy or a serverless function (e.g., using Vercel Functions, Netlify Functions, or AWS Lambda).

**Proxy Flow:**

1.  Your React app makes a request to your own backend endpoint (e.g., `/api/analyze`).
2.  Your secure backend/serverless function receives this request.
3.  The backend adds your secret API key and forwards the request to the Google Gemini API.
4.  The Gemini API response is sent back to your backend, which then relays it to your React app.

This way, the API key never leaves your secure server environment.
