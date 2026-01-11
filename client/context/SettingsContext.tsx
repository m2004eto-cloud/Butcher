/**
 * Settings Context
 * Manages all admin-configurable settings: VAT, delivery, promo codes, banners, loyalty, etc.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Promo Code Type
export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  type: "percent" | "fixed";
  minOrder?: number;
  maxUses?: number;
  usedCount: number;
  expiryDate?: string;
  enabled: boolean;
  description?: string;
  descriptionAr?: string;
}

// Banner Type
export interface Banner {
  id: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  image: string;
  bgColor: string;
  link: string;
  badge?: string;
  badgeAr?: string;
  enabled: boolean;
  order: number;
}

// Time Slot Type
export interface TimeSlot {
  id: string;
  start: string; // e.g., "09:00"
  end: string; // e.g., "12:00"
  enabled: boolean;
}

// Loyalty Tier Type
export interface LoyaltyTier {
  id: string;
  name: string;
  nameAr: string;
  minPoints: number;
  multiplier: number;
  color: string;
  icon: string;
  benefits: string[];
  benefitsAr: string[];
}

// Store Settings Type
export interface StoreSettings {
  // Store Info
  storeName: string;
  storeNameAr: string;
  contactEmail: string;
  contactPhone: string;
  
  // Tax Settings
  vatRate: number;
  taxRegistrationNumber: string;
  showVatOnInvoice: boolean;
  
  // Order Settings
  minOrderValue: number;
  defaultDeliveryFee: number;
  freeDeliveryThreshold: number;
  expressDeliveryFee: number;
  enableCOD: boolean;
  enableCardPayment: boolean;
  enableWalletPayment: boolean;
  
  // Tip Settings
  tipOptions: number[];
  enableTipping: boolean;
  
  // Wallet Settings
  welcomeBonus: number;
  enableWelcomeBonus: boolean;
  
  // Loyalty Settings
  pointsPerAed: number; // Points earned per AED spent
  pointsToAedRate: number; // How many points = 1 AED
  referralBonus: number;
  birthdayBonus: number;
  
  // Delivery Settings
  sameDayCutoffHours: number; // Hours before delivery for same-day cutoff
  maxAdvanceOrderDays: number;
  
  // Notifications
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;
  enableLowStockAlerts: boolean;
}

interface SettingsContextType {
  // Store Settings
  settings: StoreSettings;
  updateSettings: (updates: Partial<StoreSettings>) => void;
  
  // Promo Codes
  promoCodes: PromoCode[];
  addPromoCode: (code: Omit<PromoCode, "id" | "usedCount">) => void;
  updatePromoCode: (id: string, updates: Partial<PromoCode>) => void;
  deletePromoCode: (id: string) => void;
  validatePromoCode: (code: string, orderTotal: number) => { valid: boolean; error?: string; promo?: PromoCode };
  
  // Banners
  banners: Banner[];
  addBanner: (banner: Omit<Banner, "id">) => void;
  updateBanner: (id: string, updates: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  reorderBanners: (bannerIds: string[]) => void;
  
  // Time Slots
  timeSlots: TimeSlot[];
  addTimeSlot: (slot: Omit<TimeSlot, "id">) => void;
  updateTimeSlot: (id: string, updates: Partial<TimeSlot>) => void;
  deleteTimeSlot: (id: string) => void;
  
  // Loyalty Tiers
  loyaltyTiers: LoyaltyTier[];
  updateLoyaltyTier: (id: string, updates: Partial<LoyaltyTier>) => void;
  
  // Export/Import for syncing
  exportSettings: () => string;
  importSettings: (jsonData: string) => boolean;
  resetToDefaults: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

// Storage keys
const SETTINGS_STORAGE_KEY = "butcher_admin_settings";
const PROMO_CODES_STORAGE_KEY = "butcher_promo_codes";
const BANNERS_STORAGE_KEY = "butcher_banners";
const TIME_SLOTS_STORAGE_KEY = "butcher_time_slots";
const LOYALTY_TIERS_STORAGE_KEY = "butcher_loyalty_tiers";

// Default Settings
const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Butcher Shop",
  storeNameAr: "متجر اللحوم",
  contactEmail: "contact@butcher.ae",
  contactPhone: "+971 4 123 4567",
  
  vatRate: 5,
  taxRegistrationNumber: "100123456700003",
  showVatOnInvoice: true,
  
  minOrderValue: 50,
  defaultDeliveryFee: 15,
  freeDeliveryThreshold: 200,
  expressDeliveryFee: 25,
  enableCOD: true,
  enableCardPayment: true,
  enableWalletPayment: true,
  
  tipOptions: [5, 10, 15, 20],
  enableTipping: true,
  
  welcomeBonus: 50,
  enableWelcomeBonus: true,
  
  pointsPerAed: 1,
  pointsToAedRate: 10, // 10 points = 1 AED
  referralBonus: 100,
  birthdayBonus: 50,
  
  sameDayCutoffHours: 2,
  maxAdvanceOrderDays: 7,
  
  enableEmailNotifications: true,
  enableSmsNotifications: true,
  enablePushNotifications: true,
  enableLowStockAlerts: true,
};

// Default Promo Codes
const DEFAULT_PROMO_CODES: PromoCode[] = [
  { id: "1", code: "WELCOME10", discount: 10, type: "percent", enabled: true, usedCount: 0, description: "Welcome discount for new users" },
  { id: "2", code: "SAVE20", discount: 20, type: "fixed", enabled: true, usedCount: 0, description: "Save 20 AED on your order" },
  { id: "3", code: "MEAT15", discount: 15, type: "percent", minOrder: 100, enabled: true, usedCount: 0, description: "15% off on orders over 100 AED" },
  { id: "4", code: "FIRSTORDER", discount: 25, type: "fixed", enabled: true, usedCount: 0, description: "25 AED off first order" },
  { id: "5", code: "FRESH20", discount: 20, type: "percent", minOrder: 150, enabled: true, usedCount: 0, description: "20% off fresh meat" },
  { id: "6", code: "MEAT50", discount: 50, type: "fixed", minOrder: 200, enabled: true, usedCount: 0, description: "50 AED off orders over 200" },
  { id: "7", code: "EIDJOY", discount: 30, type: "percent", minOrder: 300, expiryDate: "2026-12-31", enabled: true, usedCount: 0, description: "Eid special discount" },
];

// Default Banners
const DEFAULT_BANNERS: Banner[] = [
  {
    id: "1",
    titleEn: "Premium Quality Meats",
    titleAr: "لحوم عالية الجودة",
    subtitleEn: "Fresh cuts delivered to your door",
    subtitleAr: "قطع طازجة تصل إلى باب منزلك",
    image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80",
    bgColor: "from-red-600 to-red-800",
    link: "/products",
    badge: "Premium",
    badgeAr: "ممتاز",
    enabled: true,
    order: 1,
  },
  {
    id: "2",
    titleEn: "Free Delivery",
    titleAr: "توصيل مجاني",
    subtitleEn: "On orders above 200 AED",
    subtitleAr: "للطلبات فوق 200 درهم",
    image: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=800&q=80",
    bgColor: "from-amber-600 to-amber-800",
    link: "/products",
    badge: "Free Delivery",
    badgeAr: "توصيل مجاني",
    enabled: true,
    order: 2,
  },
];

// Default Time Slots
const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: "1", start: "09:00", end: "12:00", enabled: true },
  { id: "2", start: "12:00", end: "15:00", enabled: true },
  { id: "3", start: "15:00", end: "18:00", enabled: true },
  { id: "4", start: "18:00", end: "21:00", enabled: true },
];

// Default Loyalty Tiers
const DEFAULT_LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    nameAr: "برونزي",
    minPoints: 0,
    multiplier: 1,
    color: "#CD7F32",
    icon: "🥉",
    benefits: ["Earn 1 point per AED spent", "Birthday bonus points"],
    benefitsAr: ["اكسب 1 نقطة لكل درهم", "نقاط إضافية في عيد ميلادك"],
  },
  {
    id: "silver",
    name: "Silver",
    nameAr: "فضي",
    minPoints: 500,
    multiplier: 1.5,
    color: "#C0C0C0",
    icon: "🥈",
    benefits: ["1.5x points multiplier", "Free delivery on orders over 150 AED", "Early access to deals"],
    benefitsAr: ["مضاعف النقاط 1.5x", "توصيل مجاني للطلبات فوق 150 درهم", "وصول مبكر للعروض"],
  },
  {
    id: "gold",
    name: "Gold",
    nameAr: "ذهبي",
    minPoints: 1500,
    multiplier: 2,
    color: "#FFD700",
    icon: "🥇",
    benefits: ["2x points multiplier", "Free delivery always", "Priority support", "Exclusive offers"],
    benefitsAr: ["مضاعف النقاط 2x", "توصيل مجاني دائماً", "دعم أولوي", "عروض حصرية"],
  },
  {
    id: "platinum",
    name: "Platinum",
    nameAr: "بلاتيني",
    minPoints: 5000,
    multiplier: 3,
    color: "#E5E4E2",
    icon: "💎",
    benefits: ["3x points multiplier", "Free express delivery", "VIP support", "Exclusive platinum offers", "Free gift on every order over 500 AED"],
    benefitsAr: ["مضاعف النقاط 3x", "توصيل سريع مجاني", "دعم VIP", "عروض بلاتينية حصرية", "هدية مجانية لكل طلب فوق 500 درهم"],
  },
];

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(DEFAULT_PROMO_CODES);
  const [banners, setBanners] = useState<Banner[]>(DEFAULT_BANNERS);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(DEFAULT_TIME_SLOTS);
  const [loyaltyTiers, setLoyaltyTiers] = useState<LoyaltyTier[]>(DEFAULT_LOYALTY_TIERS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) setSettings(JSON.parse(savedSettings));
      
      const savedPromoCodes = localStorage.getItem(PROMO_CODES_STORAGE_KEY);
      if (savedPromoCodes) setPromoCodes(JSON.parse(savedPromoCodes));
      
      const savedBanners = localStorage.getItem(BANNERS_STORAGE_KEY);
      if (savedBanners) setBanners(JSON.parse(savedBanners));
      
      const savedTimeSlots = localStorage.getItem(TIME_SLOTS_STORAGE_KEY);
      if (savedTimeSlots) setTimeSlots(JSON.parse(savedTimeSlots));
      
      const savedLoyaltyTiers = localStorage.getItem(LOYALTY_TIERS_STORAGE_KEY);
      if (savedLoyaltyTiers) setLoyaltyTiers(JSON.parse(savedLoyaltyTiers));
    } catch (error) {
      console.error("Error loading settings from storage:", error);
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(PROMO_CODES_STORAGE_KEY, JSON.stringify(promoCodes));
  }, [promoCodes, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(BANNERS_STORAGE_KEY, JSON.stringify(banners));
  }, [banners, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(TIME_SLOTS_STORAGE_KEY, JSON.stringify(timeSlots));
  }, [timeSlots, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(LOYALTY_TIERS_STORAGE_KEY, JSON.stringify(loyaltyTiers));
  }, [loyaltyTiers, isInitialized]);

  // Settings functions
  const updateSettings = (updates: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // Promo Code functions
  const addPromoCode = (code: Omit<PromoCode, "id" | "usedCount">) => {
    const newCode: PromoCode = {
      ...code,
      id: Date.now().toString(),
      usedCount: 0,
    };
    setPromoCodes((prev) => [...prev, newCode]);
  };

  const updatePromoCode = (id: string, updates: Partial<PromoCode>) => {
    setPromoCodes((prev) =>
      prev.map((code) => (code.id === id ? { ...code, ...updates } : code))
    );
  };

  const deletePromoCode = (id: string) => {
    setPromoCodes((prev) => prev.filter((code) => code.id !== id));
  };

  const validatePromoCode = (code: string, orderTotal: number) => {
    const promo = promoCodes.find(
      (p) => p.code.toUpperCase() === code.toUpperCase() && p.enabled
    );
    
    if (!promo) {
      return { valid: false, error: "Invalid promo code" };
    }
    
    if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) {
      return { valid: false, error: "Promo code has expired" };
    }
    
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return { valid: false, error: "Promo code usage limit reached" };
    }
    
    if (promo.minOrder && orderTotal < promo.minOrder) {
      return { valid: false, error: `Minimum order of ${promo.minOrder} AED required` };
    }
    
    return { valid: true, promo };
  };

  // Banner functions
  const addBanner = (banner: Omit<Banner, "id">) => {
    const newBanner: Banner = {
      ...banner,
      id: Date.now().toString(),
    };
    setBanners((prev) => [...prev, newBanner]);
  };

  const updateBanner = (id: string, updates: Partial<Banner>) => {
    setBanners((prev) =>
      prev.map((banner) => (banner.id === id ? { ...banner, ...updates } : banner))
    );
  };

  const deleteBanner = (id: string) => {
    setBanners((prev) => prev.filter((banner) => banner.id !== id));
  };

  const reorderBanners = (bannerIds: string[]) => {
    setBanners((prev) => {
      const reordered = bannerIds
        .map((id, index) => {
          const banner = prev.find((b) => b.id === id);
          return banner ? { ...banner, order: index + 1 } : null;
        })
        .filter((b): b is Banner => b !== null);
      return reordered;
    });
  };

  // Time Slot functions
  const addTimeSlot = (slot: Omit<TimeSlot, "id">) => {
    const newSlot: TimeSlot = {
      ...slot,
      id: Date.now().toString(),
    };
    setTimeSlots((prev) => [...prev, newSlot]);
  };

  const updateTimeSlot = (id: string, updates: Partial<TimeSlot>) => {
    setTimeSlots((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, ...updates } : slot))
    );
  };

  const deleteTimeSlot = (id: string) => {
    setTimeSlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  // Loyalty Tier functions
  const updateLoyaltyTier = (id: string, updates: Partial<LoyaltyTier>) => {
    setLoyaltyTiers((prev) =>
      prev.map((tier) => (tier.id === id ? { ...tier, ...updates } : tier))
    );
  };

  // Export/Import functions
  const exportSettings = () => {
    return JSON.stringify({
      settings,
      promoCodes,
      banners,
      timeSlots,
      loyaltyTiers,
    }, null, 2);
  };

  const importSettings = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.settings) setSettings(data.settings);
      if (data.promoCodes) setPromoCodes(data.promoCodes);
      if (data.banners) setBanners(data.banners);
      if (data.timeSlots) setTimeSlots(data.timeSlots);
      if (data.loyaltyTiers) setLoyaltyTiers(data.loyaltyTiers);
      return true;
    } catch {
      return false;
    }
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setPromoCodes(DEFAULT_PROMO_CODES);
    setBanners(DEFAULT_BANNERS);
    setTimeSlots(DEFAULT_TIME_SLOTS);
    setLoyaltyTiers(DEFAULT_LOYALTY_TIERS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        promoCodes,
        addPromoCode,
        updatePromoCode,
        deletePromoCode,
        validatePromoCode,
        banners,
        addBanner,
        updateBanner,
        deleteBanner,
        reorderBanners,
        timeSlots,
        addTimeSlot,
        updateTimeSlot,
        deleteTimeSlot,
        loyaltyTiers,
        updateLoyaltyTier,
        exportSettings,
        importSettings,
        resetToDefaults,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
