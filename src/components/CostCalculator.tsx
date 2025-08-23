import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Fuel, Calculator } from "lucide-react";

interface CostResults {
  electricityCost: number;
  petrolCost: number;
  petrolEquivalent: number;
  fuelConsumptionEquivalent: number;
}

const CostCalculator = () => {
  const [fuelConsumption, setFuelConsumption] = useState<string>("6.1");
  const [electricityConsumption, setElectricityConsumption] = useState<string>("17.27");
  const [fuelPrice, setFuelPrice] = useState<string>("1.57");
  const [electricityPrice, setElectricityPrice] = useState<string>("0.56");
  const [electricityPriceType, setElectricityPriceType] = useState<"kwh" | "minute">("kwh");
  const [results, setResults] = useState<CostResults | null>(null);

  const calculateCosts = () => {
    const fuelConsumptionNum = parseFloat(fuelConsumption);
    const electricityConsumptionNum = parseFloat(electricityConsumption);
    const fuelPriceNum = parseFloat(fuelPrice);
    const electricityPriceNum = parseFloat(electricityPrice);

    if (
      !fuelConsumptionNum ||
      !electricityConsumptionNum ||
      !fuelPriceNum ||
      !electricityPriceNum ||
      fuelConsumptionNum <= 0 ||
      electricityConsumptionNum <= 0 ||
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
      // If price is per minute, we need to estimate charging time
      // Assuming typical charging speed of 7kW for home charging
      const chargingTimeHours = electricityConsumptionNum / 7;
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

  useEffect(() => {
    calculateCosts();
  }, [fuelConsumption, electricityConsumption, fuelPrice, electricityPrice, electricityPriceType]);

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

        {/* Input Form */}
        <Card className="shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Fuel className="h-5 w-5 text-fuel" />
              Vehicle Consumption
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Pricing Form */}
        <Card className="shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-electric" />
              Current Prices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fuel-price">Fuel price (€/liter)</Label>
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
              <Select value={electricityPriceType} onValueChange={(value: "kwh" | "minute") => setElectricityPriceType(value)}>
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
                Electricity price (€/{electricityPriceType === "kwh" ? "kWh" : "minute"})
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

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <Card className="bg-electric-light border-electric shadow-[var(--shadow-electric)]">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-electric" />
                  <h3 className="font-semibold text-electric">100km on Electricity</h3>
                </div>
                <p className="text-3xl font-bold text-electric">€{results.electricityCost.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="bg-fuel-light border-fuel shadow-[var(--shadow-fuel)]">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Fuel className="h-5 w-5 text-fuel" />
                  <h3 className="font-semibold text-fuel">100km on Petrol</h3>
                </div>
                <p className="text-3xl font-bold text-fuel">€{results.petrolCost.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="bg-muted">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold text-muted-foreground mb-2">Petrol Equivalent</h3>
                <p className="text-lg text-muted-foreground">
                  Electricity costs the same as petrol at
                </p>
                <p className="text-2xl font-bold text-foreground">€{results.petrolEquivalent.toFixed(2)}/liter</p>
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
                    You save €{(results.petrolCost - results.electricityCost).toFixed(2)} per 100km with electricity!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-fuel-light border-fuel">
                <CardContent className="p-4 text-center">
                  <p className="text-fuel font-semibold">
                    Petrol is €{(results.electricityCost - results.petrolCost).toFixed(2)} cheaper per 100km
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CostCalculator;