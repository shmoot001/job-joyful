import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { useCars, Car } from "@/hooks/useCars";
import { AddCarDialog } from "@/components/cars/AddCarDialog";
import { EditCarDialog } from "@/components/cars/EditCarDialog";
import { DeleteCarDialog } from "@/components/cars/DeleteCarDialog";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

const Cars = () => {
  const { cars, isLoading } = useCars();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  const handleEdit = (car: Car) => {
    setSelectedCar(car);
    setEditDialogOpen(true);
  };

  const handleDelete = (car: Car) => {
    setSelectedCar(car);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(parseISO(dateString), "d MMMM yyyy", { locale: sv });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mina bilar</h1>
          <p className="text-muted-foreground">Hantera information om dina fordon</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Lägg till bil
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Laddar bilar...</div>
      ) : cars.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Inga bilar registrerade än</p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Lägg till din första bil
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <Card key={car.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{car.car_number}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(car)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(car)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{car.model}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Besiktningsdatum</p>
                  <p className="text-sm text-muted-foreground">{formatDate(car.inspection_date)}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Skattmånaden</p>
                  <p className="text-sm text-muted-foreground">{car.tax_month || "-"}</p>
                </div>
                
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium">Skatt</p>
                    <p className="text-sm text-muted-foreground">{car.tax_price} kr</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Försäkring</p>
                    <p className="text-sm text-muted-foreground">{car.insurance_price} kr</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Försäkringsdatum</p>
                  <p className="text-sm text-muted-foreground">{formatDate(car.insurance_date)}</p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <a
                    href={`https://biluppgifter.se/fordon/${car.car_number}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Se biluppgifter
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddCarDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      <EditCarDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} car={selectedCar} />
      <DeleteCarDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} car={selectedCar} />
    </div>
  );
};

export default Cars;
