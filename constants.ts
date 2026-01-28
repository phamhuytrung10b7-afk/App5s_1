import { Prize } from './types';

export const INITIAL_PRIZES: Prize[] = [
  {
    id: '1',
    name: 'GIẢI ĐẶC BIỆT',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=600&auto=format&fit=crop', // Smart Watch
    value: '',
    quantity: 1,
    winners: []
  },
  {
    id: '2',
    name: 'GIẢI NHẤT',
    image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=600&auto=format&fit=crop', // Smartphone
    value: '',
    quantity: 2,
    winners: []
  },
  {
    id: '3',
    name: 'GIẢI NHÌ',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=600&auto=format&fit=crop', // Laptop placeholder
    value: '',
    quantity: 3,
    winners: []
  },
  {
    id: '4',
    name: 'GIẢI BA',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop', // Headphones
    value: '',
    quantity: 5,
    winners: []
  }
];

export const MAX_NUMBER = 999;