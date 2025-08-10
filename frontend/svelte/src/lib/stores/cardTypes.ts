import { writable } from 'svelte/store';

export interface CardType {
  name: string;
  color: string;
  logo: string;
}

const defaultCardTypes: CardType[] = [
  { name: 'Gold', color: '#FFD700', logo: '' },
  { name: 'Silver', color: '#C0C0C0', logo: '' },
  { name: 'Bronze', color: '#CD7F32', logo: '' },
  { name: 'Platinum', color: '#E5E4E2', logo: '' },
  { name: 'Diamond', color: '#B9F2FF', logo: '' }
];

export const cardTypes = writable<CardType[]>(defaultCardTypes);

// Helper function to get card type colors
export function getCardTypeColor(cardTypeName: string): string {
  let currentCardTypes: CardType[] = [];
  const unsubscribe = cardTypes.subscribe(types => currentCardTypes = types);
  unsubscribe(); // Immediately unsubscribe to get current value
  
  const cardType = currentCardTypes.find(type => 
    type.name.toLowerCase() === cardTypeName.toLowerCase()
  );
  
  return cardType?.color || '#6366f1'; // Default indigo color if not found
}

// Helper function to convert hex color to gradient-compatible colors
export function getCardTypeGradient(cardTypeName: string): { from: string; to: string } {
  const color = getCardTypeColor(cardTypeName);
  
  // Convert hex to lighter and darker versions for gradient
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Create lighter version (increase by 20)
  const lighterR = Math.min(255, r + 20);
  const lighterG = Math.min(255, g + 20);
  const lighterB = Math.min(255, b + 20);
  
  // Create darker version (decrease by 30)
  const darkerR = Math.max(0, r - 30);
  const darkerG = Math.max(0, g - 30);
  const darkerB = Math.max(0, b - 30);
  
  const lighterHex = `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
  const darkerHex = `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  
  return {
    from: lighterHex,
    to: darkerHex
  };
}
