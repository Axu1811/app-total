import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Firestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

// 1. Definimos la forma del producto
export interface Product {
  name: string;
  price: number;
  description: string;
  image: string;
  code: string;
}

// 2. Exportamos la clase del servicio
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private db: Firestore;

  constructor() {
    const app = initializeApp(environment.firebaseConfig);
    this.db = getFirestore(app);
  }

  addProduct(product: Product) {
    const productsRef = collection(this.db, 'products');
    return addDoc(productsRef, product);
  }
}