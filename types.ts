export interface Prize {
  id: string;
  name: string;
  image: string;
  value: string;
  quantity: number;
  winners: number[]; // Array of winning numbers
}

export enum GameState {
  IDLE = 'IDLE',
  SPINNING = 'SPINNING',
  STOPPING = 'STOPPING',
  CELEBRATING = 'CELEBRATING'
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export interface NumberConfig {
  mode: 'RANGE' | 'LIST';
  min: number;
  max: number;
  customList: number[]; // List of allowed numbers
  names: Record<number, string>; // Map number to name
  isAutoStop: boolean; // Enable auto-stop feature
  spinDuration: number; // Duration in seconds before stopping
  backgroundImage: string | null; // Custom background image
}