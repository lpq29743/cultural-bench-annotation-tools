# Cultural Benchmark Annotation Tool

A web-based annotation tool for cultural benchmark data, supporting both data modification and data creation tasks. Built with vanilla JavaScript, CSS, and Firebase for backend storage.

## 🌟 Features

### Two Task Modes
- **Data Modification**: Review and annotate LLM-generated data with Accept/Revise/Reject decisions
- **Data Creation**: Create new cultural benchmark data from scratch

### Core Functionality
- ✅ Interactive annotation interface with 16 predefined cultural topics
- ✅ Real-time statistics and progress tracking
- ✅ CSV/Excel data import and export
- ✅ Firebase cloud storage integration
- ✅ Responsive design for desktop and mobile
- ✅ Keyboard shortcuts for efficient annotation
- ✅ Advanced filtering and search capabilities

## 🚀 Quick Start

### 1. Firebase Setup (Required)

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Enter project name (e.g., "cultural-annotation-tool")
   - Enable Google Analytics (optional)

2. **Enable Firestore Database**:
   - In Firebase console, go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location for your database

3. **Get Firebase Configuration**:
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click "Web" icon to add a web app
   - Register your app and copy the configuration

4. **Update Configuration**:
   - Open `firebase-config.js`
   - Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
};
```

### 2. Deploy to GitHub Pages

1. **Create GitHub Repository**:
```bash
git init
git add .
git commit -m "Initial commit: Cultural Benchmark Annotation Tool"
git remote add origin https://github.com/yourusername/cultural-bench-annotation-tools.git
git push -u origin main
```

2. **Enable GitHub Pages**:
   - Go to your GitHub repository
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - The deployment workflow is already configured in `.github/workflows/deploy.yml`

3. **Access Your Tool**:
   - After deployment, your tool will be available at:
   - `https://yourusername.github.io/cultural-bench-annotation-tools`

## 📖 Usage Guide

### Data Modification Mode
1. Switch to "Data Modification" mode in the header
2. Import CSV/Excel file containing LLM-generated data with `source_excerpt` field
3. Review each item and make annotation decisions:
   - **Accept**: Item is correct as generated
   - **Revise**: Edit the item based on source excerpt
   - **Reject**: Item cannot be reasonably revised
4. Use keyboard shortcuts (1/2/3) for quick decisions
5. Export annotated results

### Data Creation Mode
1. Switch to "Data Creation" mode in the header
2. Create new items from scratch or import existing CSV data
3. Fill in all five required fields:
   - Topic (select from 16 predefined categories)
   - Scenario
   - Question
   - Answer
   - Explanation
4. Export created dataset

### Keyboard Shortcuts
- `Ctrl/Cmd + S`: Save to Firebase
- `Ctrl/Cmd + N`: Add new item
- `Ctrl/Cmd + ←/→`: Navigate between items
- `1/2/3`: Accept/Revise/Reject (modification mode only)

## 🏗️ Project Structure

```
cultural_bench_annotation_tools/
├── index.html              # Main application page
├── styles.css              # Application styles
├── app.js                  # Main application logic
├── firebase-config.js      # Firebase configuration
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages deployment
├── data_creation/
│   └── zh_cn_yourid.csv    # Sample data file
└── README.md               # This file
```

## 🎯 Cultural Topics

The tool supports 16 predefined cultural topics:

| Topic | Description |
|-------|-------------|
| Belief | Religious faith, spiritual practices, secular ethics |
| Commerce | Buying, selling, marketing, payment systems |
| Education | Formal and informal learning, teaching |
| Entertainment | Media, arts, sports, games, performances |
| Finance | Earning, saving, investing, wealth management |
| Food | Agriculture, cooking, nutrition, dining culture |
| Government | Public policy, legislation, law enforcement |
| Habitat | Homes, buildings, infrastructure, ecosystems |
| Health | Physical, mental, emotional well-being |
| Heritage | Past events, traditions, festivals, monuments |
| Language | Official languages, dialects, communication norms |
| Pets | Care, health, training of domesticated animals |
| Science | Research, engineering, technology, innovation |
| Social | Family, friendships, community networks |
| Travel | Planning, transport, tourism, logistics |
| Work | Careers, labor markets, professional development |

## 🔧 Technical Details

### Built With
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Firebase Firestore
- **Deployment**: GitHub Pages with GitHub Actions
- **Styling**: Custom CSS with responsive design

### Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

### Data Format
The tool works with CSV files containing these fields:
- `source_excerpt` (modification mode only)
- `topic`
- `scenario`
- `question`
- `answer`
- `explanation`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify Firebase configuration is correct
3. Ensure you have internet connectivity
4. Check that your CSV file format matches the expected schema

For additional help, please open an issue on GitHub.