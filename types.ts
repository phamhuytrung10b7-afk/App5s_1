export interface ValidationRule {
  id: string;
  name: string; // Tên gợi nhớ (VD: List Model A, Check độ dài)
  type: 'contains' | 'not_contains' | 'starts_with' | 'length_eq';
  value: string; // Giá trị để so sánh (List phân cách bởi khoảng trắng/phẩy, hoặc số)
  isActive: boolean; // Trạng thái bật tắt
  errorMessage: string; // Câu báo lỗi riêng
}

export interface ScanRecord {
  id: string;
  stt: number;
  productCode: string;
  model: string; // Used as validation prefix/pattern (Mã IMEI)
  modelName?: string; // New field for the actual Model Name
  employeeId: string;
  timestamp: string; // ISO string
  status: 'valid' | 'error' | 'defect'; // Added 'defect' for manufacturing errors (NG)
  note?: string; 
  stage: number; // The stage where this scan happened (1-5)
  measurement?: string; // Recorded value (e.g. "12V", "PASS", "0.5kg")
  additionalValues?: string[]; // Values for the 16 custom fields
}

export interface Stats {
  success: number; // Count for current stage (OK)
  defect: number;  // Count for manufacturing defects (NG)
  error: number;   // System/Validation errors
}

export interface ErrorState {
  isOpen: boolean;
  message: string;
}

export interface Stage {
  id: number;
  name: string;
  // Removed isEnabled
  enableMeasurement?: boolean; // Does this stage require a measurement?
  measurementLabel?: string;   // Label for the measurement
  measurementStandard?: string; // New: Standard value to compare against (e.g. "PASS", "OK")
  additionalFieldLabels?: string[]; // Labels for 16 custom fields. Empty string = disabled.
  additionalFieldDefaults?: string[]; // New: Default values for the 16 fields.
  additionalFieldValidationLists?: string[]; // New: Whitelists for the 16 fields (string data).
  additionalFieldMins?: string[]; // New: Min values for range check
  additionalFieldMaxs?: string[]; // New: Max values for range check
  validationRules?: ValidationRule[]; // New: List of flexible validation rules
}

// Helper to create empty arrays of size 16
const EMPTY_16 = Array(16).fill("");

export const DEFAULT_PROCESS_STAGES: Stage[] = [
  { 
    id: 1, 
    name: "Kiểm tra sản phẩm", 
    enableMeasurement: true, 
    measurementLabel: "Kết quả Test", 
    measurementStandard: "OK", 
    additionalFieldLabels: [...EMPTY_16], 
    additionalFieldDefaults: [...EMPTY_16],
    additionalFieldValidationLists: [...EMPTY_16],
    additionalFieldMins: [...EMPTY_16],
    additionalFieldMaxs: [...EMPTY_16],
    validationRules: []
  }
];