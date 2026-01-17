
import { initializeApp, FirebaseApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { FirebaseConfigJson, SavedBill, TariffConfig, Tenant, DraftData } from '../types';
import { DEFAULT_FIREBASE_CONFIG } from '../constants';

class FirebaseService {
  private app: FirebaseApp | null = null;
  public auth: Auth | null = null;
  public db: Firestore | null = null;
  private isInitialized = false;
  private configSource: 'system' | 'custom' = 'system';

  constructor() {
    this.tryAutoInit().catch(err => {
      console.error("Critical Firebase Auto-Init Error:", err);
    });
  }

  private async tryAutoInit() {
    const storedConfig = localStorage.getItem('tmss_firebase_config');
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        if (config.apiKey && config.apiKey !== DEFAULT_FIREBASE_CONFIG.apiKey) {
           await this.initialize(config, 'custom');
           return;
        }
      } catch (e) {
        console.error("Failed to parse stored config, resetting to default.", e);
        localStorage.removeItem('tmss_firebase_config');
      }
    }

    try {
      await this.initialize(DEFAULT_FIREBASE_CONFIG, 'system');
    } catch (e) {
      console.error("Failed to auto-init with system config", e);
    }
  }

  public async initialize(config: FirebaseConfigJson, source: 'system' | 'custom' = 'custom') {
    try {
      // Clean up previous apps asynchronously to ensure fresh component registration
      const existingApps = getApps();
      if (existingApps.length > 0) {
        await Promise.all(existingApps.map(async (app) => {
          try {
            await deleteApp(app);
          } catch (e) {
            console.warn("App deletion error during re-init:", e);
          }
        }));
      }
      
      this.app = initializeApp(config);
      
      // In Firebase Modular (v9+), getAuth and getFirestore register themselves
      // with the app. Version consistency in index.html is key here.
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      
      this.isInitialized = true;
      this.configSource = source;
      localStorage.setItem('tmss_firebase_config', JSON.stringify(config));
      console.log(`Firebase [${source}] initialized successfully.`);
    } catch (error) {
      console.error("Firebase Init Error:", error);
      
      // Fallback: try to reuse any existing app if initialization failed
      const apps = getApps();
      if (apps.length > 0) {
        try {
          this.app = getApp();
          this.auth = getAuth(this.app);
          this.db = getFirestore(this.app);
          this.isInitialized = true;
          console.log("Firebase recovered from existing app instance.");
        } catch (innerError) {
          console.error("Recovery failed:", innerError);
          // Still throwing original error to notify the UI
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  public async resetToSystem() {
    localStorage.removeItem('tmss_firebase_config');
    await this.initialize(DEFAULT_FIREBASE_CONFIG, 'system');
  }

  public getConfigSource() {
    return this.configSource;
  }

  public isReady(): boolean {
    return this.isInitialized && !!this.auth && !!this.db;
  }

  public async login() {
    if (!this.auth) throw new Error("Firebase Auth not initialized");
    const provider = new GoogleAuthProvider();
    try {
      return await signInWithPopup(this.auth, provider);
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  public async logout() {
    if (!this.auth) throw new Error("Firebase Auth not initialized");
    return signOut(this.auth);
  }

  public async saveBill(uid: string, bill: SavedBill) {
    if (!this.db) throw new Error("Firestore DB not ready");
    const billRef = doc(this.db, 'users', uid, 'bills', bill.id);
    await setDoc(billRef, bill);
  }

  public async getBills(uid: string): Promise<SavedBill[]> {
    if (!this.db) throw new Error("Firestore DB not ready");
    const billsRef = collection(this.db, 'users', uid, 'bills');
    const snapshot = await getDocs(billsRef);
    return snapshot.docs.map(d => d.data() as SavedBill);
  }

  public async deleteBill(uid: string, billId: string) {
    if (!this.db) throw new Error("Firestore DB not ready");
    await deleteDoc(doc(this.db, 'users', uid, 'bills', billId));
  }

  public async saveTariff(uid: string, config: TariffConfig) {
    if (!this.db) throw new Error("Firestore DB not ready");
    await setDoc(doc(this.db, 'users', uid, 'settings', 'tariff'), config);
  }

  public async getTariff(uid: string): Promise<TariffConfig | null> {
    if (!this.db) throw new Error("Firestore DB not ready");
    const docRef = doc(this.db, 'users', uid, 'settings', 'tariff');
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as TariffConfig) : null;
  }

  public async saveTenants(uid: string, tenants: Tenant[]) {
    if (!this.db) throw new Error("Firestore DB not ready");
    await setDoc(doc(this.db, 'users', uid, 'settings', 'tenants'), { list: tenants });
  }

  public async getTenants(uid: string): Promise<Tenant[]> {
    if (!this.db) throw new Error("Firestore DB not ready");
    const docRef = doc(this.db, 'users', uid, 'settings', 'tenants');
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data().list as Tenant[]) : [];
  }

  public async saveDraft(uid: string, draft: DraftData) {
    if (!this.db) throw new Error("Firestore DB not ready");
    await setDoc(doc(this.db, 'users', uid, 'draft', 'current'), draft);
  }

  public async getDraft(uid: string): Promise<DraftData | null> {
    if (!this.db) throw new Error("Firestore DB not ready");
    const snap = await getDoc(doc(this.db, 'users', uid, 'draft', 'current'));
    return snap.exists() ? (snap.data() as DraftData) : null;
  }
}

export const firebaseService = new FirebaseService();
