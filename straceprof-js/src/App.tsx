import { useState, useRef } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <h1>straceprof</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>

      <div className="card">
        <button onClick={handleUploadClick}>Upload File</button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {selectedFile && (
          <div className="file-info">
            <h3>File Information:</h3>
            <p>Name: {selectedFile.name}</p>
            <p>Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            <p>Type: {selectedFile.type || 'Unknown'}</p>
          </div>
        )}
        {fileContent && (
          <div className="file-content">
            <h3>File Content:</h3>
            <pre>{fileContent}</pre>
          </div>
        )}
      </div>
      <p className="read-the-docs">straceprof - A profiling tool for strace</p>
    </>
  );
}

export default App;
