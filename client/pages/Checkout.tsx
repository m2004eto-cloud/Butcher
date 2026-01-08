import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useBasket } from "@/context/BasketContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { PriceDisplay } from "@/components/CurrencySymbol";
import { ordersApi, deliveryApi } from "@/lib/api";
import type { Address } from "@shared/api";

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google?: typeof google;
  }
}

// Google Maps API Key - replace with your actual key
const GOOGLE_MAPS_API_KEY = "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8";

type PaymentMethod = "card" | "cod" | null;

interface AddressFormData {
  label: string;
  fullName: string;
  mobile: string;
  emirate: string;
  area: string;
  street: string;
  building: string;
  floor: string;
  apartment: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

const EMPTY_ADDRESS_FORM: AddressFormData = {
  label: "Home",
  fullName: "",
  mobile: "",
  emirate: "",
  area: "",
  street: "",
  building: "",
  floor: "",
  apartment: "",
  isDefault: false,
  latitude: undefined,
  longitude: undefined,
};

// UAE center coordinates
const UAE_CENTER = { lat: 25.2048, lng: 55.2708 }; // Dubai

// Load Google Maps Script
function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }
    
    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsLoaded(true));
      return;
    }
    
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
  }, []);
  
  return isLoaded;
}

// Map Picker Component
function MapPicker({ 
  latitude, 
  longitude, 
  onLocationSelect 
}: { 
  latitude?: number; 
  longitude?: number; 
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const isLoaded = useGoogleMaps();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const updateMarker = useCallback((lat: number, lng: number) => {
    if (!googleMapRef.current) return;
    
    const position = { lat, lng };
    
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else {
      markerRef.current = new google.maps.Marker({
        position,
        map: googleMapRef.current,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });
      
      // Handle marker drag
      markerRef.current.addListener("dragend", () => {
        const pos = markerRef.current?.getPosition();
        if (pos) {
          onLocationSelect(pos.lat(), pos.lng());
          // Reverse geocode to get address
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: pos }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              onLocationSelect(pos.lat(), pos.lng(), results[0].formatted_address);
            }
          });
        }
      });
    }
    
    googleMapRef.current.panTo(position);
  }, [onLocationSelect]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    
    const initialPosition = latitude && longitude 
      ? { lat: latitude, lng: longitude }
      : UAE_CENTER;
    
    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center: initialPosition,
      zoom: latitude && longitude ? 16 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    
    // Add click listener
    googleMapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        updateMarker(e.latLng.lat(), e.latLng.lng());
        onLocationSelect(e.latLng.lat(), e.latLng.lng());
        
        // Reverse geocode
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: e.latLng }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            onLocationSelect(e.latLng!.lat(), e.latLng!.lng(), results[0].formatted_address);
          }
        });
      }
    });
    
    // Add initial marker if coordinates exist
    if (latitude && longitude) {
      updateMarker(latitude, longitude);
    }
  }, [isLoaded, latitude, longitude, onLocationSelect, updateMarker]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !googleMapRef.current) return;
    
    setIsSearching(true);
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: searchQuery + ", UAE" }, (results, status) => {
      setIsSearching(false);
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const location = results[0].geometry.location;
        updateMarker(location.lat(), location.lng());
        googleMapRef.current?.setZoom(16);
        onLocationSelect(location.lat(), location.lng(), results[0].formatted_address);
      }
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        updateMarker(lat, lng);
        googleMapRef.current?.setZoom(16);
        
        // Reverse geocode
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            onLocationSelect(lat, lng, results[0].formatted_address);
          } else {
            onLocationSelect(lat, lng);
          }
        });
      },
      () => {
        alert("Unable to retrieve your location");
      }
    );
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Box */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search for a location..."
          className="flex-1 px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background text-foreground text-sm"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isSearching ? "..." : "Search"}
        </button>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/90"
          title="Use current location"
        >
          📍
        </button>
      </div>
      
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-64 rounded-lg border border-input overflow-hidden"
      />
      
      <p className="text-xs text-muted-foreground text-center">
        Click on the map or drag the marker to set your exact delivery location
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, vat, total, clearBasket } = useBasket();
  const { user } = useAuth();
  const { language } = useLanguage();
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  
  // Modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>(EMPTY_ADDRESS_FORM);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Helper function to get localized item name
  const getItemName = (item: typeof items[0]) => {
    return language === "ar" && item.nameAr ? item.nameAr : item.name;
  };

  // Fetch user addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user?.id) {
        setIsLoadingAddresses(false);
        return;
      }

      try {
        const response = await deliveryApi.getAddresses(user.id);
        if (response.success && response.data) {
          setAddresses(response.data);
          // Select default address or first address
          const defaultAddress = response.data.find(a => a.isDefault) || response.data[0];
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch addresses:", err);
      }
      setIsLoadingAddresses(false);
    };

    fetchAddresses();
  }, [user?.id]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Your basket is empty
            </h1>
            <button
              onClick={() => navigate("/products")}
              className="btn-primary mt-4"
            >
              Back to Products
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  const handleCardPayment = () => {
    if (!selectedAddressId) {
      setError("Please select or add a delivery address");
      return;
    }
    setIsProcessing(true);
    navigate("/payment/card", { state: { addressId: selectedAddressId } });
  };

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setAddressForm({
      ...EMPTY_ADDRESS_FORM,
      fullName: `${user?.firstName || ""} ${user?.familyName || ""}`.trim(),
      mobile: user?.mobile || "",
      emirate: user?.emirate || "",
    });
    setShowAddressModal(true);
  };

  const handleOpenEditModal = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label,
      fullName: address.fullName,
      mobile: address.mobile,
      emirate: address.emirate,
      area: address.area,
      street: address.street,
      building: address.building,
      floor: address.floor || "",
      apartment: address.apartment || "",
      isDefault: address.isDefault,
      latitude: address.latitude,
      longitude: address.longitude,
    });
    setShowAddressModal(true);
  };

  const handleCloseModal = () => {
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddressForm(EMPTY_ADDRESS_FORM);
  };

  const handleLocationSelect = (lat: number, lng: number, formattedAddress?: string) => {
    setAddressForm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    
    // Optionally auto-fill address fields from geocoded address
    if (formattedAddress) {
      // You could parse the address here to auto-fill fields
      console.log("Selected location:", formattedAddress);
    }
  };

  const handleSaveAddress = async () => {
    if (!user?.id) return;
    
    // Validation
    if (!addressForm.fullName || !addressForm.mobile || !addressForm.emirate || 
        !addressForm.area || !addressForm.street || !addressForm.building) {
      setError("Please fill in all required fields");
      return;
    }
    
    // Validate location
    if (!addressForm.latitude || !addressForm.longitude) {
      setError("Please select your location on the map");
      return;
    }

    setIsSavingAddress(true);
    setError(null);

    try {
      if (editingAddress) {
        // Update existing address
        const response = await deliveryApi.updateAddress(editingAddress.id, {
          label: addressForm.label,
          fullName: addressForm.fullName,
          mobile: addressForm.mobile,
          emirate: addressForm.emirate,
          area: addressForm.area,
          street: addressForm.street,
          building: addressForm.building,
          floor: addressForm.floor || undefined,
          apartment: addressForm.apartment || undefined,
          isDefault: addressForm.isDefault,
          latitude: addressForm.latitude,
          longitude: addressForm.longitude,
        });

        if (response.success && response.data) {
          // Update local state
          setAddresses(prev => prev.map(a => a.id === editingAddress.id ? response.data! : a));
          handleCloseModal();
        } else {
          setError(response.error || "Failed to update address");
        }
      } else {
        // Create new address
        const response = await deliveryApi.createAddress(user.id, {
          label: addressForm.label,
          fullName: addressForm.fullName,
          mobile: addressForm.mobile,
          emirate: addressForm.emirate,
          area: addressForm.area,
          street: addressForm.street,
          building: addressForm.building,
          floor: addressForm.floor || undefined,
          apartment: addressForm.apartment || undefined,
          isDefault: addressForm.isDefault || addresses.length === 0,
          latitude: addressForm.latitude,
          longitude: addressForm.longitude,
        });

        if (response.success && response.data) {
          // Add to local state and select it
          setAddresses(prev => [...prev, response.data!]);
          setSelectedAddressId(response.data.id);
          handleCloseModal();
        } else {
          setError(response.error || "Failed to create address");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }

    setIsSavingAddress(false);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await deliveryApi.deleteAddress(addressId);
      if (response.success) {
        setAddresses(prev => prev.filter(a => a.id !== addressId));
        if (selectedAddressId === addressId) {
          const remaining = addresses.filter(a => a.id !== addressId);
          setSelectedAddressId(remaining[0]?.id || null);
        }
      } else {
        setError(response.error || "Failed to delete address");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleCODPayment = async () => {
    if (!selectedAddressId) {
      setError("Please select or add a delivery address");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create order in backend
      const response = await ordersApi.create({
        userId: user?.id || "",
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        addressId: selectedAddressId,
        paymentMethod: "cod",
        deliveryNotes: "",
      });

      if (response.success && response.data) {
        // Clear basket after successful order
        clearBasket();
        alert(
          `Order ${response.data.orderNumber} placed successfully! Our team will contact you within 2 hours to confirm delivery.`
        );
        navigate("/products");
      } else {
        setError(response.error || "Failed to create order. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-muted text-foreground font-bold flex items-center justify-center mb-2">
                  ✓
                </div>
                <p className="text-xs text-muted-foreground">Basket</p>
              </div>
              <div className="w-12 h-1 bg-muted" />
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mb-2">
                  2
                </div>
                <p className="text-xs text-foreground font-semibold">Checkout</p>
              </div>
              <div className="w-12 h-1 bg-muted" />
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground font-bold flex items-center justify-center mb-2">
                  3
                </div>
                <p className="text-xs text-muted-foreground">Confirmation</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Error Display */}
              {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Delivery Address Section */}
              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    Delivery Address
                  </h2>
                  <button
                    onClick={handleOpenAddModal}
                    className="text-primary hover:text-primary/80 text-sm font-semibold flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Address
                  </button>
                </div>

                {isLoadingAddresses ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading addresses...</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <div className="text-4xl mb-2">📍</div>
                    <p className="text-muted-foreground mb-4">No saved addresses</p>
                    <button
                      onClick={handleOpenAddModal}
                      className="btn-primary px-6 py-2"
                    >
                      Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedAddressId === address.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                              selectedAddressId === address.id
                                ? "border-primary bg-primary"
                                : "border-border"
                            }`}
                          >
                            {selectedAddressId === address.id && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-foreground">{address.label}</span>
                              {address.isDefault && (
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground">{address.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              {address.building}, {address.street}
                              {address.floor && `, Floor ${address.floor}`}
                              {address.apartment && `, Apt ${address.apartment}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.area}, {address.emirate}
                            </p>
                            <p className="text-sm text-muted-foreground">{address.mobile}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(address);
                              }}
                              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {addresses.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAddress(address.id);
                                }}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="card-premium p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Payment Method
                </h2>

                <div className="space-y-4">
                  {/* Credit Card Option */}
                  <div
                    onClick={() => handlePaymentMethodSelect("card")}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                          paymentMethod === "card"
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      >
                        {paymentMethod === "card" && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          Credit Card
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pay securely with Visa, Mastercard, or American Express
                        </p>
                      </div>
                      <div className="text-2xl">💳</div>
                    </div>
                  </div>

                  {/* Cash on Delivery Option */}
                  <div
                    onClick={() => handlePaymentMethodSelect("cod")}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "cod"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                          paymentMethod === "cod"
                            ? "border-primary bg-primary"
                            : "border-border"
                        }`}
                      >
                        {paymentMethod === "cod" && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          Cash on Delivery
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Pay with cash when your order arrives
                        </p>
                      </div>
                      <div className="text-2xl">💵</div>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                {paymentMethod && (
                  <button
                    onClick={
                      paymentMethod === "card"
                        ? handleCardPayment
                        : handleCODPayment
                    }
                    disabled={isProcessing || !selectedAddressId}
                    className="w-full btn-primary py-3 rounded-lg font-semibold text-base mt-6 disabled:opacity-50 transition-all"
                  >
                    {isProcessing
                      ? "Processing..."
                      : !selectedAddressId
                      ? "Select a Delivery Address"
                      : paymentMethod === "card"
                      ? "Continue to Payment"
                      : "Confirm Order"}
                  </button>
                )}
              </div>

              {/* Order Info */}
              <div className="card-premium p-6 bg-secondary/10">
                <p className="text-sm text-muted-foreground">
                  ℹ️ Your order will be processed securely. No card details are
                  stored on our servers.
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card-premium p-6 sticky top-24 space-y-4">
                <h2 className="text-xl font-bold text-foreground">
                  Order Summary
                </h2>

                {/* Selected Address Preview */}
                {selectedAddress && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-foreground mb-1">Delivering to:</p>
                    <p className="text-muted-foreground">{selectedAddress.fullName}</p>
                    <p className="text-muted-foreground">{selectedAddress.area}, {selectedAddress.emirate}</p>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2 max-h-64 overflow-y-auto border-b border-border pb-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-muted-foreground">
                        {getItemName(item)} x {item.quantity.toFixed(3)} {language === "ar" ? "جرام" : "gr"}
                      </span>
                      <span className="font-semibold">
                        <PriceDisplay price={item.price * item.quantity} size="sm" />
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold"><PriceDisplay price={subtotal} size="md" /></span>
                  </div>
                  <div className="flex justify-between items-center bg-secondary/10 -mx-6 px-6 py-2">
                    <span className="text-muted-foreground">VAT (5%)</span>
                    <span className="font-semibold text-secondary">
                      <PriceDisplay price={vat} size="md" />
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-lg font-bold text-foreground">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      <PriceDisplay price={total} size="lg" />
                    </span>
                  </div>
                </div>

                {/* Back to Basket */}
                <button
                  onClick={() => navigate("/basket")}
                  className="btn-outline w-full py-2 text-sm rounded-lg"
                >
                  Back to Basket
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Add/Edit Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Address Label */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Address Label *
                </label>
                <div className="flex gap-2">
                  {["Home", "Office", "Other"].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, label })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        addressForm.label === label
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name & Mobile */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background text-foreground"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={addressForm.mobile}
                    onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background text-foreground"
                    placeholder="+971 50 123 4567"
                  />
                </div>
              </div>

              {/* Emirate & Area */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Emirate *
                  </label>
                  <select
                    value={addressForm.emirate}
                    onChange={(e) => setAddressForm({ ...addressForm, emirate: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background text-foreground"
                  >
                    <option value="">Select Emirate</option>
                    <option value="Dubai">Dubai</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                    <option value="Fujairah">Fujairah</option>
                    <option value="Umm Al Quwain">Umm Al Quwain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Area *
                  </label>
                  <input
                    type="text"
                    value={addressForm.area}
                    onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background text-foreground"
                    placeholder="Downtown Dubai"
                  />
                </div>
              </div>

              {/* Street */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Street *
                </label>
                <input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background text-foreground"
                  placeholder="Sheikh Mohammed bin Rashid Boulevard"
                />
              </div>

              {/* Building, Floor, Apartment */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Building *
                  </label>
                  <input
                    type="text"
                    value={addressForm.building}
                    onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background text-foreground"
                    placeholder="Tower A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Floor
                  </label>
                  <input
                    type="text"
                    value={addressForm.floor}
                    onChange={(e) => setAddressForm({ ...addressForm, floor: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background text-foreground"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Apartment
                  </label>
                  <input
                    type="text"
                    value={addressForm.apartment}
                    onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background text-foreground"
                    placeholder="1501"
                  />
                </div>
              </div>

              {/* Set as Default */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-5 h-5 text-primary border-input rounded focus:ring-primary"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-foreground">
                  Set as default delivery address
                </label>
              </div>

              {/* Map Location Picker */}
              <div className="pt-4 border-t border-border">
                <label className="block text-sm font-medium text-foreground mb-3">
                  📍 Pin Your Delivery Location *
                </label>
                <MapPicker
                  latitude={addressForm.latitude}
                  longitude={addressForm.longitude}
                  onLocationSelect={handleLocationSelect}
                />
                {addressForm.latitude && addressForm.longitude && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium">Location confirmed</span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      Lat: {addressForm.latitude.toFixed(6)}, Lng: {addressForm.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAddress}
                  disabled={isSavingAddress}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSavingAddress ? "Saving..." : editingAddress ? "Update Address" : "Save Address"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
