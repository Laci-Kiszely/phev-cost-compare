import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Zap, Fuel, Calculator, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FeedbackModal from "./FeedbackModal";

interface CostResults {
  electricityCost: number;
  petrolCost: number;
  petrolEquivalent: number;
  fuelConsumptionEquivalent: number;
}

interface Vehicle {
  id: number;
  car_type: string | null;
  fuel_consumption: number | null;
  electro_consumption: number | null;
  charging_capacity: number | null;
  consumption_version: string | null;
  created_at: string;
}

interface DefaultParameter {
  id: number;
  variable_name: string | null;
  variable_value: number | null;
  created_at: string;
}

type Currency = "EUR" | "HUF";

const CostCalculator = () => {
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [fuelConsumption, setFuelConsumption] = useState<string>("6.1");
  const [electricityConsumption, setElectricityConsumption] = useState<string>("17.27");
  const [chargingCapacity, setChargingCapacity] = useState<string>("3.6");
  const [fuelPrice, setFuelPrice] = useState<string>("1.5789");
  const [electricityPrice, setElectricityPrice] = useState<string>("0.56");
  const [electricityPriceType, setElectricityPriceType] = useState<"kwh" | "minute">("kwh");
  const [results, setResults] = useState<CostResults | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [defaultParams, setDefaultParams] = useState<Record<string, number>>({});

  // Currency formatting
  const formatCurrency = (amount: number) => {
    return currency === "EUR" ? `€${amount.toFixed(2)}` : `${amount.toFixed(2)} Ft`;
  };

  const getCurrencySymbol = () => {
    return currency === "EUR" ? "€" : "Ft";
  };

  // Fetch default parameters from database
  const fetchDefaultParameters = async () => {
    try {
      console.log('Fetching default parameters...');
      const { data, error } = await supabase
        .from('Default_Parameters' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('Default parameters response:', { data, error });
      
      if (error) {
        console.error('Error fetching default parameters:', error);
        return;
      }
      
      if (data) {
        const params: Record<string, number> = {};
        const processedVars = new Set<string>();
        
        // Get the latest value for each variable name
        data.forEach((param: any) => {
          if (param.variable_name && param.variable_value !== null && !processedVars.has(param.variable_name)) {
            params[param.variable_name] = param.variable_value;
            processedVars.add(param.variable_name);
          }
        });
        
        setDefaultParams(params);
      }
    } catch (error) {
      console.error('Error fetching default parameters:', error);
    }
  };

  // Get default value with fallback
  const getDefaultValue = (paramName: string, fallback: number): number => {
    return defaultParams[paramName] ?? fallback;
  };

  // Handle currency change
  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    
    // Set default values based on currency and database values
    if (newCurrency === "HUF") {
      setFuelPrice(getDefaultValue("fuel_price_huf", 590.00).toString());
      setElectricityPrice(electricityPriceType === "kwh" ? 
        getDefaultValue("electricity_price_kwh_huf", 200.00).toString() : 
        getDefaultValue("electricity_price_minute_huf", 5).toString());
    } else {
      setFuelPrice(getDefaultValue("fuel_price_eur", 1.5789).toString());
      setElectricityPrice(electricityPriceType === "kwh" ? 
        getDefaultValue("electricity_price_kwh_eur", 0.56).toString() : 
        getDefaultValue("electricity_price_minute_eur", 0.075).toString());
    }
  };

  const calculateCosts = () => {
    const fuelConsumptionNum = parseFloat(fuelConsumption);
    const electricityConsumptionNum = parseFloat(electricityConsumption);
    const chargingCapacityNum = parseFloat(chargingCapacity);
    const fuelPriceNum = parseFloat(fuelPrice);
    const electricityPriceNum = parseFloat(electricityPrice);

    if (
      !fuelConsumptionNum ||
      !electricityConsumptionNum ||
      !chargingCapacityNum ||
      !fuelPriceNum ||
      !electricityPriceNum ||
      fuelConsumptionNum <= 0 ||
      electricityConsumptionNum <= 0 ||
      chargingCapacityNum <= 0 ||
      fuelPriceNum <= 0 ||
      electricityPriceNum <= 0
    ) {
      setResults(null);
      return;
    }

    // Cost for 100km on petrol
    const petrolCost = fuelConsumptionNum * fuelPriceNum;

    // Cost for 100km on electricity
    let electricityCost: number;
    if (electricityPriceType === "kwh") {
      electricityCost = electricityConsumptionNum * electricityPriceNum;
    } else {
      // If price is per minute, we need to estimate charging time using the charging capacity
      const chargingTimeHours = electricityConsumptionNum / chargingCapacityNum;
      const chargingTimeMinutes = chargingTimeHours * 60;
      electricityCost = chargingTimeMinutes * electricityPriceNum;
    }

    // Petrol equivalent cost
    const petrolEquivalent = electricityCost / fuelConsumptionNum;

    // Fuel consumption equivalent (what L/100km would cost the same as electricity)
    const fuelConsumptionEquivalent = electricityCost / fuelPriceNum;

    setResults({
      electricityCost,
      petrolCost,
      petrolEquivalent,
      fuelConsumptionEquivalent,
    });
  };

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('Vehicle_Database' as any)
        .select('*')
        .order('car_type', { ascending: true });
      
      if (error) {
        console.error('Error fetching vehicles:', error);
        return;
      }
      
      if (data) {
        setVehicles(data as unknown as Vehicle[]);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    
    if (vehicleId && vehicleId !== "manual") {
      const vehicle = vehicles.find(v => v.id.toString() === vehicleId);
      if (vehicle) {
        setFuelConsumption(vehicle.fuel_consumption?.toString() || "");
        setElectricityConsumption(vehicle.electro_consumption?.toString() || "");
        setChargingCapacity(vehicle.charging_capacity?.toString() || "");
      }
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchDefaultParameters();
  }, []);

  // Initialize default values when defaultParams are loaded
  useEffect(() => {
    if (Object.keys(defaultParams).length > 0) {
      handleCurrencyChange(currency);
    }
  }, [defaultParams]);

  useEffect(() => {
    calculateCosts();
  }, [fuelConsumption, electricityConsumption, chargingCapacity, fuelPrice, electricityPrice, electricityPriceType]);

  return (
    <div className="min-h-screen bg-[var(--gradient-app)] p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 pt-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calculator className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">EV Cost Calculator</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Compare the cost of driving on electricity vs petrol
          </p>
        </div>

        {/* Pricing Form */}
        <Card className="shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-electric" />
                Current Prices
              </div>
              <div className="flex gap-1">
                <Button
                  variant={currency === "EUR" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCurrencyChange("EUR")}
                  className="text-xs px-2 py-1 h-7"
                >
                  EUR
                </Button>
                <Button
                  variant={currency === "HUF" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCurrencyChange("HUF")}
                  className="text-xs px-2 py-1 h-7"
                >
                  Ft
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fuel-price">Fuel price ({getCurrencySymbol()}/liter)</Label>
              <Input
                id="fuel-price"
                type="number"
                placeholder="1.45"
                value={fuelPrice}
                onChange={(e) => setFuelPrice(e.target.value)}
                className="text-lg h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="electricity-price-type">Electricity pricing</Label>
               <Select value={electricityPriceType} onValueChange={(value: "kwh" | "minute") => {
                 setElectricityPriceType(value);
                 // Set appropriate default when switching pricing types based on currency and database values
                 if (currency === "EUR") {
                   setElectricityPrice(value === "kwh" ? 
                     getDefaultValue("electricity_price_kwh_eur", 0.56).toString() : 
                     getDefaultValue("electricity_price_minute_eur", 0.075).toString());
                 } else {
                   setElectricityPrice(value === "kwh" ? 
                     getDefaultValue("electricity_price_kwh_huf", 200.00).toString() : 
                     getDefaultValue("electricity_price_minute_huf", 5).toString());
                 }
               }}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kwh">Per kWh</SelectItem>
                  <SelectItem value="minute">Per minute charging</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="electricity-price">
                Electricity price ({getCurrencySymbol()}/{electricityPriceType === "kwh" ? "kWh" : "minute"})
              </Label>
              <Input
                id="electricity-price"
                type="number"
                placeholder={electricityPriceType === "kwh" ? "0.25" : "0.35"}
                value={electricityPrice}
                onChange={(e) => setElectricityPrice(e.target.value)}
                className="text-lg h-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Input Form */}
        <Card className="shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5 text-fuel" />
              Vehicle Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-select">Select Vehicle (Optional)</Label>
              <Select value={selectedVehicle} onValueChange={handleVehicleSelect}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose a vehicle to auto-fill data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual input</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.car_type || 'Unknown Vehicle'} {vehicle.consumption_version && `(${vehicle.consumption_version})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuel-consumption">Fuel consumption (L/100km)</Label>
              <Input
                id="fuel-consumption"
                type="number"
                placeholder="6.5"
                value={fuelConsumption}
                onChange={(e) => setFuelConsumption(e.target.value)}
                className="text-lg h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="electricity-consumption">Electricity consumption (kWh/100km)</Label>
              <Input
                id="electricity-consumption"
                type="number"
                placeholder="18.5"
                value={electricityConsumption}
                onChange={(e) => setElectricityConsumption(e.target.value)}
                className="text-lg h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="charging-capacity">Charging capacity (kW)</Label>
              <Input
                id="charging-capacity"
                type="number"
                placeholder="3.6"
                value={chargingCapacity}
                onChange={(e) => setChargingCapacity(e.target.value)}
                className="text-lg h-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <Card className="bg-electric-light border-electric shadow-[var(--shadow-electric)]">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-electric" />
                  <h3 className="font-semibold text-electric">100km on Electricity</h3>
                </div>
                <p className="text-3xl font-bold text-electric">{formatCurrency(results.electricityCost)}</p>
              </CardContent>
            </Card>

            <Card className="bg-fuel-light border-fuel shadow-[var(--shadow-fuel)]">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Fuel className="h-5 w-5 text-fuel" />
                  <h3 className="font-semibold text-fuel">100km on Petrol</h3>
                </div>
                <p className="text-3xl font-bold text-fuel">{formatCurrency(results.petrolCost)}</p>
              </CardContent>
            </Card>

            <Card className="bg-muted">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-muted-foreground mb-2">Petrol Equivalent</h3>
                <p className="text-lg text-muted-foreground">
                  Electricity costs the same as petrol at
                </p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(results.petrolEquivalent)}/liter</p>
              </CardContent>
            </Card>

            <Card className="bg-muted">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-muted-foreground mb-2">Fuel Consumption Equivalent</h3>
                <p className="text-lg text-muted-foreground">
                  Electricity cost is equivalent to
                </p>
                <p className="text-2xl font-bold text-foreground">{results.fuelConsumptionEquivalent.toFixed(1)} L/100km</p>
              </CardContent>
            </Card>

            {/* Savings Indicator */}
            {results.electricityCost < results.petrolCost ? (
              <Card className="bg-electric-light border-electric">
                <CardContent className="p-4 text-center">
                  <p className="text-electric font-semibold">
                    You save {formatCurrency(results.petrolCost - results.electricityCost)} per 100km with electricity!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-fuel-light border-fuel">
                <CardContent className="p-4 text-center">
                  <p className="text-fuel font-semibold">
                    Petrol is {formatCurrency(results.electricityCost - results.petrolCost)} cheaper per 100km
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Buy me a coffee button */}
        <div className="flex justify-center pt-6">
          <button
            onClick={() => window.open('https://buy.stripe.com/00gbKXgBCgOPbYc146', '_blank')}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            ☕ Buy me a coffee
          </button>
        </div>

        {/* Feedback Button */}
        <div className="flex justify-center pt-4 pb-4">
          <FeedbackModal />
        </div>
      </div>
    </div>
  );
};

export default CostCalculator;