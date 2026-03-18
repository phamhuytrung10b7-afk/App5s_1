
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
// Tăng giới hạn payload để lưu lịch sử lớn
app.use(express.json({ limit: '50mb' }));

const DATA_FILE = path.join(__dirname, 'manufacturing_data.json');

// --- Cấu trúc dữ liệu mặc định ---
const DEFAULT_STAGES = [
    { id: 1, name: "Công đoạn 1: SMT / Lắp ráp", enableMeasurement: false, measurementLabel: "", additionalFieldLabels: Array(8).fill(""), additionalFieldDefaults: Array(8).fill(""), additionalFieldMinValues: Array(8).fill(""), additionalFieldMaxValues: Array(8).fill(""), additionalFieldWhitelists: Array(8).fill([]), additionalFieldWhitelistFileNames: Array(8).fill("") },
    { id: 2, name: "Công đoạn 2: Kiểm tra ngoại quan", enableMeasurement: false, measurementLabel: "", additionalFieldLabels: Array(8).fill(""), additionalFieldDefaults: Array(8).fill(""), additionalFieldMinValues: Array(8).fill(""), additionalFieldMaxValues: Array(8).fill(""), additionalFieldWhitelists: Array(8).fill([]), additionalFieldWhitelistFileNames: Array(8).fill("") },
    { id: 3, name: "Công đoạn 3: Function Test", enableMeasurement: true, measurementLabel: "Kết quả Test", measurementStandard: "PASS", additionalFieldLabels: Array(8).fill(""), additionalFieldDefaults: Array(8).fill(""), additionalFieldMinValues: Array(8).fill(""), additionalFieldMaxValues: Array(8).fill(""), additionalFieldWhitelists: Array(8).fill([]), additionalFieldWhitelistFileNames: Array(8).fill("") },
    { id: 4, name: "Công đoạn 4: Đóng gói", enableMeasurement: false, measurementLabel: "", additionalFieldLabels: Array(8).fill(""), additionalFieldDefaults: Array(8).fill(""), additionalFieldMinValues: Array(8).fill(""), additionalFieldMaxValues: Array(8).fill(""), additionalFieldWhitelists: Array(8).fill([]), additionalFieldWhitelistFileNames: Array(8).fill("") },
    { id: 5, name: "Công đoạn 5: OBA / Xuất xưởng", enableMeasurement: false, measurementLabel: "", additionalFieldLabels: Array(8).fill(""), additionalFieldDefaults: Array(8).fill(""), additionalFieldMinValues: Array(8).fill(""), additionalFieldMaxValues: Array(8).fill(""), additionalFieldWhitelists: Array(8).fill([]), additionalFieldWhitelistFileNames: Array(8).fill("") },
];

let appState = {
  history: [],
  stages: DEFAULT_STAGES,
  stageEmployees: {},
};

// --- Load dữ liệu từ đĩa ---
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const loaded = JSON.parse(raw);
    
    // Merge dữ liệu cũ với cấu trúc mới nếu cần
    appState = { ...appState, ...loaded };
    console.log("📂 Đã tải dữ liệu từ đĩa.");
  } catch (e) {
    console.error("Lỗi tải dữ liệu:", e);
  }
}

// --- API Endpoints ---

// Lấy toàn bộ dữ liệu (cho Client khi mới vào)
app.get('/api/data', (req, res) => {
  res.json(appState);
});

// Lưu dữ liệu (Client gửi lên khi có thay đổi)
app.post('/api/save', (req, res) => {
  const { history, stages, stageEmployees } = req.body;

  if (history) appState.history = history;
  if (stages) appState.stages = stages;
  if (stageEmployees) appState.stageEmployees = stageEmployees;

  // Ghi xuống file JSON (async)
  fs.writeFile(DATA_FILE, JSON.stringify(appState, null, 2), (err) => {
    if (err) {
      console.error("Lỗi lưu file:", err);
      return res.status(500).json({ error: "Lỗi lưu dữ liệu" });
    }
    res.json({ success: true });
  });
});

// Chạy trên port 3001 để tránh xung đột với Vite (3000)
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 ProScan Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📡 API Endpoint: http://localhost:${PORT}/api/data`);
});
