import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useCars, Car } from "@/hooks/useCars";

interface EditCarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: Car | null;
}

export const EditCarDialog = ({ open, onOpenChange, car }: EditCarDialogProps) => {
  const { updateCar, isUpdating } = useCars();
  const [carNumber, setCarNumber] = useState("");
  const [model, setModel] = useState("");
  const [inspectionDate, setInspectionDate] = useState<Date>();
  const [taxMonth, setTaxMonth] = useState("");
  const [taxPrice, setTaxPrice] = useState("");
  const [insurancePrice, setInsurancePrice] = useState("");
  const [insuranceDate, setInsuranceDate] = useState<Date>();

  useEffect(() => {
    if (car) {
      setCarNumber(car.car_number);
      setModel(car.model);
      setInspectionDate(car.inspection_date ? parseISO(car.inspection_date) : undefined);
      setTaxMonth(car.tax_month || "");
      setTaxPrice(car.tax_price?.toString() || "");
      setInsurancePrice(car.insurance_price?.toString() || "");
      setInsuranceDate(car.insurance_date ? parseISO(car.insurance_date) : undefined);
    }
  }, [car]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!car) return;
    
    updateCar({
      id: car.id,
      car_number: carNumber,
      model,
      inspection_date: inspectionDate ? format(inspectionDate, 'yyyy-MM-dd') : null,
      tax_month: taxMonth || null,
      tax_price: parseFloat(taxPrice) || 0,
      insurance_price: parseFloat(insurancePrice) || 0,
      insurance_date: insuranceDate ? format(insuranceDate, 'yyyy-MM-dd') : null,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Redigera bil</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="carNumber">Regnummer</Label>
            <Input
              id="carNumber"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value)}
              placeholder="ABC123"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modell</Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Volvo V70"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Besiktningsdatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !inspectionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {inspectionDate ? format(inspectionDate, "PPP", { locale: sv }) : "Välj datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={inspectionDate}
                  onSelect={setInspectionDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxMonth">Skattmånaden</Label>
            <Input
              id="taxMonth"
              value={taxMonth}
              onChange={(e) => setTaxMonth(e.target.value)}
              placeholder="Januari"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxPrice">Skatt (kr)</Label>
            <Input
              id="taxPrice"
              type="number"
              step="0.01"
              value={taxPrice}
              onChange={(e) => setTaxPrice(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insurancePrice">Försäkring (kr)</Label>
            <Input
              id="insurancePrice"
              type="number"
              step="0.01"
              value={insurancePrice}
              onChange={(e) => setInsurancePrice(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Försäkringsdatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !insuranceDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {insuranceDate ? format(insuranceDate, "PPP", { locale: sv }) : "Välj datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={insuranceDate}
                  onSelect={setInsuranceDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Uppdaterar..." : "Uppdatera"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
