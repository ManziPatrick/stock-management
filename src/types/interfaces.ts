export interface DeliveryNoteItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }
  
  export interface DeliveryNote {
    id: string;
    date: string;
    customerName: string;
    items: DeliveryNoteItem[];
    hasProof: boolean;
  }