export interface Environment {
  production: boolean;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

export const environment: Environment = {
  production: true,
  firebaseConfig: {
    apiKey: "AIzaSyDoofX6Ez6c7fH9a2SjZ9LREyVcLiiTPRA",
    authDomain: "mini-tienda-tools.firebaseapp.com",
    projectId: "mini-tienda-tools",
    storageBucket: "mini-tienda-tools.firebasestorage.app",
    messagingSenderId: "635143868630",
    appId: "1:635143868630:web:90d2517c966a8802f17977"
  }
};